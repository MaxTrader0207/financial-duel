// Anonymous daily statistics for the game.
// The game keeps a random id (no account, no IP, no personal data) and, per Taiwan calendar day, counts a few events;
// POST /v1/ping sends the counts not yet sent. GET /v1/stats?key=… shows the last 30 days (STATS_KEY secret).

import { hasQuestion } from './judge.js';
import { questionInfo } from './pool.js';

export const EVENTS = ['open', 'duels', 'wins', 'casual', 'ranked', 'tutorial', 'daily', 'challenge'];
export const EVENT_NAME = { open: '開啟次數', duels: '對戰', wins: '勝場', casual: '休閒', ranked: '排位', tutorial: '新手場', daily: '每日挑戰', challenge: '好友挑戰' };
const MAX_PER_PING = 200;                     // a day's count from one player in one ping
const KEEP_BACK_DAYS = 14;                    // counts for older days (a long time offline) are dropped

const pad = n => String(n).padStart(2, '0');
export function dayOf(ms) { const d = new Date(ms + 8 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
const addDays = (day, n) => { const [y, m, d] = day.split('-').map(Number); return dayOf(Date.UTC(y, m - 1, d, 4) + n * 864e5); };

/* validate a ping body: { pid, days: { 'YYYY-MM-DD': { open: 1, duels: 3, … } } } → rows or an error text */
export function cleanPing(b, now) {
  if (!b || typeof b.pid !== 'string' || !/^[0-9a-f]{32}$/.test(b.pid)) return { error: '缺少匿名編號' };
  if (!b.days || typeof b.days !== 'object') return { error: '缺少統計資料' };
  const today = dayOf(now), oldest = addDays(today, -KEEP_BACK_DAYS), rows = [];
  for (const [day, counts] of Object.entries(b.days).slice(0, KEEP_BACK_DAYS + 1)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today || day < oldest || !counts || typeof counts !== 'object') continue;
    const c = {};
    for (const k of EVENTS) { const v = counts[k]; if (Number.isInteger(v) && v > 0) c[k] = Math.min(v, MAX_PER_PING); }
    rows.push({ day, counts: c });
  }
  /* question counts: { qid: [answers, right, p0, p1, p2, p3, timeouts] }, built-in questions only */
  const qs = [];
  if (b.q && typeof b.q === 'object') for (const [qid, v] of Object.entries(b.q).slice(0, 200)) {
    if (!hasQuestion(qid) || !Array.isArray(v) || v.length !== 7 || !v.every(x => Number.isInteger(x) && x >= 0 && x <= 500)) continue;
    if (v[1] > v[0] || v[2] + v[3] + v[4] + v[5] + v[6] > v[0] || !v[0]) continue;
    qs.push([qid, ...v]);
  }
  return { pid: b.pid, rows, qs };
}

export async function ping(env, clean) {
  const stmts = [];
  for (const { day, counts } of clean.rows) {
    stmts.push(env.DB.prepare('INSERT OR IGNORE INTO daily_players (day, pid) VALUES (?, ?)').bind(day, clean.pid));
    for (const [k, n] of Object.entries(counts))
      stmts.push(env.DB.prepare('INSERT INTO daily_counts (day, k, n) VALUES (?, ?, ?) ON CONFLICT (day, k) DO UPDATE SET n = n + excluded.n').bind(day, k, n));
  }
  for (const [qid, n, c, p0, p1, p2, p3, to] of clean.qs || [])
    stmts.push(env.DB.prepare(`INSERT INTO question_stats (qid, n, c, p0, p1, p2, p3, timeouts, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (qid) DO UPDATE SET n = n + excluded.n, c = c + excluded.c, p0 = p0 + excluded.p0, p1 = p1 + excluded.p1, p2 = p2 + excluded.p2, p3 = p3 + excluded.p3,
      timeouts = timeouts + excluded.timeouts, updated = excluded.updated`).bind(qid, n, c, p0, p1, p2, p3, to, Date.now()));
  if (stmts.length) await env.DB.batch(stmts);
  return clean.rows.length;
}

/* the last `days` days, newest first */
export async function report(env, now, days = 30) {
  const today = dayOf(now), from = addDays(today, -(days - 1));
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a).all().then(r => r.results || []);
  const [players, counts, fresh, total, board, ranked] = await Promise.all([
    q('SELECT day, COUNT(*) AS n FROM daily_players WHERE day >= ? GROUP BY day', from),
    q('SELECT day, k, n FROM daily_counts WHERE day >= ?', from),
    q('SELECT first AS day, COUNT(*) AS n FROM (SELECT pid, MIN(day) AS first FROM daily_players GROUP BY pid) WHERE first >= ? GROUP BY first', from),
    q('SELECT COUNT(DISTINCT pid) AS n FROM daily_players'),
    q('SELECT COUNT(*) AS n FROM players'),
    q("SELECT COUNT(*) AS n FROM matches WHERE ended IS NOT NULL"),
  ]);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(today, -i), r = { day, players: 0, newPlayers: 0, d1: 0, d7: 0 };
    for (const k of EVENTS) r[k] = 0;
    rows.push(r);
  }
  const at = Object.fromEntries(rows.map(r => [r.day, r]));
  for (const p of players) if (at[p.day]) at[p.day].players = p.n;
  for (const f of fresh) if (at[f.day]) at[f.day].newPlayers = f.n;
  for (const c of counts) if (at[c.day] && EVENTS.includes(c.k)) at[c.day][c.k] = c.n;
  /* retention: of the devices first seen on a day, how many came back the next day / within days 1–7 */
  const ret = await q(`SELECT f.first AS day, COUNT(*) AS n,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM daily_players p WHERE p.pid = f.pid AND p.day = date(f.first, '+1 day')) THEN 1 ELSE 0 END) AS d1,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM daily_players p WHERE p.pid = f.pid AND p.day > f.first AND p.day <= date(f.first, '+7 day')) THEN 1 ELSE 0 END) AS d7
    FROM (SELECT pid, MIN(day) AS first FROM daily_players GROUP BY pid) f WHERE f.first >= ? GROUP BY f.first`, from);
  for (const x of ret) if (at[x.day]) Object.assign(at[x.day], { d1: x.d1, d7: x.d7 });
  for (const r of rows) {
    r.d1Rate = r.newPlayers && r.day < today ? r.d1 / r.newPlayers : null;          // a day's cohort is only known the day after
    r.d7Rate = r.newPlayers && addDays(r.day, 7) < today ? r.d7 / r.newPlayers : null;
  }
  const rate = (list, k) => { const c = list.filter(r => r[k + 'Rate'] !== null); const base = c.reduce((s, r) => s + r.newPlayers, 0); return base ? c.reduce((s, r) => s + r[k], 0) / base : null; };
  const week = rows.slice(0, 7);
  const fresh7 = rows.slice(1, 8), fresh14 = rows.slice(8, 22);
  const newWeek = week.reduce((s, r) => s + r.newPlayers, 0);
  const weekPlayers = (await q('SELECT COUNT(DISTINCT pid) AS n FROM daily_players WHERE day >= ?', addDays(today, -6)))[0]?.n || 0;
  /* 題目品質: questions with enough answers — the hardest, the easiest, and possibly disputed ones
     (a wrong option picked more often than the right one usually means a confusing question or a wrong answer key) */
  const QMIN = 20;
  const qrows = (await q('SELECT qid, n, c, p0, p1, p2, p3, timeouts FROM question_stats WHERE n >= ?', QMIN)).map(r => {
    const bank = questionInfo(r.qid); if (!bank) return null;
    if (bank.src === 'tpl') return { qid: r.qid, q: bank.q, category: bank.category, difficulty: bank.difficulty, n: r.n, rate: r.c / r.n, timeouts: r.timeouts,
      answer: '（計算題，每次數字不同）', topWrong: null, disputed: false };
    const picks = [r.p0, r.p1, r.p2, r.p3], wrong = picks.map((v, i) => [v, i]).filter(([, i]) => i !== bank.answer).sort((a, b) => b[0] - a[0])[0];
    return { qid: r.qid, q: bank.q, category: bank.category, difficulty: bank.difficulty, n: r.n, rate: r.c / r.n, timeouts: r.timeouts,
      answer: bank.options[bank.answer], topWrong: wrong ? { text: bank.options[wrong[1]], n: wrong[0] } : null, disputed: !!wrong && wrong[0] > picks[bank.answer] };
  }).filter(Boolean);
  const tracked = (await q('SELECT COUNT(*) AS n FROM question_stats'))[0]?.n || 0;
  const quality = {
    min: QMIN, tracked, enough: qrows.length,
    hardest: qrows.slice().sort((a, b) => a.rate - b.rate).slice(0, 10),
    easiest: qrows.filter(r => r.rate >= 0.97).sort((a, b) => b.rate - a.rate || b.n - a.n).slice(0, 10),
    disputed: qrows.filter(r => r.disputed).sort((a, b) => a.rate - b.rate).slice(0, 10),
  };
  return {
    today, rows, quality,
    summary: { allPlayers: total[0]?.n || 0, weekPlayers, weekDuels: week.reduce((s, r) => s + r.duels, 0), boardPlayers: board[0]?.n || 0, onlineRanked: ranked[0]?.n || 0,
      d1: rate(fresh7, 'd1'), d7: rate(fresh14, 'd7'), newWeek,
      tutorialRate: newWeek ? Math.min(1, week.reduce((s, r) => s + r.tutorial, 0) / newWeek) : null },
  };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function reportHTML(r) {
  const max = Math.max(1, ...r.rows.map(x => x.players));
  const s = r.summary;
  const tile = (label, v, note = '') => `<div class="t"><b>${v}</b><span>${label}</span>${note ? `<small>${note}</small>` : ''}</div>`;
  const pc = v => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`);
  const cols = ['players', 'newPlayers', 'd1Rate', 'open', 'duels', 'casual', 'ranked', 'challenge', 'tutorial', 'daily'];
  const head = { players: '玩家', newPlayers: '新玩家', d1Rate: '次日回來', ...EVENT_NAME };
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>金融決鬥 · 每日統計</title><style>
:root{--bg:#0f1530;--ink:#e9ecf5;--mut:#9aa3c0;--line:#2a3360;--gold:#d8b25a}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,"Noto Sans TC",sans-serif;padding:16px}
h1{font-size:20px;font-weight:600;margin:0 0 4px}p{color:var(--mut);margin:0 0 16px;font-size:13px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:16px}
.t{border:1px solid var(--line);padding:10px 12px}.t b{display:block;font-size:22px;font-weight:600;color:var(--gold)}.t span{font-size:12px;color:var(--mut)}.t small{display:block;font-size:11px;color:var(--mut);opacity:.8;margin-top:2px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:13.5px}
th,td{padding:6px 8px;border-top:1px solid var(--line);text-align:right;white-space:nowrap}th{color:var(--mut);font-weight:400;border-top:0}
td:first-child,th:first-child{text-align:left}.bar{display:inline-block;height:8px;background:var(--gold);margin-right:6px;vertical-align:middle;opacity:.8}
tr.z td{color:var(--mut)}h2{font-size:17px;font-weight:600;margin:22px 0 4px}h2.qh{font-size:19px;margin-top:30px;color:var(--gold)}.qt td{text-align:left;white-space:normal;vertical-align:top}.qt td:nth-child(2),.qt td:nth-child(3){text-align:right;white-space:nowrap}.qt small{color:var(--mut)}.none{color:var(--mut)}</style></head><body>
<h1>金融決鬥 · 每日統計</h1><p>台灣時間，最近 30 天。玩家＝當天開啟遊戲的不同裝置數（匿名，不含個人資料）。今天：${esc(r.today)}</p>
<div class="tiles">${tile('今天玩家', r.rows[0].players)}${tile('近 7 天玩家', s.weekPlayers)}${tile('近 7 天對戰', s.weekDuels)}${tile('累計玩家', s.allPlayers)}${tile('排行榜玩家', s.boardPlayers)}${tile('線上排位賽場數', s.onlineRanked)}
${tile('次日留存', pc(s.d1), '近 7 天的新玩家，隔天又開啟的比例')}${tile('7 日留存', pc(s.d7), '第 8～21 天前的新玩家，一週內回來的比例')}${tile('新手場完成率', pc(s.tutorialRate), '近 7 天完成的新手場 ÷ 新玩家')}</div>
<div class="wrap"><table><thead><tr><th>日期</th>${cols.map(c => `<th>${head[c]}</th>`).join('')}</tr></thead><tbody>
${r.rows.map(x => `<tr class="${x.players ? '' : 'z'}"><td>${esc(x.day.slice(5))}</td>${cols.map(c => `<td>${c === 'players' ? `<i class="bar" style="width:${Math.round(x.players / max * 60)}px"></i>` : ''}${c === 'd1Rate' ? pc(x.d1Rate) : x[c]}</td>`).join('')}</tr>`).join('')}
</tbody></table></div>${qualityHTML(r.quality)}</body></html>`;
}

