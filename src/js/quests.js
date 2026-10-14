// quests.js — 新手任務: six steps that walk a new player through the core of the game after the tutorial (a real win,
// the deck, the daily challenge, the notebook, ranked). Each finished step gives card shards once; finishing all six
// gives the title 「新手畢業生」. The card on the title screen always shows the next step with a button that goes there.
import { $, Store, isObj } from './core.js';
import { Tutor } from './tutor.js';
import { RECS } from './records.js';
import * as Daily from './daily.js';
import * as Ranked from './ranked.js';
import { toast } from './view.js';

export const QUEST_KEY = 'soba-ketto.quests.v1', QUEST_V = 1, QUEST_SHARDS = 30;
export const GRAD_TITLE = { id: 'rookie-grad', name: '新手畢業生', desc: '完成全部新手任務' };
export const QUESTS = [
  { id: 'tut', title: '完成新手場', desc: '一場有引導的教學對戰，學會出牌、答題和防禦。', go: '#btn-tut', test: s => s.tut },
  { id: 'win', title: '贏得一場對戰', desc: '在休閒對戰打贏電腦對手。簡易難度每題有 30 秒可以想。', go: '#btn-start', test: s => s.win },
  { id: 'deck', title: '整理你的牌組', desc: '勝利拿到的新卡要放進牌組才會出現在對戰。到牌組編輯儲存一次牌組。', go: '#btn-deck', test: s => s.marks.deck },
  { id: 'daily', title: '完成一次每日挑戰', desc: '每天一則約 3 分鐘的生活金融情境題，完成可以拿經驗值和碎片。', go: '#daily-card', test: s => s.daily },
  { id: 'nb', title: '在錯題本複習一題', desc: '答錯的題目會收進錯題本。打開錯題本，按「開始複習」練一題。', go: '#btn-nb', test: s => s.marks.nb },
  { id: 'ranked', title: '打一場排位賽', desc: '依段位配對手、依表現計分，每月賽季發放限定稱號與卡背。', go: '#btn-ranked', test: s => s.ranked },
];

/* features opened step by step; a 交易老手, a skipped quest list or a finished one opens everything */
export const LOCKS = [
  { sel: '#btn-ranked', need: 'win', label: '贏一場後開放', hint: '排位賽會在你贏得第一場休閒對戰後開放。先用休閒對戰熟悉規則吧！' },
  { sel: '#btn-challenge', need: 'win', label: '贏一場後開放', hint: '好友挑戰會在你贏得第一場休閒對戰後開放。' },
  { sel: '#btn-bank', need: 'win', label: '贏一場後開放', hint: '題庫管理（匯入自訂題目、回報）會在你贏得第一場休閒對戰後開放。' },
  { sel: '#btn-tree', need: 'deck', label: '整理牌組後開放', hint: '卡牌族譜會在你儲存一次牌組後開放，到「牌組編輯」看看吧。' },
];

let Q = null;                        // loaded on first use: the title screen may render before init()
const save = () => Store.trySave(QUEST_KEY, QUEST_V, Q);
const q = () => Q || load();
export function load() { Q = { claimed: [], marks: {}, grad: false, ...Store.load(QUEST_KEY, { version: QUEST_V, fallback: () => ({}), validate: isObj }) }; return Q; }
export const state = () => q();
/* things the game cannot read back from its other records */
export function openAll() { q(); Q.open = true; save(); }
export function skip() { q(); Q.open = true; Q.skip = true; save(); }
export const isOpen = (lock, p = progress()) => !!(q().open || Q.grad || p.done.includes(lock.need) || Q.claimed.includes(lock.need));
export function applyLocks(p = progress()) {
  for (const l of LOCKS) { const b = $(l.sel); if (!b) continue; const open = isOpen(l, p);
    b.classList.toggle('locked', !open); if (open) { b.removeAttribute('aria-disabled'); delete b.dataset.lock; } else { b.setAttribute('aria-disabled', 'true'); b.dataset.lock = l.label; } }
}
export function mark(k) { q(); if (Q.marks[k]) return; Q.marks[k] = Date.now(); save(); }

export function facts() {
  const D = Daily.state(), R = Ranked.state();
  return { tut: Tutor.done(), win: RECS.some(r => r.win && r.mode !== 'tutorial'), marks: q().marks,
    daily: !!(D && D.days && Object.values(D.days).some(d => d && d.done)), ranked: !!(R && (R.played || R.w || R.l)) };
}
/* steps done now (in order) and the first one still open */
export function progress(s = facts()) {
  const done = QUESTS.filter(q => q.test(s)).map(q => q.id);
  return { done, next: QUESTS.find(q => !done.includes(q.id)) || null, total: QUESTS.length };
}
/* hand out the rewards for steps finished since last time; returns the newly claimed steps */
export function claim(p = progress()) {
  q();
  const fresh = p.done.filter(id => !Q.claimed.includes(id));
  if (fresh.length) { Q.claimed.push(...fresh); Daily.addShards(QUEST_SHARDS * fresh.length); }
  let grad = false;
  if (!Q.grad && Q.claimed.length >= QUESTS.length) { Q.grad = grad = true; Daily.addCustomTitle(GRAD_TITLE.id, GRAD_TITLE.name, GRAD_TITLE.desc); }
  if (fresh.length || grad) save();
  return { fresh, grad };
}

export function renderQuests() {
  const card = $('#quest-card'); if (!card) return;
  const p = progress(), c = claim(p);
  if (c.fresh.length) {
    const names = c.fresh.map(id => `「${QUESTS.find(q => q.id === id).title}」`).join('、');
    toast(c.grad ? `新手任務全部完成！獲得 ${QUEST_SHARDS * c.fresh.length} 碎片與稱號「${GRAD_TITLE.name}」。` : `完成新手任務${names}，獲得 ${QUEST_SHARDS * c.fresh.length} 碎片。`);
  }
  applyLocks(p);
  card.hidden = !p.next || !!Q.skip;
  if (card.hidden) return;
  $('#qc-prog').textContent = `${p.done.length} / ${p.total}`;
  $('#qc-dots').innerHTML = QUESTS.map(q => `<i class="${p.done.includes(q.id) ? 'on' : q === p.next ? 'now' : ''}" title="${q.title}"></i>`).join('');
  $('#qc-title').textContent = p.next.title;
  $('#qc-desc').textContent = p.next.desc;
  $('#qc-go').dataset.go = p.next.go;
  card.dataset.quest = p.next.id;
}

export function init() {
  q();
  $('#qc-go').onclick = e => { const t = $(e.currentTarget.dataset.go); if (t && !t.hidden) t.click(); };
  $('#qc-skip').onclick = () => { skip(); renderQuests(); toast('已略過新手任務，所有功能都已開放。'); };
  /* a locked feature explains itself instead of opening (capture phase: runs before the button's own handler) */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.locked[data-lock]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const l = LOCKS.find(x => b.matches(x.sel)); if (l) toast(l.hint);
  }, true);
}
