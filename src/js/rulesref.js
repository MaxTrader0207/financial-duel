// rulesref.js — 規則速查: the 「?」 button on the duel's top line opens one page with the type-advantage wheel, how
// damage is worked out, and this duel's situation (difficulty, market event, the opponent's strong and weak attributes).
import { $, esc } from './core.js';
import { CATS } from './carddata.js';
import { ADV_CYCLE, ADV_UP, ADV_DOWN, WEAK_MULT } from './rules.js';
import { G } from './game.js';

/* the wheel: each attribute beats the next one clockwise */
export function wheelSVG(hi = null) {
  const N = ADV_CYCLE.length, R = 118, C = 170, node = 25;
  const pos = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [C + R * Math.cos(a), C + R * Math.sin(a), a]; };
  const arrows = ADV_CYCLE.map((k, i) => {
    const [x1, y1] = pos(i), [x2, y2] = pos((i + 1) % N), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const on = hi && (k === hi || ADV_CYCLE[(i + 1) % N] === hi);
    return `<line x1="${(x1 + ux * (node + 3)).toFixed(1)}" y1="${(y1 + uy * (node + 3)).toFixed(1)}" x2="${(x2 - ux * (node + 7)).toFixed(1)}" y2="${(y2 - uy * (node + 7)).toFixed(1)}" class="rw-arrow${on ? ' on' : ''}" marker-end="url(#rw-head${on ? '-on' : ''})"/>`;
  }).join('');
  const nodes = ADV_CYCLE.map((k, i) => {
    const [x, y, a] = pos(i), lx = C + (R + node + 24) * Math.cos(a), ly = C + (R + node + 24) * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    return `<g class="rw-node${hi === k ? ' hi' : ''}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${node}" style="fill:${CATS[k].color}"/>
      <text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" class="rw-badge">${CATS[k].badge}</text>
      <text x="${lx.toFixed(1)}" y="${(ly + 1).toFixed(1)}" text-anchor="${anchor}" class="rw-name">${esc(CATS[k].name)}</text></g>`;
  }).join('');
  return `<svg class="rw" viewBox="-60 -10 460 360" role="img" aria-label="屬性相剋環：${ADV_CYCLE.map(k => CATS[k].name).join(' 剋 ')} 剋 ${CATS[ADV_CYCLE[0]].name}">
    <defs><marker id="rw-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="rw-head"/></marker>
    <marker id="rw-head-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="rw-head on"/></marker></defs>
    ${arrows}${nodes}<text x="${C}" y="${C - 8}" class="rw-mid">箭頭方向</text><text x="${C}" y="${C + 16}" class="rw-mid">＝剋制</text></svg>`;
}

export function openRules() {
  const d = G && G.diff, foeCat = G && G.foeCard ? G.foeCard.cat : null;
  const market = ($('#market-label') && !$('#market-label').hidden && $('#market-label').textContent.trim()) || '';
  const pe = $('#foe-prof'), prof = pe ? [...pe.children].map(c => c.textContent.trim()).filter(Boolean).join('；') || pe.textContent.trim() : '';
  $('#rules-body').innerHTML = `
    <section><h4>屬性相剋</h4>${wheelSVG(foeCat)}
      <p>防禦時，你的卡<b>剋制</b>攻擊方的屬性：守備力 ×${ADV_UP}；被攻擊方剋制：守備力 ×${ADV_DOWN}。手牌上會標出「相剋」「被剋」。${foeCat ? `<br>對手場上是「${esc(CATS[foeCat].name)}」，剋制它的是「${esc(CATS[ADV_CYCLE[(ADV_CYCLE.indexOf(foeCat) + ADV_CYCLE.length - 1) % ADV_CYCLE.length]].name)}」。` : ''}</p></section>
    <section><h4>傷害怎麼算</h4><ul class="rr-list">
      <li><b>你攻擊、答對：</b>傷害 ＝ 攻擊力。速攻秒數內答對 +300；連續答對 3 題起再 +500；弱項屬性 ×${WEAK_MULT}；市場事件 ×1.2 或 ×0.8。</li>
      <li><b>對手擋下：</b>對手派卡並答題，答對時只造成「傷害 − 守備力」；答錯就全額命中。</li>
      <li><b>你防禦：</b>題目出攻擊方的屬性。答對只承受「攻擊力 − 守備力」，守備較高還會反彈；答錯全額承受。</li>
      <li><b>勝負：</b>雙方資金各 10000，先歸零就輸。</li></ul></section>
    <section><h4>這一場</h4><ul class="rr-list">
      ${d ? `<li><b>難易度：</b>${esc(d.name)}，每題 ${d.time} 秒，速攻 ${d.fast} 秒內。</li>` : ''}
      <li><b>市場事件：</b>${market ? esc(market) : '目前沒有'}</li>
      ${prof ? `<li><b>對手：</b>${esc(prof)}（用它不擅長的屬性攻擊，比較容易打穿）</li>` : ''}
      <li><b>技能：</b>長按任何一張卡，可以放大看技能全文。</li></ul></section>`;
  $('#rules-dlg').hidden = false;
  $('#rules-close').focus({ preventScroll: true });
}
export const closeRules = () => { $('#rules-dlg').hidden = true; };

export function init() {
  $('#btn-rules').onclick = openRules;
  $('#rules-close').onclick = closeRules;
  $('#rules-dlg').addEventListener('click', e => { if (e.target.id === 'rules-dlg') closeRules(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#rules-dlg').hidden) closeRules(); });
}
