// deck.js — cards moving between deck and hand: build a shuffled deck from a 40-card list, draw up to the hand
// size, and refill a deck that ran out. Used by duel setup (state.js) and by skills that draw extra cards.
import { MON, MONSTERS } from './carddata.js';
import { HAND_SIZE, shuffle } from './core.js';
import { G, nextUid } from './game.js';
import { UI } from './ui.js';

export function makeDeck(list) {
  const ids = Array.isArray(list) && list.length ? list : MONSTERS.flatMap(m => [m.id, m.id]);   // old saves: the full card pool
  return shuffle(ids.filter(id => MON[id]).map(id => ({ uid: nextUid(), id })));
}
/* when a deck runs out, a fresh shuffled deck replaces it so a long duel can never stall */
export function refillDeck(side) { if (!G.deck[side].length) { G.deck[side] = makeDeck(G.deckList && G.deckList[side]); UI.log('牌組用盡，重新洗牌補充。'); } }
export function draw(side) { const h = G.hand[side]; while (h.length < HAND_SIZE) { refillDeck(side); h.push(G.deck[side].pop()); } }
