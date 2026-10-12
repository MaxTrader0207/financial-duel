// 排位賽: the ranked screen, a ranked win scored by performance, surrender as a loss, the deck point cap,
// the monthly season reward, card backs, and market events in a casual duel.
import { test, expect, open, answer, until } from './fixtures.js';

async function quickWin(page) {
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.evaluate(() => { const T = window.__T; T.calc.FOE_BLOCK[Object.keys(T.DIFFS).find(k => T.DIFFS[k] === T.G.diff)] = 0; T.G.lp.c = 50; T.G.hand.c = []; T.renderAll(); });
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#scr-result')).toBeVisible({ timeout: 30_000 });
}

test('a ranked win earns points scored by performance', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#rk-badge')).toHaveText('見習交易員');
  await page.click('#btn-ranked');
  await expect(page.locator('.rk-name').first()).toHaveText('見習交易員');
  await expect(page.locator('.rk-deck')).toContainText('80 / 80');
  await page.click('#rk-go');
  expect(await page.evaluate(() => [window.__T.G.mode, window.__T.G.diff.name])).toEqual(['ranked', '簡易']);
  await quickWin(page);
  await expect(page.locator('.rank-res')).toBeVisible();
  await expect(page.locator('.rank-res .catbars')).toContainText('風險管理');
  const r = await page.evaluate(() => window.__T.G.rank);
  expect(r.delta).toBeGreaterThanOrEqual(15); expect(r.delta).toBeLessThanOrEqual(30);
  expect(await page.evaluate(() => window.__T.ranked.state().rp)).toBe(r.after);
});

test('surrendering a ranked duel counts as a loss', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { window.__T.ranked.state().rp = 300; });
  await page.click('#btn-ranked'); await page.click('#rk-go');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click('#btn-quit'); await page.click('#btn-quit');
  await expect(page.locator('.toast')).toContainText('排位賽投降：-20');
  expect(await page.evaluate(() => window.__T.ranked.state().rp)).toBe(280);
});

test('a deck over the point cap cannot enter ranked until it is fixed', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const T = window.__T; T.COL.owned = T.MONSTERS.map(m => m.id); T.DECK.splice(0, 40, ...T.MONSTERS.filter(m => m.rank === 4).flatMap(m => [m.id]).concat(T.MONSTERS.filter(m => m.rank === 3).map(m => m.id)).slice(0, 40)); });
  await page.click('#btn-ranked');
  await expect(page.locator('.rk-deck')).toHaveClass(/bad/);
  await expect(page.locator('#rk-go')).toBeDisabled();
  await page.click('#rk-auto');
  await expect(page.locator('.rk-deck')).toHaveClass(/ok/);
  await expect(page.locator('#rk-go')).toBeEnabled();
});

test('a new month pays out the season and card backs can be worn', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const R = window.__T.ranked.state(); Object.assign(R, { season: '2026-01', rp: 470, peak: 3, played: 5, w: 4, l: 1 }); localStorage.setItem('soba-ketto.ranked.v1', JSON.stringify(R)); });
  await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await expect(page.locator('#season-dlg')).toBeVisible();
  await expect(page.locator('#season-body')).toContainText('2026 年 1 月賽季・操盤手');
  await page.click('#season-ok');
  await page.click('#btn-ranked');
  await page.click('.rk-back[data-id="s-2026-01"]');
  await expect(page.locator('html')).toHaveAttribute('data-back', 'season');
  await page.click('.rk-back[data-id="gold"]');
  await expect(page.locator('html')).toHaveAttribute('data-back', 'gold');
});

test('market events appear in a casual duel and tag the favoured cards', async ({ page, errors }) => {
  await open(page); await page.click('#btn-start');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await expect(page.locator('#market-label')).toContainText('第 2 回合起');
  await page.evaluate(() => { const T = window.__T; T.G.market.id = 'crash'; T.G.market.since = 2; T.renderMarket(); T.G.weak = null; T.G.foeProf = { strong: ['fx', 'etf'], weak: ['crypto', 'fund'] };
    T.G.hand.p = ['stop_bushi', 'ma_samurai'].map((id, i) => ({ uid: 98000 + i, id })); T.setPhase('attack', '攻擊階段', 't'); });
  await expect(page.locator('#market-label')).toContainText('股市暴跌');
  await expect(page.locator('#hand .tag-mkt').first()).toContainText('事件 ×1.2');
  await expect(page.locator('#hand .tag-mkt.bad')).toContainText('事件 ×0.8');
});
