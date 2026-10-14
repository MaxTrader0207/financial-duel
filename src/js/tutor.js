// tutor.js — the 教學對戰 coach marks (8 steps), suggested cards and idle nudges in the first duels,
// and the one-time tips for later features.
import { Actions } from './actions.js';
import { $, RM, Store } from './core.js';
import { toast } from './view.js';

let Tutor;


export function init() {
/* ---------- 教學對戰: coach marks driven by duel events (see tutorial-script.js for how the duel itself is set up) ----------
   Each step spotlights one part of the screen. Steps with a button wait for it; the others wait for the player to act
   (play a card). Steps are shown once each, in the order the duel reaches them. */
Tutor = (() => {
  const KEY = 'soba-ketto.tutorial.v1';
  const ORDER = ['goal', 'hand', 'quiz', 'feedback', 'foe', 'defend', 'skill', 'done'];
  const STEPS = {
    goal: { title: '目標', sel: '.bar.foe', btn: '下一步',
      text: '把對手的資金打到 0 就贏了。',
      more: '你的資金在下方，先歸零就輸。教學對戰固定簡易難度（每題 30 秒）、只出初階題，對手資金只有一半。' },
    hand: { title: '出牌', sel: '#hand',
      text: '點發光的這張卡召喚，答對題目就能攻擊。',
      more: '卡的屬性決定題目類型，攻擊力就是答對時造成的傷害。發光的這張攻擊力最高。' },
    quiz: { title: '答題', sel: '#quiz .q-main', btn: '開始計時',
      text: '選出正確答案，答對才會發動攻擊。',
      more: '也可以按鍵盤 1–4。越快答對還有速攻 +300，連續答對 3 題起再加連鎖加成。這一題會等你按下「開始計時」。' },
    feedback: { title: '看解析', sel: '#q-feedback', btn: '知道了',
      text: '答錯的題目會自動收進「錯題本」，之後會再出給你複習。',
      more: '每題都有解析，答對答錯都值得看一眼。錯題本會依間隔複習，直到你真正掌握為止。' },
    foe: { title: '對手也會答題', sel: '#foe-quiz', btn: '繼續',
      text: '對手會派卡抵擋並答題；這次它答錯，你全額命中！',
      more: '它答對時只會讓「攻擊力 − 守備力」穿過。對手資金下方寫著它這場擅長和不擅長的屬性，用它不擅長的屬性攻擊比較容易打穿。' },
    defend: { title: '防禦', sel: '#hand',
      text: '對手攻擊了！點發光的這張卡抵擋。',
      more: '題目會出攻擊方的屬性。答對只承受「攻擊力 − 守備力」，守備比較高還會反彈；答錯就全額承受。標著「相剋 ×1.5」的卡守備力更高。對戰中可以隨時按右上角的「?」查看相剋圖和傷害規則。' },
    skill: { title: '技能', sel: '#hand', btn: '知道了',
      text: '每張卡都有專屬技能，長按卡片可以看全文。',
      more: '技能寫在卡片下方的【】裡，例如攻擊命中時加傷害、防禦失敗時減傷。電腦可以直接點住不放；答題視窗上方也會顯示這張卡的技能。' },
    done: { title: '教學完成', sel: null, btn: '繼續對戰', html: true,
      text: `<ul class="tut-list">
        <li>出牌：屬性決定題目，攻擊力就是傷害</li><li>答題：限時作答，越快越好</li><li>解析與錯題本：答錯的題目會再出現</li>
        <li>對手也會答題：攻擊它不擅長的屬性</li><li>防禦：選守備高、相剋的卡</li><li>技能：長按卡片看全文</li></ul>
        <p class="tut-next">把這場打完吧！勝利可以從 3 張新卡挑 1 張，之後到「牌組編輯」放進牌組；答錯的題目在「錯題本」複習。</p>` },
  };
  let active = false, current = null, target = null, raf = 0, waiters = [];
  const shown = new Set();
  const done = () => { try { return localStorage.getItem(KEY) === 'done'; } catch (e) { return false; } };
  const markDone = () => { try { localStorage.setItem(KEY, 'done'); } catch (e) {} };

  /* the card a beginner should play glows, even after the hand is redrawn */
  function suggest(uid) {
    let st = document.getElementById('tut-suggest-style');
    if (!st) { st = document.createElement('style'); st.id = 'tut-suggest-style'; document.head.appendChild(st); }
    st.textContent = uid == null ? '' : `.hand-card[data-uid="${uid}"]{box-shadow:0 0 0 3px var(--gold-hi),0 0 16px 4px #f3dc9588;animation:tut-glow 1.4s ease-in-out infinite;z-index:2}
      .hand-card[data-uid="${uid}"]::before{content:"建議";position:absolute;z-index:4;left:50%;top:-12px;transform:translateX(-50%);padding:1px 8px;font-size:11px;letter-spacing:.1em;color:#2a1a05;background:var(--gold-hi);white-space:nowrap}`;
  }
  function place() {
    if (!current) return;
    const ring = $('#tut-ring'), bub = $('#tut-bubble');
    const bw = Math.min(380, innerWidth - 32), bh = bub.offsetHeight;
    const el = target && document.querySelector(target);
    if (el && el.getClientRects().length) {
      const r = el.getBoundingClientRect(), pad = 8;
      ring.hidden = false;
      Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
      let top = r.top - bh - 18; if (top < 12) top = Math.min(r.bottom + 18, innerHeight - bh - 12);
      const left = Math.max(16, Math.min(innerWidth - bw - 16, r.left + r.width / 2 - bw / 2));
      Object.assign(bub.style, { width: bw + 'px', left: left + 'px', top: Math.max(12, top) + 'px' });
    } else {                                                     // no target: a centred card over a dimmed screen
      ring.hidden = true;
      Object.assign(bub.style, { width: bw + 'px', left: (innerWidth - bw) / 2 + 'px', top: Math.max(12, (innerHeight - bh) / 2) + 'px' });
    }
    raf = requestAnimationFrame(place);
  }
  /* show a step; resolves when its button is pressed (steps without a button resolve when hidden) */
  function show(id, { suggestUid } = {}) {
    const s = STEPS[id]; shown.add(id); current = id; target = s.sel;
    $('#tut-step').textContent = `新手引導 ${shown.size} / ${ORDER.length}`;
    $('#tut-title').textContent = s.title;
    const tx = $('#tut-text');
    if (s.html) tx.innerHTML = s.text;
    else { tx.textContent = ''; const p = document.createElement('p'); p.textContent = s.text; tx.appendChild(p);
      if (s.more) { const d = document.createElement('details'); d.className = 'tut-more'; d.innerHTML = '<summary>看更多</summary><p></p>'; d.querySelector('p').textContent = s.more; d.ontoggle = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); }; tx.appendChild(d); } }
    $('#tut-ok').hidden = !s.btn; if (s.btn) $('#tut-ok').textContent = s.btn;
    $('#tut-skip').hidden = id === 'done';
    $('#tutor').hidden = false; $('#tutor').classList.toggle('center', !s.sel);
    $('#tutor').dataset.step = id;
    if (suggestUid !== undefined) suggest(suggestUid);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(place);
    const el = s.sel && document.querySelector(s.sel); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
    if (s.btn) setTimeout(() => $('#tut-ok').focus({ preventScroll: true }), 50);
    return new Promise(res => waiters.push(res));
  }
  function hide() {
    $('#tutor').hidden = true; current = null; target = null; cancelAnimationFrame(raf);
    const w = waiters; waiters = []; w.forEach(f => f());
  }
  const hideIf = id => { if (current === id) hide(); };
  function finish() { active = false; hide(); suggest(null); markDone(); }
  function end() {                            // the duel ended or was left: keep it as done once the core steps were seen
    if (!active) return;
    active = false; hide(); suggest(null);
    if (shown.has('defend')) markDone();
  }
  $('#tut-ok').onclick = () => hide();
  $('#tut-skip').onclick = () => { finish(); toast('已略過新手引導，可以在標題畫面按「新手場」重新開始教學對戰。'); };

  /* ---------- gentle nudges in a player's first few duels: if nothing is played for a while, suggest a card ---------- */
  let nudgeTimer = 0;
  function nudge(uid, text, stillValid, ms = 15000) {
    clearNudge(); if (active || uid == null) return;
    nudgeTimer = setTimeout(() => { if (!stillValid()) return; suggest(uid); flash(text); }, ms);
  }
  function clearNudge() { clearTimeout(nudgeTimer); if (!active) suggest(null); }

  /* one-time tips for systems the three-step tutorial does not cover; shown once each, never during the tutorial */
  const TIP_KEY = 'soba-ketto.tips.v1', TIP_V = 1;
  const TIPS = {
    longpress: '長按任何一張卡，可以放大查看技能全文、背景描述和相剋關係。',
    weak: '標著「弱項」的卡屬於你正確率最低的屬性。用它攻擊，答對時傷害 ×1.2，也順便練習弱項。',
    adv: '手牌上的「相剋 ×1.5」代表這張卡剋制攻擊方，防禦時守備力提高；「被剋 ×0.5」則會減半。',
    foeBlock: '對手也會答題防禦：你答對後，對手派一張卡抵擋，並回答同屬性的題目；答對時你只造成「傷害 − 守備力」。對手資金下方寫著它這場擅長與不擅長的屬性，用它不擅長的屬性攻擊，比較容易打穿。',
    reward: '勝利可以從 3 張未收集的卡中選 1 張，之後到「牌組編輯」把它放進牌組。',
    market: '市場事件：從第 2 回合起每 3 回合翻出一個金融事件（升息、股市暴跌…），某些屬性的攻擊力 ×1.2、某個 ×0.8，雙方都適用。手牌上標著「事件 ×1.2」的卡，這段期間出手比較划算。',
    record: '每場對戰都會記在「學習紀錄」，可以看各屬性的正確率趨勢和最常答錯的題目。',
  };
  let seen = new Set(Store.load(TIP_KEY, { version: TIP_V, fallback: () => [], validate: Array.isArray }));
  let tipTimer = 0;
  function box(text, label = '小提示', ms = 12000) {
    let el = document.getElementById('tipbox');
    if (!el) { el = document.createElement('div'); el.id = 'tipbox'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = `<b></b><span></span><button type="button" class="btn ghost small">知道了</button>`;
    el.querySelector('b').textContent = label; el.querySelector('span').textContent = text;
    el.hidden = false; el.querySelector('button').onclick = () => { el.hidden = true; };
    clearTimeout(tipTimer); tipTimer = setTimeout(() => { el.hidden = true; }, ms);
  }
  function flash(text) { box(text, '提示', 9000); }
  function tip(key) {
    if (active || seen.has(key) || !TIPS[key]) return false;
    seen.add(key); Store.trySave(TIP_KEY, TIP_V, [...seen]);
    box(TIPS[key]); return true;
  }
  return {
    done, tip, TIPS, nudge, clearNudge,
    get active() { return active; },
    get step() { return current; },
    begin(on) { active = on; shown.clear(); hide(); suggest(null); },
    /* our attack phase: goal → hand on the first, skill → done once we have also defended */
    async onPhase(ph, { suggestUid } = {}) {
      if (!active) return;
      if (ph === 'attack') {
        if (!shown.has('goal')) { await show('goal'); if (!active) return; }
        if (!shown.has('hand')) { show('hand', { suggestUid }); return; }
        if (shown.has('defend') && !shown.has('skill')) {
          await show('skill'); if (!active) return;
          await show('done'); finish(); toast('教學完成！可以隨時在標題畫面按「新手場」再玩一次。');
        }
      } else if (ph === 'defend' && !shown.has('defend')) show('defend', { suggestUid });
    },
    onPlay() { clearNudge(); if (!active) return; suggest(null); if (current === 'hand' || current === 'defend') hide(); },
    wantsQuizHold() { return active && shown.has('hand') && !shown.has('quiz'); },
    holdQuiz() { return show('quiz'); },
    onAnswered() { hideIf('quiz'); },
    onFeedback() { if (active && !shown.has('feedback')) show('feedback'); },
    onQuizClosed() { hideIf('feedback'); },
    /* the opponent's answer panel waits here (only the first time, in the tutorial) */
    foeHold() { return active && !shown.has('foe') ? show('foe') : Promise.resolve(); },
    end,
  };
})();
$('#btn-tut').onclick = () => Actions.startDuel({ tutorial: true });
}

export { Tutor };
