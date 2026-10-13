// 分享戰績圖: a 1080 × 1350 picture of the result; saved as a PNG where the browser cannot share files
import { test, expect, open, answer, until } from './fixtures.js';

test('the share picture is made after a ranked win and saved as a PNG', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-ranked'); await page.click('#rk-go');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.evaluate(() => { const T = window.__T; T.calc.FOE_BLOCK.easy = 0; T.G.lp.c = 50; T.G.hand.c = []; T.renderAll(); });
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#scr-result')).toBeVisible({ timeout: 30_000 });
  const d = await page.evaluate(() => window.__T.sharecard.cardData(window.__T.G));
  expect(d.win).toBe(true); expect(d.mode).toContain('排位賽'); expect(d.big.label).toBe('排位積分');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-share-card')]);
  expect(dl.suggestedFilename()).toBe('financial-duel-win.png');
  const size = await page.evaluate(async () => { const c = await window.__T.sharecard.drawCard(); return [c.width, c.height]; });
  expect(size).toEqual([1080, 1350]);
  await expect(page.locator('#share-card-status')).toContainText('已存成');
});
