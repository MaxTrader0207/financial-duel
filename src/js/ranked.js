// ranked.js — 排位賽 and monthly seasons (rules only; the screen is rankedui.js).
// Ranked duels are against the AI, whose strength follows your tier. Points (RP) come from the result AND from how
// you played: knowledge (accuracy), strategy (attacking with attributes the opponent or the market event is weak to,
// blocking with type advantage) and risk management (money left, no huge single hits). A good loss costs little.
// Fairness: a ranked deck has a point cap (N 1 · R 2 · SR 3 · UR 5), so collecting rare cards cannot buy a win.
// Each calendar month is a season: its peak tier earns a season title and card backs; the next season soft-resets RP.
import { Store, isObj } from './core.js';
import { MON } from './carddata.js';
import * as Daily from './daily.js';
import { DECK_COPY, autoDeck, deckValid, owns } from './collection.js';
import { TIERS, tierOf, scoreMatch, seasonStart, seasonOf } from './rankrules.js';

export const RANK_KEY = 'soba-ketto.ranked.v1', RANK_V = 1;
export { TIERS, PROTECTED_TIERS, WIN, LOSS, tierOf } from './rankrules.js';
export const DECK_CAP = 80;
export const CARD_COST = { 1: 1, 2: 2, 3: 3, 4: 5 };
export const BIG_HIT = 3000;                 // a single hit this large counts against risk management

/* card backs: one per tier (kept forever), plus a limited back per season (reached 資深分析師 or higher that month) */
export const BACKS = [
  { id: 'default', name: '金印', tier: 0 }, { id: 'silver', name: '銀紋', tier: 1 }, { id: 'seigaiha', name: '青海波', tier: 2 },
  { id: 'gold', name: '金紋', tier: 3 }, { id: 'shu', name: '朱印', tier: 4 }, { id: 'phoenix', name: '鳳凰', tier: 5 }, { id: 'legend', name: '黑金傳奇', tier: 6 },
];
export const SEASON_BACK_TIER = 2;
const MONTH_KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
export const seasonBack = season => { const m = Number(season.split('-')[1]); return { id: `s-${season}`, name: `${m} 月賽季限定`, mark: MONTH_KANJI[m - 1], month: m, season }; };

let clock = () => new Date();
export const setClock = f => { clock = f || (() => new Date()); };
export const seasonKey = (d = clock()) => seasonOf(d.getTime());           // calendar month in Taiwan time, like the server
export function seasonDaysLeft(d = clock()) { const [y, m] = seasonKey(d).split('-').map(Number); const end = Date.UTC(y, m, 1) - 8 * 3600e3; return Math.max(1, Math.ceil((end - d.getTime()) / 864e5)); }

const fresh = () => ({ season: seasonKey(), rp: 0, peak: 0, w: 0, l: 0, played: 0, backs: ['default'], back: 'default', seasons: [], pending: null, active: false });
let R = fresh();
export function load() { R = { ...fresh(), ...Store.load(RANK_KEY, { version: RANK_V, fallback: fresh, validate: isObj }) }; return checkSeason(); }
const save = () => Store.trySave(RANK_KEY, RANK_V, R);
export const state = () => R;

export const tier = () => TIERS[tierOf(R.rp)];
export function progress(rp = R.rp) {
  const i = tierOf(rp), next = TIERS[i + 1];
  return { tier: i, into: rp - TIERS[i].at, need: next ? next.at - TIERS[i].at : 0, next: next ? next.name : null };
}

/* ---------- decks ---------- */
export const deckCost = list => list.reduce((s, id) => s + (MON[id] ? CARD_COST[MON[id].rank] || 0 : 0), 0);
export const deckOk = list => deckCost(list) <= DECK_CAP;
/* a strong legal ranked deck from the collection. Per attribute (5 cards each) it tries a few shapes —
   e.g. 1 UR + 1 R + 3 N, or 2 SR + 1 R + 2 N — using the best owned cards (falling back to a lower rank when
   short), and keeps the legal deck with the most total ATK + DEF. Simulations show these shapes beat 40 R by
   only a few points of win rate: the cap keeps a full collection from deciding ranked duels. */
