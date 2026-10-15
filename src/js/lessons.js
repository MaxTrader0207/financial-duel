// lessons.js — 教學中心 (rules only; the screen is lessonsui.js). Five one-minute lessons, each a few lines of
// explanation and three practice questions generated from the game's own data (cards, the type-advantage cycle, market
// events, ranked rules), so they are never out of date and differ every time. Progress: the best score per lesson; the
// first time a lesson is finished with at least 2 right it gives LESSON_SHARDS card shards.
import { Store, isObj } from './core.js';
import { CATS, MON, MONSTERS, RARITY_FULL, RARITY } from './carddata.js';
import { SKILLS } from './skills.js';
import { ADV_CYCLE, BEATS, ADV_UP, ADV_DOWN, advOf } from './rules.js';
import { FAST_BONUS, CHAIN_BONUS, CHAIN_AT } from './calc.js';
import { EVENTS } from './market.js';
import { TIERS, PROTECTED_TIERS, SEASON_RESET_TIERS } from './rankrules.js';
import { CARD_COST, DECK_CAP } from './ranked.js';
import { FAMILIES, familiesOf } from './skilltree.js';
import * as Daily from './daily.js';

export const LESSON_KEY = 'soba-ketto.lessons.v1', LESSON_V = 1, LESSON_SHARDS = 10, PASS = 2;
const cn = k => CATS[k].name;
const beaterOf = k => ADV_CYCLE.find(x => BEATS[x] === k);
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
const shuf = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* a question: options shuffled, `answer` is the index of the right one */
function Q(prompt, right, wrong, explain, rnd, extra = {}) {
  const w = typeof right === 'object' ? wrong : [...new Set(wrong.map(String))].filter(x => x !== String(right));
  const opts = shuf([typeof right === 'object' ? right : String(right), ...w.slice(0, 3)], rnd);
  right = typeof right === 'object' ? right : String(right);
  return { prompt, options: opts.map(o => (typeof o === 'object' ? o : { text: String(o) })), answer: opts.indexOf(right), explain, ...extra };
}
const others = (k, n, rnd, not = []) => shuf(Object.keys(CATS).filter(x => x !== k && !not.includes(x)), rnd).slice(0, n);
const near = (v, rnd, step = 100) => { const s = new Set(); while (s.size < 3) { const d = (Math.floor(rnd() * 8) - 4) * step; if (d && v + d >= 0) s.add(v + d); } return [...s]; };
const r100 = (lo, hi, rnd) => Math.round((lo + rnd() * (hi - lo)) / 100) * 100;
const card = (cat, rnd, test = () => true) => pick(MONSTERS.filter(m => m.cat === cat && m.rank <= 3 && test(m)), rnd);

