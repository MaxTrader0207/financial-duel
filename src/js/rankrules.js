// rankrules.js — the ranked point rules shared by the game (ranked.js) and the online leaderboard (worker/).
// No imports and no browser APIs: the Cloudflare Worker bundles this same file, so the server recomputes every
// result with exactly the rules the player saw, instead of trusting a points number sent by the browser.
export const TIERS = [
  { name: '見習交易員', seal: '見', at: 0, diff: 'easy' },
  { name: '初級分析師', seal: '初', at: 100, diff: 'easy' },
  { name: '資深分析師', seal: '析', at: 250, diff: 'normal' },
  { name: '操盤手', seal: '操', at: 450, diff: 'normal' },
  { name: '基金經理人', seal: '基', at: 700, diff: 'hard' },
  { name: '投資長', seal: '長', at: 1000, diff: 'hard' },
  { name: '傳奇投資人', seal: '傳', at: 1400, diff: 'hard' },
];
export const PROTECTED_TIERS = 3;            // in the first three tiers a loss never drops you to a lower tier
export const WIN = { base: 15, perf: 15 }, LOSS = { base: -20, perf: 12 };   // win +15…+30, loss −20…−8
export const PERF_MAX = { knowledge: 40, strategy: 35, risk: 25 };
export const SEASON_RESET_TIERS = 2;         // a new season starts this many tiers lower

export const tierOf = rp => TIERS.reduce((t, x, i) => (rp >= x.at ? i : t), 0);

/* one ranked result applied to rp; perfScore 0–100 */
export function scoreMatch(rp, win, perfScore) {
  const before = Math.max(0, rp | 0), tBefore = tierOf(before);
  const p = Math.max(0, Math.min(100, Math.round(perfScore) || 0));
  let after = Math.max(0, before + (win ? WIN.base + Math.round(p / 100 * WIN.perf) : LOSS.base + Math.round(p / 100 * LOSS.perf)));
  let shielded = false;
  if (!win && tBefore < PROTECTED_TIERS && tierOf(after) < tBefore) { after = TIERS[tBefore].at; shielded = true; }
  const tAfter = tierOf(after);
  return { win: !!win, delta: after - before, before, after, tierBefore: tBefore, tierAfter: tAfter, shielded, promoted: tAfter > tBefore, demoted: tAfter < tBefore };
}

/* where a new season starts from last season's points */
export function seasonStart(lastRp) {
  const t = Math.max(0, tierOf(lastRp | 0) - SEASON_RESET_TIERS);
  return { rp: TIERS[t].at, peak: t };
}

/* a performance breakdown sent by a client: integers within the maximums, or null */
export function checkPerf(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  for (const [k, max] of Object.entries(PERF_MAX)) {
    const v = p[k];
    if (!Number.isInteger(v) || v < 0 || v > max) return null;
    out[k] = v;
  }
  out.score = out.knowledge + out.strategy + out.risk;
  return out;
}

/* seasons follow the calendar month in Taiwan time (UTC+8), on both the game and the server */
const pad = n => String(n).padStart(2, '0');
export function seasonOf(ms = Date.now()) { const d = new Date(ms + 8 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`; }
export function prevSeason(season) { const [y, m] = season.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`; }
