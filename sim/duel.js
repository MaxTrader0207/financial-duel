// sim/duel.js — plays whole duels without animation, using the real game modules (calc, skills, AI, decks).
// The player is a model: `acc` is the accuracy on a normal 4-option question; cards that remove options or
// allow a retry raise it the way they would for a real player who guesses when unsure.
import * as state from '../src/js/state.js';
import * as decks from '../src/js/deck.js';
import * as game from '../src/js/game.js';
import * as board from '../src/js/board.js';
import { MON, MONSTERS } from '../src/js/cards.js';
import { SKILLS } from '../src/js/skills.js';
import { DIFFS, LP_MAX, setDiffKey } from '../src/js/core.js';
import { autoDeck, COL, cpuDeckList } from '../src/js/collection.js';
import { cpuPick } from '../src/js/ai.js';
import { advOf, WEAK_MULT } from '../src/js/rules.js';
import * as calc from '../src/js/calc.js';
import { rankedDeck } from '../src/js/ranked.js';

const rnd = Math.random;
/* chance to answer right: knowledge k plus a guess among the options left */
function pCorrect(acc, remove = 0) { const k = Math.max(0, (acc - 0.25) / 0.75); return k + (1 - k) / (4 - remove); }
function answer(m, P) {
  const qz = (SKILLS[m.id] || {}).quiz || {};
  const p = pCorrect(P.acc, qz.remove || 0);
  let correct = rnd() < p, retried = false;
  if (!correct && qz.retry) { retried = true; correct = rnd() < pCorrect(P.acc, 1); }
  const limit = game.G.diff.time + (qz.extraTime || 0);
  const fast = !retried && rnd() < P.fast;
  const time = fast ? game.G.diff.fast * 0.6 : Math.min(limit, game.G.diff.fast + rnd() * (limit - game.G.diff.fast));
  return { correct, retried, time, left: limit - time };
}
function record(r, m) {
  const G = game.G; G.stats.total++; const b = G.stats.byCat[m.cat] || (G.stats.byCat[m.cat] = { t: 0, c: 0 }); b.t++;
  if (r.correct) { G.stats.correct++; b.c++; G.streak++; } else G.streak = 0;
  G.history.push({ mode: r.mode, correct: r.correct, cat: m.cat });
}
const hurt = (side, n) => { if (n > 0) game.G.lp[side] = Math.max(0, game.G.lp[side] - n); };
const heal = (side, n) => { if (n > 0) game.G.lp[side] = Math.min(LP_MAX, game.G.lp[side] + n); };
const take = (side, idx) => MON[game.G.hand[side].splice(idx, 1)[0].id];

function pickAttack(P) {
  const G = game.G, h = G.hand.p;
  if (P.policy === 'random') return Math.floor(rnd() * h.length);
  const v = h.map(i => { const m = MON[i.id]; return m.atk * (G.weak === m.cat ? WEAK_MULT : 1) + (SKILLS[m.id].hit ? 150 : 0); });
  return v.indexOf(Math.max(...v));
}
function pickDefend(P, foe) {
  const G = game.G, h = G.hand.p;
  if (P.policy === 'random') return Math.floor(rnd() * h.length);
  const v = h.map(i => { const m = MON[i.id], sk = SKILLS[m.id]; const b = typeof sk.defBonus === 'number' ? sk.defBonus : 0; return (m.def + b) * advOf(m.cat, foe.cat) + (sk.defFail ? 200 : 0); });
  return v.indexOf(Math.max(...v));
}