export const LESSONS = [
  { id: 'adv', title: '屬性相剋', desc: '九個屬性一圈相剋，防禦時選對屬性，守備力 ×1.5。', wheel: true,
    get intro() { return [`九個屬性排成一圈，箭頭指向的屬性被剋制（例如「${cn('risk')}」剋「${cn('deriv')}」）。`,
      `防禦時，你的卡剋制攻擊方：守備力 ×${ADV_UP}；被攻擊方剋制：守備力 ×${ADV_DOWN}。`,
      '手牌上會標出「相剋」「被剋」，對戰中也可以按右上角的「?」看這張圖。']; },
    make(rnd) {
      const a = pick(ADV_CYCLE, rnd), b = pick(ADV_CYCLE, rnd);
      const q1 = Q(`「${cn(a)}」剋制哪一個屬性？`, cn(BEATS[a]), others(BEATS[a], 3, rnd, [a]).map(cn),
        `箭頭從「${cn(a)}」指向「${cn(BEATS[a])}」：${cn(a)}剋${cn(BEATS[a])}。`, rnd);
      const q2 = Q(`對手用「${cn(b)}」的卡攻擊。哪個屬性的卡防禦時守備力 ×${ADV_UP}？`, cn(beaterOf(b)), others(beaterOf(b), 3, rnd, [b]).map(cn),
        `剋制「${cn(b)}」的是「${cn(beaterOf(b))}」，用它防禦守備力 ×${ADV_UP}。`, rnd);
      /* pick the best blocker: the one that beats the attacker may win even with a lower printed DEF */
      let q3 = null;
      for (let t = 0; t < 40 && !q3; t++) {
        const atkCat = pick(ADV_CYCLE, rnd), foe = card(atkCat, rnd);
        const good = card(beaterOf(atkCat), rnd), weak = card(BEATS[atkCat], rnd), mid = card(others(atkCat, 1, rnd, [beaterOf(atkCat), BEATS[atkCat]])[0], rnd);
        const hand = [good, weak, mid].filter(Boolean); if (hand.length < 3) continue;
        const eff = hand.map(m => Math.round(m.def * advOf(m.cat, atkCat)));
        const best = Math.max(...eff); if (eff.filter(e => e === best).length > 1 || weak.def <= good.def) continue;
        const opts = hand.map((m, i) => ({ text: `${m.name}（${cn(m.cat)}，守 ${m.def}）`, card: m.id, eff: eff[i] }));
        const right = opts[eff.indexOf(best)];
        q3 = Q(`對手的「${foe.name}」（${cn(atkCat)}）攻擊你。派哪張卡防禦，實際守備力最高？`, right, opts.filter(o => o !== right),
          hand.map((m, i) => `${m.name}：${m.def} × ${advOf(m.cat, atkCat)} ＝ ${eff[i]}`).join('；') + '。印出來的守備力最高，不一定擋得最好。', rnd, { foe: foe.id, pickCard: true });
      }
      return [q1, q2, q3].filter(Boolean);
    } },
  { id: 'dmg', title: '傷害怎麼算', desc: '攻擊、對手擋下、你防禦，三種情況的傷害一次搞懂。',
    get intro() { return ['你攻擊並答對：傷害 ＝ 攻擊力，對手再派卡擋。', `對手擋下（答對）：只造成「攻擊力 − 守備力」；答錯就全額命中。`,
      `速攻秒數內答對 +${FAST_BONUS}；連續答對 ${CHAIN_AT} 題起再 +${CHAIN_BONUS}。`, '你防禦並答對：只承受「攻擊力 − 守備力」；守備力比較高，差額會反彈給對手。']; },
    make(rnd) {
      const A = r100(1400, 2400, rnd), D = r100(600, A - 300, rnd);
      const q1 = Q(`你用攻擊力 ${A} 的卡攻擊並答對。對手派守備力 ${D} 的卡，也答對了。對手損失多少資金？`, A - D, [A, D, A + D].filter(x => x !== A - D),
        `對手擋下時只讓「攻擊力 − 守備力」穿過：${A} − ${D} ＝ ${A - D}。`, rnd);
      const A2 = r100(1200, 2200, rnd);
      const q2 = Q(`你用攻擊力 ${A2} 的卡，在速攻秒數內答對；對手擋下但答錯。對手損失多少？`, A2 + FAST_BONUS, near(A2 + FAST_BONUS, rnd).concat([A2]).filter(x => x !== A2 + FAST_BONUS),
        `對手答錯，全額命中；速攻再 +${FAST_BONUS}：${A2} + ${FAST_BONUS} ＝ ${A2 + FAST_BONUS}。`, rnd);
      const FA = r100(1500, 2400, rnd), adv = rnd() < 0.5, d0 = r100(900, 1600, rnd), DD = Math.round(d0 * (adv ? ADV_UP : 1));
      const pierce = Math.max(0, FA - DD), reflect = Math.max(0, DD - FA);
      const q3 = Q(`對手攻擊力 ${FA}。你派守備力 ${d0} 的卡${adv ? `，而且屬性剋制對手（×${ADV_UP}）` : ''}，並答對了。你承受多少傷害？`, pierce,
        [FA, d0, Math.abs(FA - d0) === pierce ? FA + d0 : Math.abs(FA - d0), FA - Math.round(d0 / 2)].filter((x, i, a) => x !== pierce && x >= 0 && a.indexOf(x) === i),
        `${adv ? `守備力 ${d0} × ${ADV_UP} ＝ ${DD}。` : ''}承受「攻擊力 − 守備力」${pierce ? `：${FA} − ${DD} ＝ ${pierce}` : `：守備力比較高，不受傷，還把 ${reflect} 反彈給對手`}。`, rnd);
      return [q1, q2, q3];
    } },
  { id: 'skill', title: '技能系統', desc: '每張卡都有技能，認識六種技能系統，出牌更有策略。',
    get intro() { return FAMILIES.map(f => `${f.name}：${f.desc}`).concat(['長按卡片可以看技能全文；「卡牌族譜」依這六系排出你所有的卡。']); },
    make(rnd) {
      const used = new Set(), out = [];
      for (let t = 0; out.length < 3 && t < 60; t++) {
        const m = pick(MONSTERS, rnd), fam = familiesOf(m.id)[0]; if (used.has(fam)) continue; used.add(fam);
        const right = FAMILIES.find(f => f.id === fam);
        out.push(Q(`「${m.name}」的技能【${SKILLS[m.id].name}】：${SKILLS[m.id].text}　這屬於哪一系？`, right.name, shuf(FAMILIES.filter(f => f.id !== fam), rnd).map(f => f.name),
          `${right.name}：${right.desc}。`, rnd, { card: m.id }));
      }
      return out;
    } },
  { id: 'market', title: '市場事件', desc: '升息、股市暴跌…不同事件讓不同屬性變強或變弱。',
    intro: ['休閒與排位對戰從第 2 回合起，每 3 回合翻出一個市場事件。', '事件期間，兩個屬性攻擊力 ×1.2、一個屬性 ×0.8。', '事件對你和對手都有效；手牌上標著「事件 ×1.2」的卡，這段期間出手比較划算。'],
    make(rnd) {
      const e1 = pick(EVENTS, rnd), up = pick(e1.up, rnd);
      const q1 = Q(`市場事件「${e1.name}」時，哪個屬性的攻擊力 ×1.2？`, cn(up), others(up, 3, rnd, [...e1.up, e1.down]).map(cn), `${e1.name}：${e1.why}`, rnd);
      const e2 = pick(EVENTS.filter(e => e !== e1), rnd);
      const q2 = Q(`市場事件「${e2.name}」時，哪個屬性的攻擊力 ×0.8？`, cn(e2.down), others(e2.down, 3, rnd, [...e2.up, e2.down]).map(cn), `${e2.name}：${e2.why}`, rnd);
      const q3 = Q('市場事件的加成對誰有效？', '你和對手都有效', ['只有你', '只有對手', '只有排位賽的對手'], '事件影響整個市場，雙方的卡都適用同樣的倍率。', rnd);
      return [q1, q2, q3];
    } },
  { id: 'ranked', title: '排位賽', desc: '段位、牌組點數上限、賽季，打排位前先看這裡。',
    get intro() { return [`段位由低到高：${TIERS.map(t => t.name).join(' → ')}。`, `排位牌組點數上限 ${DECK_CAP}：普通 ${CARD_COST[1]}、稀有 ${CARD_COST[2]}、超稀有 ${CARD_COST[3]}、極稀有 ${CARD_COST[4]} 點。`,
      '勝敗加減分，還會依這場的知識、策略、風險管理表現調整。', `前 ${PROTECTED_TIERS} 個段位有保護，輸了不會掉段；每月新賽季從低 ${SEASON_RESET_TIERS} 個段位開始。`]; },
    make(rnd) {
      const i = Math.floor(rnd() * (TIERS.length - 1));
      const pool = [
        () => Q('排位賽的牌組點數上限是多少？', DECK_CAP, [60, 100, 120], `上限 ${DECK_CAP} 點，超過時會自動改用符合上限的牌組。`, rnd),
        () => Q(`一張「${RARITY_FULL[RARITY[4]]}」卡在排位牌組算幾點？`, CARD_COST[4], [CARD_COST[3], 4, 10], `普通 ${CARD_COST[1]}、稀有 ${CARD_COST[2]}、超稀有 ${CARD_COST[3]}、極稀有 ${CARD_COST[4]} 點。`, rnd),
        () => Q(`「${TIERS[i].name}」的下一個段位是？`, TIERS[i + 1].name, shuf(TIERS.filter((_, k) => k !== i + 1), rnd).map(t => t.name), `段位順序：${TIERS.map(t => t.name).join(' → ')}。`, rnd),
        () => Q('在前三個段位輸掉一場，會怎樣？', '扣分，但不會掉到下一個段位', ['直接掉一個段位', '不扣分', '積分歸零'], `前 ${PROTECTED_TIERS} 個段位有段位保護。`, rnd),
        () => Q('排位賽勝場的加分，除了勝負還看什麼？', '知識、策略、風險管理的表現', ['只看勝負', '對戰花了多少時間', '牌組裡極稀有卡的數量'], '表現好的勝場加分更多，表現差的敗場扣分也更多。', rnd),
        () => Q('新的賽季開始時，段位會怎樣？', `從比上季低 ${SEASON_RESET_TIERS} 個段位的地方開始`, ['全部歸零', '維持不變', '升一個段位'], `每月一個賽季，月初從低 ${SEASON_RESET_TIERS} 個段位重新開始，季末依最高段位發放稱號與卡背。`, rnd),
      ];
      return shuf(pool, rnd).slice(0, 3).map(f => f());
    } },
];
export const lessonById = id => LESSONS.find(l => l.id === id) || null;
export const makeQuestions = (id, rnd = Math.random) => lessonById(id).make(rnd);

/* progress */
let P = null;
const p = () => P || (P = { best: {}, ...Store.load(LESSON_KEY, { version: LESSON_V, fallback: () => ({}), validate: isObj }) });
export const progress = () => p();
export const passed = id => (p().best[id] || 0) >= PASS;
/* record a finished run; returns { first, shards } — shards only the first time a lesson is passed */
export function finish(id, right) {
  const was = passed(id);
  p().best[id] = Math.max(P.best[id] || 0, right); Store.trySave(LESSON_KEY, LESSON_V, P);
  const first = !was && passed(id);
  if (first) Daily.addShards(LESSON_SHARDS);
  return { first, shards: first ? LESSON_SHARDS : 0 };
}
export const doneCount = () => LESSONS.filter(l => passed(l.id)).length;
export { MON };
