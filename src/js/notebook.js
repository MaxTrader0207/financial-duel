// notebook.js — the 錯題本: wrong answers with spaced review (now, 1 day, 3 days), its screen and review mode.
import * as Quests from './quests.js';
import { DIFF_LABEL } from './rules.js';
import { allQuestions } from './bank.js';
import { CATS } from './cards.js';
import { $, KEYS, Store, esc, isObj, shuffle } from './core.js';

import { Sound } from './sound.js';

let NB_KEY, DAY, NB_WAIT, NB_V, NB, nbSave, fmtDue, fmtDay, nbCat, nbShowMastered, RV;

/* record an answer. pick: the option text chosen when wrong ('' when time ran out), kept to show "你上次選了…".
   Returns what happened: 'new' | 'down' | 'again' (wrong) · 'up' | 'mastered' · 'early' (right before it was due: the
   count goes up but the box stays, so a question is only mastered after right answers on different days). */
function nbRecord(q, correct, pick) {
  const now = Date.now(), e = NB[q.id];
  if (!correct) {
    NB[q.id] = { box: 1, wrong: (e ? e.wrong : 0) + 1, right: e ? e.right : 0, due: now, last: now, added: e ? e.added : now, mastered: false,
      ...(typeof pick === 'string' ? { pick } : e && e.pick !== undefined ? { pick: e.pick } : {}),
      ...(q.snap ? { snap: snapOf(q) } : e && e.snap ? { snap: e.snap } : {}) };
    nbSave(); return !e ? 'new' : e.box > 1 || e.mastered ? 'down' : 'again';
  }
  if (!e || e.mastered) return null;
  e.right++; e.last = now;
  let res;
  if (e.due > now) res = 'early';
  else if (e.box >= 3) { e.mastered = true; res = 'mastered'; } else { e.box++; e.due = now + NB_WAIT[e.box] * DAY; res = 'up'; }
  nbSave(); return res;
}
/* 排位賽的題目由伺服器出題，不在本機題庫裡：答錯時把題目本身存進錯題本（snap），之後一樣能複習與輸出 */
const snapOf = q => ({ category: q.category, difficulty: q.difficulty, q: q.q, options: q.options.slice(), answer: q.answer, explain: q.explain || '', ranked: true });
function nbEntries() {
  const byId = new Map(allQuestions().map(q => [q.id, q]));
  return Object.entries(NB).map(([id, e]) => ({ q: byId.get(id) || (e.snap && e.snap.answer >= 0 ? { id, ...e.snap } : null), e })).filter(x => x.q);
}
function nbDueList(cat) {
  const now = Date.now();
  return nbEntries().filter(({ q, e }) => !e.mastered && e.due <= now && (!cat || q.category === cat)).map(x => x.q);
}
function nbCounts() {
  const all = nbEntries(), now = Date.now();
  return { due: all.filter(x => !x.e.mastered && x.e.due <= now).length, learning: all.filter(x => !x.e.mastered).length, mastered: all.filter(x => x.e.mastered).length };
}
function renderNotebook() {
  const c = nbCounts();
  $('#nb-stats').innerHTML = `<div class="stat"><div class="n">${c.due}</div><div class="l">現在可複習</div></div><div class="stat"><div class="n">${c.learning}</div><div class="l">學習中</div></div><div class="stat"><div class="n">${c.mastered}</div><div class="l">已掌握</div></div>`;
  $('#nb-review-due').disabled = !c.due; $('#nb-review-due').textContent = `複習到期題目（${c.due}）`;
  $('#nb-review-all').disabled = !c.learning;
  $('#nb-filter').innerHTML = [['all', '全部'], ...Object.keys(CATS).map(k => [k, CATS[k].name])]
    .map(([k, n]) => `<button class="btn ghost small" type="button" data-k="${k}" aria-pressed="${nbCat === k}">${n}</button>`).join('');
  const list = nbEntries().filter(x => (nbCat === 'all' || x.q.category === nbCat) && x.e.mastered === nbShowMastered)
    .sort((a, b) => a.e.due - b.e.due || b.e.wrong - a.e.wrong);
  $('#nb-toggle').textContent = nbShowMastered ? '顯示學習中的題目' : `顯示已掌握的題目（${c.mastered}）`;
  $('#nb-list').innerHTML = list.length ? list.map(({ q, e }) => `
    <div class="miss nb-item">
      <div class="q"><span class="chip" style="background:${CATS[q.category].color}">${CATS[q.category].name}</span>${esc(q.q)}</div>
      <div class="a">正解：${esc(q.options[q.answer])}</div>
      ${!e.mastered && e.pick !== undefined ? `<div class="nb-pick">${e.pick ? `你上次選：${esc(e.pick)}` : '上次時間到，沒有作答'}</div>` : ''}
      ${q.explain ? `<div class="e">${esc(q.explain)}</div>` : ''}
      <div class="nb-meta"><span class="boxes" title="第 ${e.box} 階">${[1, 2, 3].map(i => `<i class="${e.mastered || i <= e.box ? 'on' : ''}"></i>`).join('')}</span>
        <span>答錯 ${e.wrong} 次 · 答對 ${e.right} 次</span><span>${e.mastered ? `${fmtDay(e.last)} 掌握` : fmtDue(e.due)}</span>
        <button class="linkbtn" type="button" data-act="${e.mastered ? 'unmaster' : 'master'}" data-id="${esc(q.id)}">${e.mastered ? '移回學習' : '標記已掌握'}</button>
        <button class="linkbtn" type="button" data-act="remove" data-id="${esc(q.id)}">移除</button></div>
    </div>`).join('') : `<p class="lead">${nbShowMastered ? '還沒有已掌握的題目。' : '這裡會收集對戰中答錯的題目。答錯的題目會在之後的對戰和複習中再次出現，連續在不同天答對 3 次就算掌握。'}</p>`;
}
function startReview(all, cat = nbCat) {
  const now = Date.now();
  let list = nbEntries().filter(x => !x.e.mastered && (all || x.e.due <= now) && (cat === 'all' || x.q.category === cat)).map(x => x.q);
  if (!list.length) return;
  RV = { list: shuffle(list).slice(0, 10), i: 0, right: 0, all: !!all, log: [] };
  $('#nb-main').hidden = true; $('#nb-review').hidden = false;
  showReviewQ();
}
function showReviewQ() {
  const q = RV.list[RV.i];
  RV.order = shuffle(q.options.map((_, i) => i)); RV.done = false;
  $('#rv-progress').textContent = `第 ${RV.i + 1} / ${RV.list.length} 題 · ${CATS[q.category].name} · ${DIFF_LABEL[q.difficulty]}`;
  $('#rv-bar').style.transform = `scaleX(${RV.i / RV.list.length})`;
  $('#rv-q').textContent = q.q;
  $('#rv-opts').innerHTML = RV.order.map((oi, i) => `<button class="q-opt" type="button" data-i="${i}"><span class="k">${KEYS[i]}</span><span>${esc(q.options[oi])}</span></button>`).join('');
  $('#rv-fb').hidden = true;
}
function answerReview(pos) {
  if (!RV || RV.done) return;
  const q = RV.list[RV.i], cp = RV.order.indexOf(q.answer), ok = pos === cp;
  RV.done = true; if (ok) RV.right++;
  const res = nbRecord(q, ok, ok ? undefined : q.options[RV.order[pos]]); Quests.mark('nb');
  [...$('#rv-opts').children].forEach((b, i) => { b.disabled = true; if (i === cp) b.classList.add('right'); else if (i === pos) b.classList.add('wrong'); });
  ok ? Sound.correct() : Sound.wrong();
  const e = NB[q.id];
  RV.log.push({ q, res, box: e.box, due: e.due });
  const fb = $('#rv-fb'); fb.hidden = false; fb.classList.toggle('no', !ok);
  $('#rv-verdict').innerHTML = (ok ? '正解！' : '不正解') + `<small>${RESULT[res](e)}</small>`;
  $('#rv-explain').textContent = q.explain || `正確答案：${q.options[q.answer]}`;
  $('#rv-next').textContent = RV.i + 1 < RV.list.length ? '下一題 ▶' : '查看結果 ▶';
  $('#rv-next').focus({ preventScroll: true });
}
function nextReview() {
  if (!RV) return;
  RV.i++;
  if (RV.i < RV.list.length) return showReviewQ();
  $('#rv-bar').style.transform = 'scaleX(1)';
  $('#rv-progress').textContent = '複習完成';
  $('#rv-q').textContent = `這輪答對 ${RV.right} / ${RV.list.length} 題。`;
  const up = RV.log.filter(x => x.res === 'up' || x.res === 'mastered').length, down = RV.log.filter(x => x.res === 'down' || x.res === 'again').length;
  const later = nbEntries().filter(x => !x.e.mastered && x.e.due > Date.now()).map(x => x.e.due).sort((a, b) => a - b);
  $('#rv-opts').innerHTML = `<div class="rv-sum"><span>升階 <b>${up}</b></span><span>已掌握 <b>${RV.log.filter(x => x.res === 'mastered').length}</b></span><span>答錯 <b>${down}</b></span>${
    RV.log.some(x => x.res === 'early') ? `<span>提前練習 <b>${RV.log.filter(x => x.res === 'early').length}</b></span>` : ''}</div>
    <ol class="rv-log">${RV.log.map(x => `<li class="${x.res === 'again' ? 'down' : x.res}"><span class="t">${esc(x.q.q)}</span><span class="r">${RESULT[x.res]({ box: x.box, due: x.due, mastered: x.res === 'mastered' })}</span></li>`).join('')}</ol>
    <p class="rv-next">${nbDueList().length ? `還有 ${nbDueList().length} 題現在就可以複習（答錯的題目會留在第 1 階）。` : later.length ? `下一次到期：${fmtDue(later[0]).replace('後複習', '後')}，到時候標題畫面會提醒你。` : '目前沒有要複習的題目了。'}</p>`;
  $('#rv-fb').hidden = true;
  $('#rv-done').hidden = false;
}
/* what an answer did, in words (nbRecord's result) */
const RESULT = {
  new: () => '收進錯題本 · 第 1 階', down: () => '退回第 1 階', again: () => '留在第 1 階，下次再練',
  up: e => `升到第 ${e.box} 階 · ${fmtDue(e.due)}`, mastered: () => '已掌握',
  early: e => `還沒到複習日，階段不變（第 ${e.box} 階 · ${fmtDue(e.due)}）`,
  null: () => '',
};
function endReview() { RV = null; $('#nb-review').hidden = true; $('#rv-done').hidden = true; $('#nb-main').hidden = false; renderNotebook(); }

