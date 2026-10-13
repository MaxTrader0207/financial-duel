// challenge.js — 好友挑戰 (rules and network; the screen is challengeui.js).
// A challenge is a seed and a 40-card deck. The seed fixes everything decided before the first move — both decks'
// order, the opponent's deck and profile, and the order of market events — so every player who opens the link
// starts from the same position. The questions and the opponent's in-duel choices stay random, like any duel.
// No knowledge bonus and no personal weak-attribute boost: the challenge is the same for everyone.
// Score: win 500 + performance × 5 (≤ 500) + money left (≤ 500), at most 1500.
import { Store, isObj, LP_MAX } from './core.js';
import { apiBase } from './online.js';
import { EVENTS } from './market.js';

export const CH_KEY = 'soba-ketto.challenge.v1', CH_V = 1;
export const PUBLIC_URL = 'https://maxtrader0207.github.io/financial-duel/';
export const MARKET_PLAN = 30;

/* a small seeded PRNG (mulberry32) */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* run fn with Math.random replaced by the seeded generator (setup code is synchronous, so nothing else interleaves) */
export function withSeed(seed, fn) {
  const real = Math.random, r = rng(seed);
  Math.random = r;
  try { return fn(r); } finally { Math.random = real; }
}
export const newSeed = () => 1 + Math.floor(Math.random() * 2147483646);
/* market events in order, never the same twice in a row */
export function marketPlan(r, n = MARKET_PLAN) {
  const out = [];
  for (let i = 0; i < n; i++) { const pool = EVENTS.filter(e => e.id !== out[i - 1]); out.push(pool[Math.floor(r() * pool.length)].id); }
  return out;
}
export function score({ win, perf, lpLeft }) {
  const lp = Math.max(0, Math.min(LP_MAX, lpLeft | 0));
  return (win ? 500 : 0) + Math.max(0, Math.min(100, perf | 0)) * 5 + Math.round(lp / LP_MAX * 500);
}

/* ---------- saved: my nickname for challenges, and challenges I made or played ---------- */
const fresh = () => ({ name: '', list: [] });
let C = fresh();
export function load() { C = { ...fresh(), ...Store.load(CH_KEY, { version: CH_V, fallback: fresh, validate: isObj }) }; }
const save = () => Store.trySave(CH_KEY, CH_V, C);
export const state = () => C;
export function setName(n) { C.name = n; save(); }
export function remember(ch, role, myScore) {
  const old = C.list.find(x => x.id === ch.id);
  const row = { id: ch.id, by: ch.by, role: old ? old.role : role, best: Math.max(myScore || 0, old ? old.best : 0), at: Date.now() };
  C.list = [row, ...C.list.filter(x => x.id !== ch.id)].slice(0, 20); save();
}

/* ---------- links ---------- */
export function linkFor(id) {
  const here = typeof location !== 'undefined' && /^https?:$/.test(location.protocol) && !/claude|localhost|127\.0\.0\.1/.test(location.hostname) ? location.origin + location.pathname : PUBLIC_URL;
  return `${here}?c=${id}`;
}
/* ?c=XXXXXX in the address → the id (and the address is cleaned so a reload does not reopen it) */
export function takeLinkId() {
  if (typeof location === 'undefined') return null;
  const m = /[?&]c=([2-9A-HJKMNP-Za-hjkmnp-z]{6})\b/.exec(location.search);
  if (!m) return null;
  try { history.replaceState(null, '', location.pathname + location.hash); } catch { /* file:// */ }
  return m[1].toUpperCase();
}

/* ---------- network: never throws ---------- */
async function call(method, path, body) {
  try {
    const res = await fetch(apiBase() + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => null);
    return res.ok ? { ok: true, ...data } : { ok: false, error: (data && data.error) || '挑戰伺服器暫時無法使用，請稍後再試' };
  } catch { return { ok: false, error: '連不上挑戰伺服器，請確認網路後再試' }; }
}
export const fetchChallenge = id => call('GET', `/v1/challenge/${encodeURIComponent(id)}`);
export const create = ({ seed, deck, name, score: s, win }) => call('POST', '/v1/challenge', { seed, deck, name, score: s, win });
export const submit = (id, { name, score: s, win }) => call('POST', `/v1/challenge/${encodeURIComponent(id)}/result`, { name, score: s, win });

export function init() { load(); }
