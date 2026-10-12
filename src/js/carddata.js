// carddata.js — the card pool as data: the 8 attributes, all cards from public/data/cards.json (sorted by
// attribute → rank → ATK, each with its variant number v for the art), lookup by id, and rarity names.
// Rules (skills.js, calc.js) use this module; drawing a card face is cards.js.
import { DATA } from './data.js';

let CATS, CAT_ALIAS, MONSTERS, MON, RARITY, RARITY_TC, RARITY_FULL;

export function init() {
CATS = {
  tech:  { name:'技術分析', badge:'技', jp:'技術分析', color:'var(--c-tech)' },
  fund:  { name:'基本面',   badge:'財', jp:'基本面', color:'var(--c-fund)' },
  deriv: { name:'衍生性商品', badge:'派', jp:'衍生商品', color:'var(--c-deriv)' },
  risk:  { name:'風險管理', badge:'守', jp:'風險管理', color:'var(--c-risk)' },
  chips: { name:'籌碼與市場', badge:'籌', jp:'籌碼市場', color:'var(--c-chips)' },
  fx:    { name:'外匯', badge:'匯', jp:'外匯', color:'var(--c-fx)' },
  crypto:{ name:'虛擬貨幣', badge:'幣', jp:'虛擬貨幣', color:'var(--c-crypto)' },
  etf:   { name:'ETF', badge:'指', jp:'ETF', color:'var(--c-etf)' },
};
CAT_ALIAS = { '技術分析':'tech','技術面':'tech','基本面':'fund','基本分析':'fund','衍生性商品':'deriv','期貨選擇權':'deriv','衍生品':'deriv','風險管理':'risk','資金管理':'risk','籌碼與市場':'chips','籌碼':'chips','市場':'chips','籌碼面':'chips','外匯':'fx','匯率':'fx','外匯市場':'fx','虛擬貨幣':'crypto','加密貨幣':'crypto','虛擬資產':'crypto','加密資產':'crypto','ETF':'etf','etf':'etf','指數股票型基金':'etf' };
/* card data lives in public/data/cards.json (loaded at start-up); skills are code, keyed by id, in skills.js */
MONSTERS = DATA.cards.map(m => ({ ...m }));
{ const CAT_ORDER = ['tech', 'fund', 'deriv', 'risk', 'chips', 'fx', 'crypto', 'etf'], seen = {};
  MONSTERS.sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || a.rank - b.rank || b.atk - a.atk);
  MONSTERS.forEach(m => { m.v = seen[m.cat] = (seen[m.cat] ?? -1) + 1; }); }
MON = Object.fromEntries(MONSTERS.map(m => [m.id, m]));
RARITY = { 1: 'N', 2: 'R', 3: 'SR', 4: 'UR' };
RARITY_TC = { N: '普', R: '稀', SR: '超', UR: '極' };
RARITY_FULL = { N: '普通', R: '稀有', SR: '超稀有', UR: '極稀有' };
}

export { CATS, CAT_ALIAS, MON, MONSTERS, RARITY, RARITY_FULL, RARITY_TC };
