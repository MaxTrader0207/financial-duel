// core.js — shared basics: DOM helpers, the versioned Store for localStorage, settings, difficulty levels, sleep / animation timing.
import { attackMult } from './market.js';
import { G } from './game.js';

let $, esc, RM, META_KEY, ID_RENAMES, renameId, Store, isObj, SET_KEY, SET_V, SET, AD, sleep, shuffle, LP_MAX, HAND_SIZE, DIFFS, DIFF_KEY, foeAtkOf, diffKey, KEYS;

function saveSet() { Store.trySave(SET_KEY, SET_V, SET); }
function setDiffKey(v) { diffKey = v; }

export function init() {
'use strict';
$ = s => document.querySelector(s);
esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------- versioned storage (this browser only) ----------
   Data keeps its plain shape under its key; the schema version of every key lives in META_KEY.
   On load, data older than the current version runs through the migration chain; data that cannot
   be read or migrated is copied to "<key>.backup" before the default is used, so nothing is silently lost. */
META_KEY = 'soba-ketto.meta';
/* old card id → new card id; add entries here whenever a card is renamed so saves, decks and collections follow */
ID_RENAMES = {};
renameId = id => ID_RENAMES[id] || id;
Store = (() => {
  let meta = (() => { try { const o = JSON.parse(localStorage.getItem(META_KEY)); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } })();
  const issues = [];
  const writeMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} };
  function backup(key, raw, why) {
    try { localStorage.setItem(key + '.backup', raw); } catch (e) {}
    issues.push({ key, why });
  }
  /* spec: { version, fallback: () => value, migrate: { [fromVersion]: data => newerData }, validate: data => bool, raw: true for plain strings } */
  function load(key, spec) {
    let raw = null; try { raw = localStorage.getItem(key); } catch (e) { return spec.fallback(); }
    if (raw == null) return spec.fallback();
    let data; try { data = spec.raw ? raw : JSON.parse(raw); } catch (e) { backup(key, raw, '無法解析'); return spec.fallback(); }
    let v = Number(meta[key] ?? 0);
    if (v > spec.version) { backup(key, raw, '來自較新的版本'); return spec.fallback(); }
    const from = v;
    try { while (v < spec.version) { const f = spec.migrate && spec.migrate[v]; if (f) data = f(data); v++; } }
    catch (e) { backup(key, raw, '轉換失敗'); return spec.fallback(); }
    if (spec.validate && !spec.validate(data)) { backup(key, raw, '格式不符'); return spec.fallback(); }
    if (from !== v) { meta[key] = v; writeMeta(); if (!spec.raw) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} } }
    return data;
  }
  function save(key, version, data) {
    localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    if (meta[key] !== version) { meta[key] = version; writeMeta(); }
    return true;
  }
  const trySave = (key, version, data) => { try { return save(key, version, data); } catch (e) { return false; } };
  return { load, save, trySave, issues, get meta() { return meta; } };
})();
isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
/* settings: fast mode + volume */
SET_KEY = 'soba-ketto.settings.v1';
SET_V = 1;
SET = { fast: false, music: 100, sfx: 100, ...Store.load(SET_KEY, { version: SET_V, fallback: () => ({}), validate: isObj }) };
AD = ms => SET.fast ? Math.round(ms * 0.4) : ms;
   // animation duration under fast mode
/* test build only: browser tests can set localStorage 'soba-ketto.e2e.fast' so every wait is at most 15 ms */
const E2E_FAST = import.meta.env.MODE === 'test' && (() => { try { return localStorage.getItem('soba-ketto.e2e.fast') === '1'; } catch (e) { return false; } })();
sleep = ms => new Promise(r => setTimeout(r, E2E_FAST ? Math.min(ms, 15) : RM ? Math.min(ms, 120) : AD(ms)));
shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
LP_MAX = 10000;
HAND_SIZE = 5;
DIFFS = {
  easy:   { name: '簡易', time: 30, fast: 12, foeMult: 1.0 },
  normal: { name: '適中', time: 20, fast: 9,  foeMult: 1.15 },
  hard:   { name: '困難', time: 10, fast: 6,  foeMult: 1.3 },
};
DIFF_KEY = 'soba-ketto.difficulty';
/* opponent's effective attack: card ATK scaled by difficulty, then debuffs such as 追繳 */
foeAtkOf = card => Math.max(0, Math.round(card.atk * (G.diff.foeMult || 1) * attackMult(card.cat)) + G.mods.foeAtk);   // market event ×1.2 / ×0.8
diffKey = (() => { try { const v = localStorage.getItem(DIFF_KEY); return DIFFS[v] ? v : 'normal'; } catch (e) { return 'normal'; } })();
KEYS = ['甲','乙','丙','丁','戊','己'];
}

export { $, AD, DIFFS, DIFF_KEY, HAND_SIZE, ID_RENAMES, KEYS, LP_MAX, META_KEY, RM, SET, SET_KEY, SET_V, Store, setDiffKey, diffKey, esc, foeAtkOf, isObj, renameId, saveSet, shuffle, sleep };
