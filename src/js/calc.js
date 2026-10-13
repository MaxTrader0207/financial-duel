// calc.js — damage rules as plain functions of the duel state, separate from animation and DOM.
// Skills still run through their hooks (skills.js), which may change G.mods / G.flags or draw and discard cards;
// everything else here only reads G and returns numbers, so it can be unit-tested card by card.
import { G } from './game.js';
import { attackMult } from './market.js';
import { SKILLS } from './skills.js';
import { foeAtkOf, DIFFS } from './core.js';
import { MON } from './cards.js';
import { advOf, WEAK_MULT } from './rules.js';

export const FAST_BONUS = 300, CHAIN_AT = 3, CHAIN_BONUS = 500, RETRY_MULT = 0.5;

/* our attack, answered correctly. r = { time, left, retried } from the quiz */
export function attackHit(m, r) {
  const sk = SKILLS[m.id];
  const c = { side: 'p', atk: m.atk, dmg: m.atk, mult: 1, heal: 0, fast: r.time < G.diff.fast && !r.retried, left: r.left, fastMult: 0, extraAction: false };
  const tags = [];
  if (G.mods.myAtk) { c.dmg = Math.max(0, c.dmg + G.mods.myAtk); tags.push(G.mods.myAtk > 0 ? `強化 +${G.mods.myAtk}` : `追繳 ${G.mods.myAtk}`); G.mods.myAtk = 0; }
  const fired = sk.hit ? !!sk.hit(c) : false;
  if (c.fast && !c.fastMult) { c.dmg += FAST_BONUS; tags.push(`速攻 +${FAST_BONUS}`); }
  if (c.fastMult) tags.push('通道突破 ×1.5');
  if (G.streak >= CHAIN_AT) { c.dmg += CHAIN_BONUS; tags.push(`${G.streak} 連鎖 +${CHAIN_BONUS}`); }
  if (c.mult !== 1) tags.push(`×${c.mult}`);
  let dmg = c.dmg * c.mult * (c.fastMult || 1);
  if (G.weak && m.cat === G.weak) { dmg *= WEAK_MULT; tags.push(`弱項 ×${WEAK_MULT}`); }
  const em = attackMult(m.cat); if (em !== 1) { dmg *= em; tags.push(`事件 ×${em}`); }
  if (r.retried) { dmg *= RETRY_MULT; tags.push(`重答 ×${RETRY_MULT}`); }
  dmg = Math.round(dmg);
  if (c.lifesteal) c.heal += Math.round(dmg * c.lifesteal);
  return { dmg, tags, heal: c.heal, fired, extra: !!c.extraAction };
}

/* our attack, answered wrong: usually nothing, unless the card's miss hook deals damage, heals or backfires */
export function attackMiss(m) {
  const sk = SKILLS[m.id];
  const c = { side: 'p', atk: m.atk, dmg: 0, backlash: 0, heal: 0 };
  const fired = sk.miss ? !!sk.miss(c) : false;
  return { dmg: c.dmg, backlash: c.backlash, heal: c.heal, fired };
}

/* before the defence quiz resolves: the attack value, our DEF after skill bonus and type advantage */
export function defendSetup(m, foe) {
  const sk = SKILLS[m.id];
  const atkTags = [];
  const atk = foeAtkOf(foe);
  if (G.mods.foeAtk) { atkTags.push(`追繳 ${G.mods.foeAtk}`); G.mods.foeAtk = 0; }
  const defBonus = typeof sk.defBonus === 'function' ? sk.defBonus() : (sk.defBonus || 0);
  const adv = advOf(m.cat, foe.cat);
  const def = Math.round((m.def + defBonus) * adv);
  return { atk, atkTags, defBonus, adv, def };
}

