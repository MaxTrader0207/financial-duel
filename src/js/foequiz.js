// foequiz.js — the opponent answers its block question in front of you.
// Shows the question and four options over the field, "thinks", marks its pick, then reveals right / wrong
// (a wrong pick also shows the correct option, so the opponent's mistakes teach too). Tap the panel to skip ahead.
import { $, KEYS, esc, shuffle, sleep } from './core.js';
import { CATS } from './cards.js';
import { Tutor } from './tutor.js';

export async function showFoeAnswer(q, blk, m) {
  const el = $('#foe-quiz'); if (!el || !q) return;
  const order = shuffle(q.options.map((_, i) => i)), right = order.indexOf(q.answer);
  const wrong = order.map((_, i) => i).filter(i => i !== right);
  const pick = blk.ok ? right : wrong[Math.floor(Math.random() * wrong.length)];
  el.innerHTML = `<div class="fq-head"><span class="fq-tag">對手作答</span><span class="fq-meta">以【${esc(blk.card.name)}】防禦 · ${esc(CATS[m.cat].name)} · 答對率約 ${Math.round(blk.acc * 100)}%</span></div>
    <div class="fq-q">${esc(q.q)}</div>
    <ol class="fq-opts">${order.map((oi, i) => `<li><span class="k">${KEYS[i]}</span><span>${esc(q.options[oi])}</span></li>`).join('')}</ol>
    <div class="fq-foot">對手思考中<span class="fq-dots"><i></i><i></i><i></i></span><span class="fq-skip">點一下略過</span></div>`;
  el.hidden = false; el.classList.add('on');
  if (import.meta.env.MODE === 'test') window.__lastFoeQ = { id: q.id, ok: blk.ok, pick, right };
  let skip = false; const tap = () => { skip = true; }; el.addEventListener('click', tap);
  const wait = async ms => { for (let t = 0; t < ms && !skip; t += 50) await sleep(50); };
  const li = el.querySelectorAll('.fq-opts li');
  await wait(1200);
  li[pick].classList.add('pick'); await wait(450);
  li[pick].classList.add(blk.ok ? 'ok' : 'ng'); if (!blk.ok) li[right].classList.add('right');
  el.querySelector('.fq-foot').innerHTML = blk.ok ? '對手答對，派卡擋下攻擊。'
    : `對手答錯！正解是 <b>${esc(q.options[q.answer])}</b>`;
  await Tutor.foeHold();                        // tutorial: the panel stays until the explanation is read
  skip = false; await wait(blk.ok ? 1300 : 2000);
  el.removeEventListener('click', tap); el.classList.remove('on'); el.hidden = true; el.innerHTML = '';
}
export function hideFoeAnswer() { const el = $('#foe-quiz'); if (el) { el.classList.remove('on'); el.hidden = true; el.innerHTML = ''; } }
