// 線上排行榜: joining with a nickname, a ranked duel scored by the server, the board, leaving, and playing on when
// the server cannot be reached. The API is a small in-memory stand-in (the real Worker has its own tests in worker/test).
import { test, expect, open, answer, until } from './fixtures.js';
import { scoreMatch, seasonOf, prevSeason, tierOf, checkPerf } from '../src/js/rankrules.js';

function mockApi() {
  const players = new Map(), tickets = new Map(), calls = [];
  const S = seasonOf();
  players.set('p1', { id: 'p1', name: '股海老手', rp: 520, peak: 3, w: 12, l: 3 });
  players.set('p2', { id: 'p2', name: '存股族', rp: 260, peak: 2, w: 6, l: 4 });
  const me = p => { const rank = [...players.values()].filter(x => x.w + x.l > 0 && x.rp > p.rp).length + 1; return { season: S, rp: p.rp, tier: tierOf(p.rp), peak: p.peak, w: p.w, l: p.l, rank }; };
  const who = req => { const m = /^Bearer (\w+)\./.exec(req.headers().authorization || ''); return m && players.get(m[1]); };
  const state = { down: false };
  async function handle(route) {
    const req = route.request(), url = new URL(req.url()), path = url.pathname, method = req.method();
    if (state.down) return route.abort('internetdisconnected');
    calls.push(`${method} ${path}`);
    const reply = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' } });
    if (path === '/v1/ping') return reply(200, { ok: true, days: 1 });
    const body = req.postData() ? JSON.parse(req.postData()) : {};
    const p = who(req);
    if (path === '/v1/register') {
      const name = String(body.name || '').trim();
      if ([...name].length < 2) return reply(400, { error: '暱稱需要 2～12 個字', code: 'name' });
      if ([...players.values()].some(x => x.name === name)) return reply(409, { error: '這個暱稱已經有人使用了', code: 'taken' });
      const id = `n${players.size + 1}`, rp = Math.min(250, body.rp || 0);
      players.set(id, { id, name, rp, peak: tierOf(rp), w: 0, l: 0 });
      return reply(201, { id, token: 'f'.repeat(64), name, me: me(players.get(id)) });
    }
    if (path === '/v1/board') {
      const season = url.searchParams.get('season') || S;
      const rows = season === S ? [...players.values()].filter(x => x.w + x.l > 0).sort((a, b) => b.rp - a.rp)
        .map((x, i) => ({ rank: i + 1, name: x.name, rp: x.rp, tier: tierOf(x.rp), peak: x.peak, w: x.w, l: x.l, you: !!p && x.id === p.id })) : [];
      return reply(200, { season, current: S, previous: prevSeason(S), total: rows.length, rows, me: p && p.w + p.l > 0 ? { ...me(p), name: p.name } : null });
    }
    if (!p) return reply(401, { error: '找不到這個排行榜身分，請重新加入', code: 'auth' });
    if (path === '/v1/me' && method === 'GET') return reply(200, { id: p.id, name: p.name, me: me(p) });
    if (path === '/v1/me' && method === 'POST') { p.name = body.name; return reply(200, { name: p.name }); }
    if (path === '/v1/me' && method === 'DELETE') { players.delete(p.id); return reply(200, { ok: true }); }
    if (path === '/v1/match/start') { const t = 'a'.repeat(31) + tickets.size; tickets.set(t, { player: p.id, open: true }); return reply(200, { ticket: t, season: S, forfeited: null }); }
    if (path === '/v1/match/end') {
      api.lastEnd = body;
      const t = tickets.get(body.ticket);
      if (!t || t.player !== p.id) return reply(404, { error: '找不到這場對戰', code: 'ticket' });
      if (!t.open) return reply(409, { error: '這場對戰已經結算過了', code: 'used' });
      const perf = body.surrender ? { score: 0 } : checkPerf(body.perf);
      if (!perf) return reply(400, { error: '表現分資料不正確', code: 'perf' });
      t.open = false;
      const r = scoreMatch(p.rp, !body.surrender && body.win, perf.score);
      p.rp = r.after; p.peak = Math.max(p.peak, r.tierAfter); r.win ? p.w++ : p.l++;
      return reply(200, { ...r, expired: false, me: me(p) });
    }
    return reply(404, { error: '找不到這個網址', code: 'not_found' });
  }
  const api = { handle, calls, players, state, lastEnd: null };
  return api;
}

