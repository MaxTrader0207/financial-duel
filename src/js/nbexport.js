// nbexport.js — 錯題本輸出: the notebook as a printable PDF (study sheet with answers, or a self-test with the answer key
// at the end) or as a CSV that opens in Excel / Google Sheets. Uses the current attribute filter; mastered questions
// are included only when asked for.
import { CATS } from './cards.js';
import { $ } from './core.js';
import { DIFF_LABEL } from './rules.js';
import { nbEntries, nbCat, fmtDay } from './notebook.js';
import { downloadsP, wrapText, pad2 } from './report.js';
import { loadJsPDF } from './jspdf.js';

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PW = 1240, PH = 1754, MX = 90, MW = PW - MX * 2, TOP = 110, BOTTOM = PH - 100;   // A4 at 150 dpi
const SANS = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif', SERIF = '"FD Serif","Noto Serif TC","Songti TC",serif';
const f = (w, s, fam = SANS) => `${w} ${s}px ${fam}`;
const INK = '#1d2140', MUTED = '#6b7090', LINE = '#d9dbe8', GOLD = '#a77d22';

/* the questions to export, in the same order as the screen (due first, most mistakes first) */
export function exportList({ cat = nbCat, mastered = false } = {}) {
  return nbEntries().filter(x => (cat === 'all' || x.q.category === cat) && (mastered || !x.e.mastered))
    .sort((a, b) => Number(a.e.mastered) - Number(b.e.mastered) || a.e.due - b.e.due || b.e.wrong - a.e.wrong);
}
/* options in a fixed per-question order (seeded by the id): the bank often lists the right answer first, and a
   printed test should not have every answer at A. The same question always prints the same way. */
export function arranged(q) {
  let h = 2166136261; for (const ch of q.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const j = h % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return { options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
}
const status = e => (e.mastered ? `已掌握（${fmtDay(e.last)}）` : `第 ${e.box} 階 · ${e.due <= Date.now() ? '現在可複習' : `${Math.ceil((e.due - Date.now()) / 864e5)} 天後複習`}`);
const stamp = (d = new Date()) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;

/* ---------- CSV (UTF-8 with BOM so Excel shows Chinese correctly) ---------- */
export function toCSV(list) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  const head = ['屬性', '難度', '題目', '選項A', '選項B', '選項C', '選項D', '正確答案', '解說', '答錯次數', '答對次數', '狀態', '加入日期'];
  const rows = list.map(({ q, e }) => { const a = arranged(q); return [CATS[q.category] ? CATS[q.category].name : q.category, DIFF_LABEL[q.difficulty] || '', q.q,
    ...[0, 1, 2, 3].map(i => a.options[i] || ''), `${KEYS[a.answer]}. ${a.options[a.answer]}`, q.explain || '', e.wrong, e.right, status(e),
    e.added ? new Date(e.added).toLocaleDateString('zh-TW') : '']; });
  return '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
}

/* ---------- PDF pages drawn on canvases ---------- */
function newPage(pages, title, n) {
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, PW, PH);
  x.fillStyle = MUTED; x.font = f(400, 20); x.textBaseline = 'alphabetic';
  x.fillText(`金融決鬥 · ${title}`, MX, 60); x.textAlign = 'right'; x.fillText(`第 ${n} 頁`, PW - MX, 60); x.textAlign = 'left';
  x.strokeStyle = LINE; x.lineWidth = 2; x.beginPath(); x.moveTo(MX, 76); x.lineTo(PW - MX, 76); x.stroke();
  pages.push(c); return x;
}
/* lay out blocks (each: measure(ctx) → height, draw(ctx, y)) onto as many pages as needed */
function paginate(blocks, title, before = 0) {
  const pages = []; let x = newPage(pages, title, before + 1), y = TOP;
  for (const b of blocks) {
    const h = b.measure(x);
    if (y + h > BOTTOM && y > TOP) { x = newPage(pages, title, before + pages.length + 1); y = TOP; }
    b.draw(x, y); y += h;
  }
  return pages;
}
function textBlock(text, font, color, gap = 10, indent = 0, lh = 1.5) {
  let lines = [];
  const size = Number(/(\d+)px/.exec(font)[1]);
  return {
    measure(x) {
      x.font = font; lines = wrapText(x, text, MW - indent);
      for (let i = 1; i < lines.length; i++) while (/^[，。、；：！？」』）%]/.test(lines[i]) && lines[i].length) { lines[i - 1] += lines[i][0]; lines[i] = lines[i].slice(1); }   // no line starts with closing punctuation
      lines = lines.filter(l => l.length);
      return lines.length * size * lh + gap;
    },
    draw(x, y) { x.font = font; x.fillStyle = color; x.textBaseline = 'top'; lines.forEach((l, i) => x.fillText(l, MX + indent, y + i * size * lh)); },
  };
}
function questionBlocks({ q, e }, i, withAnswers) {
  const a = arranged(q);
  const cat = CATS[q.category] || { name: q.category, color: '#888' };
  const parts = [
    { measure: () => 46, draw(x, y) {
      x.fillStyle = cat.color; x.fillRect(MX, y, 8, 34);
      x.fillStyle = INK; x.font = f(700, 26, SERIF); x.textBaseline = 'top'; x.fillText(`第 ${i + 1} 題`, MX + 20, y + 2);
      x.font = f(400, 20); x.fillStyle = MUTED; x.fillText(`${cat.name} · ${DIFF_LABEL[q.difficulty] || ''} · 答錯 ${e.wrong} 次 · ${status(e)}`, MX + 150, y + 7);
    } },
    textBlock(q.q, f(700, 28), INK, 12),
    ...a.options.map((o, k) => textBlock(`${KEYS[k]}. ${o}`, f(withAnswers && k === a.answer ? 700 : 400, 24), withAnswers && k === a.answer ? GOLD : INK, 6, 24)),
  ];
  if (withAnswers) {
    parts.push(textBlock(`正解：${KEYS[a.answer]}. ${a.options[a.answer]}`, f(700, 24), GOLD, 6, 0));
    if (q.explain) parts.push(textBlock(`解說：${q.explain}`, f(400, 22), MUTED, 6, 0));
  } else parts.push(textBlock('作答：＿＿＿＿', f(400, 22), MUTED, 6, 24));
  parts.push({ measure: () => 34, draw(x, y) { x.strokeStyle = LINE; x.lineWidth = 1.5; x.beginPath(); x.moveTo(MX, y + 14); x.lineTo(PW - MX, y + 14); x.stroke(); } });
  /* keep a question together: one block that measures and draws all parts */
  let hs = [];
  return { measure(x) { hs = parts.map(p => p.measure(x)); return hs.reduce((a, b) => a + b, 0); },
    draw(x, y) { let yy = y; parts.forEach((p, k) => { p.draw(x, yy); yy += hs[k]; }); } };
}
export async function buildPages(list, kind) {
  const quiz = kind === 'quiz', title = quiz ? '錯題測驗卷' : '錯題複習講義';
  try { await Promise.all([document.fonts.load(f(700, 28, SERIF), '第題錯題本'), document.fonts.load(f(400, 22), '解說正解')]); } catch { /* fonts optional */ }
  const d = new Date(), catName = nbCat === 'all' ? '全部屬性' : (CATS[nbCat] ? CATS[nbCat].name : nbCat);
  const blocks = [
    { measure: () => 120, draw(x, y) { x.fillStyle = INK; x.font = f(700, 48, SERIF); x.textBaseline = 'top'; x.fillText(title, MX, y);
      x.font = f(400, 22); x.fillStyle = MUTED; x.fillText(`${d.toLocaleDateString('zh-TW')} 輸出 · ${catName} · 共 ${list.length} 題${quiz ? ' · 答案在最後' : ''}`, MX, y + 66); } },
    ...list.map((x, i) => questionBlocks(x, i, !quiz)),
  ];
  if (quiz) {
    const pages = paginate(blocks, title);                       // the answer key starts on its own page
    const key = [textBlock('解答', f(700, 40, SERIF), INK, 20),
      ...list.map(({ q }, i) => { const a = arranged(q); return textBlock(`${i + 1}. ${KEYS[a.answer]}　${a.options[a.answer]}${q.explain ? `　— ${q.explain}` : ''}`, f(400, 22), INK, 10); })];
    const more = paginate(key, `${title}・解答`, pages.length);
    return [...pages, ...more];
  }
  return paginate(blocks, title);
}

