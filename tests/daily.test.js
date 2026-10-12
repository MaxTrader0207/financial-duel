// 每日挑戰 rules: one scenario per day, rewards for right and wrong answers, finishing bonus, streaks, titles, levels.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as Daily from '../src/js/daily.js';
import { DATA } from '../src/js/data.js';

const at = key => Daily.setClock(() => new Date(`${key}T12:00:00`));
const play = (key, picks) => { at(key); const s = Daily.today().scenario; return picks.map((ok, i) => Daily.answer(i, ok ? s.questions[i].answer : (s.questions[i].answer + 1) % 4)); };

beforeEach(() => { localStorage.removeItem(Daily.DAILY_KEY); localStorage.removeItem(Daily.PROFILE_KEY); Daily.load(); at('2026-10-13'); });
afterAll(() => Daily.setClock(null));

describe('daily.json', () => {
  it('every scenario has 3 questions with 4 distinct options, a valid answer and an explanation', () => {
    expect(DATA.daily.length).toBeGreaterThanOrEqual(30);
    expect(new Set(DATA.daily.map(s => s.id)).size).toBe(DATA.daily.length);
    for (const s of DATA.daily) {
      expect(s.title && s.scene && s.takeaway && s.theme, s.id).toBeTruthy();
      expect(s.questions, s.id).toHaveLength(3);
      for (const q of s.questions) {
        expect(new Set(q.options).size, q.q).toBe(4);
        expect(q.answer >= 0 && q.answer < 4, q.q).toBe(true);
        expect(q.explain.length, q.q).toBeGreaterThan(10);
      }
    }
  });
});

describe('daily challenge', () => {
  it('gives everyone the same scenario on a date, and a different one the next day', () => {
    const a = Daily.scenarioFor('2026-10-13'), b = Daily.scenarioFor('2026-10-13'), c = Daily.scenarioFor('2026-10-14');
    expect(a.id).toBe(b.id); expect(c.id).not.toBe(a.id);
    const month = Array.from({ length: DATA.daily.length }, (_, i) => Daily.scenarioFor(Daily.addDays('2026-10-01', i)).id);
    expect(new Set(month).size).toBe(DATA.daily.length);               // a full cycle shows every scenario once
  });
  it('rewards right answers more, wrong answers still a little, and adds a finishing bonus', () => {
    const [r1, r2, r3] = play('2026-10-13', [true, false, true]);
    expect(r1).toMatchObject({ ok: true, reward: Daily.REWARD.right });
    expect(r2).toMatchObject({ ok: false, reward: Daily.REWARD.wrong });
    expect(r3.finished).toMatchObject({ perfect: false, streak: 1, bonus: Daily.REWARD.finish });
    const P = Daily.profile(), R = Daily.REWARD;
    expect(P.xp).toBe(R.right.xp * 2 + R.wrong.xp + R.finish.xp);
    expect(P.shards).toBe(R.right.shards * 2 + R.wrong.shards + R.finish.shards);
    expect(Daily.today().done).toBe(true);
  });
  it('adds the all-correct bonus', () => {
    const r = play('2026-10-13', [true, true, true])[2];
    expect(r.finished.perfect).toBe(true);
    expect(r.finished.bonus).toEqual({ xp: Daily.REWARD.finish.xp + Daily.REWARD.perfect.xp, shards: Daily.REWARD.finish.shards + Daily.REWARD.perfect.shards });
  });
  it('accepts each question once and in order, and nothing after the day is done', () => {
    const s = Daily.today().scenario;
    expect(Daily.answer(1, 0)).toBeNull();
    expect(Daily.answer(0, s.questions[0].answer).ok).toBe(true);
    expect(Daily.answer(0, 0)).toBeNull();
    Daily.answer(1, 0); Daily.answer(2, 0);
    expect(Daily.answer(3, 0)).toBeNull();
  });
  it('keeps a half-finished day so the player can continue later', () => {
    const s = Daily.today().scenario; Daily.answer(0, s.questions[0].answer);
    Daily.load();                                                       // e.g. after closing the app
    expect(Daily.today()).toMatchObject({ done: false, next: 1 });
  });
  it('counts a streak over consecutive days, keeps it for one missed check, and restarts after a gap', () => {
    play('2026-10-13', [true, true, true]); play('2026-10-14', [true, true, false]); play('2026-10-15', [false, false, false]);
    expect(Daily.state().streak).toBe(3);
    at('2026-10-16'); expect(Daily.streakNow()).toBe(3);               // not done yet today: still alive
    at('2026-10-17'); expect(Daily.streakNow()).toBe(0);               // a whole day missed
    const r = play('2026-10-17', [true, true, true])[2];
    expect(r.finished.streak).toBe(1); expect(Daily.state().best).toBe(3);
  });
  it('unlocks titles once and equips the newest automatically the first time', () => {
    const r = play('2026-10-13', [true, true, true])[2];
    expect(r.finished.newTitles).toEqual(['first']); expect(Daily.profile().title).toBe('first');
    play('2026-10-14', [true, true, true]);
    const r3 = play('2026-10-15', [true, true, true])[2];
    expect(r3.finished.newTitles).toEqual(['s3']);
    expect(Daily.profile().title).toBe('first');                       // the player's choice is kept
    expect(Daily.setTitle('s3')).toBe(true); expect(Daily.setTitle('s100')).toBe(false);
  });
  it('levels: Lv n → n+1 needs 100 × n experience', () => {
    expect(Daily.level(0)).toEqual({ lv: 1, into: 0, need: 100 });
    expect(Daily.level(99).lv).toBe(1); expect(Daily.level(100)).toEqual({ lv: 2, into: 0, need: 200 });
    expect(Daily.level(300)).toEqual({ lv: 3, into: 0, need: 300 });
  });
  it('spends shards on a reward pick only when there are enough', () => {
    expect(Daily.spendShards()).toBe(false);
    Daily.profile().shards = Daily.EXCHANGE_COST + 5;
    expect(Daily.spendShards()).toBe(true); expect(Daily.profile().shards).toBe(5);
  });
  it('shows the last 7 days for the streak strip', () => {
    play('2026-10-12', [true, true, true]); play('2026-10-13', [false, true, true]);
    const r = Daily.recent(7, '2026-10-13');
    expect(r).toHaveLength(7); expect(r[6]).toMatchObject({ key: '2026-10-13', done: true, perfect: false });
    expect(r[5]).toMatchObject({ key: '2026-10-12', done: true, perfect: true }); expect(r[0].done).toBe(false);
  });
});
