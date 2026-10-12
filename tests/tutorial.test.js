import { describe, it, expect, afterEach, vi } from 'vitest';
import { MON } from '../src/js/cards.js';
import { DIFFS, LP_MAX } from '../src/js/core.js';
import { BEATS, advOf } from '../src/js/rules.js';
import * as script from '../src/js/tutorial-script.js';
import { fresh, hand } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

describe('教學對戰 script', () => {
  it('fixes the level at 簡易 and halves the opponent\'s money', () => {
    const G = fresh(); G.deckList = { p: [], c: [] }; script.setupTutorial();
    expect(G.diff).toBe(DIFFS.easy); expect(G.lp.c).toBe(LP_MAX / 2); expect(G.deck.c.length).toBe(40);
  });
  it('makes only the first opponent block miss', () => {
    const G = fresh(); G.deckList = { p: [], c: [] }; script.setupTutorial();
    expect(script.tutorialFoeMiss()).toBe(true); expect(script.tutorialFoeMiss()).toBe(false);
    G.tutorial = null; expect(script.tutorialFoeMiss()).toBe(false);
  });
  it('puts a 相剋 card in the hand at the first defence and suggests it', () => {
    const G = fresh({ tutorial: { foeMissLeft: 0, defended: false } });
    const foe = MON.boll_dragon;                                                     // tech attacker
    G.hand.p = hand('pe_sage', 'ma_samurai', 'stop_bushi');                         // none of these beats tech
    expect(G.hand.p.some(i => advOf(MON[i.id].cat, foe.cat) > 1)).toBe(false);
    const uid = script.ensureAdvantage(foe);
    const card = G.hand.p.find(i => i.uid === uid);
    expect(card).toBeTruthy(); expect(BEATS[MON[card.id].cat]).toBe('tech');
    expect(G.hand.p).toHaveLength(3);
  });
  it('suggests the strongest attacker and the best blocker', () => {
    const G = fresh(); G.hand.p = hand('pe_sage', 'gamma_tyrant', 'moat_lord');
    expect(G.hand.p.find(i => i.uid === script.suggestCard('attack')).id).toBe('gamma_tyrant');
    G.foeCard = MON.boll_dragon;
    const best = G.hand.p.reduce((a, b) => (MON[b.id].def * advOf(MON[b.id].cat, 'tech') > MON[a.id].def * advOf(MON[a.id].cat, 'tech') ? b : a));
    expect(script.suggestCard('defend')).toBe(best.uid);
  });
});
