// ask.js — asking one question: the quiz overlay with its timer, option removal and retry skills, keyboard keys, and the answer feedback.
import { CATS, cardHTML } from './cards.js';
import { $, KEYS, RM, esc, foeAtkOf, shuffle } from './core.js';
import { resetReport, showAsOf } from './feedback.js';
import { floatText } from './fx.js';
import { NB, nbRecord } from './notebook.js';
import { setQuizState, pickQuestion, quizState } from './quiz.js';
import { qsRecord } from './records.js';
import { DIFF_LABEL, ADV_DOWN, ADV_UP, ADV_WHY, WEAK_MULT, advOf } from './rules.js';
import { SKILLS, skillLine } from './skills.js';
import { Sound } from './sound.js';
import { G } from './game.js';
import { renderStreak } from './board.js';
import * as Usage from './usage.js';
import { BUILTIN } from './bank.js';
let builtinSet = null;                                    // the bank's own question objects (custom edits are not counted)
import { Tutor } from './tutor.js';
import * as Online from './online.js';

/* 排位賽 asks the server for each question (it keeps the answer and judges the pick); if that fails, a built-in one is
   asked instead and sent with the result (the server allows only a few of those per duel). */
function ask(m, mode, foe) {
  const cat = mode === 'defend' && foe ? foe.cat : m.cat, qz = (SKILLS[m.id] || {}).quiz || {};
  if (G.mode !== 'ranked' || !Online.matchOpen()) return askWith(m, mode, foe, null);
  $('#quiz').hidden = false; $('#q-text').textContent = '出題中…'; $('#q-opts').innerHTML = ''; $('#q-feedback').hidden = true; $('#q-meta').textContent = ''; $('#q-adv').hidden = true;
  return Online.askQuestion({ cat, rank: m.rank, limit: G.diff.time + (qz.extraTime || 0), remove: qz.remove || 0, retry: !!qz.retry })
    .then(srv => askWith(m, mode, foe, srv));
}
/* a server question as a question object; the answer is filled in once the server has judged the pick */
const fnv = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; return h.toString(36); };
const fromServer = srv => ({ id: 'r-' + fnv(srv.q + '|' + [...srv.options].sort().join('|')), category: srv.category, difficulty: srv.difficulty, q: srv.q,
  options: srv.options.slice(), answer: -1, explain: '', snap: true, calc: !!srv.calc });

