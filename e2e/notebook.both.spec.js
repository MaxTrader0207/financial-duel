// 錯題本: the title reminds about due questions and starts the review in one tap; the last wrong pick is shown;
// the review ends with a list of what moved up or back.
import { test, expect, open } from './fixtures.js';

test('due questions: reminder on the title, one-tap review, results list', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#nb-due')).toBeHidden();
  await page.evaluate(() => { const T = window.__T; T.BANK.slice(0, 3).forEach(q => T.notebook.nbRecord(q, false, q.options[(q.answer + 1) % q.options.length])); });
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await expect(page.locator('#nb-due')).toBeVisible();
  await expect(page.locator('#nb-due-n')).toHaveText('3 題正在等你復仇');
  await page.click('#nb-due');
  await expect(page.locator('#rv-q')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const pick = await page.evaluate(i => { const RV = window.__T.notebook.RV, q = RV.list[RV.i], r = RV.order.indexOf(q.answer); return i === 0 ? (r + 1) % q.options.length : r; }, i);
    await page.locator('#rv-opts .q-opt').nth(pick).click();
    await expect(page.locator('#rv-verdict')).toContainText(i === 0 ? '留在第 1 階' : '升到第 2 階');
    await page.click('#rv-next');
  }
  await expect(page.locator('#rv-opts .rv-log li')).toHaveCount(3);
  await expect(page.locator('#rv-opts .rv-sum')).toContainText('升階 2');
  await expect(page.locator('#rv-opts .rv-next')).toContainText('1 題現在就可以複習');
  await page.click('#rv-done');
  await expect(page.locator('#nb-list .nb-pick').first()).toContainText('你上次選：');

  // practising early does not promote
  await page.click('#nb-review-all');
  const left = await page.evaluate(() => window.__T.notebook.RV.list.length);
  for (let i = 0; i < left; i++) {
    const r = await page.evaluate(() => { const RV = window.__T.notebook.RV, q = RV.list[RV.i]; return RV.order.indexOf(q.answer); });
    await page.locator('#rv-opts .q-opt').nth(r).click();
    await page.click('#rv-next');
  }
  await expect(page.locator('#rv-opts .rv-sum')).toContainText('提前練習 2');
  await page.click('#rv-done'); await page.click('#btn-nb-back');
  await expect(page.locator('#nb-due')).toBeHidden();
});
