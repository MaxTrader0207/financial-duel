// 金融決鬥線上排行榜 API (Cloudflare Workers + D1)
//
// Players join with a nickname only. The browser keeps an anonymous id and a secret token; the database keeps the
// token's SHA-256, never the token. Every ranked duel opens with a ticket (POST /v1/match/start) and closes once
// with its result (POST /v1/match/end). The server recomputes the points with the same rules as the game
// (src/js/rankrules.js) from its own stored points, so a browser cannot send "I have 9999 points".
//
// The duel itself still runs in the browser, so the server cannot see every answer. What it does check: the ticket
// belongs to the player and is used once; the duel lasted at least MIN_MATCH_MS; the performance parts are within
// their maximums; at most MAX_MATCHES_PER_HOUR duels; leaving a duel open (starting another) counts as a loss.
import { TIERS, tierOf, scoreMatch, seasonStart, checkPerf, seasonOf, prevSeason } from '../../src/js/rankrules.js';
import { cleanPing, ping, report, reportHTML } from './stats.js';
import { judge } from './judge.js';
import { cleanName } from './names.js';
export { cleanName };

const MAX_MATCHES_PER_HOUR = 30;
const REGISTER_PER_IP_PER_DAY = 5;
const MAX_MATCH_MS = 3 * 3600e3;        // an unfinished ticket older than this is a forfeited loss
const SEED_CAP = TIERS[2].at;           // points carried over from offline play when joining (up to 資深分析師)
const BOARD_SIZE = 100;

const CORS = {
  'Access-Control-Allow-Origin': '*',   // bearer tokens, no cookies: any page may call the API
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra } });
class ApiError extends Error { constructor(status, code, msg) { super(msg); this.status = status; this.code = code; } }
const fail = (status, code, msg) => { throw new ApiError(status, code, msg); };

/* ---------- helpers ---------- */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const randomHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));

async function body(req, max = 2048) {
  const text = await req.text();
  if (text.length > max) fail(413, 'too_large', '資料太大');
  if (!text) return {};
  try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : {}; } catch { fail(400, 'bad_json', '資料格式錯誤'); }
}

/* fixed-window rate limit; returns false when over the limit */
async function limit(env, key, max, windowMs, now) {
  const row = await env.DB.prepare('SELECT n, until FROM ratelimit WHERE k = ?').bind(key).first();
  if (!row || row.until <= now) { await env.DB.prepare('INSERT OR REPLACE INTO ratelimit (k, n, until) VALUES (?, 1, ?)').bind(key, now + windowMs).run(); return true; }
  if (row.n >= max) return false;
  await env.DB.prepare('UPDATE ratelimit SET n = n + 1 WHERE k = ?').bind(key).run();
  return true;
}

