// pool.js — 排位賽的題目來源（伺服器出題）。
// Three sources, all answered on the server so the browser never holds the answer before it picks:
//   tpl  — calculation templates (templates.js): new numbers every time, the answer must be worked out
//   pool — the private question bank (pool/pool.enc.json, decrypted at deploy into pool.gen.json); not public
//   pub  — the public built-in bank (public/data/questions.json), used only when the private bank is empty
// With the private bank: 40% templates, 60% private. Without it: 50% templates, 50% public.
import BANK from '../../public/data/questions.json';
import POOL from './pool.gen.json';
import { TEMPLATES, make, templateById } from './templates.js';

const PUB = BANK.questions || [], PRIV = POOL.questions || [];
const byId = new Map([...PUB, ...PRIV].map(q => [q.id, q]));
export const poolSize = () => PRIV.length;
/* any question the server can ask, by id (templates as 'tpl:<id>') — for the statistics page */
export function questionInfo(qid) {
  if (qid.startsWith('tpl:')) { const t = templateById(qid.slice(4)); return t ? { q: `【計算題】${t.title}`, category: t.cat, difficulty: t.diff, options: null, answer: null, src: 'tpl' } : null; }
  const q = byId.get(qid); return q ? { ...q, src: qid.startsWith('p-') ? 'pool' : 'pub' } : null;
}

/* card rank → preferred difficulties (the same rule as the game's quiz.js) */
export const PREF = { 1: [1], 2: [1, 2], 3: [2], 4: [3, 2] };
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* choose and build one question. used: Set of qids already asked this duel (templates count once per id).
   → { qid, src, category, difficulty, q, options (display order), answer (display index), explain, orig (bank order of the
   display options, for the statistics; null for templates) } */
export function draw(cat, rank, used, rnd = Math.random) {
  const pref = PREF[rank] || [1, 2, 3];
  const wantTpl = rnd() < (PRIV.length ? 0.4 : 0.5);
  const fixed = (PRIV.length ? PRIV : PUB).filter(q => q.category === cat && !used.has(q.id));
  const tpls = TEMPLATES.filter(t => t.cat === cat && !used.has('tpl:' + t.id));
  const fromFixed = () => {
    const c = fixed.filter(q => pref.includes(q.difficulty)), list = c.length ? c : fixed;
    if (!list.length) return null;
    const b = list[Math.floor(rnd() * list.length)], order = shuffle([0, 1, 2, 3].slice(0, b.options.length), rnd);
    return { qid: b.id, src: PRIV.length ? 'pool' : 'pub', category: b.category, difficulty: b.difficulty, q: b.q,
      options: order.map(i => b.options[i]), answer: order.indexOf(b.answer), explain: b.explain || '', orig: order };
  };
  const fromTpl = () => {
    const c = tpls.filter(t => pref.includes(t.diff)), list = c.length ? c : tpls;
    if (!list.length) return null;
    const t = list[Math.floor(rnd() * list.length)], x = make(t, rnd);
    if (!x) return null;
    const order = shuffle([0, 1, 2, 3], rnd);
    return { qid: 'tpl:' + t.id, src: 'tpl', category: t.cat, difficulty: t.diff, q: x.q,
      options: order.map(i => x.options[i]), answer: order.indexOf(0), explain: x.explain, orig: null };
  };
  let out = wantTpl ? fromTpl() || fromFixed() : fromFixed() || fromTpl();
  if (!out) {                                       // every question of this attribute was used: allow repeats
    const again = new Set([...used].filter(id => !id.startsWith('tpl:') && byId.get(id)?.category !== cat && !TEMPLATES.some(t => 'tpl:' + t.id === id && t.cat === cat)));
    return draw(cat, rank, again, rnd);
  }
  return out;
}
