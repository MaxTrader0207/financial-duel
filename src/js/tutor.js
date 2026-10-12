// tutor.js — the first-duel tutorial (3 steps) and the one-time tips for later features.
import { Actions } from './actions.js';
import { $, RM, Store } from './core.js';
import { toast } from './view.js';

let Tutor;


export function init() {
/* ---------- first-duel tutorial: three coach marks (play a card → answer → defend) ---------- */
Tutor = (() => {
  const KEY = 'soba-ketto.tutorial.v1';
  let active = false, step = 0, target = null, raf = 0, holdResolve = null;
  const STEPS = {
    1: { title: '出牌', text: '點一張手牌召喚。卡牌的屬性決定題目類型，攻擊力越高、答對時造成的傷害越大。每張卡還有專屬技能，可以在答題視窗或卡牌圖鑑查看。', sel: '#hand' },
    2: { title: '答題', text: '在時限內選出正確答案，也可以按鍵盤 1–4。答對才會發動攻擊，越快答對還有速攻加成。這一題會等你按下「知道了」才開始計時。', sel: '#quiz .q-main' },
    3: { title: '防禦', text: '對手召喚怪獸攻擊了！選一張手牌抵擋，題目會出攻擊方的屬性。答對時只承受「攻擊力 − 守備力」，守備力比較高還會反彈傷害；答錯就全額承受。手牌下方標示「相剋 ×1.5」的卡守備力更高。', sel: '#hand' },
  };
  const done = () => { try { return localStorage.getItem(KEY) === 'done'; } catch (e) { return false; } };
  const markDone = () => { try { localStorage.setItem(KEY, 'done'); } catch (e) {} };
  function place() {
    if (!active || !target) return;
    const el = document.querySelector(target);
    if (el) {
      const r = el.getBoundingClientRect(), pad = 8, ring = $('#tut-ring'), bub = $('#tut-bubble');
      Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
      const bw = Math.min(360, innerWidth - 32), bh = bub.offsetHeight;
      let top = r.top - bh - 18; if (top < 12) top = Math.min(r.bottom + 18, innerHeight - bh - 12);
      const left = Math.max(16, Math.min(innerWidth - bw - 16, r.left + r.width / 2 - bw / 2));
      Object.assign(bub.style, { width: bw + 'px', left: left + 'px', top: Math.max(12, top) + 'px' });
    }
    raf = requestAnimationFrame(place);
  }
  function show(n) {
    const s = STEPS[n]; step = n; target = s.sel;
    $('#tut-step').textContent = `新手引導 ${n} / 3`;
    $('#tut-title').textContent = s.title; $('#tut-text').textContent = s.text;
    $('#tut-ok').hidden = n !== 2;
    $('#tutor').hidden = false;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(place);
    const el = document.querySelector(s.sel); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
    if (n === 2) setTimeout(() => $('#tut-ok').focus({ preventScroll: true }), 50);
  }
  function hide() { $('#tutor').hidden = true; target = null; cancelAnimationFrame(raf); }
  function end(completed) {
    if (!active) return;
    active = false; hide();
    if (holdResolve) { holdResolve(); holdResolve = null; }
    if (completed) { markDone(); toast('新手引導完成！技能、錯題本與卡牌圖鑑都在標題畫面。'); }
  }
  $('#tut-ok').onclick = () => { hide(); if (holdResolve) { holdResolve(); holdResolve = null; } step = 2.5; };
  $('#tut-skip').onclick = () => { markDone(); end(false); toast('已略過新手引導，可以在標題畫面重新開啟。'); };
  /* one-time tips for systems the three-step tutorial does not cover; shown once each, never during the tutorial */
  const TIP_KEY = 'soba-ketto.tips.v1', TIP_V = 1;
  const TIPS = {
    longpress: '長按任何一張卡，可以放大查看技能全文、背景描述和相剋關係。',
    weak: '標著「弱項」的卡屬於你正確率最低的屬性。用它攻擊，答對時傷害 ×1.2，也順便練習弱項。',
    adv: '手牌上的「相剋 ×1.5」代表這張卡剋制攻擊方，防禦時守備力提高；「被剋 ×0.5」則會減半。',
    foeBlock: '對手也會答題防禦：你答對後，對手派一張卡抵擋，並回答同屬性的題目；答對時你只造成「傷害 − 守備力」。對手資金下方寫著它這場擅長與不擅長的屬性，用它不擅長的屬性攻擊，比較容易打穿。',
    reward: '勝利可以從 3 張未收集的卡中選 1 張，之後到「牌組編輯」把它放進牌組。',
    record: '每場對戰都會記在「學習紀錄」，可以看各屬性的正確率趨勢和最常答錯的題目。',
  };
  let seen = new Set(Store.load(TIP_KEY, { version: TIP_V, fallback: () => [], validate: Array.isArray }));
  let tipTimer = 0;
  function tip(key) {
    if (active || seen.has(key) || !TIPS[key]) return false;
    seen.add(key); Store.trySave(TIP_KEY, TIP_V, [...seen]);
    let box = document.getElementById('tipbox');
    if (!box) { box = document.createElement('div'); box.id = 'tipbox'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    box.innerHTML = `<b>小提示</b><span></span><button type="button" class="btn ghost small">知道了</button>`;
    box.querySelector('span').textContent = TIPS[key];
    box.hidden = false; box.querySelector('button').onclick = () => { box.hidden = true; };
    clearTimeout(tipTimer); tipTimer = setTimeout(() => { box.hidden = true; }, 12000);
    return true;
  }
  return {
    done, tip, TIPS,
    begin(on) { active = on; step = 0; hide(); },
    onPhase(ph) { if (!active) return; if (ph === 'attack' && step === 0) show(1); else if (ph === 'defend' && step >= 2 && step < 3) show(3); },
    onPlay(ph) { if (!active) return; if (ph === 'attack' && step === 1) { hide(); step = 1.5; } else if (ph === 'defend' && step === 3) { hide(); step = 3.5; } },
    wantsQuizHold() { return active && step === 1.5; },
    holdQuiz() { show(2); return new Promise(res => { holdResolve = res; }); },
    onAnswered() { if (active && step === 2) { hide(); step = 2.5; if (holdResolve) { holdResolve(); holdResolve = null; } } },
    onDefendDone() { if (active && step === 3.5) end(true); },
    end,
  };
})();
$('#btn-tut').onclick = () => Actions.startDuel({ tutorial: true });
}

export { Tutor };
