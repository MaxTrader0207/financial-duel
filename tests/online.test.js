// 線上排行榜 client: shared point rules, joining, a ranked duel with a ticket, the outbox when offline, leaving.
// fetch is replaced by a tiny stand-in; the real server has its own tests in worker/test.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Online from '../src/js/online.js';
import * as Ranked from '../src/js/ranked.js';
import { scoreMatch, seasonStart, checkPerf, seasonOf, prevSeason } from '../src/js/rankrules.js';

describe('shared point rules (game and server)', () => {
  it('scores a match and protects the first three tiers', () => {
    expect(scoreMatch(500, true, 100).delta).toBe(22);
    expect(scoreMatch(500, false, 0).delta).toBe(-26);
    expect(scoreMatch(105, false, 0)).toMatchObject({ after: 100, shielded: true });
    expect(scoreMatch(460, false, 0)).toMatchObject({ after: 434, demoted: true });
  });
  it('starts a new season two tiers lower', () => {
    expect(seasonStart(520)).toEqual({ rp: 100, peak: 1 });
    expect(seasonStart(1500)).toEqual({ rp: 700, peak: 4 });
    expect(seasonStart(0)).toEqual({ rp: 0, peak: 0 });
  });
  it('accepts only performance parts within their maximums', () => {
    expect(checkPerf({ knowledge: 40, strategy: 35, risk: 25 }).score).toBe(100);
    expect(checkPerf({ knowledge: 41, strategy: 0, risk: 0 })).toBe(null);
    expect(checkPerf({ knowledge: 1.5, strategy: 0, risk: 0 })).toBe(null);
    expect(checkPerf(null)).toBe(null);
  });
  it('seasons follow Taiwan time', () => {
    expect(seasonOf(Date.UTC(2026, 9, 31, 16, 30))).toBe('2026-11');      // 11/1 00:30 in Taiwan
    expect(seasonOf(Date.UTC(2026, 9, 31, 15, 30))).toBe('2026-10');
    expect(prevSeason('2027-01')).toBe('2026-12');
  });
});

function server() {
  const s = { up: true, calls: [], rp: 0, w: 0, l: 0 };
  const me = () => ({ season: Ranked.state().season, rp: s.rp, tier: 0, peak: 0, w: s.w, l: s.l, rank: 4 });
  globalThis.fetch = vi.fn(async (url, opt = {}) => {
    if (!s.up) throw new TypeError('Failed to fetch');
    const path = new URL(url).pathname, body = opt.body ? JSON.parse(opt.body) : {};
    s.calls.push(`${opt.method} ${path}`);
    const ok = (data, status = 200) => ({ ok: status < 300, status, json: async () => data });
    if (path === '/v1/register') { s.rp = body.rp; return ok({ id: 'a'.repeat(32), token: 'b'.repeat(64), name: body.name, me: me() }, 201); }
    if (path === '/v1/me' && opt.method === 'GET') return ok({ name: '小明', me: me() });
    if (path === '/v1/me' && opt.method === 'DELETE') return ok({ ok: true });
    if (path === '/v1/match/start') return ok({ ticket: 'c'.repeat(32), forfeited: null });
    if (path === '/v1/match/end') { const r = scoreMatch(s.rp, !!body.win, body.surrender ? 0 : checkPerf(body.perf).score); s.rp = r.after; r.win ? s.w++ : s.l++; return ok({ ...r, me: me() }); }
    return ok({ error: '找不到' }, 404);
  });
  return s;
}

beforeEach(() => {
  for (const k of [Online.ONLINE_KEY, Ranked.RANK_KEY]) localStorage.removeItem(k);
  Ranked.load(); Online.load();
});

describe('online leaderboard client', () => {
  it('sends nothing until the player joins', async () => {
    const s = server();
    expect(Online.joined()).toBe(false);
    expect(await Online.startMatch()).toBe(null);
    expect(await Online.sync()).toBe(null);
    expect(s.calls).toEqual([]);
  });
  it('joining carries over at most 250 points', async () => {
    const s = server(); Ranked.state().rp = 900;
    expect(await Online.join('小明')).toEqual({ ok: true });
    expect(s.rp).toBe(250);
    expect(Ranked.state().rp).toBe(250);                 // the server's standing replaces the local one
    expect(localStorage.getItem(Online.ONLINE_KEY)).toContain('小明');
  });
  it('a ranked duel: ticket at the start, the server result becomes our points', async () => {
    const s = server(); await Online.join('小明');
    expect((await Online.startMatch()).ok).toBe(true);
    const r = await Online.endMatch({ win: true, perf: { knowledge: 40, strategy: 35, risk: 25, score: 100 } });
    expect(r).toMatchObject({ ok: true, delta: 28 });
    expect(Ranked.state()).toMatchObject({ rp: 28, w: 1 });
    expect(s.calls).toEqual(['POST /v1/register', 'POST /v1/match/start', 'POST /v1/match/end']);
    expect(await Online.endMatch({ win: true, perf: { knowledge: 0, strategy: 0, risk: 0 } })).toBe(null);   // the ticket is gone
  });
  it('a result that cannot be sent waits and goes out at the next sync', async () => {
    const s = server(); await Online.join('小明'); await Online.startMatch();
    s.up = false;
    const r = await Online.endMatch({ win: true, perf: { knowledge: 20, strategy: 20, risk: 10 } });
    expect(r).toMatchObject({ ok: false, queued: true });
    expect(Online.state().outbox).toBeTruthy();
    s.up = true;
    await Online.sync();
    expect(Online.state().outbox).toBe(null);
    expect(s.w).toBe(1);
  });
  it('the request never throws, and a forgotten player is signed out', async () => {
    server(); await Online.join('小明');
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: '找不到這個排行榜身分' }) }));
    const r = await Online.request('GET', '/v1/me');
    expect(r.status).toBe(401);
    expect(Online.joined()).toBe(false);
  });
  it('leaving forgets the identity', async () => {
    const s = server(); await Online.join('小明');
    expect(await Online.leave()).toEqual({ ok: true });
    expect(Online.joined()).toBe(false);
    expect(s.calls).toContain('DELETE /v1/me');
  });
});

describe('online leaderboard client: ordering', () => {
  it('a slow standing read never overwrites the result of a duel that ended meanwhile', async () => {
    const s = server(); await Online.join('小明');
    const fast = globalThis.fetch;
    let release;
    globalThis.fetch = vi.fn(async (url, opt = {}) => {
      if (new URL(url).pathname === '/v1/me' && opt.method === 'GET') { const stale = { ok: true, status: 200, json: async () => ({ name: '小明', me: { season: Ranked.state().season, rp: 0, tier: 0, peak: 0, w: 0, l: 0, rank: 9 } }) }; await new Promise(r => { release = r; }); return stale; }
      return fast(url, opt);
    });
    const reading = Online.sync();
    await Online.startMatch();
    await Online.endMatch({ win: true, perf: { knowledge: 40, strategy: 35, risk: 25 } });
    release(); await reading;
    expect(Online.state().me.w).toBe(1);
    expect(Ranked.state().rp).toBe(28);
    expect(s.w).toBe(1);
  });
});