export function init() {
/* ---------- wrong-answer notebook: Leitner boxes 1 → 2 → 3 → mastered ---------- */
NB_KEY = 'soba-ketto.notebook.v1';
DAY = 86400000;
NB_WAIT = { 1: 0, 2: 1, 3: 3 };
   // days until a question in that box is due again
NB_V = 1;
NB = Store.load(NB_KEY, { version: NB_V, fallback: () => ({}), validate: isObj });
nbSave = () => Store.trySave(NB_KEY, NB_V, NB);
fmtDue = t => { const d = Math.ceil((t - Date.now()) / DAY); return d <= 0 ? '現在可複習' : `${d} 天後複習`; };
fmtDay = t => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`; };

nbCat = 'all';
nbShowMastered = false;
$('#nb-filter').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) { nbCat = b.dataset.k; renderNotebook(); } });
$('#nb-toggle').onclick = () => { nbShowMastered = !nbShowMastered; renderNotebook(); };
$('#nb-list').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const id = b.dataset.id, en = NB[id]; if (!en) return;
  if (b.dataset.act === 'master') { en.mastered = true; en.last = Date.now(); }
  else if (b.dataset.act === 'unmaster') { en.mastered = false; en.box = 1; en.due = Date.now(); }
  else if (b.dataset.act === 'remove') delete NB[id];
  nbSave(); renderNotebook();
});

/* review mode: no timer, no battle */
RV = null;
$('#rv-opts').addEventListener('click', e => { const b = e.target.closest('.q-opt'); if (b && !b.disabled) answerReview(Number(b.dataset.i)); });
$('#rv-next').onclick = nextReview;
$('#rv-done').onclick = endReview;
$('#rv-quit').onclick = endReview;
$('#nb-review-due').onclick = () => startReview(false);
$('#nb-review-all').onclick = () => startReview(true);
document.addEventListener('keydown', e => {
  if (!RV || $('#scr-notebook').hidden || /^(TEXTAREA|INPUT)$/.test(document.activeElement?.tagName || '')) return;
  if (!RV.done && /^[1-6]$/.test(e.key)) { const b = $('#rv-opts').children[Number(e.key) - 1]; if (b && !b.disabled) { e.preventDefault(); answerReview(Number(e.key) - 1); } }
  else if (RV.done && e.key === 'Enter' && document.activeElement !== $('#rv-next')) { e.preventDefault(); nextReview(); }
});
}

export { DAY, NB, NB_KEY, NB_V, NB_WAIT, RV, answerReview, endReview, fmtDay, fmtDue, nbCat, nbCounts, nbDueList, nbEntries, nbRecord, nbSave, nbShowMastered, nextReview, renderNotebook, showReviewQ, startReview };
