// boardui.js — the 線上排行榜 screen: this season / last season, your rank, joining with a nickname, renaming, leaving.
import { Actions, register } from './actions.js';
import { $, esc } from './core.js';
import * as Online from './online.js';
import * as Ranked from './ranked.js';
import { show, toast } from './view.js';

let season = null, leaveArmed = 0, renaming = false, seq = 0;
const seasonName = s => { const [y, m] = s.split('-').map(Number); return `${y} 年 ${m} 月`; };
const seal = t => `<i class="rk-seal mini t${t}" aria-hidden="true">${Ranked.TIERS[t].seal}</i>`;

function meHTML(data) {
  if (!Online.joined()) return `
    <div class="bd-join">
      <b>加入線上排行榜</b>
      <p>取一個暱稱，排位賽的積分就會和其他玩家一起排名。只公開暱稱、段位、積分與勝敗場數；不需要電子郵件或密碼。</p>
      <p class="bd-note">加入時會帶入目前的積分，最多 ${Online.SEED_CAP} 分（${esc(Ranked.TIERS[2].name)}）；之後每場排位賽都由伺服器依同樣的規則計分。</p>
      <div class="bd-form"><input id="bd-name" type="text" maxlength="12" autocomplete="nickname" placeholder="暱稱（2～12 個字）" aria-label="暱稱"><button class="btn" id="bd-join" type="button">加入排行榜</button></div>
      <div class="bd-err" id="bd-err" role="alert"></div>
    </div>`;
  const O = Online.state(), me = data && data.me, cur = data && data.season === data.current;
  return `
    <div class="bd-me">
      <div class="bd-me-top"><span class="rk-k">你的暱稱</span><b>${esc(O.name || '')}</b></div>
      <div class="bd-me-rank">${me ? `${seal(me.tier)}<span>${cur ? '本季' : seasonName(data.season)}第 <b>${me.rank}</b> 名 · ${me.rp} 分 · ${me.w} 勝 ${me.l} 敗</span>`
        : `<span>${cur ? '本季還沒有完成排位賽，打完一場就會上榜。' : '這個賽季沒有你的紀錄。'}</span>`}</div>
      ${renaming ? `<div class="bd-form"><input id="bd-name" type="text" maxlength="12" value="${esc(O.name || '')}" aria-label="新暱稱"><button class="btn small" id="bd-rename-ok" type="button">儲存</button><button class="btn ghost small" id="bd-rename-no" type="button">取消</button></div>` : ''}
      <div class="bd-err" id="bd-err" role="alert"></div>
      <div class="btn-row">${renaming ? '' : '<button class="btn ghost small" id="bd-rename" type="button">改暱稱</button>'}<button class="btn ghost small" id="bd-leave" type="button">退出排行榜</button></div>
    </div>`;
}

function listHTML(data) {
  if (!data) return '<p class="bd-msg">讀取中…</p>';
  if (!data.ok) return `<p class="bd-msg bad">${esc(data.error)}</p><div class="btn-row"><button class="btn ghost small" id="bd-retry" type="button">重試</button></div>`;
  if (!data.rows.length) return `<p class="bd-msg">${data.season === data.current ? '本季還沒有人完成排位賽，成為第一個上榜的人吧。' : '這個賽季沒有排名紀錄。'}</p>`;
  return `<ol class="bd-list">${data.rows.map(r => `<li class="${r.you ? 'you' : ''}${r.rank <= 3 ? ` top${r.rank}` : ''}">
      <span class="bd-rank">${r.rank}</span>${seal(r.tier)}<span class="bd-name">${esc(r.name)}${r.you ? '<small>（你）</small>' : ''}</span>
      <span class="bd-rp"><b>${r.rp}</b><small>${r.w} 勝 ${r.l} 敗</small></span></li>`).join('')}</ol>
    <p class="bd-foot">共 ${data.total} 位玩家上榜${data.total > data.rows.length ? `，顯示前 ${data.rows.length} 名` : ''}。同分時，先達到的排前面。</p>`;
}

