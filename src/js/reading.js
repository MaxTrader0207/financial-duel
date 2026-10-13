// reading.js — 閱讀設定: a larger size for the text that is read (questions, options, explanations, the notebook,
// knowledge cards, daily scenarios, tutorial bubbles) and a colour-blind friendly palette for right / wrong.
// Both are classes on <html> (rs-l / rs-xl, cvd); styles.css does the rest. Kept in SET, so backups carry them.
import { SET, saveSet } from './core.js';

export const SIZES = { m: '標準', l: '大', xl: '特大' };
export const textSize = () => (SIZES[SET.textSize] ? SET.textSize : 'm');
export const cvd = () => !!SET.cvd;

export function apply() {
  const c = document.documentElement.classList, s = textSize();
  c.toggle('rs-l', s === 'l'); c.toggle('rs-xl', s === 'xl'); c.toggle('cvd', cvd());
}
export function setTextSize(s) { SET.textSize = SIZES[s] ? s : 'm'; saveSet(); apply(); }
export function setCvd(on) { SET.cvd = !!on; saveSet(); apply(); }

export function init() { apply(); }
