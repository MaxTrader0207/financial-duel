// flow.js — the duel's turn order: start or resume a duel, our attack, the opponent's attack, resolving each answer, and the end.
import { Actions, register } from './actions.js';
import { cpuPick } from './ai.js';
import { createMachine } from './fsm.js';
import { fmtDate } from './report.js';
import { attackHit, attackMiss, defendSetup, defendOk, defendFail, foeBlock, foeProfile } from './calc.js';
import { ask } from './ask.js';
import { showFoeAnswer } from './foequiz.js';
import { foeQuestion } from './quiz.js';
import { BG } from './backgrounds.js';
import { CATS, MON } from './cards.js';
import { COL, DECK, colSave, cpuDeckList, rewardOffer } from './collection.js';
import { $, DIFFS, LP_MAX, esc, foeAtkOf, sleep } from './core.js';
import { clearField, damage, floatText, log, lunge, placeField, shatter } from './fx.js';
import { RECS, recordGame } from './records.js';
import { onDuelWin, bonusLevels } from './knowledge.js';
import { ensureAdvantage, tutorialFoeLp, setupTutorial, suggestCard, tutorialFoeMiss } from './tutorial-script.js';
import { renderResult } from './result.js';
import { WEAK_MULT, advOf, diffKeyOf } from './rules.js';
import { clearSave, readSave } from './save.js';
import { stale } from './game.js';
import { show, toast, transition } from './view.js';
import { SKILLS, heal, skillFX } from './skills.js';
import { Sound } from './sound.js';
import { newGame } from './state.js';
import { draw, makeDeck } from './deck.js';
import { G, reserveUids, setGame } from './game.js';
import { renderAll, renderHands, setPhase } from './board.js';
import { Tutor } from './tutor.js';
import * as Market from './market.js';
import * as Ranked from './ranked.js';
import * as Online from './online.js';
import * as Usage from './usage.js';
import { refreshRankResult } from './rankedui.js';


/* ---------- flow ---------- */
const CAT_NAME = k => (CATS[k] ? CATS[k].name : k);
const upDown = e => `${e.up.map(CAT_NAME).join('、')}攻擊 ×${Market.EVENT_UP}，${CAT_NAME(e.down)} ×${Market.EVENT_DOWN}`;
function renderMarket() {
  const el = $('#market-label'); if (!el) return;
  const e = Market.current(), next = Market.nextTurn();
  el.hidden = !G.market;
  el.innerHTML = !G.market ? '' : e ? `<b>${esc(e.name)}</b><span>${esc(upDown(e))}</span>` : `<span>市場平穩 · 第 ${next} 回合起有市場事件</span>`;
}
/* ranked: the opponent's level follows your tier */
function setupRanked() {
  const o = Ranked.opponent();                           // the tier decides the opponent; your collection never does
  G.diff = DIFFS[o.diff]; G.foeBoost = o.block; G.deckList.c = cpuDeckList(o.diff, { grow: false, boost: o.boost }); G.deck.c = makeDeck(G.deckList.c);
  const rd = Ranked.deckForRanked(DECK);                 // over the point cap: a legal deck for this duel only
  G.deckList.p = rd.list; G.deck.p = makeDeck(rd.list); G.rankedAuto = rd.auto;
}
/* strategy: attacking with an attribute the opponent is weak in or the market favours; blocking with advantage when you could */
function trackPlay(mode, m, hand) {
  const P = G.perf; if (!P) return;
  if (mode === 'attack') { P.atk++; if ((G.foeProf && G.foeProf.weak.includes(m.cat)) || Market.attackMult(m.cat) > 1) P.smartAtk++; }
  else if (G.foeCard && hand.some(c => advOf(c.cat, G.foeCard.cat) > 1)) { P.defChances++; if (advOf(m.cat, G.foeCard.cat) > 1) P.smartDef++; }
}
const perfStats = () => ({ total: G.stats.total, correct: G.stats.correct, ...G.perf, lpLeft: G.lp.p / LP_MAX });

