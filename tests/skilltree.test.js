// 卡牌技能族譜: every card sits in the tree, the deck analysis counts right, the wish list only lists missing cards.
import { describe, it, expect } from 'vitest';
import { buildTree, familiesOf, FAMILIES, beaterOf } from '../src/js/skilltree.js';
import { MONSTERS, CATS } from '../src/js/carddata.js';
import { BEATS } from '../src/js/rules.js';

const ids = cat => MONSTERS.filter(m => m.cat === cat).map(m => m.id);
const noAcc = Object.fromEntries(Object.keys(CATS).map(k => [k, { t: 0, rate: null }]));

describe('skill families', () => {
  it('every card has a known family, and every family has cards', () => {
    const known = new Set(FAMILIES.map(f => f.id)), used = new Set();
    for (const m of MONSTERS) { const f = familiesOf(m.id); expect(f.length).toBeGreaterThan(0); f.forEach(x => expect(known.has(x)).toBe(true)); used.add(f[0]); }
    expect(used.size).toBe(FAMILIES.length);
  });
  it('beaterOf is the inverse of BEATS', () => { for (const k of Object.keys(CATS)) expect(BEATS[beaterOf(k)]).toBe(k); });
});

describe('buildTree', () => {
  it('places all 180 cards once and counts owned / in deck', () => {
    const owned = [...ids('tech'), ...ids('fund').slice(0, 5)];
    const deck = ids('tech').flatMap(id => [id, id]);
    const T = buildTree({ deck, owned, acc: noAcc });
    const all = T.clans.flatMap(c => c.families.flatMap(f => f.cards.map(x => x.id)));
    expect(all.length).toBe(MONSTERS.length); expect(new Set(all).size).toBe(MONSTERS.length);
    const tech = T.clans.find(c => c.cat === 'tech');
    expect(tech).toMatchObject({ owned: 20, total: 20, inDeck: 40 });
    expect(T.analysis).toMatchObject({ deckSize: 40, owned: 25, total: 180 });
    expect(T.analysis.cover.find(x => x.by === 'tech').n).toBe(40);
    expect(T.analysis.cover.filter(x => x.n === 0).length).toBe(8);
    expect(T.analysis.weaknesses.some(w => w.includes('沒有能剋制'))).toBe(true);
  });
  it('the wish list holds only missing cards, the counter gaps first', () => {
    const owned = ids('tech'), T = buildTree({ deck: owned.flatMap(i => [i, i]), owned, acc: noAcc });
    const W = T.analysis.wishlist;
    expect(W.length).toBe(8);
    W.forEach(c => expect(owned.includes(c.id)).toBe(false));
    expect(W[0].why.some(w => w.includes('剋制'))).toBe(true);
  });
  it('low accuracy on a heavily used attribute is a weakness', () => {
    const owned = ids('fx'), acc = { ...noAcc, fx: { t: 30, rate: 0.4 } };
    const T = buildTree({ deck: owned.flatMap(i => [i, i]), owned, acc });
    expect(T.analysis.weaknesses.some(w => w.includes('正確率只有 40%'))).toBe(true);
  });
});
