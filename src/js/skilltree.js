// skilltree.js — 卡牌技能族譜 (rules only; the screen and the exports are treeui.js).
// Every card is placed in a family tree: attribute (clan) → skill family (what its skill does) → card, and marked
// owned / in the saved deck / still to collect. From the same tree the deck is analysed: attribute spread, type-advantage
// coverage (for each attacking attribute, does the deck hold the attribute that beats it?), skill-family balance, the
// player's answer accuracy per attribute (attacking with a card means answering its attribute's questions), and which
// missing cards would close the gaps.
import { CATS, MON, MONSTERS, RARITY } from './carddata.js';
import { SKILLS } from './skills.js';
import { BEATS, ADV_CYCLE } from './rules.js';
import { COL, DECK } from './collection.js';
import { lifetimeByCat } from './records.js';
import { CARD_COST, DECK_CAP, deckCost } from './ranked.js';

/* skill families, by what the skill text says it does; a card's first match is its family in the tree */
export const FAMILIES = [
  { id: 'quiz', name: '答題輔助系', desc: '刪去選項、延長時間、答錯重答', re: /刪去|答題時間|再答一次/ },
  { id: 'burst', name: '爆發系', desc: '機率或倍率放大傷害', re: /機率|×\s?\d|傷害 ×/ },
  { id: 'attack', name: '增傷系', desc: '命中時追加傷害、失手仍有傷害', re: /攻擊命中時[^；。]*(追加|傷害)|攻擊失敗時，仍造成|速攻秒數內/ },
  { id: 'guard', name: '防守系', desc: '減少傷害、提高守備、反彈', re: /防禦失敗|守備力|承受|完全防禦|貫通|反彈/ },
  { id: 'heal', name: '回復系', desc: '回復資金', re: /回復/ },
  { id: 'tempo', name: '戰術系', desc: '抽牌、干擾對手、強化下一擊', re: /抽|丟棄|下一次攻擊|跳過|手牌|對手|再出/ },
];
export const familiesOf = id => { const t = (SKILLS[id] || {}).text || ''; const f = FAMILIES.filter(x => x.re.test(t)).map(x => x.id); return f.length ? f : ['tempo']; };
export const familyName = id => (FAMILIES.find(f => f.id === id) || {}).name || '';
/* the attribute whose cards defend best against `cat` (×1.5 DEF), and the one `cat` is weak against when defending */
export const beaterOf = cat => ADV_CYCLE.find(k => BEATS[k] === cat);

/* the whole tree. deck: the 40-card list analysed (default: the saved deck); owned: owned ids */
export function buildTree({ deck = DECK, owned = COL.owned, acc = accByCat() } = {}) {
  const own = new Set(owned), inDeck = {};
  deck.forEach(id => { inDeck[id] = (inDeck[id] || 0) + 1; });
  const card = m => ({ id: m.id, name: m.name, sigil: m.sigil, rank: m.rank, rar: RARITY[m.rank], atk: m.atk, def: m.def, cat: m.cat,
    owned: own.has(m.id), inDeck: inDeck[m.id] || 0, families: familiesOf(m.id), skill: SKILLS[m.id] ? SKILLS[m.id].name : '' });
  const clans = Object.keys(CATS).map(cat => {
    const cards = MONSTERS.filter(m => m.cat === cat).map(card);
    const fams = FAMILIES.map(f => ({ id: f.id, name: f.name, desc: f.desc, cards: cards.filter(c => c.families[0] === f.id) })).filter(f => f.cards.length);
    return { cat, name: CATS[cat].name, color: CATS[cat].color, cards, families: fams,
      owned: cards.filter(c => c.owned).length, total: cards.length, inDeck: cards.reduce((s, c) => s + c.inDeck, 0),
      byRank: [1, 2, 3, 4].map(r => ({ rank: r, owned: cards.filter(c => c.rank === r && c.owned).length, total: cards.filter(c => c.rank === r).length })),
      acc: acc[cat], beats: BEATS[cat], beatenBy: beaterOf(cat) };
  });
  return { clans, analysis: analyse(clans, deck, acc) };
}

/* answer accuracy per attribute from the learning record: { cat: { t, rate } } (rate null below 10 answers) */
export function accByCat() {
  const b = lifetimeByCat();
  return Object.fromEntries(Object.keys(CATS).map(k => { const x = b[k] || { t: 0, c: 0 }; return [k, { t: x.t, rate: x.t >= 10 ? x.c / x.t : null }]; }));
}

