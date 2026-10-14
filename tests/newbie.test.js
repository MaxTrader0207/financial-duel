// 新手保護 and the 「改成簡易」 suggestion
import { describe, it, expect, beforeEach } from 'vitest';
import * as N from '../src/js/newbie.js';

const rec = (mode, win, diff = 'normal') => ({ mode, win, diff, total: 5, correct: 2 });
beforeEach(() => { localStorage.clear(); });
describe('newbie', () => {
  it('a 完全新手 has three protected casual duels; others none', () => {
    N.setLevel('new');
    expect(N.protectLeft([])).toBe(3);
    expect(N.protectLeft([rec('tutorial', true), rec('casual', false)])).toBe(2);
    expect(N.protectLeft([rec('casual', 1), rec('casual', 0), rec('ranked', 0), rec('casual', 1)])).toBe(0);
    N.setLevel('some'); expect(N.protectLeft([])).toBe(0);
  });
  it('two casual losses in a row above 簡易 suggest 簡易', () => {
    expect(N.suggestEasier([rec('casual', false), rec('casual', false)], '適中')).toBe(true);
    expect(N.suggestEasier([rec('casual', true), rec('casual', false)], '適中')).toBe(false);
    expect(N.suggestEasier([rec('casual', false, 'easy'), rec('casual', false, 'easy')], '簡易')).toBe(false);
    expect(N.suggestEasier([rec('casual', false), rec('ranked', false), rec('casual', false)], '困難')).toBe(true);
    expect(N.suggestEasier([rec('casual', false)], '適中')).toBe(false);
  });
});
