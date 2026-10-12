// records.js — the learning record: every finished duel, per-question history, lifetime accuracy per attribute and the weak attribute.
import { CATS } from './cards.js';
import { Store, isObj } from './core.js';
import { diffKeyOf } from './rules.js';
import { G } from './game.js';

let REC_KEY, QS_KEY, REC_MAX, REC_V, QS_V, RECS, QS, WEAK_MIN;

/* 「清除學習紀錄」: forget every finished duel and the per-question history */
function clearRecords() { RECS = []; QS = {}; recSave(); }
function recSave() { Store.trySave(REC_KEY, REC_V, RECS); Store.trySave(QS_KEY, QS_V, QS); }
function qsRecord(q, correct) { const e = QS[q.id] || (QS[q.id] = { t: 0, w: 0 }); e.t++; if (!correct) e.w++; e.last = Date.now(); recSave(); }
function recordGame(quit) {
  if (!G || G.recorded || !G.stats.total) return;
  G.recorded = true;
  RECS.push({ at: Date.now(), mode: G.mode || 'casual', diff: diffKeyOf(G.diff), win: !quit && !!G.win, quit: !!quit, turns: G.turn, total: G.stats.total, correct: G.stats.correct,
    byCat: JSON.parse(JSON.stringify(G.stats.byCat)), dealt: G.dealt, taken: G.taken, maxStreak: G.maxStreak });
  if (RECS.length > REC_MAX) RECS = RECS.slice(-REC_MAX);
  recSave();
}
/* lifetime answers per category, including the duel in progress */
function lifetimeByCat() {
  const out = Object.fromEntries(Object.keys(CATS).map(k => [k, { t: 0, c: 0 }]));
  RECS.forEach(r => Object.entries(r.byCat || {}).forEach(([k, v]) => { if (out[k]) { out[k].t += v.t; out[k].c += v.c; } }));
  if (G && !G.recorded && !G.over) Object.entries(G.stats.byCat).forEach(([k, v]) => { if (out[k]) { out[k].t += v.t; out[k].c += v.c; } });
  return out;
}
/* the category with the lowest lifetime accuracy (needs WEAK_MIN answers, and only counts if below 85%) */
function weakCat() {
  const b = lifetimeByCat();
  const cand = Object.keys(b).filter(k => b[k].t >= WEAK_MIN).sort((x, y) => b[x].c / b[x].t - b[y].c / b[y].t);
  if (!cand.length) return null;
  const k = cand[0]; return b[k].c / b[k].t < 0.85 ? k : null;
}
/* the opponent's estimate of the player's accuracy in a category (smoothed toward 70%) */
function catAccEst(cat) { const b = lifetimeByCat()[cat]; return (b.c + 3.5) / (b.t + 5); }

export function init() {
/* ---------- learning record (this browser only) ---------- */
REC_KEY = 'soba-ketto.records.v1';
QS_KEY = 'soba-ketto.qstats.v1';
REC_MAX = 300;
REC_V = 1;
QS_V = 1;
RECS = Store.load(REC_KEY, { version: REC_V, fallback: () => [], validate: Array.isArray });
QS = Store.load(QS_KEY, { version: QS_V, fallback: () => ({}), validate: isObj });
WEAK_MIN = 6;
}

export { clearRecords, QS, QS_KEY, QS_V, RECS, REC_KEY, REC_MAX, REC_V, WEAK_MIN, catAccEst, lifetimeByCat, qsRecord, recSave, recordGame, weakCat };
