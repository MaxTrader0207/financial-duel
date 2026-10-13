// usage.js — anonymous daily statistics for the developer: how many devices open the game each day and how many
// duels they play. A random id (no account, no IP, no personal data) and per-day counts are kept here and sent to
// the leaderboard server (worker/src/stats.js), which only adds them up. 設定 → 匿名統計 turns it off.
import { SET, Store, isObj, saveSet } from './core.js';
import { apiBase } from './online.js';

export const USAGE_KEY = 'soba-ketto.usage.v1', USAGE_V = 1;
const EVENTS = ['open', 'duels', 'wins', 'casual', 'ranked', 'tutorial', 'daily'];
const SEND_DELAY = 4000;

const pad = n => String(n).padStart(2, '0');
let clock = () => Date.now();
export const setClock = f => { clock = f || (() => Date.now()); };
export function dayKey(ms = clock()) { const d = new Date(ms + 8 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
const randomId = () => { const a = new Uint8Array(16); (globalThis.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; }); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };

const fresh = () => ({ pid: randomId(), pending: {} });
let U = fresh(), timer = 0, sending = false;
export function load() { U = { ...fresh(), ...Store.load(USAGE_KEY, { version: USAGE_V, fallback: fresh, validate: isObj }) }; if (!/^[0-9a-f]{32}$/.test(U.pid)) U.pid = randomId(); save(); }
const save = () => Store.trySave(USAGE_KEY, USAGE_V, U);
export const state = () => U;
export const enabled = () => SET.stats !== false;
export function setEnabled(on) {
  SET.stats = !!on; saveSet();
  if (!on) { U.pending = {}; save(); }                                // turning it off also drops what was not sent
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
  if (!Object.keys(U.pending).length) return true;
  const days = JSON.parse(JSON.stringify(U.pending));                 // a copy: counts may still be added while sending
  sending = true;
  try {
    const res = await fetch(`${apiBase()}/v1/ping`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: U.pid, days }), keepalive });
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {     // taken (or refused for good): forget it
      for (const [day, c] of Object.entries(days)) {
        const now = U.pending[day]; if (!now) continue;
        for (const k of Object.keys(c)) { now[k] -= c[k]; if (now[k] <= 0) delete now[k]; }   // keep counts added while sending
        if (!Object.keys(now).length) delete U.pending[day];
      }
      save();
      return res.ok;
    }
    return false;
  } catch { return false; } finally { sending = false; }
}

/* a finished duel: mode is 'casual' | 'ranked' | 'tutorial' */
export function duel(mode, win) { mark('duels', mode, ...(win ? ['wins'] : [])); }

export function init() {
  load();
  mark('open');
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush({ keepalive: true }); });
}
