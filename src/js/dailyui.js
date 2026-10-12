// dailyui.js — the 每日挑戰 screen and its card on the title screen.
// Flow: scenario + question 1/3 → answer → instant explanation and rewards → … → summary (score, rewards, streak,
// level, new titles, shard exchange). Coming back the same day shows the summary with every explanation.
import { Actions } from './actions.js';
import { COL, colSave, rewardOffer } from './collection.js';
import { $, KEYS, esc, shuffle } from './core.js';
import * as Daily from './daily.js';
import * as K from './knowledge.js';
import { kcardHTML, openKnow } from './knowledgeui.js';
import { Sound } from './sound.js';
import { show } from './view.js';

let order = [], cur = 0, answered = false;
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const dateLabel = key => { const [y, m, d] = key.split('-').map(Number); return `${m} 月 ${d} 日（${WEEK[new Date(y, m - 1, d).getDay()]}）`; };
const chips = r => `<span class="dl-chip xp">經驗 +${r.xp}</span><span class="dl-chip sh">碎片 +${r.shards}</span>`;

/* ---------- title-screen card ---------- */
export function renderDailyCard() {
  const el = $('#daily-card'); if (!el) return;
  const t = Daily.today();
  if (!t.scenario) { el.hidden = true; return; }
  const P = Daily.profile(), lv = Daily.level(), st = Daily.streakNow();
  el.hidden = false; el.classList.toggle('done', t.done);
  el.innerHTML = `<span class="dc-seal" aria-hidden="true">日</span>
    <span class="dc-main"><span class="dc-k">每日挑戰 · 約 3 分鐘</span><b class="dc-t">${esc(t.scenario.title)}</b>
      <span class="dc-s">${st ? `連續 <b>${st}</b> 天 · ` : ''}Lv.${lv.lv}${P.title ? ` · ${esc(Daily.titleName(P.title))}` : ''} · 碎片 ${P.shards}</span></span>
    <span class="dc-cta">${t.done ? '今日已完成' : t.next ? `繼續 ${t.next + 1}/3` : '開始'}</span>`;
  el.setAttribute('aria-label', `每日挑戰：${t.scenario.title}，${t.done ? '今日已完成' : '尚未完成'}`);
  badge(t.done);
}
/* installed app: a dot on the home-screen icon until today's challenge is done */
function badge(done) {
  try { if (!('setAppBadge' in navigator)) return; done ? navigator.clearAppBadge() : navigator.setAppBadge(1); } catch (e) {}
}

