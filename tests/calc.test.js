import { describe, it, expect, afterEach, vi } from 'vitest';
import { MON, MONSTERS } from '../src/js/cards.js';
import { DIFFS, foeAtkOf } from '../src/js/core.js';
import * as calc from '../src/js/calc.js';
import { fresh, noLuck, allLuck, hand } from './helpers.js';

const FAST = { time: 1, left: 19, retried: false }, SLOW = { time: 15, left: 5, retried: false };
afterEach(() => vi.restoreAllMocks());

describe('attack rules', () => {
  it('deals ATK, +300 when fast, +500 from a 3-chain, consumes a stored bonus', () => {
    fresh(); const m = MON.vol_ghost;                       // ATK 1300, no hit skill
    expect(calc.attackHit(m, SLOW).dmg).toBe(1300);
    expect(calc.attackHit(m, FAST).dmg).toBe(1600);
    const G = fresh({ streak: 3 }); expect(calc.attackHit(m, SLOW).dmg).toBe(1800);
    G.mods.myAtk = 500; expect(calc.attackHit(m, SLOW).dmg).toBe(2300); expect(G.mods.myAtk).toBe(0);
  });
  it('applies the weak-category ×1.2 and the retry ×0.5 (retry never counts as fast)', () => {
    fresh({ weak: 'tech' }); expect(calc.attackHit(MON.vol_ghost, FAST).dmg).toBe(Math.round(1600 * 1.2));
    fresh(); expect(calc.attackHit(MON.vol_ghost, { time: 1, left: 19, retried: true }).dmg).toBe(650);
  });
  it('a missed attack does nothing unless the card says so', () => {
    fresh(); expect(calc.attackMiss(MON.vol_ghost)).toEqual({ dmg: 0, backlash: 0, heal: 0, fired: false });
    expect(calc.attackMiss(MON.delta_archer).dmg).toBe(650);
    expect(calc.attackMiss(MON.gamma_tyrant).backlash).toBe(500);
  });
});

describe('defence rules', () => {
  it('uses the attacker\'s effective ATK with the difficulty multiplier and stored penalties', () => {
    const G = fresh({ diff: DIFFS.hard }); expect(foeAtkOf(MON.boll_dragon)).toBe(2340);
    G.mods.foeAtk = -400; const s = calc.defendSetup(MON.ma_samurai, MON.boll_dragon);
    expect(s.atk).toBe(1940); expect(s.atkTags).toEqual(['追繳 -400']); expect(G.mods.foeAtk).toBe(0);
  });
  it('halves DEF when the attacker beats the defender and lets the rest pierce', () => {
    fresh(); const m = MON.stop_bushi, foe = MON.boll_dragon;   // risk 1400 vs tech 1800: tech beats risk
    const s = calc.defendSetup(m, foe); expect(s.adv).toBe(0.5); expect(s.def).toBe(700);
    expect(calc.defendOk(m, s, SLOW).pierce).toBe(1100);
    expect(calc.defendFail(m, foe, s).dmg).toBe(900);          // 停損: damage halved
  });
  it('raises DEF ×1.5 when the defender beats the attacker and reflects the surplus', () => {
    fresh(); const m = MON.insurance_miko, foe = MON.boll_dragon;  // 資金管理 1400 vs tech 1800: 資金管理 beats tech
    const s = calc.defendSetup(m, foe); expect(s.def).toBe(2100);
    expect(calc.defendOk(m, s, SLOW)).toMatchObject({ pierce: 0, reflect: 300 });
  });
  it('a retried block lets at least half the attack through', () => {
    fresh(); const s = calc.defendSetup(MON.moat_lord, MON.boll_dragon);
    expect(calc.defendOk(MON.moat_lord, s, { retried: true }).pierce).toBe(900);
  });
  it('the attacker\'s hit skill fires on a failed block', () => {
    fresh(); const s = calc.defendSetup(MON.ma_samurai, MON.gamma_tyrant);
    const out = calc.defendFail(MON.ma_samurai, MON.gamma_tyrant, s); expect(out.foeFired).toBe(true); expect(out.dmg).toBe(4000);
  });
});

