// 知識加成: knowledge card levels → small, capped duel bonuses, applied by calc.js only when G.kb is set
import { describe, it, expect, beforeEach } from 'vitest';
import * as KB from '../src/js/kbonus.js';
import * as K from '../src/js/knowledge.js';
import * as Daily from '../src/js/daily.js';
import * as calc from '../src/js/calc.js';
import { G } from '../src/js/game.js';
import { MON, MONSTERS } from '../src/js/cards.js';
import { DATA } from '../src/js/data.js';
import { fresh } from './helpers.js';

describe('knowledge bonus rules', () => {
  it('every 15 knowledge points is a level, at most 5', () => {
    expect([0, 14, 15, 44, 45, 75, 999].map(KB.levelOf)).toEqual([0, 0, 1, 2, 3, 5, 5]);
  });
  it('the effects stay small: at most +4% attack, −4% damage taken, +0.04 on events, −3% enemy blocks', () => {
    const max = { stock: 5, defense: 5, event: 5, trap: 5 };
    expect(KB.attackMult(max)).toBeCloseTo(1.04); expect(KB.damageTakenMult(max)).toBeCloseTo(0.96);
    expect(KB.eventMult(max, 1.2)).toBeCloseTo(1.24); expect(KB.eventMult(max, 0.8)).toBeCloseTo(0.84); expect(KB.eventMult(max, 1)).toBe(1);
    expect(KB.blockCut(max)).toBeCloseTo(0.03);
    expect(KB.attackMult({ stock: 99 })).toBeCloseTo(1.04);              // a tampered save cannot go past the cap
    expect(KB.attackMult(undefined)).toBe(1); expect(KB.blockCut(null)).toBe(0);
  });
  it('points come from the level of each collected card, per kind', () => {
    for (const k of [K.KNOW_KEY, Daily.PROFILE_KEY]) localStorage.removeItem(k);
    Daily.load(); K.load();
    expect(K.points()).toEqual({ stock: 0, defense: 2, event: 1, trap: 1 });   // the starters: Lv1 each
    Daily.addShards(5000);
    const stocks = DATA.knowledge.cards.filter(c => c.type === 'stock').slice(0, 5);
    for (const c of stocks) { K.buy(c.id); K.upgrade(c.id, c.quiz[0].answer); K.upgrade(c.id, c.quiz[1].answer); }
    expect(K.points().stock).toBe(15); expect(K.bonusLevels().stock).toBe(1);
  });
});

describe('knowledge bonus in the damage rules', () => {
  const m = MONSTERS.find(x => x.rank === 2);
  beforeEach(() => { fresh({ market: null, kb: null }); });
  it('stock levels raise attack damage, with a tag', () => {
    const base = calc.attackHit(MON[m.id], { time: 99, left: 0, retried: false });
    G.kb = { stock: 5 };
    const up = calc.attackHit(MON[m.id], { time: 99, left: 0, retried: false });
    expect(up.dmg).toBe(Math.round(base.dmg * 1.04)); expect(up.tags.join()).toContain('知識 +4%');
  });
  it('trap levels lower the opponent block accuracy', () => {
    G.foeProf = { strong: [], weak: [] };
    const a = calc.foeAcc('tech'); G.kb = { trap: 4 };
    expect(calc.foeAcc('tech')).toBeCloseTo(a - 0.024);
  });
});
