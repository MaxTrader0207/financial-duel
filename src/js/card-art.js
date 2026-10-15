// card-art.js — exclusive illustrations for ★1–★3 cards (pilot: the 16 「資金管理」 cards below 極稀有).
// Each picture shows what the card is about (a ledger, an abacus with budget envelopes, a snowball…), so the card can
// be recognised at a glance instead of sharing one of three attribute backdrops. Same 100 × 70 box as the scenes;
// never hue-shifted or mirrored. Rarity still shows in the frame: ★1–★2 on the plain sky, ★3 with a soft sunburst
// (極稀有 keep their full gold sunburst in ur-art.js).
const INK = { money: '#14031a' };
const G = '#f3dc95', GH = '#fff2b0', W = '#f4ead2', R = '#e14b32', PK = '#f2a6e6', BL = '#9fd8ff', GR = '#7fdcae';
const f1 = n => Math.round(n * 10) / 10;
const rays = (cx, cy, n = 14, r = 80) => `<g fill="#fff4c8" opacity=".11">${Array.from({ length: n }, (_, i) => {
  const a = i * 2 * Math.PI / n, b = a + Math.PI / n * 0.5;
  return `<path d="M${cx} ${cy}L${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}L${f1(cx + r * Math.cos(b))} ${f1(cy + r * Math.sin(b))}Z"/>`; }).join('')}</g>`;
const svg = (cat, inner, sun = null) => `<svg class="scene ur own" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="70" fill="url(#sky-${cat})"/>${sun ? rays(...sun) : ''}${inner}</svg>`;
const ground = (k, d = 'M0 62 H100 V70 H0Z') => `<path d="${d}" fill="${k}"/>`;
const coin = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>`;
const stack = (x, y, n, r = 2.4) => Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${f1(y - i * 1.5)}" rx="${r}" ry="${f1(r * .45)}" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".25"/>`).join('');
/* a small robed figure: head centre (x, y), scale s */
const fig = (x, y, s, k, more = '') => `<g fill="${k}" stroke="${G}" stroke-width=".45" stroke-linejoin="round"><circle cx="${x}" cy="${y}" r="${f1(2.6 * s)}"/>
  <path d="M${f1(x - 3.6 * s)} ${f1(y + 13 * s)} Q${f1(x - 3.8 * s)} ${f1(y + 4.4 * s)} ${x} ${f1(y + 3.2 * s)} Q${f1(x + 3.8 * s)} ${f1(y + 4.4 * s)} ${f1(x + 3.6 * s)} ${f1(y + 13 * s)}Z"/>${more}</g>`;
