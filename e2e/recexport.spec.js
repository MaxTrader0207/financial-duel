// 學習紀錄輸出: PDF learning report, the shareable card picture, and the two CSVs
import { test, expect, open } from './fixtures.js';
import { readFileSync } from 'node:fs';

async function seed(page) {
  await page.evaluate(() => { const T = window.__T, cats = ['tech', 'fund', 'fx', 'money'], now = Date.now();
    for (let i = 0; i < 14; i++) { const byCat = {}; cats.forEach((k, j) => { byCat[k] = { t: 3, c: (i + j) % 4 }; });
      T.RECS.push({ at: now - (14 - i) * 864e5, mode: i % 3 ? 'casual' : 'ranked', diff: 'normal', win: i % 2 === 0, quit: false, turns: 6 + i % 4, total: 12, correct: 4 + i % 7, maxStreak: 2 + i % 5, byCat }); }
    T.BANK.slice(0, 25).forEach((q, i) => { T.QS[q.id] = { t: 3, w: i % 3, last: now }; }); });
  await page.click('#btn-rec');
  await expect(page.locator('#rec-export')).toBeVisible();
}

test('the learning record exports a PDF report, a share card and two CSVs', async ({ page, errors }) => {
  await open(page); await seed(page);
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rec-export-pdf')]);
  expect(dl.suggestedFilename()).toMatch(/^financial-duel-record-\d{8}\.pdf$/);
  expect(readFileSync(await dl.path()).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.locator('#rec-export-status')).toContainText('頁');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rec-export-card')]);
  expect(dl.suggestedFilename()).toMatch(/^financial-duel-record-card-\d{8}\.png$/);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rec-export-games')]);
  let csv = readFileSync(await dl.path(), 'utf8');
  expect(csv.charCodeAt(0)).toBe(0xFEFF); expect(csv.trim().split('\r\n')).toHaveLength(15);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rec-export-q')]);
  csv = readFileSync(await dl.path(), 'utf8');
  expect(csv.trim().split('\r\n')).toHaveLength(26);
  const n = await page.evaluate(async () => (await window.__T.recexport.buildReportPages()).length);
  expect(n).toBeGreaterThanOrEqual(2);
});

test('with no duels yet the export box is hidden', async ({ page, errors }) => {
  await open(page); await page.click('#btn-rec');
  await expect(page.locator('#rec-export')).toBeHidden();
});
