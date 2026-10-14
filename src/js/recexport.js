// recexport.js — 學習紀錄輸出: a printable PDF learning report (summary, accuracy per attribute with trend, advice,
// most-missed questions, every duel), two CSVs for Excel (one row per duel; one row per question answered), and a
// 1080 × 1350 「學習成績單」 picture to share.
import { allQuestions } from './bank.js';
import { CATS } from './cards.js';
import { $, DIFFS } from './core.js';
import { DIFF_LABEL } from './rules.js';
import { NB, nbCounts } from './notebook.js';
import { QS, RECS, WEAK_MIN, lifetimeByCat, weakCat } from './records.js';
import { downloadsP, wrapText, pad2 } from './report.js';
import { loadJsPDF } from './jspdf.js';
import { PUBLIC_URL } from './challenge.js';

export const MODE_NAME = { casual: '休閒對戰', ranked: '排位賽', challenge: '好友挑戰', tutorial: '新手場' };
const result = r => (r.win ? '勝利' : r.quit ? '投降' : '敗北');
const pct = (c, t) => (t ? Math.round(c / t * 100) : 0);
const day = ms => { const d = new Date(ms); return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`; };
const dt = ms => { const d = new Date(ms); return `${day(ms)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const stamp = (d = new Date()) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
const nbStatus = e => (!e ? '' : e.mastered ? '已掌握' : `第 ${e.box} 階`);

/* ---------- the numbers, shared by every format ---------- */
export function summary(recs = RECS, qs = QS) {
  const n = recs.length, wins = recs.filter(r => r.win).length;
  const tot = recs.reduce((a, r) => a + r.total, 0), cor = recs.reduce((a, r) => a + r.correct, 0);
  const life = lifetimeByCat(), weak = weakCat();
  const cats = Object.keys(CATS).map(k => {
    const b = life[k] || { t: 0, c: 0 };
    const recent = recs.filter(r => r.byCat && r.byCat[k] && r.byCat[k].t).slice(-10);
    const rt = recent.reduce((a, r) => a + r.byCat[k].t, 0), rc = recent.reduce((a, r) => a + r.byCat[k].c, 0);
    return { cat: k, name: CATS[k].name, color: CATS[k].color, t: b.t, c: b.c, rate: b.t ? b.c / b.t : null, recent: rt ? rc / rt : null, weak: weak === k };
  });
  const group = (key, names) => Object.keys(names).map(k => { const rs = recs.filter(r => (r[key] || (key === 'mode' ? 'casual' : 'normal')) === k);
    const w = rs.filter(r => r.win).length; return { k, name: names[k], n: rs.length, w }; }).filter(x => x.n);
  const bank = Object.fromEntries(allQuestions().map(q => [q.id, q]));
  const answered = Object.entries(qs).filter(([id]) => bank[id]).map(([id, e]) => ({ q: bank[id], e }));
  const worst = answered.filter(x => x.e.w > 0).sort((a, b) => b.e.w - a.e.w || b.e.w / b.e.t - a.e.w / a.e.t).slice(0, 20);
  const rated = cats.filter(c => c.t >= WEAK_MIN);
  const strong = rated.slice().sort((a, b) => b.rate - a.rate)[0] || null;
  const advice = [];
  const w = cats.find(c => c.weak);
  if (w) advice.push(`弱項是「${w.name}」（正確率 ${pct(w.c, w.t)}%）：用這個屬性的卡攻擊，答對傷害 ×1.2；牌組編輯的「弱項練習牌組」可以集中練習。`);
  if (strong && (!w || strong.cat !== w.cat)) advice.push(`最拿手的是「${strong.name}」（正確率 ${pct(strong.c, strong.t)}%），可以當牌組的主力屬性。`);
  const few = cats.filter(c => c.t < WEAK_MIN);
  if (few.length) advice.push(`還沒答滿 ${WEAK_MIN} 題的屬性：${few.map(c => c.name).join('、')}。多放幾張這些屬性的卡，看看自己掌握得如何。`);
  for (const c of cats) if (c.rate !== null && c.recent !== null && c.t >= 15 && c.recent - c.rate >= 0.1) advice.push(`「${c.name}」最近 10 場進步到 ${Math.round(c.recent * 100)}%（累計 ${pct(c.c, c.t)}%），繼續保持。`);
  for (const c of cats) if (c.rate !== null && c.recent !== null && c.t >= 15 && c.rate - c.recent >= 0.1) advice.push(`「${c.name}」最近 10 場退步到 ${Math.round(c.recent * 100)}%（累計 ${pct(c.c, c.t)}%），回錯題本複習一下。`);
  const due = nbCounts().due;
  if (due) advice.push(`錯題本有 ${due} 題到了複習時間。`);
  return { n, wins, tot, cor, best: Math.max(0, ...recs.map(r => r.maxStreak || 0)), cats, byMode: group('mode', MODE_NAME),
    byDiff: group('diff', Object.fromEntries(Object.entries(DIFFS).map(([k, v]) => [k, v.name]))), worst, answered, advice,
    first: n ? recs[0].at : null, last: n ? recs[n - 1].at : null, recs };
}

/* ---------- CSV (UTF-8 with BOM so Excel shows Chinese correctly) ---------- */
const cell = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
const csv = rows => '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
export function gamesCSV(recs = RECS) {
  const cats = Object.keys(CATS);
  const head = ['日期時間', '模式', '難易度', '結果', '答對', '題數', '正確率', '回合', '最長連續答對', '造成傷害', '承受傷害', ...cats.flatMap(k => [`${CATS[k].name} 答對`, `${CATS[k].name} 題數`])];
  const rows = recs.map(r => [dt(r.at), MODE_NAME[r.mode || 'casual'] || r.mode, (DIFFS[r.diff] || DIFFS.normal).name, result(r), r.correct, r.total, `${pct(r.correct, r.total)}%`,
    r.turns, r.maxStreak || 0, r.dealt ?? '', r.taken ?? '', ...cats.flatMap(k => { const b = (r.byCat || {})[k]; return b && b.t ? [b.c, b.t] : ['', '']; })]);
  return csv([head, ...rows]);
}
export function questionsCSV(answered = summary().answered) {
  const head = ['題號', '屬性', '難度', '題目', '正確答案', '作答次數', '答錯次數', '正確率', '最後作答', '錯題本', '解說'];
  const rows = answered.slice().sort((a, b) => b.e.w - a.e.w || b.e.t - a.e.t).map(({ q, e }) => [q.id, CATS[q.category] ? CATS[q.category].name : q.category,
    DIFF_LABEL[q.difficulty] || '', q.q, q.options[q.answer], e.t, e.w, `${pct(e.t - e.w, e.t)}%`, e.last ? dt(e.last) : '', nbStatus(NB[q.id]), q.explain || '']);
  return csv([head, ...rows]);
}

/* ---------- PDF: blocks laid out on A4 canvases ---------- */
const PW = 1240, PH = 1754, MX = 90, MW = PW - MX * 2, TOP = 110, BOTTOM = PH - 90;
const SANS = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif', SERIF = '"FD Serif","Noto Serif TC","Songti TC",serif';
const f = (w, s, fam = SANS) => `${w} ${s}px ${fam}`;
const L = { bg: '#ffffff', ink: '#1d2140', muted: '#6b7090', line: '#d9dbe8', gold: '#a77d22', panel: '#f4f2ea', good: '#2f7d4f', bad: '#b0472f' };
const HEX = { tech: '#3f7fe0', fund: '#2f9e74', deriv: '#8d5ee0', risk: '#d8553a', chips: '#c3902e', fx: '#1f9fb3', crypto: '#d9467f', etf: '#6e9a2a', money: '#c24fc8' };
const size = font => Number(/(\d+)px/.exec(font)[1]);
function text(t, font, color, { gap = 10, indent = 0, lh = 1.5 } = {}) {
  let lines = [];
  return { measure(x) { x.font = font; lines = wrapText(x, t, MW - indent);
      for (let i = 1; i < lines.length; i++) while (/^[，。、；：！？」』）%]/.test(lines[i]) && lines[i].length) { lines[i - 1] += lines[i][0]; lines[i] = lines[i].slice(1); }
      lines = lines.filter(l => l.length); return lines.length * size(font) * lh + gap; },
    draw(x, y) { x.font = font; x.fillStyle = color; x.textBaseline = 'top'; lines.forEach((l, i) => x.fillText(l, MX + indent, y + i * size(font) * lh)); } };
}
const gapB = h => ({ measure: () => h, draw() {} });
const heading = t => ({ measure: () => 64, draw(x, y) { x.fillStyle = L.gold; x.fillRect(MX, y + 14, 10, 30); x.fillStyle = L.ink; x.font = f(700, 32, SERIF); x.textBaseline = 'top'; x.fillText(t, MX + 24, y + 10); } });
const together = parts => { let hs = []; return { measure(x) { hs = parts.map(p => p.measure(x)); return hs.reduce((a, b) => a + b, 0); }, draw(x, y) { let yy = y; parts.forEach((p, i) => { p.draw(x, yy); yy += hs[i]; }); } }; };
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

export function reportBlocks(S = summary()) {
  const d = new Date(), bl = [];
  bl.push({ measure: () => 130, draw(x, y) { x.fillStyle = L.ink; x.font = f(700, 50, SERIF); x.textBaseline = 'top'; x.fillText('學習報告', MX, y);
    x.font = f(400, 22); x.fillStyle = L.muted; x.fillText(`${day(d)} 輸出 · 紀錄期間 ${day(S.first)} – ${day(S.last)} · 共 ${S.n} 場`, MX, y + 72); } });
  bl.push({ measure: () => 150, draw(x, y) {
    const items = [[`${S.n}`, '對戰場數'], [`${pct(S.wins, S.n)}%`, `勝率 · ${S.wins} 勝 ${S.n - S.wins} 敗`], [`${pct(S.cor, S.tot)}%`, `總正確率 · ${S.cor}/${S.tot}`], [`${S.best}`, '最長連續答對']];
    const w = (MW - 3 * 16) / 4;
    items.forEach(([v, l], i) => { const X = MX + i * (w + 16); x.fillStyle = L.panel; rr(x, X, y, w, 116, 10); x.fill();
      x.fillStyle = L.ink; x.font = f(700, 40); x.textBaseline = 'top'; x.fillText(v, X + 20, y + 18); x.fillStyle = L.muted; x.font = f(400, 20); x.fillText(l, X + 20, y + 74); }); } });
  const line = arr => arr.map(g => `${g.name} ${g.w} 勝 ${g.n - g.w} 敗（${pct(g.w, g.n)}%）`).join('　');
  if (S.byMode.length) bl.push(text(`模式：${line(S.byMode)}`, f(400, 23), L.ink, { gap: 6 }));
  if (S.byDiff.length) bl.push(text(`難易度：${line(S.byDiff)}`, f(400, 23), L.ink, { gap: 18 }));
  /* accuracy per attribute */
  bl.push(together([heading('各屬性正確率'), { measure: () => 40, draw(x, y) { x.font = f(400, 19); x.fillStyle = L.muted; x.textBaseline = 'top';
    x.fillText('屬性', MX, y + 8); x.fillText('累計正確率', MX + 230, y + 8); x.textAlign = 'right'; x.fillText('最近 10 場', PW - MX - 150, y + 8); x.fillText('題數', PW - MX, y + 8); x.textAlign = 'left'; } }]));
  for (const c of S.cats) bl.push({ measure: () => 50, draw(x, y) {
    x.fillStyle = HEX[c.cat] || '#888'; x.fillRect(MX, y + 10, 10, 28);
    x.fillStyle = L.ink; x.font = f(c.weak ? 700 : 400, 24); x.textBaseline = 'top'; x.fillText(c.name + (c.weak ? '（弱項）' : ''), MX + 22, y + 10);
    const BX = MX + 230, BW = MW - 230 - 300; x.fillStyle = L.panel; x.fillRect(BX, y + 16, BW, 16);
    if (c.rate !== null) { x.fillStyle = c.rate < 0.6 ? L.bad : HEX[c.cat] || L.gold; x.fillRect(BX, y + 16, BW * c.rate, 16); }
    x.strokeStyle = L.muted; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(BX + BW * 0.6, y + 10); x.lineTo(BX + BW * 0.6, y + 38); x.stroke(); x.setLineDash([]);
    x.font = f(700, 22); x.fillStyle = L.ink; x.fillText(c.rate === null ? '—' : `${Math.round(c.rate * 100)}%`, BX + BW + 14, y + 12);
    x.textAlign = 'right'; x.font = f(400, 22);
    if (c.recent !== null && c.rate !== null) { const dlt = Math.round((c.recent - c.rate) * 100); x.fillStyle = dlt >= 5 ? L.good : dlt <= -5 ? L.bad : L.muted;
      x.fillText(`${Math.round(c.recent * 100)}%${dlt >= 5 ? ' ↑' : dlt <= -5 ? ' ↓' : ''}`, PW - MX - 150, y + 12); } else { x.fillStyle = L.muted; x.fillText('—', PW - MX - 150, y + 12); }
    x.fillStyle = L.muted; x.fillText(String(c.t), PW - MX, y + 12); x.textAlign = 'left'; } });
  bl.push(text('虛線為 60%。弱項需該屬性累計至少答 ' + WEAK_MIN + ' 題且正確率低於 85%。', f(400, 19), L.muted, { gap: 18 }));
  /* accuracy per duel */
  const lastG = S.recs.slice(-30);
  if (lastG.length >= 2) bl.push(together([heading(`每場正確率 · 最近 ${lastG.length} 場`), { measure: () => 260, draw(x, y) {
    const X = MX + 50, Y = y + 10, W = MW - 60, H = 200;
    x.strokeStyle = L.line; x.lineWidth = 1; x.font = f(400, 18); x.fillStyle = L.muted; x.textBaseline = 'middle'; x.textAlign = 'right';
    [0, 0.5, 1].forEach(v => { const yy = Y + H - v * H; x.beginPath(); x.moveTo(X, yy); x.lineTo(X + W, yy); x.stroke(); x.fillText(`${v * 100}%`, X - 10, yy); });
    x.textAlign = 'left'; x.setLineDash([5, 5]); x.strokeStyle = L.muted; const y6 = Y + H - 0.6 * H; x.beginPath(); x.moveTo(X, y6); x.lineTo(X + W, y6); x.stroke(); x.setLineDash([]);
    const px = i => X + (lastG.length === 1 ? W / 2 : i * W / (lastG.length - 1)), py = r => Y + H - (r.total ? r.correct / r.total : 0) * H;
    x.strokeStyle = L.gold; x.lineWidth = 3; x.beginPath(); lastG.forEach((r, i) => (i ? x.lineTo(px(i), py(r)) : x.moveTo(px(i), py(r)))); x.stroke();
    lastG.forEach((r, i) => { x.fillStyle = r.win ? L.good : L.bad; x.beginPath(); x.arc(px(i), py(r), 6, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = L.muted; x.textBaseline = 'top'; x.fillText('● 綠：勝利　● 紅：敗北或投降', X, Y + H + 16); } }]));
  /* advice */
  if (S.advice.length) { bl.push(heading('學習建議')); S.advice.forEach(t => bl.push(text(`・${t}`, f(400, 23), L.ink, { gap: 8, indent: 6 }))); bl.push(gapB(14)); }
  /* most missed */
  if (S.worst.length) {
    bl.push(heading(`最常答錯的題目 · 前 ${S.worst.length} 題`));
    S.worst.forEach(({ q, e }, i) => { const cat = CATS[q.category] || { name: q.category };
      bl.push(together([
        text(`${i + 1}. ${q.q}`, f(700, 24), L.ink, { gap: 4 }),
        text(`${cat.name} · ${DIFF_LABEL[q.difficulty] || ''} · 答錯 ${e.w} 次 / 作答 ${e.t} 次${NB[q.id] ? ` · 錯題本 ${nbStatus(NB[q.id])}` : ''}`, f(400, 19), L.muted, { gap: 4, indent: 28 }),
        text(`正解：${q.options[q.answer]}`, f(700, 22), L.gold, { gap: 4, indent: 28 }),
        ...(q.explain ? [text(`解說：${q.explain}`, f(400, 21), L.muted, { gap: 4, indent: 28 })] : []),
        { measure: () => 24, draw(x, y) { x.strokeStyle = L.line; x.lineWidth = 1; x.beginPath(); x.moveTo(MX, y + 10); x.lineTo(PW - MX, y + 10); x.stroke(); } }])); });
  }
  /* every duel */
  bl.push(together([heading(`對戰紀錄 · 共 ${S.n} 場（新的在前）`), { measure: () => 38, draw(x, y) { x.font = f(400, 19); x.fillStyle = L.muted; x.textBaseline = 'top';
    ['日期', '模式', '難易度', '結果', '答對／題數', '正確率', '回合'].forEach((h, i) => x.fillText(h, MX + COLS[i], y + 6)); } }]));
  S.recs.slice().reverse().forEach((r, i) => bl.push({ measure: () => 36, draw(x, y) {
    if (i % 2 === 0) { x.fillStyle = L.panel; x.fillRect(MX - 8, y, MW + 16, 36); }
    x.font = f(400, 20); x.textBaseline = 'top'; x.fillStyle = L.ink;
    const cells = [dt(r.at), MODE_NAME[r.mode || 'casual'] || '', (DIFFS[r.diff] || DIFFS.normal).name, result(r), `${r.correct}／${r.total}`, `${pct(r.correct, r.total)}%`, String(r.turns)];
    cells.forEach((c, k) => { x.fillStyle = k === 3 ? (r.win ? L.good : L.bad) : L.ink; x.fillText(c, MX + COLS[k], y + 7); }); } }));
  bl.push(text(`金融決鬥 · ${PUBLIC_URL}`, f(400, 18), L.muted, { gap: 0 }));
  return bl;
}
const COLS = [0, 230, 380, 510, 620, 790, 920];
async function fontsReady() { try { await Promise.all([document.fonts.load(f(700, 50, SERIF), '學習報告各屬性正確率'), document.fonts.load(f(400, 22), '學習報告')]); } catch { /* optional */ } }
export async function buildReportPages(S = summary()) {
  await fontsReady();
  const pages = []; let x, y;
  const page = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; x = c.getContext('2d'); x.fillStyle = L.bg; x.fillRect(0, 0, PW, PH);
    x.fillStyle = L.muted; x.font = f(400, 20); x.textBaseline = 'alphabetic'; x.fillText('金融決鬥 · 學習報告', MX, 60); x.textAlign = 'right'; x.fillText(`第 ${pages.length + 1} 頁`, PW - MX, 60); x.textAlign = 'left';
    x.strokeStyle = L.line; x.lineWidth = 2; x.beginPath(); x.moveTo(MX, 76); x.lineTo(PW - MX, 76); x.stroke(); pages.push(c); y = TOP; };
  page();
  for (const b of reportBlocks(S)) { const h = b.measure(x); if (y + h > BOTTOM && y > TOP) page(); b.draw(x, y); y += h; }
  return pages;
}

/* ---------- 學習成績單 picture (1080 × 1350, dark like the game) ---------- */
export async function drawCard(S = summary()) {
  await fontsReady();
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), D = { bg: '#0f1530', panel: '#1a2150', ink: '#eef0f8', muted: '#9aa3c0', gold: '#e7c873', bad: '#ff9c86', good: '#7fdcae' };
  x.fillStyle = D.bg; x.fillRect(0, 0, W, H); x.strokeStyle = D.gold; x.lineWidth = 3; x.strokeRect(20, 20, W - 40, H - 40);
  x.textBaseline = 'top'; x.fillStyle = D.gold; x.font = f(700, 64, SERIF); x.fillText('學習成績單', 70, 70);
  x.font = f(400, 26); x.fillStyle = D.muted; x.fillText(`金融決鬥 · ${day(Date.now())} · ${S.n} 場對戰`, 70, 158);
  const items = [[`${pct(S.cor, S.tot)}%`, '總正確率'], [`${pct(S.wins, S.n)}%`, '勝率'], [`${S.tot}`, '答題數'], [`${S.best}`, '最長連對']];
  const w = (W - 140 - 3 * 18) / 4;
  items.forEach(([v, l], i) => { const X = 70 + i * (w + 18); x.fillStyle = D.panel; rr(x, X, 220, w, 140, 12); x.fill();
    x.fillStyle = D.ink; x.font = f(700, 50); x.fillText(v, X + 22, 244); x.fillStyle = D.muted; x.font = f(400, 24); x.fillText(l, X + 22, 312); });
  x.fillStyle = D.gold; x.font = f(700, 34, SERIF); x.fillText('各屬性正確率', 70, 410);
  S.cats.forEach((cc, i) => { const Y = 474 + i * 66;
    x.fillStyle = D.ink; x.font = f(cc.weak ? 700 : 400, 27); x.fillText(cc.name, 70, Y + 4);
    const BX = 290, BW = 560; x.fillStyle = D.panel; x.fillRect(BX, Y + 10, BW, 22);
    if (cc.rate !== null) { x.fillStyle = HEX[cc.cat] || D.gold; x.fillRect(BX, Y + 10, BW * cc.rate, 22); }
    x.textAlign = 'right'; x.font = f(700, 27); x.fillStyle = cc.weak ? D.bad : D.ink; x.fillText(cc.rate === null ? '—' : `${Math.round(cc.rate * 100)}%`, W - 70, Y + 4); x.textAlign = 'left'; });
  const strong = S.cats.filter(cc => cc.t >= WEAK_MIN).sort((a, b) => b.rate - a.rate)[0], weak = S.cats.find(cc => cc.weak);
  x.font = f(400, 27); let Y = 474 + 9 * 66 + 24;
  if (strong) { x.fillStyle = D.good; x.fillText(`最拿手：${strong.name}`, 70, Y); }
  if (weak) { x.fillStyle = D.bad; x.fillText(`正在加強：${weak.name}`, 560, Y); }
  const nb = nbCounts(); x.fillStyle = D.ink; x.font = f(400, 27);
  x.fillText(`錯題本：已掌握 ${nb.mastered} 題 · 練習中 ${nb.learning} 題`, 70, Y + 62);
  x.fillStyle = D.muted; x.font = f(400, 22); x.fillText(`一起用卡牌學金融 · ${PUBLIC_URL}`, 70, H - 90);
  return c;
}

/* ---------- saving ---------- */
async function save(blob, filename) {
  const dl = await downloadsP;
  if (dl) return dl.save({ filename, data: blob });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const toBlob = c => new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('圖片產生失敗'))), 'image/png'));