async function withApi(page) {
  const api = mockApi();
  await page.route(/financial-duel-api\.maxwei6699\.workers\.dev/, r => api.handle(r));
  return api;
}
async function quickWin(page) {
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.evaluate(() => { const T = window.__T; T.calc.FOE_BLOCK[Object.keys(T.DIFFS).find(k => T.DIFFS[k] === T.G.diff)] = 0; T.G.lp.c = 50; T.G.hand.c = []; T.renderAll(); });
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#scr-result')).toBeVisible({ timeout: 30_000 });
}
async function joinAs(page, name) {
  await page.click('#btn-ranked'); await page.click('#rk-board');
  await page.fill('#bd-name', name); await page.click('#bd-join');
  await expect(page.locator('.bd-me')).toContainText(name);
}

test('join the board with a nickname and see the ranking', async ({ page, errors }) => {
  const api = await withApi(page);
  await open(page);
  await page.click('#btn-ranked');
  await expect(page.locator('#rk-online')).toContainText('取一個暱稱');
  await page.click('#rk-board');
  await expect(page.locator('.bd-list li')).toHaveCount(2);
  await expect(page.locator('.bd-list li').first()).toContainText('股海老手');
  await page.fill('#bd-name', 'x'); await page.click('#bd-join');
  await expect(page.locator('#bd-err')).toContainText('2～12');
  await page.fill('#bd-name', '存股族'); await page.click('#bd-join');
  await expect(page.locator('#bd-err')).toContainText('已經有人使用');
  await page.fill('#bd-name', '小明投資');
  await page.press('#bd-name', 'Enter');
  await expect(page.locator('.bd-me')).toContainText('小明投資');
  await expect(page.locator('.bd-me')).toContainText('打完一場就會上榜');
  expect(await page.evaluate(() => window.__T.online.joined())).toBe(true);
  expect(api.calls).toContain('POST /v1/register');
});

test('a ranked duel is scored by the server and shows the online rank', async ({ page, errors }) => {
  const api = await withApi(page);
  await open(page);
  await joinAs(page, '阿華');
  await page.click('#bd-ranked');
  await expect(page.locator('#rk-online')).toContainText('阿華');
  await page.click('#rk-go');
  await quickWin(page);
  await expect(page.locator('.rr-online')).toContainText('本季第 3 名');
  expect(api.calls).toEqual(expect.arrayContaining(['POST /v1/match/start', 'POST /v1/match/end']));
  const log = api.lastEnd.answers;                                   // the answer log the server judges
  expect(log.length).toBeGreaterThanOrEqual(1);
  expect(log[0]).toEqual(expect.objectContaining({ qid: expect.any(String), pick: expect.any(Number), ms: expect.any(Number), mode: 'attack' }));
  const server = [...api.players.values()].find(x => x.name === '阿華');
  expect(server.w).toBe(1);
  expect(await page.evaluate(() => window.__T.ranked.state().rp)).toBe(server.rp);
  await page.click('.rr-online [data-act="board"]');
  await expect(page.locator('.bd-list li.you')).toContainText('阿華');
});

test('surrendering a ranked duel is reported to the server as a loss', async ({ page, errors }) => {
  const api = await withApi(page);
  await open(page);
  await joinAs(page, '小美');
  await page.click('#bd-ranked'); await page.click('#rk-go');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click('#btn-quit'); await page.click('#btn-quit');
  await until(page, () => window.__T.online.state().me && window.__T.online.state().me.l === 1);
  expect([...api.players.values()].find(x => x.name === '小美').l).toBe(1);
});

test('without a connection the duel still counts here and the result is sent later', async ({ page, errors }) => {
  const api = await withApi(page);
  await open(page);
  await joinAs(page, '離線測試');
  await page.click('#bd-ranked');
  await page.click('#rk-go');
  await until(page, () => !!window.__T.online.state().ticket);
  api.state.down = true;
  await quickWin(page);
  await expect(page.locator('.rr-online')).toContainText('下次連線');
  expect(await page.evaluate(() => !!window.__T.online.state().outbox)).toBe(true);
  await page.evaluate(() => window.__T.openBoard());
  await expect(page.locator('.bd-msg.bad')).toContainText('連不上');
  api.state.down = false;
  await page.click('#bd-retry');
  await expect(page.locator('.bd-list li.you')).toContainText('離線測試');
  expect(await page.evaluate(() => window.__T.online.state().outbox)).toBe(null);
  expect([...api.players.values()].find(x => x.name === '離線測試').w).toBe(1);
});

test('leaving the board deletes the nickname', async ({ page, errors }) => {
  const api = await withApi(page);
  await open(page);
  await joinAs(page, '要離開的人');
  await page.click('#bd-leave');
  await expect(page.locator('#bd-leave')).toContainText('再按一次');
  await page.click('#bd-leave');
  await expect(page.locator('.bd-join')).toBeVisible();
  expect(api.calls).toContain('DELETE /v1/me');
  expect(await page.evaluate(() => window.__T.online.joined())).toBe(false);
});
