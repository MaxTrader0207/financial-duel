// 轉移碼: one device uploads its progress and shows a code; another device redeems it and takes over the progress
import { test, expect, open } from './fixtures.js';

test('a transfer code moves progress to another browser', async ({ browser, page, errors }) => {
  let stored = null;
  const api = async route => {
    const r = route.request(), path = new URL(r.url()).pathname, cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (path === '/v1/ping') return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true}' });
    if (path === '/v1/transfer') { stored = JSON.parse(r.postData()).data; return route.fulfill({ status: 201, headers: cors, contentType: 'application/json', body: JSON.stringify({ code: 'K7Q2-M9XD', expires: Date.now() + 864e5 }) }); }
    if (path === '/v1/transfer/redeem') {
      const ok = stored && JSON.parse(r.postData()).code.toUpperCase().replace(/[^0-9A-Z]/g, '') === 'K7Q2M9XD';
      const body = ok ? { data: stored } : { error: '找不到這組轉移碼，可能打錯或已經過期' }; if (ok) stored = null;
      return route.fulfill({ status: ok ? 200 : 404, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    }
    return route.abort();
  };
  await page.route(/financial-duel-api\./, api);
  await open(page);
  await page.evaluate(() => { window.__T.daily.addShards(321); });
  await page.click('#btn-set');
  await page.click('#xfer-make');
  await expect(page.locator('#xfer-code')).toContainText('K7Q2-M9XD');
  expect(stored.data['soba-ketto.profile.v1']).toContain('321');

  const other = await browser.newContext(); const p2 = await other.newPage();
  await p2.route(/fonts\./, r => r.abort()); await p2.route(/financial-duel-api\./, api);
  await p2.addInitScript(() => { localStorage.setItem('soba-ketto.e2e.fast', '1'); localStorage.setItem('soba-ketto.tutorial.v1', 'done'); localStorage.setItem('soba-ketto.quests.v1', JSON.stringify({ claimed: ['tut', 'win', 'deck', 'daily', 'nb', 'ranked'], marks: {}, grad: true })); });
  await open(p2);
  expect(await p2.evaluate(() => window.__T.daily.profile().shards)).toBe(0);
  await p2.click('#btn-set');
  await p2.fill('#xfer-in', 'wrong-code');
  await p2.click('#xfer-use'); await p2.click('#xfer-use');
  await expect(p2.locator('#xfer-status')).toContainText('找不到');
  await p2.fill('#xfer-in', 'k7q2 m9xd');
  await p2.click('#xfer-use');
  await expect(p2.locator('#xfer-use')).toContainText('再按一次');
  await p2.click('#xfer-use');
  await p2.waitForEvent('load');
  await p2.waitForFunction(() => document.documentElement.dataset.ready === '1');
  expect(await p2.evaluate(() => window.__T.daily.profile().shards)).toBe(321);
  await other.close();
});
