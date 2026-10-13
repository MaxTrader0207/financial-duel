// rankedui.js — the 排位賽 screen (tier, points, season, deck point check, card backs, past seasons),
// the season-reward dialog, the ranked block on the result screen, and applying the chosen card back.
import { Actions, register } from './actions.js';
import { DECK, deckSave, setDeck } from './collection.js';
import { $, esc } from './core.js';
import * as Daily from './daily.js';
import * as Online from './online.js';
import * as Ranked from './ranked.js';
import { show, toast } from './view.js';

/* month palettes for the season-limited backs: [background, pattern, ink] */
const SEASON_PALETTE = [['#2a0f1a', '#5a1d33', '#f5b8c8'], ['#1a1030', '#3a2a66', '#d9c8ff'], ['#0f2418', '#24533a', '#c8f0d0'], ['#2a1a08', '#5a3a12', '#ffd9a0'],
  ['#0a2230', '#145068', '#a8e6ff'], ['#26102a', '#552a5c', '#f0c0ff'], ['#0c1c3a', '#1e3f7a', '#bcd4ff'], ['#2e1606', '#6a3410', '#ffc690'],
  ['#18240a', '#3e5a14', '#e0f5a0'], ['#2b0a0a', '#661818', '#ffb0a0'], ['#101a2a', '#2c4466', '#d0e4ff'], ['#08201e', '#145a52', '#a8fff0']];

export function applyBack(id = Ranked.state().back) {
  const root = document.documentElement, info = Ranked.backInfo(id);
  root.dataset.back = info.season ? 'season' : info.id;
  if (info.season) {
    const [bg, ln, ink] = SEASON_PALETTE[(info.month - 1) % 12];
    root.style.setProperty('--cb-bg', bg); root.style.setProperty('--cb-ln', ln); root.style.setProperty('--cb-ink', ink);
    root.style.setProperty('--cb-mark', `"${info.mark}"`);
  } else ['--cb-bg', '--cb-ln', '--cb-ink', '--cb-mark'].forEach(p => root.style.removeProperty(p));
}
const backTile = (id, owned, need) => { const b = Ranked.backInfo(id);
  return `<button class="rk-back${owned ? '' : ' locked'}${Ranked.state().back === id ? ' on' : ''}" type="button" data-id="${id}" ${owned ? '' : 'disabled'}>
    <span class="rk-back-face" data-back="${b.season ? 'season' : b.id}" style="${b.season ? seasonVars(b) : ''}"><i>${b.season ? b.mark : '金'}</i></span><b>${esc(b.name)}</b><small>${owned ? (Ranked.state().back === id ? '使用中' : '點一下使用') : esc(need)}</small></button>`; };
const seasonVars = b => { const [bg, ln, ink] = SEASON_PALETTE[(b.month - 1) % 12]; return `--cb-bg:${bg};--cb-ln:${ln};--cb-ink:${ink}`; };

/* ---------- title button ---------- */
export function renderRankedButton() {
  const el = $('#rk-badge'); if (!el) return;
  el.textContent = Ranked.tier().name;
  const p = Ranked.takePending(); if (p) showSeasonReward(p);
}

