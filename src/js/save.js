// save.js — the mid-duel save: write it at every attack / defence phase, read it back (upgrading old versions,
// backing up anything unreadable) and show the 「未完成的對決」 box on the title screen. Resuming is flow.js.
import { Actions } from './actions.js';
import { MON } from './cards.js';
import { $, DIFFS, Store, renameId } from './core.js';
import { G } from './game.js';
import * as Ranked from './ranked.js';
import * as Online from './online.js';
import { fmtDate, fmtNum, pad2 } from './report.js';

let SAVE_KEY, SAVE_V, MIGRATE_SAVE;

function migrateSave(d) {
  if (!d || typeof d !== 'object' || !Number.isInteger(d.v)) throw new Error('沒有版本號');
  if (d.v > SAVE_V) throw new Error('來自較新的版本');
  while (d.v < SAVE_V) { const f = MIGRATE_SAVE[d.v]; if (!f) throw new Error(`缺少 v${d.v} 的轉換`); d = f(d); }
  return d;
}
function serializeGame() {
  return { v: SAVE_V, savedAt: new Date().toISOString(), diffKey: Object.keys(DIFFS).find(k => DIFFS[k] === G.diff) || 'normal',
    lp: G.lp, deck: G.deck, hand: G.hand, turn: G.turn, phase: G.phase, used: [...G.used], streak: G.streak, maxStreak: G.maxStreak,
    stats: G.stats, missed: G.missed, history: G.history, dealt: G.dealt, taken: G.taken, mods: G.mods, flags: G.flags,
    extraUsed: G.extraUsed, nbAdded: G.nbAdded || 0, bg: G.bg || null, deckList: G.deckList || null, weak: G.weak || null, foe: G.foeCard ? G.foeCard.id : null, foeProf: G.foeProf || null, foeStats: G.foeStats || null, foeBoost: G.foeBoost || 0, kb: G.kb || null, challenge: G.challenge || null, answerLog: G.answerLog || null, marketPlan: G.marketPlan || null, mode: G.mode || 'casual', market: G.market || null, perf: G.perf || null, startedAt: G.startedAt.toISOString() };
}
function saveGame() {
  if (!G || G.over || (G.phase !== 'attack' && G.phase !== 'defend')) return false;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame())); } catch (e) { $('#save-label').textContent = '此瀏覽器無法記錄'; return false; }
  const d = new Date(); $('#save-label').textContent = `已記錄 ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return true;
}
function readSave() {
  let s = null; try { s = localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
  if (!s) return null;
  try {
    let d = JSON.parse(s);
    const was = d && d.v;
    d = migrateSave(d);
    if (!d.deck || !d.hand) throw new Error('缺少牌組');
    const all = [...d.deck.p, ...d.deck.c, ...d.hand.p, ...d.hand.c];
    if (d.deckList && ![...(d.deckList.p || []), ...(d.deckList.c || [])].every(id => MON[id])) throw new Error('卡牌資料不符');
    if (!all.every(i => MON[i.id]) || (d.foe && !MON[d.foe]) || (d.phase === 'defend' && !d.foe)) throw new Error('卡牌資料不符');
    if (was !== d.v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) {} }
    return d;
  } catch (e) {
    /* keep the unreadable save aside instead of losing it, and stop offering it */
    try { localStorage.setItem(SAVE_KEY + '.backup', s); localStorage.removeItem(SAVE_KEY); } catch (err) {}
    Store.issues.push({ key: SAVE_KEY, why: e.message || '無法讀取' });
    return null;
  }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
function renderResume() {
  const box = $('#resume'), sv = readSave();
  if (!sv) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="resume-h">未完成的對決<small>可以從上次中斷的地方繼續</small></div>
    <div class="row"><span>記錄時間 <b>${fmtDate(new Date(sv.savedAt))}</b></span><span>難易度 <b>${(DIFFS[sv.diffKey] || DIFFS.normal).name}</b></span><span>第 <b>${sv.turn}</b> 回合 · ${sv.phase === 'defend' ? '對手攻擊中' : '我方攻擊'}</span></div>
    <div class="row"><span>我方資金 <b>${fmtNum(sv.lp.p)}</b></span><span>對手資金 <b>${fmtNum(sv.lp.c)}</b></span><span>已答 <b>${sv.stats.total}</b> 題 · 答對 <b>${sv.stats.correct}</b></span></div>
    <div class="btn-row"><button class="btn small" id="btn-resume" type="button">繼續對戰</button><button class="btn ghost small danger" id="btn-discard" type="button">刪除紀錄</button></div>
    <div class="note">開始新的對戰後，這筆紀錄會在第一個行動點被覆蓋。</div>`;
  $('#btn-resume').onclick = () => Actions.resumeDuel();
  let armed = 0;
  $('#btn-discard').onclick = e => {
    const b = e.currentTarget;
    if (!armed) { b.textContent = '確定刪除？再按一次'; armed = setTimeout(() => { armed = 0; b.textContent = '刪除紀錄'; }, 3000); return; }
    clearTimeout(armed); clearSave(); if (Ranked.forfeitIfActive()) Online.endMatch({ surrender: true }); renderResume();   // a discarded ranked duel counts as a loss
  };
}

export function init() {
/* ---------- save / resume (this browser only) ---------- */
SAVE_KEY = 'soba-ketto.save.v1';
/* the duel save describes its own version (d.v); MIGRATE_SAVE[n] upgrades a version-n save to n+1 */
SAVE_V = 2;
MIGRATE_SAVE = {
  /* v1 → v2: card ids pass through ID_RENAMES; deckList / weak / mods / flags always present (null deckList = the old 100-card pool) */
  1: d => {
    const ren = i => ({ ...i, id: renameId(i.id) });
    return { ...d, v: 2, deck: { p: d.deck.p.map(ren), c: d.deck.c.map(ren) }, hand: { p: d.hand.p.map(ren), c: d.hand.c.map(ren) },
      foe: d.foe ? renameId(d.foe) : null, deckList: d.deckList ? { p: d.deckList.p.map(renameId), c: d.deckList.c.map(renameId) } : null,
      weak: d.weak || null, mods: { myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false, ...(d.mods || {}) }, flags: d.flags || {} };
  },
};
}

export { MIGRATE_SAVE, SAVE_KEY, SAVE_V, clearSave, migrateSave, readSave, renderResume, saveGame, serializeGame };