/* ---------- saving ---------- */
async function save(data, filename) {
  const dl = await downloadsP;
  if (dl) return dl.save({ filename, data });
  const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
export async function exportNotebook(kind, btn) {
  const st = $('#nb-export-status');
  const say = (cls, t) => { st.className = 'status' + (cls ? ' ' + cls : ''); st.textContent = t; };
  const list = exportList({ mastered: $('#nb-export-mastered').checked });
  if (!list.length) { say('err', '目前沒有可以輸出的錯題（可以勾選「包含已掌握」或換一個屬性）。'); return; }
  if (btn) btn.disabled = true;
  try {
    if (kind === 'csv') {
      const name = `financial-duel-notebook-${stamp()}.csv`;
      await save(new Blob([toCSV(list)], { type: 'text/csv;charset=utf-8' }), name);
      say('ok', `已輸出 ${name}（${list.length} 題），可以用 Excel 或 Google 試算表開啟。`); return;
    }
    say('', '正在產生 PDF…');
    const JsPDF = await loadJsPDF();
    const pages = await buildPages(list, kind);
    const doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
    pages.forEach((c, i) => { if (i) doc.addPage(); doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 595.28, 841.89); });
    doc.setProperties({ title: kind === 'quiz' ? '金融決鬥 錯題測驗卷' : '金融決鬥 錯題複習講義' });
    const name = `financial-duel-notebook-${kind === 'quiz' ? 'quiz' : 'notes'}-${stamp()}.pdf`;
    await save(doc.output('blob'), name);
    say('ok', `已輸出 ${name}（${list.length} 題，共 ${pages.length} 頁）`);
  } catch (e) {
    say(e && e.code === 'declined' ? '' : 'err', e && e.code === 'declined' ? '已取消儲存。' : '輸出失敗：' + ((e && e.message) || '未知錯誤'));
  } finally { if (btn) btn.disabled = false; }
}

export function init() {
  $('#nb-export-pdf').onclick = e => exportNotebook('notes', e.currentTarget);
  $('#nb-export-quiz').onclick = e => exportNotebook('quiz', e.currentTarget);
  $('#nb-export-csv').onclick = e => exportNotebook('csv', e.currentTarget);
}
