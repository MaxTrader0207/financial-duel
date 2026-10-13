// Integration tests: the real Worker on a local D1 (wrangler dev), called over HTTP.
// Run with `npm test` inside worker/ (it applies the migrations to a fresh local database first).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cleanName } from '../src/index.js';

const PORT = 8790, BASE = `http://127.0.0.1:${PORT}`;
let dev;
const T0 = Date.UTC(2026, 9, 15, 4);                     // 2026-10-15 12:00 in Taiwan
let clock = T0;
const MIN = 60e3;

let ipN = 0;
async function call(method, path, { body, auth, now = clock, ip } = {}) {
  const headers = { 'X-Test-Now': String(now), 'CF-Connecting-IP': ip || `10.0.0.${++ipN}` };
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${auth.id}.${auth.token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}
const join = async (name, extra = {}) => { const r = await call('POST', '/v1/register', { body: { name, ...extra } }); assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body; };
const perf = (k, s, r) => ({ knowledge: k, strategy: s, risk: r });
async function duel(p, win, pf = perf(30, 20, 15), ms = 5 * MIN) {
  const s = await call('POST', '/v1/match/start', { auth: p });
  assert.equal(s.status, 200, JSON.stringify(s.body));
  clock += ms;
  return call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, win, perf: pf } });
}

before(async () => {
  rmSync(new URL('../.wrangler/test', import.meta.url), { recursive: true, force: true });
  const opts = { cwd: new URL('..', import.meta.url), stdio: 'pipe' };
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'financial-duel', '--local', '--persist-to', '.wrangler/test'], opts);
  dev = spawn('npx', ['wrangler', 'dev', '--local', '--port', String(PORT), '--ip', '127.0.0.1', '--persist-to', '.wrangler/test',
    '--var', 'TEST_CLOCK:1', '--var', 'MIN_MATCH_MS:60000', '--var', 'STATS_KEY:test-stats-key', '--show-interactive-dev-session=false'], { ...opts, detached: true });
  let log = ''; dev.stdout.on('data', d => { log += d; }); dev.stderr.on('data', d => { log += d; });
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(`${BASE}/v1/health`); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`wrangler dev did not start:\n${log}`);
});
after(() => { if (dev) try { process.kill(-dev.pid, 'SIGTERM'); } catch { /* already gone */ } });

test('nicknames: length, characters and blocked words', () => {
  assert.equal(cleanName('小明').name, '小明');
  assert.equal(cleanName('  Max_Trader  ').name, 'Max_Trader');
  assert.equal(cleanName('ＡＢＣ').name, 'ABC');                    // full-width letters are normalized
  assert.ok(cleanName('a').error);
  assert.ok(cleanName('一二三四五六七八九十一二三').error);
  assert.ok(cleanName('<script>').error);
  assert.ok(cleanName('-abc').error);
  assert.ok(cleanName('Admin大大').error);
  assert.equal(cleanName('操盤手阿明').name, '操盤手阿明');            // 操 alone is fine
});

test('health and CORS', async () => {
  const r = await call('GET', '/v1/health');
  assert.equal(r.status, 200); assert.equal(r.body.season, '2026-10');
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  const o = await fetch(`${BASE}/v1/board`, { method: 'OPTIONS' });
  assert.equal(o.status, 204);
});

test('register: unique names, seed points capped at 資深分析師', async () => {
  const a = await join('阿明', { rp: 900 });
  assert.match(a.id, /^[0-9a-f]{32}$/); assert.match(a.token, /^[0-9a-f]{64}$/);
  assert.equal(a.me.rp, 250); assert.equal(a.me.tier, 2);
  const dup = await call('POST', '/v1/register', { body: { name: '阿明' } });
  assert.equal(dup.status, 409);
  const bad = await call('POST', '/v1/register', { body: { name: 'x' } });
  assert.equal(bad.status, 400); assert.ok(bad.body.error);
  const me = await call('GET', '/v1/me', { auth: a });
  assert.equal(me.body.name, '阿明');
  const wrong = await call('GET', '/v1/me', { auth: { id: a.id, token: '0'.repeat(64) } });
  assert.equal(wrong.status, 401);
});

