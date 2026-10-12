// fairness check for ranked (opponent fixed by tier, no growth): legal decks of different shapes vs the starter deck
import { it } from 'vitest';
import { playDuel } from './duel.js';
import { deckCost } from '../src/js/ranked.js';
import { MONSTERS } from '../src/js/carddata.js';
const N = Number(process.env.SIM_N || 300);
const CATS = ['tech', 'fund', 'deriv', 'risk', 'chips', 'fx', 'crypto', 'etf'];
const best = (cat, rank, n) => MONSTERS.filter(m => m.cat === cat && m.rank === rank).sort((a, b) => (b.atk + b.def) - (a.atk + a.def)).flatMap(m => [m.id, m.id]).slice(0, n);
/* per attribute: u UR, s SR, r R, n N copies (5 cards per attribute) */
const shape = (u, s, r, n) => CATS.flatMap(c => [...best(c, 4, u), ...best(c, 3, s), ...best(c, 2, r), ...best(c, 1, n)]);
it('fairness', () => {
  const decks = {
    starter: shape(0, 0, 5, 0),                // 40 R = 80
    sr: shape(0, 2, 1, 2),                     // 16 SR + 8 R + 16 N = 48+16+16 = 80
    ur1: shape(1, 0, 1, 3),                    // 8 UR + 8 R + 24 N = 40+16+24 = 80
    mix: shape(0, 1, 3, 1),                    // 8 SR + 24 R + 8 N = 24+48+8 = 80
  };
  for (const [k, d] of Object.entries(decks)) console.log(k, d.length, deckCost(d));
  const out = {};
  for (const diff of ['normal', 'hard']) for (const acc of [0.6, 0.75]) for (const [k, d] of Object.entries(decks)) {
    let w = 0; for (let i = 0; i < N; i++) if (playDuel({ diff, acc, deck: 'list', list: d, ranked: true }).win) w++;
    out[`${diff} ${acc} ${k}`] = Math.round(w / N * 100);
  }
  console.log(JSON.stringify(out, null, 1));
}, 900000);
