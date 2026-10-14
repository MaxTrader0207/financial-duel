// board.js — drawing the duel table: the hand (with weak / advantage tags), money bars, the opponent's profile,
// turn and streak labels, and the phase banner. Setting an attack or defence phase also autosaves the duel.
import { CATS, MON, backHTML, cardHTML } from './cards.js';
import { $, LP_MAX, esc } from './core.js';
import { G } from './game.js';
import { attackMult } from './market.js';
import { eventMult } from './kbonus.js';
import { WEAK_MULT, advOf } from './rules.js';
import { saveGame } from './save.js';
import { SKILLS } from './skills.js';
import { provide } from './ui.js';

function handTag(m) {
  const foe = G.phase === 'defend' && G.foeCard;
  if (foe) { const a = advOf(m.cat, foe.cat); return a === 1 ? '' : `<span class="tag-adv${a < 1 ? ' bad' : ''}">${a > 1 ? '相剋' : '被剋'} ×${a}</span>`; }
  if (G.phase !== 'attack') return '';
  if (G.weak && m.cat === G.weak) return `<span class="tag-weak">弱項 ×${WEAK_MULT}</span>`;
  if (G.foeProf && G.foeProf.weak.includes(m.cat)) return '<span class="tag-adv tag-foe">對手不擅長</span>';
  const em = +eventMult(G.kb, attackMult(m.cat)).toFixed(2);
  if (em !== 1) return `<span class="tag-adv tag-mkt${em < 1 ? ' bad' : ''}">事件 ×${em}</span>`;
  return '';
}
function renderHands() {
  const enabled = (G.phase === 'attack' || G.phase === 'defend') && !G.busy;
  $('#hand').innerHTML = G.hand.p.map(inst => { const m = MON[inst.id], sk = SKILLS[m.id];
    return `<button class="hand-card" type="button" data-uid="${inst.uid}" title="${esc(m.name)}【${esc(sk.name)}】${esc(sk.text)}" ${enabled ? '' : 'disabled'}>${cardHTML(m)}<span class="hand-badge" style="--cc:${CATS[m.cat].color}" aria-hidden="true">${CATS[m.cat].badge}</span>${handTag(m)}</button>`; }).join('');
  $('#cpu-hand').innerHTML = G.hand.c.map(() => backHTML()).join('');
  $('#deck-p').textContent = `牌組 ${G.deck.p.length}`;
  $('#deck-c').textContent = `牌組 ${G.deck.c.length}`;
  $('#duel').classList.toggle('phase-attack', G.phase === 'attack');
  $('#duel').classList.toggle('phase-defend', G.phase === 'defend');
}
function renderLP(side, val) { $('#lp-' + side).textContent = Math.max(0, Math.round(val)); $('#lpf-' + side).style.width = (Math.max(0, val) / LP_MAX * 100) + '%'; }
/* the opponent's strong / weak attributes for this duel (its block accuracy is ± in those) */
function renderFoeProf() {
  const el = $('#foe-prof'); if (!el) return;
  const p = G.foeProf; if (!p) { el.textContent = ''; return; }
  const nm = k => CATS[k] ? CATS[k].name : k;
  el.innerHTML = `<span>擅長 <b>${p.strong.map(nm).join('、')}</b></span><span>不擅長 <b class="w">${p.weak.map(nm).join('、')}</b></span>`;
}
function renderStreak() { $('#streak-label').textContent = G.streak >= 2 ? `連續答對 ${G.streak}${G.streak >= 3 ? ' · 連鎖加成中' : ''}` : ''; }
function renderAll() { renderHands(); renderFoeProf(); renderLP('p', G.lp.p); renderLP('c', G.lp.c); $('#turn-label').textContent = `第 ${G.turn} 回合 · ${G.diff.name}`; renderStreak(); }
function setPhase(p, tag, msg) {
  G.phase = p; $('#phase-tag').textContent = tag; $('#phase-msg').textContent = msg;
  $('#phase').classList.toggle('def', p === 'defend'); renderHands();
  const ready = p === 'attack' || p === 'defend';
  $('#btn-save').disabled = !ready;
  $('#btn-save').textContent = ready ? '記錄並退出' : '行動中…';
  if (ready) saveGame();
}

export function init() { provide({ renderHands, renderLP }); }

export { renderAll, renderFoeProf, renderHands, renderLP, renderStreak, setPhase };
