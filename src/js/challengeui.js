// challengeui.js — the 好友挑戰 screen (start one, accept one from a link, see the scores), the challenge block on the
// result screen, and sharing the link (Web Share, LINE, copy).
import { Actions, register } from './actions.js';
import { DECK, autoDeck, deckValid } from './collection.js';
import { $, esc } from './core.js';
import * as Ch from './challenge.js';
import * as Online from './online.js';
import { show, toast } from './view.js';
import { G as game } from './game.js';

let view = null;                                          // the challenge being looked at (from the server)
const fmtDate = ms => new Date(ms).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
const nameNow = () => Ch.state().name || Online.state().name || '';
const okName = n => { const s = String(n || '').trim(); return [...s].length >= 2 && [...s].length <= 12 ? s : null; };

function resultsHTML(ch, mine) {
  if (!ch.results.length) return '';
  return `<ol class="bd-list ch-list">${ch.results.slice(0, 10).map((r, i) => `<li class="${r.name === mine ? 'you' : ''}">
    <span class="bd-rank">${i + 1}</span><span class="ch-mark ${r.win ? 'w' : 'l'}">${r.win ? '勝' : '敗'}</span>
    <span class="bd-name">${esc(r.name)}${r.name === ch.by ? '<small>（出題）</small>' : ''}</span><span class="bd-rp"><b>${r.score}</b><small>分</small></span></li>`).join('')}</ol>`;
}
const RULES = `<ul class="ch-rules"><li>同一副牌、同樣的抽牌順序、同一個對手牌組與市場事件。</li><li>題目與對手的出牌仍是隨機的，靠的是你的金融知識與判斷。</li>
  <li>不套用知識加成與弱項加成，每個人條件相同。</li><li>分數＝勝利 500 ＋ 表現分 × 5 ＋ 剩餘資金（最多 500），滿分 1500。</li></ul>`;
const nameField = () => `<div class="bd-form"><input id="ch-name" type="text" maxlength="12" value="${esc(nameNow())}" placeholder="你的暱稱（2～12 個字）" aria-label="暱稱"></div>`;

/* ---------- screen ---------- */
export function openChallenge(ch = null) {
  view = ch;
  $('#ch-body').innerHTML = ch ? viewHTML(ch) : homeHTML();
  wire();
  show('challenge');
}
function homeHTML() {
  const list = Ch.state().list;
  return `<div class="bd-join"><b>出一題給朋友</b><p>先用你目前的牌組打一場，打完會得到一個連結。把連結傳給朋友，他們會拿到同一副牌、同一個對手，看誰的分數高。</p>
    ${RULES}${nameField()}<div class="bd-err" id="ch-err" role="alert"></div>
    <div class="btn-row"><button class="btn" id="ch-new" type="button">開始出題</button></div></div>
    ${list.length ? `<h4 class="rk-h">我的挑戰</h4><div class="ch-mine">${list.map(x => `<button class="ch-row" type="button" data-id="${x.id}">
      <span><b>${x.role === 'host' ? '我出的題' : `${esc(x.by)} 的挑戰`}</b><small>${fmtDate(x.at)} · 我的最佳 ${x.best} 分</small></span><span class="ch-go">查看</span></button>`).join('')}</div>` : ''}
    <div class="btn-row"><button class="btn ghost" id="ch-home" type="button">回標題</button></div>`;
}
function viewHTML(ch) {
  const top = ch.results[0], mine = Ch.state().list.find(x => x.id === ch.id);
  return `<div class="bd-me ch-head"><span class="rk-k">${esc(ch.by)} 的挑戰 · ${fmtDate(ch.created)} 建立 · ${fmtDate(ch.expires)} 前有效</span>
      <b class="ch-top">${top ? `目前最高 ${top.score} 分（${esc(top.name)}）` : '還沒有人留下分數'}</b>
      ${mine ? `<small>你的最佳成績：${mine.best} 分</small>` : ''}</div>
    ${resultsHTML(ch, Ch.state().name)}
    ${RULES}${nameField()}<div class="bd-err" id="ch-err" role="alert"></div>
    <div class="btn-row"><button class="btn" id="ch-accept" type="button">${mine ? '再挑戰一次' : '接受挑戰'}</button><button class="btn ghost" id="ch-share" type="button">分享這個挑戰</button><button class="btn ghost" id="ch-back" type="button">好友挑戰</button></div>`;
}
function start(ch) {
  const n = okName($('#ch-name') && $('#ch-name').value);
  if (!n) { $('#ch-err').textContent = '請先輸入 2～12 個字的暱稱，才能留下分數'; return; }
  Ch.setName(n);
  Actions.startDuel({ mode: 'challenge', challenge: ch });
}
function wire() {
  const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
  on('#ch-new', () => start({ id: null, seed: Ch.newSeed(), deck: (deckValid(DECK) ? DECK : autoDeck()).slice(), by: null }));
  on('#ch-accept', () => start({ id: view.id, seed: view.seed, deck: view.deck, by: view.by }));
  on('#ch-share', () => share(view.id, null));
  on('#ch-back', () => openChallenge());
  on('#ch-home', () => { Actions.renderTitle(); show('title'); });
  document.querySelectorAll('#ch-body .ch-row').forEach(b => { b.onclick = () => openById(b.dataset.id); });
}
export async function openById(id) {
  const r = await Ch.fetchChallenge(id);
  if (!r.ok) { toast(r.error); return false; }
  openChallenge(r); return true;
}

