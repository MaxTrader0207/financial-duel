// report.js — the duel report exported as PNG or PDF (drawn on a canvas; PDF through jsPDF).
import { DIFF_LABEL } from './rules.js';
import { CATS } from './cards.js';
import { $, LP_MAX } from './core.js';

import { G } from './game.js';
import { loadJsPDF } from './jspdf.js';

let downloadsP, RC, RF, fnt, RW, RM_X, RCW, R_TOP, pad2, fmtDate, fmtNum, exporting;

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(fnt(800, 40, RF.mincho), '金融決鬥'),
      document.fonts.load(fnt(800, 120, RF.mincho), '勝利敗北決勝'),
      document.fonts.load(fnt(900, 28, RF.name), '答題紀錄各屬性表現'),
      document.fonts.load(fnt(700, 22, RF.body), '技術分析答對'),
      document.fonts.load(fnt(400, 18, RF.body), '正解解析'),
    ]);
    await document.fonts.ready;
  } catch (e) {}
}
function wrapText(ctx, text, maxW) {
  const tokens = String(text).match(/[A-Za-z0-9.,%()+\-−×÷/=:'"_&]+|\s+|[^\s]/gu) || [];
  const lines = []; let line = '';
  for (const tk of tokens) {
    const t = line + tk;
    if (ctx.measureText(t).width <= maxW) { line = t; continue; }
    if (line.trim()) { lines.push(line.trimEnd()); line = tk.trim() ? tk : ''; }
    else line = tk;
    while (ctx.measureText(line).width > maxW && line.length > 1) {
      let i = line.length; while (i > 1 && ctx.measureText(line.slice(0, i)).width > maxW) i--;
      lines.push(line.slice(0, i)); line = line.slice(i);
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.length ? lines : [''];
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawBackground(ctx, W, H) {
  ctx.fillStyle = RC.ink; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = RC.wave; ctx.lineWidth = 2;
  const R = 34;
  for (let row = 0, y = 0; y < H + R; row++, y += R * 0.5) {
    for (let x = (row % 2) * R - R; x < W + R; x += R * 2) {
      for (const r of [R, R * 0.68, R * 0.36]) { ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 2 * Math.PI); ctx.stroke(); }
    }
  }
  ctx.strokeStyle = RC.gold; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5; ctx.strokeRect(24, 24, W - 48, H - 48); ctx.globalAlpha = 1;
}
function sectionBlock(title) {
  return { h: 52, keepNext: true, draw(ctx, x, y) {
    ctx.save(); ctx.translate(x + 8, y + 24); ctx.rotate(Math.PI / 4); ctx.fillStyle = RC.gold; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
    ctx.fillStyle = RC.washi; ctx.font = fnt(900, 28, RF.name); ctx.textBaseline = 'middle'; ctx.fillText(title, x + 28, y + 25);
    ctx.strokeStyle = RC.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 50); ctx.lineTo(x + RCW, y + 50); ctx.stroke();
  } };
}
function buildReportBlocks(m) {
  const s = G.stats, pct = s.total ? Math.round(s.correct / s.total * 100) : 0;
  const timed = G.history.filter(h => !h.timeout);
  const avg = timed.length ? timed.reduce((a, h) => a + h.time, 0) / timed.length : 0;
  const blocks = [];
  // header
  blocks.push({ h: 330, draw(ctx, x, y) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = RC.gold; ctx.font = fnt(700, 16); ctx.fillText('金融知識卡牌對決 · 對戰紀錄', x, y + 18);
    ctx.fillStyle = RC.goldHi; ctx.font = fnt(800, 44, RF.mincho); ctx.fillText('金融決鬥', x, y + 72);
    ctx.textAlign = 'right'; ctx.fillStyle = RC.muted; ctx.font = fnt(400, 18);
    ctx.fillText(fmtDate(G.endedAt || new Date()), x + RCW, y + 26);
    ctx.fillText(`難易度 ${G.diff.name}（每題 ${G.diff.time} 秒 · 對手攻擊 ×${(G.diff.foeMult || 1).toFixed(1)}）`, x + RCW, y + 52);
    ctx.fillText(`共 ${G.turn} 回合 · ${s.total} 題`, x + RCW, y + 78);
    ctx.textAlign = 'left';
    const vy = y + 250, win = G.win;
    const word = win ? '勝利' : '敗北';
    ctx.fillStyle = win ? RC.gold : '#6b6782'; ctx.fillRect(x, vy - 128, 4, 150);
    ctx.font = fnt(800, 128, RF.mincho);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '14px';
    ctx.fillStyle = '#000000a0'; ctx.fillText(word, x + 26, vy + 4);
    const gr = ctx.createLinearGradient(0, vy - 120, 0, vy + 10);
    if (win) { gr.addColorStop(0, '#fff7de'); gr.addColorStop(.42, '#f3dc95'); gr.addColorStop(1, '#c8943a'); }
    else { gr.addColorStop(0, '#f2f0f8'); gr.addColorStop(.5, '#bdb8cf'); gr.addColorStop(1, '#7d7896'); }
    ctx.fillStyle = gr; ctx.fillText(word, x + 24, vy);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const lx = x + 400, lw = RCW - 400;
    [['我方資金', G.lp.p, RC.gold, y + 130], ['對手資金', G.lp.c, RC.shu, y + 220]].forEach(([label, v, col, ly]) => {
      ctx.fillStyle = RC.muted; ctx.font = fnt(400, 18); ctx.fillText(label, lx, ly);
      ctx.fillStyle = RC.text; ctx.font = fnt(900, 40, RF.jp); const vs = fmtNum(v); ctx.fillText(vs, lx, ly + 46);
      const vw = ctx.measureText(vs).width; ctx.fillStyle = RC.muted; ctx.font = fnt(400, 20); ctx.fillText(` / ${fmtNum(LP_MAX)}`, lx + vw + 4, ly + 46);
      ctx.fillStyle = RC.ink; ctx.fillRect(lx, ly + 58, lw, 10); ctx.strokeStyle = RC.line; ctx.lineWidth = 1; ctx.strokeRect(lx, ly + 58, lw, 10);
      ctx.fillStyle = col; ctx.fillRect(lx, ly + 58, lw * Math.max(0, v) / LP_MAX, 10);
    });
    ctx.strokeStyle = RC.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 318); ctx.lineTo(x + RCW, y + 318); ctx.stroke();
  } });
  // stat tiles
  const tiles = [['答對題數', `${s.correct} / ${s.total}`], ['正確率', `${pct}%`], ['最高連續答對', `${G.maxStreak}`],
                 ['造成傷害', fmtNum(G.dealt)], ['承受傷害', fmtNum(G.taken)], ['平均答題時間', `${avg.toFixed(1)} 秒`]];
  blocks.push({ h: 2 * 104 + 16, draw(ctx, x, y) {
    const tw = (RCW - 32) / 3;
    tiles.forEach(([l, v], i) => {
      const tx = x + (i % 3) * (tw + 16), ty = y + Math.floor(i / 3) * 120;
      ctx.fillStyle = RC.ink2; ctx.fillRect(tx, ty, tw, 104); ctx.strokeStyle = RC.line; ctx.lineWidth = 1; ctx.strokeRect(tx + .5, ty + .5, tw - 1, 103);
      ctx.fillStyle = RC.text; ctx.font = fnt(900, 36, RF.jp); ctx.textBaseline = 'alphabetic'; ctx.fillText(v, tx + 20, ty + 56);
      ctx.fillStyle = RC.muted; ctx.font = fnt(400, 16); ctx.fillText(l, tx + 20, ty + 86);
    });
  } });
  // category bars
  blocks.push(sectionBlock('各屬性表現'));
  const cats = Object.keys(CATS);
  blocks.push({ h: cats.length * 46, draw(ctx, x, y) {
    cats.forEach((k, i) => {
      const b = s.byCat[k], ry = y + i * 46 + 23;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = RC.cat[k]; ctx.fillRect(x, ry - 9, 18, 18);
      ctx.fillStyle = RC.text; ctx.font = fnt(700, 19); ctx.fillText(CATS[k].name, x + 30, ry);
      const tx = x + 190, tw = RCW - 190 - 130;
      ctx.fillStyle = RC.ink; ctx.fillRect(tx, ry - 7, tw, 14); ctx.strokeStyle = RC.line; ctx.strokeRect(tx, ry - 7, tw, 14);
      if (b) { ctx.fillStyle = RC.cat[k]; ctx.fillRect(tx, ry - 7, tw * b.c / b.t, 14); }
      ctx.textAlign = 'right'; ctx.fillStyle = RC.muted; ctx.font = fnt(400, 18);
      ctx.fillText(b ? `${b.c}/${b.t} · ${Math.round(b.c / b.t * 100)}%` : '未出題', x + RCW, ry); ctx.textAlign = 'left';
    });
    ctx.textBaseline = 'alphabetic';
  } });
  // history
  blocks.push(sectionBlock('答題紀錄'));
  if (!G.history.length) {
    blocks.push({ h: 40, draw(ctx, x, y) { ctx.fillStyle = RC.muted; ctx.font = fnt(400, 18); ctx.textBaseline = 'top'; ctx.fillText('這場沒有作答紀錄。', x, y + 8); ctx.textBaseline = 'alphabetic'; } });
  }
  const IN = 24, TW = RCW - IN * 2;
  G.history.forEach((h, i) => {
    m.font = fnt(700, 21); const qLines = wrapText(m, h.q, TW);
    const rows = [];
    if (h.correct) rows.push({ c: RC.good, t: `答案：${h.answer}` });
    else { rows.push({ c: RC.bad, t: h.timeout ? '你的答案：時間到，未作答' : `你的答案：${h.chosen}` }); rows.push({ c: RC.good, t: `正解：${h.answer}` }); }
    m.font = fnt(400, 18); rows.forEach(r => r.lines = wrapText(m, r.t, TW));
    const exLines = !h.correct && h.explain ? (m.font = fnt(400, 17), wrapText(m, h.explain, TW)) : [];
    const height = 20 + 28 + 12 + qLines.length * 31 + 8 + rows.reduce((a, r) => a + r.lines.length * 27, 0) + (exLines.length ? 10 + exLines.length * 26 : 0) + 18;
    blocks.push({ h: height, gap: 12, draw(ctx, x, y) {
      ctx.fillStyle = RC.ink2; ctx.fillRect(x, y, RCW, height);
      ctx.fillStyle = h.correct ? RC.good : RC.bad; ctx.fillRect(x, y, 5, height);
      let cy = y + 20; ctx.textBaseline = 'top';
      ctx.fillStyle = RC.gold; ctx.font = fnt(900, 20, RF.jp); ctx.fillText(`#${pad2(i + 1)}`, x + IN, cy + 2);
      let cx = x + IN + 64;
      ctx.font = fnt(700, 15); const chip = CATS[h.cat].name; const cw = ctx.measureText(chip).width + 18;
      ctx.fillStyle = RC.cat[h.cat]; ctx.fillRect(cx, cy, cw, 26); ctx.fillStyle = '#ffffff'; ctx.fillText(chip, cx + 9, cy + 4); cx += cw + 12;
      ctx.fillStyle = RC.muted; ctx.font = fnt(400, 16);
      const meta = `${h.mode === 'attack' ? '攻擊' : '防禦'} · 第 ${h.turn} 回合 · 【${h.card}】 · ${DIFF_LABEL[h.diff]}`;
      ctx.fillText(meta, cx, cy + 4);
      ctx.textAlign = 'right'; ctx.font = fnt(700, 17); ctx.fillStyle = h.correct ? RC.good : RC.bad;
      ctx.fillText(`${h.correct ? '正解' : (h.timeout ? '時間到' : '不正解')} · ${h.timeout ? '—' : h.time.toFixed(1) + ' 秒'}`, x + RCW - IN, cy + 4);
      ctx.textAlign = 'left';
      cy += 28 + 12;
      ctx.fillStyle = RC.text; ctx.font = fnt(700, 21); qLines.forEach(l => { ctx.fillText(l, x + IN, cy); cy += 31; });
      cy += 8;
      ctx.font = fnt(400, 18); rows.forEach(r => { ctx.fillStyle = r.c; r.lines.forEach(l => { ctx.fillText(l, x + IN, cy); cy += 27; }); });
      if (exLines.length) { cy += 10; ctx.fillStyle = RC.muted; ctx.font = fnt(400, 17); exLines.forEach(l => { ctx.fillText(l, x + IN, cy); cy += 26; }); }
      ctx.textBaseline = 'alphabetic';
    } });
  });
  return blocks;
}
function paginate(blocks, pageH) {
  const pages = []; let cur = [], y = R_TOP;
  const bottom = pageH ? pageH - 90 : Infinity, top2 = R_TOP + 40;
  blocks.forEach((b, i) => {
    const need = b.keepNext && blocks[i + 1] ? b.h + 18 + Math.min(blocks[i + 1].h, 200) : b.h;
    if (y + need > bottom && cur.length) { pages.push(cur); cur = []; y = top2; }
    cur.push({ b, y }); y += b.h + (b.gap ?? 22);
  });
  pages.push(cur);
  return { pages, endY: y };
}
function drawReportPage(items, idx, total, W, H, scale, paged) {
  const c = document.createElement('canvas'); c.width = Math.round(W * scale); c.height = Math.round(H * scale);
  const ctx = c.getContext('2d'); ctx.scale(scale, scale);
  drawBackground(ctx, W, H);
  if (idx > 0) { ctx.fillStyle = RC.muted; ctx.font = fnt(400, 16); ctx.textBaseline = 'alphabetic'; ctx.fillText(`金融決鬥 · 對戰紀錄（續）  ${fmtDate(G.endedAt || new Date())}`, RM_X, R_TOP + 6); }
  items.forEach(({ b, y }) => { ctx.save(); b.draw(ctx, RM_X, y); ctx.restore(); });
  ctx.fillStyle = RC.muted; ctx.font = fnt(400, 15); ctx.textBaseline = 'alphabetic';
  ctx.fillText('金融決鬥 · 金融知識卡牌對決', RM_X, H - 44);
  if (paged) { ctx.textAlign = 'right'; ctx.fillText(`${idx + 1} / ${total}`, W - RM_X, H - 44); ctx.textAlign = 'left'; }
  return c;
}
async function makeReport(kind) {
  await fontsReady();
  const m = document.createElement('canvas').getContext('2d');
  const blocks = buildReportBlocks(m);
  if (kind === 'png') {
    const { pages, endY } = paginate(blocks, null);
    const H = Math.ceil(endY + 70);
    return [drawReportPage(pages[0], 0, 1, RW, H, Math.min(2, 16000 / H), false)];
  }
  const H = Math.round(RW * Math.SQRT2);
  const { pages } = paginate(blocks, H);
  return pages.map((p, i) => drawReportPage(p, i, pages.length, RW, H, 2, true));
}
async function exportReport(kind, btn) {
  const st = $('#export-result-status');
  if (exporting || !G || G.win === null) return;
  const dl = await downloadsP;
  const standalone = !window.claude;
  if (!dl && !standalone) { st.className = 'status err'; st.textContent = '這個檢視畫面無法儲存檔案。請在 claude.ai 開啟此頁面後再輸出。'; return; }
  exporting = true; btn.disabled = true; st.className = 'status'; st.textContent = kind === 'pdf' ? '正在產生 PDF…' : '正在產生圖片…';
  try {
    const canvases = await makeReport(kind);
    const d = G.endedAt || new Date();
    const base = `soba-ketto-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}-${G.win ? 'win' : 'lose'}`;
    let data, filename;
    if (kind === 'png') {
      data = await new Promise((res, rej) => canvases[0].toBlob(b => b ? res(b) : rej(new Error('圖片產生失敗')), 'image/png'));
      filename = base + '.png';
    } else {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
      canvases.forEach((c, i) => { if (i) doc.addPage(); doc.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 595.28, 841.89); });
      doc.setProperties({ title: '金融決鬥 對戰紀錄' });
      data = doc.output('blob'); filename = base + '.pdf';
    }
    st.textContent = '請在確認視窗中選擇儲存。';
    if (dl) await dl.save({ filename, data });
    else { const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
    st.className = 'status ok'; st.textContent = `已輸出 ${filename}` + (kind === 'pdf' ? `（共 ${canvases.length} 頁）` : '');
  } catch (e) {
    const code = e && e.code;
    st.className = 'status' + (code === 'declined' ? '' : ' err');
    st.textContent = code === 'declined' ? '已取消儲存。' : code === 'rate_limited' ? '已有一個儲存視窗開啟中，請稍候再試。'
      : (code === 'unavailable' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') ? '這個檢視畫面無法儲存檔案。'
      : '輸出失敗：' + ((e && e.message) || code || '未知錯誤');
  } finally { exporting = false; btn.disabled = false; }
}

export function init() {
/* ---------- report export (canvas → PNG / PDF) ---------- */
downloadsP = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
RC = { ink: '#0d1230', ink2: '#161d48', ink3: '#222b64', line: '#3a4384', wave: '#19214f', washi: '#f1e8d3', gold: '#d8b25a', goldHi: '#f3dc95',
  shu: '#e14b32', text: '#eceaf6', muted: '#9ea4cc', good: '#4cc28e', bad: '#e8574a',
  cat: { tech: '#3f7fe0', fund: '#2f9e74', deriv: '#8d5ee0', risk: '#d8553a', chips: '#c3902e', fx: '#1f9fb3', crypto: '#d9467f', etf: '#6e9a2a', money: '#c24fc8' } };
RF = { mincho: '"FD Serif","Noto Serif TC",serif', jp: '"FD Sans","Noto Sans TC","PingFang TC",sans-serif', name: '"FD Serif","Noto Serif TC","Songti TC",serif', body: '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif' };
fnt = (w, s, fam = RF.body) => `${w} ${s}px ${fam}`;
RW = 1080;
RM_X = 64;
RCW = RW - RM_X * 2;
R_TOP = 64;
pad2 = n => String(n).padStart(2, '0');
fmtDate = d => `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
fmtNum = n => Math.round(n).toLocaleString('en-US');
exporting = false;
}

export { RC, RCW, RF, RM_X, RW, R_TOP, buildReportBlocks, downloadsP, drawBackground, drawReportPage, exportReport, exporting, fmtDate, fmtNum, fnt, fontsReady, makeReport, pad2, paginate, rrect, sectionBlock, wrapText };
