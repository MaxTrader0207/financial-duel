// knowledge.js — 金融知識卡: a collectible encyclopedia of finance concepts (rules only; the screen is knowledgeui.js).
// 100 cards in 4 kinds (25 each) — 股票卡, 防禦卡, 事件卡, 陷阱卡 — from public/data/knowledge.json. Each card has 3 levels;
// a level unlocks the next section of its explanation (是什麼 → 實際例子 → 常見誤區). Getting cards: 4 starters,
// finishing a daily challenge unlocks its linked card, the first duel win of each day draws one, or spend shards. Levelling up costs shards and a right answer
// to that card's check question, so collecting a card fully means having learned it.
import { Store, isObj } from './core.js';
import { DATA } from './data.js';
import * as Daily from './daily.js';
import { levels, KINDS } from './kbonus.js';

export const KNOW_KEY = 'soba-ketto.knowledge.v1', KNOW_V = 1;
export const MAX_LV = 3;
export const UNLOCK_COST = 20;               // shards to unlock a card directly
export const UPGRADE_COST = [15, 30];        // shards for Lv1 → 2 and Lv2 → 3 (charged only when the check is passed)
export const DUEL_WIN_SHARDS = 4;            // a duel win also feeds the shard pool

let K = { cards: {}, starter: false, dropDay: null };
export function load() {
  K = { cards: {}, starter: false, ...Store.load(KNOW_KEY, { version: KNOW_V, fallback: () => ({}), validate: isObj }) };
  if (!K.starter) { (DATA.knowledge.starter || []).forEach(id => byId(id) && (K.cards[id] = { lv: 1, src: 'starter', seen: false })); K.starter = true; save(); }
}
const save = () => Store.trySave(KNOW_KEY, KNOW_V, K);

export const all = () => DATA.knowledge.cards || [];
export const byId = id => all().find(c => c.id === id) || null;
export const TYPES = () => DATA.knowledge.types || {};
export const lv = id => (K.cards[id] ? K.cards[id].lv : 0);
export const isNew = id => !!(K.cards[id] && K.cards[id].seen === false);
export function markSeen(id) { if (K.cards[id] && K.cards[id].seen === false) { K.cards[id].seen = true; save(); } }
/* the daily scenarios that unlock a card, for the "how to get it" hint */
export const dailyFor = id => (DATA.daily || []).filter(s => s.card === id);

export function stats() {
  const byType = {};
  for (const t of Object.keys(TYPES())) byType[t] = { owned: 0, total: 0, mastered: 0 };
  let owned = 0, mastered = 0, fresh = 0;
  for (const c of all()) {
    const b = byType[c.type] || (byType[c.type] = { owned: 0, total: 0, mastered: 0 }); b.total++;
    const l = lv(c.id); if (l) { owned++; b.owned++; } if (l >= MAX_LV) { mastered++; b.mastered++; } if (isNew(c.id)) fresh++;
  }
  return { owned, mastered, total: all().length, fresh, byType };
}

/* returns the ids of titles this change unlocked */
function unlock(id, src) {
  if (!byId(id) || K.cards[id]) return null;
  K.cards[id] = { lv: 1, src, seen: false }; save();
  return Daily.checkTitles(stats());
}
/* finishing a daily challenge unlocks its card; returns { card, titles } when it was new */
export function onDailyFinished(scenario) {
  if (!scenario || !scenario.card || K.cards[scenario.card]) return null;
  const titles = unlock(scenario.card, 'daily');
  return titles ? { card: byId(scenario.card), titles } : null;
}
export function buy(id) {
  if (!byId(id) || K.cards[id]) return null;
  if (!Daily.spendShards(UNLOCK_COST)) return null;
  return { titles: unlock(id, 'shards') };
}
/* the check question for the next level, or null at max level / locked */
export function checkFor(id) { const l = lv(id), c = byId(id); return c && l >= 1 && l < MAX_LV ? c.quiz[l - 1] : null; }
export const upgradeCost = id => { const l = lv(id); return l >= 1 && l < MAX_LV ? UPGRADE_COST[l - 1] : null; };
/* answer the check question with option `pick`; shards are spent only when it is right */
export function upgrade(id, pick) {
  const q = checkFor(id); if (!q) return null;
  const cost = upgradeCost(id);
  if (Daily.profile().shards < cost) return { ok: false, reason: 'shards' };
  if (pick !== q.answer) return { ok: false, reason: 'wrong', answer: q.answer };
  Daily.spendShards(cost);
  K.cards[id].lv++; save();
  return { ok: true, lv: K.cards[id].lv, titles: Daily.checkTitles(stats()) };
}
/* a duel win: shards, and the first win of the day also unlocks one uncollected card — from the kind the player has
   the fewest of, so the four kinds fill up together. Returns { shards, card, titles } */
export function onDuelWin(rnd = Math.random) {
  Daily.addShards(DUEL_WIN_SHARDS);
  const out = { shards: DUEL_WIN_SHARDS, card: null, titles: [] };
  const today = Daily.dayKey();
  if (K.dropDay === today) return out;
  const locked = all().filter(c => !K.cards[c.id]); if (!locked.length) return out;
  const s = stats().byType;
  const ratio = t => (s[t] ? s[t].owned / s[t].total : 1);
  const kind = [...new Set(locked.map(c => c.type))].sort((a, b) => ratio(a) - ratio(b))[0];
  const pool = locked.filter(c => c.type === kind), c = pool[Math.floor(rnd() * pool.length)];
  K.dropDay = today;
  out.titles = unlock(c.id, 'duel') || []; out.card = c;
  return out;
}

/* 知識加成: card levels summed per kind, and the bonus levels they give (kbonus.js) */
export function points() {
  const pts = Object.fromEntries(Object.keys(KINDS).map(k => [k, 0]));
  for (const c of all()) if (c.type in pts) pts[c.type] += lv(c.id);
  return pts;
}
export const bonusLevels = () => levels(points());

export function init() { load(); }
