// Save & resume mid-duel, old-save conversion and unreadable data kept as a backup.
import { test, expect, open, startDuel, playToEnd, visible, until, step } from './fixtures.js';

test.describe.configure({ timeout: 240_000 });

const snap = page => page.evaluate(() => { const G = window.__T.G;
  return { turn: G.turn, phase: G.phase, lp: G.lp, hand: G.hand.p.map(i => i.id), handC: G.hand.c.length, deck: G.deck.p.length, foe: G.foeCard && G.foeCard.id, used: G.used.size, prof: G.foeProf }; });

test('saving in the attack and defence phases resumes the exact same duel', async ({ page, errors }) => {
  await open(page); await startDuel(page);
  await playToEnd(page, 0.7, { until: () => window.__T.G.turn >= 2 && window.__T.G.phase === 'attack' && !window.__T.G.busy });
  const a = await snap(page);
  await page.click('#btn-save');
  await expect(page.locator('#scr-title')).toBeVisible();
  await page.reload(); await expect(page.locator('#resume')).toBeVisible();
  await page.click('#btn-resume');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack');
  expect(await snap(page)).toEqual(a);

  await playToEnd(page, 0.7, { until: () => window.__T.G.phase === 'defend' && !window.__T.G.busy });
  const d = await snap(page);
  await page.click('#btn-save'); await page.reload(); await page.click('#btn-resume');
  await until(page, () => window.__T.G && window.__T.G.phase === 'defend');
  expect(await snap(page)).toEqual(d);
  await expect(page.locator('#slot-c .card')).toHaveCount(1);
  await page.click('#hand .hand-card:not([disabled])');
  await expect(page.locator('#btn-save')).toBeDisabled();            // no saving with a question open
});

test('an old v1 save and a 30-card deck are converted; a broken save is backed up, not lost', async ({ page, errors }) => {
  await open(page);
  const oldDeck = await page.evaluate(() => window.__T.MONSTERS.filter(m => m.rank <= 2).slice(0, 30).map(m => m.id));
  await startDuel(page); await page.click('#btn-save');
  await page.evaluate(d => {
    const s = JSON.parse(localStorage.getItem('soba-ketto.save.v1')); s.v = 1; delete s.deckList; delete s.weak; delete s.flags; delete s.foeProf;
    localStorage.setItem('soba-ketto.save.v1', JSON.stringify(s)); localStorage.setItem('soba-ketto.deck.v1', JSON.stringify(d));
    const m = JSON.parse(localStorage.getItem('soba-ketto.meta')) || {}; delete m['soba-ketto.deck.v1']; localStorage.setItem('soba-ketto.meta', JSON.stringify(m));
  }, oldDeck);
  await page.reload(); await expect(page.locator('#resume')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('soba-ketto.save.v1')).v)).toBe(2);
  expect(await page.evaluate(() => [window.__T.DECK.length, window.__T.deckValid(window.__T.DECK)])).toEqual([40, true]);
  expect(await page.evaluate(d => d.every(id => window.__T.DECK.includes(id)), oldDeck)).toBe(true);
  await page.click('#btn-resume');
  await until(page, () => window.__T.G && ['attack', 'defend'].includes(window.__T.G.phase));
  expect(await page.evaluate(() => window.__T.G.foeProf.strong.length)).toBe(2);   // old saves get an opponent profile

  await page.evaluate(() => localStorage.setItem('soba-ketto.save.v1', '{"v":1,"deck":'));
  await page.reload();
  expect(await visible(page, '#resume')).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.save.v1.backup'))).toBe('{"v":1,"deck":');
  await expect(page.locator('.toast')).toContainText(/備份|讀不懂|無法/);
});
