import { vi } from 'vitest';
import * as state from '../src/js/state.js';
import * as game from '../src/js/game.js';
import * as board from '../src/js/board.js';
import { DIFFS } from '../src/js/core.js';

/* a fresh, deterministic duel state: both sides at 10,000, turn 1, empty hands, no streak, no modifiers */
export function fresh(over = {}) {
  state.newGame();
  const G = game.G;
  /* a fixed ×1.0 attack multiplier, so rule tests do not move when the difficulty levels are re-tuned */
  Object.assign(G, { diff: { ...DIFFS.normal, foeMult: 1 }, turn: 1, streak: 0, weak: null, flags: {}, extraUsed: false, history: [],
    foeProf: { strong: [], weak: [] }, foeStats: { t: 0, c: 0 },
    stats: { total: 0, correct: 0, byCat: {} }, lp: { p: 10000, c: 10000 }, mods: { myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false } });
  G.hand.p = []; G.hand.c = [];
  Object.assign(G, over);
  return G;
}
/* chance-based skills: 0.99 = never procs, 0 = always procs */
export const noLuck = () => vi.spyOn(Math, 'random').mockReturnValue(0.99);
export const allLuck = () => vi.spyOn(Math, 'random').mockReturnValue(0);
export const hand = (...ids) => ids.map((id, i) => ({ uid: 70000 + i, id }));
