// 卡牌技能族譜: the screen maps every card, analyses the saved deck, and exports a PNG (share) and a PDF planning sheet
import { test, expect, open } from './fixtures.js';
import { readFileSync } from 'node:fs';

test('the skill tree shows all 180 cards, the deck analysis, and exports PNG and PDF', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-tree');
  await expect(page.locator('#scr-tree')).toBeVisible();
  await expect(page.locator('#tree-body .tr-leaf')).toHaveCount(180);
  await expect(page.locator('#tree-body .tr-clan')).toHaveCount(9);
  await expect(page.locator('#tree-sum')).toContainText('/180');
  await expect(page.locator('#tree-cats tbody tr')).toHaveCount(9);
  await expect(page.locator('#tree-good li').first()).toBeVisible();
  await expect(page.locator('#tree-wish .tr-wish')).toHaveCount(8);
  const owned = await page.evaluate(() => window.__T.skilltree.buildTree().analysis.owned);
  await expect(page.locator('#tree-body .tr-leaf:not(.missing)')).toHaveCount(owned);
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tree-png')]);
  expect(dl.suggestedFilename()).toMatch(/^financial-duel-skilltree-\d{8}\.png$/);
  expect(readFileSync(await dl.path()).subarray(1, 4).toString()).toBe('PNG');
  await expect(page.locator('#tree-status')).toContainText('已存成');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tree-pdf')]);
  expect(dl.suggestedFilename()).toMatch(/^financial-duel-skilltree-\d{8}\.pdf$/);
  expect(readFileSync(await dl.path()).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.locator('#tree-status')).toContainText('頁');
  const size = await page.evaluate(async () => { const c = await window.__T.treeui.drawImage(); return [c.width, c.height]; });
  expect(size[0]).toBe(1080); expect(size[1]).toBeGreaterThan(3000);
  await page.click('#tree-body .tr-clan[open] .tr-leaf >> nth=0');
  await expect(page.locator('#zoom')).toBeVisible();
});

test('the deck and dex screens open the skill tree', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-dex'); await page.click('#dex-tree');
  await expect(page.locator('#scr-tree')).toBeVisible();
  await page.click('#tree-deck'); await expect(page.locator('#scr-deck')).toBeVisible();
  await page.click('#deck-tree'); await expect(page.locator('#scr-tree')).toBeVisible();
  await page.click('#tree-back'); await expect(page.locator('#scr-title')).toBeVisible();
});
