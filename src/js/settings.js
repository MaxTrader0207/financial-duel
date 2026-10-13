// settings.js — the 設定 dialog: fast mode, simplified effects, volume, app install note.
import { $, SET, saveSet } from './core.js';
import { Sound } from './sound.js';
import { Perf, describe } from './perf.js';
import { PWA } from './pwa.js';
import * as Usage from './usage.js';
import * as Reading from './reading.js';

let setDlg;


/* ---------- settings ---------- */
function syncSettings() {
  $('#set-fast').checked = !!SET.fast;
  $('#set-cvd').checked = Reading.cvd();
  document.querySelectorAll('#set-text button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === Reading.textSize())));
  $('#set-stats').checked = Usage.enabled();
  $('#set-music').value = SET.music; $('#set-music-v').textContent = SET.music + '%';
  $('#set-sfx').value = SET.sfx; $('#set-sfx-v').textContent = SET.sfx + '%';
  document.documentElement.classList.toggle('fast', !!SET.fast);
  document.querySelectorAll('#set-fx button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === Perf.mode)));
  $('#set-fx-note').textContent = describe();
  $('#pwa-note').textContent = PWA.status(); $('#pwa-install').hidden = !PWA.canPrompt || PWA.installed;
}

export function init() {
setDlg = $('#settings');
$('#btn-set').onclick = () => { syncSettings(); setDlg.hidden = false; $('#set-ok').focus({ preventScroll: true }); };
$('#set-ok').onclick = () => { setDlg.hidden = true; };
setDlg.addEventListener('click', e => { if (e.target === setDlg) setDlg.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !setDlg.hidden) setDlg.hidden = true; });
$('#set-stats').onchange = e => { Usage.setEnabled(e.target.checked); syncSettings(); };
$('#set-text').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) { Reading.setTextSize(b.dataset.v); syncSettings(); } });
$('#set-cvd').onchange = e => { Reading.setCvd(e.target.checked); syncSettings(); };
$('#set-fast').onchange = e => { SET.fast = e.target.checked; saveSet(); syncSettings(); };
$('#set-music').oninput = e => { SET.music = Number(e.target.value); Sound.setVolume(SET.music / 100, SET.sfx / 100); saveSet(); syncSettings(); };
$('#set-sfx').oninput = e => { SET.sfx = Number(e.target.value); Sound.setVolume(SET.music / 100, SET.sfx / 100); saveSet(); syncSettings(); };
$('#set-sfx').onchange = () => Sound.select();
$('#set-fx').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) { Perf.set(b.dataset.v); syncSettings(); } });
Perf.onChange(() => { if (!setDlg.hidden) syncSettings(); });
syncSettings();
}

export { setDlg, syncSettings };