describe('conditional skills', () => {
  const hit = (id, r = SLOW) => calc.attackHit(MON[id], r);
  it('turn, LP and hand conditions', () => {
    fresh({ turn: 6 }); expect(hit('head_shoulder').dmg).toBe(1900);
    fresh({ turn: 4 }); expect(hit('head_shoulder').dmg).toBe(1300);
    fresh({ lp: { p: 10000, c: 8000 } }); expect(hit('trendline_ranger').dmg).toBe(1750);
    const G = fresh(); G.hand.p = hand('ma_samurai'); expect(hit('dow_elder').dmg).toBe(2520);
    fresh({ turn: 8 }); expect(hit('halving_phoenix').dmg).toBe(4500);
    fresh({ turn: 2 }); expect(hit('theme_comet').dmg).toBe(3420);
    fresh({ lp: { p: 10000, c: 6000 } }); expect(hit('nav_engine').dmg).toBe(4600);
    fresh({ lp: { p: 10000, c: 3000 } }); expect(hit('auction_bell').dmg).toBe(1600); expect(hit('margin_crow').dmg).toBe(1960);
  });
  it('accuracy and history conditions', () => {
    fresh({ stats: { total: 10, correct: 7, byCat: {} } }); expect(hit('roe_knight').dmg).toBe(1690);
    fresh({ stats: { total: 10, correct: 5, byCat: {} } }); expect(hit('majority_hydra').dmg).toBe(2200);
    fresh({ history: [{ mode: 'attack', correct: true }, { mode: 'defend', correct: true }, { mode: 'attack', correct: true }] }); expect(hit('compound_dragon').dmg).toBe(2300);
  });
  it('speed conditions only count our own fast answers', () => {
    fresh(); expect(hit('gann_oracle', { time: 1, left: 20, retried: false }).dmg).toBe(Math.round((2100 + 300) * 1.6));
    fresh(); expect(hit('boll_dragon', FAST).dmg).toBe(2700);   // ×1.5 replaces the +300
  });
  it('chance skills', () => {
    fresh(); noLuck(); expect(hit('black_swan').dmg).toBe(1500);
    vi.restoreAllMocks(); fresh(); allLuck(); expect(hit('black_swan').dmg).toBe(4500);
  });
  it('defence-side conditions', () => {
    fresh({ lp: { p: 4000, c: 10000 } }); expect(calc.defendSetup(MON.pb_guard, MON.ma_samurai).defBonus).toBe(600);
    fresh({ turn: 20 }); expect(calc.defendSetup(MON.hodl_turtle, MON.ma_samurai).defBonus).toBe(600);
    let G = fresh({ lp: { p: 1500, c: 10000 } }); let s = calc.defendSetup(MON.ruin_judge, MON.ma_samurai);
    s.atk = 1800; expect(calc.defendFail(MON.ruin_judge, MON.ma_samurai, s).dmg).toBe(500);
    expect(calc.defendFail(MON.ruin_judge, MON.ma_samurai, s).dmg).toBe(1800);   // once per duel
    G = fresh(); G.hand.p = hand('ma_samurai', 'stop_bushi', 'pip_sprite'); s = calc.defendSetup(MON.global_fleet, MON.boll_dragon);
    expect(calc.defendFail(MON.global_fleet, MON.boll_dragon, s).dmg).toBe(1800 - 750);
  });
  it('opponent-side effects land on the right side', () => {
    let G = fresh(); const s = calc.defendSetup(MON.ma_samurai, MON.leverage_kraken);
    calc.defendFail(MON.ma_samurai, MON.leverage_kraken, s); expect(G.mods.myAtk).toBe(-300);
    G = fresh(); const s2 = calc.defendSetup(MON.ma_samurai, MON.onchain_whale);
    calc.defendFail(MON.ma_samurai, MON.onchain_whale, s2); expect(G.mods.skipMe).toBe(true);
  });
});

/* every card × five situations, frozen as a snapshot: any change to a card's numbers shows up in review */
describe('all cards', () => {
  it('matches the recorded outcomes', () => {
    const rows = {};
    for (const m of MONSTERS) {
      noLuck();
      const row = {};
      let G = fresh(); row.hitFast = calc.attackHit(m, FAST); row.hitFastMods = { ...G.mods };
      fresh(); row.hitSlow = calc.attackHit(m, SLOW).dmg;
      fresh(); row.miss = calc.attackMiss(m);
      G = fresh(); let s = calc.defendSetup(m, MON.boll_dragon); row.def = s.def; row.ok = calc.defendOk(m, s, SLOW); row.okMods = { ...G.mods };
      fresh(); s = calc.defendSetup(m, MON.boll_dragon); row.fail = calc.defendFail(m, MON.boll_dragon, s);
      rows[m.id] = row;
      vi.restoreAllMocks();
    }
    expect(rows).toMatchSnapshot();
  });
});
