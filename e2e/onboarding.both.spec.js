// 新手上手: the 新手任務 card, the 規則速查 dialog in a duel, and the shorter tutorial steps with 「看更多」
import { test, expect, open, until } from './fixtures.js';

test.describe('新手任務', () => {
  test.use({ questsDone: false });
  test('finishing the tutorial pays the first step; the card points at the next one and goes there', async ({ page, errors }) => {
    await open(page);
    await expect(page.locator('.toast').first()).toContainText('完成新手任務「完成新手場」');
    expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(30);
    const card = page.locator('#quest-card');
    await expect(card).toBeVisible(); await expect(card).toHaveAttribute('data-quest', 'win');
    await expect(page.locator('#qc-prog')).toHaveText('1 / 6');
    await expect(page.locator('#qc-dots i.on')).toHaveCount(1);
    /* 整理牌組 can be done out of order */
    await page.click('#btn-deck'); await page.click('#deck-auto'); await page.click('#deck-save');
    await page.locator('#scr-deck .backbar button').click();
    await expect(page.locator('#qc-prog')).toHaveText('2 / 6');
    await expect(card).toHaveAttribute('data-quest', 'win');
    await page.click('#qc-go');
    await expect(page.locator('#scr-duel')).toBeVisible();
  });
  test.describe('first-time player', () => {
    test.use({ tutorialDone: false });
    test('starts with the tutorial step', async ({ page, errors }) => {
      await open(page);
      await expect(page.locator('#quest-card')).toHaveAttribute('data-quest', 'tut');
      await expect(page.locator('#qc-prog')).toHaveText('0 / 6');
    });
  });
});

test('the duel has a 規則速查 with the type-advantage wheel and this duel\'s situation', async ({ page, errors }) => {
  await open(page); await page.click('#btn-start');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click('#btn-rules');
  const dlg = page.locator('#rules-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('.rw-node')).toHaveCount(9);
  await expect(dlg).toContainText('傷害怎麼算');
  await expect(dlg).toContainText('每題 20 秒');
  await page.keyboard.press('Escape'); await expect(dlg).toBeHidden();
  await page.click('#btn-rules'); await page.click('#rules-close'); await expect(dlg).toBeHidden();
});

test.describe('tutorial steps', () => {
  test.use({ tutorialDone: false });
  test('each step leads with one line and keeps the details behind 「看更多」', async ({ page, errors }) => {
    await open(page); await page.click('#btn-start');
    await expect(page.locator('#tutor')).toHaveAttribute('data-step', 'goal');
    await expect(page.locator('#tut-text > p').first()).toHaveText('把對手的資金打到 0 就贏了。');
    const more = page.locator('#tut-text details.tut-more');
    await expect(more).toBeVisible();
    await more.locator('summary').click();
    await expect(more).toContainText('對手資金只有一半');
  });
});
