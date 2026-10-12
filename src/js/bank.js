// bank.js — the question bank: built-in questions from questions.json plus the player's own imported ones, normalised to one shape.
import { CATS, CAT_ALIAS } from './cards.js';
import { $, Store, esc } from './core.js';
import { DATA } from './data.js';

let STORE_KEY, BUILTIN, CUSTOM_V, customMem;

function setCustomQuestions(v) { customMem = v; }
function loadCustom() { return Store.load(STORE_KEY, { version: CUSTOM_V, fallback: () => [], validate: Array.isArray }); }
function saveCustom() { return Store.trySave(STORE_KEY, CUSTOM_V, customMem); }
function allQuestions() {
  const map = new Map();
  BUILTIN.forEach(q => map.set(q.id, q));
  customMem.forEach(q => map.set(q.id, q));
  return [...map.values()];
}
function normalizeQ(raw, i = 0) {
  if (!raw || typeof raw !== 'object') return { err: `第 ${i + 1} 筆不是物件` };
  let cat = String(raw.category ?? raw.cat ?? '').trim();
  if (!CATS[cat]) cat = CAT_ALIAS[cat] || '';
  if (!cat) return { err: `第 ${i + 1} 筆的 category 無法辨識（${esc(raw.category ?? '空白')}）` };
  const text = String(raw.q ?? raw.question ?? '').trim();
  if (!text) return { err: `第 ${i + 1} 筆缺少題目 q` };
  const opts = Array.isArray(raw.options) ? raw.options.map(o => String(o).trim()).filter(Boolean) : [];
  if (opts.length < 2 || opts.length > 6) return { err: `第 ${i + 1} 筆的 options 需要 2–6 個選項` };
  const ans = Number(raw.answer);
  if (!Number.isInteger(ans) || ans < 0 || ans >= opts.length) return { err: `第 ${i + 1} 筆的 answer 超出選項範圍（從 0 開始）` };
  let diff = Number(raw.difficulty ?? 1); if (![1, 2, 3].includes(diff)) diff = 1;
  let id = String(raw.id ?? '').trim();
  if (!id) { let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0; id = 'c-' + h.toString(36); }
  const out = { id, category: cat, difficulty: diff, q: text, options: opts, answer: ans, explain: String(raw.explain ?? '').trim() };
  if (raw.asOf) out.asOf = String(raw.asOf).slice(0, 20);
  if (raw.reviewBy) out.reviewBy = String(raw.reviewBy).slice(0, 20);
  return { q: out };
}

export function init() {
/* ---------- question bank ---------- */
STORE_KEY = 'soba-ketto.custom-bank.v1';
/* built-in questions live in public/data/questions.json (loaded at start-up) */
BUILTIN = DATA.questions.questions.map(q => normalizeQ(q).q);
CUSTOM_V = 1;
customMem = loadCustom();
}

export { BUILTIN, CUSTOM_V, STORE_KEY, setCustomQuestions, allQuestions, customMem, loadCustom, normalizeQ, saveCustom };
