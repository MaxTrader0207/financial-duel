// 版本資訊: version and update time on the title screen, the changelog dialog, and "what's new" once after an update
import { readFileSync } from 'node:fs';
import { test, expect, open } from './fixtures.js';

test('the title shows the version; the changelog opens from it', async ({ page, errors }) => {
  await open(page);
  const cur = await page.evaluate(() => window.__T.version.CURRENT);
  await expect(page.locator('#ver-tag')).toContainText(`v${cur.version}`);
  await expect(page.locator('#ver-tag')).toContainText(cur.date.slice(0, 10).replace(/-/g, '/'));
  await expect(page.locator('#news-dlg')).toBeHidden();                     // a first visit does not pop up
  await page.click('#ver-tag');
  await expect(page.locator('#news-dlg .nv-rel').first()).toContainText(cur.title);
  await expect(page.locator('#news-dlg .nv-build')).toContainText('建置時間');
  await page.click('#news-ok');
  await expect(page.locator('#news-dlg')).toBeHidden();
});

test('a returning player sees what changed since the last visit, once', async ({ page, errors }) => {
  const log = JSON.parse(readFileSync(new URL('../src/data/changelog.json', import.meta.url), 'utf8')).releases;
  const seen = log[2].version;                                              // two releases behind
  await page.addInitScript(v => { if (!sessionStorage.getItem('v-set')) { localStorage.setItem('soba-ketto.seen-version', v); sessionStorage.setItem('v-set', '1'); } }, seen);
  await open(page);
  await expect(page.locator('#news-dlg')).toBeVisible();
  await expect(page.locator('#news-body')).toContainText(`v${seen}`);
  await expect(page.locator('#news-dlg .nv-rel').first()).toContainText(`v${log[0].version}`);
  expect(await page.locator('#news-dlg .nv-rel').count()).toBe(2);
  await page.click('#news-all');
  expect(await page.locator('#news-dlg .nv-rel').count()).toBeGreaterThan(10);
  await page.click('#news-ok');
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await expect(page.locator('#news-dlg')).toBeHidden();
});
