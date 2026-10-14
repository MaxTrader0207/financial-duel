// online.js — the online leaderboard client (the server is worker/, a Cloudflare Worker with a D1 database).
// Joining is optional: until the player picks a nickname nothing is sent anywhere. After joining, every ranked duel
// opens a ticket with the server and closes it with the result; the server recomputes the points with the same rules
// (rankrules.js) and its answer becomes the player's points here too, so the game and the board never disagree.
// Network failures never block a duel: a result that could not be sent waits in an outbox and is sent later.
import { Store, isObj } from './core.js';
import * as Ranked from './ranked.js';

export const ONLINE_KEY = 'soba-ketto.online.v1', ONLINE_V = 1;
export const API_OVERRIDE_KEY = 'soba-ketto.api';                    // a different server (local development)
/* global __API__ */
const DEFAULT_API = typeof __API__ !== 'undefined' ? __API__ : 'https://financial-duel-api.maxwei6699.workers.dev';
export const SEED_CAP = Ranked.TIERS[2].at;
const TIMEOUT = 8000;

const fresh = () => ({ id: null, token: null, name: null, me: null, ticket: null, outbox: null });
let O = fresh();
export function load() { O = { ...fresh(), ...Store.load(ONLINE_KEY, { version: ONLINE_V, fallback: fresh, validate: isObj }) }; }
const save = () => Store.trySave(ONLINE_KEY, ONLINE_V, O);
export const state = () => O;
export const joined = () => !!(O.id && O.token);

export function apiBase() {
  try { const o = localStorage.getItem(API_OVERRIDE_KEY); if (o) return o.replace(/\/+$/, ''); } catch { /* storage blocked */ }
  return DEFAULT_API;
}

/* never throws: { ok, status, data } — status 0 means the server could not be reached */
export async function request(method, path, body) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT) : 0;
  try {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (joined()) headers.Authorization = `Bearer ${O.id}.${O.token}`;
    const res = await fetch(apiBase() + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined });
    const data = await res.json().catch(() => null);
    if (res.status === 401 && joined()) forget();                    // the server no longer knows this player
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally { clearTimeout(timer); }
}
export const errorText = r => (r.data && r.data.error) || (r.status === 0 ? '連不上排行榜伺服器，請確認網路後再試' : '排行榜暫時無法使用，請稍後再試');

function forget() { Object.assign(O, fresh()); save(); }
function adopt(me) { if (!me) return; O.me = me; save(); Ranked.syncOnline(me); }

/* ---------- joining ---------- */
export async function join(name) {
  const r = await request('POST', '/v1/register', { name, rp: Math.min(SEED_CAP, Ranked.state().rp) });
  if (!r.ok) return { ok: false, error: errorText(r) };
  Object.assign(O, { id: r.data.id, token: r.data.token, name: r.data.name, ticket: null, outbox: null });
  adopt(r.data.me);
  return { ok: true };
}
export async function rename(name) {
  const r = await request('POST', '/v1/me', { name });
  if (!r.ok) return { ok: false, error: errorText(r) };
  O.name = r.data.name; save();
  return { ok: true };
}
export async function leave() {
  const r = await request('DELETE', '/v1/me');
  if (!r.ok && r.status !== 401) return { ok: false, error: errorText(r) };
  forget();
  return { ok: true };
}

/* ---------- keeping in step ---------- */
/* send a waiting result, then read our standing; returns the standing or null */
let gen = 0;                                                          // bumped by every duel start/end: a slower read is stale
export async function sync() {
  if (!joined()) return null;
  await flush();
  if (!joined()) return null;
  const g = gen;
  const r = await request('GET', '/v1/me');
  if (!r.ok) return null;
  if (g !== gen) return O.me;                                         // a duel started or ended meanwhile: keep its newer result
  if (r.data.name) O.name = r.data.name;
  adopt(r.data.me);
  return O.me;
}
async function flush() {
  if (!O.outbox) return null;
  const r = await request('POST', '/v1/match/end', O.outbox);
  if (r.status === 0 || r.status >= 500) return null;               // try again later
  O.outbox = null; save();
  if (r.ok) adopt(r.data.me);
  return r;
}

/* ---------- a ranked duel ---------- */
let starting = null;                                                 // endMatch waits for a start still on its way
export function startMatch() {
  if (!joined()) return Promise.resolve(null);
  gen++;
  starting = openTicket().finally(() => { starting = null; });
  return starting;
}
async function openTicket() {
  await flush();
  const r = await request('POST', '/v1/match/start');
  if (!r.ok) { O.ticket = null; save(); return { ok: false, error: errorText(r) }; }
  O.ticket = r.data.ticket; save();
  return { ok: true, forfeited: r.data.forfeited };
}
/* result: { win, perf: {knowledge, strategy, risk} } or { surrender: true }.
   → { ok: true, …the server's result } | { ok: false, error, queued } */
export async function endMatch(result) {
  if (starting) await starting;
  if (!joined() || !O.ticket) return null;
  const payload = result.surrender ? { ticket: O.ticket, surrender: true }
    : { ticket: O.ticket, win: !!result.win, perf: { knowledge: result.perf.knowledge, strategy: result.perf.strategy, risk: result.perf.risk }, answers: (result.answers || []).slice(0, 150) };
  O.ticket = null; save(); gen++;
  const r = await request('POST', '/v1/match/end', payload);
  if (r.status === 0 || r.status >= 500) { O.outbox = payload; save(); return { ok: false, queued: true, error: '連不上排行榜伺服器，結果會在下次連線時送出' }; }
  if (!r.ok) return { ok: false, error: errorText(r) };
  adopt(r.data.me);
  return { ok: true, ...r.data };
}

/* ---------- ranked questions asked by the server ---------- */
/* is a ranked ticket open (or on its way)? */
export const matchOpen = () => joined() && (!!O.ticket || !!starting);
/* → { n, q, options, removed, category, difficulty, limit, calc } or null (no ticket, offline, refused) */
export async function askQuestion({ cat, rank, limit, remove = 0, retry = false }) {
  if (starting) await starting;
  if (!joined() || !O.ticket) return null;
  const r = await request('POST', '/v1/match/q', { ticket: O.ticket, cat, rank, limit, remove, retry });
  return r.ok && r.data && Array.isArray(r.data.options) ? r.data : null;
}
/* → { correct, answer, explain } | { retry: true } | null. A lost reply is asked again: the server answers a repeat the same way. */
export async function sendAnswer(n, pick) {
  const ticket = O.ticket;
  for (let i = 0; i < 3 && ticket; i++) {
    const r = await request('POST', '/v1/match/a', { ticket, n, pick });
    if (r.ok && r.data) return r.data;
    if (r.status && r.status < 500) return null;
    await new Promise(res => setTimeout(res, 400 * (i + 1)));
  }
  return null;
}

/* ---------- season history ---------- */
/* my past seasons from the server: [{ season, rp, peak, w, l, rank, total, ended }] or null */
export async function seasons() {
  if (!joined()) return null;
  const r = await request('GET', '/v1/me/seasons');
  return r.ok && r.data && Array.isArray(r.data.seasons) ? r.data.seasons : null;
}
/* the hall of fame: top 3 of each ended season, or null */
export async function hall() {
  const r = await request('GET', '/v1/hall');
  return r.ok && r.data && Array.isArray(r.data.seasons) ? r.data.seasons : null;
}

export async function board(season) {
  const r = await request('GET', `/v1/board${season ? `?season=${encodeURIComponent(season)}` : ''}`);
  return r.ok ? { ok: true, ...r.data } : { ok: false, error: errorText(r) };
}

export function init() { load(); }
