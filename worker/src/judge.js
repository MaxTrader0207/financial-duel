// judge.js — the server's own judgement of a ranked duel's answers.
// Ranked questions are asked by the server (POST /v1/match/q, /v1/match/a in index.js): it picks the question,
// keeps the answer, times the reply and decides right or wrong, so those answers need no checking here.
// When a question could not be fetched (a dropped connection), the game asks one from its built-in bank instead and
// sends it with the result: id, option picked (bank order, −1 = time ran out), answer time, attack or block.
// Those are checked against the server's copy of the bank, and only a few are allowed per duel (LOCAL_MAX): the bank
// is public, so a duel answered mostly from it would be easy to fake.
import BANK from '../../public/data/questions.json';

const Q = new Map((BANK.questions || []).map(q => [q.id, q]));
export const MAX_ANSWERS = 150, MIN_MS = 400, MIN_RIGHT_FOR_WIN = 2, LOCAL_MAX = 3;
export const hasQuestion = id => Q.has(id);
export const questionById = id => Q.get(id) || null;

/* the browser's own (fallback) answers → { total, correct, sumMs } or { error } */
export function judgeLocal(answers) {
  if (answers === undefined || answers === null) answers = [];
  if (!Array.isArray(answers) || answers.length > MAX_ANSWERS) return { error: '作答紀錄不正確' };
  let correct = 0, sumMs = 0;
  for (const a of answers) {
    if (!a || typeof a.qid !== 'string' || !Q.has(a.qid)) return { error: '作答紀錄包含不存在的題目' };
    if (!Number.isInteger(a.pick) || a.pick < -1 || a.pick > 3) return { error: '作答紀錄不正確' };
    if (!Number.isInteger(a.ms) || a.ms < 0 || a.ms > 60000) return { error: '作答紀錄不正確' };
    if (a.pick !== -1 && a.ms < MIN_MS) return { error: '作答速度不合理，這場不列入排行榜' };
    sumMs += a.ms;
    if (a.pick === Q.get(a.qid).answer) correct++;
  }
  return { total: answers.length, correct, sumMs };
}

/* server-asked answers { total, correct, fast } + the browser's fallback answers → { total, correct, knowledge (0–40) } or { error } */
export function combine(server, answers, { elapsed, win }) {
  const local = judgeLocal(answers);
  if (local.error) return local;
  if (server.fast) return { error: '作答速度不合理，這場不列入排行榜' };
  if (local.total > LOCAL_MAX) return { error: server.total ? '這場有太多題目沒有經過伺服器出題（連線不穩），不列入排行榜' : '排位賽已改由伺服器出題，請重新整理頁面、更新遊戲後再試' };
  if (local.sumMs > elapsed + 5000) return { error: '作答時間和對戰時間對不上，這場不列入排行榜' };
  const total = server.total + local.total, correct = server.correct + local.correct;
  if (!total) return { error: '缺少作答紀錄，請更新遊戲後再試' };
  if (win && correct < MIN_RIGHT_FOR_WIN) return { error: '這場的作答紀錄不足以獲勝，不列入排行榜' };
  return { total, correct, knowledge: Math.round(correct / total * 40) };
}
