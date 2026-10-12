// Result export (PNG / PDF) and the play-time care: 30-minute reminder, 60-minute rest that survives a reload.
import { test, expect, open, startDuel, playToEnd, until , shortDuel } from './fixtures.js';

test('the result exports as PNG and PDF', async ({ page, errors }) => {
  await open(page); await startDuel(page); await shortDuel(page); await playToEnd(page, 0.8);
  for (const kind of ['png', 'pdf']) {
    const dl = page.waitForEvent('download', { timeout: 60_000 }); await page.click(`#btn-${kind}`);
    expect((await dl).suggestedFilename()).toMatch(new RegExp(`\\.${kind}$`));
  }
});

test('a reminder at 30 minutes and a forced rest at 60 that a reload cannot skip', async ({ page, errors }) => {
  test.setTimeout(90_000);
  await open(page);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('soba-ketto.playtime.v1')); s.acc = 1795; s.last = Date.now(); s.reminded = false; localStorage.setItem('soba-ketto.playtime.v1', JSON.stringify(s)); });
  await page.reload();
  await expect(page.locator('#care')).toBeVisible({ timeout: 15_000 });
  await page.click('#care-ok');
  await startDuel(page);
  await page.evaluate(() => { window.__T.PT.acc = 3598; window.__T.PT.last = Date.now(); });
  await expect(page.locator('#rest')).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate(() => !!localStorage.getItem('soba-ketto.save.v1'))).toBe(true);
  await page.reload(); await expect(page.locator('#rest')).toBeVisible();
});
