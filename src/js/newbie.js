// newbie.js — the first-visit level question and beginner protection.
//  • A first-time player is asked how familiar they are with investing: 完全新手 starts at 簡易 with three protected
//    casual duels (初階 questions only, the opponent blocks less); 懂一點 starts at 適中; 交易老手 skips the tutorial and
//    opens every feature at once.
//  • After two casual losses in a row above 簡易, the result screen offers to switch to 簡易.
import { $, Store, isObj } from './core.js';
import { RECS } from './records.js';
import { G } from './game.js';
import { Tutor } from './tutor.js';
import { toast } from './view.js';
import { Actions } from './actions.js';
import * as Quests from './quests.js';

export const LEVEL_KEY = 'soba-ketto.level.v1', LEVEL_V = 1;
export const PROTECT_DUELS = 3;
export const LEVELS = {
  new: { name: '完全新手', diff: 'easy' },
  some: { name: '懂一點', diff: 'normal' },
  pro: { name: '交易老手', diff: 'normal' },
};
let L = null;
const lv = () => L || (L = Store.load(LEVEL_KEY, { version: LEVEL_V, fallback: () => ({}), validate: isObj }));
export const level = () => lv().level || null;
export function setLevel(k) { L = { level: k, at: Date.now() }; Store.trySave(LEVEL_KEY, LEVEL_V, L); }

/* casual duels finished so far (the tutorial does not count) */
const casualDone = (recs = RECS) => recs.filter(r => (r.mode || 'casual') === 'casual').length;
/* protected duels left for a 完全新手 */
export const protectLeft = (recs = RECS) => (level() === 'new' ? Math.max(0, PROTECT_DUELS - casualDone(recs)) : 0);
/* called when a duel starts: marks the duel protected (初階 only, weaker blocks) */
export function applyProtection() {
  G.newbie = G.mode === 'casual' && protectLeft() > 0;
  if (G.newbie) toast(`新手保護（還有 ${protectLeft()} 場）：只出初階題，對手也比較常擋失手。`);
}
/* two casual losses in a row, above 簡易 → suggest 簡易 */
export function suggestEasier(recs = RECS, diffKey = G && G.diff ? G.diff.name : '') {
  const c = recs.filter(r => (r.mode || 'casual') === 'casual').slice(-2);
  return c.length === 2 && c.every(r => !r.win) && c.every(r => r.diff && r.diff !== 'easy') && diffKey !== '簡易';
}
export function easierHTML() {
  return G && G.mode === 'casual' && suggestEasier() ? `<div class="easier-tip"><span>連輸兩場了。改成<b>簡易</b>：每題 30 秒、對手攻擊較弱，先把題目練熟再挑戰。</span><button class="btn small" type="button" id="btn-easier">改成簡易，再來一場</button></div>` : '';
}
export function setDifficulty(k) {
  const r = document.querySelector(`#diff input[value="${k}"]`);
  if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change')); }
}

/* the first-visit question */
export function maybeAsk() {
  if (level() || Tutor.done()) return false;
  $('#level-dlg').hidden = false; return true;
}
export function choose(k, { onPro } = {}) {
  setLevel(k); $('#level-dlg').hidden = true;
  setDifficulty(LEVELS[k].diff);
  if (k === 'pro') { Tutor.markDone(); if (onPro) onPro(); toast('已略過新手場，所有功能都已開放。想複習規則可以隨時按「新手場」，對戰中也能按「?」查規則。'); }
  else if (k === 'new') toast(`已設定為簡易難度。前 ${PROTECT_DUELS} 場休閒對戰有新手保護：只出初階題。`);
}

export function init() {
  document.querySelectorAll('#level-dlg [data-level]').forEach(b => { b.onclick = () => {
    choose(b.dataset.level, { onPro: () => Quests.openAll() }); Actions.renderTitle(); }; });
}
