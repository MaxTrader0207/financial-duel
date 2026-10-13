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
  await expect(page.locator('.shard-line').filter({ hasText: '今日首勝' })).toBeVisible();     // the day's first win draws a knowledge card
  await page.click('#res-know');
  await expect(page.locator('#kn-dlg')).toBeVisible();
  await page.click('#kn-close');
  await page.evaluate(() => window.__T.openRanked());
  const r = await page.evaluate(() => window.__T.G.rank);
  expect(r.delta).toBeGreaterThanOrEqual(15); expect(r.delta).toBeLessThanOrEqual(30);
  expect(await page.evaluate(() => window.__T.ranked.state().rp)).toBe(r.after);
});

test.describe('before the tutorial', () => {
  test.use({ tutorialDone: false });
  test('ranked asks for the 新手場 first and starts it from there', async ({ page, errors }) => {
    await open(page);
    await page.click('#btn-ranked');
    await expect(page.locator('.rk-deck.gate')).toContainText('先完成新手場');
    await expect(page.locator('#rk-go')).toHaveCount(0);
    await page.click('#rk-tut');
    await until(page, () => window.__T.G && window.__T.G.mode === 'tutorial');
  });
});

test('the opponent follows the tier: stronger at the top, never from your collection', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { window.__T.ranked.state().rp = 1500; });
  await page.click('#btn-ranked');
  await expect(page.locator('.rk-meta')).toContainText('困難＋＋＋');
  await expect(page.locator('.rk-table tr.on')).toContainText('傳奇投資人');
  await page.click('#rk-go');
  const g = await page.evaluate(() => ({ diff: window.__T.G.diff.name, boost: window.__T.G.foeBoost }));
  expect(g).toEqual({ diff: '困難', boost: 0.18 });
});

test('surrendering a ranked duel counts as a loss', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { window.__T.ranked.state().rp = 300; });
  await page.click('#btn-ranked'); await page.click('#rk-go');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click('#btn-quit'); await page.click('#btn-quit');
  await expect(page.locator('.toast')).toContainText('排位賽投降：-25');
  expect(await page.evaluate(() => window.__T.ranked.state().rp)).toBe(275);
});

test('a deck over the point cap never blocks ranked: a legal deck is used for that duel', async ({ page, errors }) => {
  await open(page);
  const big = await page.evaluate(() => { const T = window.__T; T.COL.owned = T.MONSTERS.map(m => m.id); T.DECK.splice(0, 40, ...T.MONSTERS.filter(m => m.rank === 4).flatMap(m => [m.id]).concat(T.MONSTERS.filter(m => m.rank === 3).map(m => m.id)).slice(0, 40)); return T.DECK.slice(); });
  await page.click('#btn-ranked');
  await expect(page.locator('.rk-deck')).toHaveClass(/auto/);
  await expect(page.locator('.rk-deck')).toContainText('自動幫你組');
  await expect(page.locator('#rk-go')).toBeEnabled();
  await page.click('#rk-go');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  const r = await page.evaluate(() => { const T = window.__T; return { auto: T.G.rankedAuto, cost: T.ranked.deckCost(T.G.deckList.p), n: T.G.deckList.p.length, saved: T.DECK.slice() }; });
  expect(r.auto).toBe(true); expect(r.n).toBe(40); expect(r.cost).toBeLessThanOrEqual(80);
  expect(r.saved).toEqual(big);                                   // the saved deck is untouched
  await expect(page.locator('.toast').first()).toContainText('自動使用符合上限的牌組');
});

test('the suggested ranked deck can be saved as your deck', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const T = window.__T; T.COL.owned = T.MONSTERS.map(m => m.id); T.DECK.splice(0, 40, ...T.MONSTERS.filter(m => m.rank === 4).flatMap(m => [m.id]).concat(T.MONSTERS.filter(m => m.rank === 3).map(m => m.id)).slice(0, 40)); });
  await page.click('#btn-ranked');
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
