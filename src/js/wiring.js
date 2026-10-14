// wiring.js — event wiring for buttons, keyboard shortcuts, long-press card zoom and card tilt.
import * as Ranked from './ranked.js';
import * as Online from './online.js';
import * as Usage from './usage.js';
import { renderBank } from './bankui.js';
import { CATS, MON, RARITY, RARITY_FULL, cardHTML } from './cards.js';
import { owns } from './collection.js';
import { $, DIFF_KEY, RM, setDiffKey, diffKey, esc, foeAtkOf } from './core.js';
import { renderReports } from './feedback.js';
import { onPlay, startDuel } from './flow.js';
import { endReview, renderNotebook, startReview } from './notebook.js';
import { setQuizState, quizState } from './quiz.js';
import { recordGame } from './records.js';
import { ADV_WHY, BEATS, WEAK_MULT, advOf } from './rules.js';
import { clearSave, saveGame } from './save.js';
import { setDexCat, renderDex, renderTitle } from './screens.js';
import { T, show, toast } from './view.js';
import { SKILLS } from './skills.js';
import { Sound } from './sound.js';
import { G } from './game.js';
import { Tutor } from './tutor.js';

let tipDefault, LP_MS, lpTimer, lpStart, lpSuppress, lpCancel, quitArmed, tiltEl, resetTilt, muteBtn, syncMute;

function openZoom(m, uid) {
  const sk = SKILLS[m.id], rar = RARITY[m.rank];
  $('#zoom-art').innerHTML = cardHTML(m);
  $('#zoom-name').textContent = m.name;
  $('#zoom-meta').textContent = `${CATS[m.cat].name} · ${RARITY_FULL[rar]} ${'◆'.repeat(m.rank)} · ${m.race}${owns(m.id) ? '' : ' · 未收集'}`;
  $('#zoom-stats').innerHTML = `<span>攻 ${m.atk}</span><span>守 ${m.def}</span>`;
  $('#zoom-sk').innerHTML = `<b>【${esc(sk.name)}】</b>${esc(sk.text)}`;
  $('#zoom-fl').textContent = m.text;
  const notes = [];
  const inHand = uid != null && G && !G.over && G.hand.p.some(i => i.uid === uid);
  if (inHand && G.phase === 'defend' && G.foeCard) {
    const a = advOf(m.cat, G.foeCard.cat), f = G.foeCard;
    if (a > 1) notes.push(`<div class="note">相剋：${CATS[m.cat].name}剋${CATS[f.cat].name}，防禦時守備力 ×${a}（${ADV_WHY[m.cat]}）</div>`);
    else if (a < 1) notes.push(`<div class="note bad">被剋：${CATS[f.cat].name}剋${CATS[m.cat].name}，防禦時守備力 ×${a}</div>`);
    notes.push(`<div class="note">防禦題目出 ${CATS[f.cat].name}；對手實際攻擊 ${foeAtkOf(f)}</div>`);
  } else if (inHand && G.phase === 'attack') {
    notes.push(`<div class="note">攻擊題目出 ${CATS[m.cat].name}${G.weak === m.cat ? `；弱項加成，答對傷害 ×${WEAK_MULT}` : ''}</div>`);
  } else {
    const beats = BEATS[m.cat], by = Object.keys(BEATS).find(k => BEATS[k] === m.cat);
    notes.push(`<div class="note">相剋：剋 ${CATS[beats].name}，被 ${CATS[by].name} 剋</div>`);
  }
  $('#zoom-notes').innerHTML = notes.join('');
  const play = $('#zoom-play'), canPlay = inHand && (G.phase === 'attack' || G.phase === 'defend') && !G.busy;
  play.hidden = !canPlay; play.textContent = G && G.phase === 'defend' ? '用這張防禦' : '出這張牌';
  play.onclick = () => { closeZoom(); onPlay(uid); };
  $('#zoom').hidden = false; Sound.open();
  $('#zoom-close').focus({ preventScroll: true });
}
function closeZoom() { $('#zoom').hidden = true; }
function cardFromTarget(t) {
  if (!t.closest || t.closest('#zoom')) return null;
  const hc = t.closest('.hand-card');
  if (hc) { const inst = G && G.hand.p.find(i => i.uid === Number(hc.dataset.uid)); return inst ? { m: MON[inst.id], uid: inst.uid } : null; }
  const c = t.closest('.card[data-id]');
  return c && MON[c.dataset.id] ? { m: MON[c.dataset.id], uid: null } : null;
}

