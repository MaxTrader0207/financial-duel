// card-art.js — exclusive illustrations for ★1–★3 cards (so far: 資金管理, 技術分析 and 基本面, 16 cards each).
// Each picture shows what the card is about (a ledger, an abacus with budget envelopes, a snowball…), so the card can
// be recognised at a glance instead of sharing one of three attribute backdrops. Same 100 × 70 box as the scenes;
// never hue-shifted or mirrored. Rarity still shows in the frame: ★1–★2 on the plain sky, ★3 with a soft sunburst
// (極稀有 keep their full gold sunburst in ur-art.js).
const INK = { money: '#14031a', tech: '#04102e', fund: '#021a14' };
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
const UP = '#ff6b5a', DN = '#3fcf8e';                    // Taiwan colours: red up, green down
/* a candle at x: open o, close c, high h, low l (y coordinates) */
const candle = (x, o, c, h, l, w = 3.6) => { const col = c < o ? UP : DN; return `<path d="M${x} ${h}V${l}" stroke="${col}" stroke-width=".55"/><rect x="${f1(x - w / 2)}" y="${Math.min(o, c)}" width="${w}" height="${Math.max(.6, Math.abs(o - c))}" fill="${col}"/>`; };
const grid = (c = '#7cbcff', o = .18) => `<g stroke="${c}" stroke-width=".3" opacity="${o}">${[12, 24, 36, 48].map(y => `<path d="M0 ${y}H100"/>`).join('')}${[20, 40, 60, 80].map(x => `<path d="M${x} 0V62"/>`).join('')}</g>`;
const poly = (pts, c, w = 1.2, extra = '') => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
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

  /* 技術分析 */
  ma_samurai: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[4, 50], [20, 46], [36, 42], [52, 36], [68, 26], [84, 18], [96, 14]], GH, 1.3)}
    ${poly([[4, 30], [22, 34], [40, 37], [56, 37.5], [72, 34], [88, 30], [96, 28]], BL, 1.3)}
    <circle cx="52" cy="36.6" r="3" fill="none" stroke="${G}" stroke-width=".8"/>${txt(52, 30.4, '黃金交叉', 3.4, GH)}
    ${txt(96, 11, '短均', 2.8, GH, 'end')}${txt(96, 25.6, '長均', 2.8, BL, 'end')}
    <path d="M30 58 L70 18" stroke="#e9ecf6" stroke-width="1" stroke-linecap="round" opacity=".9"/><path d="M28 60 L33 55" stroke="${R}" stroke-width="2" stroke-linecap="round"/>
    ${fig(20, 44, .85, k, `<path d="M23 48 L29 54" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><path d="M17.6 41 L22.4 41 L20 38Z" fill="${G}"/>`)}`),
  vol_ghost: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[6, 40], [18, 36], [30, 32], [42, 27], [54, 22], [66, 18], [78, 15], [92, 12]], UP, 1.3)}
    <g fill="${BL}" opacity=".75">${[16, 14, 12, 10, 8, 6.4, 5, 3.6].map((h, i) => `<rect x="${4 + i * 11.6}" y="${62 - h}" width="6" height="${h}"/>`).join('')}</g>
    <path d="M10 46 L90 6" stroke="${GH}" stroke-width=".5" stroke-dasharray="1.4 1"/>${txt(50, 12.6, '價漲', 3.2, UP)}${txt(84, 52, '量縮', 3.2, BL)}
    <g transform="translate(70 30)" opacity=".85"><path d="M-6 8 Q-7 -6 0 -8 Q7 -6 6 8 L4 5 L2 8 L0 5 L-2 8 L-4 5Z" fill="#e9ecf6"/><circle cx="-2.2" cy="-2" r="1" fill="${k}"/><circle cx="2.2" cy="-2" r="1" fill="${k}"/></g>
    ${txt(56, 40, '背離', 3.6, GH)}`),
  kd_twins: k => svg('tech', `${ground(k)}
    <rect x="4" y="8" width="92" height="8" fill="${UP}" opacity=".18"/><rect x="4" y="44" width="92" height="8" fill="${DN}" opacity=".18"/>
    <path d="M4 16 H96 M4 44 H96" stroke="${GH}" stroke-width=".4" stroke-dasharray="1.4 1"/>${txt(97, 14.4, '80', 3, GH, 'end')}${txt(97, 49, '20', 3, GH, 'end')}
    ${poly([[4, 40], [14, 30], [24, 18], [34, 12], [44, 11], [54, 13], [64, 26], [74, 40], [84, 46], [94, 36]], GH, 1.3)}
    ${poly([[4, 44], [14, 37], [24, 26], [34, 18], [44, 14], [54, 14], [64, 20], [74, 32], [84, 42], [94, 42]], PK, 1.3)}
    ${txt(24, 22, 'K', 4, GH)}${txt(32, 26, 'D', 4, PK)}${txt(44, 7, '高檔鈍化', 3, GH)}
    ${fig(66, 48, .7, k, '')}${fig(74, 48, .7, k, '')}`),
  gap_swallow: k => svg('tech', `${grid()}${ground(k)}
    ${candle(18, 50, 42, 39, 54, 5)}${candle(28, 44, 36, 34, 47, 5)}${candle(56, 24, 16, 13, 27, 5)}${candle(66, 18, 12, 10, 21, 5)}
    <rect x="30.5" y="27" width="23" height="7" fill="${GH}" opacity=".16"/><path d="M30.5 34 H53.5 M30.5 27 H53.5" stroke="${GH}" stroke-width=".4" stroke-dasharray="1.2 1"/>
    ${txt(42, 32.2, '缺口', 3.6, GH)}
    <path d="M30 40 Q42 22 56 20" fill="none" stroke="#e9ecf6" stroke-width=".5" stroke-dasharray="1 1"/>
    <g transform="translate(44 18) rotate(-14)" fill="${k}" stroke="#e9ecf6" stroke-width=".4"><path d="M-7 0 Q-2 -2 4 0 L9 -4 L6 0 L9 3 L4 1 Q-2 2 -7 0Z"/><path d="M-2 -1 L-6 -7 L1 -1Z"/><path d="M-1 1 L-3 6 L2 1Z" fill="${R}" stroke="none"/></g>`),
  doji_miko: k => svg('tech', `${ground(k)}
    <path d="M50 8 V56" stroke="${GH}" stroke-width="1.6"/><rect x="38" y="31" width="24" height="2.4" fill="${GH}"/>
    ${txt(50, 64.5, '開盤 ＝ 收盤', 3.4, GH)}
    <path d="M20 22 L34 30" stroke="${UP}" stroke-width=".8"/><path d="M80 22 L66 30" stroke="${DN}" stroke-width=".8"/>${txt(18, 19, '多', 4.2, UP)}${txt(82, 19, '空', 4.2, DN)}
    ${fig(76, 40, .95, k, `<path d="M72.6 44 Q76 42.6 79.4 44 L80 50 L72 50Z" fill="${W}" stroke="${G}" stroke-width=".3"/><path d="M72 50 H80 L81 53 H71Z" fill="${R}" stroke="none"/><path d="M73 37.8 Q76 34 79 37.8" fill="${k}"/><path d="M74.6 45 L76 42 L77.4 45" fill="none" stroke="${k}" stroke-width=".5"/>`)}`),
  rsi_scout: k => svg('tech', `${ground(k)}
    <rect x="4" y="6" width="92" height="12" fill="${UP}" opacity=".2"/><rect x="4" y="42" width="92" height="12" fill="${DN}" opacity=".2"/>
    <path d="M4 18 H96 M4 42 H96" stroke="${GH}" stroke-width=".5" stroke-dasharray="1.6 1"/>${txt(6, 15, '70 超買', 3.2, UP, 'start')}${txt(6, 51.6, '30 超賣', 3.2, DN, 'start')}
    ${poly([[30, 34], [38, 22], [46, 12], [54, 16], [62, 30], [70, 46], [78, 48], [86, 36], [94, 28]], GH, 1.3)}
    <circle cx="46" cy="12" r="2" fill="${UP}"/><circle cx="76" cy="48" r="2" fill="${DN}"/>
    ${fig(14, 30, .85, k, `<path d="M17 32 L26 27" stroke="${G}" stroke-width="1.8" stroke-linecap="round"/><path d="M26 27 L28 26" stroke="${GH}" stroke-width="2.2"/>`)}${txt(50, 64, 'RSI', 3.6, GH)}`),
  macd_drummer: k => svg('tech', `${ground(k)}
    <path d="M4 34 H96" stroke="${GH}" stroke-width=".4"/>
    ${[3, 6, 9, 11, 9, 5, 1, -3, -7, -10, -8, -4, 1, 5, 8].map((h, i) => `<rect x="${f1(5 + i * 6)}" y="${h > 0 ? 34 - h : 34}" width="4" height="${Math.abs(h)}" fill="${h > 0 ? UP : DN}" opacity=".9"/>`).join('')}
    ${poly([[4, 30], [20, 20], [32, 18], [44, 26], [58, 40], [70, 42], [84, 30], [96, 24]], GH, 1)}${poly([[4, 32], [20, 25], [32, 21], [44, 24], [58, 33], [70, 38], [84, 34], [96, 28]], BL, 1)}
    <g transform="translate(80 52)"><ellipse rx="9" ry="3" fill="${R}" stroke="${G}" stroke-width=".5"/><path d="M-9 0 V6 Q0 9 9 6 V0" fill="#8a2a1a" stroke="${G}" stroke-width=".5"/><path d="M-4 -3 L-10 -10 M4 -3 L10 -10" stroke="${W}" stroke-width=".8" stroke-linecap="round"/></g>
    ${txt(20, 58, '翻紅翻綠', 3.4, GH)}`),
  support_wall: k => svg('tech', `${grid()}
    ${poly([[4, 18], [14, 34], [22, 46], [28, 38], [36, 30], [44, 46], [50, 40], [58, 32], [66, 46], [72, 38], [82, 24], [94, 14]], DN, 1.3)}
    ${[[22, 46], [44, 46], [66, 46]].map(([x, y]) => `<path d="M${x} ${y + 1} l-2.4 -4 M${x} ${y + 1} l2.4 -4" stroke="${GH}" stroke-width=".6"/>`).join('')}
    <g fill="#5a6290" stroke="${k}" stroke-width=".5">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 10}" y="48" width="10" height="5"/><rect x="${i * 10 - 5}" y="53" width="10" height="5"/>`).join('')}</g>
    ${ground(k, 'M0 58 H100 V70 H0Z')}${txt(50, 66, '支撐', 4, GH)}`),
  breakout_hare: k => svg('tech', `${grid()}${ground(k)}
    <path d="M4 28 H96" stroke="${R}" stroke-width=".9" stroke-dasharray="2 1.2"/>${txt(6, 25.6, '壓力線', 3, '#ff9c86', 'start')}
    ${poly([[4, 48], [12, 36], [20, 44], [30, 30], [38, 42], [48, 31], [56, 38], [64, 26], [72, 16], [84, 10]], UP, 1.3)}
    <g fill="${BL}" opacity=".75">${[4, 5, 4, 6, 5, 4, 5, 14, 12].map((h, i) => `<rect x="${6 + i * 8}" y="${62 - h}" width="5" height="${h}"/>`).join('')}</g>
    <g transform="translate(74 10)" fill="${W}" stroke="${k}" stroke-width=".4"><ellipse cx="0" cy="0" rx="6" ry="3.2"/><circle cx="6" cy="-2" r="2.4"/><path d="M6 -4 L5 -10 L7.4 -4.4Z"/><path d="M7.4 -4 L9 -9.6 L8.6 -3.6Z"/><path d="M-4 2 L-9 5 M3 2 L6 6" stroke="${W}" stroke-width="1.2"/></g>`),
  head_shoulder: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[4, 52], [16, 30], [26, 40], [42, 12], [56, 40], [68, 28], [80, 42], [92, 56]], GH, 1.4)}
    <path d="M14 41 H90" stroke="${R}" stroke-width=".9" stroke-dasharray="2 1.2"/>${txt(94, 40, '頸線', 3, '#ff9c86', 'end')}
    ${txt(16, 26, '左肩', 3.2, GH)}${txt(42, 8.6, '頭', 3.6, GH)}${txt(68, 24, '右肩', 3.2, GH)}
    <circle cx="82.6" cy="44.6" r="2" fill="none" stroke="${DN}" stroke-width=".8"/><path d="M88 48 L92 56" stroke="${DN}" stroke-width="1.2"/><path d="M90.4 56.6 L92.6 57 L92.4 54.6Z" fill="${DN}"/>`),
  fib_weaver: k => svg('tech', `${ground(k)}
    ${[[10, '0', GH], [22.6, '0.382', PK], [30, '0.5', PK], [37.4, '0.618', G], [52, '1', GH]].map(([y, t, c]) => `<path d="M10 ${y} H94" stroke="${c}" stroke-width=".55" stroke-dasharray="${t === '0.618' ? '' : '1.4 1'}"/>${txt(96, y + 1, t, 2.8, c, 'end')}`).join('')}
    ${poly([[10, 52], [22, 40], [34, 22], [44, 10], [56, 24], [66, 37], [74, 30], [86, 16]], UP, 1.3)}
    <circle cx="66" cy="37.4" r="2.2" fill="none" stroke="${G}" stroke-width=".8"/>
    <g stroke="${W}" stroke-width=".35" opacity=".6">${[0, 1, 2, 3].map(i => `<path d="M4 ${50 - i * 4} Q12 ${44 - i * 6} 20 ${50 - i * 4}"/>`).join('')}</g>
    ${fig(10, 40, .7, k, `<path d="M12 44 L18 42" stroke="${W}" stroke-width=".5"/>`)}`),
  trendline_ranger: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[4, 54], [16, 44], [24, 50], [36, 34], [46, 40], [60, 24], [70, 30], [84, 14], [94, 18]], UP, 1.2)}
    <path d="M6 58 L98 24" stroke="${GH}" stroke-width="1.2"/>${[[24, 50.4], [46, 42.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${G}" stroke="${k}" stroke-width=".4"/>`).join('')}
    ${txt(30, 60, '連接兩個低點', 3, GH)}
    ${fig(70, 27, .75, k, `<path d="M72.4 28 L76 23" stroke="${G}" stroke-width=".6"/><path d="M67.6 27 L73 27" stroke="${R}" stroke-width=".6"/><path d="M66.4 25.4 Q70 21 73.6 25.4" fill="${DN}" stroke="none"/>`)}`),
  /* ★3 */
  boll_dragon: k => { const up = [[4, 10], [28, 20], [48, 27], [64, 29], [80, 18], [96, 6]], lo = [[4, 56], [28, 46], [48, 39], [64, 37], [80, 48], [96, 58]];
    return svg('tech', `${grid()}${ground(k)}
    <path d="M${up.map(p => p.join(' ')).join(' L')} L${lo.slice().reverse().map(p => p.join(' ')).join(' L')}Z" fill="${BL}" opacity=".16"/>
    ${poly(up, BL, 1)}${poly(lo, BL, 1)}${poly(up.map((p, i) => [p[0], (p[1] + lo[i][1]) / 2]), GH, .7, 'stroke-dasharray="1.4 1"')}
    ${poly([[4, 36], [16, 30], [28, 38], [40, 31], [52, 35], [62, 32], [70, 22], [78, 12]], W, 1)}
    ${txt(56, 44.6, '通道收窄', 3, GH)}${txt(8, 8, '+2σ', 2.8, BL, 'start')}${txt(8, 62, '−2σ', 2.8, BL, 'start')}
    <path d="M62 33 Q70 24 76 14" fill="none" stroke="${UP}" stroke-width="2.4" stroke-linecap="round" filter="url(#glow)"/>
    <g transform="translate(80 15) scale(1.25)"><path d="M-7 4 Q-3 -5 5 -5 Q9 -4 8 -1 L4 0 L7 2.6 Q2 6 -7 4Z" fill="${k}" stroke="${G}" stroke-width=".4"/><path d="M-2 -4 L-4 -8 L0 -5Z M2 -5 L1 -9 L4 -5Z" fill="${G}"/><circle cx="3.6" cy="-2.6" r=".8" fill="${R}"/><path d="M8 -1.6 Q13 -5 12.6 1.4 Q10.4 -.6 7.6 1Z" fill="#ffb347"/></g>`, [84, 12]); },
  ichimoku_general: k => svg('tech', `${grid()}${ground(k)}
    <path d="M4 44 Q24 40 40 42 Q60 44 76 36 Q88 30 96 30 L96 42 Q86 44 76 46 Q58 50 40 50 Q22 50 4 52Z" fill="${DN}" opacity=".45" stroke="${DN}" stroke-width=".5"/>${txt(30, 48.6, '雲帶', 3.6, '#bff5d9')}
    ${poly([[4, 40], [20, 34], [36, 30], [52, 24], [68, 22], [84, 16], [96, 12]], UP, 1.3)}
    ${poly([[4, 38], [24, 36], [44, 32], [64, 28], [96, 20]], GH, .7)}
    ${txt(50, 64, '9 · 26 · 52', 3.4, GH)}
    ${fig(80, 26, .9, k, `<path d="M74.6 23 Q80 18 85.4 23 L84 21 Q80 17.6 76 21Z" fill="${G}"/><path d="M84.6 32 V10" stroke="${G}" stroke-width=".5"/><path d="M84.6 10 h6 v4 h-6Z" fill="${W}"/>`)}`, [80, 12]),
  wyckoff_strategist: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[4, 48], [12, 44], [18, 50], [26, 45], [32, 49], [40, 36], [50, 22], [58, 16], [64, 20], [70, 15], [76, 19], [84, 34], [96, 50]], GH, 1.3)}
    ${[[18, 56, '吸籌', DN], [44, 31, '拉抬', UP], [67, 10.6, '派發', PK], [90, 40, '殺跌', DN]].map(([x, y, t, c]) => `<rect x="${x - 6}" y="${y - 4}" width="12" height="5.4" rx="1" fill="${k}" stroke="${c}" stroke-width=".5"/>${txt(x, y, t, 3.2, c)}`).join('')}
    ${fig(48, 46, .75, k, `<path d="M51 49 L56 45 L57 50Z" fill="${W}" stroke="${k}" stroke-width=".3"/>`)}`, [50, 22]),
  dow_elder: k => svg('tech', `${grid()}${ground(k)}
    ${poly([[4, 44], [16, 36], [24, 40], [38, 28], [48, 32], [62, 20], [72, 24], [92, 10]], UP, 1.3)}${txt(94, 8, '工業', 3, UP, 'end')}
    ${poly([[4, 54], [16, 48], [24, 51], [38, 42], [48, 45], [62, 36], [72, 39], [92, 26]], GH, 1.3)}${txt(94, 24, '運輸', 3, GH, 'end')}
    ${[[38, 28], [62, 20], [38, 42], [62, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="none" stroke="${G}" stroke-width=".6"/>`).join('')}
    <path d="M50 25 V39" stroke="${G}" stroke-width=".5" stroke-dasharray="1 1"/>${txt(50, 47.6, '互相確認', 3, GH)}
    ${fig(16, 16, .9, k, `<path d="M19.6 18 V30" stroke="${G}" stroke-width=".7"/><circle cx="19.6" cy="17.4" r="1" fill="${G}"/><path d="M14 18.6 Q16 22 18 18.6" fill="${W}" stroke="none"/>`)}`, [50, 30]),

  /* 基本面 */
  pe_sage: k => svg('fund', `${ground(k)}
    <path d="M50 14 V54" stroke="${G}" stroke-width="1.2"/><path d="M42 58 H58 L54 54 H46Z" fill="${G}"/><path d="M18 20 L82 20" stroke="${G}" stroke-width="1"/><circle cx="50" cy="14" r="1.6" fill="${GH}"/>
    <path d="M18 20 L12 34 M18 20 L24 34 M82 20 L76 34 M82 20 L88 34" stroke="${G}" stroke-width=".4"/>
    <path d="M10 34 Q18 40 26 34Z" fill="${G}"/><path d="M74 34 Q82 40 90 34Z" fill="${G}"/>
    <g transform="translate(18 28)"><path d="M-7 -6 H5 L8 -2 L5 2 H-7Z" fill="${W}" stroke="${k}" stroke-width=".4"/>${txt(-1, -.6, '股價', 3, '#3a2a10')}</g>
    ${stack(82, 32, 3, 3)}${txt(82, 25, '每股盈餘', 2.8, GH)}
    <rect x="34" y="40" width="32" height="10" rx="2" fill="${k}" stroke="${G}" stroke-width=".6"/>${txt(50, 47, '股價 ÷ EPS', 3.6, GH)}`),
  div_fox: k => svg('fund', `<circle cx="78" cy="14" r="9" fill="#fff6d8" opacity=".95" filter="url(#glow)"/>${ground(k)}
    <path d="M6 22 H94" stroke="${GH}" stroke-width=".5" stroke-dasharray="1.6 1"/>${txt(8, 20, '除息前', 2.8, GH, 'start')}
    ${poly([[6, 24], [22, 22], [30, 22]], GH, 1.3)}<path d="M30 22 V36" stroke="${R}" stroke-width=".8" stroke-dasharray="1 1"/>${txt(34, 32, '除息', 3, '#ff9c86', 'start')}
    ${poly([[30, 36], [44, 34], [56, 30], [66, 26], [76, 23], [88, 22]], GR, 1.3)}<circle cx="88" cy="22" r="1.8" fill="${GR}"/>${txt(84, 30, '填息', 3.4, GR)}
    <g transform="translate(22 48)" fill="${k}" stroke="${G}" stroke-width=".4"><path d="M-8 4 Q-6 -3 2 -2 L5 -6 L6 -1 Q9 1 8 4Z"/><path d="M-8 4 Q-16 2 -15 -5 Q-12 0 -6 1Z" fill="${W}" stroke="${G}"/><path d="M3 -5 L4 -9 L6 -4Z"/></g>`),
  margin_artisan: k => svg('fund', `${ground(k)}
    <g transform="translate(50 15)"><rect x="-36" y="-5" width="72" height="10" fill="${k}" stroke="${G}" stroke-width=".5"/><rect x="-36" y="-5" width="43" height="10" fill="#5a6290"/><rect x="7" y="-5" width="29" height="10" fill="${GR}"/>
      ${txt(-14.5, 1.4, '成本 60%', 3.2, W)}${txt(21.5, 1.4, '毛利 40%', 3.2, '#04281c')}${txt(0, -7.4, '售價', 3, GH)}</g>
    <rect x="40" y="48" width="24" height="7" fill="#7a6a4a" stroke="${G}" stroke-width=".5"/><rect x="38" y="55" width="28" height="7" fill="#4a3a2a"/>
    <path d="M44 46 L66 40" stroke="#e9ecf6" stroke-width="1.6" stroke-linecap="round"/><path d="M62 41 L70 38.6" stroke="#6a4a1a" stroke-width="2" stroke-linecap="round"/>
    <g fill="${GH}">${[[48, 42], [52, 40], [46, 39]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join('')}</g>
    ${fig(30, 36, .95, k, `<path d="M33 41 L42 45" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><path d="M27 33 H33" stroke="${W}" stroke-width="1"/>`)}`),
  buyback_monk: k => svg('fund', `${ground(k)}
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${6 + (i % 5) * 7}" y="${12 + Math.floor(i / 5) * 9}" width="5.4" height="7" rx=".6" fill="${i < 3 ? 'none' : W}" stroke="${i < 3 ? GH : k}" stroke-width=".4" stroke-dasharray="${i < 3 ? '1 .8' : ''}"/>`).join('')}
    ${txt(23, 34, '流通股數 ↓', 3.2, GH)}
    <path d="M44 20 Q56 18 64 30" fill="none" stroke="${GH}" stroke-width=".8"/><path d="M62.6 28 L64.6 31.6 L65.6 27.4Z" fill="${GH}"/>
    <path d="M64 30 H90 V54 H64Z" fill="#3a4a3a" stroke="${G}" stroke-width=".6"/><circle cx="77" cy="42" r="6" fill="none" stroke="${G}" stroke-width="1"/><path d="M77 36 V48 M71 42 H83" stroke="${G}" stroke-width=".6"/>
    ${txt(77, 60, '買回', 3.4, GH)}
    ${fig(52, 38, .9, k, `<path d="M48.6 40.6 Q52 38.6 55.4 40.6" fill="none" stroke="${W}" stroke-width=".8"/><path d="M55 42 L62 36" stroke="${G}" stroke-width=".6"/><path d="M48 35.4 Q52 31 56 35.4Z" fill="${W}" stroke="none"/>`)}`),
  eps_farmer: k => svg('fund', `<circle cx="16" cy="12" r="6" fill="url(#sun-gold)"/>
    <path d="M0 42 Q50 36 100 42 V70 H0Z" fill="#2a4a20"/>${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${46 + i * 4} Q50 ${40 + i * 4} 100 ${46 + i * 4}" fill="none" stroke="#4a7a30" stroke-width=".5"/>`).join('')}
    ${['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => { const x = 30 + i * 16; return `<g transform="translate(${x} 46)"><path d="M0 0 L-3 -14 M0 0 L0 -15 M0 0 L3 -14" stroke="#e8c45a" stroke-width="1"/><path d="M-3 -5 H3" stroke="#a87a3a" stroke-width="1.2"/>${[-14, -15, -14].map((y, j) => `<ellipse cx="${(j - 1) * 3}" cy="${y - 1}" rx=".9" ry="2" fill="#f3d27a"/>`).join('')}${txt(0, 8, q, 3, GH)}</g>`; }).join('')}
    ${fig(14, 34, .95, k, `<path d="M17 38 L22 34" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/><path d="M22 34 Q26 30 24 26" fill="none" stroke="#e9ecf6" stroke-width=".8"/><path d="M9.4 31.4 L14 28 L18.6 31.4Z" fill="#c9a86a"/>`)}
    ${txt(62, 20, 'EPS', 5, GH)}`),
  pb_guard: k => svg('fund', `${ground(k)}
    <path d="M22 62 V26 H30 V22 H36 V26 H64 V22 H70 V26 H78 V62Z" fill="#3a4a40" stroke="${G}" stroke-width=".6"/><path d="M42 62 V44 Q50 36 58 44 V62Z" fill="${k}"/>
    <path d="M4 34 H96" stroke="${GH}" stroke-width=".9"/>${txt(96, 32, '每股淨值', 3, GH, 'end')}
    ${poly([[4, 20], [14, 26], [24, 30], [34, 37], [44, 40], [52, 37], [62, 30], [72, 26], [86, 22]], DN, 1.2)}
    <circle cx="44" cy="40" r="2" fill="none" stroke="${G}" stroke-width=".8"/>${txt(44, 50, 'PB &lt; 1', 3.4, GH)}
    ${fig(86, 44, .9, k, `<path d="M90 41 V60" stroke="${G}" stroke-width=".7"/><path d="M88.6 41 L90 37 L91.4 41Z" fill="${W}"/><rect x="81.6" y="47" width="5" height="6" rx="1" fill="#5a6290" stroke="${G}" stroke-width=".3"/>`)}`),
  yield_cat: k => svg('fund', `${ground(k)}
    <g transform="translate(46 38)"><ellipse cx="0" cy="10" rx="13" ry="12" fill="${W}" stroke="${k}" stroke-width=".5"/><circle cx="0" cy="-6" r="10" fill="${W}" stroke="${k}" stroke-width=".5"/>
      <path d="M-9 -12 L-7 -20 L-2 -14Z M9 -12 L7 -20 L2 -14Z" fill="${W}" stroke="${k}" stroke-width=".5"/><path d="M-7.6 -13 L-6.6 -17.4 L-4 -14Z M7.6 -13 L6.6 -17.4 L4 -14Z" fill="${PK}"/>
      <path d="M-5 -6 Q-3.6 -7.6 -2 -6 M2 -6 Q3.6 -7.6 5 -6" fill="none" stroke="${k}" stroke-width=".7"/><path d="M-1.4 -2 Q0 -1 1.4 -2" fill="none" stroke="${k}" stroke-width=".5"/>
      <path d="M-10 0 H10 V2.6 H-10Z" fill="${R}"/><circle cx="0" cy="4" r="2" fill="${G}" stroke="${k}" stroke-width=".3"/>
      <path d="M10 2 Q18 -2 16 -14" fill="none" stroke="${W}" stroke-width="4.6" stroke-linecap="round"/><path d="M10 2 Q18 -2 16 -14" fill="none" stroke="${k}" stroke-width=".4" opacity=".4"/>
      <ellipse cx="-4" cy="12" rx="6" ry="5" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>${txt(-4, 13.4, '萬', 3.6, '#4a2a05')}</g>
    ${[[16, 16], [24, 26], [76, 18], [84, 30], [70, 10]].map(([x, y]) => coin(x, y, 2)).join('')}
    ${txt(80, 54, '殖利率', 3.6, GH)}${txt(80, 60, '5%', 4, GH)}`),
  revenue_seer: k => svg('fund', `${ground(k)}
    <g transform="translate(24 30)"><rect x="-16" y="-18" width="32" height="30" rx="1.4" fill="${W}" stroke="${G}" stroke-width=".5"/><rect x="-16" y="-18" width="32" height="6" fill="${R}"/>${txt(0, -13.6, '每月', 3.2, '#fff')}
      ${Array.from({ length: 15 }, (_, i) => `<rect x="${-13 + (i % 5) * 5.6}" y="${-9 + Math.floor(i / 5) * 6.4}" width="4" height="4.4" fill="${i === 9 ? GR : '#d9cfb8'}"/>`).join('')}${txt(9.4, 0.4, '10', 2.6, '#04281c')}</g>
    <g fill="${GR}">${[10, 12, 11, 14, 16, 19].map((h, i) => `<rect x="${52 + i * 6}" y="${54 - h}" width="4" height="${h}"/>`).join('')}</g><g fill="#5a6290">${[8, 9, 9, 10, 11, 12].map((h, i) => `<rect x="${52 + i * 6 + 4}" y="${54 - h}" width="1.6" height="${h}"/>`).join('')}</g>
    ${txt(70, 30, '年增 +18%', 3.6, GR)}
    <circle cx="70" cy="13" r="6" fill="#cfe8ff" opacity=".45" stroke="${GH}" stroke-width=".5"/><path d="M66 19 H74 L72 21 H68Z" fill="${G}"/>`),
  dupont_sisters: k => svg('fund', `${ground(k)}
    ${[['淨利率', 13, PK], ['周轉率', 35, BL], ['權益乘數', 57, G]].map(([t, x, c], i) => `${fig(x, 30, 1, k, `<path d="M${x - 2.6} 26.4 Q${x} 23 ${x + 2.6} 26.4Z" fill="${c}" stroke="none"/>`)}<rect x="${x - 9}" y="47" width="18" height="6" rx="1" fill="${k}" stroke="${c}" stroke-width=".6"/>${txt(x, 51.6, t, 3, c)}${i < 2 ? txt(x + 12, 38, '×', 5, GH) : ''}`).join('')}
    ${txt(71, 38, '＝', 5, GH)}<rect x="76" y="30" width="18" height="12" rx="1.4" fill="${GR}" stroke="${k}" stroke-width=".5"/>${txt(85, 38.4, 'ROE', 4.2, '#04281c')}`),
  roe_knight: k => svg('fund', `${ground(k)}
    <g fill="${k}" stroke="${G}" stroke-width=".5" stroke-linejoin="round"><path d="M28 44 Q30 36 44 36 L60 36 Q66 34 70 28 L74 30 L70 38 Q70 44 64 46 L62 58 L58 58 L58 47 L40 47 L38 58 L34 58 L34 47 Q28 48 28 44Z"/>
      <path d="M70 28 L76 24 L78 28 L74 31Z"/><path d="M44 36 Q46 26 50 22 Q54 26 54 36Z"/><circle cx="50" cy="19" r="3"/></g>
    <path d="M52 22 L60 6" stroke="${G}" stroke-width=".7"/><path d="M60 6 L76 9 L60 13Z" fill="${GR}" stroke="${k}" stroke-width=".3"/>${txt(67, 11.2, 'ROE 15%', 2.8, '#04281c')}
    <path d="M30 40 L24 44" stroke="${W}" stroke-width=".6"/>${txt(20, 20, '股東權益', 3, GH)}`),
  inventory_monk: k => svg('fund', `${ground(k)}
    <path d="M14 30 L50 14 L86 30Z" fill="#3a4a40" stroke="${G}" stroke-width=".5"/><rect x="18" y="30" width="64" height="32" fill="#2a3a30" stroke="${G}" stroke-width=".5"/>
    <g transform="translate(50 45)"><circle r="11" fill="none" stroke="${GH}" stroke-width="1" stroke-dasharray="4 2"/><path d="M11 0 L13.6 -3 L8.4 -3Z M-11 0 L-13.6 3 L-8.4 3Z" fill="${GH}"/>
      ${[[0, -11], [9.5, 5.5], [-9.5, 5.5]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 2.6}" width="6" height="5.2" fill="#c99a3f" stroke="${k}" stroke-width=".3"/>`).join('')}${txt(0, 1.6, '周轉', 3.6, GH)}</g>
    <path d="M70 26 Q72 20 76 18" fill="none" stroke="#cfd6e0" stroke-width=".8" opacity=".7"/>
    ${fig(80, 42, .85, k, `<path d="M76 45 Q80 43 84 45" fill="none" stroke="${W}" stroke-width=".6"/><circle cx="80" cy="41.6" r="2.2" fill="#3a1a28" stroke="none"/>`)}`),
  guidance_herald: k => svg('fund', `${ground(k)}
    ${poly([[44, 52], [56, 52], [56, 42], [68, 42], [68, 32], [80, 32], [80, 22], [94, 22]], UP, 1.4)}${[[56, 47], [68, 37], [80, 27]].map(([x, y]) => txt(x + 4, y, '↑', 3.6, UP)).join('')}
    <g transform="translate(26 22)"><rect x="-12" y="-7" width="24" height="16" fill="${W}" stroke="#a87a3a" stroke-width=".6"/><path d="M-13 -8 V10 M13 -8 V10" stroke="#8a5a2a" stroke-width="1.8" stroke-linecap="round"/>
      ${txt(0, -1, '財測', 3.6, '#5a2a1a')}${txt(0, 5.6, '上修', 4.4, '#b0472f')}</g>
    ${fig(26, 38, .95, k, `<path d="M22 41 L18 34 M30 41 L34 34" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/><path d="M22.6 34.6 Q26 30.6 29.4 34.6Z" fill="${R}" stroke="none"/>`)}`),
  /* ★3 */
  fcf_colossus: k => svg('fund', `${ground(k)}
    <path d="M4 18 H40" stroke="${BL}" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>${txt(22, 14, '營業現金流', 3, GR)}
    <path d="M40 18 Q46 18 46 26" fill="none" stroke="${BL}" stroke-width="3.4" opacity=".85"/><path d="M40 18 Q44 18 46 10 H58" fill="none" stroke="#ff9c86" stroke-width="2" opacity=".85"/>${txt(70, 11.6, '−資本支出', 3, '#ff9c86')}
    <g fill="#5a6a70" stroke="${G}" stroke-width=".5" stroke-linejoin="round"><rect x="38" y="30" width="16" height="16" rx="1"/><rect x="42" y="22" width="8" height="8" rx="1.4"/><rect x="31" y="31" width="7" height="13" rx="1"/><rect x="54" y="31" width="7" height="13" rx="1"/><rect x="39" y="46" width="6" height="14"/><rect x="47" y="46" width="6" height="14"/></g>
    <rect x="44" y="25" width="4" height="1.4" fill="${GH}"/><path d="M41 36 H51 M41 40 H51" stroke="${G}" stroke-width=".4"/>
    ${[[66, 50], [72, 54], [78, 50], [84, 54]].map(([x, y]) => coin(x, y, 2)).join('')}${txt(76, 44, '自由現金流', 3.2, GH)}`, [46, 30]),
  dcf_oracle: k => svg('fund', `${ground(k)}
    <path d="M8 46 H94" stroke="${GH}" stroke-width=".6"/>${['今天', '1年', '2年', '3年', '4年', '5年'].map((t, i) => txt(12 + i * 16, 54, t, 2.8, GH)).join('')}
    ${[0, 1, 2, 3, 4, 5].map(i => { const x = 12 + i * 16, r = 6.2 - i * .8; return i ? `${coin(x, 38, r)}<path d="M${x - 5} 30 Q${(x + 10) / 2} 22 12 32" fill="none" stroke="${GR}" stroke-width=".45" stroke-dasharray="1 .8"/>` : ''; }).join('')}
    <circle cx="12" cy="38" r="7" fill="url(#gold-v)" stroke="${GH}" stroke-width=".8"/>${txt(12, 39.4, '現值', 3, '#4a2a05')}
    ${txt(58, 18, '折現 ÷ (1+r)ⁿ', 3.8, GR)}
    <circle cx="80" cy="14" r="6" fill="#cfe8ff" opacity=".4" stroke="${GH}" stroke-width=".5"/><path d="M76 20 H84 L82 22 H78Z" fill="${G}"/>`, [10, 38]),
  capex_smith: k => svg('fund', `${ground(k)}
    <path d="M58 62 V34 L68 40 V34 L78 40 V34 L88 40 V62Z" fill="#3a4a40" stroke="${G}" stroke-width=".5"/><rect x="82" y="22" width="4" height="12" fill="#3a4a40" stroke="${G}" stroke-width=".4"/>
    <path d="M84 20 Q82 14 86 10 Q84 6 88 4" fill="none" stroke="#cfd6e0" stroke-width="1" opacity=".6"/>${txt(73, 54, '產線', 3.6, GH)}
    <path d="M24 50 H44 L40 54 H28Z" fill="#5a5a6a" stroke="${G}" stroke-width=".5"/><rect x="31" y="54" width="6" height="8" fill="#4a4a5a"/>
    <path d="M30 48 L42 46" stroke="#ff8a3a" stroke-width="1.6" filter="url(#glow)"/>
    <g fill="#ffb347">${[[36, 42], [40, 40], [33, 41], [44, 43]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7"/>`).join('')}</g>
    ${fig(18, 30, 1.1, k, `<path d="M21 34 L30 24" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/><rect x="27" y="20" width="7" height="4" fill="#8a8a9a" stroke="${G}" stroke-width=".3" transform="rotate(-40 30 22)"/>`)}
    ${txt(30, 10, '明年營收的刀刃', 3.2, GH)}`, [36, 44]),
  peg_navigator: k => svg('fund', `<path d="M0 50 Q25 46 50 50 T100 50 V70 H0Z" fill="#0d3a4a"/><path d="M0 54 Q25 50 50 54 T100 54" fill="none" stroke="#7fd0e0" stroke-width=".5"/>
    <g transform="translate(46 44)"><path d="M-18 0 H18 L13 7 H-13Z" fill="#6a4a1a" stroke="${G}" stroke-width=".5"/><path d="M0 0 V-30" stroke="${G}" stroke-width=".8"/>
      <path d="M1 -28 Q16 -18 1 -4Z" fill="${W}" stroke="${k}" stroke-width=".4"/><path d="M-1 -26 Q-12 -16 -1 -6Z" fill="${W}" stroke="${k}" stroke-width=".4" opacity=".9"/>${txt(7, -14, 'PEG', 3.6, '#04281c')}</g>
    <g stroke="#e9ecf6" stroke-width=".6" opacity=".7"><path d="M4 18 Q14 16 22 20"/><path d="M6 26 Q16 24 26 28"/></g>${txt(14, 12, '順風', 3.4, GH)}
    <g transform="translate(82 22)"><circle r="9" fill="${k}" stroke="${G}" stroke-width=".7"/><path d="M0 -7 L2 0 L0 7 L-2 0Z" fill="${R}"/><path d="M-7 0 L0 2 L7 0 L0 -2Z" fill="${W}" opacity=".7"/></g>
    ${txt(74, 40, '本益比 ÷ 成長率 &lt; 1', 3.2, GH)}`, [82, 22]),
};

const CACHE = {};
/* the card's own illustration, or '' when it has none */
export function ownArt(m) {
  const f = ART[m.id]; if (!f) return '';
  return CACHE[m.id] || (CACHE[m.id] = f(INK[m.cat] || '#000'));
}
export const OWN_IDS = Object.keys(ART);
