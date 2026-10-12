// collection.js — owned cards, the saved 40-card deck (validation, automatic deck), victory rewards, and the opponent's deck per difficulty.
import { Actions } from './actions.js';
import { CATS, MON, MONSTERS, RARITY, RARITY_FULL, cardHTML } from './cards.js';
import { $, Store, esc, isObj, renameId, shuffle } from './core.js';
import { Sound } from './sound.js';

let COL_KEY, DECK_KEY, DECK_SIZE, DECK_COPY, STARTER, COL_V, DECK_V, COL, owns, DECK_EACH, DECK_FOCUS, DECK_OTHER, DECKS_FIXED, DECK, CPU_MIX;

function colSave() { Store.trySave(COL_KEY, COL_V, COL); }
function deckValid(list) {
  if (!Array.isArray(list) || list.length !== DECK_SIZE) return false;
  const n = {}; for (const id of list) { if (!MON[id] || !owns(id)) return false; n[id] = (n[id] || 0) + 1; if (n[id] > DECK_COPY) return false; }
  return true;
}
function autoDeck(focus) {
  const out = [];
  Object.keys(CATS).forEach(k => {
    const want = focus ? (k === focus ? DECK_FOCUS : DECK_OTHER) : DECK_EACH;
    const kinds = MONSTERS.filter(m => m.cat === k && owns(m.id)).sort((a, b) => b.rank - a.rank || (b.atk + b.def) - (a.atk + a.def));
    const picked = [];
    for (let copy = 0; copy < DECK_COPY && picked.length < want; copy++) for (const m of kinds) { if (picked.length >= want) break; picked.push(m.id); }
    out.push(...picked);
  });
  return out;
}
/* top up (or trim) a deck to DECK_SIZE: keep what is valid, then fill with the auto-deck's picks, respecting the copy limit */
function fitDeck(list) {
  const cnt = {}, keep = [];
  const add = id => { if (keep.length < DECK_SIZE && MON[id] && owns(id) && (cnt[id] || 0) < DECK_COPY) { keep.push(id); cnt[id] = (cnt[id] || 0) + 1; } };
  list.forEach(add); autoDeck().forEach(add); MONSTERS.forEach(m => { add(m.id); add(m.id); });
  return keep;
}
function setDeck(v) { DECK = v; }
function deckSave() { return Store.trySave(DECK_KEY, DECK_V, DECK); }
/* the opponent keeps pace with your collection: every CPU_GROW_PER super/ultra rares you own swap one of its
   normal/rare cards for a super or ultra rare (at most CPU_GROW_MAX) */