/* ---------- screen ---------- */
export function openRanked({ sync = true } = {}) {
  const R = Ranked.state(), cached = { rp: R.rp, w: R.w, l: R.l }, t = Ranked.tierOf(R.rp), T = Ranked.TIERS[t], pr = Ranked.progress(), [y, m] = R.season.split('-').map(Number);
  const cost = Ranked.deckCost(DECK), ok = !Ranked.deckForRanked(DECK).auto, autoCost = ok ? cost : Ranked.deckCost(Ranked.rankedDeck());
  $('#rk-season').textContent = `${y} 年 ${m} 月賽季 · 剩 ${Ranked.seasonDaysLeft()} 天`;
  $('#rk-body').innerHTML = `
    <div class="rk-card">
      <span class="rk-seal t${t}" aria-hidden="true">${T.seal}</span>
      <div class="rk-main"><span class="rk-k">目前段位</span><b class="rk-name">${esc(T.name)}</b>
        <div class="rk-rp"><b>${R.rp}</b><span>積分</span>${pr.next ? `<span>· 距離「${esc(pr.next)}」還差 ${pr.need - pr.into} 分</span>` : '<span>· 最高段位</span>'}</div>
        <div class="dl-bar"><i style="width:${pr.need ? Math.round(pr.into / pr.need * 100) : 100}%"></i></div>
        <div class="rk-meta">本季 ${R.w} 勝 ${R.l} 敗 · 本季最高 ${esc(Ranked.TIERS[R.peak].name)} · 對手難度「${esc({ easy: '簡易', normal: '適中', hard: '困難' }[T.diff])}」</div></div>
    </div>
    <div class="rk-online" id="rk-online">${onlineHTML()}</div>
    <div class="rk-tiers">${Ranked.TIERS.map((x, i) => `<span class="${i === t ? 'on' : i < t ? 'past' : ''}"><i class="rk-seal mini t${i}">${x.seal}</i>${esc(x.name)}<small>${x.at}</small></span>`).join('')}</div>
    <div class="rk-deck ${ok ? 'ok' : 'auto'}">${ok ? `<b>排位牌組點數 ${cost} / ${Ranked.DECK_CAP}</b><span>你的牌組符合排位規則，直接開始就好。</span>`
      : `<b>排位賽會自動幫你組一副合規的牌組</b><span>${DECK.length !== 40 ? '你還沒有儲存 40 張的牌組' : `你的牌組 ${cost} 點，超過排位上限 ${Ranked.DECK_CAP} 點`}。按「開始排位賽」時，會用你擁有的卡自動組出 ${autoCost} 點的最強合規牌組，只用在排位賽，你儲存的牌組不會改變。</span>
      <div class="btn-row"><button class="btn ghost small" id="rk-auto" type="button">把這副牌存成我的牌組</button><button class="btn ghost small" id="rk-deck2" type="button">自己調整牌組</button></div>`}
      <small>普通 1、稀有 2、超稀有 3、極稀有 5 點；上限讓勝負靠策略與知識，而不是誰的稀有卡多。</small></div>
    <div class="btn-row"><button class="btn" id="rk-go" type="button">開始排位賽</button>${ok ? '<button class="btn ghost" id="rk-deck" type="button">牌組編輯</button>' : ''}<button class="btn ghost" id="rk-home" type="button">回標題</button></div>
    <details class="rk-rules" open><summary>怎麼計分</summary><ul>
      <li><b>勝 +15～+30、敗 −20～−8：</b>同樣是贏，打得好分數多；輸了但打得好，扣得少。</li>
      <li><b>知識（40）：</b>答題正確率。</li>
      <li><b>策略（35）：</b>用對手不擅長、或市場事件加成的屬性攻擊；有相剋卡可用時，用它來防禦。</li>
      <li><b>風險管理（25）：</b>結束時剩下的資金，以及有沒有吃下單次 ${Ranked.BIG_HIT} 以上的重擊。</li>
      <li><b>段位保護：</b>前 ${Ranked.PROTECTED_TIERS} 個段位輸了不會降段。投降或中途放棄的排位賽以敗場計。</li>
      <li><b>每月賽季：</b>月底結算本季最高段位，下個月第一次開啟時發放限定稱號與卡背，積分往下調兩個段位重新開始。</li></ul></details>
    <h4 class="rk-h">外觀 · 卡背</h4>
    <div class="rk-backs">${Ranked.BACKS.map(b => backTile(b.id, R.backs.includes(b.id), `賽季達到「${Ranked.TIERS[b.tier].name}」解鎖`)).join('')}
      ${R.backs.filter(id => id.startsWith('s-')).map(id => backTile(id, true, '')).join('')}
      ${R.backs.some(id => id === `s-${R.season}`) ? '' : backTile(`s-${R.season}`, false, `本季達到「${Ranked.TIERS[Ranked.SEASON_BACK_TIER].name}」，下個月領取`)}</div>
    ${R.seasons.length ? `<h4 class="rk-h">過去賽季</h4><div class="rk-hist">${R.seasons.slice().reverse().map(s => { const [sy, sm] = s.season.split('-').map(Number);
      return `<span>${sy} 年 ${sm} 月 · 最高 ${esc(Ranked.TIERS[s.peak].name)} · ${s.w} 勝 ${s.l} 敗</span>`; }).join('')}</div>` : ''}`;
  $('#rk-go').onclick = () => Actions.startDuel({ mode: 'ranked' });
  $('#rk-board').onclick = () => Actions.openBoard();
  const auto = $('#rk-auto'); if (auto) auto.onclick = () => { setDeck(Ranked.rankedDeck()); deckSave(); toast('已存成你的牌組'); openRanked({ sync: false }); };
  for (const id of ['#rk-deck', '#rk-deck2']) { const b = $(id); if (b) b.onclick = () => Actions.openDeck(); }
  $('#rk-home').onclick = () => { Actions.renderTitle(); show('title'); };
  document.querySelectorAll('#rk-body .rk-back:not(.locked)').forEach(b => { b.onclick = () => { Ranked.setBack(b.dataset.id); applyBack(); openRanked(); }; });
  show('ranked');
  const p = Ranked.takePending(); if (p) showSeasonReward(p);
  if (sync && Online.joined()) Online.sync().then(me => {     // take the server's points, then redraw what changed
    if (!me || $('#scr-ranked').hidden) return;
    if (R.rp !== cached.rp || R.w !== cached.w || R.l !== cached.l) openRanked({ sync: false });
    else { $('#rk-online').innerHTML = onlineHTML(); $('#rk-board').onclick = () => Actions.openBoard(); }
  });
}
function onlineHTML() {
  const O = Online.state();
  if (!Online.joined()) return `<span><b>線上排行榜</b>取一個暱稱，和其他玩家比本季排名。</span><button class="btn ghost small" id="rk-board" type="button">查看排行榜</button>`;
  return `<span><b>線上排行榜 · ${esc(O.name || '')}</b>${O.me && O.me.w + O.me.l > 0 ? `本季第 ${O.me.rank} 名` : '打完一場排位賽就會上榜'}</span><button class="btn ghost small" id="rk-board" type="button">查看排行榜</button>`;
}

