// progress.js — export every saved piece of progress to one JSON file, and import it on another device or browser.
import { $ } from './core.js';
import { downloadsP, pad2 } from './report.js';
import { apiBase } from './online.js';

export const PREFIX = 'soba-ketto.', FORMAT = 1;
const SKIP = k => k.endsWith('.backup');

export function collectProgress(ls = localStorage) {
  const data = {};
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(PREFIX) && !SKIP(k)) data[k] = ls.getItem(k); }
  return { app: 'financial-duel', format: FORMAT, exportedAt: new Date().toISOString(), data };
}
/* returns the data map, or throws with a message the player can read */
export function parseProgress(text) {
  let o; try { o = JSON.parse(text); } catch (e) { throw new Error('檔案不是有效的 JSON'); }
  if (!o || o.app !== 'financial-duel' || typeof o.data !== 'object' || !o.data) throw new Error('這不是金融決鬥的進度檔');
  if (o.format > FORMAT) throw new Error('進度檔來自較新的版本，請先更新遊戲');
  const keys = Object.keys(o.data);
  if (!keys.length) throw new Error('進度檔是空的');
  for (const k of keys) if (!k.startsWith(PREFIX) || typeof o.data[k] !== 'string') throw new Error('進度檔內容不符');
  return o;
}
/* replace this browser's progress with the file's; current data is kept once under <key>.backup */
export function applyProgress(o, ls = localStorage) {
  const old = []; for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(PREFIX) && !SKIP(k)) old.push(k); }
  old.forEach(k => { ls.setItem(k + '.backup', ls.getItem(k)); ls.removeItem(k); });
  for (const [k, v] of Object.entries(o.data)) ls.setItem(k, v);
  return Object.keys(o.data).length;
}

async function exportProgress() {
  const st = $('#prog-status');
  const dl = await downloadsP;
  if (!dl && window.claude) { st.className = 'status err'; st.textContent = '這個檢視畫面無法儲存檔案。'; return; }
  const d = new Date(), filename = `financial-duel-progress-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}.json`;
  const data = JSON.stringify(collectProgress());
  try {
    if (dl) { st.className = 'status'; st.textContent = '請在確認視窗中選擇儲存。'; await dl.save({ filename, data }); }
    else { const url = URL.createObjectURL(new Blob([data], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
    st.className = 'status ok'; st.textContent = `已匯出 ${filename}`;
  } catch (e) { st.className = 'status' + (e && e.code === 'declined' ? '' : ' err'); st.textContent = e && e.code === 'declined' ? '已取消儲存。' : '匯出失敗：' + ((e && e.message) || '未知錯誤'); }
}

/* ---------- transfer code (worker /v1/transfer): progress through the server, no file needed ---------- */
async function post(path, body) {
  try {
    const res = await fetch(apiBase() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
  } catch { return { ok: false, status: 0, data: null }; }
}
const errText = r => (r.data && r.data.error) || (r.status === 0 ? '連不上伺服器，請確認網路後再試' : '暫時無法使用，請稍後再試');
export async function makeTransfer() {
  const r = await post('/v1/transfer', { data: collectProgress() });
  return r.ok ? { ok: true, code: r.data.code, expires: r.data.expires } : { ok: false, error: errText(r) };
}
export async function redeemTransfer(code) {
  const r = await post('/v1/transfer/redeem', { code });
  if (!r.ok) return { ok: false, error: errText(r) };
  try { return { ok: true, progress: parseProgress(JSON.stringify(r.data.data)) }; } catch (e) { return { ok: false, error: e.message }; }
}
function initTransfer() {
  const st = (cls, t) => { const e = $('#xfer-status'); e.className = 'status' + (cls ? ' ' + cls : ''); e.textContent = t; };
  $('#xfer-make').onclick = async e => {
    const b = e.currentTarget; b.disabled = true; st('', '產生中…');
    const r = await makeTransfer(); b.disabled = false;
    if (!r.ok) { st('err', r.error); return; }
    const box = $('#xfer-code'); box.hidden = false;
    box.innerHTML = `<b>${r.code}</b><small>${new Date(r.expires).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 前有效 · 只能用一次</small>`;
    st('ok', '在另一台裝置打開遊戲 → 設定 → 轉移碼，輸入上面的代碼。之後這台裝置繼續玩的進度不會同步過去。');
  };
  let armed = 0;                                                       // the code is used up when redeemed, so confirm first
  const reset = () => { clearTimeout(armed); armed = 0; $('#xfer-use').textContent = '接續進度'; };
  $('#xfer-in').oninput = reset;
  $('#xfer-use').onclick = async e => {
    const b = e.currentTarget;
    if (!$('#xfer-in').value.trim()) { st('err', '請先輸入轉移碼'); return; }
    if (!armed) { b.textContent = '會取代這台裝置的進度，再按一次'; st('', '目前的資料會另存備份。'); armed = setTimeout(reset, 5000); return; }
    reset(); b.disabled = true; st('', '讀取中…');
    const r = await redeemTransfer($('#xfer-in').value); b.disabled = false;
    if (!r.ok) { st('err', r.error); return; }
    const n = applyProgress(r.progress);
    st('ok', `已接續 ${n} 項資料，重新載入中…`);
    setTimeout(() => location.reload(), 600);
  };
}

export function init() {
  initTransfer();
  let pending = null, armed = 0;
  $('#prog-export').onclick = exportProgress;
  $('#prog-import').onclick = () => { $('#prog-file').value = ''; $('#prog-file').click(); };
  $('#prog-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const st = $('#prog-status');
    if (f.size > 5e6) { st.className = 'status err'; st.textContent = '檔案太大，不像是進度檔。'; return; }
    const r = new FileReader();
    r.onload = () => {
      try {
        pending = parseProgress(String(r.result));
        const when = new Date(pending.exportedAt); const ok = $('#prog-apply');
        st.className = 'status'; st.textContent = `進度檔匯出於 ${isNaN(when) ? '未知時間' : when.toLocaleString('zh-TW')}，共 ${Object.keys(pending.data).length} 項資料。套用後會取代這台裝置目前的進度（目前的資料會另存備份）。`;
        ok.hidden = false; ok.textContent = '套用這個進度';
      } catch (err) { pending = null; $('#prog-apply').hidden = true; st.className = 'status err'; st.textContent = err.message; }
    };
    r.readAsText(f);
  };
  $('#prog-apply').onclick = e => {
    if (!pending) return;
    const b = e.currentTarget;
    if (!armed) { b.textContent = '確定取代目前進度？再按一次'; armed = setTimeout(() => { armed = 0; b.textContent = '套用這個進度'; }, 4000); return; }
    clearTimeout(armed); armed = 0;
    const n = applyProgress(pending);
    $('#prog-status').className = 'status ok'; $('#prog-status').textContent = `已匯入 ${n} 項資料，重新載入中…`;
    setTimeout(() => location.reload(), 600);
  };
}
