// 金融知識卡: data shape, starter cards, unlocking (daily / shards), levelling up with a check question, titles.
import { describe, it, expect, beforeEach } from 'vitest';
import * as Daily from '../src/js/daily.js';
import * as K from '../src/js/knowledge.js';
import { DATA } from '../src/js/data.js';

beforeEach(() => {
  for (const k of [K.KNOW_KEY, Daily.DAILY_KEY, Daily.PROFILE_KEY]) localStorage.removeItem(k);
  Daily.load(); K.load();
});

describe('knowledge.json', () => {
  it('has 25 cards of each kind, 3 explanation levels and 2 check questions each', () => {
    const cards = DATA.knowledge.cards;
    expect(cards).toHaveLength(100);
    for (const t of ['stock', 'defense', 'event', 'trap']) expect(cards.filter(c => c.type === t)).toHaveLength(25);
    expect(new Set(cards.map(c => c.id)).size).toBe(100);
    expect(new Set(cards.map(c => c.name)).size).toBe(100);
    for (const c of cards) expect(c.id.startsWith({ stock: 'stk_', defense: 'def_', event: 'evt_', trap: 'trap_' }[c.type]), c.id).toBe(true);
    for (const c of cards) {
      expect(c.levels.map(l => l.title), c.id).toEqual(['是什麼', '實際例子', '常見誤區']);
      expect(c.levels.every(l => l.text.length > 40), c.id).toBe(true);
      expect(c.quiz, c.id).toHaveLength(2);
      for (const q of c.quiz) { expect(new Set(q.options).size).toBe(4); expect(q.answer >= 0 && q.answer < 4).toBe(true); }
    }
  });
  it('every daily scenario links to an existing card', () => {
    for (const s of DATA.daily) expect(K.byId(s.card), s.id).toBeTruthy();
  });
});

describe('knowledge cards', () => {
  it('a new player starts with the 4 starter cards at Lv1, marked new', () => {
    const s = K.stats();
    expect(s.owned).toBe(4); expect(s.fresh).toBe(4);
    for (const id of DATA.knowledge.starter) { expect(K.lv(id)).toBe(1); expect(K.isNew(id)).toBe(true); }
    K.markSeen('def_emergency'); expect(K.isNew('def_emergency')).toBe(false);
    K.load(); expect(K.stats().owned).toBe(4);                        // starters are granted once
  });
  it('finishing a daily challenge unlocks its linked card once', () => {
    const s = DATA.daily.find(d => !DATA.knowledge.starter.includes(d.card));
    expect(K.onDailyFinished(s).card.id).toBe(s.card); expect(K.lv(s.card)).toBe(1);
    expect(K.onDailyFinished(s)).toBeNull();
  });
  it('unlocks a card with shards only when there are enough', () => {
    expect(K.buy('stk_growth')).toBeNull();
    Daily.addShards(K.UNLOCK_COST);
    expect(K.buy('stk_growth')).toBeTruthy(); expect(K.lv('stk_growth')).toBe(1); expect(Daily.profile().shards).toBe(0);
    expect(K.buy('stk_growth')).toBeNull();
  });
  it('levels up with a right answer and shards; a wrong answer costs nothing', () => {
    const id = 'def_emergency', q1 = K.checkFor(id);
    expect(K.upgrade(id, q1.answer)).toEqual({ ok: false, reason: 'shards' });
    Daily.addShards(100);
    expect(K.upgrade(id, (q1.answer + 1) % 4)).toMatchObject({ ok: false, reason: 'wrong' });
    expect(Daily.profile().shards).toBe(100);
    expect(K.upgrade(id, q1.answer)).toMatchObject({ ok: true, lv: 2 }); expect(Daily.profile().shards).toBe(100 - K.UPGRADE_COST[0]);
    expect(K.checkFor(id)).toBe(DATA.knowledge.cards.find(c => c.id === id).quiz[1]);
    expect(K.upgrade(id, K.checkFor(id).answer)).toMatchObject({ ok: true, lv: 3 });
    expect(K.checkFor(id)).toBeNull(); expect(K.upgrade(id, 0)).toBeNull(); expect(K.stats().mastered).toBe(1);
  });
  it('collecting every card of a kind unlocks its title', () => {
    Daily.addShards(1000);
    const stocks = DATA.knowledge.cards.filter(c => c.type === 'stock').map(c => c.id);
    const got = stocks.map(id => K.buy(id).titles).flat();
    expect(got).toContain('k_stock'); expect(Daily.profile().titles).toContain('k_stock');
  });
  it('a duel win adds shards, and the first win of the day draws a card from the least collected kind', () => {
    const first = K.onDuelWin();
    expect(first.shards).toBe(K.DUEL_WIN_SHARDS); expect(Daily.profile().shards).toBe(K.DUEL_WIN_SHARDS);
    expect(first.card).toBeTruthy(); expect(K.lv(first.card.id)).toBe(1);
    expect(first.card.type).toBe('stock');                          // starters: 2 defense, 1 event, 1 trap → stock is emptiest
    expect(K.onDuelWin().card).toBeNull();                          // second win the same day: shards only
    Daily.setClock(() => new Date('2026-10-14T12:00:00'));
    expect(K.onDuelWin().card).toBeTruthy();
    Daily.setClock();
  });
});