const pct = x => Math.round(x * 100);
function analyse(clans, deck, acc) {
  const by = Object.fromEntries(clans.map(c => [c.cat, c]));
  const famDeck = Object.fromEntries(FAMILIES.map(f => [f.id, 0]));
  deck.forEach(id => { if (MON[id]) famDeck[familiesOf(id)[0]]++; });
  const cards = deck.map(id => MON[id]).filter(Boolean);
  const cost = deckCost(deck), n = cards.length || 1;
  const avgAtk = Math.round(cards.reduce((s, m) => s + m.atk, 0) / n), avgDef = Math.round(cards.reduce((s, m) => s + m.def, 0) / n);
  /* coverage: for each attribute an opponent may attack with, the deck's cards of the attribute that beats it */
  const cover = clans.map(c => ({ vs: c.cat, by: c.beatenBy, n: by[c.beatenBy].inDeck }));
  const strengths = [], weaknesses = [];
  const main = clans.slice().sort((a, b) => b.inDeck - a.inDeck)[0];
  if (main && main.inDeck >= 8) strengths.push(`主力屬性：${main.name}（${main.inDeck} 張）`);
  else if (clans.filter(c => c.inDeck >= 3).length >= 7) strengths.push('屬性分散平均：哪種題目都會出現，適合全面練習');
  const covered = cover.filter(x => x.n >= 2).length;
  if (covered >= 7) strengths.push(`相剋覆蓋完整：${covered} / ${clans.length} 種攻擊屬性都有 2 張以上的剋制卡可以防禦`);
  for (const x of cover.filter(x => x.n === 0)) weaknesses.push(`對手用「${CATS[x.vs].name}」攻擊時，牌組沒有能剋制它的「${CATS[x.by].name}」卡`);
  for (const c of clans) {
    const r = acc[c.cat] && acc[c.cat].rate;
    if (r !== null && r !== undefined && c.inDeck >= 4 && r < 0.6) weaknesses.push(`「${c.name}」正確率只有 ${pct(r)}%，但牌組放了 ${c.inDeck} 張：用它攻擊要答這個屬性的題目`);
    if (r !== null && r !== undefined && r >= 0.85 && c.inDeck >= 4) strengths.push(`「${c.name}」答題正確率 ${pct(r)}%，用它攻擊很穩`);
  }
  const fams = FAMILIES.map(f => ({ id: f.id, name: f.name, n: famDeck[f.id] }));
  for (const f of fams) if (!f.n) weaknesses.push(`牌組沒有「${f.name}」的卡（${FAMILIES.find(x => x.id === f.id).desc}）`);
  const topFam = fams.slice().sort((a, b) => b.n - a.n)[0];
  if (topFam && topFam.n >= 10) strengths.push(`技能以「${topFam.name}」為核心（${topFam.n} 張）`);
  const hi = cards.filter(m => m.rank >= 3).length;
  if (cost > DECK_CAP) weaknesses.push(`排位點數 ${cost} 超過上限 ${DECK_CAP}，排位賽會改用自動組出的牌組`);
  else strengths.push(`排位點數 ${cost} / ${DECK_CAP}，可以直接參加排位賽`);
  if (hi === 0) weaknesses.push('牌組沒有超稀有或極稀有卡，後期火力偏弱');
  return { deckSize: deck.length, cost, avgAtk, avgDef, high: hi, cover, families: fams, strengths, weaknesses,
    owned: clans.reduce((s, c) => s + c.owned, 0), total: clans.reduce((s, c) => s + c.total, 0), wishlist: wishlist(clans, cover, famDeck, main) };
}

/* the missing cards worth collecting first, with the reason: closes a type-advantage gap, adds a missing skill family,
   or is a high-rarity card of an attribute the deck already uses */
function wishlist(clans, cover, famDeck, main) {
  const gapCats = new Set(cover.filter(x => x.n === 0).map(x => x.by));
  const out = [];
  for (const c of clans) for (const card of c.cards) {
    if (card.owned) continue;
    let score = card.rank * 2, why = [];
    if (gapCats.has(c.cat)) { score += 6; why.push(`補上剋制「${CATS[cover.find(x => x.by === c.cat).vs].name}」的防禦`); }
    if (!famDeck[card.families[0]]) { score += 4; why.push(`補上「${familyName(card.families[0])}」`); }
    if (main && c === main && c.inDeck >= 8) { score += 2; why.push(`強化主力屬性「${c.name}」`); }
    if (card.rank === 4) why.push('極稀有：困難模式獲勝的選卡必有 1 張');
    out.push({ ...card, score, why: why.length ? why : ['補齊收藏'], cost: CARD_COST[card.rank] });
  }
  /* at most 2 per attribute, so the list points at several directions */
  const per = {}, pick = [];
  for (const c of out.sort((a, b) => b.score - a.score || b.rank - a.rank)) { if ((per[c.cat] || 0) >= 2) continue; per[c.cat] = (per[c.cat] || 0) + 1; pick.push(c); if (pick.length === 8) break; }
  return pick;
}
