// judge.js — the server's own judgement of a ranked duel's answers.
// The game sends, with the result, every question it asked (id from the built-in bank), the option picked (index in
// the bank's own order, −1 = time ran out), the answer time and whether it was an attack or a block. The server
// checks each pick against its copy of the bank (the same public/data/questions.json the game ships), so the
// knowledge part of the performance score — and whether a win is plausible at all — no longer comes from the browser.
// Custom questions from the 題庫管理 screen are never used in ranked duels for the same reason.
import BANK from '../../public/data/questions.json';

const Q = new Map((BANK.questions || []).map(q => [q.id, q]));
export const MAX_ANSWERS = 150, MIN_MS = 400, MIN_RIGHT_FOR_WIN = 2;
export const hasQuestion = id => Q.has(id);
export const questionById = id => Q.get(id) || null;

/* → { total, correct, knowledge (0–40) } or { error } */
export function judge(answers, { elapsed, win }) {
  if (!Array.isArray(answers) || !answers.length) return { error: '缺少作答紀錄，請更新遊戲後再試' };
  if (answers.length > MAX_ANSWERS) return { error: '作答紀錄不正確' };
  let correct = 0, sumMs = 0;
  for (const a of answers) {
    if (!a || typeof a.qid !== 'string' || !Q.has(a.qid)) return { error: '作答紀錄包含不存在的題目' };
    if (!Number.isInteger(a.pick) || a.pick < -1 || a.pick > 3) return { error: '作答紀錄不正確' };
    if (!Number.isInteger(a.ms) || a.ms < 0 || a.ms > 60000) return { error: '作答紀錄不正確' };
    if (a.pick !== -1 && a.ms < MIN_MS) return { error: '作答速度不合理，這場不列入排行榜' };
    sumMs += a.ms;
    if (a.pick === Q.get(a.qid).answer) correct++;
  }
  if (sumMs > elapsed + 5000) return { error: '作答時間和對戰時間對不上，這場不列入排行榜' };
  if (win && correct < MIN_RIGHT_FOR_WIN) return { error: '這場的作答紀錄不足以獲勝，不列入排行榜' };
  return { total: answers.length, correct, knowledge: Math.round(correct / answers.length * 40) };
}
