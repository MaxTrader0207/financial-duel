// 標題與導覽: the play buttons come before the grouped menu, returning players skip the intro, and every menu screen
// has a pinned 「‹ 回標題」 bar that still runs the screen's own back button
import { test, expect, open } from './fixtures.js';

test('returning players get the play buttons without the intro; the menu is grouped', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#title-wrap')).toHaveClass(/returning/);
  await expect(page.locator('.steps3')).toBeHidden();
  await expect(page.locator('.tgroup')).toHaveCount(3);
  await expect(page.locator('.tgroup').nth(1)).toContainText('卡牌族譜');
  const y = async s => (await page.locator(s).boundingBox()).y;
  expect(await y('#btn-start')).toBeLessThan(await y('#btn-nb'));
  expect(await y('#btn-start')).toBeLessThan(await y('.rules-more'));
});

test.describe('first-time player', () => {
  test.use({ tutorialDone: false });
  test('sees the three steps and the tutorial hint', async ({ page, errors }) => {
    await open(page);
    await expect(page.locator('#title-wrap')).not.toHaveClass(/returning/);
    await expect(page.locator('.steps3')).toBeVisible();
    await expect(page.locator('#tut-hint')).toContainText('新手場');
  });
});

test('the pinned back bar stays on screen while scrolling and returns to the title', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-tree');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const bar = page.locator('#scr-tree .backbar');
  await expect(bar).toContainText('卡牌技能族譜');
  expect((await bar.boundingBox()).y).toBeLessThan(40);
  await bar.locator('button').click();
  await expect(page.locator('#scr-title')).toBeVisible();
  for (const [btn, scr] of [['#btn-dex', 'dex'], ['#btn-nb', 'notebook'], ['#btn-rec', 'record'], ['#btn-deck', 'deck'], ['#btn-know', 'know'], ['#btn-bank', 'bank']]) {
    await page.click(btn);
    await page.locator(`#scr-${scr} .backbar button`).click();
    await expect(page.locator('#scr-title')).toBeVisible();
  }
});
