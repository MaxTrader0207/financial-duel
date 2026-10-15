// lessonsui.js — the 教學中心 screen: the lesson list, then one lesson (explanation → three practice questions →
// summary). Questions come from lessons.js; cards are drawn with the game's own card face.
import { $, esc } from './core.js';
import { CATS, MON } from './carddata.js';
import { cardHTML } from './cards.js';
import { show, toast } from './view.js';
import { register } from './actions.js';
import { renderTitle } from './screens.js';
import { wheelSVG } from './rulesref.js';
import { Sound } from './sound.js';
import * as L from './lessons.js';

const KEYS = ['甲', '乙', '丙', '丁'];
let S = null;                                   // { id, qs, i, right, picked }

export function openLessons() { S = null; renderList(); show('lessons'); }
function renderList() {
  const pr = L.progress();
  $('#ls-body').innerHTML = `<p class="ls-count">已完成 <b>${L.doneCount()}</b> / ${L.LESSONS.length} 課</p><div class="ls-list">${L.LESSONS.map((l, i) => {
    const best = pr.best[l.id], ok = L.passed(l.id);
    return `<button class="ls-item${ok ? ' done' : ''}" type="button" data-id="${l.id}"><span class="ls-n">${i + 1}</span><span class="ls-t"><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></span>
      <span class="ls-st">${ok ? `已完成 · 最佳 ${best}/3` : best !== undefined ? `最佳 ${best}/3` : `約 1 分鐘 · 首次通過 +${L.LESSON_SHARDS} 碎片`}</span></button>`; }).join('')}</div>`;
  $('#ls-body').querySelectorAll('.ls-item').forEach(b => { b.onclick = () => startLesson(b.dataset.id); });
}
export function startLesson(id) {
  const l = L.lessonById(id); S = { id, qs: null, i: 0, right: 0 };
  $('#ls-body').innerHTML = `<div class="ls-lesson"><h4>${esc(l.title)}</h4>${l.wheel ? wheelSVG() : ''}<ul class="ls-intro">${l.intro.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="btn-row"><button class="btn" type="button" id="ls-go">開始練習（3 題）</button><button class="btn ghost" type="button" id="ls-list">回教學中心</button></div></div>`;
  $('#ls-go').onclick = () => { S.qs = L.makeQuestions(id); S.i = 0; S.right = 0; renderQ(); };
  $('#ls-list').onclick = () => { S = null; renderList(); };
  window.scrollTo(0, 0);
}
function renderQ() {
  const q = S.qs[S.i], l = L.lessonById(S.id);
  const cards = !q.pickCard && q.card ? `<div class="ls-cards">${cardHTML(MON[q.card])}</div>` : '';
  const foe = q.foe ? `<div class="ls-foe"><span>對手攻擊</span>${cardHTML(MON[q.foe])}</div>` : '';
  const opts = q.options.map((o, k) => o.card
    ? `<button class="ls-opt" type="button" data-k="${k}"><span class="ls-chip" style="background:${CATS[MON[o.card].cat].color}">${CATS[MON[o.card].cat].badge}</span><span>${esc(o.text)}</span></button>`
    : `<button class="ls-opt" type="button" data-k="${k}"><span class="k">${KEYS[k]}</span><span>${esc(o.text)}</span></button>`).join('');
  $('#ls-body').innerHTML = `<div class="ls-lesson"><div class="ls-prog">${esc(l.title)} · 第 ${S.i + 1} / ${S.qs.length} 題</div>
    ${foe}${cards}<p class="ls-q">${esc(q.prompt)}</p><div class="ls-opts">${opts}</div><div class="ls-fb" id="ls-fb" hidden></div><button class="linkbtn ls-quit" type="button" id="ls-list">離開這一課</button></div>`;
  $('#ls-list').onclick = () => { S = null; renderList(); };
  $('#ls-body').querySelectorAll('.ls-opt').forEach(b => { b.onclick = () => answer(Number(b.dataset.k)); });
}
function answer(k) {
  const q = S.qs[S.i], ok = k === q.answer; if (ok) S.right++;
  $('#ls-body').querySelectorAll('.ls-opt').forEach((b, i) => { b.disabled = true; if (i === q.answer) b.classList.add('right'); else if (i === k) b.classList.add('wrong'); });
  try { ok ? Sound.correct() : Sound.wrong(); } catch (e) { /* sound optional */ }
  const last = S.i === S.qs.length - 1, fb = $('#ls-fb');
  fb.hidden = false; fb.className = 'ls-fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<b>${ok ? '答對了！' : '再想想看。'}</b><p>${esc(q.explain)}</p><button class="btn small" type="button" id="ls-next">${last ? '看結果' : '下一題'}</button>`;
  $('#ls-next').onclick = () => { if (last) done(); else { S.i++; renderQ(); } };
  $('#ls-next').focus({ preventScroll: true });
}
function done() {
  const l = L.lessonById(S.id), r = L.finish(S.id, S.right), pass = S.right >= L.PASS;
  if (r.first) toast(`完成「${l.title}」，獲得 ${r.shards} 碎片！`);
  $('#ls-body').innerHTML = `<div class="ls-lesson ls-end"><div class="ls-score ${pass ? 'ok' : 'no'}">${S.right} / ${S.qs.length}</div>
    <p class="lead">${pass ? `「${esc(l.title)}」完成了${r.first ? `，獲得 ${r.shards} 碎片` : ''}！` : `答對 ${L.PASS} 題以上就算完成，再練一次吧。每次的題目都不一樣。`}</p>
    <div class="btn-row"><button class="btn" type="button" id="ls-again">再練一次</button><button class="btn ghost" type="button" id="ls-list">回教學中心</button></div></div>`;
  $('#ls-again').onclick = () => startLesson(S.id);
  $('#ls-list').onclick = () => { S = null; renderList(); };
}

/* the question on screen (tests and the debug hooks) */
export const current = () => (S && S.qs ? S.qs[S.i] : null);

export function init() {
  register({ openLessons });
  $('#btn-lessons').onclick = openLessons;
  $('#ls-back').onclick = () => { S = null; renderTitle(); show('title'); };
}