async function auth(req, env) {
  const m = /^Bearer ([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const p = await env.DB.prepare('SELECT id, name, token_hash FROM players WHERE id = ?').bind(m[1]).first();
  if (!p || p.token_hash !== await sha256(m[2])) return null;
  return p;
}
async function mustAuth(req, env) { const p = await auth(req, env); if (!p) fail(401, 'auth', '找不到這個排行榜身分，請重新加入'); return p; }

/* the player's row for a season; a first visit in a new season starts from last season's points, two tiers down */
async function standing(env, player, season, now) {
  const row = await env.DB.prepare('SELECT season, rp, peak, w, l, updated FROM standings WHERE season = ? AND player = ?').bind(season, player).first();
  if (row) return row;
  const last = await env.DB.prepare('SELECT rp FROM standings WHERE player = ? AND season < ? ORDER BY season DESC LIMIT 1').bind(player, season).first();
  const st = last ? seasonStart(last.rp) : { rp: 0, peak: 0 };
  const fresh = { season, rp: st.rp, peak: st.peak, w: 0, l: 0, updated: now };
  await env.DB.prepare('INSERT OR IGNORE INTO standings (season, player, rp, peak, w, l, updated) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(season, player, fresh.rp, fresh.peak, now).run();
  return fresh;
}
async function rankOf(env, season, s) {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM standings WHERE season = ? AND (rp > ? OR (rp = ? AND updated < ?))').bind(season, s.rp, s.rp, s.updated).first();
  return (r ? r.n : 0) + 1;
}
const view = (s, rank) => ({ season: s.season, rp: s.rp, tier: tierOf(s.rp), peak: s.peak, w: s.w, l: s.l, rank });

/* close a match: recompute points from the stored standing, update it, mark the ticket used */
async function settle(env, player, match, win, perfScore, now) {
  const s = await standing(env, player, match.season, now);
  const r = scoreMatch(s.rp, win, perfScore);
  const peak = Math.max(s.peak, r.tierAfter);
  const done = await env.DB.prepare('UPDATE matches SET ended = ?, win = ?, perf = ?, delta = ? WHERE ticket = ? AND ended IS NULL').bind(now, win ? 1 : 0, perfScore, r.delta, match.ticket).run();
  if (!done.meta || done.meta.changes !== 1) fail(409, 'used', '這場對戰已經結算過了');
  await env.DB.prepare(`UPDATE standings SET rp = ?, peak = ?, ${win ? 'w = w + 1' : 'l = l + 1'}, updated = ? WHERE season = ? AND player = ?`).bind(r.after, peak, now, match.season, player).run();
  return { ...r, standing: { ...s, rp: r.after, peak, w: s.w + (win ? 1 : 0), l: s.l + (win ? 0 : 1), updated: now } };
}
/* every open ticket of a player becomes a loss with no performance (same rule as the game) */
async function forfeitOpen(env, player, now) {
  const { results } = await env.DB.prepare('SELECT ticket, season FROM matches WHERE player = ? AND ended IS NULL').bind(player).all();
  let last = null;
  for (const m of results || []) last = await settle(env, player, m, false, 0, now).catch(e => { if (e.code === 'used') return null; throw e; });
  return last;
}

/* ---------- routes ---------- */
async function register(req, env, now) {
  const b = await body(req);
  const n = cleanName(b.name); if (n.error) fail(400, 'name', n.error);
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `reg:${ip}`, REGISTER_PER_IP_PER_DAY, 864e5, now)) fail(429, 'slow', '今天加入的次數太多了，請明天再試');
  const id = randomHex(16), token = randomHex(32);
  try {
    await env.DB.prepare('INSERT INTO players (id, token_hash, name, created) VALUES (?, ?, ?, ?)').bind(id, await sha256(token), n.name, now).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e && e.message))) fail(409, 'taken', '這個暱稱已經有人使用了');
    throw e;
  }
  const season = seasonOf(now), seed = Math.max(0, Math.min(SEED_CAP, Number.isInteger(b.rp) ? b.rp : 0));
  await env.DB.prepare('INSERT INTO standings (season, player, rp, peak, w, l, updated) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(season, id, seed, tierOf(seed), now).run();
  const s = await standing(env, id, season, now);
  return json({ id, token, name: n.name, me: view(s, await rankOf(env, season, s)) }, 201);
}

async function me(req, env, now) {
  const p = await mustAuth(req, env), season = seasonOf(now);
  const s = await standing(env, p.id, season, now);
  return json({ id: p.id, name: p.name, me: view(s, await rankOf(env, season, s)) });
}
async function rename(req, env, now) {
  const p = await mustAuth(req, env), b = await body(req);
  const n = cleanName(b.name); if (n.error) fail(400, 'name', n.error);
  if (!await limit(env, `name:${p.id}`, 3, 864e5, now)) fail(429, 'slow', '暱稱一天最多改 3 次');
  try { await env.DB.prepare('UPDATE players SET name = ? WHERE id = ?').bind(n.name, p.id).run(); }
  catch (e) { if (/UNIQUE/i.test(String(e && e.message))) fail(409, 'taken', '這個暱稱已經有人使用了'); throw e; }
  return json({ name: n.name });
}
async function leave(req, env) {
  const p = await mustAuth(req, env);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM matches WHERE player = ?').bind(p.id),
    env.DB.prepare('DELETE FROM standings WHERE player = ?').bind(p.id),
    env.DB.prepare('DELETE FROM ratelimit WHERE k = ?').bind(`match:${p.id}`),
    env.DB.prepare('DELETE FROM players WHERE id = ?').bind(p.id),
  ]);
  return json({ ok: true });
}

async function matchStart(req, env, now) {
  const p = await mustAuth(req, env);
  const forfeited = await forfeitOpen(env, p.id, now);
  if (!await limit(env, `match:${p.id}`, MAX_MATCHES_PER_HOUR, 3600e3, now)) fail(429, 'slow', `排位賽一小時最多 ${MAX_MATCHES_PER_HOUR} 場，休息一下再來`);
  const season = seasonOf(now), ticket = randomHex(16);
  await standing(env, p.id, season, now);
  await env.DB.prepare('INSERT INTO matches (ticket, player, season, started) VALUES (?, ?, ?, ?)').bind(ticket, p.id, season, now).run();
  return json({ ticket, season, forfeited: forfeited ? { delta: forfeited.delta } : null });
}

