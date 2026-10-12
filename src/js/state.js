// state.js — starting a new duel: decks for both sides, the difficulty, our weak attribute and a fresh opponent
// profile. The duel object itself lives in game.js, card movement in deck.js, drawing the table in board.js.
import { createMachine } from './fsm.js';
import { foeProfile } from './calc.js';
import { DECK, autoDeck, cpuDeckList, deckValid } from './collection.js';
import { DIFFS, LP_MAX, diffKey } from './core.js';
import { makeDeck } from './deck.js';
import { setGame } from './game.js';
import { weakCat } from './records.js';

/* a new duel with the saved deck (or an automatic one), the opponent's deck for the chosen difficulty and a fresh opponent profile */
function newGame() {
  const deckList = { p: deckValid(DECK) ? DECK.slice() : autoDeck(), c: cpuDeckList(diffKey) };
  setGame({ fsm: createMachine(), diff: DIFFS[diffKey], deckList, weak: weakCat(), lp: { p: LP_MAX, c: LP_MAX },
    deck: { p: makeDeck(deckList.p), c: makeDeck(deckList.c) }, hand: { p: [], c: [] }, turn: 0, phase: 'idle', busy: false,
    used: new Set(), streak: 0, maxStreak: 0, mods: { myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false }, flags: {}, extraUsed: false,
    history: [], startedAt: new Date(), endedAt: null, win: null, stats: { total: 0, correct: 0, byCat: {} }, missed: [], foeCard: null,
    over: false, dealt: 0, taken: 0, foeProf: foeProfile(), foeStats: { t: 0, c: 0 } });
}

export function init() { setGame(null); }

export { newGame };
