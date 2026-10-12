// perf.js — simplified effects for slow phones.
// Setting 簡化特效 (SET.fx): 'auto' (default) | 'on' | 'off'. In auto mode the game simplifies when it sees a slow
// or battery-saving device: ≤ 4 CPU cores together with ≤ 4 GB memory, the browser's data saver, a battery under
// 20 % that is not charging, or a measured frame rate under ~40 fps on the title screen.
// Simplified = <html class="fx-lite">: no foil / holo animation, no background particles, no card tilt,
// no blur behind dialogs (see styles.css). The game itself plays exactly the same.
import { RM, SET, saveSet } from './core.js';

const why = new Set();             // reasons auto mode found
let probed = false;
const listeners = [];

export const Perf = {
  get mode() { return ['auto', 'on', 'off'].includes(SET.fx) ? SET.fx : 'auto'; },
  get lite() { return this.mode === 'on' || (this.mode === 'auto' && why.size > 0); },
  get reasons() { return [...why]; },
  set(mode) { SET.fx = mode; saveSet(); apply(); },
  onChange(f) { listeners.push(f); },
  flag(r, on = true) { const had = why.has(r); if (on) why.add(r); else why.delete(r); if (had !== on) apply(); },
};

function apply() {
  const lite = Perf.lite;
  const was = document.documentElement.classList.contains('fx-lite');
  document.documentElement.classList.toggle('fx-lite', lite);
  if (was !== lite) listeners.forEach(f => { try { f(lite); } catch (e) {} });
}

/* hardware hints the browser gives without asking */
function staticHints() {
  const n = navigator, cores = n.hardwareConcurrency || 8, mem = n.deviceMemory || 8;
  if (cores <= 4 && mem <= 4) why.add('低階裝置');
  if (n.connection && n.connection.saveData) why.add('省流量模式');
}
function watchBattery() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then(b => {
    const check = () => Perf.flag('電量低', !b.charging && b.level <= 0.2);
    check(); b.addEventListener('levelchange', check); b.addEventListener('chargingchange', check);
  }).catch(() => {});
}
/* about one second of frames while the title screen idles: a median over 25 ms means the phone is struggling */
export function probeFps(frames = 50) {
  if (probed || RM || document.hidden || typeof requestAnimationFrame !== 'function') return Promise.resolve(null);
  probed = true;
  return new Promise(res => {
    const t = []; let last = 0;
    const step = ts => { if (last) t.push(ts - last); last = ts; if (t.length < frames) requestAnimationFrame(step); else done(); };
    const done = () => { const s = t.slice(5).sort((a, b) => a - b), med = s[Math.floor(s.length / 2)] || 16; if (med > 25) Perf.flag('畫面偏慢'); res(med); };
    requestAnimationFrame(step);
  });
}
export function describe() {
  if (Perf.mode === 'on') return '已開啟：關閉閃卡、背景粒子與卡片傾斜效果。';
  if (Perf.mode === 'off') return '已關閉：一律使用完整特效。';
  return Perf.lite ? `自動：偵測到${Perf.reasons.join('、')}，已改用簡化特效。` : '自動：這台裝置使用完整特效；偵測到效能不足或省電時會自動簡化。';
}

export function init() {
  staticHints(); watchBattery(); apply();
  if (Perf.mode === 'auto') setTimeout(() => probeFps(), 1500);
}
