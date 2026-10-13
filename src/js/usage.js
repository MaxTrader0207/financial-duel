// usage.js — anonymous daily statistics for the developer: how many devices open the game each day and how many
// duels they play. A random id (no account, no IP, no personal data) and per-day counts are kept here and sent to
// the leaderboard server (worker/src/stats.js), which only adds them up. 設定 → 匿名統計 turns it off.
import { SET, Store, isObj, saveSet } from './core.js';
import { apiBase } from './online.js';

export const USAGE_KEY = 'soba-ketto.usage.v1', USAGE_V = 1;
const EVENTS = ['open', 'duels', 'wins', 'casual', 'ranked', 'tutorial', 'daily', 'challenge'];
const SEND_DELAY = 4000;

const pad = n => String(n).padStart(2, '0');
let clock = () => Date.now();
export const setClock = f => { clock = f || (() => Date.now()); };
export function dayKey(ms = clock()) { const d = new Date(ms + 8 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
const randomId = () => { const a = new Uint8Array(16); (globalThis.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };

const fresh = () => ({ pid: randomId(), pending: {}, q: {} });
let U = fresh(), timer = 0, sending = false;
export function load() { U = { ...fresh(), ...Store.load(USAGE_KEY, { version: USAGE_V, fallback: fresh, validate: isObj }) }; if (!/^[0-9a-f]{32}$/.test(U.pid)) U.pid = randomId(); save(); }
const save = () => Store.trySave(USAGE_KEY, USAGE_V, U);
export const state = () => U;
export const enabled = () => SET.stats !== false;
export function setEnabled(on) {
  SET.stats = !!on; saveSet();
  if (!on) { U.pending = {}; U.q = {}; save(); }                                // turning it off also drops what was not sent
}

/* count an event for today; sent a few seconds later, together with anything else that happened meanwhile */
export function mark(...events) {
  if (!enabled()) return;
  const d = U.pending[dayKey()] || (U.pending[dayKey()] = {});
  for (const e of events) if (EVENTS.includes(e)) d[e] = (d[e] || 0) + 1;
  save(); schedule();
}
function schedule(ms = SEND_DELAY) { clearTimeout(timer); timer = setTimeout(flush, ms); }

/* send everything not yet sent; what goes out is removed only when the server took it */
export async function flush({ keepalive = false } = {}) {
  clearTimeout(timer);
  if (!enabled() || sending || typeof fetch !== 'function') return false;
  if (!Object.keys(U.pending).length && !Object.keys(U.q || {}).length) return true;
  if (!Object.keys(U.pending).length) U.pending[dayKey()] = {};       // question counts ride on a ping for today
  const days = JSON.parse(JSON.stringify(U.pending));                 // a copy: counts may still be added while sending
  const qs = Object.fromEntries(Object.entries(U.q || {}).slice(0, QMAX).map(([k, v]) => [k, v.slice()]));
  sending = true;
  try {
    const res = await fetch(`${apiBase()}/v1/ping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: U.pid, days, q: qs }), keepalive });
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {     // taken (or refused for good): forget it
      for (const [day, c] of Object.entries(days)) {
        const now = U.pending[day]; if (!now) continue;
        for (const k of Object.keys(c)) { now[k] -= c[k]; if (now[k] <= 0) delete now[k]; }   // keep counts added while sending
        if (!Object.keys(now).length) delete U.pending[day];
      }
      for (const [k, v] of Object.entries(qs)) { const now = U.q[k]; if (!now) continue; v.forEach((n, i) => { now[i] -= n; }); if (now[0] <= 0) delete U.q[k]; }
      save();
      return res.ok;
    }
    return false;
  } catch { return false; } finally { sending = false; }
}

/* 題目品質: how a built-in question was answered — [answers, right, picks of option 0…3, time-outs].
   Only counts are kept and sent; which player answered is not. pick is the index in the bank's own option order. */
export const QMAX = 200;                                               // questions per ping
export function question(id, pick, answer) {
  if (!enabled() || typeof id !== 'string') return;
  U.q = U.q || {};
  const r = U.q[id] || (U.q[id] = [0, 0, 0, 0, 0, 0, 0]);
  r[0]++; if (pick === answer) r[1]++;
  if (pick === -1) r[6]++; else if (pick >= 0 && pick < 4) r[2 + pick]++;
  save(); schedule();
}

/* a finished duel: mode is 'casual' | 'ranked' | 'tutorial' */
export function duel(mode, win) { mark('duels', mode, ...(win ? ['wins'] : [])); }

export function init() {
  load();
  mark('open');
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush({ keepalive: true }); });
}
