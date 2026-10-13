// anonymous usage statistics: opening the game is counted and sent; the 設定 switch turns it off
import { test, expect, open } from './fixtures.js';

test('opening the game sends an anonymous count, and the setting turns it off', async ({ page, errors }) => {
  const pings = [];
  page.on('request', r => { if (r.url().includes('/v1/ping') && r.method() === 'POST') pings.push(JSON.parse(r.postData())); });
  await open(page);
  await expect.poll(() => pings.length, { timeout: 15_000 }).toBe(1);
  const today = Object.keys(pings[0].days)[0];
  expect(pings[0].pid).toMatch(/^[0-9a-f]{32}$/);
  expect(pings[0].days[today]).toEqual({ open: 1 });
  expect(Object.keys(pings[0])).toEqual(['pid', 'days', 'q']);          // nothing else leaves the device
  expect(pings[0].q).toEqual({});                                       // no question answered yet
  await expect.poll(() => page.evaluate(() => window.__T.usage.state().pending)).toEqual({});
  await page.click('#btn-set');
  await expect(page.locator('#set-stats')).toBeChecked();
  await page.locator('#set-stats').uncheck();
  await page.click('#set-ok');
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.waitForTimeout(5000);
  expect(pings).toHaveLength(1);
});