function askWith(m, mode, foe, srv) {
  return new Promise(resolve => {
    const q = srv ? fromServer(srv) : pickQuestion(mode === 'defend' && foe ? foe.cat : m.cat, m.rank);
    if (!srv && G.mode === 'ranked') G.localQ = (G.localQ || 0) + 1;
    if (srv && import.meta.env.MODE === 'test') window.__lastQ = { options: q.options, answer: srv.testAnswer ?? -1 };   // e2e: the mock server tells the answer
    const sk = SKILLS[m.id] || {}, qz = sk.quiz || {};
    const order = srv ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i));
    $('#q-cards').innerHTML = mode === 'defend' && foe ? `${cardHTML(foe)}<div class="vs-l">對</div>${cardHTML(m)}` : cardHTML(m);
    const modeEl = $('#q-mode');
    modeEl.textContent = mode === 'attack' ? '攻擊宣言 · 答對即發動攻擊' : '防禦宣言 · 答對即可擋下攻擊';
    modeEl.classList.toggle('def', mode === 'defend');
    const limit = srv ? srv.limit : G.diff.time + (qz.extraTime || 0);
    const fromNb = G.lastFromNb && !srv;
    const tag = srv ? (srv.calc ? '排位計算題 · ' : '排位題 · ') : G.mode === 'ranked' && Online.joined() ? `備用題（連線不穩${G.localQ > 3 ? '，這場可能不列入排行榜' : ''}） · ` : '';
    $('#q-meta').textContent = tag + (fromNb ? '錯題複習 · ' : '') + `${CATS[q.category].name} · ${DIFF_LABEL[q.difficulty]} · 限時 ${limit} 秒` + (mode === 'defend' && foe ? ` · 對手實際攻擊 ${foeAtkOf(foe)}` : '');
    { const a = mode === 'defend' && foe ? advOf(m.cat, foe.cat) : 1, weak = mode === 'attack' && G.weak === m.cat;
      const el = $('#q-adv'); el.className = 'q-adv' + (a < 1 ? ' bad' : '');
      el.textContent = a > 1 ? `屬性相剋：${CATS[m.cat].name}剋${CATS[foe.cat].name}（${ADV_WHY[m.cat]}），守備力 ×${ADV_UP}` : a < 1 ? `屬性被剋：${CATS[foe.cat].name}剋${CATS[m.cat].name}（${ADV_WHY[foe.cat]}），守備力 ×${ADV_DOWN}` : weak ? `弱項挑戰：答對傷害 ×${WEAK_MULT}` : '';
      el.hidden = !el.textContent; }
    $('#q-skill').innerHTML = `<div>${skillLine(m, '我方')}</div>` + (mode === 'defend' && foe ? `<div class="foe">${skillLine(foe, '對手')}</div>` : '');
    $('#q-text').textContent = q.q;
    $('#q-opts').innerHTML = order.map((oi, i) => `<button class="q-opt" type="button" data-i="${i}"><span class="k">${KEYS[i]}</span><span>${esc(q.options[oi])}</span></button>`).join('');
    let correctPos = srv ? -1 : order.indexOf(q.answer);
    const removed = srv ? srv.removed || [] : qz.remove ? shuffle(order.map((_, i) => i).filter(i => i !== correctPos)).slice(0, Math.min(qz.remove, order.length - 2)) : [];
    removed.forEach(i => { const b = $('#q-opts').children[i]; if (b) { b.disabled = true; b.classList.add('removed'); } });
    $('#q-feedback').hidden = true;
    const timerBox = $('#q-timer'), bar = $('#q-timer-bar'); timerBox.classList.remove('hurry');
    $('#quiz').hidden = false;
    Sound.duck(true); Sound.open();
    const panel = $('#quiz .q-panel');
    if (!RM) panel.animate([{ opacity: 0, transform: 'translateY(24px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out' });
    if (qz.remove || qz.extraTime) setTimeout(() => { Sound.skill(); floatText($('#q-skill'), `【${sk.name}】${[qz.remove && `刪去 ${qz.remove} 個錯誤選項`, qz.extraTime && `答題時間 +${qz.extraTime} 秒`].filter(Boolean).join('、')}`, 'skill'); }, 300);
    let t0 = performance.now(), raf = 0, done = false, retried = false, firstPick = null, waiting = false, lost = false;
    let lastSec = Math.ceil(limit);
    const tick = now => {
      if (done) return;
      const left = Math.max(0, limit - (now - t0) / 1000);
      bar.style.transform = `scaleX(${left / limit})`;
      timerBox.classList.toggle('hurry', left < limit * 0.3);
      const sec = Math.ceil(left);
      if (sec !== lastSec) { lastSec = sec; if (left > 0 && left < limit * 0.3) Sound.tick(); }
      if (left <= 0) return finish(-1);
      raf = requestAnimationFrame(tick);
    };
    if (Tutor.wantsQuizHold()) { bar.style.transform = 'scaleX(1)'; Tutor.holdQuiz().then(() => { if (done) return; t0 = performance.now(); raf = requestAnimationFrame(tick); }); }
    else raf = requestAnimationFrame(tick);
    const retryNow = pos => {
      retried = true; firstPick = q.options[order[pos]];
      const b = $('#q-opts').children[pos]; b.disabled = true; b.classList.add('wrong');
      Sound.wrong(); setTimeout(() => Sound.skill(), 250);
      floatText(b, `【${sk.name}】再答一次`, 'skill');
    };
    /* a server question: send the pick and wait for the verdict (the timer keeps running for a retry) */
    const finish = pos => {
      if (done || waiting) return;
      if (!srv) {
        if (qz.retry && !retried && pos !== -1 && pos !== correctPos) return retryNow(pos);
        return settle(pos);
      }
      waiting = true;
      const btns = [...$('#q-opts').children], was = btns.map(b => b.disabled);
      btns.forEach(b => { b.disabled = true; }); if (pos >= 0) btns[pos].classList.add('picked');
      const at = performance.now();
      Online.sendAnswer(srv.n, pos).then(r => {
        waiting = false; if (pos >= 0) btns[pos].classList.remove('picked');
        if (done) return;
        if (r && r.retry && !retried) { btns.forEach((b, i) => { b.disabled = was[i]; }); return retryNow(pos); }
        if (r && Number.isInteger(r.answer)) { q.answer = r.answer; q.explain = r.explain || ''; correctPos = r.answer; }
        else { lost = true; correctPos = -2; }                            // no verdict: counted as wrong
        settle(pos, at);
      });
    };
    const settle = (pos, at = performance.now()) => {
      done = true; cancelAnimationFrame(raf); Tutor.onAnswered();
      const time = Math.min((at - t0) / 1000, limit);
      const correct = pos !== -1 && pos === correctPos;
      [...$('#q-opts').children].forEach((b, i) => { b.disabled = true; if (i === correctPos) b.classList.add('right'); else if (i === pos) b.classList.add('wrong'); });
      G.stats.total++; const bc = G.stats.byCat[q.category] || (G.stats.byCat[q.category] = { t: 0, c: 0 }); bc.t++;
      const answerText = q.answer >= 0 ? q.options[q.answer] : '（連線中斷，無法取得正解）';
      if (correct) { G.stats.correct++; bc.c++; G.streak++; } else { G.streak = 0; G.missed.push({ q: q.q, a: answerText, e: q.explain, cat: q.category }); }
      G.maxStreak = Math.max(G.maxStreak, G.streak);
      const nbBefore = !!(NB[q.id] && !NB[q.id].mastered);
      let nbRes = null;
      if (!lost) { nbRes = nbRecord(q, correct && !retried, correct ? firstPick : pos === -1 ? (firstPick ?? '') : q.options[order[pos]]); if (!srv) qsRecord(q, correct && !retried); }
      if (!(correct && !retried) && !nbBefore && !lost) G.nbAdded = (G.nbAdded || 0) + 1;
      if (!srv && (builtinSet || (builtinSet = new Set(BUILTIN))).has(q)) Usage.question(q.id, pos === -1 ? -1 : order[pos], q.answer);
      if (G.mode === 'ranked' && !srv) (G.answerLog || (G.answerLog = [])).push({ qid: q.id, pick: pos === -1 ? -1 : order[pos], ms: Math.round(time * 1000), mode });   // judged again by the server
      G.history.push({ turn: G.turn, mode, card: m.name, cat: q.category, diff: q.difficulty, q: q.q,
        chosen: pos === -1 ? null : q.options[order[pos]], answer: answerText, correct, time, timeout: pos === -1, explain: q.explain, retried, fromNb });
      renderStreak();
      correct ? Sound.correct() : Sound.wrong();
      const fb = $('#q-feedback'); fb.hidden = false; fb.classList.toggle('no', !correct);
      const tLabel = pos === -1 ? '時間到' : `${time.toFixed(1)} 秒${retried ? ' · 第二次作答' : ''}`;
      $('#q-verdict').innerHTML = (correct ? '正解！' : '不正解') + `<small>${tLabel}</small>`;
      $('#q-explain').textContent = lost ? '連線中斷，伺服器沒有回覆這題的判定，這題以答錯計算。' : q.explain || `正確答案：${answerText}`;
      showAsOf(q);
      Tutor.onFeedback();
      resetReport(q);
      const note = { new: '已加入錯題本', down: '錯題本：退回第 1 階，稍後再複習', again: '錯題本：留在第 1 階，稍後再複習' }[nbRes];
      if (note) $('#q-explain').insertAdjacentHTML('beforeend', `<span class="nb-note">${note}</span>`);
      else if (nbRes === 'mastered' || nbRes === 'up') $('#q-explain').insertAdjacentHTML('beforeend', `<span class="nb-note ok">${nbRes === 'mastered' ? '錯題本：已掌握！' : `錯題本：升到第 ${NB[q.id].box} 階`}</span>`);
      else if (nbRes === 'early') $('#q-explain').insertAdjacentHTML('beforeend', `<span class="nb-note ok">錯題本：還沒到複習日，階段不變</span>`);
      const cont = $('#q-continue'); cont.textContent = correct ? (mode === 'attack' ? '發動攻擊 ▶' : '展開防禦 ▶') : '繼續 ▶';
      cont.focus({ preventScroll: true });
      setQuizState({ resolveNow: () => { $('#quiz').hidden = true; setQuizState(null); Tutor.onQuizClosed(); Sound.duck(false); resolve({ correct, time, left: limit - time, retried }); } });
    };
    $('#q-opts').onclick = e => { const b = e.target.closest('.q-opt'); if (b && !b.disabled) finish(Number(b.dataset.i)); };
    setQuizState({ pick: i => { const b = $('#q-opts').children[i]; if (b && !b.disabled) finish(i); }, cancel: () => { done = true; cancelAnimationFrame(raf); } });
  });
}

export function init() {
$('#q-continue').addEventListener('click', () => quizState?.resolveNow?.());
document.addEventListener('keydown', e => {
  if ($('#quiz').hidden || !quizState) return;
  if (quizState.pick && /^[1-6]$/.test(e.key)) { e.preventDefault(); quizState.pick(Number(e.key) - 1); }
  else if (quizState.resolveNow && e.key === 'Enter' && document.activeElement !== $('#q-continue') && !/^(TEXTAREA|INPUT|BUTTON)$/.test(document.activeElement?.tagName || '')) { e.preventDefault(); quizState.resolveNow(); }
});
}

export { ask };
