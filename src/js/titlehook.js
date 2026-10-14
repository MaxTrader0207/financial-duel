// titlehook.js — the line under the title's slogan 「你懂多少，就打多重。」, picked from the player's own state:
// a first-time player hears what the game teaches, a player close to the next ranked tier is told how close, a player
// with a weak attribute is challenged on it; otherwise one of a few lines, changing daily.
import { CATS } from './carddata.js';
import { Tutor } from './tutor.js';
import { weakCat, lifetimeByCat } from './records.js';
import * as Ranked from './ranked.js';
import { TIERS } from './rankrules.js';

export const ROTATION = [
  '市場不會等你準備好。答對才能出手，答錯就要承受。',
  '在市場繳學費之前，先在這裡輸給自己。',
  '{q} 題、{c} 張卡，你能撐幾回合？',
  '你的金融知識，排得上第幾名？',
];
const dayIndex = d => Math.floor((d.getTime() + 8 * 3600e3) / 864e5);      // Taiwan calendar day

/* s: { newPlayer, ranked: { played, tier, into, need, next } | null, weak: { cat, rate } | null, questions, cards, now } */
export function hookLine(s) {
  if (s.newPlayer) return { kind: 'new', text: '每一張卡都是一個金融觀念。把答錯的題目，練成你的武器。' };
  const r = s.ranked;
  if (r && r.played > 0 && r.next) {
    const left = r.need - r.into, win = TIERS[r.tier].win, wins = Math.max(1, Math.ceil(left / win));
    if (wins <= 2) return { kind: 'rank', text: `排位賽再贏 ${wins} 場左右，就能升上「${r.next}」。` };
  }
  if (s.weak) return { kind: 'weak', text: `你的弱項是「${CATS[s.weak.cat].name}」，正確率 ${Math.round(s.weak.rate * 100)}%。今天把它拿下？` };
  const t = ROTATION[dayIndex(s.now || new Date()) % ROTATION.length];
  return { kind: 'daily', text: t.replace('{q}', s.questions).replace('{c}', s.cards) };
}

export function currentHook({ questions, cards, now } = {}) {
  const w = weakCat(), b = w ? lifetimeByCat()[w] : null;
  const st = Ranked.state();
  return hookLine({ newPlayer: !Tutor.done(), ranked: { played: st.played || 0, ...Ranked.progress() },
    weak: w && b && b.t ? { cat: w, rate: b.c / b.t } : null, questions, cards, now });
}