function render(data) {
  const cur = data && data.ok ? data.current : Ranked.seasonKey(), prev = data && data.ok ? data.previous : null;
  const s = season || cur;
  const typed = $('#bd-name'), keep = typed ? { v: typed.value, focus: document.activeElement === typed } : null;   // a redraw keeps what was typed
  $('#bd-season').textContent = `${seasonName(s)}賽季`;
  $('#bd-body').innerHTML = `
    <div class="bd-tabs" role="tablist">
      <button type="button" role="tab" class="bd-tab${s === cur ? ' on' : ''}" data-s="" aria-selected="${s === cur}">本季</button>
      <button type="button" role="tab" class="bd-tab${prev && s === prev ? ' on' : ''}" data-s="${prev || ''}" aria-selected="${!!prev && s === prev}" ${prev ? '' : 'disabled'}>上季</button>
    </div>
    ${meHTML(data && data.ok ? data : null)}
    <div id="bd-list-wrap">${listHTML(data)}</div>
    <div class="btn-row"><button class="btn ghost" id="bd-ranked" type="button">回排位賽</button><button class="btn ghost" id="bd-home" type="button">回標題</button></div>`;
  const input = $('#bd-name');
  if (input && keep && keep.v) input.value = keep.v;
  if (input && keep && keep.focus) input.focus();
  wire();
}

function wire() {
  document.querySelectorAll('#bd-body .bd-tab').forEach(b => { b.onclick = () => { if (b.disabled) return; season = b.dataset.s || null; load(); }; });
  $('#bd-ranked').onclick = () => Actions.openRanked();
  $('#bd-home').onclick = () => { Actions.renderTitle(); show('title'); };
  const retry = $('#bd-retry'); if (retry) retry.onclick = load;
  const err = m => { const e = $('#bd-err'); if (e) e.textContent = m; };
  const busy = (b, on) => { if (b) { b.disabled = on; b.classList.toggle('busy', on); } };
  const joinBtn = $('#bd-join');
  if (joinBtn) {
    const go = async () => {
      busy(joinBtn, true); err('');
      const r = await Online.join($('#bd-name').value);
      if (!r.ok) { busy(joinBtn, false); err(r.error); return; }
      toast(`已加入排行榜：${Online.state().name}`); load();
    };
    joinBtn.onclick = go;
    $('#bd-name').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  const rn = $('#bd-rename'); if (rn) rn.onclick = () => { renaming = true; load(); };
  const rnNo = $('#bd-rename-no'); if (rnNo) rnNo.onclick = () => { renaming = false; load(); };
  const rnOk = $('#bd-rename-ok');
  if (rnOk) rnOk.onclick = async () => {
    busy(rnOk, true); err('');
    const r = await Online.rename($('#bd-name').value);
    if (!r.ok) { busy(rnOk, false); err(r.error); return; }
    renaming = false; toast('暱稱已更新'); load();
  };
  const lv = $('#bd-leave');
  if (lv) lv.onclick = async () => {
    if (!leaveArmed) { lv.textContent = '確定退出？再按一次'; leaveArmed = setTimeout(() => { leaveArmed = 0; if (lv.isConnected) lv.textContent = '退出排行榜'; }, 3000); return; }
    clearTimeout(leaveArmed); leaveArmed = 0; busy(lv, true);
    const r = await Online.leave();
    if (!r.ok) { busy(lv, false); lv.textContent = '退出排行榜'; err(r.error); return; }
    toast('已退出排行榜，伺服器上的暱稱與成績都已刪除'); load();
  };
}

async function load() {
  const my = ++seq;
  render(null);
  if (Online.joined()) await Online.sync();
  const data = await Online.board(season);
  if (my !== seq) return;                                              // a newer load replaced this one
  render(data);
}

export function openBoard(s = null) {
  season = s; renaming = false;
  show('board');
  return load();
}

export function init() { register({ openBoard }); }
