// quiz.js — choosing questions: by attribute and card rank, never asked before first, due notebook questions mixed in, and the opponent's block question.
import { allQuestions, BUILTIN } from './bank.js';
import { nbDueList } from './notebook.js';
import { G } from './game.js';
import { QS } from './records.js';

let NB_MIX, quizState;

   // chance that a due notebook question replaces a fresh one
/* ranked duels use the built-in bank only: the server judges ranked answers against its copy of it,
   and custom questions (題庫管理) could otherwise make ranked easier */
const bankFor = () => (G.mode === 'ranked' ? BUILTIN : allQuestions());
function pickQuestion(cat, rank) {
  G.lastFromNb = false;
  const builtinIds = G.mode === 'ranked' ? new Set(BUILTIN.map(q => q.id)) : null;
  const due = nbDueList(cat).filter(q => !G.used.has(q.id) && (!builtinIds || builtinIds.has(q.id)));
  if (due.length && Math.random() < NB_MIX) {
    const q = due[Math.floor(Math.random() * due.length)];
    G.used.add(q.id); G.lastFromNb = true; if (import.meta.env.MODE === 'test') window.__lastQ = q; return q;
  }
  const pool = bankFor().filter(q => q.category === cat);
  const src = pool.length ? pool : bankFor();
  const pref = G.tutorial ? [1] : { 1: [1], 2: [1, 2], 3: [2], 4: [3, 2] }[rank] || [1, 2, 3];   // the tutorial asks 初階 only
  let cand = src.filter(q => pref.includes(q.difficulty) && !G.used.has(q.id));
  if (!cand.length) cand = src.filter(q => !G.used.has(q.id));
  if (!cand.length) { src.forEach(q => G.used.delete(q.id)); cand = src.slice(); }
  const q = freshPick(cand, QS);
  G.used.add(q.id); if (import.meta.env.MODE === 'test') window.__lastQ = q; return q;
}
/* the opponent's block question: same attribute and level rule as ours. It never touches the learning record;
   it is marked used so we are not asked the same one (with the answer just shown) later in this duel. */
function foeQuestion(cat, rank) {
  const src = allQuestions().filter(q => q.category === cat);
  const pool = src.length ? src : allQuestions();
  if (!pool.length) return null;
  const pref = { 1: [1], 2: [1, 2], 3: [2], 4: [3, 2] }[rank] || [1, 2, 3];
  let cand = pool.filter(q => pref.includes(q.difficulty) && !G.used.has(q.id));
  if (!cand.length) cand = pool.filter(q => !G.used.has(q.id));
  if (!cand.length) cand = pool;
  const q = cand[Math.floor(Math.random() * cand.length)];
  G.used.add(q.id); return q;
}
/* across duels, prefer questions you have never been asked; once all have been seen, the ones seen least
   and longest ago (QS = per-question history kept by the learning record) */
function freshPick(cand, qs = {}) {
  const seen = q => (qs[q.id] && qs[q.id].t) || 0, last = q => (qs[q.id] && qs[q.id].last) || 0;
  const minT = Math.min(...cand.map(seen));
  let pool = cand.filter(q => seen(q) === minT);
  if (minT > 0 && pool.length > 3) pool = pool.sort((a, b) => last(a) - last(b)).slice(0, Math.max(3, Math.ceil(pool.length * 0.3)));
  return pool[Math.floor(Math.random() * pool.length)];
}
function setQuizState(v) { quizState = v; }

export function init() {
/* ---------- quiz ---------- */
NB_MIX = 0.35;
quizState = null;
}

export { foeQuestion, freshPick, NB_MIX, setQuizState, pickQuestion, quizState };
