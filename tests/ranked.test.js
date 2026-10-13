// 排位賽 rules: tiers, points from result + performance, tier protection, deck cap, seasons and card backs; market events.
import { describe, it, expect, beforeEach } from 'vitest';
import * as Ranked from '../src/js/ranked.js';
import * as Daily from '../src/js/daily.js';
import * as Market from '../src/js/market.js';
import { MON } from '../src/js/cards.js';
import { COL } from '../src/js/collection.js';
import { MONSTERS } from '../src/js/carddata.js';
import { fresh } from './helpers.js';

const at = key => Ranked.setClock(() => new Date(`${key}-15T12:00:00`));
beforeEach(() => { for (const k of [Ranked.RANK_KEY, Daily.PROFILE_KEY, Daily.DAILY_KEY]) localStorage.removeItem(k); Daily.load(); at('2026-10'); Ranked.load(); });

describe('ranked points', () => {
  it('scores performance from knowledge, strategy and risk management', () => {
    expect(Ranked.performance({ total: 10, correct: 10, atk: 4, smartAtk: 4, defChances: 3, smartDef: 3, lpLeft: 1, maxHit: 0 }).score).toBe(100);
    const p = Ranked.performance({ total: 10, correct: 5, atk: 4, smartAtk: 2, defChances: 0, smartDef: 0, lpLeft: 0.4, maxHit: 3500 });
    expect(p).toEqual({ score: 20 + 18 + 6 + 5, knowledge: 20, strategy: 18, risk: 11 });     // no block chance: attacks carry all 35
    expect(Ranked.performance({ total: 4, correct: 4, atk: 2, smartAtk: 0, defChances: 0, smartDef: 0, lpLeft: 1, maxHit: 0 }).strategy).toBe(0);
  });
  it('points depend on the tier, and performance moves them by up to ±6 around 50', () => {
    Ranked.state().rp = 500;                                          // 操盤手: win 16, loss −20
    expect(Ranked.applyMatch(true, 50).delta).toBe(16); expect(Ranked.applyMatch(true, 100).delta).toBe(22); expect(Ranked.applyMatch(true, 0).delta).toBe(10);
    expect(Ranked.applyMatch(false, 50).delta).toBe(-20); expect(Ranked.applyMatch(false, 100).delta).toBe(-14); expect(Ranked.applyMatch(false, 0).delta).toBe(-26);
    expect(Ranked.state()).toMatchObject({ w: 3, l: 3 });
    Ranked.state().rp = 0; expect(Ranked.applyMatch(true, 50).delta).toBe(22);          // 見習交易員 is generous
    Ranked.state().rp = 1500; expect(Ranked.applyMatch(true, 50).delta).toBe(10); expect(Ranked.applyMatch(false, 50).delta).toBe(-24);
  });
  it('higher tiers face stronger opponents, never chosen by collection', () => {
    const lv = rp => { Ranked.state().rp = rp; return Ranked.opponent(); };
    expect(lv(0)).toMatchObject({ diff: 'easy', boost: 0 });
    expect(lv(300)).toMatchObject({ diff: 'normal' });
    expect(lv(500)).toMatchObject({ diff: 'hard', boost: 0 });
    expect(lv(1500)).toMatchObject({ diff: 'hard', boost: 18, block: 0.18 });
    for (let i = 1; i < Ranked.TIERS.length; i++) {                 // the break-even win rate rises tier by tier
      const be = t => -t.loss / (t.win - t.loss);
      expect(be(Ranked.TIERS[i])).toBeGreaterThan(be(Ranked.TIERS[i - 1]));
    }
  });
  it('promotes across tier lines and protects the first three tiers from demotion', () => {
    Ranked.state().rp = 95;
    const up = Ranked.applyMatch(true, 50); expect(up.promoted).toBe(true); expect(Ranked.tier().name).toBe('初級分析師');
    Ranked.state().rp = 105;
    const down = Ranked.applyMatch(false, 0); expect(down).toMatchObject({ shielded: true, after: 100, demoted: false });
    Ranked.state().rp = 460;                                         // 操盤手 is not protected
    expect(Ranked.applyMatch(false, 0)).toMatchObject({ demoted: true, after: 434 });
  });
  it('an abandoned ranked duel counts as a loss', () => {
    Ranked.state().rp = 300; Ranked.begin();
    expect(Ranked.forfeitIfActive().delta).toBe(-25); expect(Ranked.forfeitIfActive()).toBeNull();
  });
});

