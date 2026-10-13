// version.js — 版本資訊: the current version and its update time (src/data/changelog.json, newest first), the list of
// what each version changed, and a one-time "what's new" after an update. A first visit only records the version.
import { $, esc } from './core.js';
import LOG from '../data/changelog.json';

export const RELEASES = LOG.releases;
export const CURRENT = RELEASES[0];
/* global __BUILD__ */
export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { time: null, commit: '' };
export const SEEN_KEY = 'soba-ketto.seen-version';

/* '3.10.0' > '3.9.0' */
export function newer(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}
/* the releases a returning player has not seen yet */
export const since = seen => RELEASES.filter(r => newer(r.version, seen));
const fmt = d => d.replace(/-/g, '/');
export const label = () => `v${CURRENT.version} · ${fmt(CURRENT.date)} 更新`;

function releaseHTML(r, open) {
  return `<details class="nv-rel"${open ? ' open' : ''}><summary><b>v${esc(r.version)}</b><span>${esc(r.title)}</span><time>${esc(fmt(r.date))}</time></summary>
    <ul>${r.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></details>`;
}
export function openNews(seen = null) {
  const fresh = seen ? since(seen) : [];
  const built = BUILD.time ? new Date(BUILD.time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false }) : '';
  $('#news-body').innerHTML = `
    ${fresh.length ? `<p class="lead">自從你上次開啟（v${esc(seen)}）之後，遊戲更新了 ${fresh.length} 個版本：</p>` : `<p class="lead">目前版本 <b>v${esc(CURRENT.version)}</b>，${esc(fmt(CURRENT.date))} 更新。</p>`}
    <div class="nv-list">${(fresh.length ? fresh : RELEASES).map((r, i) => releaseHTML(r, fresh.length ? true : i === 0)).join('')}</div>
    ${fresh.length ? '<button class="linkbtn" type="button" id="news-all">看全部更新紀錄</button>' : ''}
    <p class="nv-build">${built ? `建置時間 ${esc(built)}` : ''}${BUILD.commit ? ` · ${esc(BUILD.commit)}` : ''}</p>`;
  const all = $('#news-all'); if (all) all.onclick = () => openNews();
  $('#news-dlg').hidden = false;
}

export function init() {
  const tag = $('#ver-tag'); if (tag) { tag.textContent = `${label()} · 看更新內容`; tag.onclick = () => openNews(); }
  const sv = $('#set-version'); if (sv) sv.textContent = label();
  $('#news-ok').onclick = () => { $('#news-dlg').hidden = true; };
  let seen = null; try { seen = localStorage.getItem(SEEN_KEY); } catch { /* storage blocked */ }
  try { localStorage.setItem(SEEN_KEY, CURRENT.version); } catch { /* storage blocked */ }
  if (seen && newer(CURRENT.version, seen)) openNews(seen);                // a returning player after an update
}
