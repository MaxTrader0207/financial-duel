// ai.js — the opponent's choices: which card to attack with (expected damage against our hand, type advantage, our weak attributes), with more randomness on easier levels.
import { MON } from './cards.js';
import { LP_MAX, foeAtkOf } from './core.js';
import { catAccEst } from './records.js';
import { advOf, diffKeyOf } from './rules.js';
import { SKILLS } from './skills.js';
import { G } from './game.js';

let AI_SENSE;

   // chance the opponent plays its best-scored card
function cpuScore(m) {
  const atk = foeAtkOf(m), lpP = G.lp.p, lpC = G.lp.c, dk = diffKeyOf(G.diff);
  const defs = G.hand.p.map(i => MON[i.id]);
  const bestDef = defs.length ? Math.max(...defs.map(d => d.def * advOf(d.cat, m.cat))) : 0;
  const acc = dk === 'easy' ? 0.7 : catAccEst(m.cat);       // easy opponent does not study your weak spots
  let ev = (1 - acc) * atk + acc * (Math.max(0, atk - bestDef) - Math.max(0, bestDef - atk));
  if (SKILLS[m.id].hit) ev += (1 - acc) * 200;
  if (atk >= lpP) ev += (1 - acc) * 4000;                   // a wrong answer would finish the duel
  else if (lpP < LP_MAX * 0.35) ev += atk * 0.5;            // press when the player is low
  const others = G.hand.c.some(x => MON[x.id].rank < 4);
  if (m.rank === 4 && others && lpP > LP_MAX * 0.6 && lpC > LP_MAX * 0.4) ev -= 700;   // hold the ace for later
  return ev;
}
function cpuPick() {
  const hand = G.hand.c, dk = diffKeyOf(G.diff);
  const scores = hand.map(i => cpuScore(MON[i.id]));
  let idx;
  if (Math.random() < (AI_SENSE[dk] ?? 0.75)) idx = scores.indexOf(Math.max(...scores));
  else {
    const w = hand.map(i => MON[i.id].atk + 400);
    let r = Math.random() * w.reduce((a, b) => a + b, 0); idx = 0;
    while (r > w[idx]) { r -= w[idx]; idx++; }
  }
  return Math.min(idx, hand.length - 1);
}

export function init() {
/* ---------- opponent AI ---------- */
AI_SENSE = { easy: 0.6, normal: 0.7, hard: 0.9 };
}

export { AI_SENSE, cpuPick, cpuScore };
