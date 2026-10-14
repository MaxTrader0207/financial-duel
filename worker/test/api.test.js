// Integration tests: the real Worker on a local D1 (wrangler dev), called over HTTP.
// Run with `npm test` inside worker/ (it applies the migrations to a fresh local database first).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cleanName } from '../src/names.js';
import { readFileSync } from 'node:fs';

/* answer logs for ranked results: 10 real questions from the bank, `right` of them answered correctly */
const BANK = JSON.parse(readFileSync(new URL('../../public/data/questions.json', import.meta.url), 'utf8')).questions;
const answers = (right, { ms = 3000, n = 10 } = {}) => BANK.slice(0, n).map((q, i) => ({ qid: q.id, pick: i < right ? q.answer : (q.answer + 1) % 4, ms, mode: i % 2 ? 'defend' : 'attack' }));

const PORT = 8790, BASE = `http://127.0.0.1:${PORT}`;
let dev;
const T0 = Date.UTC(2026, 9, 15, 4);                     // 2026-10-15 12:00 in Taiwan
let clock = T0;
const MIN = 60e3;

let ipN = 0;
async function call(method, path, { body, auth, now = clock, ip } = {}) {
  const headers = { 'X-Test-Now': String(now), 'CF-Connecting-IP': ip || `10.0.0.${++ipN}` };
  /* a result with a performance and no answer log first answers 10 server questions so that the knowledge part
     matches perf.knowledge */
  if (path === '/v1/match/end' && body && body.perf && !body.answers && body.perf.knowledge <= 40 && auth) { await play(auth, body.ticket, Math.round(body.perf.knowledge / 4), 10, now - 4 * MIN); body = { ...body, answers: [] }; }
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${auth.id}.${auth.token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}
/* answer n questions asked by the server, `right` of them correctly, 3 s each, starting at time t */
const CATS = ['tech', 'fund', 'deriv', 'risk', 'chips', 'fx', 'crypto', 'etf'];
async function play(auth, ticket, right, n = 10, t = clock, opts = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const q = await call('POST', '/v1/match/q', { auth, now: t, body: { ticket, cat: CATS[i % 8], rank: 1 + (i % 4), limit: 20, ...opts } });
    if (q.status !== 200) return out;
    t += opts.ms ?? 3000;
    const pick = i < right ? q.body.testAnswer : (q.body.testAnswer + 1) % 4;
    const a = await call('POST', '/v1/match/a', { auth, now: t, body: { ticket, n: q.body.n, pick } });
    out.push({ q: q.body, a: a.body, status: a.status });
    t += 1000;
  }
  return out;
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

test('season history: my past seasons with final rank, and the hall of fame (top 3 of each ended season)', async () => {
  clock = Date.UTC(2027, 5, 10, 4);                                  // 2027-06
  const ps = [];
  for (const n of ['名人甲', '名人乙', '名人丙', '名人丁']) ps.push(await join(n));
  for (let i = 0; i < ps.length; i++) for (let k = 0; k < 4 - i; k++) await duel(ps[i], true, perf(40, 35, 25));   // 甲 4 wins … 丁 1 win
  clock = Date.UTC(2027, 6, 3, 4);                                   // 2027-07: June has ended
  await duel(ps[3], true, perf(40, 35, 25));
  const mine = await call('GET', '/v1/me/seasons', { auth: ps[1] });
  assert.equal(mine.status, 200);
  assert.deepEqual(mine.body.seasons.map(x => [x.season, x.rank, x.total, x.ended]), [['2027-06', 2, 4, true]]);
  assert.equal(mine.body.seasons[0].w, 3);
  const d = await call('GET', '/v1/me/seasons', { auth: ps[3] });
  assert.deepEqual(d.body.seasons.map(x => [x.season, x.ended]), [['2027-07', false], ['2027-06', true]]);
  const h = await call('GET', '/v1/hall');
  const june = h.body.seasons.find(x => x.season === '2027-06');
  assert.equal(june.total, 4); assert.deepEqual(june.top.map(x => x.name), ['名人甲', '名人乙', '名人丙']);
  assert.ok(!h.body.seasons.some(x => x.season === '2027-07'));     // the running season is not in the hall yet
  assert.equal((await call('GET', '/v1/me/seasons')).status, 401);
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

test('statistics: next-day and 7-day retention of new players, tutorial completion', async () => {
  clock = Date.UTC(2027, 0, 20, 4);                                        // 2027-01-20, a fresh month for this test
  const pid = n => (1000 + n).toString(16).padStart(32, '0');
  const send = (p, days) => call('POST', '/v1/ping', { body: { pid: p, days } });
  for (let i = 0; i < 4; i++) await send(pid(i), { '2027-01-10': { open: 1, tutorial: i < 3 ? 1 : 0 } });   // 4 new on the 10th, 3 finish the tutorial
  await send(pid(0), { '2027-01-11': { open: 1 } });                     // 1 comes back the next day
  await send(pid(1), { '2027-01-15': { open: 1 } });                     // 1 more within a week
  const r = await call('GET', '/v1/stats?key=test-stats-key&format=json');
  const d = r.body.rows.find(x => x.day === '2027-01-10');
  assert.deepEqual([d.newPlayers, d.d1, d.d7], [4, 1, 2]);
  assert.equal(d.d1Rate, 0.25); assert.equal(d.d7Rate, 0.5);
  assert.equal(r.body.rows.find(x => x.day === '2027-01-20').d1Rate, null);     // today's cohort is not known yet
  assert.equal(r.body.summary.d7, 0.5);
});

test('friend challenges: create with a score, others add theirs, best score per nickname, expiry', async () => {
  clock = Date.UTC(2027, 1, 1, 4);
  const deck = Array.from({ length: 40 }, (_, i) => `card_${i % 20}`);
  const c = await call('POST', '/v1/challenge', { body: { seed: 12345, deck, name: '出題者', score: 900, win: true } });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  assert.match(c.body.id, /^[2-9A-HJKMNP-Z]{6}$/);
  assert.deepEqual([c.body.seed, c.body.deck.length, c.body.by, c.body.results.length], [12345, 40, '出題者', 1]);
  assert.equal((await call('POST', '/v1/challenge', { body: { seed: 1, deck: deck.slice(0, 5), name: '某人', score: 1 } })).status, 400);
  assert.equal((await call('POST', '/v1/challenge', { body: { seed: 1, deck, name: '某人', score: 99999 } })).status, 400);
  const id = c.body.id;
  await call('POST', `/v1/challenge/${id}/result`, { body: { name: '朋友A', score: 1100, win: true } });
  await call('POST', `/v1/challenge/${id}/result`, { body: { name: '朋友B', score: 300, win: false } });
  await call('POST', `/v1/challenge/${id}/result`, { body: { name: '朋友A', score: 500, win: false } });   // a worse replay is ignored
  const v = await call('GET', `/v1/challenge/${id}`);
  assert.deepEqual(v.body.results.map(r => [r.name, r.score]), [['朋友A', 1100], ['出題者', 900], ['朋友B', 300]]);
  assert.equal((await call('GET', `/v1/challenge/${id}`, { now: clock + 31 * 864e5 })).status, 404);
  assert.equal((await call('GET', '/v1/challenge/ZZZZZZ')).status, 404);
});

test('the server judges ranked answers: knowledge comes from its own check, implausible logs are refused', async () => {
  clock = Date.UTC(2027, 2, 1, 4);
  const p = await join('判分測試');
  const start = async () => (await call('POST', '/v1/match/start', { auth: p })).body.ticket;
  const end = (ticket, body) => call('POST', '/v1/match/end', { auth: p, body: { ticket, ...body } });
  const z = { knowledge: 0, strategy: 0, risk: 0 };
  /* the browser claims 40; the server asked 10 and found 5 right */
  let t = await start(); await play(p, t, 5, 10, clock + 1000); clock += 5 * MIN;
  const r = await end(t, { win: true, perf: { knowledge: 40, strategy: 35, risk: 25 }, answers: [] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.perf.knowledge, 20); assert.equal(r.body.perf.score, 80); assert.deepEqual(r.body.perf.judged, { total: 10, correct: 5 });
  /* up to 3 fallback answers from the public bank (a dropped connection) are added in */
  t = await start(); await play(p, t, 4, 8, clock + 1000); clock += 5 * MIN;
  const mix = await end(t, { win: true, perf: { knowledge: 0, strategy: 0, risk: 0 }, answers: answers(2, { n: 2 }) });
  assert.equal(mix.status, 200, JSON.stringify(mix.body)); assert.deepEqual(mix.body.perf.judged, { total: 10, correct: 6 });
  /* an old game that answers everything from the public bank is asked to update */
  t = await start(); clock += 5 * MIN;
  const old = await end(t, { win: true, perf: z, answers: answers(10) });
  assert.equal(old.status, 422); assert.match(old.body.error, /更新遊戲/);
  /* a win with one right answer, answers faster than 0.4 s, nothing answered at all */
  t = await start(); await play(p, t, 1, 6, clock + 1000); clock += 5 * MIN;
  assert.equal((await end(t, { win: true, perf: z, answers: [] })).status, 422);
  t = await start(); await play(p, t, 6, 6, clock + 1000, { ms: 100 }); clock += 5 * MIN;
  assert.equal((await end(t, { win: false, perf: z, answers: [] })).status, 422);
  t = await start(); clock += 5 * MIN;
  assert.equal((await end(t, { win: true, perf: z, answers: [] })).status, 422);
  t = await start(); clock += 5 * MIN;
  assert.equal((await end(t, { win: true, perf: z, answers: [{ qid: 'nope', pick: 0, ms: 3000, mode: 'attack' }] })).status, 422);
});

test('server questions: no answer before picking, skills (remove, retry), late answers, unanswered ones, repeats', async () => {
  clock = Date.UTC(2027, 2, 10, 4);
  const p = await join('出題測試'), other = await join('旁觀者');
  const t = (await call('POST', '/v1/match/start', { auth: p })).body.ticket;
  const ask = (body, now = clock) => call('POST', '/v1/match/q', { auth: p, now, body: { ticket: t, cat: 'risk', rank: 2, limit: 20, ...body } });
  const answer = (n, pick, now) => call('POST', '/v1/match/a', { auth: p, now, body: { ticket: t, n, pick } });
  /* a question: four options, no answer in the reply (testAnswer is only sent under TEST_CLOCK) */
  let q = await ask({ remove: 2 });
  assert.equal(q.status, 200, JSON.stringify(q.body)); assert.equal(q.body.options.length, 4); assert.equal(q.body.category, 'risk');
  assert.equal(q.body.answer, undefined); assert.equal(q.body.explain, undefined);
  assert.equal(q.body.removed.length, 2); assert.ok(!q.body.removed.includes(q.body.testAnswer));
  assert.equal((await answer(q.body.n, q.body.removed[0], clock + 2000)).status, 400);           // a removed option
  let a = await answer(q.body.n, q.body.testAnswer, clock + 2000);
  assert.deepEqual([a.status, a.body.correct, a.body.answer], [200, true, q.body.testAnswer]); assert.ok(a.body.explain.length > 5);
  assert.equal((await answer(q.body.n, (q.body.testAnswer + 1) % 4, clock + 3000)).body.correct, true);   // asking again: same result
  /* 再答一次: the first wrong pick keeps the question open */
  q = await ask({ retry: true }, clock + 5000);
  a = await answer(q.body.n, (q.body.testAnswer + 1) % 4, clock + 7000); assert.deepEqual(a.body, { retry: true });
  a = await answer(q.body.n, q.body.testAnswer, clock + 9000); assert.equal(a.body.correct, true);
  /* a right pick after the time limit (+ grace) is a time-out */
  q = await ask({ limit: 10 }, clock + 10000);
  a = await answer(q.body.n, q.body.testAnswer, clock + 10000 + 15000); assert.equal(a.body.correct, false);
  /* the time limit is capped at 35 s whatever the browser asks */
  q = await ask({ limit: 999 }, clock + 30000); assert.equal(q.body.limit, 35);
  /* left unanswered: asking the next one closes it as a time-out */
  const q5 = await ask({}, clock + 40000);
  assert.equal((await answer(q.body.n, q.body.testAnswer, clock + 41000)).body.correct, false);
  assert.equal((await answer(q5.body.n, q5.body.testAnswer, clock + 42000)).body.correct, true);
  /* someone else cannot use the ticket */
  assert.equal((await call('POST', '/v1/match/q', { auth: other, body: { ticket: t, cat: 'fx', rank: 1, limit: 20 } })).status, 404);
  assert.equal((await ask({ cat: 'nope' })).status, 400);
  /* the server counts 5 asked, 3 right; one more is asked and left open at the end (a time-out) */
  await ask({}, clock + 50000);
  clock += 5 * MIN;
  const r = await call('POST', '/v1/match/end', { auth: p, body: { ticket: t, win: true, perf: { knowledge: 0, strategy: 10, risk: 10 }, answers: [] } });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.deepEqual(r.body.perf.judged, { total: 6, correct: 3 });
  assert.equal((await ask({})).status, 409);                                                       // the duel is over
  /* a duel never repeats a question of a small set while others are left; private bank questions are asked */
  const t2 = (await call('POST', '/v1/match/start', { auth: p })).body.ticket;
  const seen = [];
  for (let i = 0; i < 8; i++) { const x = await call('POST', '/v1/match/q', { auth: p, body: { ticket: t2, cat: 'etf', rank: 2, limit: 20 } }); seen.push(x.body.q); }
  assert.ok(seen.some(x => x.startsWith('測試用題目')), 'a private question was asked');
  assert.equal(new Set(seen.filter(x => x.startsWith('測試用題目'))).size, seen.filter(x => x.startsWith('測試用題目')).length);
  const h = await call('GET', '/v1/health'); assert.equal(h.body.rankedPool, 24);
});

test('題目品質: answer counts per built-in question, and the disputed / hardest / easiest lists', async () => {
  clock = Date.UTC(2027, 3, 1, 4);
  const [a, b, c] = BANK;
  const wrongOf = q => (q.answer + 1) % 4;
  const counts = (q, right, wrong) => { const v = [right + wrong, right, 0, 0, 0, 0, 0]; v[2 + q.answer] += right; v[2 + wrongOf(q)] += wrong; return v; };
  for (let i = 0; i < 3; i++) await call('POST', '/v1/ping', { body: { pid: (5000 + i).toString(16).padStart(32, '0'), days: { '2027-04-01': { open: 1 } },
    q: { [a.id]: counts(a, 3, 7), [b.id]: counts(b, 10, 0), [c.id]: counts(c, 1, 0), nope: [1, 1, 1, 0, 0, 0, 0] } } });
  const r = await call('GET', '/v1/stats?key=test-stats-key&format=json');
  /* only these three questions (other tests also answer ranked questions, which are counted too) */
  const ours = list => list.filter(x => [a.id, b.id, c.id].includes(x.qid));
  const Q = r.body.quality;
  assert.ok(Q.enough >= 2);
  assert.ok(![...Q.hardest, ...Q.easiest, ...Q.disputed].some(x => x.qid === c.id));   // c has only 3 answers
  assert.equal(ours(Q.disputed)[0].qid, a.id); assert.equal(ours(Q.disputed)[0].rate, 0.3); assert.equal(ours(Q.disputed)[0].topWrong.n, 21);
  assert.equal(ours(Q.hardest)[0].qid, a.id); assert.equal(ours(Q.easiest)[0].qid, b.id);
  const html = await (await fetch(`${BASE}/v1/stats?key=test-stats-key`, { headers: { 'X-Test-Now': String(clock) } })).text();
  assert.match(html, /題目品質/); assert.match(html, /可能有爭議/);
});
