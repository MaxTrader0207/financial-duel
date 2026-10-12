import { describe, it, expect, beforeEach } from 'vitest';
import { Store, ID_RENAMES } from '../src/js/core.js';
import { migrateSave, SAVE_V, serializeGame, readSave, SAVE_KEY } from '../src/js/save.js';
import { fitDeck, autoDeck, deckValid, DECK_SIZE } from '../src/js/collection.js';
import { MONSTERS } from '../src/js/cards.js';
import { fresh } from './helpers.js';

beforeEach(() => { localStorage.clear(); Store.issues.length = 0; });

describe('Store', () => {
  const spec = { version: 2, fallback: () => [], validate: Array.isArray, migrate: { 0: d => d.map(x => x * 10), 1: d => d.concat('v2') } };
  it('runs legacy data (no version recorded) through every migration and records the version', () => {
    localStorage.setItem('k', JSON.stringify([1, 2]));
    expect(Store.load('k', spec)).toEqual([10, 20, 'v2']);
    expect(Store.meta.k).toBe(2);
    expect(JSON.parse(localStorage.getItem('k'))).toEqual([10, 20, 'v2']);
    expect(Store.load('k', spec)).toEqual([10, 20, 'v2']);       // already current: unchanged
  });
  it('backs up data it cannot read instead of dropping it', () => {
    localStorage.setItem('bad', '{oops'); expect(Store.load('bad', spec)).toEqual([]);
    expect(localStorage.getItem('bad.backup')).toBe('{oops');
    localStorage.setItem('obj', '{"a":1}'); expect(Store.load('obj', spec)).toEqual([]);
    expect(Store.issues.map(i => i.key)).toEqual(['bad', 'obj']);
  });
  it('refuses data written by a newer version', () => {
    Store.save('new', 9, [1]); expect(Store.load('new', spec)).toEqual([]); expect(Store.issues[0].why).toMatch(/較新/);
  });
});

describe('duel save versions', () => {
  const v1 = () => ({ v: 1, savedAt: '2026-10-01T00:00:00Z', diffKey: 'normal', lp: { p: 9000, c: 8000 }, deck: { p: [{ uid: 1, id: 'old_card' }], c: [] },
    hand: { p: [{ uid: 2, id: 'ma_samurai' }], c: [] }, turn: 3, phase: 'attack', used: [], streak: 0, maxStreak: 1, stats: { total: 2, correct: 1, byCat: {} }, startedAt: '2026-10-01T00:00:00Z' });
  it('upgrades a v1 save to the current version with defaults for new fields', () => {
    const d = migrateSave(v1());
    expect(d.v).toBe(SAVE_V); expect(d.deckList).toBeNull(); expect(d.weak).toBeNull();
    expect(d.mods).toEqual({ myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false }); expect(d.flags).toEqual({});
  });
  it('follows renamed card ids', () => {
    ID_RENAMES.old_card = 'vol_ghost';
    try { expect(migrateSave(v1()).deck.p[0].id).toBe('vol_ghost'); } finally { delete ID_RENAMES.old_card; }
  });
  it('rejects saves without a version or from a newer release', () => {
    expect(() => migrateSave({ deck: {} })).toThrow(); expect(() => migrateSave({ ...v1(), v: SAVE_V + 1 })).toThrow(/較新/);
  });
  it('round-trips a duel through localStorage', () => {
    const G = fresh(); G.phase = 'attack';
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame()));
    const d = readSave(); expect(d.v).toBe(SAVE_V); expect(d.lp).toEqual(G.lp); expect(d.hand).toEqual(G.hand); expect(d.deckList).toEqual(G.deckList);
  });
  it('moves an unreadable save aside', () => {
    localStorage.setItem(SAVE_KEY, '{"v":1,"deck":'); expect(readSave()).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull(); expect(localStorage.getItem(SAVE_KEY + '.backup')).toBe('{"v":1,"deck":');
  });
});

describe('decks', () => {
  it('auto-builds a valid 40-card deck', () => { const d = autoDeck(); expect(d).toHaveLength(DECK_SIZE); expect(deckValid(d)).toBe(true); });
  it('tops up an old 30-card deck and keeps its cards', () => {
    const old = MONSTERS.filter(m => m.rank <= 2).slice(0, 30).map(m => m.id);
    const d = fitDeck(old); expect(deckValid(d)).toBe(true); expect(old.every(id => d.includes(id))).toBe(true);
  });
  it('drops copies beyond the limit and cards you do not own', () => {
    const d = fitDeck(['ma_samurai', 'ma_samurai', 'ma_samurai', 'gamma_tyrant']);
    expect(d.filter(x => x === 'ma_samurai')).toHaveLength(2); expect(d).not.toContain('gamma_tyrant'); expect(deckValid(d)).toBe(true);
  });
});
