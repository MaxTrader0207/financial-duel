// 版本資訊: version and update time on the title screen, the changelog dialog, and "what's new" once after an update
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
  await page.addInitScript(() => { if (!sessionStorage.getItem('v-set')) { localStorage.setItem('soba-ketto.seen-version', '3.11.0'); sessionStorage.setItem('v-set', '1'); } });
  await open(page);
  await expect(page.locator('#news-dlg')).toBeVisible();
  await expect(page.locator('#news-body')).toContainText('v3.11.0');
  await expect(page.locator('#news-dlg .nv-rel').first()).toContainText('v3.13.0');
  expect(await page.locator('#news-dlg .nv-rel').count()).toBe(2);
  await page.click('#news-all');
  expect(await page.locator('#news-dlg .nv-rel').count()).toBeGreaterThan(10);
  await page.click('#news-ok');
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await expect(page.locator('#news-dlg')).toBeHidden();
});
