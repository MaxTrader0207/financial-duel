// playtime.js — play-time care: the 30-minute reminder and the forced 2-hour rest after an hour (saving the duel first).
import { $, Store, isObj } from './core.js';
import { quizState } from './quiz.js';
import { pad2 } from './report.js';
import { readSave, saveGame } from './save.js';
import { renderTitle } from './screens.js';
import { T, show, toast } from './view.js';
import { Sound } from './sound.js';
import { G } from './game.js';

let PT_KEY, PT_REMIND, PT_WARN, PT_LIMIT, PT_REST, PT_GAP_RESET, PT_V, PT, ptSave, ptReset, fmtClock, ptSafePoint;

function ptLabel() {
  const min = Math.floor(PT.acc / 60), el = $('#pt-label');
  if (el) { el.textContent = `連續遊玩 ${min} 分`; el.classList.toggle('warn', PT.acc >= PT_WARN); }
}
function showCare() {
  $('#care-msg').textContent = `你已經連續遊玩 ${Math.floor(PT.acc / 60)} 分鐘了，休息一下再繼續吧。`;
  const inDuel = G && !G.over;
  $('#care-rest').textContent = inDuel ? '記錄並休息' : '先休息一下';
  $('#care').hidden = false; Sound.duck(true); Sound.open();
  $('#care-ok').focus({ preventScroll: true });
}
function showRest() {
  const saved = $('#rest').dataset.saved === '1';
  $('#rest').hidden = false; $('#rest-done').hidden = true;
  const until = new Date(PT.lockUntil);
  $('#rest-until').textContent = `${pad2(until.getHours())}:${pad2(until.getMinutes())} 之後可以再次遊玩`;
  $('#rest-saved').textContent = saved ? '進行中的對戰已自動記錄，休息後可以在標題畫面繼續。' : (readSave() ? '你有一筆未完成的對戰紀錄，休息後可以繼續。' : '');
  ptRestTick();
}
function ptRestTick() {
  const left = PT.lockUntil - Date.now();
  $('#rest-clock').textContent = fmtClock(left);
  if (left <= 0) { $('#rest-clock').textContent = '0:00:00'; $('#rest-done').hidden = false; $('#rest-until').textContent = '休息結束，歡迎回來。'; }
}
function startRest() {
  let saved = false;
  if (G && !G.over) { saved = saveGame(); G.over = true; }
  Sound.stopBGM(); quizState?.cancel?.(); $('#quiz').hidden = true; $('#care').hidden = true;
  PT.lockUntil = Date.now() + PT_REST; PT.acc = 0; ptSave();
  $('#rest').dataset.saved = saved ? '1' : '';
  renderTitle(); show('title'); showRest();
}
function ptTick() {
  const now = Date.now();
  if (PT.lockUntil) {
    if ($('#rest').hidden) showRest();
    ptRestTick(); return;
  }
  if (document.visibilityState !== 'visible') return;
  if (now - PT.last > PT_GAP_RESET) ptReset();
  PT.acc += Math.min(now - PT.last, 10000) / 1000; PT.last = now;
  ptSave(); ptLabel();
  if (!ptSafePoint()) return;
  if (PT.acc >= PT_LIMIT) return startRest();
  if (PT.acc >= PT_WARN && !PT.warned) { PT.warned = true; ptSave(); toast('再過 5 分鐘將進入 2 小時的強制休息，對戰會自動記錄。'); return; }
  if (PT.acc >= PT_REMIND && !PT.reminded) { PT.reminded = true; ptSave(); showCare(); }
}

export function init() {
/* ---------- play-time care ---------- */
PT_KEY = 'soba-ketto.playtime.v1';
PT_REMIND = 30 * 60;
PT_WARN = 55 * 60;
PT_LIMIT = 60 * 60;
   // seconds of visible play
PT_REST = 2 * 60 * 60 * 1000;
PT_GAP_RESET = 15 * 60 * 1000;
 // a 15-minute absence starts a new session
PT_V = 1;
PT = Store.load(PT_KEY, { version: PT_V, fallback: () => ({}), validate: isObj });
PT = { acc: 0, last: 0, reminded: false, warned: false, lockUntil: 0, ...PT };
ptSave = () => Store.trySave(PT_KEY, PT_V, PT);
ptReset = () => { PT.acc = 0; PT.reminded = false; PT.warned = false; PT.last = Date.now(); };
fmtClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}:${pad2(Math.floor(s % 3600 / 60))}:${pad2(s % 60)}`; };
ptSafePoint = () => $('#quiz').hidden && T.hidden && $('#care').hidden &&
  (!G || G.over || (!G.busy && (G.phase === 'attack' || G.phase === 'defend')));
$('#care-ok').onclick = () => { $('#care').hidden = true; Sound.duck(false); };
$('#care-rest').onclick = () => {
  $('#care').hidden = true; Sound.duck(false);
  if (G && !G.over && saveGame()) { G.over = true; Sound.stopBGM(); }
  renderTitle(); show('title'); toast('對戰已記錄。休息回來後，可以在標題畫面繼續。');
};
$('#rest-done').onclick = () => { PT.lockUntil = 0; ptReset(); ptSave(); $('#rest').hidden = true; $('#rest').dataset.saved = ''; ptLabel(); renderTitle(); show('title'); };
(() => {
  const now = Date.now();
  if (PT.lockUntil && now < PT.lockUntil) { showRest(); }
  else { if (PT.lockUntil) PT.lockUntil = 0; if (!PT.last || now - PT.last > PT_GAP_RESET) ptReset(); else PT.last = now; ptSave(); }
  ptLabel();
  setInterval(ptTick, 5000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (Date.now() - PT.last > PT_GAP_RESET && !PT.lockUntil) ptReset(); else PT.last = Math.max(PT.last, Date.now() - 10000); } });
  document.addEventListener('keydown', e => { if (!$('#rest').hidden) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
})();
renderTitle();
}

export { PT, PT_GAP_RESET, PT_KEY, PT_LIMIT, PT_REMIND, PT_REST, PT_V, PT_WARN, fmtClock, ptLabel, ptReset, ptRestTick, ptSafePoint, ptSave, ptTick, showCare, showRest, startRest };