export async function exportRecord(kind, btn) {
  const st = $('#rec-export-status'), say = (cls, t) => { st.className = 'status' + (cls ? ' ' + cls : ''); st.textContent = t; };
  if (!RECS.length) { say('err', '還沒有對戰紀錄，打完一場再來輸出。'); return; }
  if (btn) btn.disabled = true;
  try {
    const S = summary();
    if (kind === 'games' || kind === 'questions') {
      const name = `financial-duel-record-${kind}-${stamp()}.csv`;
      await save(new Blob([kind === 'games' ? gamesCSV() : questionsCSV(S.answered)], { type: 'text/csv;charset=utf-8' }), name);
      say('ok', `已輸出 ${name}（${kind === 'games' ? `${S.n} 場對戰` : `${S.answered.length} 題`}），可以用 Excel 或 Google 試算表開啟。`); return;
    }
    if (kind === 'pdf') {
      say('', '正在產生 PDF…');
      const JsPDF = await loadJsPDF(), pages = await buildReportPages(S);
      const doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
      pages.forEach((c, i) => { if (i) doc.addPage(); doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 595.28, 841.89); });
      doc.setProperties({ title: '金融決鬥 學習報告' });
      const name = `financial-duel-record-${stamp()}.pdf`; await save(doc.output('blob'), name);
      say('ok', `已輸出 ${name}（共 ${pages.length} 頁）`); return;
    }
    say('', '正在產生成績單…');
    const blob = await toBlob(await drawCard(S)), name = `financial-duel-record-card-${stamp()}.png`;
    const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '金融決鬥 學習成績單', text: `我在「金融決鬥」答了 ${S.tot} 題，正確率 ${pct(S.cor, S.tot)}%！一起用卡牌學金融：${PUBLIC_URL}` }); say('ok', '已開啟分享。'); return; }
      catch (e) { if (e && e.name === 'AbortError') { say('', '已取消分享。'); return; } }
    }
    await save(blob, name); say('ok', `已存成 ${name}。`);
  } catch (e) {
    say(e && e.code === 'declined' ? '' : 'err', e && e.code === 'declined' ? '已取消儲存。' : '輸出失敗：' + ((e && e.message) || '未知錯誤'));
  } finally { if (btn) btn.disabled = false; }
}

export function init() {
  $('#rec-export-pdf').onclick = e => exportRecord('pdf', e.currentTarget);
  $('#rec-export-card').onclick = e => exportRecord('card', e.currentTarget);
  $('#rec-export-games').onclick = e => exportRecord('games', e.currentTarget);
  $('#rec-export-q').onclick = e => exportRecord('questions', e.currentTarget);
}