async function matchEnd(req, env, now) {
  const p = await mustAuth(req, env), b = await body(req, 32768);
  if (typeof b.ticket !== 'string' || !/^[0-9a-f]{32}$/.test(b.ticket)) fail(400, 'ticket', '缺少對戰憑證');
  const m = await env.DB.prepare('SELECT ticket, season, started, ended FROM matches WHERE ticket = ? AND player = ?').bind(b.ticket, p.id).first();
  if (!m) fail(404, 'ticket', '找不到這場對戰');
  if (m.ended) fail(409, 'used', '這場對戰已經結算過了');
  const surrender = b.surrender === true, win = !surrender && b.win === true;
  let perf = { score: 0 }, judged = null;
  if (!surrender) {
    perf = checkPerf(b.perf); if (!perf) fail(400, 'perf', '表現分資料不正確');
    const minMs = Number(env.MIN_MATCH_MS ?? 45000);
    if (now - m.started < minMs) fail(422, 'too_fast', '對戰時間太短，這場不列入排行榜');
    if (now - m.started > MAX_MATCH_MS) { const r = await settle(env, p.id, m, false, 0, now); return json(result(r, await rankOf(env, m.season, r.standing), true)); }
    /* the server judges the answers itself: its knowledge score replaces the browser's */
    judged = judge(b.answers, { elapsed: now - m.started, win });
    if (judged.error) fail(422, 'answers', judged.error);
    perf = { ...perf, knowledge: judged.knowledge, score: judged.knowledge + perf.strategy + perf.risk };
  }
  const r = await settle(env, p.id, m, win, perf.score, now);
  if (judged) await env.DB.prepare('UPDATE matches SET q_total = ?, q_correct = ? WHERE ticket = ?').bind(judged.total, judged.correct, m.ticket).run();
  return json(result(r, await rankOf(env, m.season, r.standing), false, judged ? { ...perf, judged: { total: judged.total, correct: judged.correct } } : null));
}
const result = (r, rank, expired, perf) => ({ perf: perf || null, delta: r.delta, before: r.before, after: r.after, tierBefore: r.tierBefore, tierAfter: r.tierAfter, shielded: r.shielded, promoted: r.promoted, demoted: r.demoted, expired, me: view(r.standing, rank) });

async function board(req, env, now, url) {
  const season = /^\d{4}-\d{2}$/.test(url.searchParams.get('season') || '') ? url.searchParams.get('season') : seasonOf(now);
  const { results } = await env.DB.prepare(`SELECT p.name, s.rp, s.peak, s.w, s.l, s.player FROM standings s JOIN players p ON p.id = s.player
    WHERE s.season = ? AND (s.w + s.l) > 0 ORDER BY s.rp DESC, s.updated ASC LIMIT ?`).bind(season, BOARD_SIZE).all();
  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM standings WHERE season = ? AND (w + l) > 0').bind(season).first();
  const p = await auth(req, env);
  let mine = null;
  if (p) {
    const s = await env.DB.prepare('SELECT season, rp, peak, w, l, updated FROM standings WHERE season = ? AND player = ?').bind(season, p.id).first();
    if (s && s.w + s.l > 0) {
      const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM standings WHERE season = ? AND (w + l) > 0 AND (rp > ? OR (rp = ? AND updated < ?))').bind(season, s.rp, s.rp, s.updated).first();
      mine = { ...view(s, r.n + 1), name: p.name };
    }
  }
  let rank = 0, prev = null;
  const rows = (results || []).map((x, i) => { if (x.rp !== prev) { rank = i + 1; prev = x.rp; } return { rank, name: x.name, rp: x.rp, tier: tierOf(x.rp), peak: x.peak, w: x.w, l: x.l, you: !!p && x.player === p.id }; });
  return json({ season, current: seasonOf(now), previous: prevSeason(seasonOf(now)), total: total ? total.n : 0, rows, me: mine },
    200, p ? { 'Cache-Control': 'no-store' } : { 'Cache-Control': 'public, max-age=15' });
}

