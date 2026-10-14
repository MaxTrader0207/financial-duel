// backbar.js — a slim bar pinned to the top of every menu screen with 「‹ 回標題」, so long pages (族譜, 圖鑑, 排位…)
// don't have to be scrolled to the bottom to leave. It presses the screen's own 回標題 button when there is one, so each
// screen's cleanup (ending a review, keeping daily progress…) still runs.
import { $ } from './core.js';
import { show } from './view.js';
import { Actions } from './actions.js';

const SKIP = new Set(['title', 'duel', 'result']), NAMES = { daily: '每日挑戰' };
const isHome = b => /^(先)?回標題/.test(b.textContent.trim());
function leave(sec) {
  const own = [...sec.querySelectorAll('.page button')].filter(b => !b.closest('.backbar') && isHome(b) && b.offsetParent !== null && !b.disabled);
  if (own.length) { own[own.length - 1].click(); return; }
  Actions.renderTitle(); show('title');
}
export function init() {
  document.querySelectorAll('section.screen').forEach(sec => {
    const name = sec.id.replace(/^scr-/, ''), page = sec.querySelector('.page');
    if (SKIP.has(name) || !page || page.querySelector('.backbar')) return;
    const bar = document.createElement('div');
    bar.className = 'backbar';
    const h = page.querySelector('h3.sec');
    bar.innerHTML = `<button class="backbar-btn" type="button" aria-label="回標題"><span aria-hidden="true">‹</span> 回標題</button><span class="backbar-t">${h ? h.textContent : NAMES[name] || ''}</span>`;
    bar.querySelector('button').onclick = () => leave(sec);
    page.prepend(bar);
  });
}
export const backBtn = name => $(`#scr-${name} .backbar-btn`);
