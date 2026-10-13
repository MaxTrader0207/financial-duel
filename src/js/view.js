// view.js — switching screens, the full-screen turn transition (「我方回合」…) and short toasts.
// Everything that moves between screens uses these; they import no game module.
import { BG } from './backgrounds.js';
import { $, RM, SET, sleep } from './core.js';
import { Sound } from './sound.js';

const SCREENS = ['title', 'duel', 'result', 'bank', 'dex', 'notebook', 'record', 'deck', 'daily', 'know', 'ranked', 'board', 'challenge'];
let T;                                    // #trans, the transition overlay

function show(name) { SCREENS.forEach(s => $('#scr-' + s).hidden = s !== name); const fq = $('#foe-quiz'); if (fq) { fq.hidden = true; fq.classList.remove('on'); } window.scrollTo(0, 0); if (name !== 'duel' && name !== 'result' && BG) BG.clear(); }

/* a full-screen banner between turns; resolves when it has gone */
async function transition(main, sub, tone = 'ally') {
  T.dataset.tone = tone; T.classList.toggle('final', main === '勝利' || main === '敗北'); $('#t-main').textContent = main; $('#t-sub').textContent = sub;
  T.hidden = false;
  Sound.trans(tone);
  const a = T.querySelector('.t-a'), b = T.querySelector('.t-b'), s = T.querySelector('.t-slash');
  const tm = $('#t-main'), ts = $('#t-sub');
  if (RM || SET.fast) {
    T.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });
    [a, b].forEach(el => el.style.transform = 'translateX(0) skewY(-7deg)');
    tm.style.opacity = 1; ts.style.opacity = 1;
    await sleep(T.classList.contains('final') ? 1400 : 700);
    T.getAnimations().forEach(an => an.cancel());
    a.style.transform = b.style.transform = ''; tm.style.opacity = ts.style.opacity = '';
    T.hidden = true; return;
  }
  const ease = 'cubic-bezier(.75,0,.2,1)';
  const opt = (d, delay = 0) => ({ duration: d, delay, easing: ease, fill: 'forwards' });
  const inA = a.animate([{ transform: 'translateX(-110%) skewY(-7deg)' }, { transform: 'translateX(0) skewY(-7deg)' }], opt(360));
  b.animate([{ transform: 'translateX(110%) skewY(-7deg)' }, { transform: 'translateX(0) skewY(-7deg)' }], opt(360, 40));
  await inA.finished;
  s.animate([{ transform: 'translateY(-50%) skewY(-7deg) scaleX(0)', opacity: 1 }, { transform: 'translateY(-50%) skewY(-7deg) scaleX(1)', opacity: 1, offset: .6 }, { transform: 'translateY(-50%) skewY(-7deg) scaleX(1)', opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' });
  tm.animate([{ opacity: 0, transform: 'scale(1.7)', letterSpacing: '.4em', filter: 'blur(6px)' }, { opacity: 1, transform: 'scale(1)', letterSpacing: '.06em', filter: 'blur(0)' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.2,1.2)', fill: 'forwards' });
  ts.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 180, fill: 'forwards' });
  await sleep(1050);
  tm.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(60px) skewX(-12deg)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
  ts.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  const outA = a.animate([{ transform: 'translateX(0) skewY(-7deg)' }, { transform: 'translateX(110%) skewY(-7deg)' }], opt(340, 120));
  b.animate([{ transform: 'translateX(0) skewY(-7deg)' }, { transform: 'translateX(-110%) skewY(-7deg)' }], opt(340, 150));
  await outA.finished; await sleep(60);
  T.getAnimations({ subtree: true }).forEach(an => an.cancel());
  T.hidden = true;
}

function toast(msg, ms = 6000) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}

export function init() { T = $('#trans'); }

export { SCREENS, T, show, toast, transition };