/* ---------- anonymous daily statistics (stats.js) ---------- */
async function statsPing(req, env, now) {
  const c = cleanPing(await body(req), now); if (c.error) fail(400, 'ping', c.error);
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `ping:${ip}`, 120, 3600e3, now)) fail(429, 'slow', '太頻繁了，請稍後再試');
  return json({ ok: true, days: await ping(env, c) });
}
async function stats(req, env, now, url) {
  if (!env.STATS_KEY) fail(503, 'no_key', '尚未設定 STATS_KEY：請在 GitHub 的 Actions secrets 加入 STATS_KEY 後重新部署');
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  const given = url.searchParams.get('key') || '';
  if (await sha256(given) !== await sha256(env.STATS_KEY)) {
    if (!await limit(env, `statskey:${ip}`, 10, 3600e3, now)) fail(429, 'slow', '密碼錯誤次數太多，請一小時後再試');
    fail(403, 'key', '密碼不正確');
  }
  const r = await report(env, now);
  if (url.searchParams.get('format') === 'json') return json(r, 200, { 'Cache-Control': 'no-store' });
  return new Response(reportHTML(r), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

/* ---------- transfer codes: carry saved progress to another device ---------- */
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';           // no 0/O, 1/I/L
const TRANSFER_MS = 24 * 3600e3, TRANSFER_MAX = 600_000;
const newCode = () => { const b = crypto.getRandomValues(new Uint8Array(8)); const s = [...b].map(x => CODE_CHARS[x % CODE_CHARS.length]).join(''); return `${s.slice(0, 4)}-${s.slice(4)}`; };
export const normCode = c => { const s = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); return s.length === 8 && [...s].every(ch => CODE_CHARS.includes(ch)) ? `${s.slice(0, 4)}-${s.slice(4)}` : null; };
async function transferCreate(req, env, now) {
  const b = await body(req, TRANSFER_MAX);
  if (!b.data || typeof b.data !== 'object' || b.data.app !== 'financial-duel') fail(400, 'data', '進度資料不正確');
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `tcreate:${ip}`, 10, 864e5, now)) fail(429, 'slow', '今天產生的轉移碼太多了，請明天再試');
  await env.DB.prepare('DELETE FROM transfers WHERE expires < ?').bind(now).run();
  const code = newCode(), expires = now + TRANSFER_MS;
  await env.DB.prepare('INSERT INTO transfers (code, data, created, expires) VALUES (?, ?, ?, ?)').bind(code, JSON.stringify(b.data), now, expires).run();
  return json({ code, expires }, 201);
}
async function transferRedeem(req, env, now) {
  const b = await body(req);
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `tredeem:${ip}`, 20, 3600e3, now)) fail(429, 'slow', '嘗試次數太多，請一小時後再試');
  const code = normCode(b.code); if (!code) fail(400, 'code', '轉移碼格式不正確，應該是 8 個英數字');
  const row = await env.DB.prepare('SELECT data, expires FROM transfers WHERE code = ?').bind(code).first();
  if (!row || row.expires < now) fail(404, 'code', '找不到這組轉移碼，可能打錯或已經過期');
  const del = await env.DB.prepare('DELETE FROM transfers WHERE code = ?').bind(code).run();      // one use only
  if (!del.meta || del.meta.changes !== 1) fail(404, 'code', '這組轉移碼已經用過了');
  return json({ data: JSON.parse(row.data) }, 200, { 'Cache-Control': 'no-store' });
}

