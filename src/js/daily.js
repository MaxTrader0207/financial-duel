// daily.js — 每日 3 分鐘金融挑戰: the rules, no screen code (that is dailyui.js).
// One life-finance scenario per calendar day (3 short questions, public/data/daily.json), the same for every player
// on the same date. Every answer earns experience and card shards — a wrong one less, but never nothing — and
// finishing the day adds a bonus. Consecutive days build a streak that unlocks titles; shards buy a reward pick.
import { Store, isObj } from './core.js';
import { DATA } from './data.js';

export const DAILY_KEY = 'soba-ketto.daily.v1', DAILY_V = 1;
export const PROFILE_KEY = 'soba-ketto.profile.v1', PROFILE_V = 1;
export const REWARD = {
  right: { xp: 30, shards: 3 },
  wrong: { xp: 10, shards: 1 },           // a wrong answer still earns something — and shows the right idea
  finish: { xp: 20, shards: 2 },          // finishing today's 3 questions
  perfect: { xp: 10, shards: 1 },         // all 3 right
};
export const EXCHANGE_COST = 60;          // shards for one reward pick (3 uncollected cards, keep 1)
export const KEEP_DAYS = 60;              // how many days of answers are kept

/* titles stay unlocked once earned; streak titles use the best streak ever reached */
export const TITLES = [
  { id: 'first', name: '理財新手', desc: '完成第一次每日挑戰', test: s => s.total >= 1 },
  { id: 's3', name: '三日不輟', desc: '連續 3 天完成每日挑戰', test: s => s.best >= 3 },
  { id: 's7', name: '一週理財家', desc: '連續 7 天完成每日挑戰', test: s => s.best >= 7 },
  { id: 'p5', name: '觀念清晰', desc: '累計 5 天三題全對', test: s => s.perfect >= 5 },
  { id: 's14', name: '雙週修行者', desc: '連續 14 天完成每日挑戰', test: s => s.best >= 14 },
  { id: 't30', name: '生活理財家', desc: '累計完成 30 天', test: s => s.total >= 30 },
  { id: 's30', name: '月度金融通', desc: '連續 30 天完成每日挑戰', test: s => s.best >= 30 },
  { id: 's100', name: '百日理財達人', desc: '連續 100 天完成每日挑戰', test: s => s.best >= 100 },
  /* knowledge-card titles: k = knowledge.js stats, passed in by checkTitles() (absent when a daily challenge finishes) */
  { id: 'k_stock', name: '選股入門', desc: '收集全部 8 張股票卡', test: (s, k) => !!k && k.byType.stock.owned >= k.byType.stock.total },
  { id: 'k_defense', name: '穩健守護者', desc: '收集全部 8 張防禦卡', test: (s, k) => !!k && k.byType.defense.owned >= k.byType.defense.total },
  { id: 'k_event', name: '景氣觀察家', desc: '收集全部 8 張事件卡', test: (s, k) => !!k && k.byType.event.owned >= k.byType.event.total },
  { id: 'k_trap', name: '識破陷阱', desc: '收集全部 8 張陷阱卡', test: (s, k) => !!k && k.byType.trap.owned >= k.byType.trap.total },
  { id: 'k_master', name: '金融百科', desc: '全部知識卡升到 Lv3（精通）', test: (s, k) => !!k && k.total > 0 && k.mastered >= k.total },
];

/* ---------- dates: the player's local calendar day ---------- */
let clock = () => new Date();
export const setClock = f => { clock = f || (() => new Date()); };          // tests and the e2e hooks
const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = clock()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const keyOf = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
export const addDays = (key, n) => keyOf(dayNum(key) + n);

