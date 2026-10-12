// rules.js — fixed rules: the type-advantage cycle and multipliers, the weak-attribute bonus, question level names.
import { DIFFS } from './core.js';

let ADV_CYCLE, BEATS, ADV_WHY, ADV_UP, ADV_DOWN, WEAK_MULT, diffKeyOf;

/* multiplier on the defender's DEF */
function advOf(defCat, atkCat) { if (BEATS[defCat] === atkCat) return ADV_UP; if (BEATS[atkCat] === defCat) return ADV_DOWN; return 1; }

export function init() {
/* ---------- type advantage: each category beats the next one in the cycle ---------- */
ADV_CYCLE = ['risk', 'deriv', 'crypto', 'fx', 'chips', 'fund', 'etf', 'tech'];
BEATS = Object.fromEntries(ADV_CYCLE.map((k, i) => [k, ADV_CYCLE[(i + 1) % ADV_CYCLE.length]]));
ADV_WHY = { risk: '部位控管壓得住槓桿', deriv: '期貨與選擇權避險，化解幣價暴漲暴跌', crypto: '去中心化資產不受單一國家的匯率政策左右', fx: '匯率牽動熱錢進出，外資買賣跟著匯率走', chips: '短線資金流向蓋過基本面', fund: '看懂成分股的基本面，才挑得出勝過大盤的標的', etf: '長期被動持有，不被短線線型洗出場', tech: '看準進出場點，風控也得跟著價格走' };
ADV_UP = 1.5;
ADV_DOWN = 0.5;
WEAK_MULT = 1.2;
diffKeyOf = d => Object.keys(DIFFS).find(k => DIFFS[k] === d) || 'normal';
}

/* question levels */
const DIFF_LABEL = { 1: '初階', 2: '中階', 3: '進階' };

export { DIFF_LABEL, ADV_CYCLE, ADV_DOWN, ADV_UP, ADV_WHY, BEATS, WEAK_MULT, advOf, diffKeyOf };
