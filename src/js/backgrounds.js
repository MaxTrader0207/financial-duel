// backgrounds.js — the eight battle backgrounds (patterns and their particles: petals, embers, fireflies, sparkles, stars).
import { $, RM } from './core.js';
import { Perf } from './perf.js';

let BG_THEMES, BG;


export function init() {
/* ---------- battle backgrounds ---------- */
BG_THEMES = [
  { id: 'wave',     name: '青海波 · 夜潮', fx: null },
  { id: 'shippo',   name: '七寶 · 紫宸',   fx: 'sparkle' },
  { id: 'kikko',    name: '龜甲 · 松濤',   fx: null },
  { id: 'raimon',   name: '雷紋 · 赤城',   fx: 'ember' },
  { id: 'yagasuri', name: '矢絣 · 墨染',   fx: null },
  { id: 'bamboo',   name: '竹林 · 月影',   fx: 'firefly' },
  { id: 'sakura',   name: '櫻吹雪',        fx: 'petal' },
  { id: 'stars',    name: '星空 · 夜市',   fx: 'star' },
];
BG = (() => {
  const cv = $('#bg-fx'), cx = cv.getContext('2d');
  let parts = [], kind = null, raf = 0, last = 0, W = 0, H = 0, lastId = null;
  try { lastId = localStorage.getItem('soba-ketto.bg'); } catch (e) {}
  function resize() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(k, init) {
    const p = { x: rnd(0, W), y: init ? rnd(0, H) : (k === 'ember' ? H + 10 : -10), r: 0, a: 1, t: rnd(0, 6.28) };
    if (k === 'petal') Object.assign(p, { s: rnd(4, 8), vy: rnd(18, 40), vx: rnd(-12, 12), spin: rnd(-2, 2) });
    if (k === 'ember') Object.assign(p, { s: rnd(1, 2.6), vy: -rnd(14, 34), vx: rnd(-6, 6) });
    if (k === 'firefly') Object.assign(p, { y: rnd(H * 0.3, H), s: rnd(1.5, 3), vy: rnd(-6, 6), vx: rnd(-8, 8) });
    if (k === 'sparkle') Object.assign(p, { y: rnd(0, H), s: rnd(1, 2.4), vy: 0, vx: 0, life: rnd(1.5, 4) });
    if (k === 'star') Object.assign(p, { y: rnd(0, H * 0.8), s: rnd(0.6, 1.8), vy: 0, vx: 0 });
    return p;
  }
  const COUNT = { petal: 26, ember: 30, firefly: 18, sparkle: 26, star: 70 };
  let shoot = null;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    cx.clearRect(0, 0, W, H);
    parts.forEach((p, i) => {
      p.t += dt;
      if (kind === 'petal') {
        p.x += (p.vx + Math.sin(p.t * 1.6) * 14) * dt; p.y += p.vy * dt; p.r += p.spin * dt;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, 0.55 + 0.35 * Math.sin(p.t * 3));
        cx.fillStyle = '#f6bfd2cc'; cx.beginPath(); cx.ellipse(0, 0, p.s, p.s * 0.62, 0, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = '#e88aaa88'; cx.beginPath(); cx.ellipse(p.s * 0.3, 0, p.s * 0.35, p.s * 0.25, 0, 0, Math.PI * 2); cx.fill(); cx.restore();
        if (p.y > H + 12 || p.x < -20 || p.x > W + 20) parts[i] = spawn(kind);
      } else if (kind === 'ember') {
        p.x += (p.vx + Math.sin(p.t * 2) * 6) * dt; p.y += p.vy * dt; p.a = Math.max(0, Math.min(1, (p.y / H) * 1.4));
        cx.fillStyle = `rgba(255,${120 + (p.s * 30) | 0},60,${(0.55 * p.a).toFixed(3)})`; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill();
        if (p.y < -10) parts[i] = spawn(kind);
      } else if (kind === 'firefly') {
        p.vx += rnd(-10, 10) * dt; p.vy += rnd(-10, 10) * dt; p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt;
        const g = 0.35 + 0.35 * Math.sin(p.t * 2.2);
        const gr = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 5); gr.addColorStop(0, `rgba(220,240,140,${g.toFixed(3)})`); gr.addColorStop(1, 'rgba(220,240,140,0)');
        cx.fillStyle = gr; cx.beginPath(); cx.arc(p.x, p.y, p.s * 5, 0, Math.PI * 2); cx.fill();
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) parts[i] = spawn(kind, true);
      } else if (kind === 'sparkle') {
        const a = Math.max(0, Math.sin((p.t / p.life) * Math.PI));
        cx.strokeStyle = `rgba(243,220,149,${(0.6 * a).toFixed(3)})`; cx.lineWidth = 1; const s = p.s * 3 * a;
        cx.beginPath(); cx.moveTo(p.x - s, p.y); cx.lineTo(p.x + s, p.y); cx.moveTo(p.x, p.y - s); cx.lineTo(p.x, p.y + s); cx.stroke();
        if (p.t > p.life) parts[i] = spawn(kind, true);
      } else if (kind === 'star') {
        const a = 0.35 + 0.35 * Math.sin(p.t * (1 + p.s));
        cx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill();
      }
    });
    if (kind === 'star') {
      if (!shoot && Math.random() < dt * 0.12) shoot = { x: rnd(W * 0.2, W), y: rnd(0, H * 0.3), l: 0 };
      if (shoot) {
        shoot.l += dt; const k = shoot.l / 0.9, x = shoot.x - k * 260, y = shoot.y + k * 120;
        const g = cx.createLinearGradient(x, y, x + 90, y - 42); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        cx.strokeStyle = g; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + 90, y - 42); cx.stroke();
        if (k >= 1) shoot = null;
      }
    }
    raf = requestAnimationFrame(frame);
  }
  let want = null;                       // the theme's particle kind, kept while simplified effects pause it
  Perf.onChange(() => startFx(want));
  function startFx(k) {
    want = k; if (Perf.lite) k = null;
    cancelAnimationFrame(raf); kind = k; parts = []; cx.clearRect(0, 0, W, H);
    if (!k) return;
    resize(); parts = Array.from({ length: COUNT[k] }, () => spawn(k, true));
    if (RM) { last = performance.now(); frame(last); cancelAnimationFrame(raf); return; }   // one still frame
    last = performance.now(); raf = requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { if (kind) { resize(); parts = Array.from({ length: COUNT[kind] }, () => spawn(kind, true)); } });
  document.addEventListener('visibilitychange', () => { if (!kind || RM) return; if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } });
  return {
    pick() { const pool = BG_THEMES.filter(t => t.id !== lastId); const t = pool[Math.floor(Math.random() * pool.length)]; lastId = t.id; try { localStorage.setItem('soba-ketto.bg', t.id); } catch (e) {} return t.id; },
    apply(id) {
      const t = BG_THEMES.find(x => x.id === id);
      if (!t || t.id === 'wave') delete document.body.dataset.bg; else document.body.dataset.bg = t.id;
      $('#bg-label').textContent = t ? `場景：${t.name}` : '';
      startFx(t ? t.fx : null);
    },
    clear() { delete document.body.dataset.bg; $('#bg-label').textContent = ''; startFx(null); },
  };
})();
}

export { BG, BG_THEMES };
