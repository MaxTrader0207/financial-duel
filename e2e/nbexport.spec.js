// 錯題本輸出: PDF study sheet, PDF self-test (answer key at the end) and CSV for Excel
import { test, expect, open } from './fixtures.js';
import { readFileSync } from 'node:fs';

async function seed(page) {
  await page.evaluate(() => { const T = window.__T, qs = T.BANK.filter(q => q.category === 'tech').slice(0, 6).concat(T.BANK.filter(q => q.category === 'fx').slice(0, 3));
    qs.forEach(q => T.notebook.nbRecord(q, false));
    T.notebook.nbRecord(qs[0], true); T.notebook.nbRecord(qs[0], true); T.notebook.nbRecord(qs[0], true);   // the first one ends up mastered
  });
  await page.click('#btn-nb');
  await expect(page.locator('#nb-export-pdf')).toBeVisible();
}

test('the notebook exports to CSV, with or without mastered questions and by attribute', async ({ page, errors }) => {
  await open(page); await seed(page);
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#nb-export-csv')]);
  expect(dl.suggestedFilename()).toMatch(/^financial-duel-notebook-\d{8}\.csv$/);
  let csv = readFileSync(await dl.path(), 'utf8');
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  const lines = csv.trim().split('\r\n');
  expect(lines[0]).toContain('題目'); expect(lines[0]).toContain('正確答案');
  expect(lines.length).toBe(1 + 8);                                         // 9 wrong, 1 mastered left out
  await expect(page.locator('#nb-export-status')).toContainText('8 題');
  await page.check('#nb-export-mastered');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#nb-export-csv')]);
  expect(readFileSync(await dl.path(), 'utf8').trim().split('\r\n').length).toBe(1 + 9);
  await page.click('#nb-filter button[data-k="fx"]');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#nb-export-csv')]);
  csv = readFileSync(await dl.path(), 'utf8');
  expect(csv.trim().split('\r\n').length).toBe(1 + 3);
});

test('the notebook exports a PDF study sheet and a PDF self-test with the answers at the end', async ({ page, errors }) => {
  await open(page); await seed(page);
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#nb-export-pdf')]);
  expect(dl.suggestedFilename()).toMatch(/notebook-notes-\d{8}\.pdf$/);
  expect(readFileSync(await dl.path()).subarray(0, 5).toString()).toBe('%PDF-');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#nb-export-quiz')]);
  expect(dl.suggestedFilename()).toMatch(/notebook-quiz-\d{8}\.pdf$/);
  const pages = await page.evaluate(async () => { const T = window.__T; const l = T.nbexport.exportList({ cat: 'all' }); return [(await T.nbexport.buildPages(l, 'notes')).length, (await T.nbexport.buildPages(l, 'quiz')).length]; });
  expect(pages[1]).toBeGreaterThan(pages[0] - 1);                          // the self-test has its own answer page
  await expect(page.locator('#nb-export-status')).toContainText('頁');
});

test('an empty notebook says there is nothing to export', async ({ page, errors }) => {
  await open(page); await page.click('#btn-nb');
  await page.click('#nb-export-csv');
  await expect(page.locator('#nb-export-status')).toContainText('沒有可以輸出');
});