const CPU_GROW_PER = 6, CPU_GROW_MAX = 10;
function cpuGrowth() { return Math.min(CPU_GROW_MAX, Math.floor(COL.owned.filter(id => MON[id] && MON[id].rank >= 3).length / CPU_GROW_PER)); }
/* grow = false: ranked, where the opponent depends on your tier only, never on how many cards you own */
function cpuDeckList(dk, { grow = true } = {}) {
  const ids = f => shuffle(MONSTERS.filter(f).map(m => m.id));
  let [lo, sr, ur] = CPU_MIX[dk] || CPU_MIX.normal;
  const g = grow ? Math.min(cpuGrowth(), lo) : 0; lo -= g; sr += Math.ceil(g / 2); ur += Math.floor(g / 2);
  return [...ids(m => m.rank <= 2).slice(0, lo), ...ids(m => m.rank === 3).slice(0, sr), ...ids(m => m.rank === 4).slice(0, ur)];
}
/* win reward: choose 1 of up to 3 uncollected cards; hard always offers an UR while any are left */
function rewardOffer(dk) {
  const locked = MONSTERS.filter(m => !owns(m.id));
  if (!locked.length) return null;
  const urW = { easy: 0.25, normal: 0.4, hard: 0.6 }[dk] || 0.4;
  const pool = locked.slice(), out = [];
  if (dk === 'hard') { const urs = pool.filter(m => m.rank === 4); if (urs.length) { const u = urs[Math.floor(Math.random() * urs.length)]; out.push(u); pool.splice(pool.indexOf(u), 1); } }
  while (out.length < 3 && pool.length) {
    const w = pool.map(m => m.rank === 4 ? urW : 1);
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (r > w[i]) { r -= w[i]; i++; }
    out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  return shuffle(out).map(m => m.id);
}
function claimReward(id) {
  if (!COL.pending || !COL.pending.includes(id)) return false;
  COL.owned.push(id); COL.pending = null; colSave(); return true;
}
function rewardHTML() {
  if (!COL.pending) return '';
  return `<div class="reward" id="reward"><h3 class="sec">獎勵選卡 · 選一張加入收藏</h3>
    <p class="lead">選好之後，到「牌組編輯」把它放進牌組。</p>
    <div class="reward-opts">${COL.pending.map(id => { const m = MON[id]; return `<button type="button" data-id="${id}">${cardHTML(m)}<span>${esc(m.name)} · ${RARITY_FULL[RARITY[m.rank]]}</span></button>`; }).join('')}</div></div>`;
}
function wireReward(after) {
  const box = $('#reward'); if (!box) return;
  box.querySelector('.reward-opts').onclick = e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const m = MON[b.dataset.id];
    if (!claimReward(m.id)) return;
    Sound.summon();
    box.innerHTML = `<h3 class="sec">已加入收藏</h3><p class="lead"><b>【${esc(m.name)}】</b>（${RARITY_FULL[RARITY[m.rank]]}）收進收藏了。目前收藏 ${COL.owned.length}/${MONSTERS.length} 種。</p><div class="btn-row"><button class="btn small" type="button" id="reward-deck">前往牌組編輯</button></div>`;
    $('#reward-deck').onclick = () => Actions.openDeck();
    if (after) after();
  };
}

export function init() {
/* ---------- collection + deck ---------- */
COL_KEY = 'soba-ketto.collection.v1';
DECK_KEY = 'soba-ketto.deck.v1';
DECK_SIZE = 40;
DECK_COPY = 2;
STARTER = MONSTERS.filter(m => m.rank <= 2).map(m => m.id);
COL_V = 1;
DECK_V = 2;
COL = (() => {
  /* v0 → v1: card ids pass through ID_RENAMES */
  let o = Store.load(COL_KEY, { version: COL_V, fallback: () => ({ owned: [] }), validate: d => isObj(d) && Array.isArray(d.owned),
    migrate: { 0: d => ({ ...d, owned: (d.owned || []).map(renameId), pending: Array.isArray(d.pending) ? d.pending.map(renameId) : null }) } });
  o.owned = [...new Set([...STARTER, ...o.owned.filter(id => MON[id])])];
  o.pending = Array.isArray(o.pending) ? o.pending.filter(id => MON[id] && !o.owned.includes(id)) : [];
  if (!o.pending.length) o.pending = null;
  return o;
})();
owns = id => COL.owned.includes(id);
/* balanced deck from what you own: 5 per category (or 12 for a focus category, 4 for the rest), strongest first, then second copies */
DECK_EACH = 5;
DECK_FOCUS = 12;
DECK_OTHER = 4;
DECKS_FIXED = false;
DECK = Store.load(DECK_KEY, { version: DECK_V, fallback: () => autoDeck(), validate: deckValid,
  /* v0 → v1: renamed ids; v1 → v2: decks went from 30 to 40 cards, so old decks are topped up instead of discarded */
  migrate: { 0: d => Array.isArray(d) ? d.map(renameId) : d, 1: d => { if (Array.isArray(d) && d.length !== DECK_SIZE) { DECKS_FIXED = true; return fitDeck(d); } return d; } } });
/* opponent decks grow stronger with difficulty */
CPU_MIX = { easy: [32, 6, 2], normal: [30, 7, 3], hard: [24, 10, 6] };
}

export { CPU_GROW_PER, CPU_GROW_MAX, cpuGrowth, COL, COL_KEY, COL_V, CPU_MIX, DECK, DECKS_FIXED, DECK_COPY, DECK_EACH, DECK_FOCUS, DECK_KEY, DECK_OTHER, DECK_SIZE, DECK_V, STARTER, setDeck, autoDeck, claimReward, colSave, cpuDeckList, deckSave, deckValid, fitDeck, owns, rewardHTML, rewardOffer, wireReward };