function qualityHTML(Q) {
  if (!Q) return '';
  const pc = v => `${Math.round(v * 100)}%`;
  const list = (title, note, rows) => `<h2>${title}</h2><p>${note}</p>${rows.length ? `<div class="wrap"><table class="qt"><thead><tr><th>題目</th><th>答對率</th><th>作答</th><th>最常選的錯誤選項</th></tr></thead><tbody>
${rows.map(x => `<tr><td><small>${esc(x.qid)}</small> ${esc(x.q)}<br><small>正解：${esc(x.answer)}</small></td><td>${pc(x.rate)}</td><td>${x.n}</td><td>${x.topWrong ? `${esc(x.topWrong.text)}（${x.topWrong.n}）` : '—'}</td></tr>`).join('')}
</tbody></table></div>` : '<p class="none">目前沒有符合的題目。</p>'}`;
  return `<h2 class="qh">題目品質</h2><p>已收到 ${Q.tracked} 題的作答資料，其中 ${Q.enough} 題累積 ${Q.min} 次以上，才列入下面的分析。</p>
${list('可能有爭議', '有一個錯誤選項被選的次數比正解還多：題目可能不清楚，或答案需要再確認。', Q.disputed)}
${list('最難的題目', '答對率最低的 10 題。', Q.hardest)}
${list('太簡單的題目', '答對率 97% 以上，可以考慮提高難度或換題。', Q.easiest)}`;
}