test('a ranked duel: the server computes the points', async () => {
  const p = await join('小華');
  const r = await duel(p, true, perf(40, 35, 25));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.delta, 28); assert.equal(r.body.me.rp, 28); assert.equal(r.body.me.w, 1);   // 見習交易員: +22, +6 for a perfect duel
  const l = await duel(p, false, perf(0, 0, 0));
  assert.equal(l.body.delta, -16); assert.equal(l.body.me.rp, 12);
  const shield = await duel(p, false, perf(0, 0, 0));
  assert.equal(shield.body.after, 0);
});

test('tickets: used once, too-fast duels refused, bad performance refused', async () => {
  const p = await join('阿哲');
  const s = await call('POST', '/v1/match/start', { auth: p });
  const fast = await call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, win: true, perf: perf(40, 35, 25) } });
  assert.equal(fast.status, 422);
  clock += 5 * MIN;
  const cheat = await call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, win: true, perf: perf(400, 35, 25) } });
  assert.equal(cheat.status, 400);
  const ok = await call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, win: true, perf: perf(20, 10, 10) } });
  assert.equal(ok.status, 200);
  const again = await call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, win: true, perf: perf(20, 10, 10) } });
  assert.equal(again.status, 409);
  const other = await join('路人甲');
  const s2 = await call('POST', '/v1/match/start', { auth: p });
  clock += 5 * MIN;
  const steal = await call('POST', '/v1/match/end', { auth: other, body: { ticket: s2.body.ticket, win: true, perf: perf(40, 35, 25) } });
  assert.equal(steal.status, 404);
});

test('starting a new duel forfeits the open one; surrender is a loss', async () => {
  const p = await join('阿宏', { rp: 250 });
  await call('POST', '/v1/match/start', { auth: p });
  const s = await call('POST', '/v1/match/start', { auth: p });
  assert.equal(s.body.forfeited.delta, 0);                    // shielded at the 資深分析師 floor
  const r = await call('POST', '/v1/match/end', { auth: p, body: { ticket: s.body.ticket, surrender: true } });
  assert.equal(r.status, 200); assert.equal(r.body.me.l, 2);
});

test('board: order, ties, your own rank, players with no duel hidden', async () => {
  const r = await call('GET', '/v1/board');
  assert.equal(r.status, 200);
  const names = r.body.rows.map(x => x.name);
  assert.ok(!names.includes('路人甲'));
  for (let i = 1; i < r.body.rows.length; i++) assert.ok(r.body.rows[i - 1].rp >= r.body.rows[i].rp);
  assert.equal(r.body.rows[0].rank, 1);
  const p = await join('排行測試');
  await duel(p, true, perf(40, 35, 25));
  const mine = await call('GET', '/v1/board', { auth: p });
  assert.equal(mine.body.me.name, '排行測試');
  assert.ok(mine.body.rows.some(x => x.you && x.name === '排行測試'));
  assert.equal(mine.headers.get('cache-control'), 'no-store');
});

test('a new season starts two tiers lower; the old board stays', async () => {
  const p = await join('賽季測試', { rp: 250 });
  for (let i = 0; i < 9; i++) await duel(p, true, perf(40, 35, 25));     // 250 + 9×23 = 457 → 操盤手
  const before = await call('GET', '/v1/me', { auth: p });
  assert.equal(before.body.me.tier, 3);
  clock = Date.UTC(2026, 10, 2, 4);                                       // 2026-11-02
  const now = await call('GET', '/v1/me', { auth: p });
  assert.equal(now.body.me.season, '2026-11'); assert.equal(now.body.me.rp, 100); assert.equal(now.body.me.tier, 1);
  const old = await call('GET', '/v1/board?season=2026-10');
  assert.ok(old.body.rows.some(x => x.name === '賽季測試' && x.rp === 457));
  const cur = await call('GET', '/v1/board');
  assert.equal(cur.body.season, '2026-11'); assert.equal(cur.body.previous, '2026-10');
});

test('rename and leave', async () => {
  const p = await join('改名前');
  const r = await call('POST', '/v1/me', { auth: p, body: { name: '改名後' } });
  assert.equal(r.status, 200); assert.equal(r.body.name, '改名後');
  const taken = await call('POST', '/v1/me', { auth: p, body: { name: '阿明' } });
  assert.equal(taken.status, 409);
  const del = await call('DELETE', '/v1/me', { auth: p });
  assert.equal(del.status, 200);
  assert.equal((await call('GET', '/v1/me', { auth: p })).status, 401);
});