/* ---------- sharing ---------- */
const shareText = s => (s != null ? `我在「金融決鬥」好友挑戰拿到 ${s} 分，你敢來挑戰嗎？同一副牌、同一個對手，比比看誰的金融知識強！` : '來「金融決鬥」接受我的好友挑戰：同一副牌、同一個對手，比比看誰的金融知識強！');
export async function share(id, s) {
  const url = Ch.linkFor(id), text = shareText(s);
  if (navigator.share) { try { await navigator.share({ title: '金融決鬥 · 好友挑戰', text, url }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; } }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast('已複製挑戰連結，貼到 LINE 或訊息傳給朋友'); return 'copied'; }
  catch { prompt('複製這個連結傳給朋友：', url); return 'prompt'; }
}
export const lineUrl = (id, s) => `https://line.me/R/share?text=${encodeURIComponent(`${shareText(s)}\n${Ch.linkFor(id)}`)}`;

/* ---------- after a challenge duel: create it (first player) or add the score ---------- */
export async function afterDuel(G) {
  const c = G.challenge, name = Ch.state().name;
  const payload = { name, score: G.chScore, win: !!G.win };
  G.chResult = { pending: true }; refreshResult(G);
  const r = c.id ? await Ch.submit(c.id, payload) : await Ch.create({ ...payload, seed: c.seed, deck: c.deck });
  if (r.ok) { c.id = r.id; Ch.remember(r, c.by ? 'guest' : 'host', G.chScore); }
  G.chResult = r; refreshResult(G);
}
export function challengeResultHTML(G) {
  if (G.mode !== 'challenge' || G.chScore == null) return '';
  const r = G.chResult || {}, p = G.perfResult || { score: 0 };
  const rank = r.ok ? r.results.findIndex(x => x.name === Ch.state().name) + 1 : 0;
  return `<div class="rank-res ch-res"><div class="rr-top"><span class="rr-delta up">${G.chScore}</span>
    <div><b>好友挑戰分數</b><span>勝利 ${G.win ? 500 : 0} ＋ 表現 ${p.score} × 5 ＋ 剩餘資金 ${G.chScore - (G.win ? 500 : 0) - p.score * 5}</span></div></div>
    ${r.pending ? '<div class="rr-online">送出分數中…</div>'
      : !r.ok ? `<div class="rr-online bad">${esc(r.error || '分數沒有送出')}</div>`
      : `<div class="rr-online ok">${G.challenge.by ? `在 ${esc(G.challenge.by)} 的挑戰中排第 <b>${rank}</b> 名（共 ${r.results.length} 人）` : '挑戰已建立！把連結傳給朋友，看誰分數高。'}</div>
        <div class="btn-row"><button class="btn small" type="button" data-ch="share">分享挑戰連結</button><a class="btn ghost small" href="${lineUrl(r.id, G.chScore)}" target="_blank" rel="noopener">傳到 LINE</a><button class="btn ghost small" type="button" data-ch="view">查看排名</button></div>`}</div>`;
}
function refreshResult(G) { const el = document.querySelector('#scr-result .ch-res'); if (el) el.outerHTML = challengeResultHTML(G); }

export function init() {
  register({ openChallenge });
  $('#btn-challenge').onclick = () => openChallenge();
  $('#scr-result').addEventListener('click', e => {
    const b = e.target.closest('.ch-res [data-ch]'); if (!b) return;
    const G = game; if (!G || !G.chResult || !G.chResult.ok) return;
    if (b.dataset.ch === 'share') share(G.chResult.id, G.chScore); else openChallenge(G.chResult);
  });
  /* opened from a challenge link */
  const id = Ch.takeLinkId();
  if (id) openById(id);
}
