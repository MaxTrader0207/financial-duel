// recordui.js — the 學習紀錄 screen: win rates, per-attribute trends and the most-missed questions.
import { allQuestions } from './bank.js';
import { CATS } from './cards.js';
import { $, DIFFS, esc } from './core.js';
import { NB } from './notebook.js';
import { QS, RECS, WEAK_MIN, lifetimeByCat, weakCat } from './records.js';
import { fmtDate } from './report.js';


/* ---------- learning record screen ---------- */
function sparkSVG(vals, color, h = 30) {
  if (!vals.length) return `<svg viewBox="0 0 100 ${h}" preserveAspectRatio="none"></svg>`;
  const n = vals.length, x = i => n === 1 ? 50 : 4 + i * 92 / (n - 1), y = v => h - 3 - v * (h - 6);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 100 ${h}" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="100" y1="${y(0.6).toFixed(1)}" y2="${y(0.6).toFixed(1)}" stroke="#3a4384" stroke-dasharray="2 2" stroke-width=".6" vector-effect="non-scaling-stroke"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    <path d="${vals.map((v, i) => `M${x(i).toFixed(1)} ${y(v).toFixed(1)}h0`).join('')}" stroke="${color}" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function renderRecord() {
  const body = $('#rec-body');
  $('#rec-export').hidden = !RECS.length;
  if (!RECS.length) { body.innerHTML = '<p class="lead">還沒有紀錄。打完一場對戰（或中途投降）後，這裡會出現勝率、各屬性正確率與最常答錯的題目。</p>'; return; }
  const n = RECS.length, wins = RECS.filter(r => r.win).length;
  const tot = RECS.reduce((a, r) => a + r.total, 0), cor = RECS.reduce((a, r) => a + r.correct, 0);
  const best = Math.max(...RECS.map(r => r.maxStreak || 0));
  const life = lifetimeByCat(), weak = weakCat();
  const byDiff = Object.keys(DIFFS).map(k => { const rs = RECS.filter(r => r.diff === k); const w = rs.filter(r => r.win).length;
    return rs.length ? `<span>${DIFFS[k].name} <b>${w}</b> 勝 <b>${rs.length - w}</b> 敗（${Math.round(w / rs.length * 100)}%）</span>` : ''; }).filter(Boolean).join('');
  const last = RECS.slice(-20);
  const trend = Object.keys(CATS).map(k => {
    const vals = RECS.filter(r => r.byCat && r.byCat[k] && r.byCat[k].t).slice(-10).map(r => r.byCat[k].c / r.byCat[k].t);
    const b = life[k], pct = b.t ? Math.round(b.c / b.t * 100) + '%' : '—';
    return `<div class="trend"><span>${CATS[k].name}${weak === k ? '<span class="weak">弱項</span>' : ''}</span>${sparkSVG(vals, CATS[k].color)}<span class="v">${pct}<small class="muted"> /${b.t}</small></span></div>`;
  }).join('');
  const bank = Object.fromEntries(allQuestions().map(q => [q.id, q]));
  const worst = Object.entries(QS).filter(([id, e]) => e.w > 0 && bank[id]).sort((a, b) => b[1].w - a[1].w || b[1].w / b[1].t - a[1].w / a[1].t).slice(0, 10);
  const worstHTML = worst.map(([id, e]) => { const q = bank[id], nb = NB[id];
    const st = nb ? (nb.mastered ? '錯題本：已掌握' : `錯題本：第 ${nb.box} 階`) : '';
    return `<div class="miss"><div class="q"><span class="chip" style="background:${CATS[q.category].color}">${CATS[q.category].name}</span>${esc(q.q)}</div>
      <div class="cnt">答錯 ${e.w} 次 / 出現 ${e.t} 次${st ? ' · ' + st : ''}</div><div class="a">正解：${esc(q.options[q.answer])}</div>${q.explain ? `<div class="e">${esc(q.explain)}</div>` : ''}</div>`; }).join('');
  const recent = RECS.slice(-10).reverse().map(r => `<div><span>${fmtDate(new Date(r.at)).slice(5)}</span><span>${(DIFFS[r.diff] || DIFFS.normal).name}</span><span class="${r.win ? 'w' : 'l'}">${r.win ? '勝利' : r.quit ? '投降' : '敗北'}</span><span>${r.correct}/${r.total} 題 · ${r.total ? Math.round(r.correct / r.total * 100) : 0}% · ${r.turns} 回合</span></div>`).join('');
  body.innerHTML = `
    <div class="stat-row">
      <div class="stat"><div class="n">${n}</div><div class="l">對戰場數</div></div>
      <div class="stat"><div class="n">${Math.round(wins / n * 100)}%</div><div class="l">勝率 · ${wins} 勝 ${n - wins} 敗</div></div>
      <div class="stat"><div class="n">${tot ? Math.round(cor / tot * 100) : 0}%</div><div class="l">總正確率 · ${cor}/${tot}</div></div>
      <div class="stat"><div class="n">${best}</div><div class="l">最長連續答對</div></div>
    </div>
    ${byDiff ? `<p class="lead rec-diff">${byDiff.replace(/<\/span><span>/g, '</span>　<span>')}</p>` : ''}
    <div class="rec-grid">
      <div class="rec-box"><h4>各屬性正確率 · 最近 10 場趨勢</h4>${trend}<p class="muted" style="margin:0;font-size:12px">虛線為 60%。弱項需該屬性累計至少答 ${WEAK_MIN} 題且正確率低於 85%。</p></div>
      <div class="rec-box rec-line"><h4>每場正確率 · 最近 ${last.length} 場</h4>${sparkSVG(last.map(r => r.total ? r.correct / r.total : 0), '#d8b25a', 120)}
        <div class="rec-games">${recent}</div></div>
    </div>
    <h3 class="sec">最常答錯的題目</h3>
    ${worstHTML ? `<div class="missed">${worstHTML}</div>` : '<p class="lead">還沒有答錯的題目。</p>'}`;
}

export function init() {
}

export { renderRecord, sparkSVG };
