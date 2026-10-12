// game.js — the duel in progress. One object, G, holds everything about the current duel (see the shape below);
// every module reads it from here. Only flow.js (new duel / resume) replaces it, through setGame().
// This module imports nothing, so anything can depend on it without creating an import cycle.

/**
 * @typedef {'p'|'c'} Side                          p = the player, c = the opponent (CPU)
 * @typedef {{ uid: number, id: string }} CardInst   one physical card in a deck or hand
 * @typedef {object} Game
 * @property {object} fsm          the duel's state machine (fsm.js)
 * @property {object} diff         the difficulty level (core.js DIFFS)
 * @property {{p: number, c: number}} lp           money left on each side
 * @property {{p: CardInst[], c: CardInst[]}} deck, hand
 * @property {{p: string[], c: string[]}|null} deckList   the 40-card lists the decks are refilled from
 * @property {number} turn
 * @property {string} phase        idle | attack | defend | busy
 * @property {boolean} busy        an action is being resolved; the hand is locked
 * @property {Set<string>} used    question ids already asked this duel
 * @property {number} streak, maxStreak
 * @property {object} mods         one-shot effects waiting to apply (myAtk, foeAtk, skipFoe, skipMe)
 * @property {object} flags        per-duel skill memory
 * @property {object[]} history    every answer, in order
 * @property {{total: number, correct: number, byCat: object}} stats
 * @property {object[]} missed     wrong answers for the result screen
 * @property {object|null} foeCard the opponent's attacking card while we defend
 * @property {{strong: string[], weak: string[]}} foeProf   the opponent's good and bad attributes
 * @property {{t: number, c: number}} foeStats              the opponent's block answers
 * @property {string|null} weak    our weakest attribute (damage bonus)
 * @property {boolean} over        the duel has ended (or been abandoned)
 */

/** @type {Game|null} */
export let G = null;
export function setGame(g) { G = g; }

/* a duel that was replaced or ended while an async step was waiting must not keep acting */
export const stale = g => G !== g || !g || g.over;

/* card instance ids: unique across decks, refills and resumed saves */
let uidSeq = 0;
export const nextUid = () => ++uidSeq;
export function reserveUids(maxUsed) { uidSeq = Math.max(uidSeq, maxUsed); }
