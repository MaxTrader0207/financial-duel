// market.js — 市場事件 during casual and ranked duels (rules only).
// From turn 2, and then every 3 turns, a financial event is drawn. Until the next one it raises the attack of two
// attributes by 20 % and lowers one by 20 % — for both players alike, so it changes which card is the smart play,
// not who is favoured. Each event is also a 事件卡 in the 知識圖鑑 (knowledge id in `card`).
import { G } from './game.js';

export const EVENT_UP = 1.2, EVENT_DOWN = 0.8;
export const FIRST_TURN = 2, EVERY = 3;
export const EVENTS = [
  { id: 'hike', card: 'evt_rate_hike', name: '升息', up: ['fx', 'risk'], down: 'crypto',
    why: '資金成本上升：重視現金流與匯差的外匯、風險管理受惠，高槓桿的虛擬貨幣承壓。' },
  { id: 'cut', card: 'evt_rate_cut', name: '降息', up: ['etf', 'chips'], down: 'fx',
    why: '資金變便宜，股市資金行情與 ETF 受惠；利差縮小，外匯吸引力下降。' },
  { id: 'inflation', card: 'evt_inflation', name: '通膨升溫', up: ['fund', 'deriv'], down: 'etf',
    why: '有定價能力的公司與避險工具較吃香；全市場資產的實質報酬被侵蝕。' },
  { id: 'jobless', card: 'evt_unemployment', name: '失業率攀升', up: ['risk', 'fund'], down: 'chips',
    why: '消費轉弱，防守與基本面分析更重要；市場追價氣氛降溫。' },
  { id: 'crash', card: 'evt_crash', name: '股市暴跌', up: ['risk', 'deriv'], down: 'tech',
    why: '風險控管與避險部位發揮作用；技術線型在恐慌中頻頻失靈。' },
  { id: 'twd', card: 'evt_twd', name: '匯率劇烈波動', up: ['fx', 'deriv'], down: 'etf',
    why: '懂匯率與避險的人掌握主動；海外 ETF 的報酬受匯損影響。' },
  { id: 'recession', card: 'evt_recession', name: '經濟衰退', up: ['risk', 'fund'], down: 'crypto',
    why: '資金回到穩健資產與財務體質好的公司，投機性資產首當其衝。' },
  { id: 'bubble', card: 'evt_bubble', name: '資產泡沫', up: ['crypto', 'tech'], down: 'fund',
    why: '動能與投機當道，追價的技術面與虛擬貨幣暫時領風騷，基本面評價被忽視。' },
];
export const byId = id => EVENTS.find(e => e.id === id) || null;

/* the event in force (null outside casual / ranked duels, or before turn 2) */
export const current = () => (G && G.market && byId(G.market.id)) || null;
export function attackMult(cat) {
  const e = current(); if (!e) return 1;
  return e.up.includes(cat) ? EVENT_UP : e.down === cat ? EVENT_DOWN : 1;
}
/* turn start: draw a new event on turn 2, 5, 8 …; never the same one twice in a row. Returns the new event or null */
export function onTurn(turn, rnd = Math.random) {
  if (!G || !G.market || turn < FIRST_TURN || (turn - FIRST_TURN) % EVERY) return null;
  const plan = G.marketPlan;                             // 好友挑戰: the events were fixed by the challenge seed
  const pool = EVENTS.filter(e => e.id !== G.market.id);
  const e = plan && plan.length ? byId(plan[(G.market.seen || 0) % plan.length]) : pool[Math.floor(rnd() * pool.length)];
  G.market.id = e.id; G.market.since = turn; G.market.seen = (G.market.seen || 0) + 1;
  return e;
}
export const nextTurn = () => (G && G.market ? (G.market.since ? G.market.since + EVERY : FIRST_TURN) : null);
export function enable() { if (G) G.market = { id: null, since: 0, seen: 0 }; }
