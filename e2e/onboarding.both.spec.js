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

test.describe('first visit: the level question', () => {
  test.use({ tutorialDone: false, levelSet: false });
  test('完全新手 → 簡易 and three protected duels with 初階 questions only', async ({ page, errors }) => {
    await open(page);
    await expect(page.locator('#level-dlg')).toBeVisible();
    await page.click('#level-dlg [data-level="new"]');
    await expect(page.locator('#level-dlg')).toBeHidden();
    await expect(page.locator('#diff input[value="easy"]')).toBeChecked();
    /* finish the tutorial state, then a casual duel is protected */
    await page.evaluate(() => { localStorage.setItem('soba-ketto.tutorial.v1', 'done'); });
    await page.click('#btn-start');
    await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
    expect(await page.evaluate(() => [window.__T.G.newbie, window.__T.G.mode])).toEqual([true, 'casual']);
    await expect(page.locator('.toast').filter({ hasText: '新手保護（還有 3 場）' })).toBeVisible();
    await page.click('#hand .hand-card >> nth=0');
    await until(page, () => window.__lastQ);
    expect(await page.evaluate(() => window.__lastQ.difficulty)).toBe(1);
  });
  test('交易老手 skips the tutorial and opens every feature', async ({ page, errors }) => {
    await open(page);
    await page.click('#level-dlg [data-level="pro"]');
    expect(await page.evaluate(() => localStorage.getItem('soba-ketto.tutorial.v1'))).toBe('done');
    await expect(page.locator('#btn-ranked')).not.toHaveClass(/locked/);
    await page.click('#btn-start');
    await until(page, () => window.__T.G && window.__T.G.phase === 'attack');
    expect(await page.evaluate(() => [window.__T.G.mode, !!window.__T.G.newbie])).toEqual(['casual', false]);
  });
});

test.describe('features open step by step', () => {
  test.use({ questsDone: false });
  test('ranked, challenge, bank and the tree are locked until their step, explain themselves, and open on skip', async ({ page, errors }) => {
    await open(page);
    for (const s of ['#btn-ranked', '#btn-challenge', '#btn-bank', '#btn-tree']) await expect(page.locator(s)).toHaveClass(/locked/);
    await expect(page.locator('#btn-ranked')).toHaveAttribute('data-lock', '贏一場後開放');
    await page.click('#btn-ranked', { force: true });               // aria-disabled: it explains itself instead of opening
    await expect(page.locator('#scr-title')).toBeVisible();
    await expect(page.locator('.toast').filter({ hasText: '排位賽會在你贏得第一場' })).toBeVisible();
    /* saving the deck opens the tree */
    await page.click('#btn-deck'); await page.click('#deck-auto'); await page.click('#deck-save');
    await page.locator('#scr-deck .backbar button').click();
    await expect(page.locator('#btn-tree')).not.toHaveClass(/locked/);
    await expect(page.locator('#btn-ranked')).toHaveClass(/locked/);
    await page.click('#qc-skip');
    await expect(page.locator('#quest-card')).toBeHidden();
    await expect(page.locator('#btn-ranked')).not.toHaveClass(/locked/);
    await page.click('#btn-ranked'); await expect(page.locator('#scr-ranked')).toBeVisible();
  });
});

test('two casual losses in a row above 簡易 suggest switching to 簡易', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const R = window.__T.RECS; R.push({ at: Date.now() - 2e5, mode: 'casual', diff: 'normal', win: false, total: 5, correct: 1, byCat: {} }, { at: Date.now() - 1e5, mode: 'casual', diff: 'normal', win: false, total: 5, correct: 2, byCat: {} }); });
  await page.click('#btn-start');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack');
  expect(await page.evaluate(() => window.__T.newbie.easierHTML())).toContain('改成簡易');
  await page.evaluate(() => window.__T.newbie.setDifficulty('easy'));
  await expect(page.locator('#diff input[value="easy"]')).toBeChecked();
});
