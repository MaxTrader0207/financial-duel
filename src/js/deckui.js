// deckui.js — the 牌組編輯 screen and the 學習紀錄 back / clear buttons.
import * as Quests from './quests.js';
import { register } from './actions.js';
import { DECK_CAP, deckCost } from './ranked.js';
import { CATS, MON, MONSTERS, RARITY, RARITY_FULL, cardHTML, cardSlot, fillLazy } from './cards.js';
import { COL, DECK, DECK_COPY, DECK_EACH, DECK_FOCUS, DECK_OTHER, DECK_SIZE, setDeck, autoDeck, deckSave, deckValid, owns, rewardHTML, wireReward } from './collection.js';
import { $, esc } from './core.js';
import { WEAK_MIN, clearRecords, weakCat } from './records.js';
import { renderRecord } from './recordui.js';
import { renderTitle } from './screens.js';
import { show } from './view.js';
import { SKILLS } from './skills.js';
import { Sound } from './sound.js';

let deckDraft, deckCat;

function openDeck() { deckDraft = DECK.slice(); renderDeck(); show('deck'); }
function deckCount(id) { return deckDraft.filter(x => x === id).length; }
function renderDeck(msg) {
  const by = Object.fromEntries(Object.keys(CATS).map(k => [k, 0]));
  deckDraft.forEach(id => by[MON[id].cat]++);
  const avg = f => deckDraft.length ? Math.round(deckDraft.reduce((a, id) => a + MON[id][f], 0) / deckDraft.length) : 0;
  const weak = weakCat();
  $('#deck-sum').innerHTML = `
    <div class="stat"><div class="n" style="color:${deckDraft.length === DECK_SIZE ? 'var(--good)' : 'var(--shu)'}">${deckDraft.length}/${DECK_SIZE}</div><div class="l">牌組張數</div></div>
    <div class="stat"><div class="n">${COL.owned.length}/${MONSTERS.length}</div><div class="l">已收集種類</div></div>
    <div class="stat"><div class="n" style="font-size:clamp(18px,5vw,28px);white-space:nowrap">${avg('atk')} / ${avg('def')}</div><div class="l">平均 攻 / 守</div></div>
    <div class="stat"><div class="l" style="display:flex;flex-wrap:wrap;gap:4px 8px;font-size:13px;letter-spacing:0">${Object.keys(CATS).map(k => `<span><span class="chip" style="background:${CATS[k].color}">${CATS[k].name}</span>${by[k]}</span>`).join('')}</div><div class="l" style="margin-top:6px">屬性分布${weak ? ` · 弱項 ${CATS[weak].name}` : ''}</div></div>`;
  $('#deck-weak').disabled = !weak;
  $('#deck-weak').title = weak ? `${CATS[weak].name} ${DECK_FOCUS} 張、其他屬性各 3～4 張` : `需要學習紀錄判斷弱項（單一屬性累計至少答 ${WEAK_MIN} 題）`;
  $('#deck-filter').innerHTML = [['all', '全部'], ...Object.keys(CATS).map(k => [k, CATS[k].name]), ['in', '牌組中']]
    .map(([k, n]) => `<button class="btn ghost small" type="button" data-k="${k}" aria-pressed="${deckCat === k}">${n}</button>`).join('');
  const pend = rewardHTML();
  const list = MONSTERS.filter(m => deckCat === 'all' || (deckCat === 'in' ? deckDraft.includes(m.id) : m.cat === deckCat));
  $('#deck-grid').innerHTML = (pend ? `<div style="grid-column:1/-1">${pend}</div>` : '') + list.map(m => {
    const own = owns(m.id), n = own ? deckCount(m.id) : 0, sk = SKILLS[m.id];
    return `<div class="dk${own ? '' : ' locked'}${n ? ' in' : ''}" title="【${esc(sk.name)}】${esc(sk.text)}">${cardSlot(m)}<div><h4>${esc(m.name)}</h4>
      <div class="meta">${CATS[m.cat].name} · ${RARITY_FULL[RARITY[m.rank]]} · 攻 ${m.atk} / 守 ${m.def}</div>
      <div class="meta">【${esc(sk.name)}】${esc(sk.text)}</div>
      ${own ? `<div class="ctl"><button class="btn ghost small" type="button" data-id="${m.id}" data-d="-1" aria-label="減少" ${n ? '' : 'disabled'}>−</button><b>${n}/${DECK_COPY}</b><button class="btn ghost small" type="button" data-id="${m.id}" data-d="1" aria-label="增加" ${n < DECK_COPY && deckDraft.length < DECK_SIZE ? '' : 'disabled'}>＋</button></div>`
            : '<div class="meta" style="margin-top:6px;color:var(--gold)">未收集 · 勝利後有機會獲得</div>'}</div></div>`;
  }).join('');
  fillLazy($('#deck-grid'));
  wireReward(() => setTimeout(() => renderDeck(), 900));
  const cost = deckCost(deckDraft);
  $('#deck-cost').innerHTML = `排位牌組點數 <b class="${cost > DECK_CAP ? 'over' : ''}">${cost} / ${DECK_CAP}</b>（普通 1、稀有 2、超稀有 3、極稀有 5；只有排位賽有上限${cost > DECK_CAP ? '，超過時排位賽會自動改用合規牌組' : ''}）`;
  $('#deck-status').textContent = msg || (deckDraft.length === DECK_SIZE ? (deckDraft.join() === DECK.join() ? '' : '尚未儲存') : `還差 ${DECK_SIZE - deckDraft.length} 張才能儲存`);
  $('#deck-save').disabled = deckDraft.length !== DECK_SIZE;
}

