// fx.js — duel animations and feedback: summon, attack, damage numbers, money bars, the log line.
import { CATS, cardHTML } from './cards.js';
import { $, AD, LP_MAX, RM, sleep } from './core.js';
import { Sound } from './sound.js';
import { G } from './game.js';
import { provide } from './ui.js';
import { renderLP } from './board.js';


function log(html) { $('#log').innerHTML = html; }

function placeField(side, m) {
  const slot = $('#slot-' + side);
  slot.innerHTML = cardHTML(m);
  Sound.summon();
  const el = slot.firstElementChild;
  summonFX(slot, m);
  if (!RM) el.animate([{ transform: `translateY(${side === 'p' ? 60 : -60}px) scale(.55) rotateY(80deg)`, filter: 'brightness(3)', opacity: 0 },
                       { transform: 'scale(1.1)', filter: 'brightness(1.6)', opacity: 1, offset: .6 },
                       { transform: 'none', filter: 'none', opacity: 1 }], { duration: AD(520), easing: 'cubic-bezier(.2,.8,.2,1)' });
}
function fxLayer(slot, color) { const d = document.createElement('div'); d.className = 'fx'; d.style.setProperty('--fc', color); slot.appendChild(d); return d; }
function fxEl(parent, cls, text) { const e = document.createElement('div'); e.className = cls; if (text) e.textContent = text; parent.appendChild(e); return e; }
function summonFX(slot, m) {
  if (RM) return;
  const fx = fxLayer(slot, CATS[m.cat].color);
  fxEl(fx, 'fx-pillar').animate([{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)', offset: .35 }, { opacity: 0, transform: 'scaleY(1.15)' }], { duration: 760, easing: 'ease-out' });
  for (let i = 0; i < 2; i++) fxEl(fx, 'fx-ring').animate([{ opacity: .95, transform: 'translate(-50%,-50%) scale(.2)' }, { opacity: 0, transform: `translate(-50%,-50%) scale(${1.5 + i * .6})` }], { duration: 680, delay: 140 + i * 150, easing: 'ease-out', fill: 'backwards' });
  const n = [0, 10, 14, 18, 26][m.rank];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * (30 + m.rank * 22);
    fxEl(fx, 'fx-spark').animate([{ transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1 }, { transform: `translate(calc(-50% + ${(Math.cos(a) * d).toFixed(1)}px), calc(-50% + ${(Math.sin(a) * d).toFixed(1)}px)) scale(.2)`, opacity: 0 }],
      { duration: 600 + Math.random() * 450, delay: 160, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'backwards' });
  }
  if (m.rank >= 3) fxEl(fx, 'fx-flash').animate([{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 650, delay: 120, fill: 'backwards' });
  if (m.rank === 4) {
    fxEl(fx, 'fx-kanji', '降臨').animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(2)', letterSpacing: '.5em' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', letterSpacing: '.05em', offset: .3 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(-50%,-60%) scale(1)' }], { duration: 1200, delay: 200, easing: 'ease-out', fill: 'backwards' });
    $('#field').animate([{ boxShadow: 'inset 0 0 0 0 #0000' }, { boxShadow: 'inset 0 0 90px 6px #f3dc9580' }, { boxShadow: 'inset 0 0 0 0 #0000' }], { duration: 900 });
  }
  setTimeout(() => fx.remove(), 1500);
}
function slashFX(slot, color) {
  const fx = fxLayer(slot, color);
  if (RM) { setTimeout(() => fx.remove(), 50); return; }
  [-28, 24].forEach((deg, i) => fxEl(fx, 'fx-slash').animate([{ transform: `rotate(${deg}deg) scaleX(0)`, opacity: 1 }, { transform: `rotate(${deg}deg) scaleX(1)`, opacity: 1, offset: .45 }, { transform: `rotate(${deg}deg) scaleX(1.05)`, opacity: 0 }], { duration: 400, delay: i * 90, easing: 'ease-out', fill: 'backwards' }));
  fxEl(fx, 'fx-flash').animate([{ opacity: 0 }, { opacity: .95, offset: .3 }, { opacity: 0 }], { duration: 460, delay: 90, fill: 'backwards' });
  setTimeout(() => fx.remove(), 900);
}
function clearField(side) { $('#slot-' + side).innerHTML = `<span class="ph">${side === 'p' ? '我方場地' : '對手場地'}</span>`; }
async function lunge(side) {
  const el = $('#slot-' + side + ' .card'); const target = $('#slot-' + (side === 'p' ? 'c' : 'p'));
  if (!el) return;
  Sound.swing();
  const atkColor = CATS[el.dataset.cat].color;
  setTimeout(() => slashFX(target, atkColor), RM ? 0 : AD(320));
  if (!RM) {
    const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dx = (b.left - a.left) * .55, dy = (b.top - a.top) * .55;
    await el.animate([{ transform: 'none' }, { transform: `translate(${-dx * .08}px,${-dy * .08}px) scale(.96)`, offset: .3 }, { transform: `translate(${dx}px,${dy}px) scale(1.12)`, offset: .7 }, { transform: 'none' }], { duration: AD(520), easing: 'ease-in-out' }).finished;
  }
}
async function shatter(side) {
  const el = $('#slot-' + side + ' .card'); if (!el) return;
  Sound.shatter();
  if (!RM) {
    const slot = $('#slot-' + side);
    await el.animate([{ filter: 'none', transform: 'none' }, { filter: 'brightness(2.4) saturate(.4)', transform: 'scale(1.04) rotate(-2deg)' }], { duration: AD(180), fill: 'forwards' }).finished;
    const SHARDS = ['0 0,55% 0,35% 45%,0 30%', '55% 0,100% 0,100% 35%,60% 50%,35% 45%', '0 30%,35% 45%,25% 75%,0 70%',
                    '35% 45%,60% 50%,70% 80%,25% 75%', '60% 50%,100% 35%,100% 75%,70% 80%', '0 70%,25% 75%,70% 80%,100% 75%,100% 100%,0 100%'];
    const anims = SHARDS.map(poly => {
      const pts = poly.split(',').map(p => p.trim().split(/\s+/).map(v => parseFloat(v)));
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const sh = el.cloneNode(true); sh.classList.remove('tilting'); sh.style.clipPath = `polygon(${poly})`; sh.style.filter = 'brightness(1.6)';
      slot.appendChild(sh);
      const dx = (cx - 50) * 2.6 + (Math.random() - .5) * 30, dy = (cy - 50) * 2.2 + 40 + Math.random() * 30, rot = (Math.random() - .5) * 90;
      return sh.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.85)`, opacity: 0, filter: 'brightness(.5) grayscale(1)' }],
        { duration: AD(720), easing: 'cubic-bezier(.15,.6,.35,1)', fill: 'forwards' }).finished;
    });
    el.remove();
    await Promise.all(anims);
  }
  clearField(side);
}
function floatText(anchor, text, cls = '') {
  const r = anchor.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'float ' + cls; d.textContent = text;
  d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
  document.body.appendChild(d);
  d.animate([{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.15)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 }], { duration: RM ? 600 : Math.max(700, AD(1300)), easing: 'ease-out' }).finished.then(() => d.remove());
}
async function damage(side, amt, tags = []) {
  if (amt <= 0) return;
  if (side === 'p' && G.perf) G.perf.maxHit = Math.max(G.perf.maxHit, amt);   // ranked: risk management
  const slot = $('#slot-' + side);
  tags.forEach((t, i) => setTimeout(() => floatText(slot, t, 'small'), 120 * i));
  floatText(slot, '−' + amt);
  Sound.hit(amt);
  const hitCard = slot.querySelector('.card');
  if (hitCard && !RM) hitCard.animate([{ filter: 'none' }, { filter: 'brightness(2.3) saturate(1.8)' }, { filter: 'none' }], { duration: 340 });
  const duel = $('#duel'); duel.classList.remove('shake'); void duel.offsetWidth; duel.classList.add('shake');
  if (side === 'c') G.dealt += amt; else G.taken += amt;
  const from = G.lp[side], to = Math.max(0, from - amt); G.lp[side] = to;
  Sound.setDanger(G.lp.p > 0 && G.lp.p < LP_MAX * 0.3);
  const t0 = performance.now(), dur = RM ? 1 : AD(650);
  await new Promise(res => { const step = now => { const k = Math.min(1, (now - t0) / dur); renderLP(side, from + (to - from) * (1 - Math.pow(1 - k, 3))); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  await sleep(250);
}

export function init() { provide({ floatText, log }); }

export { clearField, damage, floatText, fxEl, fxLayer, log, lunge, placeField, shatter, slashFX, summonFX };
