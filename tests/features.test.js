import { OWN_IDS } from '../src/js/card-art.js';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MON, MONSTERS, cardHTML } from '../src/js/cards.js';
import { urArt, UR_IDS } from '../src/js/ur-art.js';
import { DIFFS } from '../src/js/core.js';
import * as calc from '../src/js/calc.js';
import { foeQuestion, freshPick } from '../src/js/quiz.js';
import { staleness, monthsSince } from '../src/js/feedback.js';
import { collectProgress, parseProgress, applyProgress } from '../src/js/progress.js';
import { Tutor } from '../src/js/tutor.js';
import { fresh, hand } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

describe('opponent block', () => {
  it('picks the hand card with the best DEF × advantage and only lets damage − DEF through', () => {
    const G = fresh({ diff: DIFFS.hard }); G.hand.c = hand('ma_samurai', 'insurance_miko', 'sortino_keep');
    vi.spyOn(Math, 'random').mockReturnValue(0);                       // smart pick, block succeeds
    const b = calc.foeBlock(MON.boll_dragon, 2700);                     // tech attack: 資金管理 beats tech → insurance_miko DEF 1400 × 1.5
    expect(b.card.id).toBe('insurance_miko'); expect(b.def).toBe(2100); expect(b.ok).toBe(true); expect(b.dmg).toBe(600);
    expect(G.hand.c.map(i => i.id)).toEqual(['ma_samurai', 'sortino_keep']);
  });
  it('stops at zero (never reflects), does nothing when it answers wrong, and needs a card', () => {
    let G = fresh(); G.hand.c = hand('sortino_keep');                   // DEF 2300 vs a fund attack: neutral
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calc.foeBlock(MON.pe_sage, 1200)).toMatchObject({ ok: true, dmg: 0, reflect: 0 });
    vi.restoreAllMocks(); G = fresh(); G.hand.c = hand('sortino_keep');
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(calc.foeBlock(MON.pe_sage, 1200)).toMatchObject({ ok: false, dmg: 1200, reflect: 0 });
    fresh(); expect(calc.foeBlock(MON.pe_sage, 1200)).toBeNull();
  });
  it('blocks more often on harder levels', () => { expect(calc.FOE_BLOCK.easy).toBeLessThan(calc.FOE_BLOCK.normal); expect(calc.FOE_BLOCK.normal).toBeLessThan(calc.FOE_BLOCK.hard); });
});

describe('question choice across duels', () => {
  const qs = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id }));
  it('prefers questions never asked', () => {
    const seen = { a: { t: 3, last: 1 }, b: { t: 1, last: 5 }, c: { t: 2, last: 2 }, d: { t: 1, last: 9 } };
    for (let i = 0; i < 30; i++) expect(freshPick(qs, seen).id).toBe('e');
  });
  it('then the least-asked, longest-ago ones', () => {
    const seen = { a: { t: 2, last: 1 }, b: { t: 1, last: 50 }, c: { t: 1, last: 10 }, d: { t: 1, last: 20 }, e: { t: 1, last: 5 } };
    const got = new Set(); for (let i = 0; i < 60; i++) got.add(freshPick(qs, seen).id);
    expect([...got].sort()).toEqual(['c', 'd', 'e']);
  });
});

describe('time-sensitive questions', () => {
  const now = new Date(2027, 0, 15);
  it('counts months', () => { expect(monthsSince('2026-10', now)).toBe(3); });
  it('flags data older than six months, or past its review month', () => {
    expect(staleness({ asOf: '2026-10' }, now)).toBe('');
    expect(staleness({ asOf: '2026-06' }, now)).toBe('old');
    expect(staleness({ asOf: '2026-10', reviewBy: '2026-12' }, now)).toBe('review');
    expect(staleness({}, now)).toBe('');
  });
});

