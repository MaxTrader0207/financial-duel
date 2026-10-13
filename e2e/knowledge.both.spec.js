// 知識圖鑑: starter cards, a card's levels and check question (wrong costs nothing, right levels up),
// unlocking with shards, the daily challenge handing out its card, and shards from a duel win.
import { test, expect, open, answer, until } from './fixtures.js';

const shards = (page, n) => page.evaluate(n => { window.__T.daily.profile().shards = n; }, n);

test('starter cards, levelling a card up through its check question', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#kn-badge')).toHaveText('4');                         // 4 new starter cards
  await shards(page, 100);
  await page.click('#btn-know');
  await expect(page.locator('#kn-sum')).toContainText('4');
  await expect(page.locator('#kn-grid .kcard:not(.locked)')).toHaveCount(4);
  await page.click('.kn-cell[data-id="def_emergency"]');
  await expect(page.locator('#kn-card .kn-sec').first()).not.toHaveClass(/locked/);
  await expect(page.locator('#kn-card .kn-sec.locked')).toHaveCount(2);

  const q = await page.evaluate(() => window.__T.knowledge.checkFor('def_emergency'));
  await page.click('#kn-up');
  await page.locator('#kn-card .q-opt').filter({ hasNotText: q.options[q.answer] }).first().click();
  await expect(page.locator('.kn-msg')).toContainText('碎片沒有扣');
  expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(100);
  await page.click('#kn-up');
  await page.locator('#kn-card .q-opt', { hasText: q.options[q.answer] }).first().click();
  await expect(page.locator('.kn-msg')).toContainText('升到 Lv2');
  await expect(page.locator('#kn-card .kn-sec.locked')).toHaveCount(1);
  expect(await page.evaluate(() => window.__T.daily.profile().shards)).toBe(85);
  await page.click('#kn-close');
  await expect(page.locator('#kn-badge')).toHaveText('3');
});

test('a locked card can be bought with shards', async ({ page, errors }) => {
  await open(page); await shards(page, 25);
  await page.click('#btn-know');
  await page.click('.kn-cell[data-id="stk_value"]');
  await expect(page.locator('#kn-card .kcard')).toHaveClass(/locked/);
  await page.click('#kn-buy');
  await expect(page.locator('.kn-msg')).toContainText('收集到「價值股」');
  await expect(page.locator('#kn-card .kcard')).not.toHaveClass(/locked/);
});

test('finishing the daily challenge hands out its knowledge card', async ({ page, errors }) => {
  await open(page);
  // pick a date whose scenario links to a card the player does not have yet
  const key = await page.evaluate(() => { const T = window.__T; for (let i = 0; i < 40; i++) { const k = T.daily.addDays('2026-10-13', i); const s = T.daily.scenarioFor(k); if (!T.knowledge.lv(s.card)) return k; } });
  await page.evaluate(k => { window.__T.daily.setClock(() => new Date(`${k}T09:00:00`)); window.__T.renderDailyCard(); }, key);
  const card = await page.evaluate(() => window.__T.daily.today().scenario.card);
  await page.click('#daily-card');
  for (let i = 0; i < 3; i++) {
    const q = await page.evaluate(i => window.__T.daily.today().scenario.questions[i], i);
    await page.locator('#daily-body .dl-opts .q-opt', { hasText: q.options[q.answer] }).first().click();
    await page.click('#dl-next');
  }
  await expect(page.locator('#dl-kcard')).toHaveClass(/fresh/);
  await expect(page.locator('#dl-kcard')).toContainText('收集到新的知識卡');
  await page.click('#dl-kcard');
  await expect(page.locator('#kn-dlg')).toBeVisible();
  expect(await page.evaluate(c => window.__T.knowledge.lv(c), card)).toBe(1);
});

test('a duel win adds shards, and the first win of the day a knowledge card', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-start');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.evaluate(() => { const T = window.__T; T.calc.FOE_BLOCK.normal = 0; T.G.lp.c = 50; T.G.hand.c = []; T.renderAll(); });
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#scr-result')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.shard-line').first()).toContainText('+4');
  const card = await page.evaluate(() => window.__T.G.knowWon.name);
  await expect(page.locator('.shard-line').nth(1)).toContainText(`今日首勝，收集到知識卡【${card}】`);
  expect(await page.evaluate(() => window.__T.knowledge.stats().owned)).toBe(5);
});