describe('ranked decks', () => {
  it('cost N 1 · R 2 · SR 3 · UR 5, and the starter deck fits the cap exactly', () => {
    const r = id => MONSTERS.find(m => m.rank === id).id;
    expect(Ranked.deckCost([r(1), r(2), r(3), r(4)])).toBe(11);
    expect(Ranked.deckCost(Ranked.rankedDeck())).toBeLessThanOrEqual(Ranked.DECK_CAP);
  });
  it('builds a legal 40-card deck from a full collection', () => {
    const own = COL.owned; COL.owned = MONSTERS.map(m => m.id);
    const d = Ranked.rankedDeck(); COL.owned = own;
    expect(d).toHaveLength(40); expect(Ranked.deckOk(d)).toBe(true);
    expect(d.some(id => MON[id].rank >= 3)).toBe(true);              // it does use rare cards, within the cap
  });
});

describe('seasons', () => {
  it('rewards the peak tier of a played season, soft-resets two tiers down, and grants backs and a title', () => {
    Ranked.state().rp = 470; Ranked.applyMatch(true, 50);           // 操盤手, played
    at('2026-11');
    const r = Ranked.checkSeason();
    expect(r.peak).toBe(3); expect(r.title.name).toBe('2026 年 10 月賽季・操盤手');
    expect(r.backs).toEqual(expect.arrayContaining(['default', 'silver', 'seigaiha', 'gold', 's-2026-10']));
    expect(Ranked.state()).toMatchObject({ season: '2026-11', rp: 100, w: 0, l: 0 });
    expect(Daily.profile().titles).toContain('season-2026-10'); expect(Daily.titleName('season-2026-10')).toBe(r.title.name);
    expect(Ranked.takePending()).toBe(r); expect(Ranked.takePending()).toBeNull();
    expect(Ranked.setBack('s-2026-10')).toBe(true); expect(Ranked.setBack('legend')).toBe(false);
  });
  it('an unplayed season gives nothing but still rolls over', () => {
    at('2026-11'); expect(Ranked.checkSeason()).toBeNull(); expect(Ranked.state().season).toBe('2026-11');
  });
});

describe('market events', () => {
  it('start on turn 2, change every 3 turns, never repeat back to back, and raise / lower attack by attribute', () => {
    const G = fresh(); Market.enable();
    expect(Market.onTurn(1)).toBeNull(); expect(Market.attackMult('fx')).toBe(1);
    const e = Market.onTurn(2); expect(e).toBeTruthy();
    expect(Market.attackMult(e.up[0])).toBe(Market.EVENT_UP); expect(Market.attackMult(e.down)).toBe(Market.EVENT_DOWN);
    expect(Market.onTurn(3)).toBeNull(); expect(Market.onTurn(4)).toBeNull();
    const e2 = Market.onTurn(5); expect(e2.id).not.toBe(e.id);
    G.market = null; expect(Market.attackMult(e2.up[0])).toBe(1);       // tutorial / no events
  });
  it('every event is also a 事件卡 in the knowledge collection', async () => {
    const K = await import('../src/js/knowledge.js');
    for (const e of Market.EVENTS) expect(K.byId(e.card), e.id).toBeTruthy();
  });
});

describe('ranked deck at the door', () => {
  it('uses your deck when it is legal, otherwise a legal one for that duel only', () => {
    COL.owned = MONSTERS.map(m => m.id);
    const urs = MONSTERS.filter(m => m.rank === 4).map(m => m.id), srs = MONSTERS.filter(m => m.rank === 3).map(m => m.id);
    const big = [...urs, ...urs, ...srs].slice(0, 40);
    const r = Ranked.deckForRanked(big);
    expect(r.auto).toBe(true); expect(r.list).toHaveLength(40); expect(Ranked.deckCost(r.list)).toBeLessThanOrEqual(Ranked.DECK_CAP);
    const legal = Ranked.rankedDeck();
    expect(Ranked.deckForRanked(legal)).toEqual({ list: legal, auto: false });
    expect(Ranked.deckForRanked([]).auto).toBe(true);
  });
});
