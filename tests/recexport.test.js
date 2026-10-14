// 學習紀錄輸出: the summary numbers and the two CSVs
import { describe, it, expect } from 'vitest';
import { summary, gamesCSV, questionsCSV, MODE_NAME } from '../src/js/recexport.js';
import { DATA } from '../src/js/data.js';

const T0 = new Date('2026-10-01T20:00:00+08:00').getTime();
const recs = [
  { at: T0, mode: 'casual', diff: 'easy', win: true, quit: false, turns: 6, total: 10, correct: 8, maxStreak: 5, dealt: 10000, taken: 4000, byCat: { tech: { t: 6, c: 5 }, fx: { t: 4, c: 3 } } },
  { at: T0 + 864e5, mode: 'ranked', diff: 'normal', win: false, quit: false, turns: 9, total: 12, correct: 6, maxStreak: 3, byCat: { tech: { t: 8, c: 4 }, fx: { t: 4, c: 2 } } },
  { at: T0 + 2 * 864e5, mode: 'casual', diff: 'normal', win: false, quit: true, turns: 2, total: 2, correct: 1, maxStreak: 1, byCat: { money: { t: 2, c: 1 } } },
];
describe('learning record export', () => {
  it('summarises wins, accuracy, modes and difficulties', () => {
    const S = summary(recs, {});
    expect(S).toMatchObject({ n: 3, wins: 1, tot: 24, cor: 15, best: 5 });
    expect(S.byMode.map(g => [g.name, g.n, g.w])).toEqual([[MODE_NAME.casual, 2, 1], [MODE_NAME.ranked, 1, 0]]);
    expect(S.byDiff.find(g => g.k === 'normal')).toMatchObject({ n: 2, w: 0 });
    expect(S.cats).toHaveLength(9);
  });
  it('the duel CSV has one row per duel, with a BOM and per-attribute columns', () => {
    const lines = gamesCSV(recs).split('\r\n');
    expect(lines[0].charCodeAt(0)).toBe(0xFEFF);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('技術分析 答對');
    const d = new Date(T0), p2 = n => String(n).padStart(2, '0');
    expect(lines[1]).toContain(`"${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}"`); expect(lines[1]).toContain('"勝利"'); expect(lines[1]).toContain('"80%"');
    expect(lines[3]).toContain('"投降"');
  });
  it('the question CSV lists answered questions, most missed first', () => {
    const [a, b] = DATA.questions.questions;
    const S = summary(recs, { [a.id]: { t: 3, w: 1 }, [b.id]: { t: 2, w: 2 }, nope: { t: 1, w: 1 } });
    expect(S.answered).toHaveLength(2);
    const lines = questionsCSV(S.answered).split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain(`"${b.id}"`); expect(lines[1]).toContain('"0%"');
    expect(lines[2]).toContain('"67%"');
  });
});
