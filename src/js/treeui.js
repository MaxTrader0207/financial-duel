// treeui.js — the 卡牌技能族譜 screen and its exports.
// The screen shows the analysis of the saved deck (strengths, weaknesses, type-advantage coverage, skill families,
// what to collect next) and the family tree of all cards (attribute → skill family → card; owned, in the deck, missing).
// Exports: a tall PNG to share with friends (dark, like the game), and a printable PDF planning sheet (light, with
// tick boxes for the cards still to collect).
import { $, esc } from './core.js';
import { CATS, MON } from './carddata.js';
import { buildTree, FAMILIES, familyName } from './skilltree.js';
import { show } from './view.js';
import { Actions, register } from './actions.js';
import { renderTitle } from './screens.js';
import { openZoom } from './wiring.js';
import { downloadsP, wrapText, pad2 } from './report.js';
import { loadJsPDF } from './jspdf.js';
import { PUBLIC_URL } from './challenge.js';
import * as Daily from './daily.js';

let T = null;                                                   // the tree of the last render

/* ---------- screen ---------- */
const rarName = { 1: '普', 2: '稀', 3: '超', 4: '極' };
const pc = x => `${Math.round(x * 100)}%`;
function leafHTML(c) {
  return `<button type="button" class="tr-leaf${c.owned ? '' : ' missing'}${c.inDeck ? ' indeck' : ''}" data-id="${c.id}" style="--cc:${CATS[c.cat].color}">
    <span class="tr-sig">${esc(c.sigil)}</span><span class="tr-nm"><b>${esc(c.name)}</b><small>${rarName[c.rank]} · 【${esc(c.skill)}】</small></span>
    <em>${c.inDeck ? `牌組 ×${c.inDeck}` : c.owned ? '已收集' : '未收集'}</em></button>`;
}
export function openTree() {
  T = buildTree();
  const A = T.analysis;
  $('#tree-sum').innerHTML = [['收藏', `${A.owned}<small>/${A.total}</small>`], ['牌組', `${A.deckSize}<small> 張</small>`], ['排位點數', `${A.cost}<small>/80</small>`], ['平均攻／守', `${A.avgAtk}<small>／${A.avgDef}</small>`]]
    .map(([l, n]) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
  $('#tree-good').innerHTML = A.strengths.map(t => `<li>${esc(t)}</li>`).join('') || '<li>還看不出明顯的強項。</li>';
  $('#tree-bad').innerHTML = A.weaknesses.map(t => `<li>${esc(t)}</li>`).join('') || '<li>沒有明顯的弱點，組得很平衡。</li>';
  $('#tree-cats').innerHTML = `<table class="tr-table"><thead><tr><th>屬性</th><th>收藏</th><th>牌組</th><th>正確率</th><th>對手用它攻擊時</th></tr></thead><tbody>${T.clans.map(c => {
    const cov = A.cover.find(x => x.vs === c.cat), r = c.acc && c.acc.rate;
    return `<tr><td><i class="tr-dot" style="background:${CATS[c.cat].color}"></i>${esc(c.name)}</td><td>${c.owned}/${c.total}</td><td>${c.inDeck}</td>
      <td class="${r === null ? 'muted' : r < 0.6 ? 'bad' : r >= 0.85 ? 'good' : ''}">${r === null ? '—' : pc(r)}</td>
      <td class="${cov.n ? '' : 'bad'}">用「${esc(CATS[cov.by].name)}」防禦 ×1.5：${cov.n ? `牌組有 ${cov.n} 張` : '牌組沒有'}</td></tr>`; }).join('')}</tbody></table>`;
  const maxF = Math.max(1, ...A.families.map(f => f.n));
  $('#tree-fams').innerHTML = A.families.map(f => `<div class="catbar"><span>${esc(f.name)}</span><div class="track"><i style="width:${Math.round(f.n / maxF * 100)}%;background:var(--gold)"></i></div><span class="v">${f.n}</span></div>`).join('')
    + `<p class="muted tr-note">${FAMILIES.map(f => `${f.name}：${f.desc}`).join('；')}。</p>`;
  $('#tree-wish').innerHTML = A.wishlist.length ? A.wishlist.map(c => `<div class="tr-wish">${leafHTML(c)}<ul>${c.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>`).join('')
    : '<p class="lead">全部 180 張都收集齊了，可以出去朝聖了！</p>';
  $('#tree-body').innerHTML = T.clans.map(c => `<details class="tr-clan" style="--cc:${CATS[c.cat].color}" ${c.inDeck ? 'open' : ''}>
    <summary><span class="tr-badge">${CATS[c.cat].badge}</span><b>${esc(c.name)}</b><small>收藏 ${c.owned}/${c.total} · 牌組 ${c.inDeck} 張 · 剋制「${esc(CATS[c.beats].name)}」、被「${esc(CATS[c.beatenBy].name)}」剋制</small></summary>
    <div class="tr-fams">${c.families.map(f => `<div class="tr-fam"><div class="tr-famh">${esc(f.name)}<small>${f.cards.filter(x => x.owned).length}/${f.cards.length}</small></div>
      <div class="tr-leaves">${f.cards.map(leafHTML).join('')}</div></div>`).join('')}</div></details>`).join('');
  $('#tree-status').textContent = '';
  show('tree');
}

/* ---------- exports: blocks laid out on canvases ---------- */
const SANS = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif', SERIF = '"FD Serif","Noto Serif TC","Songti TC",serif';
const f = (w, s, fam = SANS) => `${w} ${s}px ${fam}`;
const THEMES = {
  dark: { bg: '#0f1530', panel: '#1a2150', ink: '#eef0f8', muted: '#9aa3c0', line: '#323c7a', gold: '#e7c873', bad: '#ff9c86', good: '#7fdcae', miss: '#5a6290' },
  light: { bg: '#ffffff', panel: '#f4f2ea', ink: '#1d2140', muted: '#6b7090', line: '#d9dbe8', gold: '#a77d22', bad: '#b0472f', good: '#2f7d4f', miss: '#b6b9cc' },
};
const CAT_HEX = { tech: '#3f7fe0', fund: '#2f9e74', deriv: '#8d5ee0', risk: '#d8553a', chips: '#c3902e', fx: '#1f9fb3', crypto: '#d9467f', etf: '#6e9a2a', money: '#c24fc8' };
const catHex = cat => CAT_HEX[cat] || '#888';
function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

/* blocks: { measure(ctx, W) → height, draw(ctx, y, W) } */
function textBlock(text, font, color, { gap = 10, indent = 0, lh = 1.45, key } = {}) {
  let lines = [];
  return { measure(x, W) { x.font = font; lines = wrapText(x, text, W - 2 * PAD - indent); return lines.length * size(font) * lh + gap; },
    draw(x, y, W, th) { x.font = font; x.fillStyle = th[color] || color; x.textBaseline = 'top'; lines.forEach((l, i) => x.fillText(l, PAD + indent, y + i * size(font) * lh)); } };
}
const PAD = 60, size = font => Number(/(\d+)px/.exec(font)[1]);
function blocksFor(tree, theme) {
  const A = tree.analysis, d = new Date(), P = Daily.profile(), who = P && P.title ? Daily.titleName(P.title) : '';
  const bl = [];
  bl.push({ measure: () => 150, draw(x, y, W, th) {
    x.fillStyle = th.gold; x.font = f(700, 54, SERIF); x.textBaseline = 'top'; x.fillText('卡牌技能族譜', PAD, y);
    x.font = f(400, 24); x.fillStyle = th.muted;
    x.fillText(`金融決鬥 · ${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}${who ? ` · ${who}` : ''}`, PAD, y + 76); } });
  bl.push({ measure: () => 150, draw(x, y, W, th) {
    const items = [['收藏', `${A.owned}/${A.total}`], ['牌組', `${A.deckSize} 張`], ['排位點數', `${A.cost}/80`], ['平均攻／守', `${A.avgAtk}／${A.avgDef}`]];
    const w = (W - 2 * PAD - 3 * 16) / 4;
    items.forEach(([l, v], i) => { const X = PAD + i * (w + 16); x.fillStyle = th.panel; roundRect(x, X, y, w, 120, 10); x.fill();
      x.fillStyle = th.ink; x.font = f(500, 34); x.fillText(v, X + 18, y + 22); x.fillStyle = th.muted; x.font = f(400, 22); x.fillText(l, X + 18, y + 76); }); } });
  const head = t => textBlock(t, f(700, 32, SERIF), 'gold', { gap: 14 });
  bl.push(head('強項'));
  (A.strengths.length ? A.strengths : ['還看不出明顯的強項。']).forEach(t => bl.push(textBlock(`＋ ${t}`, f(400, 25), 'good', { gap: 6, indent: 10 })));
  bl.push({ measure: () => 16, draw() {} });
  bl.push(head('需要補強'));
  (A.weaknesses.length ? A.weaknesses : ['沒有明顯的弱點，組得很平衡。']).forEach(t => bl.push(textBlock(`－ ${t}`, f(400, 25), 'bad', { gap: 6, indent: 10 })));
  bl.push({ measure: () => 16, draw() {} });
  bl.push(head('屬性與相剋'));
  tree.clans.forEach(c => { const cov = A.cover.find(x => x.vs === c.cat), r = c.acc && c.acc.rate;
    bl.push({ measure: () => 46, draw(x, y, W, th) {
      x.fillStyle = catHex(c.cat); x.fillRect(PAD, y + 6, 10, 30);
      x.font = f(500, 24); x.fillStyle = th.ink; x.textBaseline = 'top'; x.fillText(c.name, PAD + 22, y + 8);
      x.font = f(400, 22); x.fillStyle = th.muted; x.fillText(`收藏 ${c.owned}/${c.total} · 牌組 ${c.inDeck}${r === null || r === undefined ? '' : ` · 正確率 ${pc(r)}`}`, PAD + 190, y + 10);
      x.fillStyle = cov.n ? th.ink : th.bad; x.textAlign = 'right'; x.fillText(`剋制它的「${CATS[cov.by].name}」：${cov.n} 張`, W - PAD, y + 10); x.textAlign = 'left'; } }); });
  bl.push({ measure: () => 16, draw() {} });
  bl.push(head('技能系統（牌組）'));
  const maxF = Math.max(1, ...A.families.map(x => x.n));
  A.families.forEach(fa => bl.push({ measure: () => 40, draw(x, y, W, th) {
    x.font = f(400, 23); x.fillStyle = th.ink; x.textBaseline = 'top'; x.fillText(fa.name, PAD, y + 6);
    const X = PAD + 170, w = W - 2 * PAD - 240; x.fillStyle = th.panel; x.fillRect(X, y + 12, w, 14); x.fillStyle = th.gold; x.fillRect(X, y + 12, w * fa.n / maxF, 14);
    x.fillStyle = th.muted; x.textAlign = 'right'; x.fillText(String(fa.n), W - PAD, y + 6); x.textAlign = 'left'; } }));
  bl.push({ measure: () => 16, draw() {} });
  if (A.wishlist.length) {
    bl.push(head('收集清單'));
    A.wishlist.forEach(c => bl.push(textBlock(`□ ${c.name}（${CATS[c.cat].name} · ${rarName[c.rank]} · 排位 ${c.cost} 點）— ${c.why.join('；')}`, f(400, 23), 'ink', { gap: 8, indent: 10 })));
    bl.push({ measure: () => 16, draw() {} });
  }
  bl.push(head('族譜'));
  for (const c of tree.clans) {
    bl.push({ measure: () => 66, draw(x, y, W, th) {
      x.fillStyle = catHex(c.cat); roundRect(x, PAD, y, W - 2 * PAD, 52, 8); x.fill();
      x.fillStyle = '#fff'; x.font = f(700, 28, SERIF); x.textBaseline = 'top'; x.fillText(`${CATS[c.cat].badge}  ${c.name}`, PAD + 18, y + 11);
      x.font = f(400, 21); x.textAlign = 'right'; x.fillText(`收藏 ${c.owned}/${c.total} · 牌組 ${c.inDeck} 張`, W - PAD - 18, y + 16); x.textAlign = 'left'; } });
    for (const fa of c.families) bl.push(familyBlock(c, fa));
    bl.push({ measure: () => 14, draw() {} });
  }
  bl.push({ measure: () => 70, draw(x, y, W, th) { x.font = f(400, 21); x.fillStyle = th.muted; x.textBaseline = 'top';
    x.fillText(`實線框：已收集　虛線框：未收集　金色標記：在牌組中　· ${PUBLIC_URL}`, PAD, y + 24); } });
  return bl;
}
/* a skill family row: label, then the cards as chips, four per row */
function familyBlock(c, fa) {
  const COLS = 4, CH = 70, GAP = 12;
  const rows = Math.ceil(fa.cards.length / COLS);
  return { measure: () => 40 + rows * (CH + GAP), draw(x, y, W, th) {
    x.font = f(500, 22); x.fillStyle = th.muted; x.textBaseline = 'top'; x.fillText(`├ ${fa.name}`, PAD + 6, y + 6);
    const cw = (W - 2 * PAD - 30 - (COLS - 1) * GAP) / COLS;
    fa.cards.forEach((k, i) => {
      const X = PAD + 30 + (i % COLS) * (cw + GAP), Y = y + 40 + Math.floor(i / COLS) * (CH + GAP);
      roundRect(x, X, Y, cw, CH, 8);
      if (k.owned) { x.fillStyle = th.panel; x.fill(); x.strokeStyle = k.inDeck ? th.gold : catHex(c.cat); x.lineWidth = k.inDeck ? 3 : 1.5; x.setLineDash([]); x.stroke(); }
      else { x.strokeStyle = th.miss; x.lineWidth = 1.5; x.setLineDash([6, 5]); x.stroke(); x.setLineDash([]); }
      x.fillStyle = k.owned ? catHex(c.cat) : th.miss; x.fillRect(X + 10, Y + 13, 44, 44);
      x.fillStyle = '#fff'; x.font = f(700, 26, SERIF); x.textAlign = 'center'; x.fillText(k.sigil, X + 32, Y + 21); x.textAlign = 'left';
      x.fillStyle = k.owned ? th.ink : th.muted; x.font = f(500, 21);
      let nm = k.name; while (x.measureText(nm).width > cw - 76 && nm.length > 2) nm = nm.slice(0, -1);
      x.fillText(nm === k.name ? nm : nm + '…', X + 64, Y + 12);
      x.font = f(400, 18); x.fillStyle = k.inDeck ? th.gold : th.muted;
      x.fillText(`${rarName[k.rank]} · ${k.inDeck ? `牌組 ×${k.inDeck}` : k.owned ? '已收集' : '未收集'}`, X + 64, Y + 42);
    }); } };
}
async function fontsReady() { try { await Promise.all([document.fonts.load(f(700, 54, SERIF), '卡牌技能族譜'), document.fonts.load(f(400, 22), '收藏牌組')]); } catch { /* optional */ } }
/* one tall canvas (PNG) */
export async function drawImage(tree = T || buildTree(), W = 1080) {
  await fontsReady();
  const th = THEMES.dark, bl = blocksFor(tree, 'dark'), m = document.createElement('canvas').getContext('2d');
  const hs = bl.map(b => b.measure(m, W)), H = Math.ceil(hs.reduce((a, b) => a + b, 0) + 2 * PAD);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = th.bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = th.gold; x.lineWidth = 3; x.strokeRect(18, 18, W - 36, H - 36);
  let y = PAD; bl.forEach((b, i) => { b.draw(x, y, W, th); y += hs[i]; });
  return c;
}
/* A4 pages (PDF) */
export async function drawPages(tree = T || buildTree()) {
  await fontsReady();
  const W = 1240, H = 1754, th = THEMES.light, bl = blocksFor(tree, 'light'), pages = [];
  let x = null, y = 0;
  const page = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; x = c.getContext('2d'); x.fillStyle = th.bg; x.fillRect(0, 0, W, H);
    x.font = f(400, 20); x.fillStyle = th.muted; x.textBaseline = 'alphabetic'; x.fillText('金融決鬥 · 卡牌技能族譜', PAD, 50); x.textAlign = 'right'; x.fillText(`第 ${pages.length + 1} 頁`, W - PAD, 50); x.textAlign = 'left';
    pages.push(c); y = 80; };
  page();
  for (const b of bl) { const h = b.measure(x, W); if (y + h > H - 60 && y > 80) page(); b.draw(x, y, W, th); y += h; }
  return pages;
}