/* the scenario of a day: a fixed shuffle of the list, walked one per day, so neighbouring days differ in theme */
function order(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = 20261013;
  for (let i = n - 1; i > 0; i--) { s = (s * 1103515245 + 12345) % 2147483648; const j = s % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
export function scenarioFor(key) {
  const list = DATA.daily || []; if (!list.length) return null;
  const o = order(list.length);
  return list[o[((dayNum(key) % list.length) + list.length) % list.length]];
}

/* ---------- saved state ---------- */
const fresh = () => ({ days: {}, streak: 0, best: 0, last: null, total: 0, perfect: 0 });
let D = fresh(), P = { xp: 0, shards: 0, titles: [], title: null };
export function load() {
  D = { ...fresh(), ...Store.load(DAILY_KEY, { version: DAILY_V, fallback: fresh, validate: isObj }) };
  P = { xp: 0, shards: 0, titles: [], title: null, ...Store.load(PROFILE_KEY, { version: PROFILE_V, fallback: () => ({}), validate: isObj }) };
}
function save() {
  const keys = Object.keys(D.days).sort(); while (keys.length > KEEP_DAYS) delete D.days[keys.shift()];
  Store.trySave(DAILY_KEY, DAILY_V, D); Store.trySave(PROFILE_KEY, PROFILE_V, P);
}
export const state = () => D;
export const profile = () => P;

/* ---------- levels: Lv n → n+1 needs 100 × n experience ---------- */
export function level(xp = P.xp) {
  let lv = 1, base = 0;
  while (xp >= base + 100 * lv) { base += 100 * lv; lv++; }
  return { lv, into: xp - base, need: 100 * lv };
}

/* the streak shown today: it is still alive if the last finished day is today or yesterday */
export function streakNow(key = dayKey()) {
  return D.last === key || D.last === addDays(key, -1) ? D.streak : 0;
}

/* today's challenge and how far the player got */
export function today(key = dayKey()) {
  const scenario = scenarioFor(key);
  const day = D.days[key] && scenario && D.days[key].id === scenario.id ? D.days[key] : null;
  return { key, scenario, day, done: !!(day && day.done), next: day ? day.answers.length : 0 };
}

/* answer question i of today's scenario with option `pick` (index in the scenario's options) */
export function answer(i, pick, key = dayKey()) {
  const { scenario, day: existing } = today(key);
  if (!scenario) throw new Error('沒有每日挑戰資料');
  const day = existing || (D.days[key] = { id: scenario.id, answers: [], done: false, xp: 0, shards: 0 });
  if (day.done || i !== day.answers.length || !scenario.questions[i]) return null;       // already answered / out of order
  const ok = pick === scenario.questions[i].answer;
  const r = ok ? REWARD.right : REWARD.wrong;
  day.answers.push({ pick, ok }); day.xp += r.xp; day.shards += r.shards;
  const before = level().lv;
  P.xp += r.xp; P.shards += r.shards;
  const out = { ok, reward: { ...r }, finished: null };
  if (day.answers.length === scenario.questions.length) out.finished = finish(key, day, before);
  else if (level().lv > before) out.levelUp = level().lv;
  save();
  return out;
}
function finish(key, day, lvBefore) {
  day.done = true;
  const perfect = day.answers.every(a => a.ok);
  const bonus = { xp: REWARD.finish.xp + (perfect ? REWARD.perfect.xp : 0), shards: REWARD.finish.shards + (perfect ? REWARD.perfect.shards : 0) };
  day.xp += bonus.xp; day.shards += bonus.shards; P.xp += bonus.xp; P.shards += bonus.shards;
  D.streak = D.last === addDays(key, -1) ? D.streak + 1 : D.last === key ? D.streak : 1;
  D.best = Math.max(D.best, D.streak); D.last = key; D.total++; if (perfect) D.perfect++;
  const newTitles = TITLES.filter(t => !P.titles.includes(t.id) && t.test(D)).map(t => t.id);
  P.titles.push(...newTitles);
  if (!P.title && newTitles.length) P.title = newTitles[newTitles.length - 1];
  const lv = level().lv;
  return { perfect, bonus, streak: D.streak, newTitles, levelUp: lv > lvBefore ? lv : null, total: { xp: day.xp, shards: day.shards } };
}

/* other systems (knowledge cards, duel wins) share the same shards and titles */
export function addShards(n) { P.shards += n; save(); }
export function checkTitles(k) {
  const ids = TITLES.filter(t => !P.titles.includes(t.id) && t.test(D, k)).map(t => t.id);
  if (ids.length) { P.titles.push(...ids); if (!P.title) P.title = ids[ids.length - 1]; save(); }
  return ids;
}
export function setTitle(id) { if (id === null || P.titles.includes(id)) { P.title = id; save(); return true; } return false; }
export const titleName = id => (TITLES.find(t => t.id === id) || {}).name || '';

/* spend shards on one reward pick; the caller creates the pick */
export function spendShards(cost = EXCHANGE_COST) { if (P.shards < cost) return false; P.shards -= cost; save(); return true; }

/* the last n days, oldest first, for the streak strip */
export function recent(n = 7, key = dayKey()) {
  return Array.from({ length: n }, (_, i) => { const k = addDays(key, i - n + 1); const d = D.days[k]; return { key: k, done: !!(d && d.done), perfect: !!(d && d.done && d.answers.every(a => a.ok)) }; });
}

export function init() { load(); }
