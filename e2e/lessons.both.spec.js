// 教學中心: the lesson list, one lesson from explanation to result, shards the first time, and replay
import { test, expect, open } from './fixtures.js';

test('a lesson goes from explanation to three questions to the result, and pays shards once', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-lessons');
  await expect(page.locator('#scr-lessons')).toBeVisible();
  await expect(page.locator('.ls-item')).toHaveCount(5);
  const s0 = await page.evaluate(() => window.__T.daily.profile().shards);
  await page.click('.ls-item[data-id="adv"]');
  await expect(page.locator('.ls-lesson .rw')).toBeVisible();
  await page.click('#ls-go');
  for (let i = 0; i < 3; i++) {
    const k = await page.evaluate(() => window.__T.lessonsui.current().answer);
    await page.locator('.ls-opt').nth(k).click();
    await expect(page.locator('#ls-fb')).toHaveClass(/ok/);
    await page.click('#ls-next');
  }
  await expect(page.locator('.ls-score')).toHaveText('3 / 3');
  expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(s0 + 10);
  await page.click('#ls-again'); await page.click('#ls-go');
  for (let i = 0; i < 3; i++) {
    const k = await page.evaluate(() => window.__T.lessonsui.current().answer);
    await page.locator('.ls-opt').nth((k + 1) % await page.locator('.ls-opt').count()).click();
    await expect(page.locator('#ls-fb')).toHaveClass(/no/);
    await page.click('#ls-next');
  }
  await expect(page.locator('.ls-score')).toHaveText('0 / 3');
  expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(s0 + 10);
  await page.click('#ls-list');
  await expect(page.locator('.ls-item[data-id="adv"]')).toHaveClass(/done/);
  await expect(page.locator('.ls-count')).toContainText('1');
  await page.click('#ls-back'); await expect(page.locator('#scr-title')).toBeVisible();
});

test('every lesson can be played through', async ({ page, errors }) => {
  await open(page); await page.click('#btn-lessons');
  for (const id of ['dmg', 'skill', 'market', 'ranked']) {
    await page.click(`.ls-item[data-id="${id}"]`); await page.click('#ls-go');
    for (let i = 0; i < 3; i++) { await page.locator('.ls-opt').first().click(); await page.click('#ls-next'); }
    await expect(page.locator('.ls-score')).toBeVisible();
    await page.click('#ls-list');
  }
});
