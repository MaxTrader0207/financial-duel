// 教學中心: every generated question is well-formed, and the answers follow the game's own rules
import { describe, it, expect, beforeEach } from 'vitest';
import * as L from '../src/js/lessons.js';
import * as Daily from '../src/js/daily.js';
import { BEATS, advOf } from '../src/js/rules.js';
import { CATS, MON } from '../src/js/carddata.js';

const seeded = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
describe('lesson questions', () => {
  it('500 runs of every lesson: 3 questions, distinct options, one right answer', () => {
    for (const l of L.LESSONS) for (let i = 1; i <= 500; i++) {
      const qs = L.makeQuestions(l.id, seeded(i * 7919));
      expect(qs.length, l.id).toBe(3);
      for (const q of qs) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.options.map(o => o.text)).size).toBe(q.options.length);
        expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length);
        expect(q.explain).toBeTruthy();
      }
    }
  });
  it('type advantage answers match BEATS, and the best blocker really has the highest effective DEF', () => {
    const name = Object.fromEntries(Object.entries(CATS).map(([k, c]) => [c.name, k]));
    for (let i = 1; i <= 200; i++) {
      const [q1, , q3] = L.makeQuestions('adv', seeded(i * 104729));
      const a = name[/「(.+)」剋制/.exec(q1.prompt)[1]];
      expect(name[q1.options[q1.answer].text]).toBe(BEATS[a]);
      const atk = MON[q3.foe].cat, effs = q3.options.map(o => Math.round(MON[o.card].def * advOf(MON[o.card].cat, atk)));
      expect(effs[q3.answer]).toBe(Math.max(...effs));
    }
  });
  it('damage answers follow attack − defence', () => {
    for (let i = 1; i <= 200; i++) {
      const [q1] = L.makeQuestions('dmg', seeded(i * 31337));
      const [, A, D] = /攻擊力 (\d+).*守備力 (\d+)/.exec(q1.prompt).map(Number);
      expect(Number(q1.options[q1.answer].text)).toBe(A - D);
    }
  });
});
describe('lesson progress', () => {
  beforeEach(() => { localStorage.clear(); Daily.load(); });
  it('passing a lesson the first time pays shards once', () => {
    const s0 = Daily.profile().shards;
    expect(L.finish('adv', 1)).toEqual({ first: false, shards: 0 });
    expect(L.finish('adv', 3)).toEqual({ first: true, shards: L.LESSON_SHARDS });
    expect(L.finish('adv', 3)).toEqual({ first: false, shards: 0 });
    expect(Daily.profile().shards).toBe(s0 + L.LESSON_SHARDS);
    expect(L.passed('adv')).toBe(true); expect(L.doneCount()).toBeGreaterThanOrEqual(1);
  });
});
