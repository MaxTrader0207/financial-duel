// how much the 知識加成 moves win rates (no bonus vs. full bonus, ranked conditions)
import { it } from 'vitest';
import { playDuel } from './duel.js';
const N = Number(process.env.SIM_N || 300);
it('knowledge bonus', () => {
  const out = {};
  for (const [diff, acc] of [['hard', 0.62], ['hard', 0.72], ['normal', 0.5]]) for (const [k, kb] of [['無', null], ['半', { stock: 2, defense: 3, event: 2, trap: 3 }], ['滿', { stock: 5, defense: 5, event: 5, trap: 5 }]]) {
    let w = 0; for (let i = 0; i < N; i++) if (playDuel({ diff, acc, strat: 0.5, deck: 'ranked', ranked: true, market: true, kb }).win) w++;
    out[`${diff} ${acc} 加成${k}`] = Math.round(w / N * 100) + '%';
  }
  console.log(JSON.stringify(out, null, 1));
}, 3600000);
