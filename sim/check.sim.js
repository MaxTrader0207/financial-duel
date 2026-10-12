import { it } from 'vitest';
import { playDuel } from './duel.js';
import * as state from '../src/js/state.js';
import * as game from '../src/js/game.js';
import * as board from '../src/js/board.js';
it('probe', () => {
  const warn = console.warn; console.warn = () => {};
  let agg = { n: 0, win: 0, turn: 0, att: 0, attOk: 0, def: 0, defOk: 0, dealtLP: 0, takenLP: 0 };
  for (let i = 0; i < 400; i++) {
    const r = playDuel({ diff: 'hard', acc: 0.75, policy: 'random', fast: 1 });
    const G = game.G, h = G.history;
    agg.n++; agg.win += r.win; agg.turn += r.turns;
    agg.att += h.filter(x => x.mode === 'attack').length; agg.attOk += h.filter(x => x.mode === 'attack' && x.correct).length;
    agg.def += h.filter(x => x.mode === 'defend').length; agg.defOk += h.filter(x => x.mode === 'defend' && x.correct).length;
    agg.dealtLP += 10000 - G.lp.c; agg.takenLP += 10000 - G.lp.p;
  }
  console.warn = warn;
  for (const k of Object.keys(agg)) if (k !== 'n') agg[k] = +(agg[k] / agg.n).toFixed(2);
  console.log(JSON.stringify(agg));
}, 3600_000);
