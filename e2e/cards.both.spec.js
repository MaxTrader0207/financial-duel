// Card faces: every ★4 card's own art, ★3 crests, the lazily drawn 圖鑑, long-press zoom, and no text spilling out.
import { test, expect, open, startDuel, until } from './fixtures.js';

test('the 圖鑑 draws cards as they scroll into view, with the right art per rarity', async ({ page, errors }) => {
  await open(page); await page.click('#btn-dex');
  const count = () => page.evaluate(() => [document.querySelectorAll('#dex .card.lazy').length, document.querySelectorAll('#dex .card:not(.lazy)').length]);
  const [lazy0, drawn0] = await count();
  expect(lazy0 + drawn0).toBe(160); expect(drawn0).toBeGreaterThan(0); expect(drawn0).toBeLessThan(60);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
  const [, drawn1] = await count(); expect(drawn1).toBeGreaterThan(drawn0);
  await page.click('#dex-filter button[data-k="deriv"]');
  for (const item of await page.locator('#dex .dex-item').all()) { await item.scrollIntoViewIfNeeded(); }
  await page.waitForTimeout(300);
  await expect(page.locator('#dex .c-art-ur svg.ur')).toHaveCount(4);
  await expect(page.locator('#dex .c-crest')).toHaveCount(4);
});

test('long-press opens the zoom view instead of playing the card', async ({ page, errors }, info) => {
  test.skip(info.project.name !== 'phone', 'touch only');
  await open(page); await startDuel(page);
  const n = await page.evaluate(() => window.__T.G.hand.p.length);
  const box = await page.locator('#hand .hand-card').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
  await expect(page.locator('#zoom')).toBeVisible();
  expect(await page.evaluate(() => window.__T.G.hand.p.length)).toBe(n);
  await expect(page.locator('#zoom .zoom-info')).toContainText('【');
  await page.click('#zoom-play');
  await expect(page.locator('#quiz')).toBeVisible();
});

test('hand cards never spill text, also with the phone font size at 150 %', async ({ page, errors }, info) => {
  await open(page); await startDuel(page);
  await page.evaluate(() => { const T = window.__T; T.G.hand.p = ['ma_samurai', 'sortino_keep', 'revenue_seer', 'doji_miko', 'tw50_shogun'].map((id, i) => ({ uid: 96000 + i, id })); T.setPhase('attack', '攻擊階段', 't'); });
  const spill = () => page.evaluate(() => [...document.querySelectorAll('#hand .card')].map(c => { const r = c.getBoundingClientRect();
    return [...c.querySelectorAll('*')].filter(e => !e.closest('svg')).filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > r.right + 1 || q.bottom > r.bottom + 1); }).length; }));
  expect((await spill()).every(n => n === 0)).toBe(true);
  if (info.project.name !== 'phone') return;                         // the 150 % system font case is a phone setting
  await page.evaluate(() => { const els = [...document.querySelectorAll('body *')], sz = els.map(e => parseFloat(getComputedStyle(e).fontSize));
    els.forEach((e, i) => e.style.setProperty('font-size', Math.max(sz[i], 8) * 1.5 + 'px', 'important')); });
  await page.waitForTimeout(200);
  expect((await spill()).every(n => n === 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
