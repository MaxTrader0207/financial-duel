// kbonus.js — 知識加成: what the knowledge encyclopedia gives in a duel (pure rules, no imports).
// Each kind of knowledge card builds its own bonus. A card counts its level (Lv1 = 1 … Lv3 = 3), so a kind has
// 0–75 points; every POINTS_PER_LEVEL points is one bonus level, up to MAX_LEVEL. Levelling a card up needs a right
// answer to its check question, so the bonus grows with what the player has learned, not with what was bought.
// The effects are small on purpose (at most 4 %; sim/kbonus.sim.js: a full bonus is worth less than ten points of
// accuracy), so ranked duels are still decided by answers and strategy.
export const POINTS_PER_LEVEL = 15, MAX_LEVEL = 5;
const pct = x => `${+(x * 100).toFixed(1)}%`;
export const KINDS = {
  stock: { name: '選股眼光', per: 0.008, text: l => `攻擊傷害 +${pct(l * 0.008)}` },
  defense: { name: '風險控管', per: 0.008, text: l => `受到的傷害 −${pct(l * 0.008)}` },
  event: { name: '景氣判讀', per: 0.008, text: l => `市場事件加成 ×${+(1.2 + l * 0.008).toFixed(3)}，減成 ×${+(0.8 + l * 0.008).toFixed(3)}` },
  trap: { name: '識破陷阱', per: 0.006, text: l => `對手擋下你攻擊的機率 −${pct(l * 0.006)}` },
};
export const levelOf = points => Math.min(MAX_LEVEL, Math.floor(Math.max(0, points) / POINTS_PER_LEVEL));
/* { stock: points, … } → { stock: level, … } */
export const levels = pts => Object.fromEntries(Object.keys(KINDS).map(k => [k, levelOf(pts[k] || 0)]));
const lv = (kb, k) => Math.min(MAX_LEVEL, Math.max(0, (kb && kb[k]) | 0));

/* the effects, given the levels snapshotted at the start of a duel (G.kb; absent = no bonus) */
export const attackMult = kb => 1 + lv(kb, 'stock') * KINDS.stock.per;
export const damageTakenMult = kb => 1 - lv(kb, 'defense') * KINDS.defense.per;
export const eventMult = (kb, base) => (base === 1 ? 1 : base + lv(kb, 'event') * KINDS.event.per);
export const blockCut = kb => lv(kb, 'trap') * KINDS.trap.per;
