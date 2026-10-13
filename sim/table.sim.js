// win rate and performance of one player archetype against each ranked opponent level → sim/out/table-<player>.json
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { playDuel } from './duel.js';
import { COL } from '../src/js/collection.js';
import { MONSTERS } from '../src/js/carddata.js';
import { rankedDeck } from '../src/js/ranked.js';
const PLAYERS = { 新手: { acc: 0.5, strat: 0.2 }, 普通: { acc: 0.62, strat: 0.4 }, 用功: { acc: 0.72, strat: 0.6 }, 高手: { acc: 0.82, strat: 0.8 }, 專家: { acc: 0.92, strat: 0.95 } };
export const LEVELS = { easy: { diff: 'easy' }, normal: { diff: 'normal' }, hard: { diff: 'hard' },
  hard1: { diff: 'hard', boost: 6, foeBoost: 0.06 }, hard2: { diff: 'hard', boost: 12, foeBoost: 0.12 }, hard3: { diff: 'hard', boost: 18, foeBoost: 0.18 } };
const N = Number(process.env.SIM_N || 200), who = process.env.PLAYER;
it('table', () => {
  const own = COL.owned; COL.owned = MONSTERS.map(m => m.id); const list = rankedDeck(); COL.owned = own;
  const out = {};
  for (const [name, p] of Object.entries(PLAYERS)) {
    if (who && who !== name) continue;
    for (const [lv, o] of Object.entries(LEVELS)) {
      const games = [];
      for (let i = 0; i < N; i++) { const r = playDuel({ ...o, ...p, deck: 'list', list, ranked: true, market: true }); games.push([r.win ? 1 : 0, r.perf.score]); }
      out[lv] = games;
    }
    mkdirSync('sim/out', { recursive: true });
    writeFileSync(`sim/out/table-${name}.json`, JSON.stringify(out));
  }
}, 3600000);
