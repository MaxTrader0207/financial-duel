// knowledgeui.js — the 知識圖鑑 screen: collection progress, the 100 knowledge cards by kind, and a card's detail
// (its explanation by level, how to get it, unlocking with shards, and the check question that levels it up).
import { Actions } from './actions.js';
import { $, KEYS, esc, shuffle } from './core.js';
import * as Daily from './daily.js';
import * as K from './knowledge.js';
import { Sound } from './sound.js';
import { show } from './view.js';

let filter = 'all', openId = null, quiz = null;
const TYPE_SEAL = { stock: '股', defense: '防', event: '事', trap: '陷' };
const stars = l => '◆'.repeat(l) + '◇'.repeat(K.MAX_LV - l);

/* a knowledge card face; `big` is the detail view */
export function kcardHTML(c, { big = false } = {}) {
  const l = K.lv(c.id), locked = !l, type = K.TYPES()[c.type] || '';
  return `<div class="kcard t-${c.type} lv${l}${locked ? ' locked' : ''}${big ? ' big' : ''}" data-k="${c.id}">
    <div class="kc-head"><span class="kc-type"><i>${TYPE_SEAL[c.type] || ''}</i>${esc(type)}</span><span class="kc-lv" aria-label="${locked ? '未收集' : `等級 ${l}`}">${locked ? '未收集' : stars(l)}</span></div>
    <div class="kc-art"><span class="kc-sigil">${locked ? '？' : esc(c.sigil)}</span></div>
    <div class="kc-name">${esc(c.name)}</div>
    <div class="kc-sum">${locked ? '尚未收集' : esc(c.summary)}</div>
    ${K.isNew(c.id) ? '<span class="kc-new">新</span>' : ''}
  </div>`;
}

export function renderKnowButton() {
  const b = $('#kn-badge'); if (!b) return;
  const s = K.stats(); b.hidden = !s.fresh; b.textContent = s.fresh;
}

function renderKnow() {
  const s = K.stats(), types = K.TYPES(), P = Daily.profile();
  $('#kn-sum').innerHTML = `<div class="kn-total"><b>${s.owned}</b><span>/ ${s.total} 已收集</span><b class="m">${s.mastered}</b><span>張精通</span><span class="kn-sh">碎片 ${P.shards}</span></div>
    <div class="kn-types">${Object.entries(types).map(([t, n]) => { const b = s.byType[t] || { owned: 0, total: 0 };
      return `<div class="kn-tb t-${t}"><span>${esc(n)}</span><div class="kn-bar"><i style="width:${b.total ? Math.round(b.owned / b.total * 100) : 0}%"></i></div><small>${b.owned}/${b.total}</small></div>`; }).join('')}</div>`;
  $('#kn-filter').innerHTML = [['all', '全部'], ...Object.entries(types)].map(([k, n]) =>
    `<button class="btn ghost small" type="button" data-k="${k}" aria-pressed="${filter === k}">${esc(n)}</button>`).join('');
  /* collected cards first (stable order inside each group), so the grid opens on what the player already has */
  const list = K.all().filter(c => filter === 'all' || c.type === filter);
  $('#kn-grid').innerHTML = [...list.filter(c => K.lv(c.id)), ...list.filter(c => !K.lv(c.id))]
    .map(c => `<button class="kn-cell" type="button" data-id="${c.id}" aria-label="${esc(c.name)}">${kcardHTML(c)}</button>`).join('');
  renderKnowButton();
}
export function openKnow(id) {
  renderKnow(); show('know');
  if (id) openCard(id);
}