/* ---------- season reward ---------- */
function showSeasonReward(p) {
  const [y, m] = p.season.split('-').map(Number);
  $('#season-body').innerHTML = `<div class="eyebrow">${y} 年 ${m} 月賽季結算</div><h3 class="rk-name">最高段位：${esc(Ranked.TIERS[p.peak].name)}</h3>
    <div class="dl-title-new"><span>限定稱號</span><b>${esc(p.title.name)}</b></div>
    <p class="lead">解鎖卡背：${p.backs.map(id => esc(Ranked.backInfo(id).name)).join('、')}。可以在「排位賽」的外觀裡更換，稱號在每日挑戰的成果頁選擇。</p>
    <p class="lead">新賽季開始了，積分已調整為 ${Ranked.state().rp} 分（${esc(Ranked.tier().name)}）。</p>`;
  $('#season-dlg').hidden = false;
  if (!Daily.profile().title) Daily.setTitle(p.title.id);
}

/* ---------- result screen ---------- */
export function rankResultHTML(G) {
  if (!G.rank || !G.perfResult) return '';
  const r = G.rank, p = G.perfResult, T = Ranked.TIERS;
  const bar = (label, v, max) => `<div class="catbar"><span>${label}</span><div class="track"><i style="width:${Math.round(v / max * 100)}%;background:var(--gold)"></i></div><span class="v">${v}/${max}</span></div>`;
  return `<div class="rank-res"><div class="rr-top"><span class="rr-delta ${r.delta >= 0 ? 'up' : 'down'}">${r.delta >= 0 ? '+' : ''}${r.delta}</span>
    <div><b>排位積分 ${r.before} → ${r.after}</b><span>${esc(T[r.tierAfter].name)}${r.promoted ? ' · 晉升！' : r.demoted ? ' · 降段' : ''}${r.shielded ? ' · 段位保護：沒有降段' : ''}</span></div>
    <div class="rr-score"><b>${p.score}</b><span>表現分</span></div></div>
    <div class="catbars">${bar('知識', p.knowledge, 40)}${bar('策略', p.strategy, 35)}${bar('風險管理', p.risk, 25)}</div>${onlineResult(G.online)}</div>`;
}
function onlineResult(o) {
  if (!o) return '';
  if (o.pending) return '<div class="rr-online">線上排行榜：結算中…</div>';
  if (!o.ok) return `<div class="rr-online bad">線上排行榜：${esc(o.error)}</div>`;
  return `<div class="rr-online ok">線上排行榜：本季第 <b>${o.me.rank}</b> 名 · <button class="linkbtn" type="button" data-act="board">查看排行榜</button></div>`;
}
/* the server answered after the result screen was drawn: redraw just the ranked block */
export function refreshRankResult(G) {
  const el = document.querySelector('#scr-result .rank-res');
  if (el) el.outerHTML = rankResultHTML(G);
}

export function init() {
  register({ openRanked });
  $('#btn-ranked').onclick = () => openRanked();
  $('#scr-result').addEventListener('click', e => { if (e.target.closest('.rr-online [data-act="board"]')) Actions.openBoard(); });
  $('#season-ok').onclick = () => { $('#season-dlg').hidden = true; };
  applyBack();
  renderRankedButton();
}
