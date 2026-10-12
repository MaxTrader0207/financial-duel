// bankui.js — the 題庫管理 screen: import / export custom questions and the list of reported questions.
import { setCustomQuestions, allQuestions, customMem, normalizeQ, saveCustom } from './bank.js';
import { CATS } from './cards.js';
import { $ } from './core.js';

let clearArmed;


/* ---------- bank screen ---------- */
function renderBank() {
  const all = allQuestions();
  const customIds = new Set(customMem.map(q => q.id));
  const rows = Object.keys(CATS).map(k => {
    const list = all.filter(q => q.category === k);
    const cnt = d => list.filter(q => q.difficulty === d).length;
    return `<tr><td><span class="chip" style="background:${CATS[k].color}">${CATS[k].badge}</span>${CATS[k].name}</td><td class="n">${cnt(1)}</td><td class="n">${cnt(2)}</td><td class="n">${cnt(3)}</td><td class="n">${list.filter(q => customIds.has(q.id)).length}</td><td class="n"><b>${list.length}</b></td></tr>`;
  }).join('');
  $('#bank-table').innerHTML = `<thead><tr><th>屬性</th><th>初階</th><th>中階</th><th>進階</th><th>自訂</th><th>合計</th></tr></thead><tbody>${rows}</tbody>`;
}
function importText(txt) {
  const st = $('#import-status'); st.className = 'status';
  let data; try { data = JSON.parse(txt); } catch (e) { st.classList.add('err'); st.textContent = 'JSON 格式有誤：' + e.message; return; }
  const list = Array.isArray(data) ? data : (data && Array.isArray(data.questions) ? data.questions : null);
  if (!list) { st.classList.add('err'); st.textContent = '找不到題目陣列。請貼上陣列，或含有 "questions" 欄位的物件。'; return; }
  const ok = [], errs = [];
  list.forEach((raw, i) => { const r = normalizeQ(raw, i); r.q ? ok.push(r.q) : errs.push(r.err); });
  const map = new Map(customMem.map(q => [q.id, q])); ok.forEach(q => map.set(q.id, q)); setCustomQuestions([...map.values()]);
  const saved = saveCustom();
  st.classList.add(ok.length ? 'ok' : 'err');
  st.innerHTML = `已匯入 ${ok.length} 題` + (errs.length ? `，略過 ${errs.length} 題：${errs.slice(0, 3).join('；')}${errs.length > 3 ? '…' : ''}` : '。') + (saved ? '' : '（瀏覽器無法保存，重新整理後會消失）');
  renderBank();
}

export function init() {
$('#btn-import').onclick = () => importText($('#import-text').value);
$('#import-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#import-text').value = r.result; importText(r.result); }; r.readAsText(f); e.target.value = ''; };
$('#btn-export').onclick = () => {
  const ta = $('#export-text'); ta.value = JSON.stringify({ version: 1, questions: allQuestions() }, null, 2);
  ta.hidden = false; $('#btn-copy').hidden = false; $('#export-status').textContent = `共 ${allQuestions().length} 題，可複製後另存成 .json 檔。`;
};
$('#btn-copy').onclick = () => {
  const ta = $('#export-text'), st = $('#export-status');
  const fallback = () => { ta.focus(); ta.select(); st.className = 'status'; st.textContent = '已全選，請按 Ctrl/⌘ + C 複製。'; };
  try { navigator.clipboard.writeText(ta.value).then(() => { st.className = 'status ok'; st.textContent = '已複製到剪貼簿。'; }, fallback); } catch (e) { fallback(); }
};
clearArmed = 0;
$('#btn-clear').onclick = () => {
  const b = $('#btn-clear'), st = $('#export-status');
  if (!customMem.length) { st.className = 'status'; st.textContent = '目前沒有自訂題目。'; return; }
  if (!clearArmed) { b.textContent = `確定清除 ${customMem.length} 題？再按一次`; clearArmed = setTimeout(() => { clearArmed = 0; b.textContent = '清除自訂題目'; }, 3500); return; }
  clearTimeout(clearArmed); clearArmed = 0; b.textContent = '清除自訂題目';
  setCustomQuestions([]); saveCustom(); st.className = 'status ok'; st.textContent = '已清除自訂題目，保留內建題庫。'; renderBank();
};
}

export { clearArmed, importText, renderBank };