const stamp = (d = new Date()) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
async function save(blob, filename) {
  const dl = await downloadsP;
  if (dl) return dl.save({ filename, data: blob });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const toBlob = c => new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('圖片產生失敗'))), 'image/png'));
export async function exportTree(kind, btn) {
  const st = $('#tree-status'), say = (cls, t) => { st.className = 'status' + (cls ? ' ' + cls : ''); st.textContent = t; };
  if (btn) btn.disabled = true;
  try {
    if (kind === 'pdf') {
      say('', '正在產生 PDF…');
      const JsPDF = await loadJsPDF(), pages = await drawPages();
      const doc = new JsPDF({ unit: 'pt', format: 'a4', compress: true });
      pages.forEach((c, i) => { if (i) doc.addPage(); doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 595.28, 841.89); });
      doc.setProperties({ title: '金融決鬥 卡牌技能族譜' });
      const name = `financial-duel-skilltree-${stamp()}.pdf`; await save(doc.output('blob'), name);
      say('ok', `已輸出 ${name}（共 ${pages.length} 頁），可以印出來規劃收集。`); return;
    }
    say('', '正在產生族譜圖…');
    const blob = await toBlob(await drawImage()), name = `financial-duel-skilltree-${stamp()}.png`;
    if (kind === 'share') {
      const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
      const A = (T || buildTree()).analysis;
      const text = `我的「金融決鬥」卡牌族譜：收藏 ${A.owned}/${A.total} 張，來朝聖一下！一起用卡牌學金融：${PUBLIC_URL}`;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text, title: '金融決鬥 卡牌族譜' }); say('ok', '已開啟分享。'); return; }
        catch (e) { if (e && e.name === 'AbortError') { say('', '已取消分享。'); return; } }
      }
    }
    await save(blob, name);
    say('ok', `已存成 ${name}${kind === 'share' ? '，這個瀏覽器不支援直接分享，可以從相簿或下載資料夾傳給朋友' : ''}。`);
  } catch (e) {
    say(e && e.code === 'declined' ? '' : 'err', e && e.code === 'declined' ? '已取消儲存。' : '輸出失敗：' + ((e && e.message) || '未知錯誤'));
  } finally { if (btn) btn.disabled = false; }
}

export function init() {
  register({ openTree });
  $('#btn-tree').onclick = () => openTree();
  $('#dex-tree').onclick = () => openTree();
  $('#deck-tree').onclick = () => openTree();
  $('#tree-back').onclick = () => { renderTitle(); show('title'); };
  $('#tree-deck').onclick = () => Actions.openDeck();
  $('#tree-png').onclick = e => exportTree('png', e.currentTarget);
  $('#tree-share').onclick = e => exportTree('share', e.currentTarget);
  $('#tree-pdf').onclick = e => exportTree('pdf', e.currentTarget);
  $('#tree-body').addEventListener('click', e => { const b = e.target.closest('.tr-leaf'); if (b && MON[b.dataset.id]) openZoom(MON[b.dataset.id]); });
  $('#tree-wish').addEventListener('click', e => { const b = e.target.closest('.tr-leaf'); if (b && MON[b.dataset.id]) openZoom(MON[b.dataset.id]); });
}
export { familyName };
