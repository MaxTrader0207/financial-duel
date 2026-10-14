// 標題副標: the line under 「你懂多少，就打多重。」 follows the player's state
import { describe, it, expect } from 'vitest';
import { hookLine, ROTATION } from '../src/js/titlehook.js';

const base = { newPlayer: false, ranked: null, weak: null, questions: 900, cards: 180, now: new Date('2026-10-14T10:00:00+08:00') };
describe('hookLine', () => {
  it('first-time players hear what the game teaches', () => {
    expect(hookLine({ ...base, newPlayer: true, weak: { cat: 'fx', rate: 0.4 } }).kind).toBe('new');
  });
  it('a ranked player one or two wins from the next tier is told so', () => {
    const h = hookLine({ ...base, ranked: { played: 3, tier: 0, into: 80, need: 100, next: '初級分析師' }, weak: { cat: 'fx', rate: 0.5 } });
    expect(h).toMatchObject({ kind: 'rank' }); expect(h.text).toContain('再贏 1 場'); expect(h.text).toContain('初級分析師');
    expect(hookLine({ ...base, ranked: { played: 3, tier: 0, into: 10, need: 100, next: '初級分析師' } }).kind).toBe('daily');
    expect(hookLine({ ...base, ranked: { played: 0, tier: 0, into: 90, need: 100, next: '初級分析師' } }).kind).toBe('daily');
  });
  it('the weakest attribute is named with its accuracy', () => {
    const h = hookLine({ ...base, weak: { cat: 'fx', rate: 0.523 } });
    expect(h.kind).toBe('weak'); expect(h.text).toBe('你的弱項是「外匯」，正確率 52%。今天把它拿下？');
  });
  it('otherwise one line a day, with the bank and card counts filled in', () => {
    const seen = new Set();
    for (let i = 0; i < ROTATION.length; i++) seen.add(hookLine({ ...base, now: new Date(base.now.getTime() + i * 864e5) }).text);
    expect(seen.size).toBe(ROTATION.length);
    expect([...seen].some(t => t.includes('900 題、180 張卡'))).toBe(true);
    expect([...seen].every(t => !t.includes('{'))).toBe(true);
  });
});