/* ---------- card detail ---------- */
function openCard(id) {
  openId = id; quiz = null; K.markSeen(id);
  renderCard(); $('#kn-dlg').hidden = false;
  $('#kn-close').focus({ preventScroll: true });
}
function closeCard() { $('#kn-dlg').hidden = true; openId = null; quiz = null; renderKnow(); }
function renderCard(msg = '') {
  const c = K.byId(openId), l = K.lv(c.id), P = Daily.profile();
  const sections = c.levels.map((s, i) => i < l
    ? `<section class="kn-sec"><h4><span>Lv${i + 1}</span>${esc(s.title)}</h4><p>${esc(s.text)}</p></section>`
    : `<section class="kn-sec locked"><h4><span>Lv${i + 1}</span>${esc(s.title)}</h4><p>${l ? `升到 Lv${i + 1} 解鎖這段說明` : '收集這張卡後解鎖'}</p></section>`).join('');
  let act = '';
  if (!l) {
    const ds = K.dailyFor(c.id);
    act = `<p class="kn-how">${ds.length ? `完成每日挑戰「${ds.map(d => esc(d.title)).join('」「')}」時免費取得，或` : ''}用 ${K.UNLOCK_COST} 個碎片直接解鎖（目前 ${P.shards}）。</p>
      <button class="btn small" id="kn-buy" type="button" ${P.shards >= K.UNLOCK_COST ? '' : 'disabled'}>解鎖（${K.UNLOCK_COST} 碎片）</button>`;
  } else if (l < K.MAX_LV) {
    const cost = K.upgradeCost(c.id);
    act = quiz ? quizHTML() : `<p class="kn-how">升到 Lv${l + 1}：答對 1 題檢定，花 ${cost} 個碎片（目前 ${P.shards}）。答錯不扣碎片，看完說明可以再試。</p>
      <button class="btn small" id="kn-up" type="button" ${P.shards >= cost ? '' : 'disabled'}>${P.shards >= cost ? `檢定升級（${cost} 碎片）` : `碎片不足（需要 ${cost}）`}</button>`;
  } else act = '<p class="kn-how done">已精通這張卡：三段說明都解鎖了。</p>';
  $('#kn-card').innerHTML = `<div class="kn-detail">${kcardHTML(c, { big: true })}<div class="kn-text">${sections}</div></div>
    ${msg ? `<div class="kn-msg">${msg}</div>` : ''}<div class="kn-act">${act}</div>`;
  const buy = $('#kn-buy'); if (buy) buy.onclick = doBuy;
  const up = $('#kn-up'); if (up) up.onclick = () => { quiz = { order: shuffle(K.checkFor(c.id).options.map((_, i) => i)), done: false }; renderCard(); };
  document.querySelectorAll('#kn-card .kn-q .q-opt').forEach(b => { b.onclick = () => answer(Number(b.dataset.i)); });
}
function quizHTML() {
  const q = K.checkFor(openId);
  return `<div class="kn-q"><p class="kn-qtext">${esc(q.q)}</p><div class="dl-opts">${quiz.order.map((oi, i) =>
    `<button class="q-opt" type="button" data-i="${i}"><span class="k">${KEYS[i]}</span><span>${esc(q.options[oi])}</span></button>`).join('')}</div></div>`;
}
function answer(i) {
  const q = K.checkFor(openId), pick = quiz.order[i];
  const r = K.upgrade(openId, pick); if (!r) return;
  quiz = null;
  if (r.ok) {
    Sound.summon();
    const t = r.titles.map(id => `解鎖稱號「${esc(Daily.titleName(id))}」`).join('，');
    renderCard(`升到 Lv${r.lv}！${esc(q.explain)}${t ? ` ${t}` : ''}`);
  } else if (r.reason === 'wrong') {
    Sound.wrong();
    renderCard(`不對喔，正解是「${esc(q.options[q.answer])}」。${esc(q.explain)} 碎片沒有扣，讀完說明可以再試一次。`);
  } else renderCard('碎片不足。');
}
function doBuy() {
  const r = K.buy(openId); if (!r) return;
  Sound.summon();
  renderCard(`收集到「${esc(K.byId(openId).name)}」！${r.titles.length ? ` 解鎖稱號「${r.titles.map(id => esc(Daily.titleName(id))).join('」「')}」` : ''}`);
}

export function init() {
  $('#btn-know').onclick = () => openKnow();
  renderKnowButton();                                        // the title screen was drawn before the cards loaded
  $('#btn-know-back').onclick = () => { Actions.renderTitle(); show('title'); };
  $('#kn-filter').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) { filter = b.dataset.k; renderKnow(); } });
  $('#kn-grid').addEventListener('click', e => { const b = e.target.closest('.kn-cell'); if (b) openCard(b.dataset.id); });
  $('#kn-close').onclick = closeCard;
  $('#kn-dlg').addEventListener('click', e => { if (e.target === $('#kn-dlg')) closeCard(); });
  document.addEventListener('keydown', e => {
    if ($('#kn-dlg').hidden) return;
    if (e.key === 'Escape') { closeCard(); return; }
    const n = ['1', '2', '3', '4'].indexOf(e.key); if (n >= 0 && quiz) { answer(n); e.preventDefault(); }
  });
}
