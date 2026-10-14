// 新手任務: order, rewards once, the graduation title
import { describe, it, expect, beforeEach } from 'vitest';
import * as Qm from '../src/js/quests.js';
import * as Daily from '../src/js/daily.js';

const all = { tut: true, win: true, marks: { deck: 1, nb: 1 }, daily: true, ranked: true };
beforeEach(() => { localStorage.clear(); Daily.load(); Qm.load(); });
describe('新手任務', () => {
  it('the next step is the first one not done, in order', () => {
    expect(Qm.progress({ tut: false, win: false, marks: {}, daily: false, ranked: false }).next.id).toBe('tut');
    const p = Qm.progress({ tut: true, win: false, marks: { deck: 1 }, daily: true, ranked: false });
    expect(p.done).toEqual(['tut', 'deck', 'daily']); expect(p.next.id).toBe('win');
  });
  it('rewards each step once and gives the title when all six are done', () => {
    const s0 = Daily.profile().shards;
    let c = Qm.claim(Qm.progress({ ...all, ranked: false }));
    expect(c.fresh).toHaveLength(5); expect(c.grad).toBe(false);
    expect(Daily.profile().shards).toBe(s0 + 5 * Qm.QUEST_SHARDS);
    expect(Qm.claim(Qm.progress({ ...all, ranked: false })).fresh).toHaveLength(0);
    c = Qm.claim(Qm.progress(all));
    expect(c).toEqual({ fresh: ['ranked'], grad: true });
    expect(Daily.profile().titles).toContain(Qm.GRAD_TITLE.id);
    expect(Daily.titleName(Qm.GRAD_TITLE.id)).toBe('新手畢業生');
    expect(Qm.progress(all).next).toBeNull();
  });
  it('marks are kept', () => {
    Qm.mark('deck'); Qm.load();
    expect(Qm.state().marks.deck).toBeGreaterThan(0);
  });
});
