// 每日挑戰: the title card, 3 questions with instant explanations and rewards (wrong answers too), the summary,
// coming back the same day, the streak on the next day, and spending shards on a reward pick.
import { test, expect, open } from './fixtures.js';

const setDay = (page, key) => page.evaluate(k => { window.__T.daily.setClock(() => new Date(`${k}T09:00:00`)); window.__T.renderDailyCard(); }, key);
async function answer(page, i, right) {
  const q = await page.evaluate(i => window.__T.daily.today().scenario.questions[i], i);
  const target = q.options[q.answer].trim();
  const opts = page.locator('#daily-body .dl-opts .q-opt');
  const texts = await opts.evaluateAll(bs => bs.map(b => b.lastElementChild.textContent.trim()));
  await opts.nth(texts.findIndex(t => (t === target) === right)).click();
  await expect(page.locator('#dl-fb')).toBeVisible();
}

test('a whole daily challenge: rewards for every answer, summary, then done for the day', async ({ page, errors }) => {
  await open(page); await setDay(page, '2026-10-13');
  const card = page.locator('#daily-card');
  await expect(card).toBeVisible(); await expect(card).toContainText('每日挑戰 · 約 3 分鐘'); await expect(card).toContainText('開始');
  await card.click();
  await expect(page.locator('#scr-daily')).toBeVisible();
  await expect(page.locator('.dl-prog')).toContainText('第 1 / 3 題');

  await answer(page, 0, false);                                        // wrong still earns something, and teaches
  await expect(page.locator('#dl-fb .dl-verdict')).toContainText('正確觀念是');
  await expect(page.locator('#dl-fb')).toContainText('經驗 +10'); await expect(page.locator('#dl-fb')).toContainText('碎片 +1');
  await page.click('#dl-next');
  await answer(page, 1, true);
  await expect(page.locator('#dl-fb .dl-verdict')).toHaveText('答對了！'); await expect(page.locator('#dl-fb')).toContainText('經驗 +30');
  await page.click('#dl-next');
  await answer(page, 2, true);
  await expect(page.locator('#dl-next')).toHaveText('看今日成果 ▶');
  await page.click('#dl-next');

  await expect(page.locator('.dl-score b')).toHaveText('2');
  await expect(page.locator('.dl-take')).toContainText('今日重點');
  await expect(page.locator('.dl-chips.big')).toContainText('經驗 +90');           // 10 + 30 + 30 + finishing 20
  await expect(page.locator('.dl-title-new')).toContainText('理財新手');
  await page.click('#daily-home');
  await expect(card).toContainText('今日已完成'); await expect(card).toContainText('理財新手');

  await card.click();                                                   // same day: the summary with every explanation
  await expect(page.locator('.dl-done')).toContainText('今天已經完成囉');
  await page.click('.dl-review summary');
  await expect(page.locator('.dl-review .miss')).toHaveCount(3);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('soba-ketto.daily.v1')).streak)).toBe(1);
});

test('the next day brings a new scenario and the streak grows', async ({ page, errors }) => {
  await open(page);
  for (const [day, streak] of [['2026-10-13', 1], ['2026-10-14', 2]]) {
    await setDay(page, day);
    const title = await page.evaluate(() => window.__T.daily.today().scenario.title);
    await expect(page.locator('#daily-card')).toContainText(title);
    await page.click('#daily-card');
    for (let i = 0; i < 3; i++) { await answer(page, i, true); await page.click('#dl-next'); }
    await expect(page.locator('.dl-score b')).toHaveText('3');
    await expect(page.locator('#daily-streak')).toContainText(`連續 ${streak} 天`);
    await page.click('#daily-home');
  }
  await expect(page.locator('#daily-card')).toContainText('連續 2 天');
});

test('a half-finished day continues where it stopped', async ({ page, errors }) => {
  await open(page); await setDay(page, '2026-10-13');
  await page.click('#daily-card'); await answer(page, 0, true); await page.click('#dl-next');
  await page.click('#daily-leave');
  await expect(page.locator('#daily-card')).toContainText('繼續 2/3');
  await page.click('#daily-card');
  await expect(page.locator('.dl-prog')).toContainText('第 2 / 3 題');
});

test('shards buy a reward pick that opens in the deck builder', async ({ page, errors }) => {
  await open(page); await setDay(page, '2026-10-13');
  await page.evaluate(() => { const p = window.__T.daily.profile(); p.shards = 59; });
  await page.click('#daily-card');
  for (let i = 0; i < 3; i++) { await answer(page, i, true); await page.click('#dl-next'); }
  await expect(page.locator('#dl-exchange')).toBeEnabled();
  await page.click('#dl-exchange');
  await expect(page.locator('#scr-deck')).toBeVisible();
  await expect(page.locator('#reward .reward-opts button')).toHaveCount(3);
  expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(59 + 9 + 3 - 60);
});