const txt = (x, y, t, size = 4, c = GH, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" font-family="serif" fill="${c}" text-anchor="${anchor}">${t}</text>`;
const cloud = (x, y, s = 1, c = '#3a2244') => `<g fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${8 * s}" ry="${3.2 * s}"/><ellipse cx="${x - 4 * s}" cy="${y - 2 * s}" rx="${4.4 * s}" ry="${3 * s}"/><ellipse cx="${x + 3 * s}" cy="${y - 2.6 * s}" rx="${5 * s}" ry="${3.4 * s}"/></g>`;

const ART = {
  /* ★1 */
  ledger_doji: k => svg('money', `${ground(k)}
    <g transform="translate(50 36)"><path d="M-30 -18 Q-15 -22 0 -16 Q15 -22 30 -18 V18 Q15 14 0 20 Q-15 14 -30 18Z" fill="${W}" stroke="${G}" stroke-width=".7"/>
      <path d="M0 -16 V20" stroke="#b9a36a" stroke-width=".6"/>
      ${[-11, -5, 1, 7, 13].map(y => `<path d="M-26 ${y} H-4 M4 ${y} H26" stroke="#c9b98f" stroke-width=".4"/>`).join('')}
      <g font-family="serif" font-size="3.6" fill="#5a2a3a">${[['早餐', '−60', -12], ['車資', '−30', -6], ['薪水', '+3.2萬', 0], ['房租', '−1.2萬', 6]].map(([a, b, y], i) => `<text x="${i < 2 ? -25 : 5}" y="${(i < 2 ? y : y - 12) + 1.4}">${a}</text><text x="${i < 2 ? -5 : 25}" y="${(i < 2 ? y : y - 12) + 1.4}" text-anchor="end" fill="${b[0] === '+' ? '#2f7d4f' : '#b0472f'}">${b}</text>`).join('')}</g>
      <path d="M8 4 H26 M8 10 H20" stroke="#b0472f" stroke-width=".5" stroke-dasharray="1 1"/></g>
    <path d="M82 18 L70 44" stroke="${W}" stroke-width="1.8" stroke-linecap="round"/><path d="M70 44 L68.6 48 L71.4 46Z" fill="${k}"/>
    ${fig(14, 44, .95, k, `<path d="M17 50 L22 47" stroke="${k}" stroke-width="1.8" stroke-linecap="round"/>`)}`),
  budget_abacus: k => svg('money', `${ground(k)}
    ${[['食', 16, '#d8553a'], ['住', 38, '#3f7fe0'], ['行', 60, '#2f9e74'], ['存', 82, G]].map(([t, x, c]) => `<g transform="translate(${x} 13)"><rect x="-8" y="-6" width="16" height="11" rx="1" fill="${W}" stroke="${c}" stroke-width=".8"/><path d="M-8 -6 L0 0 L8 -6" fill="none" stroke="${c}" stroke-width=".7"/>${txt(0, 4, t, 4.6, c)}</g>`).join('')}
    <rect x="12" y="28" width="76" height="30" rx="2" fill="#4a2410" stroke="${G}" stroke-width=".8"/><rect x="15" y="31" width="70" height="24" fill="#2a1208"/>
    <path d="M15 39 H85" stroke="${G}" stroke-width="1"/>
    ${Array.from({ length: 9 }, (_, i) => { const x = 19 + i * 7.8; const up = [1, 0, 1, 1, 0, 1, 0, 0, 1][i]; const lo = [2, 4, 1, 3, 0, 2, 4, 1, 3][i];
      return `<path d="M${f1(x)} 31 V55" stroke="#a87a3a" stroke-width=".5"/>${`<ellipse cx="${f1(x)}" cy="${up ? 36.6 : 33.4}" rx="3.2" ry="1.4" fill="${PK}" stroke="${k}" stroke-width=".3"/>`}${Array.from({ length: 4 }, (_, j) => `<ellipse cx="${f1(x)}" cy="${f1((j < lo ? 41.6 + j * 2.9 : 45 + j * 2.9))}" rx="3.2" ry="1.4" fill="${G}" stroke="${k}" stroke-width=".3"/>`).join('')}`; }).join('')}
    ${[16, 38, 60, 82].map(x => `<path d="M${x} 19 L${x} 26" stroke="${GH}" stroke-width=".6" stroke-dasharray="1 1"/>`).join('')}`),
  reserve_keeper: k => svg('money', `${cloud(24, 10, 1.3)}${cloud(76, 8, 1.1)}
    <g stroke="${BL}" stroke-width=".5" opacity=".7">${Array.from({ length: 16 }, (_, i) => `<path d="M${4 + i * 6.2} ${14 + (i % 3) * 3} l-2 6"/>`).join('')}</g>
    ${ground(k)}
    <path d="M24 30 L50 18 L76 30Z" fill="#3a1a28" stroke="${G}" stroke-width=".6"/><rect x="28" y="30" width="44" height="32" fill="${W}" stroke="${G}" stroke-width=".6"/>
    <rect x="28" y="30" width="44" height="5" fill="#d9cfb8"/><path d="M28 47 H72" stroke="#c9b98f" stroke-width=".5"/>
    <rect x="40" y="38" width="20" height="24" fill="#3a2410" stroke="${k}" stroke-width=".4"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${f1(41.5 + (i % 3) * 6)}" y="${f1(42 + Math.floor(i / 3) * 8)}" width="5" height="6.4" rx="1" fill="#c99a3f" stroke="${k}" stroke-width=".3"/>${txt(f1(44 + (i % 3) * 6), f1(47 + Math.floor(i / 3) * 8), i + 1, 3.2, '#3a1a05')}`).join('')}
    <g transform="translate(50 37)"><rect x="-3.4" y="0" width="6.8" height="5.4" rx=".6" fill="${G}" stroke="${k}" stroke-width=".4"/><path d="M-2.2 0 V-2.2 Q0 -4.6 2.2 -2.2 V0" fill="none" stroke="${G}" stroke-width="1"/></g>
    ${txt(50, 27, '六個月', 3.6, GH)}
    ${fig(84, 44, .95, k, `<path d="M88.5 43 V62" stroke="${G}" stroke-width=".8"/><path d="M86.5 43 L88.5 39 L90.5 43Z" fill="${G}"/>`)}`),
  snowball_doji: k => svg('money', `<g fill="#fff" opacity=".8">${[[12, 8], [30, 14], [48, 6], [70, 12], [88, 7], [60, 22], [20, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7"/>`).join('')}</g>
    <path d="M0 30 Q40 34 70 56 Q84 64 100 64 V70 H0Z" fill="#e8eef8"/><path d="M0 30 Q40 34 70 56 Q84 64 100 64" fill="none" stroke="#b8c6e0" stroke-width=".8"/>
    <circle cx="12" cy="28.4" r="2.2" fill="#fff" stroke="#b8c6e0" stroke-width=".4"/>
    <circle cx="34" cy="31.4" r="4" fill="#fff" stroke="#b8c6e0" stroke-width=".5"/>
    <circle cx="74" cy="47" r="12" fill="#fff" stroke="#b8c6e0" stroke-width=".7"/>
    ${[[70, 42], [77, 45], [73, 51], [79, 51], [68, 48]].map(([x, y]) => coin(x, y, 1.5)).join('')}
    <path d="M16 30 Q24 30 30 32" fill="none" stroke="#b8c6e0" stroke-width=".4" stroke-dasharray="1 1"/><path d="M38 34 Q50 38 62 44" fill="none" stroke="#b8c6e0" stroke-width=".5" stroke-dasharray="1 1"/>
    ${txt(12, 23, '1年', 3, '#3a2244')}${txt(34, 25, '10年', 3, '#3a2244')}${txt(74, 31, '30年', 3.6, '#3a2244')}
    ${fig(56, 33, .9, k, `<path d="M59 38 L63 41" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><path d="M53 29 Q56 25.6 59 29" fill="${R}" stroke="none"/>`)}`),
  dca_pilgrim: k => svg('money', `<rect x="0" y="0" width="50" height="70" fill="#000" opacity=".18"/>
    <circle cx="18" cy="14" r="6" fill="url(#sun-gold)"/>${cloud(76, 12, 1.2)}
    <g stroke="${BL}" stroke-width=".5" opacity=".7">${Array.from({ length: 8 }, (_, i) => `<path d="M${60 + i * 5} ${18 + (i % 2) * 3} l-1.6 5"/>`).join('')}</g>
    <path d="M0 58 Q50 48 100 58 V70 H0Z" fill="${k}"/><path d="M0 60 Q50 51 100 60" fill="none" stroke="#c9a86a" stroke-width="1.4" stroke-dasharray="3 2"/>
    ${[10, 30, 50, 70, 90].map((x, i) => `<g transform="translate(${x} ${f1(56.5 - Math.sin(x / 100 * Math.PI) * 6.6)})"><rect x="-1.4" y="-7" width="2.8" height="7" fill="#8a7a5a" stroke="${k}" stroke-width=".3"/>${coin(0, -9, 1.8)}${txt(0, -12.6, `${i + 1}月`, 2.6, GH)}</g>`).join('')}
    ${fig(50, 32, 1, k, `<path d="M44.5 32 Q50 26.5 55.5 32Z" fill="#c9a86a" stroke="${k}" stroke-width=".4"/><path d="M55.5 34 V48" stroke="${G}" stroke-width=".8"/><circle cx="55.5" cy="33.4" r="1" fill="${G}"/>`)}`),
  scale_ashigaru: k => svg('money', `${ground(k)}
    <g stroke="#6a4a7a" stroke-width=".3">${[14, 26, 38, 50].map(y => `<path d="M6 ${y} H96"/>`).join('')}</g>
    <path d="M6 14 L22 22 L30 18 L46 34 L54 30 L70 46 L78 42 L94 26" fill="none" stroke="${PK}" stroke-width="1.4" stroke-linejoin="round"/>
    ${[[22, 22, 1], [46, 34, 2], [70, 46, 3]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${G}" stroke="${k}" stroke-width=".5"/>${txt(x, y + 1.3, n, 3.2, '#3a1a05')}`).join('')}
    <path d="M6 37.4 H94" stroke="${GH}" stroke-width=".7" stroke-dasharray="2 1.4"/>${txt(94, 35.6, '平均成本', 3, GH, 'end')}
    ${[[22, 50], [46, 50], [70, 50]].map(([x, y], i) => fig(x, y, .62, k, `<path d="M${x + 2.6} ${y + 9} L${x + 2.6} ${y - 7}" stroke="${G}" stroke-width=".55"/><path d="M${x + 1.6} ${y - 6.6} L${x + 2.6} ${y - 9.4} L${x + 3.6} ${y - 6.6}Z" fill="${W}"/><path d="M${x - 2.2} ${y - 1.4} Q${x} ${y - 4} ${x + 2.2} ${y - 1.4}Z" fill="${R}" stroke="none"/>`)).join('')}`),
  /* ★2 */
  allocation_bugyo: k => svg('money', `${ground(k)}
    <g transform="translate(36 32)"><circle r="19" fill="#d8553a" stroke="${G}" stroke-width=".8"/>
      <path d="M0 0 L0 -19 A19 19 0 0 1 16.45 9.5Z" fill="#3f7fe0"/><path d="M0 0 L16.45 9.5 A19 19 0 0 1 -6.5 17.85Z" fill="#2f9e74"/>
      <circle r="7" fill="${k}" stroke="${G}" stroke-width=".6"/>${txt(0, 1.6, '配置', 3.6, GH)}
      ${txt(-10, -4, '股 60%', 3.4, '#fff')}${txt(12, -3, '債 30%', 3.2, '#fff')}${txt(5, 14, '現金', 2.8, '#fff')}</g>
    ${fig(78, 26, 1.3, k, `<path d="M72 33 Q78 30 84 33 L86 40 L70 40Z" fill="${k}" stroke="${G}" stroke-width=".4"/><path d="M73 22 L78 17 L83 22" fill="none" stroke="${G}" stroke-width=".6"/><path d="M71.5 44 L66 38" stroke="${G}" stroke-width=".7"/>`)}
    <path d="M57 34 L66 38" stroke="${GH}" stroke-width=".5" stroke-dasharray="1 1"/>`),
  cashflow_clerk: k => svg('money', `${ground(k)}
    <path d="M0 22 H30 Q36 22 38 30 L40 38" fill="none" stroke="${BL}" stroke-width="4" stroke-linecap="round" opacity=".85"/>${txt(14, 18, '進帳', 3.6, GR)}
    <path d="M62 44 Q66 52 74 52 H100" fill="none" stroke="${BL}" stroke-width="3" stroke-linecap="round" opacity=".7"/>${txt(86, 48, '出帳', 3.6, PK)}
    ${[[8, 22], [18, 22], [28, 22]].map(([x, y]) => coin(x, y, 1.5)).join('')}${[[78, 52], [90, 52]].map(([x, y]) => coin(x, y, 1.3)).join('')}
    <path d="M34 36 H66 V58 Q50 62 34 58Z" fill="#2a1430" stroke="${G}" stroke-width=".8"/><path d="M35 44 H65 V57.4 Q50 61 35 57.4Z" fill="#4d8fd6" opacity=".85"/>
    <path d="M35 44 Q42 42.6 50 44 T65 44" fill="none" stroke="#cfe8ff" stroke-width=".6"/>
    <path d="M70 36 V60" stroke="${G}" stroke-width=".8"/>${[38, 44, 50, 56].map(y => `<path d="M70 ${y} h2" stroke="${G}" stroke-width=".6"/>`).join('')}<path d="M68 44 h4" stroke="${GR}" stroke-width="1.2"/>
    ${fig(50, 18, .95, k, `<rect x="45" y="28" width="10" height="3" fill="#6a4a1a" stroke="${G}" stroke-width=".3"/>`)}`),
  delever_monk: k => svg('money', `${ground(k)}
    <path d="M50 58 L46 62 H54Z" fill="${G}"/><path d="M14 46 L86 54" stroke="#a87a3a" stroke-width="2" stroke-linecap="round"/>
    <rect x="14" y="30" width="14" height="14" fill="#5a2a3a" stroke="${G}" stroke-width=".5" transform="rotate(6 21 37)"/>${txt(21, 39.6, '×10', 4.4, '#ff9c86')}
    <path d="M14 34 L28 44 M28 34 L14 44" stroke="#ff9c86" stroke-width="1" opacity=".9"/>
    <rect x="72" y="44" width="10" height="9" fill="#2f5a4a" stroke="${G}" stroke-width=".5" transform="rotate(6 77 48)"/>${txt(77, 50.6, '×2', 3.6, GR)}
    ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="${f1(32 + i * 3.4)}" cy="${f1(28 - i * 1.2)}" rx="1.8" ry="1.1" fill="none" stroke="#c9b98f" stroke-width=".6" transform="rotate(${i % 2 ? 50 : -20} ${f1(32 + i * 3.4)} ${f1(28 - i * 1.2)})"/>`).join('')}
    <path d="M47 22 L52 18" stroke="${GH}" stroke-width=".8"/><path d="M45 20 L49 24" stroke="${GH}" stroke-width=".5"/>
    ${fig(62, 16, 1.05, k, `<path d="M57 26 Q62 23 67 26" fill="none" stroke="${G}" stroke-width=".5"/><circle cx="62" cy="15" r="2.8" fill="#3a1a28" stroke="${G}" stroke-width=".4"/><path d="M58.6 24 L54 20" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`)}`),
  addon_ronin: k => svg('money', `${ground(k)}
    <path d="M6 58 H22 V48 H38 V38 H54 V28 H70 V18 H92" fill="none" stroke="${GR}" stroke-width="1.6" stroke-linejoin="round"/>
    ${[[14, 58, 5], [30, 48, 4], [46, 38, 3], [62, 28, 2], [78, 18, 1]].map(([x, y, n]) => `${stack(x, y - 1, n, 2.6)}`).join('')}
    ${[[30, 44], [46, 34], [62, 24]].map(([x, y]) => txt(x + 5, y - 3, '+', 4.6, GR)).join('')}
    <path d="M60 60 L70 54" stroke="#ff9c86" stroke-width=".6" stroke-dasharray="1 1"/>${txt(78, 60, '虧損不攤平', 2.8, '#ff9c86')}
    ${fig(86, 4.6, .7, k, `<path d="M88.4 7 L94 2" stroke="#e9ecf6" stroke-width=".6"/><path d="M84 3.6 L88 3.6" stroke="${R}" stroke-width=".6"/>`)}`),
  fraction_bettor: k => svg('money', `${ground(k)}
    <g transform="translate(36 34)"><circle r="18" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".6"/>
      <path d="M0 0 L18 0 A18 18 0 0 0 17.12 -5.56Z" fill="${R}" transform="translate(5 -1.6)" stroke="${k}" stroke-width=".4"/>
      <path d="M0 0 L18 0 A18 18 0 0 0 17.12 -5.56Z" fill="${k}"/>
      ${txt(-2, 3, '本金', 5, '#4a2a05')}${txt(28, -9, '2%', 4.6, '#ff9c86')}</g>
    <g transform="translate(76 46)"><rect x="-6" y="-6" width="12" height="12" rx="2" fill="${W}" stroke="${k}" stroke-width=".5"/>${[[-3, -3], [3, 3], [0, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${R}"/>`).join('')}</g>
    <g transform="translate(88 40) rotate(18)"><rect x="-4.4" y="-4.4" width="8.8" height="8.8" rx="1.6" fill="${W}" stroke="${k}" stroke-width=".5"/>${[[-2, -2], [2, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${k}"/>`).join('')}</g>`),
  insurance_miko: k => svg('money', `${cloud(30, 9, 1.4, '#2a1a3a')}${cloud(72, 7, 1.2, '#2a1a3a')}
    <path d="M58 8 L52 20 L57 20 L50 33" fill="none" stroke="${GH}" stroke-width="1.2" filter="url(#glow)"/>
    <g stroke="${BL}" stroke-width=".5" opacity=".65">${Array.from({ length: 14 }, (_, i) => `<path d="M${6 + i * 7} ${14 + (i % 3) * 4} l-2 6"/>`).join('')}</g>
    ${ground(k)}
    <path d="M60 46 L72 38 L84 46Z" fill="#5a2a3a" stroke="${G}" stroke-width=".5"/><rect x="62" y="46" width="20" height="16" fill="${W}" stroke="${G}" stroke-width=".5"/><rect x="69" y="52" width="6" height="10" fill="#3a2410"/>
    <path d="M30 34 Q50 14 70 34 Q65 31 60 34 Q55 31 50 34 Q45 31 40 34 Q35 31 30 34Z" fill="${R}" stroke="${G}" stroke-width=".6"/><path d="M50 18 V34" stroke="${G}" stroke-width=".5"/>
    <path d="M50 34 V52 Q50 55 47 55" fill="none" stroke="${G}" stroke-width=".9"/>
    ${fig(44, 40, 1, k, `<path d="M40.4 44 Q44 42.6 47.6 44 L48 53 L40 53Z" fill="#f4ead2" stroke="${G}" stroke-width=".3"/><path d="M40 53 L48 53 L49 57 L39 57Z" fill="${R}" stroke="none"/><path d="M41 37.8 Q44 34 47 37.8" fill="#14031a"/>`)}
    ${txt(72, 34, '保', 4.4, GH)}`),
  /* ★3 */
  jars_planner: k => svg('money', `${ground(k, 'M0 52 H100 V70 H0Z')}<rect x="2" y="50" width="96" height="3" fill="#6a4a1a" stroke="${G}" stroke-width=".4"/>
    ${[['生', '#d8553a', 9], ['儲', G, 7], ['學', '#3f7fe0', 5], ['玩', PK, 4], ['投', '#2f9e74', 6], ['享', '#c3902e', 3]].map(([t, c, n], i) => { const x = 10 + i * 16;
      return `<path d="M${x - 5.6} 30 Q${x - 7} 34 ${x - 6} 48 Q${x} 51 ${x + 6} 48 Q${x + 7} 34 ${x + 5.6} 30Z" fill="#cfe8ff" opacity=".28" stroke="${W}" stroke-width=".5"/>
        <rect x="${x - 6}" y="27" width="12" height="3.4" rx="1" fill="${c}" stroke="${k}" stroke-width=".3"/>${stack(x, 47, n, 3.2)}<circle cx="${x}" cy="38" r="3.4" fill="${k}" stroke="${c}" stroke-width=".5"/>${txt(x, 39.5, t, 3.8, c)}`; }).join('')}
    <path d="M50 4 Q50 12 50 20" stroke="${GH}" stroke-width=".6" stroke-dasharray="1 1"/>${coin(50, 6, 2.6)}
    <path d="M50 18 Q30 18 10 25 M50 18 Q70 18 90 25" fill="none" stroke="${GH}" stroke-width=".5" stroke-dasharray="1 1.2"/>${txt(50, 25, '收入', 3.4, GH)}`, [50, 6]),
  rule72_sage: k => svg('money', `${ground(k)}
    <g transform="translate(26 34)"><rect x="-17" y="-22" width="34" height="34" rx="2" fill="${W}" stroke="${G}" stroke-width=".8"/>
      ${txt(0, -10, '72', 13, '#5a2a3a')}<path d="M-12 -6 H12" stroke="#5a2a3a" stroke-width="1.2"/>${txt(0, 6.6, '報酬率', 6, '#5a2a3a')}</g>
    ${txt(50, 36, '＝', 7, GH)}
    <g transform="translate(64 38)"><path d="M-6 -14 H6 L0 0 L6 14 H-6 L0 0Z" fill="#cfe8ff" opacity=".35" stroke="${G}" stroke-width=".8"/>
      <path d="M-4 -12 H4 L0 -4Z" fill="${G}"/><path d="M-5 13 H5 L0 6Z" fill="${G}"/><path d="M-7 -14.6 H7 M-7 14.6 H7" stroke="#a87a3a" stroke-width="1.4"/>${txt(0, 22, '翻倍年數', 3.2, GH)}</g>
    ${stack(80, 56, 3, 3)}${stack(90, 56, 6, 3)}<path d="M82 46 Q86 40 90 44" fill="none" stroke="${GR}" stroke-width=".7"/><path d="M89.6 42.4 L90.4 44.6 L88.2 44.4Z" fill="${GR}"/>${txt(85, 62, '×2', 3, GR)}
    ${txt(26, 60, '例：72 ÷ 6% ＝ 12 年', 3.2, GH)}`, [64, 30]),
  equity_curve_seer: k => svg('money', `<g fill="#fff">${[[8, 6, .8], [20, 14, .5], [34, 5, .7], [52, 10, .5], [68, 4, .9], [84, 12, .6], [94, 5, .5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
    <path d="M68 4 L84 12 L94 5" stroke="#fff" stroke-width=".25" opacity=".6"/>
    ${ground(k)}
    <path d="M4 50 L14 44 L22 46 L32 36 L40 40 L48 30 L56 34 L62 42 L68 48 L76 40 L84 30 L94 22" fill="none" stroke="${GH}" stroke-width="1.4" stroke-linejoin="round" filter="url(#glow)"/>
    <path d="M4 50 Q20 46 34 40 T60 36 T80 36 T96 28" fill="none" stroke="${PK}" stroke-width="1" stroke-dasharray="2 1.2"/>
    <circle cx="64" cy="38.6" r="2.4" fill="none" stroke="#ff9c86" stroke-width=".7"/>${txt(64, 31, '減碼', 3, '#ff9c86')}
    <circle cx="80" cy="35.4" r="2.4" fill="none" stroke="${GR}" stroke-width=".7"/>${txt(84, 44, '加回', 3, GR)}
    ${txt(6, 58, '資金曲線', 2.8, GH, 'start')}${txt(30, 58, '- - 均線', 2.8, PK, 'start')}
    ${fig(14, 18, .85, k, `<path d="M17 21 L28 13" stroke="${G}" stroke-width="2.2" stroke-linecap="round"/><path d="M28 13 L30.4 11.6" stroke="${GH}" stroke-width="2.6"/><path d="M12 15.6 Q14 12 16 15.6Z" fill="#3f7fe0" stroke="none"/>`)}`, [80, 8]),
  pyramid_general: k => svg('money', `${ground(k)}
    ${[[0, 58, 60, '#a87a3a'], [1, 50, 46, '#c3902e'], [2, 42, 32, '#d9ab55'], [3, 34, 18, G]].map(([i, y, w, c]) => `<rect x="${f1(46 - w / 2)}" y="${y}" width="${w}" height="8" fill="${c}" stroke="${k}" stroke-width=".5"/>${txt(46, y + 5.6, ['第一筆 最重', '第二筆', '第三筆', '四'][i], i === 3 ? 3 : 3.4, '#3a1a05')}`).join('')}
    <path d="M46 34 V20" stroke="${G}" stroke-width=".7"/><path d="M46 20 h8 v5 h-8Z" fill="${R}"/>
    <path d="M78 58 L84 30" stroke="${GR}" stroke-width="1.2"/><path d="M82.6 30.6 L84.6 27.4 L86 31.2Z" fill="${GR}"/>${txt(86, 46, '獲利', 3, GR, 'start')}
    ${fig(18, 36, 1.15, k, `<path d="M12.6 33 Q18 28 23.4 33 L22 31 Q18 27.6 14 31Z" fill="${G}"/><path d="M18 30 L15 25 M18 30 L21 25" stroke="${G}" stroke-width=".8"/><path d="M22.4 42 L30 36" stroke="#e9ecf6" stroke-width=".8"/>`)}`, [46, 22]),
};

const CACHE = {};
/* the card's own illustration, or '' when it has none */
export function ownArt(m) {
  const f = ART[m.id]; if (!f) return '';
  return CACHE[m.id] || (CACHE[m.id] = f(INK[m.cat] || '#000'));
}
export const OWN_IDS = Object.keys(ART);
