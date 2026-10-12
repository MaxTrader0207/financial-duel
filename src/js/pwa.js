// pwa.js — the installable web app (GitHub Pages build only; __PWA__ is false in single-file builds).
// Registers sw.js for offline play, offers 「安裝到主畫面」 where the browser allows it (Android / desktop Chrome, Edge),
// explains the Share → 加入主畫面 steps on iPhone / iPad, and offers a reload when a new version has been cached.
import { $ } from './core.js';

let deferred = null, waitingSW = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const PWA = {
  get supported() { return typeof __PWA__ !== 'undefined' && __PWA__ && 'serviceWorker' in navigator && isSecureContext; },
  get installed() { return standalone(); },
  get canPrompt() { return !!deferred; },
  async install() {
    if (!deferred) return false;
    deferred.prompt(); const { outcome } = await deferred.userChoice; deferred = null; sync();
    return outcome === 'accepted';
  },
  status() {
    if (!PWA.supported) return '這個版本是單一檔案，無法安裝；請用網站版（GitHub Pages）安裝。';
    if (standalone()) return '已用 App 模式開啟，離線也能玩。';
    if (deferred) return '可以安裝到主畫面或桌面，之後像 App 一樣全螢幕開啟，離線也能玩。';
    if (isIOS()) return 'iPhone／iPad：在 Safari 點「分享」→「加入主畫面」，之後從主畫面開啟即可離線遊玩。';
    return '用 Chrome 或 Edge 開啟時，網址列或選單會出現「安裝」；已安裝過則從主畫面或應用程式清單開啟。';
  },
};

function sync() {
  const b = $('#btn-install'); if (b) b.hidden = !deferred || standalone();
  const s = $('#pwa-install'); if (s) s.hidden = !deferred || standalone();
  const n = $('#pwa-note'); if (n) n.textContent = PWA.status();
}
function offerReload(sw) {
  waitingSW = sw;
  const bar = $('#update-bar'); if (!bar) return;
  bar.hidden = false;
}

export function init() {
  document.documentElement.classList.toggle('standalone', standalone());
  const doInstall = () => PWA.install();
  $('#btn-install')?.addEventListener('click', doInstall);
  $('#pwa-install')?.addEventListener('click', doInstall);
  $('#update-go')?.addEventListener('click', () => { if (waitingSW) waitingSW.postMessage('skipWaiting'); else location.reload(); });
  $('#update-later')?.addEventListener('click', () => { $('#update-bar').hidden = true; });
  sync();
  if (!PWA.supported) return;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; sync(); });
  addEventListener('appinstalled', () => { deferred = null; sync(); });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (waitingSW && !reloading) { reloading = true; location.reload(); } });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) offerReload(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw?.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) offerReload(sw); });
    });
    /* an installed app may stay open for days: look for a new version every hour */
    setInterval(() => reg.update().catch(() => {}), 3600e3);
  }).catch(() => {});
}
