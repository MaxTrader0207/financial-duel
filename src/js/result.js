// result.js — the result screen: verdict, stats, opponent answers, reward card, missed questions and export buttons.
import { Actions } from './actions.js';
import { rankResultHTML } from './rankedui.js';
import { COL } from './collection.js';
import { Tutor } from './tutor.js';
import { CATS } from './cards.js';
import { rewardHTML, wireReward } from './collection.js';
import { $, esc } from './core.js';
import { renderNotebook } from './notebook.js';
import { lifetimeByCat, weakCat } from './records.js';
import { renderRecord } from './recordui.js';
import { downloadsP, exportReport } from './report.js';
import { WEAK_MULT } from './rules.js';
import { renderTitle } from './screens.js';
import { show } from './view.js';
import { G } from './game.js';
import * as K from './knowledge.js';
import { openKnow } from './knowledgeui.js';


/* ---------- result ---------- */
function renderResult(win) {
  const s = G.stats, pct = s.total ? Math.round(s.correct / s.total * 100) : 0;
  const bars = Object.keys(CATS).filter(k => s.byCat[k]).map(k => {
    const b = s.byCat[k], p = Math.round(b.c / b.t * 100);
    return `<div class="catbar"><span>${CATS[k].name}</span><div class="track"><i style="width:${p}%;background:${CATS[k].color}"></i></div><span class="v">${b.c}/${b.t}</span></div>`;
  }).join('');
  const missed = G.missed.map(x => `<div class="miss"><div class="q"><span class="chip" style="background:${CATS[x.cat].color}">${CATS[x.cat].name}</span>${esc(x.q)}</div><div class="a">正解：${esc(x.a)}</div>${x.e ? `<div class="e">${esc(x.e)}</div>` : ''}</div>`).join('');
  $('#result').innerHTML = `
    <div class="eyebrow">對戰結果 · 難易度 ${G.diff.name} · 第 ${G.turn} 回合結束</div>
    <div class="verdict"><h2 class="verdict-big ${win ? '' : 'lose'}">${win ? '勝利' : '敗北'}</h2><div class="verdict-side"><span class="verdict-seal" aria-hidden="true"><span>決</span><span>勝</span></span><span class="verdict-en">${win ? '大獲全勝' : '再接再厲'}</span></div></div>
    <div class="stat-row">
      <div class="stat"><div class="n">${s.correct}/${s.total}</div><div class="l">答對題數</div></div>
      <div class="stat"><div class="n">${pct}%</div><div class="l">正確率</div></div>
      <div class="stat"><div class="n">${G.dealt}</div><div class="l">造成傷害</div></div>
      <div class="stat"><div class="n">${G.taken}</div><div class="l">承受傷害</div></div>
    </div>
    ${rankResultHTML(G)}
    ${G.shardsWon ? `<p class="lead shard-line">勝利額外獲得卡牌碎片 <b>+${G.shardsWon}</b>，可以到「知識圖鑑」解鎖、升級知識卡。</p>` : ''}
    ${G.knowWon ? `<p class="lead shard-line">今日首勝，收集到知識卡<b>【${esc(G.knowWon.name)}】</b>（${esc(K.TYPES()[G.knowWon.type] || '')}）。<button class="linkbtn" type="button" id="res-know">去圖鑑看看</button></p>` : ''}
    ${G.foeStats && G.foeStats.t ? `<p class="lead foe-line">對手防禦答題 <b>${G.foeStats.c}/${G.foeStats.t}</b>${G.foeProf ? `（這場擅長 ${G.foeProf.strong.map(k => CATS[k].name).join('、')}，不擅長 ${G.foeProf.weak.map(k => CATS[k].name).join('、')}）` : ''}。</p>` : ''}
    ${win ? rewardHTML() : ''}
    ${bars ? `<h3 class="sec">各屬性表現</h3><div class="catbars">${bars}</div>` : ''}
    ${(() => { const w = weakCat(); return w ? `<p class="lead">目前弱項：<b style="color:${CATS[w].color}">${CATS[w].name}</b>（累計正確率 ${Math.round(lifetimeByCat()[w].c / lifetimeByCat()[w].t * 100)}%）。下一場用這個屬性的卡攻擊，傷害 ×${WEAK_MULT}。</p>` : ''; })()}
    <h3 class="sec">答錯題目複習</h3>
    ${G.nbAdded ? `<div class="nb-banner"><span>本場有 <b>${G.nbAdded}</b> 題新加入錯題本，之後的對戰會再出現。</span><button class="btn ghost small" type="button" id="btn-to-nb">打開錯題本</button></div>` : ''}
    ${missed ? `<div class="missed">${missed}</div>` : '<p class="lead">這場沒有答錯的題目。</p>'}
    <div class="export">
      <div class="export-head"><h3 class="sec">輸出對戰結果</h3><p class="lead">包含勝負、資金、各屬性表現與完整答題紀錄。PDF 為 A4 多頁，圖片為一張長圖 PNG。</p></div>
      <div class="btn-row"><button class="btn small" type="button" id="btn-pdf">輸出 PDF</button><button class="btn small" type="button" id="btn-png">輸出圖片 PNG</button></div>
      <div class="status" id="export-result-status" role="status"></div>
    </div>
    <div class="btn-row"><button class="btn" type="button" id="btn-again">再戰一場</button><button class="btn ghost" type="button" id="btn-res-rec">學習紀錄</button><button class="btn ghost" type="button" id="btn-home">回標題</button></div>`;
  wireReward();
  if ($('#res-know')) $('#res-know').onclick = () => openKnow(G.knowWon.id);
  if (!Tutor.tip(win && COL.pending ? 'reward' : 'record')) Tutor.tip('record');
  $('#btn-res-rec').onclick = () => { renderRecord(); show('record'); };
  $('#btn-pdf').onclick = e => exportReport('pdf', e.currentTarget);
  $('#btn-png').onclick = e => exportReport('png', e.currentTarget);
  downloadsP.then(dl => { if (!dl && window.claude && $('#btn-pdf')) { $('#btn-pdf').disabled = $('#btn-png').disabled = true; $('#export-result-status').textContent = '這個檢視畫面無法儲存檔案。請在 claude.ai 開啟此頁面後再輸出。'; } });
  if ($('#btn-to-nb')) $('#btn-to-nb').onclick = () => { renderNotebook(); show('notebook'); };
  $('#btn-again').onclick = () => Actions.startDuel();
  $('#btn-home').onclick = () => { renderTitle(); show('title'); };
}

export function init() {
}

export { renderResult };