test('rate limit: at most 5 new players a day from one address', async () => {
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await call('POST', '/v1/register', { body: { name: `同一網路${i}` }, ip: '10.9.9.9' })).status);
  assert.deepEqual(codes, [201, 201, 201, 201, 201, 429]);
});

test('rate limit: at most 30 duels an hour', async () => {
  const p = await join('連打測試');
  let last;
  for (let i = 0; i < 31; i++) last = await call('POST', '/v1/match/start', { auth: p });
  assert.equal(last.status, 429);
});

test('anonymous daily statistics: pings add up per day, the report needs the key', async () => {
  clock = Date.UTC(2026, 11, 10, 4);                                      // 2026-12-10, a quiet month for this test
  const pid = n => n.toString(16).padStart(32, '0');
  const send = (p, days, ip) => call('POST', '/v1/ping', { body: { pid: p, days }, ip });
  assert.equal((await send(pid(1), { '2026-12-10': { open: 1, duels: 2, casual: 2, wins: 1 } })).status, 200);
  await send(pid(1), { '2026-12-10': { open: 1, duels: 1, ranked: 1 } });          // same player again: still one player
  await send(pid(2), { '2026-12-10': { open: 1, daily: 1 }, '2026-12-09': { open: 1, duels: 1, tutorial: 1 } });
  await send(pid(3), { '2026-12-11': { open: 1 }, '2026-11-01': { open: 1 }, '2026-12-08': { open: 1, duels: 9999, hack: 5 } });   // future & old days dropped, counts capped
  assert.equal((await send('nope', {})).status, 400);
  assert.equal((await call('GET', '/v1/stats')).status, 403);
  assert.equal((await call('GET', '/v1/stats?key=wrong')).status, 403);
  const r = await call('GET', '/v1/stats?key=test-stats-key&format=json');
  assert.equal(r.status, 200);
  const day = d => r.body.rows.find(x => x.day === d);
  assert.deepEqual([day('2026-12-10').players, day('2026-12-10').duels, day('2026-12-10').casual, day('2026-12-10').ranked, day('2026-12-10').daily, day('2026-12-10').open], [2, 3, 2, 1, 1, 3]);
  assert.deepEqual([day('2026-12-09').players, day('2026-12-09').newPlayers, day('2026-12-10').newPlayers], [1, 1, 1]);
  assert.equal(day('2026-12-08').duels, 200);
  assert.equal(r.body.rows.find(x => x.day === '2026-12-11'), undefined);
  assert.equal(r.body.summary.weekPlayers, 3);
  const html = await fetch(`${BASE}/v1/stats?key=test-stats-key`, { headers: { 'X-Test-Now': String(clock) } });
  assert.match(html.headers.get('content-type'), /text\/html/);
  assert.match(await html.text(), /每日統計/);
});

test('transfer codes: upload progress, redeem once on another device, expire after a day', async () => {
  const data = { app: 'financial-duel', format: 1, exportedAt: 'x', data: { 'soba-ketto.collection.v1': '{"v":1}', 'soba-ketto.big': 'x'.repeat(50_000) } };
  const c = await call('POST', '/v1/transfer', { body: { data } });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  assert.match(c.body.code, /^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  assert.equal((await call('POST', '/v1/transfer', { body: { data: { app: 'other' } } })).status, 400);
  const typed = c.body.code.toLowerCase().replace('-', ' ');                // lower case and a space still work
  const r = await call('POST', '/v1/transfer/redeem', { body: { code: typed } });
  assert.equal(r.status, 200); assert.deepEqual(r.body.data, data);
  assert.equal((await call('POST', '/v1/transfer/redeem', { body: { code: c.body.code } })).status, 404);   // single use
  assert.equal((await call('POST', '/v1/transfer/redeem', { body: { code: '12' } })).status, 400);
  const old = await call('POST', '/v1/transfer', { body: { data } });
  assert.equal((await call('POST', '/v1/transfer/redeem', { body: { code: old.body.code }, now: clock + 25 * 3600e3 })).status, 404);  // expired
});