const SHAPES = [[1, 0, 1, 3], [0, 2, 1, 2], [1, 1, 0, 3], [0, 1, 3, 1], [0, 0, 5, 0]];      // [UR, SR, R, N] per attribute
export function rankedDeck(cap = DECK_CAP) {
  const power = id => MON[id].atk + MON[id].def;
  const cats = [...new Set(Object.values(MON).map(m => m.cat))];
  const owned = (cat, rank) => Object.values(MON).filter(m => m.cat === cat && m.rank === rank && owns(m.id))
    .sort((a, b) => (b.atk + b.def) - (a.atk + a.def)).flatMap(m => Array(DECK_COPY).fill(m.id));
  let best = null;
  for (const shape of SHAPES) {
    const deck = [];
    for (const cat of cats) {
      const pools = { 4: owned(cat, 4), 3: owned(cat, 3), 2: owned(cat, 2), 1: owned(cat, 1) };
      [4, 3, 2, 1].forEach((rank, k) => {
        for (let n = 0; n < shape[k]; n++) {
          const r = [rank, 3, 2, 1].find(x => x <= rank && pools[x].length);       // short of this rank: next one down
          if (r) deck.push(pools[r].shift());
        }
      });
    }
    if (deck.length !== 40 || deckCost(deck) > cap) continue;
    const p = deck.reduce((t, id) => t + power(id), 0);
    if (!best || p > best.p) best = { deck, p };
  }
  if (best) return best.deck;
  const auto = autoDeck();
  if (deckCost(auto) <= cap) return auto;
  /* last resort: the cheapest owned cards, two copies each, so a legal deck always exists */
  return Object.values(MON).filter(m => owns(m.id)).sort((a, b) => a.rank - b.rank || (b.atk + b.def) - (a.atk + a.def))
    .flatMap(m => Array(DECK_COPY).fill(m.id)).slice(0, 40);
}
/* the deck a ranked duel uses: yours when it is a legal 40-card deck within the cap, otherwise one built
   automatically for this duel only (your saved deck is not changed), so a player is never stuck at the door */
export function deckForRanked(list) {
  if (deckValid(list) && deckOk(list)) return { list: list.slice(), auto: false };
  return { list: rankedDeck(), auto: true };
}

/* ---------- a match ---------- */
/* perf input: { total, correct, atk, smartAtk, defChances, smartDef, lpLeft (0–1), maxHit } → 0–100 and its parts */
export function performance(s) {
  const acc = s.total ? s.correct / s.total : 0;
  const knowledge = Math.round(acc * 40);
  const atkPart = s.atk ? s.smartAtk / s.atk : 0;
  const defPart = s.defChances ? s.smartDef / s.defChances : 1;          // no chance to use advantage: not held against you
  const strategy = Math.round(atkPart * 15 + defPart * 20);
  const risk = Math.round(Math.max(0, Math.min(1, s.lpLeft)) * 15 + (s.maxHit < BIG_HIT ? 10 : s.maxHit < BIG_HIT * 1.5 ? 5 : 0));
  return { score: Math.min(100, knowledge + strategy + risk), knowledge, strategy, risk };
}
export function begin() { R.active = true; save(); }
/* record a ranked result; returns what changed for the result screen */
export function applyMatch(win, perfScore) {
  const r = scoreMatch(R.rp, win, perfScore);
  R.rp = r.after; R.played++; win ? R.w++ : R.l++; R.peak = Math.max(R.peak, r.tierAfter); R.active = false; save();
  return r;
}
/* after joining the online leaderboard the server's standing is the truth (same season only) */
export function syncOnline(me) {
  if (!me || me.season !== R.season) return false;
  Object.assign(R, { rp: me.rp, peak: Math.max(me.peak, tierOf(me.rp)), w: me.w, l: me.l, played: Math.max(R.played, me.w + me.l) });
  save(); return true;
}
/* a ranked duel that was abandoned (save discarded, another duel started) counts as a loss with no performance */
export function forfeitIfActive() { return R.active ? applyMatch(false, 0) : null; }

/* ---------- seasons ---------- */
export function rewardFor(season, peak) {
  const [y, m] = season.split('-').map(Number);
  const backs = BACKS.filter(b => b.tier <= peak).map(b => b.id);
  if (peak >= SEASON_BACK_TIER) backs.push(seasonBack(season).id);
  return { season, peak, title: { id: `season-${season}`, name: `${y} 年 ${m} 月賽季・${TIERS[peak].name}`, desc: `${y} 年 ${m} 月賽季最高段位：${TIERS[peak].name}` }, backs };
}
/* at the first visit of a new month: reward the last season (if it was played), soft-reset points two tiers down */
export function checkSeason(now = seasonKey()) {
  if (R.season === now) return null;
  let reward = null;
  if (R.played > 0) {
    reward = rewardFor(R.season, R.peak);
    for (const b of reward.backs) if (!R.backs.includes(b)) R.backs.push(b);
    Daily.addCustomTitle(reward.title.id, reward.title.name, reward.title.desc);
    R.seasons.push({ season: R.season, peak: R.peak, rp: R.rp, w: R.w, l: R.l });
  }
  const st = seasonStart(R.rp);
  Object.assign(R, { season: now, rp: st.rp, peak: st.peak, w: 0, l: 0, played: 0, pending: reward, active: false });
  save();
  return reward;
}
export function takePending() { const p = R.pending; if (p) { R.pending = null; save(); } return p; }

/* ---------- card backs ---------- */
export function backInfo(id) {
  if (id && id.startsWith('s-')) return { ...seasonBack(id.slice(2)), season: id.slice(2) };
  return BACKS.find(b => b.id === id) || BACKS[0];
}
export function setBack(id) { if (!R.backs.includes(id)) return false; R.back = id; save(); return true; }

export function init() { load(); }