describe('progress file', () => {
  it('round-trips every saved key, skipping backups, and keeps the old data as a backup', () => {
    localStorage.clear();
    localStorage.setItem('soba-ketto.deck.v1', '["x"]'); localStorage.setItem('soba-ketto.deck.v1.backup', 'old'); localStorage.setItem('other', 'y');
    const file = JSON.stringify(collectProgress());
    const o = parseProgress(file); expect(Object.keys(o.data)).toEqual(['soba-ketto.deck.v1']);
    localStorage.setItem('soba-ketto.deck.v1', '["mine"]');
    expect(applyProgress(o)).toBe(1);
    expect(localStorage.getItem('soba-ketto.deck.v1')).toBe('["x"]'); expect(localStorage.getItem('soba-ketto.deck.v1.backup')).toBe('["mine"]');
    expect(localStorage.getItem('other')).toBe('y');
  });
  it('rejects files that are not progress files', () => {
    expect(() => parseProgress('nope')).toThrow(/JSON/);
    expect(() => parseProgress('{"app":"x","data":{}}')).toThrow(/不是/);
    expect(() => parseProgress('{"app":"financial-duel","format":99,"data":{"soba-ketto.a":"1"}}')).toThrow(/較新/);
    expect(() => parseProgress('{"app":"financial-duel","format":1,"data":{"evil":"1"}}')).toThrow(/不符/);
  });
});

describe('one-time tips', () => {
  it('shows each tip once', () => {
    localStorage.removeItem('soba-ketto.tips.v1');
    expect(Tutor.tip('record')).toBe(true); expect(Tutor.tip('record')).toBe(false);
    expect(document.getElementById('tipbox').textContent).toContain('學習紀錄');
    expect(Tutor.tip('no-such-tip')).toBe(false);
  });
});

describe('opponent profile and answering', () => {
  it('gets two strong and two weak attributes, all different', () => {
    for (let i = 0; i < 50; i++) {
      const p = calc.foeProfile(); const all = [...p.strong, ...p.weak];
      expect(p.strong).toHaveLength(2); expect(p.weak).toHaveLength(2); expect(new Set(all).size).toBe(4);
    }
  });
  it('answers ±15% in those attributes, around the level\'s base rate', () => {
    fresh({ diff: DIFFS.normal, foeProf: { strong: ['tech', 'fund'], weak: ['deriv', 'risk'] } });
    expect(calc.foeAcc('tech')).toBeCloseTo(calc.FOE_BLOCK.normal + calc.FOE_FORTE);
    expect(calc.foeAcc('risk')).toBeCloseTo(calc.FOE_BLOCK.normal - calc.FOE_FORTE);
    expect(calc.foeAcc('etf')).toBeCloseTo(calc.FOE_BLOCK.normal);
  });
  it('blocks a weak-attribute attack less often, and counts its answers', () => {
    const G = fresh({ diff: DIFFS.normal, foeProf: { strong: ['tech', 'fund'], weak: ['deriv', 'risk'] } });
    vi.spyOn(Math, 'random').mockReturnValue(0.42);                     // 0.42 < 0.65 (strong) but ≥ 0.35 (weak)
    G.hand.c = hand('ma_samurai'); expect(calc.foeBlock(MON.boll_dragon, 1000)).toMatchObject({ ok: true });
    G.hand.c = hand('ma_samurai'); expect(calc.foeBlock(MON.gamma_tyrant, 1000)).toMatchObject({ ok: false });
    expect(G.foeStats).toEqual({ t: 2, c: 1 });
  });
  it('asks the opponent a question of the attacking attribute, and keeps it from us for the rest of the duel', () => {
    const G = fresh(); G.used = new Set();
    const q = foeQuestion('fx', 3); expect(q.category).toBe('fx'); expect(G.used.has(q.id)).toBe(true);
  });
});

describe('card art by rarity', () => {
  it('every ★4 card has its own illustration, and no two are the same', () => {
    const ur = MONSTERS.filter(m => m.rank === 4);
    expect(ur.map(m => m.id).sort()).toEqual([...UR_IDS].sort());
    const arts = ur.map(m => urArt(m)); expect(arts.every(a => a.includes('class="scene ur"'))).toBe(true);
    expect(new Set(arts).size).toBe(ur.length);
    expect(cardHTML(MON.gamma_tyrant)).toContain('c-art-ur');
  });
  it('★3 cards show a crest with their sigil; ★1–2 keep the shared scenes', () => {
    const plain = m => !OWN_IDS.includes(m.id);          // cards without an exclusive illustration yet (card-art.js)
    const sr = MONSTERS.find(m => m.rank === 3 && plain(m)), n = MONSTERS.find(m => m.rank === 1 && plain(m));
    expect(cardHTML(sr)).toContain('c-crest'); expect(cardHTML(sr)).toContain(sr.sigil);
    expect(cardHTML(n)).not.toContain('c-crest'); expect(cardHTML(n)).not.toContain('c-art-ur');
  });
});
