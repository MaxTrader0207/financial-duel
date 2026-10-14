// 錯題本: spaced review boxes, early answers do not promote, the last wrong pick is kept, the title reminder.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as NBm from '../src/js/notebook.js';
import { DATA } from '../src/js/data.js';
import { $ } from '../src/js/core.js';

const Q = () => DATA.questions.questions;
const T0 = new Date('2030-03-01T09:00:00+08:00').getTime(), DAY = 864e5;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); for (const k of Object.keys(NBm.NB)) delete NBm.NB[k]; });
afterEach(() => vi.useRealTimers());

describe('spaced review', () => {
  it('needs right answers on different days: early answers count but keep the box', () => {
    const q = Q()[0];
    expect(NBm.nbRecord(q, false, q.options[1])).toBe('new');
    expect(NBm.NB[q.id]).toMatchObject({ box: 1, wrong: 1, pick: q.options[1] });
    expect(NBm.nbRecord(q, true)).toBe('up');                    // box 1 is due at once
    expect(NBm.NB[q.id].box).toBe(2);
    expect(NBm.nbRecord(q, true)).toBe('early');                 // same day: not due yet
    expect(NBm.NB[q.id]).toMatchObject({ box: 2, right: 2, mastered: false });
    vi.setSystemTime(T0 + DAY); expect(NBm.nbRecord(q, true)).toBe('up');
    vi.setSystemTime(T0 + 2 * DAY); expect(NBm.nbRecord(q, true)).toBe('early');
    vi.setSystemTime(T0 + 4 * DAY); expect(NBm.nbRecord(q, true)).toBe('mastered');
    expect(NBm.nbRecord(q, true)).toBe(null);
  });
  it('a wrong answer drops back to box 1 ("again" when already there); a time-out is kept as an empty pick', () => {
    const q = Q()[1];
    NBm.nbRecord(q, false, ''); expect(NBm.NB[q.id].pick).toBe('');
    expect(NBm.nbRecord(q, false, q.options[2])).toBe('again');
    NBm.nbRecord(q, true); expect(NBm.NB[q.id].box).toBe(2);
    expect(NBm.nbRecord(q, false)).toBe('down');
    expect(NBm.NB[q.id]).toMatchObject({ box: 1, pick: q.options[2] });   // no new pick given: the last one stays
  });
});

describe('review mode', () => {
  it('shows a result list and what is due next', () => {
    const [a, b] = Q();
    NBm.nbRecord(a, false, a.options[1]); NBm.nbRecord(b, false, b.options[1]);
    NBm.startReview(false, 'all');
    for (let i = 0; i < 2; i++) {
      const q = NBm.RV.list[NBm.RV.i], right = NBm.RV.order.indexOf(q.answer);
      NBm.answerReview(q.id === a.id ? right : (right + 1) % q.options.length);
      NBm.nextReview();
    }
    const items = [...document.querySelectorAll('#rv-opts .rv-log li')];
    expect(items).toHaveLength(2);
    expect(items.map(li => li.className).sort()).toEqual(['down', 'up']);
    expect($('#rv-opts .rv-next').textContent).toContain('1 題現在就可以複習');
    NBm.endReview();
  });
});