/* ---------- screen ---------- */
export function openDaily() {
  const t = Daily.today(); if (!t.scenario) return;
  $('#daily-date').textContent = `${dateLabel(t.key)} · 每日 3 分鐘金融挑戰`;
  renderStreak();
  if (t.done) renderSummary(null); else { cur = t.next; renderQuestion(); }
  show('daily');
}
function renderStreak() {
  const st = Daily.streakNow(), days = Daily.recent(7);
  $('#daily-streak').innerHTML = `<span class="dl-days" aria-label="最近 7 天">${days.map(d => `<i class="${d.done ? (d.perfect ? 'p' : 'd') : ''}" title="${d.key}${d.done ? ' 已完成' : ''}"></i>`).join('')}</span>
    <span>連續 <b>${st}</b> 天</span>`;
}
function sceneHTML(s) {
  return `<div class="dl-scene"><span class="dl-theme">${esc(s.theme)}</span><h3 class="dl-title">${esc(s.title)}</h3><p>${esc(s.scene)}</p></div>`;
}
function progressHTML(n) {
  return `<div class="dl-prog">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : i === n ? 'cur' : ''}"></i>`).join('')}<span>第 ${n + 1} / 3 題 · 約 3 分鐘</span></div>`;
}
function renderQuestion() {
  const { scenario: s } = Daily.today(), q = s.questions[cur];
  order = shuffle(q.options.map((_, i) => i)); answered = false;
  $('#daily-body').innerHTML = `${sceneHTML(s)}${progressHTML(cur)}
    <div class="dl-q"><p class="dl-qtext">${esc(q.q)}</p>
      <div class="dl-opts">${order.map((oi, i) => `<button class="q-opt" type="button" data-i="${i}"><span class="k">${KEYS[i]}</span><span>${esc(q.options[oi])}</span></button>`).join('')}</div>
      <div class="dl-fb" id="dl-fb" hidden></div></div>
    <div class="btn-row"><button class="btn ghost small" id="daily-leave" type="button">先回標題（進度會保留）</button></div>`;
  $('#daily-leave').onclick = leave;
}
function pick(i) {
  if (answered) return;
  const { scenario: s } = Daily.today(), q = s.questions[cur];
  const res = Daily.answer(cur, order[i]); if (!res) return;
  answered = true;
  const btns = [...document.querySelectorAll('#daily-body .dl-opts .q-opt')];
  btns.forEach((b, j) => { b.disabled = true; if (order[j] === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  res.ok ? Sound.correct() : Sound.wrong();
  const last = cur === s.questions.length - 1;
  const fb = $('#dl-fb'); fb.hidden = false; fb.classList.toggle('no', !res.ok);
  fb.innerHTML = `<div class="dl-verdict">${res.ok ? '答對了！' : `正確觀念是「${esc(q.options[q.answer])}」`}</div>
    <p>${esc(q.explain)}</p>
    <div class="dl-chips">${chips(res.reward)}${res.ok ? '' : '<span class="dl-chip soft">答錯也有獎勵，記住這個觀念就好</span>'}</div>
    <button class="btn small" id="dl-next" type="button">${last ? '看今日成果 ▶' : '下一題 ▶'}</button>`;
  if (res.finished) { const k = K.onDailyFinished(s); res.finished.card = k ? k.card : null; if (k) res.finished.newTitles.push(...k.titles); }
  $('#dl-next').onclick = () => { if (last) { Sound.jingle(true); renderSummary(res.finished); } else { cur++; renderQuestion(); } };
  $('#dl-next').focus({ preventScroll: true });
  renderStreak();
}
/* fin = what finishing just earned (null when reopening a finished day) */
function renderSummary(fin) {
  const t = Daily.today(), s = t.scenario, day = t.day, P = Daily.profile(), lv = Daily.level();
  const right = day.answers.filter(a => a.ok).length;
  const pending = !!COL.pending, canPick = !pending && P.shards >= Daily.EXCHANGE_COST;
  const titles = fin && fin.newTitles.length ? fin.newTitles : [];
  $('#daily-body').innerHTML = `
    <div class="dl-done">
      <div class="dl-score"><b>${right}</b><span>/ 3</span></div>
      <div><h3 class="dl-title">${fin ? '今日挑戰完成！' : '今天已經完成囉'}</h3>
        <p class="dl-sub">${right === 3 ? '三題全對，觀念很清楚。' : right ? '答錯的題目看一下解析，觀念就補起來了。' : '沒關係，每個觀念看過一次就是收穫。'}明天會換新的情境。</p></div>
    </div>
    <div class="dl-take"><span>今日重點</span><b>${esc(s.takeaway)}</b></div>
    <div class="dl-chips big">${chips({ xp: day.xp, shards: day.shards })}${fin && fin.perfect ? '<span class="dl-chip soft">全對加碼已計入</span>' : ''}</div>
    ${titles.map(id => `<div class="dl-title-new"><span>解鎖稱號</span><b>${esc(Daily.titleName(id))}</b><small>${esc(Daily.TITLES.find(x => x.id === id).desc)}</small></div>`).join('')}
    ${cardBlock(s, fin)}
    ${fin && fin.levelUp ? `<div class="dl-title-new lv"><span>升級</span><b>Lv.${fin.levelUp}</b></div>` : ''}
    <div class="dl-grid">
      <div class="dl-box"><h4>等級</h4><div class="dl-lv"><b>Lv.${lv.lv}</b><span>${lv.into} / ${lv.need} 經驗</span></div><div class="dl-bar"><i style="width:${Math.round(lv.into / lv.need * 100)}%"></i></div></div>
      <div class="dl-box"><h4>卡牌碎片</h4><div class="dl-lv"><b>${P.shards}</b><span>每 ${Daily.EXCHANGE_COST} 個可兌換一次選卡</span></div>
        <button class="btn ghost small" id="dl-exchange" type="button" ${canPick ? '' : 'disabled'}>${pending ? '先領取待選的獎勵卡' : `兌換（${Daily.EXCHANGE_COST} 碎片）`}</button></div>
      <div class="dl-box"><h4>稱號</h4>${titleSelect(P)}</div>
    </div>
    <details class="dl-review"><summary>回顧今天的 3 題</summary>${s.questions.map((q, i) => { const a = day.answers[i];
      return `<div class="miss"><div class="q">${a && a.ok ? '<span class="chip ok">答對</span>' : '<span class="chip">答錯</span>'}${esc(q.q)}</div><div class="a">正解：${esc(q.options[q.answer])}</div><div class="e">${esc(q.explain)}</div></div>`; }).join('')}</details>
    <div class="btn-row"><button class="btn" id="daily-duel" type="button">去對戰</button><button class="btn ghost" id="daily-home" type="button">回標題</button></div>`;
  $('#daily-home').onclick = leave;
  $('#daily-duel').onclick = () => Actions.startDuel();
  $('#dl-exchange').onclick = exchange;
  const kc = $('#dl-kcard'); if (kc) kc.onclick = () => openKnow(kc.dataset.id);
  const sel = $('#dl-title-sel'); if (sel) sel.onchange = () => { Daily.setTitle(sel.value || null); };
  renderStreak();
}
/* the knowledge card linked to today's scenario: new today, or already in the collection */
function cardBlock(s, fin) {
  const c = s.card && K.byId(s.card); if (!c) return '';
  const fresh = fin && fin.card && fin.card.id === c.id;
  return `<button class="dl-kcard${fresh ? ' fresh' : ''}" id="dl-kcard" type="button" data-id="${c.id}">${kcardHTML(c)}
    <span><small>${fresh ? '收集到新的知識卡！' : K.lv(c.id) ? '相關知識卡（已收集）' : '相關知識卡'}</small><b>${esc(c.name)}</b><em>${esc(c.summary)}</em><u>到知識圖鑑查看與升級 ▶</u></span></button>`;
}
function titleSelect(P) {
  if (!P.titles.length) return `<p class="dl-note">連續完成每日挑戰就能解鎖稱號，第一個在完成第一天時取得。</p>`;
  return `<select id="dl-title-sel" aria-label="顯示的稱號"><option value="">不顯示</option>${Daily.ownedTitles()
    .map(t => `<option value="${t.id}" ${P.title === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
    <p class="dl-note">下一個：${esc((Daily.TITLES.find(t => !P.titles.includes(t.id)) || { desc: '全部解鎖了！' }).desc)}</p>`;
}
function exchange() {
  if (COL.pending) return;
  const offer = rewardOffer('normal');
  if (!offer) { $('#dl-exchange').textContent = '已收集全部卡牌'; $('#dl-exchange').disabled = true; return; }
  if (!Daily.spendShards()) return;
  COL.pending = offer; colSave(); Sound.summon();
  Actions.openDeck();                                     // the deck builder shows the pick at the top
}
function leave() { Actions.renderTitle(); show('title'); }

export function init() {
  $('#daily-card').onclick = openDaily;
  renderDailyCard();                                         // the title screen was drawn before the saved progress loaded
  document.addEventListener('keydown', e => {
    if ($('#scr-daily').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = KEYS.indexOf(e.key) >= 0 ? KEYS.indexOf(e.key) : ['1', '2', '3', '4'].indexOf(e.key);
    if (n >= 0 && !answered && $('#daily-body .dl-opts')) { pick(n); e.preventDefault(); }
    else if (e.key === 'Enter' && answered && $('#dl-next')) { $('#dl-next').click(); e.preventDefault(); }
  });
  $('#daily-body').addEventListener('click', e => { const b = e.target.closest('.dl-opts .q-opt'); if (b && !b.disabled) pick(Number(b.dataset.i)); });
}
