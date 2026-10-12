// feedback.js — question reports (答案有誤, 資訊過時 …) and the data-date warning on time-sensitive questions.
import { CATS } from './cards.js';
import { $, Store, esc } from './core.js';
import { fmtDate } from './report.js';

let RP_KEY, RP_V, REPORTS, rpSave, reportQ, rpArmed;

/* months from "YYYY-MM" to today (negative = in the future) */
function monthsSince(ym, now = new Date()) { const [y, m] = String(ym).split('-').map(Number); return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m); }
const STALE_MONTHS = 6;
/* a question is stale when its data date is over half a year old, or its reviewBy month (when a known rule change is due) has passed */
function staleness(q, now = new Date()) {
  if (q.reviewBy && monthsSince(q.reviewBy, now) > 0) return 'review';
  if (q.asOf && monthsSince(q.asOf, now) >= STALE_MONTHS) return 'old';
  return '';
}
function showAsOf(q) {
  const el = $('#q-asof');
  if (!q.asOf) { el.hidden = true; return; }
  const [y, m] = q.asOf.split('-'), st = staleness(q);
  el.classList.toggle('stale', !!st);
  el.textContent = `資料基準：${y} 年 ${Number(m)} 月。` + (st === 'review' ? '相關規定預定在這之後變更，這題可能已經過時，請以主管機關最新公告為準。'
    : st === 'old' ? `這份資料已超過 ${STALE_MONTHS} 個月未重新查證，可能已經過時，請以主管機關最新公告為準。` : '這類規定可能調整，請以主管機關最新公告為準。');
  el.hidden = false;
}
function resetReport(q) {
  reportQ = q; $('#q-report').hidden = true; $('#q-report-status').hidden = true; $('#q-report-open').hidden = false; $('#q-report-note').value = '';
}
function renderReports() {
  const box = $('#rp-list');
  $('#rp-count').textContent = REPORTS.length ? `（${REPORTS.length}）` : '';
  $('#rp-copy').disabled = $('#rp-clear').disabled = !REPORTS.length;
  box.innerHTML = REPORTS.length ? REPORTS.slice().reverse().map(r => `<div class="miss"><div class="q"><span class="chip" style="background:${(CATS[r.category] || CATS.tech).color}">${esc(r.reason)}</span>${esc(r.q)}</div>
    <div class="e">題號 ${esc(r.id)} · ${fmtDate(new Date(r.at))}${r.note ? ` · ${esc(r.note)}` : ''}</div></div>`).join('') : '<p class="lead">還沒有回報。答題後在解析下方按「這題有問題？回報」即可記錄。</p>';
}

export function init() {
/* ---------- question reports (kept on this device; copy to send) ---------- */
RP_KEY = 'soba-ketto.reports.v1';
RP_V = 1;
REPORTS = Store.load(RP_KEY, { version: RP_V, fallback: () => [], validate: Array.isArray });
rpSave = () => Store.trySave(RP_KEY, RP_V, REPORTS);
reportQ = null;
$('#q-report-open').onclick = () => { $('#q-report').hidden = false; $('#q-report-open').hidden = true; };
$('#q-report-cancel').onclick = () => { $('#q-report').hidden = true; $('#q-report-open').hidden = false; };
$('#q-report-send').onclick = () => {
  if (!reportQ) return;
  const reason = (document.querySelector('#q-report-reasons input:checked') || {}).value || '其他';
  REPORTS.push({ id: reportQ.id, category: reportQ.category, q: reportQ.q, options: reportQ.options, answer: reportQ.answer, reason, note: $('#q-report-note').value.trim(), at: new Date().toISOString() });
  const ok = rpSave();
  $('#q-report').hidden = true;
  const st = $('#q-report-status'); st.hidden = false;
  st.textContent = ok ? `已記錄回報（${reason}）。可以在「題庫管理」查看並複製全部回報。` : '這個瀏覽器無法保存回報。';
};
$('#rp-copy').onclick = () => {
  const ta = $('#rp-out'); ta.hidden = false; ta.value = JSON.stringify({ reports: REPORTS }, null, 2);
  const st = $('#rp-status');
  const fallback = () => { ta.focus(); ta.select(); st.className = 'status'; st.textContent = '已全選，請按 Ctrl/⌘ + C 複製。'; };
  try { navigator.clipboard.writeText(ta.value).then(() => { st.className = 'status ok'; st.textContent = '已複製全部回報。'; }, fallback); } catch (e) { fallback(); }
};
rpArmed = 0;
$('#rp-clear').onclick = e => {
  const b = e.currentTarget;
  if (!rpArmed) { b.textContent = '確定清除？再按一次'; rpArmed = setTimeout(() => { rpArmed = 0; b.textContent = '清除回報'; }, 3000); return; }
  clearTimeout(rpArmed); rpArmed = 0; b.textContent = '清除回報'; REPORTS = []; rpSave(); $('#rp-out').hidden = true; renderReports();
};
}

export { monthsSince, staleness, STALE_MONTHS, REPORTS, RP_KEY, RP_V, renderReports, reportQ, resetReport, rpArmed, rpSave, showAsOf };
