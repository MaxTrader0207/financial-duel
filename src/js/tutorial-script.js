// tutorial-script.js — how the 教學對戰 differs from a normal duel. Rules only, no screen code (tutor.js drives the coach marks).
//  • fixed at 簡易 (30 s per question) with the easy opponent deck, and the opponent starts with half the money,
//    so a beginner finishes the whole duel in a few turns;
//  • only 初階 questions;
//  • the opponent misses its first block, so the first right answer lands in full;
//  • at the first defence the hand always holds a card with type advantage, so 相剋 can be shown in practice.
import { MON, MONSTERS } from './carddata.js';
import { cpuDeckList } from './collection.js';
import { DIFFS, LP_MAX } from './core.js';
import { makeDeck } from './deck.js';
import { G } from './game.js';
import { BEATS, advOf } from './rules.js';

export const tutorialFoeLp = () => LP_MAX / 2;           // LP_MAX is set when core.js initialises

export function setupTutorial() {
  G.tutorial = { foeMissLeft: 1, defended: false };
  G.diff = DIFFS.easy;
  G.deckList.c = cpuDeckList('easy');
  G.deck.c = makeDeck(G.deckList.c);
  G.lp.c = tutorialFoeLp();
}
export const isTutorial = () => !!(G && G.tutorial);

/* the first opponent block of the tutorial is a miss */
export function tutorialFoeMiss() {
  if (!isTutorial() || G.tutorial.foeMissLeft <= 0) return false;
  G.tutorial.foeMissLeft--; return true;
}

/* at the first defence, make sure some hand card beats the attacker; returns the uid of the card to suggest */
export function ensureAdvantage(foe) {
  if (!isTutorial() || !foe) return null;
  const best = () => {
    const v = G.hand.p.map(i => ({ uid: i.uid, adv: advOf(MON[i.id].cat, foe.cat), def: MON[i.id].def * advOf(MON[i.id].cat, foe.cat) }));
    const good = v.filter(x => x.adv > 1).sort((a, b) => b.def - a.def);
    return good.length ? good[0].uid : null;
  };
  let uid = best();
  if (uid == null && !G.tutorial.defended) {
    const cat = Object.keys(BEATS).find(c => BEATS[c] === foe.cat);
    const pick = (G.deckList.p || []).map(id => MON[id]).find(m => m && m.cat === cat)
      || MONSTERS.filter(m => m.cat === cat && m.rank <= 2).sort((a, b) => b.def - a.def)[0];
    if (pick) {
      /* swap out the hand card with the lowest DEF */
      const low = G.hand.p.reduce((a, b, i) => (MON[b.id].def < MON[G.hand.p[a].id].def ? i : a), 0);
      G.hand.p[low] = { uid: G.hand.p[low].uid, id: pick.id };
      uid = best();
    }
  }
  G.tutorial.defended = true;
  return uid;
}

/* the card a beginner should try: attack = highest ATK (weak attribute ×1.2), defence = highest DEF × advantage */
export function suggestCard(phase) {
  if (!G || !G.hand.p.length) return null;
  const score = i => { const m = MON[i.id];
    if (phase === 'defend' && G.foeCard) return m.def * advOf(m.cat, G.foeCard.cat);
    return m.atk * (G.weak === m.cat ? 1.2 : 1); };
  return G.hand.p.reduce((a, b) => (score(b) > score(a) ? b : a)).uid;
}
