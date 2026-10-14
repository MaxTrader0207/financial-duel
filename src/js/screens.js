// screens.js — the title screen (resume box, notebook badge, question-bank summary) and the 圖鑑.
import { register } from './actions.js';
import { renderDailyCard } from './dailyui.js';
import { renderKnowButton } from './knowledgeui.js';
import { renderRankedButton } from './rankedui.js';
import { BG } from './backgrounds.js';
import { BUILTIN, allQuestions, customMem } from './bank.js';
import { CATS, MON, MONSTERS, RARITY, RARITY_FULL, cardHTML, cardSlot, fillLazy } from './cards.js';
import { COL, owns } from './collection.js';
import { $, RM, SET, esc, sleep } from './core.js';
import { nbCounts } from './notebook.js';
import { renderResume } from './save.js';
import { SKILLS } from './skills.js';
import { Sound } from './sound.js';
import { Tutor } from './tutor.js';
import { currentHook } from './titlehook.js';
import { renderQuests } from './quests.js';

let dexCat;

function setDexCat(v) { dexCat = v; }
function renderDex() {
  $('#dex-filter').innerHTML = [['all', '全部'], ...Object.keys(CATS).map(k => [k, CATS[k].name])]
    .map(([k, n]) => `<button class="btn ghost small" type="button" data-k="${k}" aria-pressed="${dexCat === k}">${n}</button>`).join('');
  $('#dex').innerHTML = MONSTERS.filter(m => dexCat === 'all' || m.cat === dexCat).map(m => {
    const sk = SKILLS[m.id];
    return `<div class="dex-item">${cardSlot(m)}<div class="dex-info"><h4>${esc(m.name)}</h4>
      <div class="meta">${CATS[m.cat].name} · ${RARITY_FULL[RARITY[m.rank]]} ${'◆'.repeat(m.rank)} · 攻 ${m.atk} / 守 ${m.def}${owns(m.id) ? '' : ' · <span style="color:var(--gold)">未收集</span>'}</div>
      <div class="sk"><b>【${esc(sk.name)}】</b>${esc(sk.text)}</div><div class="fl">${esc(m.text)}</div></div></div>`;
  }).join('');
  fillLazy($('#dex'));
}

function renderTitle() {
  const picks = ['boll_dragon', 'gamma_tyrant', 'moat_lord'];
  $('#fan').innerHTML = picks.map(id => cardHTML(MON[id])).join('');
  const all = allQuestions();
  renderResume();
  $('#title-wrap').classList.toggle('returning', Tutor.done());
  $('#tut-hint').textContent = Tutor.done() ? '' : '第一場對戰是「新手場」教學對戰，帶你一步步完成出牌、答題和防禦。';
  { const c = nbCounts(), b = $('#nb-badge'); b.hidden = !c.due; b.textContent = c.due;
    $('#nb-due').hidden = !c.due || !Tutor.done(); $('#nb-due-n').textContent = `${c.due} 題正在等你復仇`; }
  $('#bank-note').textContent = `題庫共 ${all.length} 題（內建 ${BUILTIN.length}、自訂 ${customMem.length}）· 收藏 ${COL.owned.length}/${MONSTERS.length} 種${COL.pending ? ' · 有一張獎勵卡待領取' : ''}`;
  { const h = currentHook({ questions: all.length, cards: MONSTERS.length }), el = $('#title-hook'); el.textContent = h.text; el.dataset.kind = h.kind; }
  renderDailyCard(); renderKnowButton(); renderRankedButton(); renderQuests();
}
export function init() {
register({ renderTitle });

dexCat = 'all';
}

export { setDexCat, dexCat, renderDex, renderTitle };