/* opts: { diff, acc, fast, policy: 'smart'|'random', deck: 'starter'|'full', track } → { win, turns } */
export function playDuel(opts) {
  const P = { acc: 0.7, fast: 0.5, policy: 'smart', deck: 'starter', ...opts };
  setDiffKey(P.diff);
  const ownedBefore = COL.owned;
  if (P.deck === 'full' || P.deck === 'ranked') COL.owned = MONSTERS.map(m => m.id);
  /* 'random': 40 cards drawn from all 160 (≤ 2 copies), so every card gets played for the per-card statistics */
  const deck = P.deck === 'list' ? P.list : P.deck === 'ranked' ? rankedDeck() : P.deck === 'random' ? MONSTERS.flatMap(m => [m.id, m.id]).sort(() => rnd() - 0.5).slice(0, 40) : autoDeck();
  const cpuDeck = cpuDeckList(P.diff, { grow: !P.ranked });          // the opponent grows with the collection we simulate
  COL.owned = ownedBefore;
  state.newGame();
  const G = game.G;
  Object.assign(G, { diff: DIFFS[P.diff], weak: null, deckList: { p: deck, c: cpuDeck } });
  G.deck = { p: decks.makeDeck(G.deckList.p), c: decks.makeDeck(G.deckList.c) };
  const T = P.track;
  const over = () => G.lp.p <= 0 || G.lp.c <= 0;
  while (!over() && G.turn < 80) {
    // ---- our turn
    G.turn++; G.extraUsed = false; decks.draw('p'); decks.draw('c');
    if (G.mods.skipMe) G.mods.skipMe = false;
    else {
      let again = true;
      while (again && !over() && G.hand.p.length) {
        again = false;
        const m = take('p', pickAttack(P));
        const r = answer(m, P); r.mode = 'attack'; record(r, m);
        let swing;
        if (r.correct) {
          const out = calc.attackHit(m, r);
          const blk = calc.foeBlock ? calc.foeBlock(m, out.dmg) : null;     // opponent defence, when the rules have it
          const dealt = blk ? blk.dmg : out.dmg;
          hurt('c', dealt); heal('p', out.heal); if (blk && blk.reflect) hurt('p', blk.reflect);
          swing = dealt + out.heal - (blk ? blk.reflect || 0 : 0);
          if (out.extra && !G.extraUsed && G.hand.p.length) { G.extraUsed = true; again = true; }
        } else {
          const out = calc.attackMiss(m);
          hurt('c', out.dmg); hurt('p', out.backlash); heal('p', out.heal);
          swing = out.dmg + out.heal - out.backlash;
        }
        if (T) { const t = T[m.id] || (T[m.id] = { atkN: 0, atkSum: 0, defN: 0, defSum: 0, foeN: 0, foeSum: 0 }); t.atkN++; t.atkSum += swing; }
      }
    }
    if (over()) break;
    // ---- opponent's turn
    if (G.mods.skipFoe) { G.mods.skipFoe = false; continue; }
    if (!G.hand.c.length) decks.draw('c');
    const foe = take('c', cpuPick()); G.foeCard = foe;
    if (!G.hand.p.length) decks.draw('p');
    const m = take('p', pickDefend(P, foe));
    const r = answer(m, P); r.mode = 'defend'; record(r, m);
    const s = calc.defendSetup(m, foe);
    const lpP = G.lp.p, lpC = G.lp.c;
    if (r.correct) { const out = calc.defendOk(m, s, r); hurt('p', out.pierce); hurt('c', out.reflect); heal('p', out.heal); }
    else { const out = calc.defendFail(m, foe, s); hurt('p', out.dmg); heal('c', out.foeHeal); }
    if (T) {
      const taken = lpP - G.lp.p, dealt = lpC - G.lp.c;
      const t = T[m.id] || (T[m.id] = { atkN: 0, atkSum: 0, defN: 0, defSum: 0, foeN: 0, foeSum: 0 }); t.defN++; t.defSum += s.atk - taken + dealt;
      const f = T[foe.id] || (T[foe.id] = { atkN: 0, atkSum: 0, defN: 0, defSum: 0, foeN: 0, foeSum: 0 }); f.foeN++; f.foeSum += taken - dealt;
    }
    G.foeCard = null;
  }
  G.over = true;
  return { win: G.lp.c <= 0 && G.lp.p > 0, turns: G.turn, timeout: !over() };
}