/* ---------- friend challenges ---------- */
const CH_DAYS = 30, CH_MAX_SCORE = 1500;
const newChallengeId = () => [...crypto.getRandomValues(new Uint8Array(6))].map(x => CODE_CHARS[x % CODE_CHARS.length]).join('');
function cleanResult(b) {
  const n = cleanName(b.name); if (n.error) fail(400, 'name', n.error);
  if (!Number.isInteger(b.score) || b.score < 0 || b.score > CH_MAX_SCORE) fail(400, 'score', '分數不正確');
  return { name: n.name, score: b.score, win: b.win === true ? 1 : 0 };
}
async function challengeView(env, id, now) {
  const c = await env.DB.prepare('SELECT id, seed, deck, by_name, created, expires FROM challenges WHERE id = ?').bind(id).first();
  if (!c || c.expires < now) fail(404, 'challenge', '找不到這個挑戰，可能已經過期');
  const { results } = await env.DB.prepare('SELECT name, score, win, at FROM challenge_results WHERE cid = ? ORDER BY score DESC, at ASC LIMIT 50').bind(id).all();
  return { id: c.id, seed: c.seed, deck: JSON.parse(c.deck), by: c.by_name, created: c.created, expires: c.expires, results: (results || []).map(r => ({ ...r, win: !!r.win })) };
}
async function challengeCreate(req, env, now) {
  const b = await body(req, 4096);
  if (!Number.isInteger(b.seed) || b.seed < 1 || b.seed > 2147483647) fail(400, 'seed', '挑戰資料不正確');
  if (!Array.isArray(b.deck) || b.deck.length !== 40 || !b.deck.every(x => typeof x === 'string' && /^[a-z0-9_]{1,40}$/.test(x))) fail(400, 'deck', '牌組資料不正確');
  const r = cleanResult(b);
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `chcreate:${ip}`, 20, 864e5, now)) fail(429, 'slow', '今天建立的挑戰太多了，請明天再試');
  const id = newChallengeId();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO challenges (id, seed, deck, by_name, created, expires) VALUES (?, ?, ?, ?, ?, ?)').bind(id, b.seed, JSON.stringify(b.deck), r.name, now, now + CH_DAYS * 864e5),
    env.DB.prepare('INSERT INTO challenge_results (cid, name, score, win, at) VALUES (?, ?, ?, ?, ?)').bind(id, r.name, r.score, r.win, now),
  ]);
  return json(await challengeView(env, id, now), 201);
}
async function challengeResult(req, env, now, id) {
  const r = cleanResult(await body(req));
  const ip = await sha256(`ip:${req.headers.get('CF-Connecting-IP') || 'local'}`);
  if (!await limit(env, `chresult:${ip}`, 60, 3600e3, now)) fail(429, 'slow', '太頻繁了，請稍後再試');
  await challengeView(env, id, now);                                   // exists and not expired
  await env.DB.prepare(`INSERT INTO challenge_results (cid, name, score, win, at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (cid, name) DO UPDATE SET score = excluded.score, win = excluded.win, at = excluded.at WHERE excluded.score > challenge_results.score`).bind(id, r.name, r.score, r.win, now).run();
  return json(await challengeView(env, id, now));
}

async function route(req, env, now) {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, ''), m = req.method;
  if (m === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (m === 'GET' && (path === '' || path === '/v1/health')) return json({ ok: true, season: seasonOf(now), service: '金融決鬥排行榜' });
  if (m === 'GET' && path === '/v1/board') return board(req, env, now, url);
  if (m === 'POST' && path === '/v1/register') return register(req, env, now);
  if (m === 'GET' && path === '/v1/me') return me(req, env, now);
  if (m === 'POST' && path === '/v1/me') return rename(req, env, now);
  if (m === 'DELETE' && path === '/v1/me') return leave(req, env);
  if (m === 'POST' && path === '/v1/match/start') return matchStart(req, env, now);
  if (m === 'POST' && path === '/v1/match/end') return matchEnd(req, env, now);
  if (m === 'POST' && path === '/v1/ping') return statsPing(req, env, now);
  if (m === 'POST' && path === '/v1/transfer') return transferCreate(req, env, now);
  if (m === 'POST' && path === '/v1/challenge') return challengeCreate(req, env, now);
  const ch = /^\/v1\/challenge\/([2-9A-HJKMNP-Z]{6})(\/result)?$/.exec(path);
  if (ch && m === 'GET' && !ch[2]) return json(await challengeView(env, ch[1], now), 200, { 'Cache-Control': 'no-store' });
  if (ch && m === 'POST' && ch[2]) return challengeResult(req, env, now, ch[1]);
  if (m === 'POST' && path === '/v1/transfer/redeem') return transferRedeem(req, env, now);
  if (m === 'GET' && path === '/v1/stats') return stats(req, env, now, url);
  fail(404, 'not_found', '找不到這個網址');
}

export default {
  async fetch(req, env) {
    /* tests may fix the clock; only when the TEST_CLOCK variable is set (never in production) */
    const now = env.TEST_CLOCK === '1' && req.headers.get('X-Test-Now') ? Number(req.headers.get('X-Test-Now')) : Date.now();
    try { return await route(req, env, now); }
    catch (e) {
      if (e instanceof ApiError) return json({ error: e.message, code: e.code }, e.status);
      console.error(e);
      return json({ error: '伺服器暫時出錯，請稍後再試', code: 'server' }, 500);
    }
  },
};
