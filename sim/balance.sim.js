// npm run sim — win rates by difficulty × accuracy × deck, plus per-card strength. Writes sim/out/<label>.json
import { it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { playDuel } from './duel.js';
import { MON, MONSTERS } from '../src/js/cards.js';
import { SKILLS } from '../src/js/skills.js';

const N = Number(process.env.SIM_N || 300), LABEL = process.env.SIM_LABEL || 'run';
const ACCS = [0.5, 0.6, 0.7, 0.8, 0.9], DIFFS = ['easy', 'normal', 'hard'], DECKS = (process.env.SIM_DECKS || 'starter,full').split(',');

/* SIM_TUNE='{"block":{"easy":0.4},"foeMult":{"easy":0.85},"mix":{"hard":[24,10,6]},"sense":{"hard":0.9}}' tries values without editing the game */
import * as calc from '../src/js/calc.js';
import { DIFFS as GAME_DIFFS } from '../src/js/core.js';
import { CPU_MIX } from '../src/js/collection.js';
import { AI_SENSE } from '../src/js/ai.js';
const TUNE = JSON.parse(process.env.SIM_TUNE || '{}');
Object.assign(calc.FOE_BLOCK, TUNE.block || {});
for (const [k, v] of Object.entries(TUNE.foeMult || {})) GAME_DIFFS[k].foeMult = v;
Object.assign(CPU_MIX, TUNE.mix || {}); Object.assign(AI_SENSE, TUNE.sense || {});

it('simulates', () => {
  const out = { label: LABEL, n: N, tune: TUNE, grid: {}, cards: {} };
  const warn = console.warn; console.warn = () => {};
  if (process.env.SIM_GRID !== '0') for (const deck of DECKS) for (const diff of DIFFS) for (const acc of ACCS) {
    let w = 0, t = 0, to = 0;
    for (let i = 0; i < N; i++) { const r = playDuel({ diff, acc, deck }); w += r.win; t += r.turns; to += r.timeout; }
    out.grid[`${deck}|${diff}|${acc}`] = { win: w / N, turns: t / N, timeouts: to };
  }
  // per-card strength: random 40-card decks so every card is played on our side, normal difficulty, 70%
  const T = {};
  for (let i = 0; i < N * 20 * Number(process.env.SIM_CARDS ?? 1); i++) playDuel({ diff: 'normal', acc: 0.7, deck: 'random', track: T });
  for (const id of Object.keys(T)) {
    const t = T[id], m = MON[id];
    out.cards[id] = { name: m.name, cat: m.cat, rank: m.rank, skill: SKILLS[id].name,
      atk: t.atkN ? Math.round(t.atkSum / t.atkN) : null, atkN: t.atkN, def: t.defN ? Math.round(t.defSum / t.defN) : null, defN: t.defN,
      foe: t.foeN ? Math.round(t.foeSum / t.foeN) : null, foeN: t.foeN };
  }
  console.warn = warn;
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', LABEL + '.json'), JSON.stringify(out, null, 1));
}, 3600_000);
