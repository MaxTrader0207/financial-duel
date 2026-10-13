// 好友挑戰: make a challenge (play first, get a link), the seeded setup is the same for everyone, accept from a link.
import { test, expect, open, answer, until } from './fixtures.js';
import { readFileSync } from 'node:fs';
const CARDS = JSON.parse(readFileSync(new URL('../public/data/cards.json', import.meta.url), 'utf8'));
const DECK = (CARDS.monsters || CARDS.cards || CARDS).slice(0, 20).flatMap(m => [m.id, m.id]);

function api(page) {
  const db = { posts: [], deck: DECK };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  const view = (id, extra = {}) => ({ id, seed: 4242, deck: db.deck, by: '出題者', created: Date.now(), expires: Date.now() + 30 * 864e5, results: db.results, ...extra });
  db.results = [{ name: '出題者', score: 900, win: true, at: 1 }];
  page.route(/financial-duel-api\./, route => {
    const r = route.request(), path = new URL(r.url()).pathname;
    const reply = (status, body) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (path === '/v1/ping') return reply(200, { ok: true });
    const body = r.postData() ? JSON.parse(r.postData()) : null;
    if (body) db.posts.push({ path, body });
    if (path === '/v1/challenge' && r.method() === 'POST') { db.results = [{ name: body.name, score: body.score, win: body.win, at: 2 }]; return reply(201, { ...view('NEWCH2'), seed: body.seed, deck: body.deck, by: body.name }); }
    if (path === '/v1/challenge/K7Q2MX' && r.method() === 'GET') return reply(200, view('K7Q2MX'));
    if (path === '/v1/challenge/K7Q2MX/result') { db.results = [...db.results, { name: body.name, score: body.score, win: body.win, at: 3 }].sort((a, b) => b.score - a.score); return reply(200, view('K7Q2MX')); }
    return route.abort();
  });
  return db;
}
async function quickWin(page) {
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.evaluate(() => { const T = window.__T; T.calc.FOE_BLOCK.normal = 0; T.G.lp.c = 50; T.G.hand.c = []; T.renderAll(); });
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#scr-result')).toBeVisible({ timeout: 30_000 });
}

test('make a challenge: play first, then get a link to share', async ({ page, errors }) => {
  const db = api(page);
  await open(page);
  await page.click('#btn-challenge');
  await page.fill('#ch-name', 'x'); await page.click('#ch-new');
  await expect(page.locator('#ch-err')).toContainText('2～12');
  await page.fill('#ch-name', '阿明');
  await page.click('#ch-new');
  await until(page, () => window.__T.G && window.__T.G.mode === 'challenge');
  expect(await page.evaluate(() => [window.__T.G.marketPlan.length, window.__T.G.kb, window.__T.G.diff.name])).toEqual([30, null, '適中']);
  await quickWin(page);
  await expect(page.locator('.ch-res')).toContainText('挑戰已建立');
  await expect(page.locator('.ch-res a[href^="https://line.me/R/share"]')).toBeVisible();
  const post = db.posts.find(p => p.path === '/v1/challenge').body;
  expect(post.deck).toHaveLength(40); expect(post.name).toBe('阿明'); expect(post.win).toBe(true);
  expect(post.score).toBeGreaterThanOrEqual(500); expect(post.score).toBeLessThanOrEqual(1500);
  await page.click('.ch-res [data-ch="view"]');
  await expect(page.locator('#scr-challenge')).toBeVisible();
  await expect(page.locator('.ch-list li.you')).toContainText('阿明');
});

test('the same seed gives everyone the same decks, opponent profile and market events', async ({ browser, page, errors }) => {
  const setup = async p => {
    await open(p);
    return p.evaluate(() => { const T = window.__T, deck = T.autoDeck();
      T.startDuel({ mode: 'challenge', challenge: { id: 'K7Q2MX', seed: 777, deck, by: '某人' } });
      const G = T.G; return { p: G.deck.p.map(c => c.id), c: G.deck.c.map(c => c.id), prof: G.foeProf, plan: G.marketPlan }; });
  };
  const a = await setup(page);
  const other = await browser.newContext(); const p2 = await other.newPage();
  await p2.route(/fonts\.|financial-duel-api\./, r => r.abort());
  await p2.addInitScript(() => { localStorage.setItem('soba-ketto.e2e.fast', '1'); localStorage.setItem('soba-ketto.tutorial.v1', 'done'); });
  const b = await setup(p2);
  expect(b).toEqual(a);
  await other.close();
});

test.describe('a new player from a link', () => {
  test.use({ tutorialDone: false });
  test('opens the challenge, accepts it without the tutorial first, and gets a rank', async ({ page, errors }) => {
    const db = api(page);
    await page.goto('./?c=k7q2mx');
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await expect(page.locator('#scr-challenge')).toBeVisible();
    await expect(page.locator('.ch-head')).toContainText('出題者 的挑戰');
    await expect(page.locator('.ch-head')).toContainText('目前最高 900 分');
    expect(page.url()).not.toContain('c=');
    await page.fill('#ch-name', '小華');
    await page.click('#ch-accept');
    await until(page, () => window.__T.G && window.__T.G.mode === 'challenge');
    expect(await page.evaluate(() => window.__T.G.challenge.seed)).toBe(4242);
    await quickWin(page);
    await expect(page.locator('.ch-res')).toContainText('在 出題者 的挑戰中排第');
    expect(db.posts.find(p => p.path === '/v1/challenge/K7Q2MX/result').body.name).toBe('小華');
  });
});
