// The installable web app: manifest + icons, offline start, bundled fonts, simplified effects.
import { test, expect, open, startDuel, until } from './fixtures.js';

test('installs as an app and starts and plays offline', async ({ page, context, errors }) => {
  await open(page);
  const m = await page.evaluate(() => fetch('./manifest.webmanifest').then(r => r.json()));
  expect(m.name).toBe('金融決鬥'); expect(m.display_override).toContain('fullscreen');
  for (const i of m.icons) expect((await page.request.get(i.src)).ok()).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  expect(await page.evaluate(() => window.__T.MONSTERS.length)).toBe(160);
  await startDuel(page);
  await context.setOffline(false);
});

test('titles and card names keep the game fonts with Google Fonts blocked', async ({ page, errors }) => {
  await open(page);
  expect(await page.evaluate(async () => { await document.fonts.ready;
    return [document.fonts.check('900 24px "FD Serif"', '金融決鬥'), document.fonts.check('900 24px "FD Sans"', '我方回合')]; })).toEqual([true, true]);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.c-name')).fontFamily)).toContain('FD Serif');
});

test('simplified effects: the setting switches foil and particles off', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-set'); await page.click('#set-fx button[data-v="on"]');
  await expect(page.locator('html')).toHaveClass(/fx-lite/);
  await expect(page.locator('#set-fx-note')).toContainText('已開啟');
  await page.click('#set-fx button[data-v="off"]');
  await expect(page.locator('html')).not.toHaveClass(/fx-lite/);
});

test.describe('weak phone', () => {
  test.beforeEach(async ({ page }) => page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 }); }));
  test('auto mode simplifies effects by itself and says why', async ({ page, errors }) => {
    await open(page);
    await expect(page.locator('html')).toHaveClass(/fx-lite/);
    await page.click('#btn-set'); await expect(page.locator('#set-fx-note')).toContainText('低階裝置');
  });
});