const NUDGE_DUELS = 3;                 // idle hints (suggested card) during a player's first few finished duels

/* saves from before the opponent profile existed simply get a new one */
const okProf = p => !!p && ['strong', 'weak'].every(k => Array.isArray(p[k]) && p[k].length === 2 && p[k].every(c => CATS[c]));
/* continue the saved duel exactly where it stopped (attack or defence phase) */
async function resumeDuel() {
  const d = readSave();
  if (!d) { Actions.renderTitle(); return; }
  if (G) G.over = true;
  setGame({ fsm: createMachine(), diff: DIFFS[d.diffKey] || DIFFS.normal, lp: d.lp, deck: d.deck, hand: d.hand, turn: d.turn, phase: 'idle', busy: false,
        used: new Set(d.used), streak: d.streak, maxStreak: d.maxStreak, history: d.history || [], startedAt: new Date(d.startedAt), endedAt: null, win: null,
        stats: d.stats, missed: d.missed || [], foeCard: d.foe ? MON[d.foe] : null, over: false, dealt: d.dealt || 0, taken: d.taken || 0,
        mods: { myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false, ...(d.mods || {}) }, flags: d.flags || {}, extraUsed: !!d.extraUsed, nbAdded: d.nbAdded || 0, bg: d.bg || BG.pick(),
        deckList: d.deckList && Array.isArray(d.deckList.p) ? d.deckList : null, weak: d.weak && CATS[d.weak] ? d.weak : null,
        mode: ['casual', 'ranked'].includes(d.mode) ? d.mode : 'casual', market: d.market && typeof d.market === 'object' ? d.market : null,
        perf: d.perf && typeof d.perf === 'object' ? d.perf : { atk: 0, smartAtk: 0, defChances: 0, smartDef: 0, maxHit: 0 },
        foeProf: okProf(d.foeProf) ? d.foeProf : foeProfile(), foeStats: d.foeStats && Number.isInteger(d.foeStats.t) ? d.foeStats : { t: 0, c: 0 }, foeBoost: typeof d.foeBoost === 'number' ? Math.min(0.3, Math.max(0, d.foeBoost)) : 0, kb: d.kb && typeof d.kb === 'object' ? d.kb : null });
  const g = G;
  reserveUids(Math.max(...[...d.deck.p, ...d.deck.c, ...d.hand.p, ...d.hand.c].map(i => i.uid)));
  show('duel'); BG.apply(G.bg); Sound.startBGM(); Sound.setDanger(G.lp.p < LP_MAX * 0.3); clearField('p'); clearField('c');
  $('#save-label').textContent = `讀取 ${fmtDate(new Date(d.savedAt))} 的紀錄`;
  setPhase('idle', '續戰', ''); renderAll(); renderMarket(); log('讀取上次的對戰紀錄…');
  G.fsm.go('resume');
  await transition('續戰', `繼續第 ${G.turn} 回合 · ${d.phase === 'defend' ? '對手攻擊中' : '我方攻擊'}`, 'gold');
  if (stale(g)) return;
  if (d.phase === 'defend') {
    placeField('c', G.foeCard);
    const atk = foeAtkOf(G.foeCard);
    log(`對手的 <b>【${esc(G.foeCard.name)}】</b> 正在攻擊，攻擊力 ${atk}。`);
    await sleep(500); if (stale(g)) return;
    G.fsm.go('defend');
    setPhase('defend', '防禦階段', `選一張卡抵擋 攻 ${atk} · 題目：${CATS[G.foeCard.cat].name}`);
  } else {
    log('繼續我方回合，選一張手牌召喚。');
    G.fsm.go('attack');
    setPhase('attack', '攻擊階段', G.extraUsed ? '當沖：再選一張卡攻擊' : '選擇要召喚的卡牌');
  }
}