export function init() {
register({ openDeck });

/* ---------- deck builder ---------- */
deckDraft = null;
deckCat = 'all';
$('#deck-grid').addEventListener('click', e => {
  const b = e.target.closest('button[data-d]'); if (!b || b.disabled) return;
  const id = b.dataset.id, d = Number(b.dataset.d);
  if (d > 0 && deckCount(id) < DECK_COPY && deckDraft.length < DECK_SIZE) deckDraft.push(id);
  if (d < 0) { const i = deckDraft.lastIndexOf(id); if (i >= 0) deckDraft.splice(i, 1); }
  Sound.select(); renderDeck();
});
$('#deck-filter').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) { deckCat = b.dataset.k; renderDeck(); } });
$('#deck-auto').onclick = () => { deckDraft = autoDeck(); renderDeck(`已自動組成平衡牌組（每屬性 4～5 張），記得儲存。`); };
$('#deck-weak').onclick = () => { const w = weakCat(); if (!w) return; deckDraft = autoDeck(w); renderDeck(`已組成弱項練習牌組：${CATS[w].name} ${DECK_FOCUS} 張，其他各 3～4 張。記得儲存。`); };
$('#deck-clear').onclick = () => { deckDraft = []; renderDeck(); };
$('#deck-save').onclick = () => {
  if (!deckValid(deckDraft)) { renderDeck(`牌組需要剛好 ${DECK_SIZE} 張已收集的卡，每種最多 ${DECK_COPY} 張。`); return; }
  setDeck(deckDraft.slice()); Quests.mark('deck'); renderDeck(deckSave() ? '牌組已儲存，下一場對戰開始生效。' : '這個瀏覽器無法儲存，牌組只在這次開啟期間有效。');
};
$('#btn-deck').onclick = openDeck;
$('#btn-deck-back').onclick = () => {
  if (deckDraft && deckDraft.join() !== DECK.join() && !$('#btn-deck-back').dataset.armed) {
    $('#btn-deck-back').dataset.armed = '1'; $('#btn-deck-back').textContent = '牌組未儲存，再按一次離開';
    setTimeout(() => { delete $('#btn-deck-back').dataset.armed; $('#btn-deck-back').textContent = '回標題'; }, 3000); return;
  }
  delete $('#btn-deck-back').dataset.armed; $('#btn-deck-back').textContent = '回標題';
  renderTitle(); show('title');
};
$('#btn-rec').onclick = () => { renderRecord(); show('record'); };
$('#btn-rec-back').onclick = () => { renderTitle(); show('title'); };
{ let armed = 0;
  $('#rec-clear').onclick = e => {
    const b = e.currentTarget;
    if (!armed) { b.textContent = '確定清除？再按一次'; armed = setTimeout(() => { armed = 0; b.textContent = '清除學習紀錄'; }, 3000); return; }
    clearTimeout(armed); armed = 0; b.textContent = '清除學習紀錄';
    clearRecords(); renderRecord();
  };
}
}

export { deckCat, deckCount, deckDraft, openDeck, renderDeck };