/* defence answered correctly: piercing damage to us, or reflected damage to the opponent */
export function defendOk(m, s, r) {
  const sk = SKILLS[m.id];
  const c = { atk: s.atk, def: s.def, reflect: Math.max(0, s.def - s.atk), pierce: Math.max(0, s.atk - s.def), heal: 0 };
  if (r.retried) { c.pierce = Math.max(c.pierce, Math.round(s.atk / 2)); c.reflect = Math.round(c.reflect / 2); }
  const fired = sk.defOk ? !!sk.defOk(c) : false;
  return { pierce: c.pierce, reflect: c.reflect, heal: c.heal, fired };
}

/* defence answered wrong: full attack (after the opponent's hit skill and our defFail skill) */
export function defendFail(m, foe, s) {
  const sk = SKILLS[m.id], fsk = SKILLS[foe.id];
  const c = { side: 'c', atk: s.atk, dmg: s.atk, def: s.def, mult: 1, heal: 0, fast: false, left: 0 };
  const foeFired = fsk.hit ? !!fsk.hit(c) : false;
  c.dmg = Math.round(c.dmg * c.mult);
  const fired = sk.defFail ? !!sk.defFail(c) : false;
  if (c.lifesteal) c.heal += Math.round(c.dmg * c.lifesteal);
  return { dmg: c.dmg, foeHeal: c.heal, foeFired, fired };
}

/* ---------- the opponent blocks our attack ----------
   After a correct attack the opponent defends with one hand card: it picks the card with the best DEF × type
   advantage (a careless pick on easier levels) and "answers" with FOE_BLOCK[difficulty] accuracy.
   A good block lets only damage − DEF through. Unlike our blocks it never reflects: a right answer should not cost us LP.
   The opponent's skills do not fire when it blocks. */
export const FOE_BLOCK = { easy: 0.45, normal: 0.5, hard: 0.55 };   // tuned with sim/ (see sim/README.md)
export const FOE_BLOCK_SENSE = { easy: 0.5, normal: 0.75, hard: 1 };
const dkOf = () => Object.keys(DIFFS).find(k => DIFFS[k] === G.diff) || 'normal';
export function foePickBlocker(m) {
  const hand = G.hand.c; if (!hand.length) return -1;
  if (Math.random() >= (FOE_BLOCK_SENSE[dkOf()] ?? 0.75)) return Math.floor(Math.random() * hand.length);
  const v = hand.map(i => MON[i.id].def * advOf(MON[i.id].cat, m.cat));
  return v.indexOf(Math.max(...v));
}
/* Each duel the opponent gets a profile: two attributes it knows well (+FOE_FORTE accuracy) and two it is weak
   in (−FOE_FORTE). The block question is in the attacker's attribute, so attacking with its weak ones pays.
   The swings cancel out, so the average block rate (and the simulated balance) stays at FOE_BLOCK. */
export const FOE_FORTE = 0.15;
const FOE_CATS = ['tech', 'fund', 'deriv', 'risk', 'chips', 'fx', 'crypto', 'etf'];
export function foeProfile(rnd = Math.random) {
  const c = FOE_CATS.slice();
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return { strong: c.slice(0, 2), weak: c.slice(2, 4) };
}
export function foeAcc(cat) {
  const p = G.foeProf || {}, base = FOE_BLOCK[dkOf()] ?? 0.45;
  const s = (p.strong || []).includes(cat) ? FOE_FORTE : (p.weak || []).includes(cat) ? -FOE_FORTE : 0;
  return Math.min(0.95, Math.max(0.05, base + s + (G.foeBoost || 0)));     // foeBoost: top ranked tiers
}
/* returns null when the opponent has no card; otherwise the blocker, its answer and what actually lands */
export function foeBlock(m, dmg) {
  const idx = foePickBlocker(m); if (idx < 0) return null;
  const card = MON[G.hand.c.splice(idx, 1)[0].id];
  const adv = advOf(card.cat, m.cat), def = Math.round(card.def * adv);
  const acc = foeAcc(m.cat), ok = Math.random() < acc;
  if (G.foeStats) { G.foeStats.t++; if (ok) G.foeStats.c++; }
  if (!ok) return { card, ok, acc, adv, def, dmg, reflect: 0 };
  return { card, ok, acc, adv, def, dmg: Math.max(0, dmg - def), reflect: 0 };
}