/* opts.mode: 'casual' (default: chosen difficulty, no rank) | 'ranked' (difficulty from your tier, deck point cap,
   result scored) — the 新手場 is opts.tutorial, and is forced until the tutorial has been done once */
async function startDuel(opts = {}) {
  const forfeited = Ranked.forfeitIfActive();          // a ranked duel left unfinished counts as a loss
  newGame();
  const tutorial = !!opts.tutorial || !Tutor.done();
  G.mode = tutorial ? 'tutorial' : opts.mode === 'ranked' ? 'ranked' : 'casual';
  G.perf = { atk: 0, smartAtk: 0, defChances: 0, smartDef: 0, maxHit: 0 };
  G.fsm.go('intro');
  G.bg = BG.pick(); BG.apply(G.bg);
  if (tutorial) setupTutorial();
  else {
    Market.enable();
    G.kb = bonusLevels();                                 // 知識加成, fixed for this duel
    if (G.mode === 'ranked') {
      setupRanked(); Ranked.begin();
      if (Online.joined()) { const g = G; Online.startMatch().then(r => { if (r && !r.ok && g === G) log(`線上排行榜：${r.error}。這場只計入這台裝置。`); }); }
    }
  }
  Tutor.begin(tutorial); show('duel'); Sound.startBGM(); clearField('p'); clearField('c');
  log(tutorial ? `教學對戰：難度固定為簡易，只出初階題，對手資金 ${tutorialFoeLp()}。`
    : G.mode === 'ranked' ? `排位賽：${Ranked.tier().name}，對手「${Ranked.LEVEL_NAME[Ranked.tier().level]}」。從第 2 回合起每 3 回合發生一次市場事件。`
    : '雙方洗牌完畢。從第 2 回合起每 3 回合發生一次市場事件。');
  if (G.rankedAuto) toast(`這場排位賽自動使用符合上限的牌組（${Ranked.deckCost(G.deckList.p)} / ${Ranked.DECK_CAP} 點），你儲存的牌組沒有變動。`);
  if (forfeited) log(`上一場排位賽未完成，以敗場計（${forfeited.delta} 分）。`);
  setPhase('idle', '待機', ''); renderAll(); renderMarket();
  const g0 = G;
  await transition(G.mode === 'ranked' ? '排位對決' : '對決開始', G.mode === 'ranked' ? Ranked.tier().name : '雙方準備就緒', 'gold');
  if (stale(g0)) return;
  playerTurn();
}
async function playerTurn() {
  const g0 = G;
  if (stale(g0)) return;
  G.fsm.go('myTurn');
  G.turn++; G.extraUsed = false; draw('p'); draw('c'); renderAll();
  const ev = Market.onTurn(G.turn);
  if (ev) {
    renderMarket();
    await transition('市場事件', `${ev.name}：${upDown(ev)}`, 'gold'); if (stale(g0)) return;
    log(`<b>市場事件【${esc(ev.name)}】</b> ${esc(ev.why)} ${upDown(ev)}（雙方適用，持續 ${Market.EVERY} 回合）`);
    Tutor.tip('market');
  }
  if (G.mods.skipMe) {
    G.mods.skipMe = false;
    await transition('我方回合', `第 ${G.turn} 回合 · 漲停鎖死，無法攻擊`, 'ally');
    log('我方被【漲停鎖死】，跳過本次攻擊。'); await sleep(700);
    return cpuTurn();
  }
  Sound.setMood('ally');
  await transition('我方回合', `第 ${G.turn} 回合 · 我方攻擊`, 'ally');
  if (stale(g0)) return;
  await Tutor.onPhase('attack', { suggestUid: suggestCard('attack') });
  if (stale(g0)) return;
  log('選一張手牌召喚，答對題目即可攻擊。' + (G.mods.myAtk ? ` 本次攻擊 ${G.mods.myAtk > 0 ? '+' : ''}${G.mods.myAtk}。` : ''));
  G.fsm.go('attack');
  setPhase('attack', '攻擊階段', '選擇要召喚的卡牌');
  if (!Tutor.active && RECS.length < NUDGE_DUELS) Tutor.nudge(suggestCard('attack'), '不知道出哪張？攻擊力越高，答對時傷害越大；發光的這張是目前攻擊力最高的卡。', () => G === g0 && G.phase === 'attack' && !G.busy);
  if (matchMedia('(hover: none)').matches) Tutor.tip('longpress');
  if (G.weak && G.hand.p.some(i => MON[i.id].cat === G.weak)) Tutor.tip('weak');
}
async function cpuTurn() {
  const g0 = G;
  if (stale(g0)) return;
  G.fsm.go('foeTurn');
  setPhase('idle', '對手回合', '');
  if (G.mods.skipFoe) {
    G.mods.skipFoe = false;
    await transition('對手回合', `第 ${G.turn} 回合 · 漲停鎖死，無法攻擊`, 'foe');
    log('對手被【漲停鎖死】，跳過本次攻擊。'); await sleep(700);
    return playerTurn();
  }
  Sound.setMood('foe');
  await transition('對手回合', `第 ${G.turn} 回合 · 對手攻擊`, 'foe');
  if (stale(g0)) return;
  if (!G.hand.c.length) draw('c');
  const idx = cpuPick();
  const inst = G.hand.c.splice(idx, 1)[0];
  const m = MON[inst.id]; G.foeCard = m;
  const atk = foeAtkOf(m);
  renderHands(); placeField('c', m);
  log(`對手召喚 <b>【${esc(m.name)}】</b>，攻擊力 ${atk}${G.diff.foeMult !== 1 ? `（卡面 ${m.atk} × ${G.diff.foeMult}）` : ''}${G.mods.foeAtk ? `（追繳 ${G.mods.foeAtk}）` : ''}！${SKILLS[m.id].hit ? ` 技能【${SKILLS[m.id].name}】：${SKILLS[m.id].text}` : ''}${G.weak === m.cat && diffKeyOf(G.diff) !== 'easy' ? ' 對手瞄準了你的弱項！' : ''}`);
  await sleep(500);
  if (!G.hand.p.length) draw('p');
  const tutSuggest = ensureAdvantage(m);                 // tutorial: the first defence always has a 相剋 card
  G.fsm.go('defend');
  setPhase('defend', '防禦階段', `選一張卡抵擋 攻 ${atk} · 題目：${CATS[m.cat].name}`);
  Tutor.onPhase('defend', { suggestUid: tutSuggest ?? suggestCard('defend') });
  if (!Tutor.active && RECS.length < NUDGE_DUELS) Tutor.nudge(suggestCard('defend'), '不知道選哪張？選守備力高的卡；標著「相剋 ×1.5」的卡守備力更高。', () => G === g0 && G.phase === 'defend' && !G.busy);
  if (G.hand.p.some(i => advOf(MON[i.id].cat, m.cat) !== 1)) Tutor.tip('adv');
}
async function onPlay(uid) {
  if (G.busy || (G.phase !== 'attack' && G.phase !== 'defend')) return;
  const idx = G.hand.p.findIndex(i => i.uid === uid); if (idx < 0) return;
  G.busy = true;
  Tutor.onPlay(G.phase);
  Sound.select();
  const handBefore = G.hand.p.map(i => MON[i.id]);
  const m = MON[G.hand.p.splice(idx, 1)[0].id];
  const mode = G.phase;
  trackPlay(mode, m, handBefore); G.fsm.go(mode === 'attack' ? 'attackQuiz' : 'defendQuiz'); setPhase('busy', mode === 'attack' ? '攻擊階段' : '防禦階段', '');
  placeField('p', m);
  log(mode === 'attack' ? `召喚 <b>【${esc(m.name)}】</b>！` : `以 <b>【${esc(m.name)}】</b> 守備表示迎擊！`);
  await sleep(650);
  if (mode === 'attack') await resolveAttack(m); else await resolveDefend(m, G.foeCard);
  G.busy = false;
  if (G.phase === 'attack' || G.phase === 'defend') renderHands();
}
async function resolveAttack(m) {
  const g = G;
  const r = await ask(m, 'attack');
  if (stale(g)) return;
  G.fsm.go('attackResolve');
  let extra = false;
  if (r.correct) {
    const out = attackHit(m, r);
    if (out.fired) await skillFX('p', m);
    let blk = foeBlock(m, out.dmg);
    if (blk && tutorialFoeMiss() && blk.ok) { blk = { ...blk, ok: false, dmg: out.dmg }; G.foeStats.c--; }   // tutorial: the first block misses
    if (blk) {
      renderHands(); placeField('c', blk.card);
      const advTxt = blk.adv > 1 ? `，${CATS[blk.card.cat].name}剋${CATS[m.cat].name}，守備 ×${blk.adv}` : blk.adv < 1 ? `，被${CATS[m.cat].name}剋制，守備 ×${blk.adv}` : '';
      log(`對手以 <b>【${esc(blk.card.name)}】</b> 防禦（守備 ${blk.def}${advTxt}）…`);
      Tutor.tip('foeBlock');
      await sleep(500); if (stale(g)) return;
      await showFoeAnswer(foeQuestion(m.cat, m.rank), blk, m); if (stale(g)) return;
      floatText($('#slot-c'), blk.ok ? '對手答對' : '對手答錯', 'small');
      await sleep(400);
    }
    log(`<b>【${esc(m.name)}】</b> 發動攻擊！`);
    await lunge('p');
    const dealt = blk ? blk.dmg : out.dmg;
    if (dealt > 0) await damage('c', dealt, blk && blk.ok ? [...out.tags, `擋下 ${out.dmg - dealt}`] : out.tags);
    else { floatText($('#slot-c'), '完全防禦', 'small'); await sleep(400); }
    if (blk && blk.reflect) { await damage('p', blk.reflect, ['反射']); }
    if (out.heal) await heal('p', out.heal);
    log(blk && blk.ok ? `對手擋下部分攻擊，造成 <b>${dealt}</b> 點傷害${blk.reflect ? `，並反彈 <b>${blk.reflect}</b> 點` : ''}。` : `造成 <b>${dealt}</b> 點傷害。`);
    if (blk) { await sleep(250); clearField('c'); }
    extra = out.extra;
  } else {
    const out = attackMiss(m);
    if (out.fired) await skillFX('p', m);
    if (out.dmg > 0) { await lunge('p'); await damage('c', out.dmg, ['失敗仍命中']); log(`攻擊失敗，但仍造成 <b>${out.dmg}</b> 點傷害。`); }
    else log(`答錯了，<b>【${esc(m.name)}】</b> 攻擊失敗被送入墓地。`);
    await shatter('p');
    if (out.backlash) { await damage('p', out.backlash, ['反噬']); log(`槓桿反噬，我方承受 <b>${out.backlash}</b> 點傷害。`); }
    if (out.heal) await heal('p', out.heal);
  }
  await sleep(350); clearField('p');
  if (await checkEnd()) return;
  if (extra && G.hand.p.length) {
    G.extraUsed = true;
    log('【當沖】發動，本回合可以再出一張牌攻擊。');
    G.fsm.go('attack');
    setPhase('attack', '攻擊階段', '當沖：再選一張卡攻擊');
    return;
  }
  cpuTurn();
}
async function resolveDefend(m, foe) {
  const g = G;
  const r = await ask(m, 'defend', foe);
  if (stale(g)) return;
  G.fsm.go('defendResolve');
  const s = defendSetup(m, foe);
  let announced = false;
  if (s.defBonus) { await skillFX('p', m); announced = true; floatText($('#slot-p'), `守備 +${s.defBonus}`, 'small'); }
  if (s.adv !== 1) { floatText($('#slot-p'), s.adv > 1 ? `相剋 守備 ×${s.adv}` : `被剋 守備 ×${s.adv}`, 'small'); log(s.adv > 1 ? `${CATS[m.cat].name}剋制${CATS[foe.cat].name}，守備力提升為 <b>${s.def}</b>。` : `${CATS[foe.cat].name}剋制${CATS[m.cat].name}，守備力降為 <b>${s.def}</b>。`); await sleep(500); }
  await lunge('c');
  if (r.correct) {
    const out = defendOk(m, s, r);
    if (out.fired && !announced) await skillFX('p', m);
    if (out.pierce > 0) { log(`擋下部分攻擊，貫通 <b>${out.pierce}</b> 點。`); await damage('p', out.pierce, ['貫通', ...s.atkTags]); }
    else if (out.reflect > 0) { log(`完美防禦！反彈 <b>${out.reflect}</b> 點。`); floatText($('#slot-p'), '完全防禦', 'small'); await damage('c', out.reflect, ['反射']); }
    else { log('攻守相抵，完全防禦！'); floatText($('#slot-p'), '完全防禦', 'small'); await sleep(500); }
    if (out.heal) await heal('p', out.heal);
  } else {
    const out = defendFail(m, foe, s);
    if (out.foeFired) await skillFX('c', foe);
    if (out.fired && !announced) await skillFX('p', m);
    log(`防禦失敗，承受 <b>${out.dmg}</b> 點直擊。`);
    await shatter('p'); await damage('p', out.dmg, ['直擊', ...s.atkTags]);
    if (out.foeHeal) await heal('c', out.foeHeal);
  }
  await sleep(350); clearField('p'); clearField('c'); G.foeCard = null;
  if (await checkEnd()) return;
  playerTurn();
}
async function checkEnd() {
  if (G.lp.c > 0 && G.lp.p > 0) return false;
  G.fsm.go('over');
  G.over = true; const win = G.lp.c <= 0; G.win = win; G.endedAt = new Date(); clearSave(); Tutor.end();
  recordGame(false); Usage.duel(G.mode, win);
  if (win) { const w = onDuelWin(); G.shardsWon = w.shards; G.knowWon = w.card; }   // shards, and the day's first win draws a knowledge card
  if (G.mode === 'ranked') {
    G.perfResult = Ranked.performance(perfStats()); G.rank = Ranked.applyMatch(win, G.perfResult.score);
    if (Online.joined()) {                                 // the server scores it again; its answer replaces ours
      const g = G; g.online = { pending: true };
      Online.endMatch({ win, perf: g.perfResult }).then(r => {
        g.online = r || { ok: false, error: '這場開始時沒有連上排行榜，只計入這台裝置' };
        if (r && r.ok) g.rank = { ...g.rank, delta: r.delta, before: r.before, after: r.after, tierBefore: r.tierBefore, tierAfter: r.tierAfter, shielded: r.shielded, promoted: r.promoted, demoted: r.demoted };
        refreshRankResult(g);
      });
    }
  }
  if (win && !COL.pending) { COL.pending = rewardOffer(diffKeyOf(G.diff)); colSave(); }
  setPhase('idle', win ? '勝利' : '敗北', '');
  Sound.stopBGM();
  await sleep(300);
  Sound.jingle(win);
  await transition(win ? '勝利' : '敗北', win ? '對手資金歸零' : '我方資金歸零', win ? 'gold' : 'lose');
  renderResult(win); show('result');
  return true;
}

export function init() { register({ startDuel, resumeDuel }); }

export { checkEnd, cpuTurn, onPlay, playerTurn, renderMarket, resolveAttack, resolveDefend, resumeDuel, startDuel };
