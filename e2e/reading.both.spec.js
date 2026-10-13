// 閱讀設定: text size and the colour-blind friendly palette, kept after a reload
import { test, expect, open } from './fixtures.js';

test('text size and colour-blind palette apply at once and survive a reload', async ({ page, errors }) => {
  await open(page);
  await page.click('#btn-set');
  const demo = page.locator('#set-text-demo');
  const size = () => demo.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(await size()).toBeCloseTo(15, 0);
  await page.click('#set-text button[data-v="xl"]');
  await expect(page.locator('#set-text button[data-v="xl"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await size()).toBeCloseTo(19.5, 0);
  await page.locator('#set-cvd').check();
  expect(await page.evaluate(() => document.documentElement.classList.contains('cvd'))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--good').trim())).toBe('#4ea1ff');
  await page.click('#set-ok');

  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  expect(await page.evaluate(() => [...document.documentElement.classList].filter(c => ['rs-xl', 'cvd'].includes(c)).sort())).toEqual(['cvd', 'rs-xl']);

  // a review question is larger, and the right / wrong options carry ✓ ✗
  await page.evaluate(() => { const T = window.__T; T.BANK.slice(0, 2).forEach(q => T.notebook.nbRecord(q, false)); });
  await page.click('#btn-nb'); await page.click('#nb-review-all');
  await expect(page.locator('#rv-q')).toBeVisible();
  const qSize = await page.locator('#rv-q').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(qSize).toBeGreaterThan(21);                                          // 17 or 19 px × 1.3
  const wrong = await page.evaluate(() => { const T = window.__T, q = T.notebook.RV.list[T.notebook.RV.i]; return T.notebook.RV.order.indexOf(q.answer) === 0 ? 1 : 0; });
  await page.locator('#rv-opts .q-opt').nth(wrong).click();
  const marks = await page.evaluate(() => [...document.querySelectorAll('#rv-opts .q-opt')].map(b => getComputedStyle(b, '::after').content).filter(c => c !== 'none'));
  expect(marks.sort()).toEqual(['"✓"', '"✗"']);
  await page.click('#rv-quit');
  await page.click('#btn-set'); await page.click('#set-text button[data-v="m"]'); await page.locator('#set-cvd').uncheck();
  expect(await page.evaluate(() => document.documentElement.className)).not.toMatch(/rs-|cvd/);
  expect(await size()).toBeCloseTo(15, 0);
});