export function init() {
/* ---------- wiring ---------- */
$('#hand').addEventListener('click', e => { const b = e.target.closest('.hand-card'); if (b && !b.disabled) onPlay(Number(b.dataset.uid)); });
$('#btn-start').onclick = () => startDuel();
$('#btn-bank').onclick = () => { renderBank(); renderReports(); show('bank'); };
$('#btn-dex').onclick = () => { renderDex(); show('dex'); };
$('#btn-nb').onclick = () => { renderNotebook(); show('notebook'); };
$('#nb-due').onclick = () => { renderNotebook(); show('notebook'); startReview(false, 'all'); };   // 標題的到期提醒：直接開始複習
$('#btn-nb-back').onclick = () => { endReview(); renderTitle(); show('title'); };
$('#btn-save').onclick = () => {
  if (!G || G.busy || (G.phase !== 'attack' && G.phase !== 'defend')) return;
  if (!saveGame()) return;
  G.over = true; Sound.stopBGM(); renderTitle(); show('title');
};
$('#btn-dex-back').onclick = () => { renderTitle(); show('title'); };
$('#dex-filter').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) { setDexCat(b.dataset.k); renderDex(); } });
tipDefault = matchMedia('(hover: none)').matches ? '長按卡牌可以放大查看技能。' : '將游標移到手牌上，可以查看卡牌技能；長按可放大。';
$('#skill-tip').textContent = tipDefault;
/* long-press any card to open an enlarged view with its skill (main way to read skills on phones) */
LP_MS = 450;
lpTimer = 0;
lpStart = null;
lpSuppress = 0;
$('#zoom-close').onclick = closeZoom;
$('#zoom').addEventListener('click', e => { if (e.target.id === 'zoom') closeZoom(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#zoom').hidden) closeZoom(); });
document.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  const hit = cardFromTarget(e.target); if (!hit) return;
  clearTimeout(lpTimer); lpStart = { x: e.clientX, y: e.clientY };
  lpTimer = setTimeout(() => { lpTimer = 0; lpSuppress = Date.now(); try { navigator.vibrate?.(12); } catch (err) {} openZoom(hit.m, hit.uid); }, LP_MS);
});
lpCancel = () => { clearTimeout(lpTimer); lpTimer = 0; };
document.addEventListener('pointermove', e => { if (lpTimer && lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 10) lpCancel(); }, { passive: true });
['pointerup', 'pointercancel', 'scroll'].forEach(ev => document.addEventListener(ev, lpCancel, { passive: true, capture: true }));
/* the click that ends a long-press must not also play or pick the card */
document.addEventListener('click', e => { if (lpSuppress && Date.now() - lpSuppress < 800) { lpSuppress = 0; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', e => { if (cardFromTarget(e.target)) e.preventDefault(); });
$('#hand').addEventListener('mouseover', e => {
  const b = e.target.closest('.hand-card'); if (!b) return;
  const inst = G && G.hand.p.find(i => i.uid === Number(b.dataset.uid)); if (!inst) return;
  const m = MON[inst.id], sk = SKILLS[m.id];
  $('#skill-tip').innerHTML = `${esc(m.name)}　<b>【${esc(sk.name)}】</b>${esc(sk.text)}`;
});
$('#hand').addEventListener('mouseleave', () => { $('#skill-tip').textContent = tipDefault; });
$('#btn-bank-back').onclick = () => { renderTitle(); show('title'); };
quitArmed = 0;
$('#btn-quit').onclick = () => {
  const b = $('#btn-quit');
  if (!quitArmed) { b.textContent = '確定投降？再按一次'; quitArmed = setTimeout(() => { quitArmed = 0; b.textContent = '投降回標題'; }, 3000); return; }
  clearTimeout(quitArmed); quitArmed = 0; b.textContent = '投降回標題';
  if (G && !G.over) { G.endedAt = new Date(); G.win = false; recordGame(true); Usage.duel(G.mode, false);
    if (G.mode === 'ranked') { const r = Ranked.applyMatch(false, 0); toast(`排位賽投降：${r.delta} 分`); Online.endMatch({ surrender: true }); } }
  if (G) G.over = true; Tutor.end(false); clearSave(); quizState?.cancel?.(); Sound.stopBGM(); $('#quiz').hidden = true; setQuizState(null); T.hidden = true; renderTitle(); show('title');
};
/* 3D tilt + foil follow the pointer on hand, quiz and title cards */
tiltEl = null;
resetTilt = el => { el.classList.remove('tilting'); ['--rx', '--ry', '--mx', '--my'].forEach(p => el.style.removeProperty(p)); };
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || document.documentElement.classList.contains('fx-lite')) return;
  const el = e.target.closest ? e.target.closest('.hand .card, .q-cards .card, .fan .card') : null;
  if (tiltEl && tiltEl !== el) { resetTilt(tiltEl); tiltEl = null; }
  if (!el) return;
  tiltEl = el;
  const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.classList.add('tilting');
  el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  if (!RM) { el.style.setProperty('--rx', ((0.5 - py) * 16).toFixed(2) + 'deg'); el.style.setProperty('--ry', ((px - 0.5) * 20).toFixed(2) + 'deg'); }
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { if (tiltEl) { resetTilt(tiltEl); tiltEl = null; } });

muteBtn = $('#btn-mute');
syncMute = () => { muteBtn.setAttribute('aria-pressed', Sound.muted ? 'true' : 'false'); $('#mute-label').textContent = Sound.muted ? '音效 關' : '音效 開'; };
muteBtn.onclick = () => { Sound.setMuted(!Sound.muted); syncMute(); };
document.addEventListener('keydown', e => {
  if ((e.key === 'm' || e.key === 'M') && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) { Sound.setMuted(!Sound.muted); syncMute(); }
});
syncMute();
document.querySelectorAll('#diff input').forEach(inp => {
  inp.checked = inp.value === diffKey;
  inp.addEventListener('change', () => { if (!inp.checked) return; setDiffKey(inp.value); try { localStorage.setItem(DIFF_KEY, diffKey); } catch (e) {} });
});
}

export { LP_MS, cardFromTarget, closeZoom, lpCancel, lpStart, lpSuppress, lpTimer, muteBtn, openZoom, quitArmed, resetTilt, syncMute, tiltEl, tipDefault };
