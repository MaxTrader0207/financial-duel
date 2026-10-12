// Whole duels on each difficulty: they finish, the state machine never jumps illegally, nothing errors.
import { test, expect, open, startDuel, playToEnd, fsmViolations, visible, shortDuel } from './fixtures.js';

test.describe.configure({ timeout: 300_000 });

for (const diff of ['easy', 'normal', 'hard']) {
  test(`a full duel on ${diff} finishes cleanly`, async ({ page, errors }) => {
    await open(page);
    await page.check(`input[name="diff"][value="${diff}"]`, { force: true });
    await startDuel(page);
    expect(await page.evaluate(() => window.__T.G.diff.name)).toBe({ easy: '簡易', normal: '適中', hard: '困難' }[diff]);
    if (diff !== 'normal') await shortDuel(page);                    // one full-length duel is enough
    expect(await playToEnd(page, 0.75)).toBe('result');
    expect(await fsmViolations(page)).toEqual([]);
    const s = await page.evaluate(() => ({ over: window.__T.G.over, total: window.__T.G.stats.total, lp: window.__T.G.lp }));
    expect(s.over).toBe(true); expect(s.total).toBeGreaterThan(0);
    expect(Math.min(s.lp.p, s.lp.c)).toBe(0);
    await expect(page.locator('#result .verdict-big')).toHaveText(/勝利|敗北/);
    expect(await visible(page, '#scr-result')).toBe(true);
  });
}

test('a finished duel is written to the learning record and clears the save', async ({ page, errors }) => {
  await open(page); await startDuel(page);
  await shortDuel(page);
  const before = await page.evaluate(() => window.__T.RECS.length);
  await playToEnd(page, 0.8);
  expect(await page.evaluate(() => window.__T.RECS.length)).toBe(before + 1);
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.save.v1'))).toBeNull();
});
