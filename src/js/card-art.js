// card-art.js — exclusive illustrations for ★1–★3 cards (all nine attributes, 16 cards each).
// Each picture shows what the card is about (a ledger, an abacus with budget envelopes, a snowball…), so the card can
// be recognised at a glance instead of sharing one of three attribute backdrops. Same 100 × 70 box as the scenes;
// never hue-shifted or mirrored. Rarity still shows in the frame: ★1–★2 on the plain sky, ★3 with a soft sunburst
// (極稀有 keep their full gold sunburst in ur-art.js).
const INK = { money: '#14031a', tech: '#04102e', fund: '#021a14', etf: '#0a1403', fx: '#021419', chips: '#1a0f02', risk: '#1e0604', deriv: '#08021a', crypto: '#10020f' };
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
/* a coin stamped with a currency sign */
const cur = (x, y, r, sym, c = G, ink = '#2a1a05') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#6b470f" stroke-width=".35"/><text x="${x}" y="${f1(y + r * .42)}" font-size="${f1(r * 1.2)}" font-family="serif" fill="${ink}" text-anchor="middle">${sym}</text>`;
/* a blockchain block (isometric cube) */
const blk = (x, y, s = 1, c = '#d9467f') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -5 L5 -2.4 L0 .2 L-5 -2.4Z" fill="#ffd2e6" stroke="#10020f" stroke-width=".3"/><path d="M-5 -2.4 L0 .2 V6 L-5 3.4Z" fill="${c}" stroke="#10020f" stroke-width=".3"/><path d="M5 -2.4 L0 .2 V6 L5 3.4Z" fill="#8a1a4a" stroke="#10020f" stroke-width=".3"/></g>`;
/* a heater shield */
const shield = (x, y, s, fill, stroke = G) => `<path d="M${x} ${f1(y - 9 * s)} L${f1(x + 8 * s)} ${f1(y - 6 * s)} Q${f1(x + 8 * s)} ${f1(y + 6 * s)} ${x} ${f1(y + 10 * s)} Q${f1(x - 8 * s)} ${f1(y + 6 * s)} ${f1(x - 8 * s)} ${f1(y - 6 * s)}Z" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
/* option payoff axes: zero line at y0 */
const axes = (y0 = 40, c = '#b9a6e0') => `<path d="M6 ${y0} H94" stroke="${c}" stroke-width=".5"/><path d="M50 8 V60" stroke="${c}" stroke-width=".3" opacity=".5"/>`;
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

  /* ETF — baskets, crowds and little creatures (技術分析 draws charts, 基本面 objects) */
  tracking_hound: k => svg('etf', `${ground(k)}
    <path d="M4 50 Q40 44 96 50" fill="none" stroke="#c9b98f" stroke-width=".8" stroke-dasharray="2 1.4"/>
    ${fig(68, 30, .9, k, `<path d="M71.4 30 L77 20" stroke="${G}" stroke-width=".6"/><path d="M77 20 h7 v5 h-7Z" fill="${GH}"/><path d="M64 40 L60 44 M72 40 L76 43" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`)}${txt(80.5, 23.8, '指數', 2.6, '#3a3a05')}
    <g transform="translate(40 44)" fill="${k}" stroke="${G}" stroke-width=".45" stroke-linejoin="round"><path d="M-12 0 Q-10 -6 -2 -6 L6 -6 L10 -11 L14 -9 L12 -5 L14 -2 L9 -3 L6 0 L4 4 L1 4 L2 0 L-6 0 L-8 4 L-11 4Z"/><path d="M-12 -2 L-17 -6" stroke-width="1"/><circle cx="11" cy="-8" r=".5" fill="${GH}" stroke="none"/></g>
    <path d="M54 34 H62" stroke="${R}" stroke-width=".7"/><path d="M54 32 V36 M62 32 V36" stroke="${R}" stroke-width=".5"/>${txt(58, 30, '追蹤誤差', 3, '#ff9c86')}`),
  dca_ant: k => svg('etf', `${ground(k)}
    <path d="M58 62 Q74 26 92 62Z" fill="#6a5a2a" stroke="${G}" stroke-width=".5"/>${[[66, 56], [74, 52], [82, 56], [70, 46], [78, 44], [74, 36]].map(([x, y]) => coin(x, y, 2)).join('')}
    ${[[12, 58], [26, 58], [40, 58], [52, 56]].map(([x, y], i) => `<g transform="translate(${x} ${y})" fill="${k}" stroke="${G}" stroke-width=".35"><ellipse cx="-3" cy="0" rx="2.4" ry="1.6"/><ellipse cx="0.6" cy="-.4" rx="1.4" ry="1.2"/><circle cx="3" cy="-1" r="1.2"/><path d="M-3 1 L-4.6 3 M-1 1 L-1 3 M1 1 L2.6 3" stroke-width=".5"/></g>${coin(x + 3, y - 4.4, 1.7)}${txt(x, y - 9, `${i + 1}月`, 2.6, GH)}`).join('')}
    ${txt(30, 14, '每月扣款，不管漲跌', 3.4, GH)}`),
  fee_mouse: k => svg('etf', `${ground(k)}
    <g transform="translate(46 34)"><circle r="18" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".6"/><circle r="13.4" fill="none" stroke="#6b470f" stroke-width=".5" opacity=".6"/>${txt(0, 2, '淨值', 6, '#4a2a05')}
      <path d="M12 -12 Q16 -10 18 -6 Q14 -5 14 -2 Q10 -4 9 -8Z" fill="#05140a"/></g>
    <g transform="translate(74 24)" fill="#8a8a96" stroke="${k}" stroke-width=".4"><ellipse cx="0" cy="2" rx="7" ry="4.6"/><circle cx="-6" cy="-1" r="3.4"/><circle cx="-6.6" cy="-4.6" r="1.8" fill="${PK}"/><circle cx="-8.4" cy="-.6" r=".5" fill="${k}"/><path d="M7 2 Q14 0 12 10" fill="none" stroke="#8a8a96" stroke-width=".8"/></g>
    <g fill="${GH}">${[[66, 22], [64, 26], [68, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join('')}</g>
    ${txt(78, 52, '每年 0.4%', 3.6, '#ff9c86')}`),
  creation_envoy: k => svg('etf', `${ground(k)}
    <g transform="translate(22 40)"><path d="M-14 -4 H14 L11 12 H-11Z" fill="#8a6a2a" stroke="${G}" stroke-width=".6"/><path d="M-14 -4 Q0 -14 14 -4" fill="none" stroke="#a87a3a" stroke-width="1.2"/>
      ${[[-9, -7, '#3f7fe0'], [-3, -9, R], [3, -8, GR], [9, -6, G], [-6, -2, PK], [5, -2, BL]].map(([x, y, c]) => `<rect x="${x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" rx=".6" fill="${c}" stroke="${k}" stroke-width=".3"/>`).join('')}${txt(0, 8, '一籃子股票', 3, W)}</g>
    <path d="M40 34 H58" stroke="${GH}" stroke-width=".8"/><path d="M56 32 L60 34 L56 36Z" fill="${GH}"/><path d="M58 42 H40" stroke="${GH}" stroke-width=".8"/><path d="M42 40 L38 42 L42 44Z" fill="${GH}"/>
    <g transform="translate(76 38)"><rect x="-11" y="-12" width="22" height="22" fill="${W}" stroke="${G}" stroke-width=".6"/><path d="M-11 -12 V10 M11 -12 V10" stroke="#a87a3a" stroke-width="1.8"/>${txt(0, -4, '受益', 3.6, '#3a2a05')}${txt(0, 2, '憑證', 3.6, '#3a2a05')}<circle cx="5" cy="6" r="2" fill="${R}"/></g>
    ${fig(50, 14, .7, k, '')}`),
  premium_imp: k => svg('etf', `${ground(k)}
    <rect x="22" y="34" width="18" height="28" fill="#5a6290" stroke="${k}" stroke-width=".5"/>${txt(31, 50, '淨值', 3.6, W)}
    <rect x="52" y="24" width="18" height="38" fill="${UP}" stroke="${k}" stroke-width=".5" opacity=".85"/>${txt(61, 46, '市價', 3.6, '#fff')}
    <path d="M18 34 H76" stroke="${GH}" stroke-width=".5" stroke-dasharray="1.4 1"/><path d="M76 24 V34" stroke="${GH}" stroke-width=".6"/><path d="M74.6 25.6 L76 23.6 L77.4 25.6Z" fill="${GH}"/>${txt(84, 31, '溢價', 3.6, GH)}
    <g transform="translate(61 16)" fill="#6a1a3a" stroke="${G}" stroke-width=".4"><circle r="4.4"/><path d="M-3.4 -2.6 L-5 -7 L-1.6 -3.8Z M3.4 -2.6 L5 -7 L1.6 -3.8Z"/><path d="M-2 1.4 Q0 3 2 1.4" fill="none" stroke="${GH}" stroke-width=".5"/><circle cx="-1.6" cy="-.6" r=".6" fill="${GH}" stroke="none"/><circle cx="1.6" cy="-.6" r=".6" fill="${GH}" stroke="none"/><path d="M-3 4 Q-4 8 -2 8 M3 4 Q4 8 2 8" fill="none" stroke-width=".6"/><path d="M4 2 Q9 2 8 -3 L10 -4" fill="none" stroke-width=".6"/></g>`),
  index_scroll: k => svg('etf', `${ground(k)}
    <path d="M14 12 H86 V54 H14Z" fill="${W}" stroke="#a87a3a" stroke-width=".6"/><rect x="10" y="10" width="5" height="46" rx="2.4" fill="#8a5a2a" stroke="${G}" stroke-width=".4"/><rect x="85" y="10" width="5" height="46" rx="2.4" fill="#8a5a2a" stroke="${G}" stroke-width=".4"/>
    ${txt(50, 20, '成分股 50 家', 4, '#3a2a05')}
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${f1(20 + (i % 6) * 10.4)}" y="${25 + Math.floor(i / 6) * 5.4}" width="8" height="3.4" rx=".6" fill="${['#3f7fe0', '#2f9e74', R, G, PK, BL][i % 6]}" opacity="${i === 23 ? .25 : .8}"/>`).join('')}
    <path d="M70.4 44.4 h8" stroke="${R}" stroke-width=".7"/>${txt(50, 60, '定期改寫', 3.2, GH)}`),
  mcap_giant: k => svg('etf', `${ground(k)}
    ${[[22, 14, 1.9], [44, 26, 1.35], [60, 34, 1.0], [72, 39, .8], [82, 42, .65], [90, 44, .55]].map(([x, y, s]) => fig(x, y, s, k, '')).join('')}
    ${txt(22, 8, '市值最大', 3.2, GH)}<path d="M8 60 L96 46" stroke="${GR}" stroke-width=".7" stroke-dasharray="1.4 1"/>${txt(72, 62, '越大越前面', 3, GR)}`),
  dividend_lantern: k => svg('etf', `${ground(k)}
    <path d="M4 14 Q50 26 96 14" fill="none" stroke="#a87a3a" stroke-width=".6"/>
    ${[['Q1', 16, 17], ['Q2', 38, 21], ['Q3', 62, 21], ['Q4', 84, 17]].map(([q, x, y]) => `<path d="M${x} ${y} V${y + 3}" stroke="#a87a3a" stroke-width=".5"/><ellipse cx="${x}" cy="${y + 10}" rx="6" ry="7.4" fill="${R}" stroke="${G}" stroke-width=".5" filter="url(#glow)"/><path d="M${x - 6} ${y + 10} H${x + 6} M${x - 5} ${y + 6} H${x + 5} M${x - 5} ${y + 14} H${x + 5}" stroke="#ffb08a" stroke-width=".4"/><rect x="${x - 3}" y="${y + 2.6}" width="6" height="1.4" fill="${k}"/><rect x="${x - 3}" y="${y + 16.6}" width="6" height="1.4" fill="${k}"/>${txt(x, y + 11.4, q, 3.2, GH)}`).join('')}
    <path d="M8 62 Q40 50 60 54 T96 46" fill="none" stroke="#f3d27a" stroke-width="1" opacity=".7" stroke-dasharray="1.6 1.2"/>
    <path d="M80 50 L86 46 L92 50 V58 H80Z" fill="${W}" stroke="${G}" stroke-width=".4"/>${fig(30, 46, .7, k, '')}${txt(50, 46, '每季配息', 3.4, GH)}`),
  leveraged_oni: k => svg('etf', `${ground(k)}
    ${poly([[4, 40], [14, 28], [24, 44], [34, 30], [44, 46], [54, 32], [64, 48], [74, 34], [84, 50], [96, 38]], R, 1.2)}${poly([[4, 40], [14, 34], [24, 42], [34, 35], [44, 43], [54, 36], [64, 44], [74, 37], [84, 45], [96, 39]], GH, .8, 'stroke-dasharray="1.4 1"')}
    ${txt(8, 60, '- - 指數', 3, GH, 'start')}${txt(36, 60, '— 正二', 3, '#ff9c86', 'start')}${txt(78, 60, '盤整耗損', 3, '#ff9c86')}
    <g transform="translate(76 14)"><circle r="7" fill="#8a1a1a" stroke="${G}" stroke-width=".5"/><path d="M-4 -5 L-6 -11 L-2 -6Z M4 -5 L6 -11 L2 -6Z" fill="${W}"/><path d="M-3 -1 L-1 0 M3 -1 L1 0" stroke="${GH}" stroke-width=".8"/><path d="M-3 3 Q0 1.4 3 3" fill="none" stroke="${W}" stroke-width=".6"/></g>${txt(60, 17, '×2', 6, '#ff9c86')}`),
  inverse_shade: k => svg('etf', `${ground(k)}
    <path d="M4 34 H96" stroke="${W}" stroke-width=".3" opacity=".5"/>
    ${poly([[4, 30], [20, 22], [36, 26], [52, 14], [68, 20], [84, 10], [96, 14]], GR, 1.3)}${poly([[4, 38], [20, 46], [36, 42], [52, 54], [68, 48], [84, 58], [96, 54]], '#b9a6e0', 1.3)}
    ${txt(94, 8, '指數', 3.2, GR, 'end')}${txt(94, 62, '反向', 3.2, '#b9a6e0', 'end')}
    <g transform="translate(30 40)" opacity=".8"><path d="M-6 10 Q-7 -6 0 -8 Q7 -6 6 10 L4 7 L2 10 L0 7 L-2 10 L-4 7Z" fill="#3a2a5a" stroke="#b9a6e0" stroke-width=".4"/><circle cx="-2.2" cy="-2" r="1" fill="#b9a6e0"/><circle cx="2.2" cy="-2" r="1" fill="#b9a6e0"/></g>
    ${txt(30, 30, '鏡像', 3, GH)}`),
  bond_etf_monk: k => svg('etf', `${ground(k)}
    <path d="M50 52 L44 60 H56Z" fill="${G}"/><path d="M16 44 L84 58" stroke="#a87a3a" stroke-width="2" stroke-linecap="round"/>
    <g transform="translate(22 34)"><rect x="-9" y="-6" width="18" height="10" rx="1" fill="#2f5a4a" stroke="${G}" stroke-width=".5"/>${txt(0, 1, '債券價格', 3, GR)}</g>${txt(22, 24, '↑', 6, GR)}
    <g transform="translate(78 48)"><rect x="-8" y="-6" width="16" height="10" rx="1" fill="#5a2a2a" stroke="${G}" stroke-width=".5"/>${txt(0, 1, '利率', 3.4, '#ff9c86')}</g>${txt(78, 38, '↓', 6, '#ff9c86')}
    ${fig(50, 16, .9, k, `<path d="M45.6 20 Q50 18 54.4 20" fill="none" stroke="${W}" stroke-width=".5"/><rect x="54" y="20" width="6" height="4" rx="1.6" fill="${W}" stroke="#a87a3a" stroke-width=".3"/><circle cx="50" cy="15.2" r="2.6" fill="#3a1a28" stroke="none"/>`)}`),
  lp_merchant: k => svg('etf', `${ground(k)}
    <rect x="18" y="20" width="64" height="8" fill="${R}" stroke="${G}" stroke-width=".4"/><path d="M18 20 Q50 12 82 20" fill="#a83a2a"/>
    <rect x="22" y="28" width="56" height="30" fill="#3a2a1a" stroke="${G}" stroke-width=".5"/>
    ${[0, 1, 2, 3].map(i => `<rect x="26" y="${31 + i * 6}" width="${14 - i * 2}" height="4" fill="${GR}" opacity=".85"/>${txt(44, 34.4 + i * 6, (25.6 - i * 0.05).toFixed(2), 2.6, GR)}<rect x="${74 - (8 + i * 2)}" y="${31 + i * 6}" width="${8 + i * 2}" height="4" fill="${UP}" opacity=".85"/>${txt(57, 34.4 + i * 6, (25.65 + i * 0.05).toFixed(2), 2.6, '#ff9c86')}`).join('')}
    ${txt(30, 17, '委買', 3.4, GR)}${txt(70, 17, '委賣', 3.4, '#ff9c86')}
    ${fig(50, 30, .7, k, '')}`),
  /* ★3 */
  factor_strategist: k => svg('etf', `${ground(k)}
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${30 + c * 10}" y="${18 + r * 10}" width="10" height="10" fill="${(r + c) % 2 ? '#1a2a10' : '#3a4a20'}" stroke="${k}" stroke-width=".3"/>`).join('')).join('')}
    ${[['價值', 35, 23, G], ['動能', 55, 33, UP], ['低波', 75, 43, BL], ['品質', 45, 43, PK], ['規模', 65, 23, GR]].map(([t, x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="${k}" stroke="${c}" stroke-width=".7"/>${txt(x, y + 1.2, t, 2.6, c)}`).join('')}
    ${fig(16, 26, 1, k, `<path d="M19 30 L24 26 L26 31Z" fill="${W}" stroke="${k}" stroke-width=".3"/><path d="M12.6 23 Q16 19 19.4 23Z" fill="${G}" stroke="none"/>`)}`, [55, 33]),
  theme_comet: k => svg('etf', `<g fill="#fff">${[[10, 50], [24, 58], [40, 44], [88, 52], [70, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join('')}</g>
    <path d="M78 16 Q50 26 8 50" fill="none" stroke="${GH}" stroke-width="7" stroke-linecap="round" opacity=".18"/><path d="M78 16 Q52 25 18 44" fill="none" stroke="${GH}" stroke-width="3" stroke-linecap="round" opacity=".4"/>
    <circle cx="78" cy="16" r="5" fill="#fff6d8" filter="url(#glow)"/>
    ${[['AI', 62, 22], ['電動車', 46, 30], ['元宇宙', 28, 40]].map(([t, x, y], i) => txt(x, y, t, 3.4, GH).replace('fill', `opacity="${1 - i * .3}" fill`)).join('')}
    ${ground(k)}${txt(80, 60, '熱潮一過便消失', 3, GH)}`, [78, 16]),
  active_ronin: k => svg('etf', `${ground(k)}
    <g transform="translate(64 24)"><rect x="-28" y="-9" width="56" height="16" rx="2" fill="${W}" stroke="${G}" stroke-width=".7"/>${txt(-6, 3, '00981', 8, '#3a2a05')}<circle cx="18" cy="-1" r="7" fill="${R}"/>${txt(18, 2, 'A', 8, '#fff')}</g>
    ${txt(64, 42, '第六碼 A ＝ 主動式', 3.4, GH)}
    ${fig(20, 30, 1.2, k, `<path d="M24 36 L40 22" stroke="#e9ecf6" stroke-width="1" stroke-linecap="round"/><path d="M24 36 L22 38" stroke="#6a4a1a" stroke-width="1.6"/><path d="M15.4 26.4 Q20 22 24.6 26.4Z" fill="${k}"/><path d="M14 29 L11 31" stroke="${R}" stroke-width=".7"/>`)}
    <path d="M40 22 L52 50" stroke="${GH}" stroke-width=".4" stroke-dasharray="1 1"/>`, [64, 24]),
  rebalance_clock: k => svg('etf', `${ground(k)}
    <g transform="translate(36 34)"><circle r="20" fill="${W}" stroke="${G}" stroke-width="1"/><circle r="17" fill="none" stroke="#c9b98f" stroke-width=".4"/>
      ${['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; return `<path d="M${f1(15 * Math.cos(a))} ${f1(15 * Math.sin(a))} L${f1(19 * Math.cos(a))} ${f1(19 * Math.sin(a))}" stroke="#3a2a05" stroke-width="1"/>${txt(f1(11 * Math.cos(a)), f1(11 * Math.sin(a) + 1.2), q, 3.2, '#3a2a05')}`; }).join('')}
      <path d="M0 0 L0 -12" stroke="#3a2a05" stroke-width="1.2"/><path d="M0 0 L9 3" stroke="${R}" stroke-width=".9"/><circle r="1.4" fill="${R}"/></g>
    <g transform="translate(76 34)">${[-14, -5, 4, 13].map((y, i) => `<rect x="-8" y="${y - 3}" width="16" height="6" rx="1" fill="${i === 3 ? '#5a3a3a' : '#2f5a4a'}" stroke="${G}" stroke-width=".4" opacity="${i === 3 ? .5 : 1}"/>`).join('')}
      ${txt(0, -12.6, '強', 3, GR)}${txt(0, 15.4, '弱', 3, '#ff9c86')}<path d="M10 13 Q18 13 18 4" fill="none" stroke="${GH}" stroke-width=".6"/><path d="M16.6 5.4 L18 2.6 L19.4 5.4Z" fill="${GH}"/></g>
    ${txt(76, 60, '汰弱留強', 3.4, GH)}`, [36, 34]),

  /* 外匯 — currency coins, globes, ships and flags */
  pip_sprite: k => svg('fx', `${ground(k)}
    ${txt(50, 26, '1.0852', 11, GH)}<rect x="69.4" y="15" width="7.6" height="13" fill="none" stroke="${UP}" stroke-width=".7"/>${txt(73.2, 36, '+1 pip', 3.6, UP)}
    <g transform="translate(30 46)" fill="#bff5ee" stroke="${k}" stroke-width=".3"><circle r="2.4"/><path d="M-1 -1 Q-8 -8 -9 0 Q-6 2 -1 0Z M1 -1 Q8 -8 9 0 Q6 2 1 0Z" opacity=".85"/></g>
    ${txt(50, 56, '萬分之一的跳動', 3.4, GH)}`),
  carry_crane: k => svg('fx', `${ground(k)}
    ${cur(18, 44, 7, '¥', '#cfd6e0')}${txt(18, 56, '借 0.1%', 3, '#cfd6e0')}${cur(82, 44, 7, '$', G)}${txt(82, 56, '存 5%', 3, GR)}
    <path d="M27 44 Q50 34 73 44" fill="none" stroke="${GH}" stroke-width=".7" stroke-dasharray="1.4 1"/><path d="M71 42 L74 44.4 L70.6 45.6Z" fill="${GH}"/>
    <g transform="translate(50 20)" fill="#fff" stroke="${k}" stroke-width=".35"><path d="M-14 0 Q-6 -6 0 -1 Q6 -6 14 0 Q6 -2 0 2 Q-6 -2 -14 0Z"/><path d="M0 -1 L3 -6 L6 -6.4" fill="none" stroke="#fff" stroke-width=".9"/><circle cx="6.4" cy="-6.6" r=".8" fill="${R}" stroke="none"/></g>
    ${txt(50, 33, '每晚收利差', 3.2, GH)}`),
  spot_merchant: k => svg('fx', `${ground(k)}
    <rect x="16" y="28" width="68" height="30" fill="#2a4a4a" stroke="${G}" stroke-width=".5"/><path d="M12 28 L50 16 L88 28Z" fill="#a83a2a" stroke="${G}" stroke-width=".4"/>
    ${[['T', 26], ['T+1', 50], ['T+2', 74]].map(([t, x], i) => `<rect x="${x - 9}" y="36" width="18" height="14" fill="${i === 2 ? GR : W}" stroke="${k}" stroke-width=".4"/>${txt(x, 45, t, 4, i === 2 ? '#04281c' : '#3a2a05')}`).join('')}
    ${txt(26, 34, '成交', 2.8, GH)}${txt(74, 34, '交割', 2.8, GH)}<path d="M36 43 H40 M60 43 H64" stroke="${GH}" stroke-width=".7"/>`),
  forward_clerk: k => svg('fx', `${ground(k)}
    <g transform="translate(40 30)"><rect x="-18" y="-16" width="36" height="30" fill="${W}" stroke="#a87a3a" stroke-width=".6"/>${txt(0, -8, '遠期契約', 4, '#3a2a05')}
      ${txt(0, 0, '3 個月後', 3.4, '#3a2a05')}${txt(0, 7, 'USD/TWD 32.0', 3.4, '#b0472f')}<circle cx="11" cy="10" r="2.6" fill="${R}"/></g>
    <path d="M60 20 L74 34" stroke="${W}" stroke-width="1.4" stroke-linecap="round"/>
    ${fig(80, 36, .9, k, `<path d="M76 40 L70 36" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`)}${txt(80, 62, '先鎖匯率', 3, GH)}`),
  traveler_exchanger: k => svg('fx', `${ground(k)}
    <rect x="30" y="16" width="56" height="26" fill="#1a2a3a" stroke="${G}" stroke-width=".5"/>${txt(58, 22.6, '買入　賣出', 3.2, GH)}
    ${[['USD', '31.6', '32.3'], ['JPY', '0.205', '0.218']].map(([c, b, a], i) => `${txt(38, 30 + i * 7, c, 3, W)}${txt(56, 30 + i * 7, b, 3, GR)}${txt(74, 30 + i * 7, a, 3, UP)}`).join('')}
    <path d="M58 44 V50" stroke="${GH}" stroke-width=".5"/>${txt(58, 54, '價差', 3.4, '#ff9c86')}
    ${fig(16, 40, .9, k, `<rect x="19" y="46" width="6" height="8" rx="1" fill="#8a5a2a" stroke="${G}" stroke-width=".3"/><path d="M12.6 37 Q16 33 19.4 37Z" fill="${G}" stroke="none"/>`)}
    <path d="M86 8 L96 4 L94 7 Z" fill="#e9ecf6"/>`),
  yen_tanuki: k => svg('fx', `${cloud(20, 10, 1.2, '#1a2a3a')}${cloud(80, 12, 1, '#1a2a3a')}<g stroke="${BL}" stroke-width=".5" opacity=".6">${Array.from({ length: 10 }, (_, i) => `<path d="M${8 + i * 9} ${18 + (i % 2) * 3} l-2 5"/>`).join('')}</g>${ground(k)}
    <g transform="translate(50 44)"><ellipse cx="0" cy="6" rx="12" ry="11" fill="#8a6a4a" stroke="${k}" stroke-width=".5"/><circle cx="0" cy="-8" r="8" fill="#8a6a4a" stroke="${k}" stroke-width=".5"/><path d="M-7 -12 L-6 -17 L-3 -14Z M7 -12 L6 -17 L3 -14Z" fill="#8a6a4a"/>
      <ellipse cx="-3" cy="-8" rx="2.4" ry="1.8" fill="#3a2a1a"/><ellipse cx="3" cy="-8" rx="2.4" ry="1.8" fill="#3a2a1a"/><circle cx="-3" cy="-8" r=".6" fill="#fff"/><circle cx="3" cy="-8" r=".6" fill="#fff"/>
      ${cur(0, 6, 7, '¥', G)}</g>${txt(84, 50, '避險貨幣', 3.4, GH)}`),
  dxy_general: k => svg('fx', `${ground(k)}
    ${fig(50, 18, 1.2, k, `<path d="M44.6 15 Q50 10 55.4 15Z" fill="${G}" stroke="none"/>`)}${cur(50, 30, 4, '$', G)}
    ${(() => { let x = 8; return [['€', 57.6, '#3f7fe0'], ['¥', 13.6, R], ['£', 11.9, '#8a2a5a'], ['C$', 9.1, '#2f9e74'], ['kr', 4.2, '#c3902e'], ['Fr', 3.6, '#7a7a8a']].map(([sym, w, c]) => { const ww = w * .84, r = `<rect x="${f1(x)}" y="46" width="${f1(ww)}" height="10" fill="${c}" stroke="${k}" stroke-width=".3"/>${ww > 5 ? txt(f1(x + ww / 2), 52.6, sym, 3.6, '#fff') : ''}`; x += ww; return r; }).join(''); })()}
    ${txt(32, 43, '歐元近六成', 3, GH)}`),
  ppp_monk: k => svg('fx', `${ground(k)}
    ${[[22, '$5.7', '美'], [50, '¥450', '日'], [78, 'NT$75', '台']].map(([x, p, n]) => `<g transform="translate(${x} 40)"><path d="M-8 -2 Q-8 -8 0 -8 Q8 -8 8 -2Z" fill="#d9a35a" stroke="${k}" stroke-width=".3"/><rect x="-8.4" y="-2" width="16.8" height="2" fill="${GR}"/><rect x="-8.4" y="0" width="16.8" height="2.4" fill="#6a3a1a"/><path d="M-8 2.4 H8 Q8 5 0 5 Q-8 5 -8 2.4Z" fill="#d9a35a" stroke="${k}" stroke-width=".3"/>
      ${txt(0, 12, p, 3.4, GH)}${txt(0, -12, n, 3.6, W)}</g>`).join('')}
    ${txt(50, 18, '一個漢堡道出匯率', 3.4, GH)}`),
  irp_scholar: k => svg('fx', `${ground(k)}
    <g transform="translate(50 40)"><path d="M0 14 L-4 18 H4Z" fill="${G}"/><path d="M-30 4 L30 14" stroke="#a87a3a" stroke-width="1.6"/>
      <g transform="translate(-24 -6)">${cur(0, 0, 7, '%', G)}${txt(0, -10, '高利率', 3, GR)}</g><g transform="translate(24 4)">${cur(0, 0, 5, '%', '#cfd6e0')}${txt(0, -8, '低利率', 3, W)}</g></g>
    ${txt(50, 14, '高利率貨幣 → 遠期貼水', 3.4, GH)}`),
  swap_twins: k => svg('fx', `${ground(k)}
    ${fig(28, 26, 1, k, '')}${fig(72, 26, 1, k, '')}
    <path d="M36 32 Q50 24 64 32" fill="none" stroke="${GR}" stroke-width=".9"/><path d="M62 30 L65 32.6 L61.4 33.4Z" fill="${GR}"/>${txt(50, 23, '今日買入', 3, GR)}
    <path d="M64 44 Q50 52 36 44" fill="none" stroke="${UP}" stroke-width=".9"/><path d="M38 46 L35 43.4 L38.6 42.6Z" fill="${UP}"/>${txt(50, 56, '日後賣回', 3, UP)}
    ${cur(50, 38, 4, '$', G)}`),
  central_hand: k => svg('fx', `${ground(k)}
    ${poly([[4, 16], [20, 22], [34, 32], [46, 44], [54, 48]], DN, 1.3)}${poly([[54, 48], [66, 40], [80, 34], [96, 32]], UP, 1.3)}
    <path d="M42 70 Q42 56 50 54 L54 50 Q56 48 58 50 L58 46 Q60 44 62 46 L62 52 Q66 56 64 70Z" fill="#cfd6e0" opacity=".55" stroke="${GH}" stroke-width=".4"/>
    ${txt(24, 10, '匯率急貶', 3.4, DN)}${txt(80, 26, '央行進場', 3.4, GH)}`),
  eurusd_knights: k => svg('fx', `${ground(k)}
    ${[[30, '#3f7fe0', '€'], [66, R, '$']].map(([x, c, sym]) => `<g transform="translate(${x} 44)" fill="${k}" stroke="${G}" stroke-width=".4"><path d="M-12 4 Q-10 -4 0 -4 L8 -4 Q12 -6 14 -10 L16 -8 L13 -2 Q13 4 8 5 L7 14 L4 14 L4 6 L-6 6 L-7 14 L-10 14 L-10 6 Q-13 6 -12 4Z"/><path d="M-2 -4 Q0 -12 2 -14 Q4 -12 4 -4Z"/><circle cx="2" cy="-16" r="2.4"/></g>${shield(x - 6, 40, .5, c)}${txt(x - 6, 41.4, sym, 3.6, '#fff')}`).join('')}
    ${txt(50, 14, 'EUR / USD', 6, GH)}${txt(50, 22, '成交量最大的貨幣對', 3, GH)}`),
  /* ★3 */
  reserve_dragon: k => svg('fx', `${ground(k)}
    <path d="M10 50 Q20 30 36 40 Q50 50 60 34 Q70 20 84 28" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="round"/>
    ${Array.from({ length: 12 }, (_, i) => { const t = i / 11, x = 10 + t * 74; return cur(f1(x), f1(50 - Math.sin(t * 6) * 9 - t * 12), 2.2, '$', GH); }).join('')}
    <g transform="translate(86 26)" fill="${k}" stroke="${G}" stroke-width=".5"><path d="M-6 2 Q-2 -6 6 -5 Q9 -3 8 0 L4 1 L7 3 Q2 6 -6 2Z"/><circle cx="3" cy="-2.4" r=".8" fill="${R}"/></g>
    ${txt(30, 62, '外匯存底', 3.4, GH)}`, [60, 30]),
  london_bell: k => svg('fx', `${ground(k)}
    <rect x="42" y="18" width="16" height="44" fill="#6a5a3a" stroke="${G}" stroke-width=".5"/><path d="M40 18 L50 6 L60 18Z" fill="#4a3a2a" stroke="${G}" stroke-width=".5"/>
    <circle cx="50" cy="28" r="6" fill="${W}" stroke="${G}" stroke-width=".6"/><path d="M50 28 V24 M50 28 L53 29" stroke="#3a2a05" stroke-width=".6"/>
    ${[[18, 30, '$'], [82, 30, '€'], [22, 50, '¥'], [78, 50, '£']].map(([x, y, sym]) => `${cur(x, y, 4, sym)}<path d="M${x < 50 ? x + 5 : x - 5} ${y} L${x < 50 ? 40 : 60} 36" stroke="${GH}" stroke-width=".4" stroke-dasharray="1 1"/>`).join('')}
    ${txt(50, 68, '全球近四成成交', 3, GH)}`, [50, 28]),
  devalue_storm: k => svg('fx', `<g fill="#1a2a3a">${[18, 50, 82].map(x => `<ellipse cx="${x}" cy="10" rx="16" ry="6"/>`).join('')}</g>
    <path d="M30 14 Q50 24 40 40 Q34 50 46 58" fill="none" stroke="#cfd6e0" stroke-width="2.4" opacity=".5"/><path d="M60 14 Q74 26 62 40" fill="none" stroke="#cfd6e0" stroke-width="1.6" opacity=".4"/>
    ${ground(k)}${cur(50, 40, 9, '₩', '#cfd6e0')}<path d="M44 30 L52 40 L46 44 L56 52" fill="none" stroke="${k}" stroke-width=".9"/>
    ${poly([[66, 26], [74, 34], [80, 44], [92, 56]], DN, 1.4)}${txt(84, 30, '幣值重挫', 3.4, DN)}`, [50, 40]),
  hotmoney_tide: k => svg('fx', `<path d="M0 44 Q12 38 24 44 T48 44 T72 44 T96 44 V70 H0Z" fill="#0d4a5a"/><path d="M0 50 Q12 44 24 50 T48 50 T72 50 T100 50 V70 H0Z" fill="#0a3a4a"/>
    ${[[14, 42], [30, 40], [46, 42], [62, 40], [78, 42]].map(([x, y]) => cur(x, y, 2.6, '$', G)).join('')}
    <path d="M10 30 H44" stroke="${GR}" stroke-width=".9"/><path d="M42 28 L46 30 L42 32Z" fill="${GR}"/>${txt(27, 26, '利差開：湧入', 3.2, GR)}
    <path d="M90 22 H56" stroke="${UP}" stroke-width=".9"/><path d="M58 20 L54 22 L58 24Z" fill="${UP}"/>${txt(73, 18, '利差收：退去', 3.2, UP)}
    <circle cx="84" cy="8" r="4.4" fill="#fff6d8" opacity=".9"/>`, [84, 8]),

  /* 籌碼與市場 — the trading hall, order tickets and the crowd */
  daytrade_ronin: k => svg('chips', `${ground(k)}
    <circle cx="16" cy="14" r="5" fill="url(#sun-gold)"/>${txt(16, 26, '09:00', 3.2, GH)}<circle cx="84" cy="14" r="5" fill="#ffb08a" opacity=".7"/>${txt(84, 26, '13:30', 3.2, GH)}
    <path d="M20 30 Q50 18 80 30" fill="none" stroke="${GH}" stroke-width=".5" stroke-dasharray="1.4 1"/>
    ${fig(50, 32, 1.1, k, `<path d="M54 40 L64 30" stroke="#e9ecf6" stroke-width="1" stroke-linecap="round"/><path d="M45.4 29 Q50 24.6 54.6 29Z" fill="${k}"/>`)}${txt(50, 64, '不留倉過夜', 3.2, GH)}`),
  oddlot_apprentice: k => svg('chips', `${ground(k)}
    <rect x="58" y="22" width="30" height="36" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(73, 30, '1 張', 3.6, '#3a2a05')}${txt(73, 35, '＝1000 股', 2.8, '#3a2a05')}
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${60.6 + (i % 6) * 4.4}" y="${39 + Math.floor(i / 6) * 3.6}" width="3.6" height="2.8" fill="${i < 11 ? G : '#d9cfb8'}"/>`).join('')}
    ${fig(28, 34, 1, k, `<rect x="31" y="40" width="4" height="4" fill="${G}" stroke="${k}" stroke-width=".3"/>`)}${txt(28, 62, '一股一股買', 3.2, GH)}`),
  afterhours_monk: k => svg('chips', `${ground(k)}
    <g transform="translate(72 26)"><circle r="12" fill="${W}" stroke="${G}" stroke-width=".8"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${f1(10 * Math.cos(a))} ${f1(10 * Math.sin(a))} L${f1(11.4 * Math.cos(a))} ${f1(11.4 * Math.sin(a))}" stroke="#3a2a05" stroke-width=".5"/>`; }).join('')}<path d="M0 0 V-8" stroke="#3a2a05" stroke-width="1"/><path d="M0 0 L6.4 3.6" stroke="#3a2a05" stroke-width=".8"/></g>${txt(72, 46, '14:00', 4, GH)}
    <path d="M10 40 H50" stroke="${GH}" stroke-width=".8"/>${txt(30, 36, '收盤價', 3.4, GH)}
    ${fig(30, 44, .9, k, `<path d="M25.6 47 Q30 45 34.4 47" fill="none" stroke="${W}" stroke-width=".6"/><circle cx="30" cy="43.4" r="2.4" fill="#3a1a28" stroke="none"/>`)}`),
  retail_crowd: k => svg('chips', `${ground(k)}
    ${Array.from({ length: 14 }, (_, i) => fig(8 + i * 6.6, 42 + (i % 3) * 3, .62, k, '')).join('')}
    <g transform="translate(84 14)"><path d="M-10 -5 H10 V5 H2 L0 9 L-2 5 H-10Z" fill="${W}" stroke="${k}" stroke-width=".4"/>${txt(0, 1.4, '利多!', 3.6, '#b0472f')}</g>
    ${txt(30, 20, '最後一個知道', 3.4, GH)}<path d="M40 22 L76 16" stroke="${GH}" stroke-width=".4" stroke-dasharray="1 1"/>`),
  auction_bell: k => svg('chips', `${ground(k)}
    <g transform="translate(34 30)"><path d="M-10 10 Q-10 -10 0 -12 Q10 -10 10 10Z" fill="${G}" stroke="#6b470f" stroke-width=".6"/><path d="M-12 10 H12" stroke="#6b470f" stroke-width="1.4"/><circle cx="0" cy="13" r="2" fill="#6b470f"/><path d="M-14 -4 Q-18 0 -16 6 M14 -4 Q18 0 16 6" fill="none" stroke="${GH}" stroke-width=".6"/></g>
    <rect x="58" y="16" width="32" height="28" fill="#2a1a0a" stroke="${G}" stroke-width=".5"/>${txt(74, 23, '13:25–13:30', 3, GH)}
    ${[0, 1, 2].map(i => `<rect x="61" y="${26 + i * 5}" width="${8 + i * 4}" height="3" fill="${GR}"/><rect x="${87 - (6 + i * 3)}" y="${26 + i * 5}" width="${6 + i * 3}" height="3" fill="${UP}"/>`).join('')}
    ${txt(74, 52, '只收單不成交', 3, GH)}${txt(34, 56, '收盤價', 3.4, GH)}`),
  dealer_hedger: k => svg('chips', `${ground(k)}
    <g transform="translate(26 30)"><rect x="-12" y="-10" width="24" height="18" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(0, -3, '權證', 4.4, '#b0472f')}${txt(0, 4, '發行', 3, '#3a2a05')}</g>
    <path d="M40 30 Q50 22 60 30" fill="none" stroke="${GH}" stroke-width=".7"/><path d="M58 28 L61 30.6 L57.4 31.4Z" fill="${GH}"/><path d="M60 38 Q50 46 40 38" fill="none" stroke="${GH}" stroke-width=".7"/>
    <g transform="translate(74 34)">${[0, 1, 2].map(i => `<rect x="-10" y="${-10 + i * 7}" width="20" height="5" fill="${['#c3902e', '#a87a3a', '#8a6a2a'][i]}" stroke="${k}" stroke-width=".3"/>`).join('')}${txt(0, 16, '現貨避險', 3, GH)}</g>
    ${txt(50, 60, '日日調整部位', 3.2, GH)}`),
  whale_holder: k => svg('chips', `<path d="M0 40 Q25 36 50 40 T100 40 V70 H0Z" fill="#3a2a10"/><path d="M0 46 Q25 42 50 46 T100 46" fill="none" stroke="#c9a86a" stroke-width=".5"/>
    <g transform="translate(48 38)" fill="${k}" stroke="${G}" stroke-width=".5"><path d="M-26 0 Q-18 -14 4 -12 Q20 -10 24 -2 Q26 4 18 6 Q0 10 -20 6 Q-28 4 -26 0Z"/><path d="M24 -2 L32 -10 L30 0 L34 6 L22 4Z"/><circle cx="-16" cy="-4" r="1.2" fill="${GH}"/></g>
    <path d="M-2 -14 Q0 -20 2 -14" transform="translate(40 26)" fill="none" stroke="#bff5ee" stroke-width=".6"/>
    ${txt(50, 14, '千張大戶', 4, GH)}${[16, 26, 36].map((x, i) => `<rect x="${x + 50}" y="${62 - (i + 1) * 4}" width="6" height="${(i + 1) * 4}" fill="${G}"/>`).join('')}${txt(76, 66, '每週增持', 2.8, GH)}`),
  short_scout: k => svg('chips', `${ground(k)}
    ${poly([[6, 18], [22, 24], [38, 32], [54, 40], [70, 46], [88, 50]], DN, 1.3)}
    <circle cx="14" cy="21" r="2" fill="${UP}"/>${txt(14, 15, '借來賣出', 3, UP)}<circle cx="80" cy="48.6" r="2" fill="${GR}"/>${txt(80, 42, '低點還券', 3, GR)}
    ${fig(48, 46, .75, k, `<path d="M51 47 L58 42" stroke="${G}" stroke-width="1.4" stroke-linecap="round"/><path d="M58 42 L60 41" stroke="${GH}" stroke-width="1.8"/>`)}`),
  broker_tracker: k => svg('chips', `${ground(k)}
    <rect x="44" y="12" width="46" height="44" fill="${W}" stroke="#a87a3a" stroke-width=".5"/>${txt(67, 19, '分點進出', 3.4, '#3a2a05')}
    ${[['凱基-台北', '+1,250', UP], ['元大-松山', '+980', UP], ['富邦-建國', '−420', '#2f7d4f'], ['美林', '+760', UP]].map(([a, b, c], i) => `${txt(47, 26 + i * 7, a, 2.8, '#3a2a05', 'start')}${txt(88, 26 + i * 7, b, 2.8, c, 'end')}`).join('')}
    <circle cx="70" cy="24.6" r="4.6" fill="none" stroke="${R}" stroke-width=".6"/>
    ${fig(22, 32, 1, k, `<circle cx="30" cy="30" r="4" fill="none" stroke="${G}" stroke-width="1"/><path d="M27 33 L25 36" stroke="${G}" stroke-width="1.2"/>`)}`),
  window_dresser: k => svg('chips', `${ground(k)}
    ${poly([[6, 50], [20, 48], [34, 46], [48, 44], [58, 36], [66, 26], [74, 16]], UP, 1.4)}
    <rect x="62" y="8" width="26" height="10" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(75, 15, '季底', 4, '#b0472f')}
    ${fig(40, 40, .8, k, `<path d="M43 42 L52 34" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`)}${fig(52, 40, .8, k, `<path d="M55 42 L62 30" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/>`)}
    ${txt(30, 62, '重倉股拉上高點', 3.2, GH)}`),
  margin_crow: k => svg('chips', `${ground(k)}
    <rect x="18" y="34" width="64" height="28" fill="#3a2a1a" stroke="${G}" stroke-width=".5"/><path d="M14 34 L50 22 L86 34Z" fill="#2a1a0a" stroke="${G}" stroke-width=".5"/>${txt(50, 46, '營業廳', 3.4, GH)}
    <rect x="30" y="50" width="40" height="8" fill="#5a1a1a" stroke="${k}" stroke-width=".3"/>${txt(50, 56, '維持率 128%', 3.4, '#ff9c86')}
    <g transform="translate(50 12)" fill="${k}" stroke="${G}" stroke-width=".35"><path d="M-14 0 Q-6 -6 0 -1 Q6 -6 14 0 Q6 -2 0 2 Q-6 -2 -14 0Z"/><circle cx="0" cy="-1" r="2"/><path d="M1.6 -1 L4 -.4 L1.6 .2Z" fill="${G}"/></g>`),
  lending_envoy: k => svg('chips', `${ground(k)}
    ${fig(20, 26, 1.1, k, `<path d="M15.6 23 Q20 18 24.4 23Z" fill="${G}" stroke="none"/>`)}${txt(20, 52, '大股東', 3, GH)}
    <g transform="translate(46 30)"><rect x="-8" y="-6" width="16" height="12" fill="${W}" stroke="${k}" stroke-width=".4"/>${txt(0, 1.4, '股票', 3.4, '#3a2a05')}</g>
    <path d="M28 30 H38" stroke="${GH}" stroke-width=".6"/><path d="M36 28 L39 30 L36 32Z" fill="${GH}"/>
    ${poly([[56, 50], [64, 30], [70, 18], [76, 30], [86, 50]], DN, 1.3)}<circle cx="70" cy="18" r="2" fill="${UP}"/>${txt(70, 12, '高點放出', 3, UP)}
    <g transform="translate(64 50)" opacity=".85"><path d="M-5 8 Q-6 -5 0 -7 Q6 -5 5 8 L3 5 L1 8 L-1 5 L-3 8Z" fill="#5a4a6a"/><circle cx="-2" cy="-2" r=".8" fill="${R}"/><circle cx="2" cy="-2" r=".8" fill="${R}"/></g>`),
  /* ★3 */
  three_generals: k => svg('chips', `${ground(k)}
    ${[['外資', 22, '#3f7fe0'], ['投信', 50, R], ['自營', 78, '#2f9e74']].map(([t, x, c]) => `${fig(x, 22, 1.2, k, `<path d="M${x - 5.6} 19 Q${x} 13.6 ${x + 5.6} 19Z" fill="${c}" stroke="none"/><path d="M${x + 5} 26 V8" stroke="${G}" stroke-width=".5"/><path d="M${x + 5} 8 h6 v4 h-6Z" fill="${c}"/>`)}<rect x="${x - 9}" y="44" width="18" height="7" rx="1" fill="${k}" stroke="${c}" stroke-width=".6"/>${txt(x, 49.4, t, 3.6, W)}`).join('')}
    ${txt(50, 60, '盤後點兵', 3.4, GH)}`, [50, 22]),
  foreign_fleet: k => svg('chips', `<path d="M0 46 Q25 42 50 46 T100 46 V70 H0Z" fill="#1a3a4a"/><path d="M0 52 Q25 48 50 52 T100 52" fill="none" stroke="#7fd0e0" stroke-width=".5"/>
    <g transform="translate(48 40)"><path d="M-30 0 H30 L24 8 H-24Z" fill="#3a3a4a" stroke="${G}" stroke-width=".6"/><rect x="-18" y="-10" width="30" height="10" fill="#4a4a5a" stroke="${G}" stroke-width=".4"/><rect x="-8" y="-18" width="10" height="8" fill="#5a5a6a" stroke="${G}" stroke-width=".4"/>
      ${txt(-3, -2, 'MSCI', 4, GH)}</g>
    <rect x="80" y="20" width="14" height="26" fill="#3a2a1a" stroke="${G}" stroke-width=".4"/>${txt(87, 36, '港', 4, GH)}${txt(26, 14, '尾盤一次靠港', 3.4, GH)}`, [48, 30]),
  index_envoy: k => svg('chips', `${ground(k)}
    <rect x="30" y="12" width="40" height="36" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(50, 19, '成分股', 3.6, '#3a2a05')}
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${34 + (i % 4) * 8.4}" y="${23 + Math.floor(i / 4) * 8}" width="7" height="6" fill="${i === 5 ? GR : '#c9b98f'}"/>`).join('')}
    <path d="M14 30 H30" stroke="${GR}" stroke-width=".9"/><path d="M28 28 L31 30 L28 32Z" fill="${GR}"/>${txt(14, 26, '納入', 3, GR)}
    <path d="M70 38 H86" stroke="${UP}" stroke-width=".9"/><path d="M84 36 L87 38 L84 40Z" fill="${UP}"/>${txt(86, 34, '剔除', 3, UP)}
    ${[18, 30, 42, 54, 66, 78].map(x => coin(x, 56, 1.8)).join('')}${txt(50, 64, '收盤被動資金湧入', 3, GH)}`, [50, 30]),
  main_force: k => svg('chips', `${ground(k)}
    ${poly([[4, 50], [16, 48], [28, 50], [40, 48], [52, 46], [60, 30], [70, 14], [78, 20], [86, 36], [96, 52]], GH, 1.4)}
    <path d="M60 46 V30" stroke="${UP}" stroke-width="3"/>${txt(18, 42, '低檔吃貨', 3.2, GR)}${txt(64, 50, '長紅', 3.2, UP)}${txt(80, 12, '出貨', 3.2, '#ff9c86')}
    ${Array.from({ length: 5 }, (_, i) => fig(74 + i * 4, 40 + i, .4, k, '')).join('')}${txt(84, 62, '散戶追進', 2.8, GH)}`, [70, 14]),

  /* 風險管理 — shields, barriers and armour */
  stop_bushi: k => svg('risk', `${ground(k)}
    ${poly([[6, 20], [22, 26], [36, 36], [48, 44], [60, 52]], DN, 1.2)}<path d="M6 40 H94" stroke="${R}" stroke-width="1" stroke-dasharray="2 1.2"/>${txt(92, 37, '停損線', 3.2, '#ff9c86', 'end')}
    <circle cx="44" cy="40" r="2.4" fill="none" stroke="${GH}" stroke-width=".8"/>
    ${fig(72, 24, 1.05, k, `<path d="M68 30 L62 40" stroke="#e9ecf6" stroke-width="1" stroke-linecap="round"/><path d="M67.4 21 Q72 16.6 76.6 21Z" fill="${k}"/>`)}${txt(28, 62, '先決定退路', 3.2, GH)}`),
  diversify_master: k => svg('risk', `${ground(k)}
    ${[16, 34, 52, 70, 88].map((x, i) => `<path d="M${x - 7} 44 H${x + 7} L${x + 5} 54 H${x - 5}Z" fill="#8a6a2a" stroke="${G}" stroke-width=".4"/><ellipse cx="${x}" cy="42" rx="3" ry="3.8" fill="${W}" stroke="${k}" stroke-width=".3"/>`).join('')}
    ${txt(50, 24, '不把雞蛋放在同一個籃子', 3.6, GH)}`),
  trailing_ninja: k => svg('risk', `${ground(k)}
    ${poly([[6, 50], [18, 42], [28, 46], [40, 34], [50, 38], [62, 26], [72, 30], [86, 16]], UP, 1.3)}
    ${poly([[6, 56], [18, 50], [28, 50], [40, 42], [50, 42], [62, 34], [72, 34], [86, 24]], '#ff9c86', .9, 'stroke-dasharray="1.6 1"')}${txt(92, 30, '停利點跟上', 3, '#ff9c86', 'end')}
    ${fig(86, 6.6, .55, k, `<path d="M84 6 L80 5" stroke="${R}" stroke-width=".5"/>`)}`),
  hedge_monk: k => svg('risk', `${ground(k)}
    ${fig(50, 20, 1.2, k, `<path d="M44.6 24 Q50 22 55.4 24" fill="none" stroke="${W}" stroke-width=".6"/><circle cx="50" cy="19" r="3" fill="#3a1a28" stroke="none"/>`)}
    <rect x="16" y="30" width="18" height="10" rx="1" fill="#5a1a1a" stroke="${G}" stroke-width=".4"/>${txt(25, 37, '多單', 3.6, UP)}<rect x="66" y="30" width="18" height="10" rx="1" fill="#1a3a2a" stroke="${G}" stroke-width=".4"/>${txt(75, 37, '空單', 3.6, GR)}
    <g stroke="#cfd6e0" stroke-width=".6" opacity=".6"><path d="M4 14 Q12 12 18 16"/><path d="M96 14 Q88 12 82 16"/></g>${txt(50, 58, '風往哪吹都站得住', 3.2, GH)}`),
  cash_keeper: k => svg('risk', `${ground(k)}
    <g transform="translate(36 38)"><circle r="16" fill="#5a2a1a" stroke="${G}" stroke-width=".6"/><path d="M0 0 L0 -16 A16 16 0 0 1 15.2 -4.9Z" fill="${GR}"/>${txt(6, -6, '30%', 3.4, '#04281c')}${txt(-4, 6, '持股', 3.6, W)}</g>
    ${stack(70, 52, 7, 4)}${txt(70, 36, '現金', 3.6, GR)}
    ${fig(86, 36, .85, k, `<path d="M90 33 V54" stroke="${G}" stroke-width=".7"/>`)}${txt(50, 64, '崩盤日的子彈', 3, GH)}`),
  journal_scribe: k => svg('risk', `${ground(k)}
    <g transform="translate(50 34)"><path d="M-28 -18 Q-14 -22 0 -16 Q14 -22 28 -18 V16 Q14 12 0 18 Q-14 12 -28 16Z" fill="${W}" stroke="${G}" stroke-width=".6"/><path d="M0 -16 V18" stroke="#b9a36a" stroke-width=".5"/>
      ${[['買 2330', '理由：突破'], ['賣 2330', '錯：太早出'], ['停損', '紀律 ✓']].map(([a, b], i) => `${txt(-24, -9 + i * 8, a, 3, '#3a2a05', 'start')}${txt(4, -9 + i * 8, b, 3, i === 1 ? '#b0472f' : '#2f7d4f', 'start')}`).join('')}</g>
    ${txt(50, 62, '錯誤不再犯第二次', 3.2, GH)}`),
  mdd_barrier: k => svg('risk', `${ground(k)}
    ${poly([[6, 40], [20, 26], [34, 14], [46, 30], [56, 46], [68, 36], [82, 22], [94, 14]], GH, 1.3)}
    <path d="M34 14 H62 M56 46 H62" stroke="${R}" stroke-width=".5" stroke-dasharray="1 1"/><path d="M60 14 V46" stroke="${R}" stroke-width="1"/><path d="M58.6 16 L60 13 L61.4 16Z M58.6 44 L60 47 L61.4 44Z" fill="${R}"/>${txt(72, 32, '最大回撤', 3.4, '#ff9c86', 'start')}
    <path d="M8 52 Q50 44 92 52" fill="none" stroke="#ffb08a" stroke-width="1.6" opacity=".5"/>${txt(30, 62, '結界的厚度', 3, GH)}`),
  sizing_officer: k => svg('risk', `${ground(k)}
    ${[['單筆風險', '1%', 18], ['停損距離', '5%', 50], ['部位', '20%', 82]].map(([a, b, x], i) => `<rect x="${x - 12}" y="22" width="24" height="18" rx="1.4" fill="${k}" stroke="${i === 2 ? GR : G}" stroke-width=".6"/>${txt(x, 29, a, 3, GH)}${txt(x, 37, b, 5, i === 2 ? GR : W)}`).join('')}
    ${txt(34, 33, '÷', 5, GH)}${txt(66, 33, '＝', 5, GH)}${fig(50, 46, .7, k, '')}`),
  black_swan: k => svg('risk', `<path d="M0 50 Q50 44 100 50 V70 H0Z" fill="#2a0a0a"/><path d="M0 54 Q50 48 100 54" fill="none" stroke="#ff9c86" stroke-width=".4"/>
    <g transform="translate(50 40)" fill="#05010a" stroke="${G}" stroke-width=".5"><path d="M-18 6 Q-14 -4 -2 -2 Q4 -1 8 2 Q14 6 16 4 Q12 10 0 10 Q-12 10 -18 6Z"/><path d="M6 1 Q10 -10 4 -16 Q2 -18 0 -16 Q4 -10 2 0" fill="none" stroke-width="2.4"/><path d="M0 -16 L-4 -15 L0 -14Z" fill="${R}" stroke="none"/></g>
    ${poly([[6, 16], [30, 14], [50, 15], [62, 14], [66, 30], [70, 34]], '#ff9c86', 1)}${txt(80, 22, '百年一見', 3.4, GH)}`),
  var_watchman: k => svg('risk', `${ground(k)}
    <path d="M10 52 Q30 52 40 34 Q50 12 60 34 Q70 52 90 52" fill="none" stroke="${GH}" stroke-width="1.2"/>
    <path d="M10 52 Q18 52 22 46 L22 52Z" fill="${R}" opacity=".8"/>${txt(16, 40, '最壞 5%', 3, '#ff9c86')}<path d="M22 30 V54" stroke="${R}" stroke-width=".6" stroke-dasharray="1 1"/>${txt(50, 60, '95% 信心水準', 3.2, GH)}
    <circle cx="82" cy="12" r="5" fill="#fff6d8" opacity=".85"/>${fig(70, 18, .8, k, `<path d="M74 22 V36" stroke="${G}" stroke-width=".6"/><circle cx="74" cy="21" r="1.4" fill="#ffb347" stroke="none"/>`)}`),
  corr_spider: k => svg('risk', `${ground(k)}
    ${[[20, 18, '股'], [80, 18, '債'], [20, 50, '金'], [80, 50, '匯'], [50, 10, '房']].map(([x, y, t]) => `<path d="M50 32 L${x} ${y}" stroke="#e9ecf6" stroke-width=".4"/><circle cx="${x}" cy="${y}" r="5" fill="${k}" stroke="${G}" stroke-width=".5"/>${txt(x, y + 1.6, t, 4, GH)}`).join('')}
    <path d="M20 18 L80 18 L80 50 L20 50Z" fill="none" stroke="#e9ecf6" stroke-width=".25"/>${txt(36, 16, '+0.8', 2.6, UP)}${txt(64, 54, '−0.3', 2.6, GR)}
    <g transform="translate(50 32)" fill="${k}" stroke="${G}" stroke-width=".4"><ellipse rx="4" ry="3"/><circle cy="-3.6" r="2"/>${[-1, 1].map(d => `<path d="M${d * 3} -1 L${d * 8} -5 M${d * 3} 0 L${d * 8} 1 M${d * 3} 1 L${d * 7} 5" fill="none" stroke-width=".6"/>`).join('')}</g>`),
  rebalance_gardener: k => svg('risk', `${ground(k)}
    ${[[22, 30, '股', GR], [50, 44, '債', BL], [78, 38, '金', G]].map(([x, h, t, c]) => `<rect x="${x - 6}" y="${62 - h}" width="12" height="${h}" fill="${c}" opacity=".8" stroke="${k}" stroke-width=".4"/>${txt(x, 60, t, 3.6, k)}`).join('')}
    <path d="M10 26 H90" stroke="${GH}" stroke-width=".6" stroke-dasharray="1.6 1"/>${txt(92, 24, '目標比例', 2.8, GH, 'end')}
    <path d="M18 30 L26 32" stroke="#e9ecf6" stroke-width="1.2"/>${txt(30, 22, '修剪', 3, '#ff9c86')}<path d="M50 14 Q50 18 50 18" stroke="${BL}"/>${txt(50, 14, '補給', 3, GR)}
    ${fig(64, 14, .6, k, '')}`),
  /* ★3 */
  kelly_tactician: k => svg('risk', `${ground(k)}
    <rect x="18" y="14" width="64" height="18" rx="2" fill="${W}" stroke="${G}" stroke-width=".6"/>${txt(50, 25.4, 'f ＝ (bp − q) ÷ b', 5, '#3a2a05')}
    ${[[30, 1], [40, 1], [50, .5], [60, .5]].map(([x, o], i) => fig(x, 40, .6, k, '').replace('<g ', `<g opacity="${i < 2 ? 1 : .35}" `)).join('')}${txt(50, 62, '半數出擊，保長久', 3.2, GH)}
    ${fig(80, 38, .9, k, `<path d="M83 42 L88 38 L89 43Z" fill="${W}" stroke="${k}" stroke-width=".3"/>`)}`, [50, 22]),
  parity_saint: k => svg('risk', `${ground(k)}
    <path d="M50 14 V54" stroke="${G}" stroke-width="1"/><path d="M42 58 H58 L54 54 H46Z" fill="${G}"/><path d="M18 22 H82" stroke="${G}" stroke-width=".9"/>
    ${[[22, '股', GR, 3], [50, '', '', 0], [78, '債', BL, 9]].filter(a => a[1]).map(([x, t, c, n]) => `<path d="M${x} 22 L${x - 6} 34 M${x} 22 L${x + 6} 34" stroke="${G}" stroke-width=".4"/><path d="M${x - 8} 34 Q${x} 40 ${x + 8} 34Z" fill="${G}"/><rect x="${x - 4}" y="${30 - n * .6}" width="8" height="${3 + n * .6}" fill="${c}"/>${txt(x, 46, t + (n > 5 ? ' 多' : ' 少'), 3, c)}`).join('')}
    ${txt(50, 10, '每種資產風險相同', 3.4, GH)}`, [50, 22]),
  tail_hedger: k => svg('risk', `${ground(k)}
    <path d="M8 54 Q20 54 30 40 Q40 16 50 14 Q60 16 70 40 Q80 54 92 54" fill="none" stroke="${GH}" stroke-width="1.1"/>
    <path d="M8 54 Q12 54 16 50 L16 54Z" fill="${R}"/>${shield(16, 42, .7, '#2a5a7a')}${txt(16, 32, '尾部', 3, '#ff9c86')}
    ${txt(64, 62, '平時付保費，等百年一遇', 3, GH)}`, [16, 42]),
  monte_carlo: k => svg('risk', `${ground(k)}
    ${Array.from({ length: 14 }, (_, i) => { let y = 36, d = 'M6 36'; for (let x = 12; x <= 90; x += 6) { y += Math.sin(i * 7.3 + x * .37) * 3 + (i - 7) * .25; d += ` L${x} ${f1(y)}`; } return `<path d="${d}" fill="none" stroke="${i === 9 ? GH : '#ffb08a'}" stroke-width="${i === 9 ? 1.4 : .35}" opacity="${i === 9 ? 1 : .5}"/>`; }).join('')}
    ${txt(50, 10, '一萬條路徑', 3.6, GH)}<g transform="translate(86 54)"><rect x="-5" y="-5" width="10" height="10" rx="1.6" fill="${W}" stroke="${k}" stroke-width=".4"/>${[[-2, -2], [2, 2], [0, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="${R}"/>`).join('')}</g>`, [50, 36]),

  /* 衍生性商品 — payoff diagrams and the spirits of the option chain */
  margin_oni: k => svg('deriv', `${ground(k)}
    <rect x="12" y="14" width="40" height="40" fill="#1a0a2a" stroke="${G}" stroke-width=".5"/><rect x="16" y="${54 - 16}" width="32" height="12" fill="${UP}" opacity=".7"/>${txt(32, 22, '權益數', 3.4, GH)}
    <path d="M10 34 H54" stroke="${R}" stroke-width=".9" stroke-dasharray="1.6 1"/>${txt(32, 32, '維持線', 3, '#ff9c86')}
    <g transform="translate(74 30)"><circle r="9" fill="#6a1a1a" stroke="${G}" stroke-width=".5"/><path d="M-5 -6 L-7 -13 L-2 -8Z M5 -6 L7 -13 L2 -8Z" fill="${W}"/><path d="M-4 -1 L-1 0 M4 -1 L1 0" stroke="${GH}" stroke-width=".9"/><path d="M-4 4 L-2 3 L0 4 L2 3 L4 4" fill="none" stroke="${W}" stroke-width=".6"/></g>${txt(74, 50, '追繳！', 4, '#ff9c86')}`),
  spread_blade: k => svg('deriv', `${ground(k)}${axes(40)}
    ${poly([[6, 50], [36, 50], [64, 26], [94, 26]], GH, 1.4)}<path d="M6 50 H36 M64 26 H94" stroke="${GH}" stroke-width="1.4"/>
    ${txt(80, 22, '獲利上限', 3, GR)}${txt(20, 56, '虧損下限', 3, '#ff9c86')}${txt(36, 46, '買', 3.4, UP)}${txt(64, 34, '賣', 3.4, DN)}
    <path d="M30 14 L44 6 M58 6 L72 14" stroke="#e9ecf6" stroke-width="1" stroke-linecap="round"/>`),
  put_guard: k => svg('deriv', `${ground(k)}${axes(40)}
    ${poly([[6, 46], [40, 46], [94, 12]], GH, 1.4)}<path d="M6 46 H40" stroke="${GR}" stroke-width="2"/>${txt(22, 52, '持股的底線', 3, GR)}
    ${shield(22, 30, .8, '#3a2a6a')}${txt(22, 31.4, 'P', 4, GH)}`),
  covered_ferry: k => svg('deriv', `<path d="M0 46 Q25 42 50 46 T100 46 V70 H0Z" fill="#1a1a4a"/><path d="M0 52 Q25 48 50 52 T100 52" fill="none" stroke="#b9a6e0" stroke-width=".5"/>
    <g transform="translate(50 42)"><path d="M-22 0 H22 L16 7 H-16Z" fill="#6a4a1a" stroke="${G}" stroke-width=".5"/><rect x="-12" y="-8" width="10" height="8" fill="${W}" stroke="${k}" stroke-width=".3"/>${txt(-7, -2.4, '持股', 2.6, '#3a2a05')}<path d="M8 0 V-20" stroke="${G}" stroke-width=".6"/><path d="M8 -20 L18 -8 H8Z" fill="${W}"/></g>
    ${[[20, 22], [28, 18], [36, 22]].map(([x, y]) => coin(x, y, 2)).join('')}${txt(28, 12, '每月收船資', 3.2, GH)}${txt(82, 20, '賣出買權', 3.2, '#b9a6e0')}`),
  tick_imp: k => svg('deriv', `${ground(k)}
    <rect x="16" y="14" width="68" height="20" fill="#1a0a2a" stroke="${G}" stroke-width=".5"/>${txt(36, 28, '22,450', 7, GH)}${txt(70, 28, '+1', 6, UP)}
    ${txt(50, 44, '1 點 ＝ 200 元', 4, GH)}
    <g transform="translate(50 54)"><circle r="4" fill="#6a2a8a" stroke="${G}" stroke-width=".4"/><path d="M-3 -2 L-4 -6 L-1 -3Z M3 -2 L4 -6 L1 -3Z" fill="#6a2a8a"/><path d="M-4 3 L-7 7 M4 3 L7 7" stroke="#6a2a8a" stroke-width=".9"/></g>`),
  basis_ronin: k => svg('deriv', `${ground(k)}
    ${poly([[6, 30], [24, 26], [44, 30], [64, 24], [94, 22]], GH, 1.3)}${poly([[6, 40], [24, 36], [44, 38], [64, 30], [94, 23]], '#b9a6e0', 1.3)}${txt(94, 18, '期貨', 3, GH, 'end')}${txt(20, 46, '現貨', 3, '#b9a6e0')}
    <path d="M44 30 V38" stroke="${R}" stroke-width="1.2"/>${txt(52, 36, '基差', 3.4, '#ff9c86', 'start')}${txt(80, 34, '結算收斂', 3, GH)}
    ${fig(30, 50, .7, k, `<path d="M32 51 L38 46" stroke="#e9ecf6" stroke-width=".6"/>`)}`),
  delta_archer: k => svg('deriv', `${ground(k)}${axes(48)}
    <path d="M8 46 Q50 44 70 22 Q80 12 92 10" fill="none" stroke="${GH}" stroke-width="1.3"/><path d="M40 40 L70 22" stroke="${UP}" stroke-width=".9"/>${txt(58, 38, 'Δ ＝ 斜率', 3.4, UP)}
    <g transform="translate(22 28)"><path d="M-4 -12 Q8 0 -4 12" fill="none" stroke="${G}" stroke-width="1"/><path d="M-4 -12 L-4 12" stroke="#e9ecf6" stroke-width=".3"/><path d="M-4 0 L20 -6" stroke="#e9ecf6" stroke-width=".7"/><path d="M18 -7.4 L22 -6.4 L18.6 -4.6Z" fill="${G}"/></g>`),
  vega_mage: k => svg('deriv', `${ground(k)}
    <g stroke="#cfd6e0" stroke-width=".8" fill="none" opacity=".7"><path d="M6 20 Q20 14 30 22 Q38 28 30 32"/><path d="M8 34 Q22 28 34 36"/><path d="M6 46 Q18 42 26 48"/></g>${txt(20, 12, '隱含波動率 ↑', 3, GH)}
    <g transform="translate(70 32)"><circle r="${10}" fill="#6a2a8a" opacity=".35"/><circle r="15" fill="#6a2a8a" opacity=".18"/>${cur(0, 0, 6, '權', G)}</g>${txt(70, 56, '權利金膨脹', 3.2, GH)}
    ${fig(40, 34, .8, k, `<path d="M43 37 L50 30" stroke="${G}" stroke-width=".6"/><circle cx="50" cy="30" r="1.2" fill="#d9a6ff" stroke="none"/>`)}`),
  straddle_janus: k => svg('deriv', `${ground(k)}${axes(44)}
    ${poly([[8, 12], [50, 50], [92, 12]], GH, 1.4)}${txt(16, 22, '大跌賺', 3, GR)}${txt(84, 22, '大漲賺', 3, GR)}${txt(50, 58, '不動最怕', 3.2, '#ff9c86')}
    <g transform="translate(50 26)"><circle r="6" fill="${k}" stroke="${G}" stroke-width=".5"/><path d="M0 -6 V6" stroke="${G}" stroke-width=".4"/><circle cx="-2.6" cy="-1" r=".7" fill="${GH}"/><circle cx="2.6" cy="-1" r=".7" fill="${GH}"/></g>`),
  iron_condor: k => svg('deriv', `${ground(k)}${axes(44)}
    ${poly([[6, 54], [22, 54], [36, 30], [64, 30], [78, 54], [94, 54]], GH, 1.4)}${txt(50, 26, '區間內獲利', 3.2, GR)}
    <g transform="translate(50 14)" fill="${k}" stroke="${G}" stroke-width=".4"><path d="M-22 2 Q-10 -6 0 0 Q10 -6 22 2 Q10 -1 0 4 Q-10 -1 -22 2Z"/><circle cy="-1" r="2"/><path d="M1.4 -1 L4 0 L1.4 .6Z" fill="${G}"/></g>
    ${[22, 36, 64, 78].map(x => `<path d="M${x} 44 V48" stroke="#b9a6e0" stroke-width=".7"/>`).join('')}`),
  warrant_kappa: k => svg('deriv', `<path d="M0 44 Q25 40 50 44 T100 44 V70 H0Z" fill="#1a2a4a"/><path d="M0 50 Q25 46 50 50 T100 50" fill="none" stroke="#7fd0e0" stroke-width=".5"/>
    <g fill="#cfe8ff" opacity=".7">${[[30, 34, 4], [40, 26, 6], [56, 22, 7], [70, 30, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>${txt(56, 14, '數倍水花', 3.4, GH)}
    <g transform="translate(22 42)"><ellipse cx="0" cy="2" rx="6" ry="5" fill="#2f7d4f" stroke="${G}" stroke-width=".4"/><circle cx="0" cy="-5" r="4" fill="#2f7d4f" stroke="${G}" stroke-width=".4"/><ellipse cx="0" cy="-8.6" rx="3" ry="1" fill="#cfe8ff"/></g>${coin(30, 44, 1.6)}${txt(14, 62, '小本金', 3, GH)}`),
  rollover_monk: k => svg('deriv', `${ground(k)}
    <rect x="12" y="20" width="26" height="20" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(25, 28, '近月', 4, '#3a2a05')}${txt(25, 35, '10 月', 3, '#3a2a05')}
    <rect x="62" y="20" width="26" height="20" fill="${W}" stroke="${G}" stroke-width=".5"/>${txt(75, 28, '遠月', 4, '#3a2a05')}${txt(75, 35, '11 月', 3, '#3a2a05')}
    <path d="M40 30 H60" stroke="${GH}" stroke-width=".9"/><path d="M58 28 L61 30 L58 32Z" fill="${GH}"/>${txt(50, 26, '轉倉', 3.4, GH)}
    ${fig(50, 42, .8, k, `<circle cx="50" cy="41.6" r="2" fill="#3a1a28" stroke="none"/>`)}`),
  /* ★3 */
  theta_reaper: k => svg('deriv', `${ground(k)}
    <path d="M10 18 Q50 20 70 36 Q80 46 86 56" fill="none" stroke="${GH}" stroke-width="1.4"/>${txt(20, 14, '時間價值', 3.2, GH)}${txt(86, 62, '結算日', 3, '#ff9c86')}
    ${[[20, 18], [40, 21], [58, 29], [72, 40]].map(([x, y]) => coin(x, y, 1.6)).join('')}
    <g transform="translate(40 44)" fill="${k}" stroke="${G}" stroke-width=".5"><path d="M-8 14 Q-8 -2 0 -6 Q8 -2 8 14Z"/><circle cy="-8" r="3.4"/><path d="M8 -4 L14 -18" stroke="#cfd6e0" stroke-width=".9"/><path d="M14 -18 Q6 -20 2 -14" fill="none" stroke="#e9ecf6" stroke-width="1.2"/></g>`, [70, 36]),
  settle_lord: k => svg('deriv', `${ground(k)}
    <g transform="translate(36 32)"><rect x="-18" y="-16" width="36" height="32" fill="${W}" stroke="${G}" stroke-width=".6"/><rect x="-18" y="-16" width="36" height="6" fill="#6a2a8a"/>${txt(0, -11.6, '每月', 3.2, '#fff')}
      ${['一', '二', '三', '四', '五'].map((d, i) => txt(-14 + i * 7, -5, d, 2.6, '#3a2a05')).join('')}${Array.from({ length: 15 }, (_, i) => `<rect x="${-16 + (i % 5) * 7}" y="${-3 + Math.floor(i / 5) * 6}" width="5" height="4.4" fill="${i === 12 ? R : '#d9cfb8'}"/>`).join('')}</g>
    ${txt(36, 56, '第三個星期三', 3.4, GH)}${fig(76, 24, 1.2, k, `<path d="M70.6 21 Q76 15.6 81.4 21Z" fill="${G}" stroke="none"/>`)}`, [76, 24]),
  iv_witch: k => svg('deriv', `${ground(k)}
    <path d="M8 50 Q30 48 40 40 Q50 30 60 34 Q70 38 80 18 L92 10" fill="none" stroke="#d9a6ff" stroke-width="1.3"/>${txt(84, 22, 'IV ↑', 3.6, '#d9a6ff')}${txt(26, 58, '市場越恐懼', 3.2, GH)}
    ${fig(30, 26, 1, k, `<path d="M24 23 L30 10 L36 23Z" fill="${k}"/><path d="M33 30 L44 18" stroke="#8a6a4a" stroke-width=".8"/><circle cx="44" cy="18" r="1.6" fill="#d9a6ff" stroke="none" filter="url(#glow)"/>`)}
    ${cur(64, 50, 4.4, '貴', '#ffb08a')}`, [44, 18]),
  arbitrage_twins: k => svg('deriv', `${ground(k)}
    ${fig(24, 22, 1, k, '')}${fig(76, 22, 1, k, '')}
    <rect x="12" y="38" width="24" height="10" rx="1" fill="#5a1a1a" stroke="${G}" stroke-width=".4"/>${txt(24, 45, '買 低價', 3.2, UP)}<rect x="64" y="38" width="24" height="10" rx="1" fill="#1a3a2a" stroke="${G}" stroke-width=".4"/>${txt(76, 45, '賣 高價', 3.2, GR)}
    <path d="M36 43 H64" stroke="${GH}" stroke-width=".6" stroke-dasharray="1.4 1"/>${coin(50, 43, 3)}${txt(50, 34, '同時成交', 3.2, GH)}${txt(50, 60, '無風險利潤，稍縱即逝', 3, GH)}`, [50, 40]),

  /* 虛擬貨幣 — blocks, chains, keys and wallets */
  sat_sprite: k => svg('crypto', `${ground(k)}
    ${cur(34, 32, 16, '₿', '#f7931a', '#fff')}<path d="M54 32 H66" stroke="${GH}" stroke-width=".6" stroke-dasharray="1 1"/>
    <circle cx="74" cy="32" r="1.4" fill="#f7931a"/><circle cx="74" cy="32" r="4" fill="none" stroke="${GH}" stroke-width=".4"/>${txt(74, 44, '1 聰', 3.6, GH)}${txt(50, 60, '一億分之一顆', 3.4, GH)}`),
  miner_dwarf: k => svg('crypto', `${ground(k)}
    ${blk(70, 28, 2.2)}${txt(70, 46, '區塊獎勵', 3, GH)}
    <rect x="10" y="12" width="40" height="14" fill="#1a0a1a" stroke="${G}" stroke-width=".4"/>${txt(30, 21, '0000a3f…', 3.6, GR)}
    ${fig(30, 38, 1, k, `<path d="M33 42 L42 34" stroke="#8a6a4a" stroke-width="1"/><path d="M38 31 L46 37" stroke="#cfd6e0" stroke-width="1.6"/><path d="M25.4 35 Q30 30.6 34.6 35Z" fill="#ffb347" stroke="none"/>`)}`),
  cold_golem: k => svg('crypto', `${ground(k)}
    <g fill="#4a5a7a" stroke="${G}" stroke-width=".5"><rect x="38" y="24" width="24" height="22" rx="2"/><rect x="42" y="14" width="16" height="10" rx="2"/><rect x="30" y="26" width="8" height="16" rx="2"/><rect x="62" y="26" width="8" height="16" rx="2"/><rect x="40" y="46" width="8" height="14"/><rect x="52" y="46" width="8" height="14"/></g>
    <rect x="44" y="30" width="12" height="10" rx="1" fill="#10020f" stroke="#7fd0e0" stroke-width=".5"/><path d="M47 34 h6 M50 31 V37" stroke="#7fd0e0" stroke-width=".7"/>
    <g transform="translate(82 18)"><path d="M-6 0 Q0 -8 6 0" fill="none" stroke="#cfd6e0" stroke-width=".8"/><path d="M-3 2 Q0 -2 3 2" fill="none" stroke="#cfd6e0" stroke-width=".8"/><path d="M-8 -6 L8 8" stroke="${R}" stroke-width="1"/></g>${txt(82, 32, '離線', 3.2, GH)}`),
  seed_bard: k => svg('crypto', `${ground(k)}
    <rect x="40" y="10" width="54" height="40" fill="${W}" stroke="${G}" stroke-width=".5"/>
    ${['apple', 'river', 'tiger', 'moon', 'salt', 'cloud', 'brave', 'ocean', 'pilot', 'echo', 'lamp', 'zero'].map((w, i) => txt(46 + (i % 3) * 16, 17 + Math.floor(i / 3) * 8, `${i + 1}.${w}`, 2.6, '#3a2a05', 'start')).join('')}
    ${fig(20, 30, 1, k, `<path d="M24 34 Q30 30 28 40" fill="none" stroke="${G}" stroke-width=".8"/><path d="M15.4 27 Q20 22.6 24.6 27Z" fill="${PK}" stroke="none"/>`)}${txt(30, 60, '忘一個就回不了家', 3, GH)}`),
  gas_imp: k => svg('crypto', `${ground(k)}
    ${Array.from({ length: 10 }, (_, i) => blk(14 + (i % 5) * 9, 40 - Math.floor(i / 5) * 9, .9)).join('')}${txt(32, 56, '鏈上擁擠', 3.2, GH)}
    <g transform="translate(74 30)"><path d="M0 -12 Q8 -4 4 4 Q2 8 0 8 Q-2 8 -4 4 Q-8 -4 0 -12Z" fill="#ffb347" stroke="${G}" stroke-width=".4" filter="url(#glow)"/><circle cx="-1.6" cy="0" r=".8" fill="${k}"/><circle cx="1.6" cy="0" r=".8" fill="${k}"/></g>${txt(74, 48, '手續費 ↑', 3.6, '#ff9c86')}`),
  airdrop_fairy: k => svg('crypto', `${ground(k)}
    ${[[24, 14], [50, 8], [76, 16]].map(([x, y]) => `<path d="M${x - 8} ${y} Q${x} ${y - 9} ${x + 8} ${y}Z" fill="${W}" stroke="${k}" stroke-width=".3"/><path d="M${x - 8} ${y} L${x} ${y + 12} L${x + 8} ${y}" fill="none" stroke="${W}" stroke-width=".3"/>${cur(x, y + 14, 3, 'T', '#ffd2e6', '#8a1a4a')}`).join('')}
    ${txt(30, 56, '禮物？', 3.6, GR)}${txt(70, 56, '陷阱？', 3.6, '#ff9c86')}`),
  hodl_turtle: k => svg('crypto', `${ground(k)}
    ${poly([[6, 16], [20, 12], [34, 44], [48, 50], [62, 40], [76, 22], [94, 8]], GH, 1)}${txt(40, 58, '−80%', 3.4, '#ff9c86')}
    <g transform="translate(48 46)"><ellipse rx="14" ry="8" fill="#4a7a4a" stroke="${G}" stroke-width=".5"/><path d="M-8 -4 L0 -7 L8 -4 M-10 2 H10 M0 -7 V6" stroke="${G}" stroke-width=".4" fill="none"/><circle cx="16" cy="2" r="3" fill="#4a7a4a" stroke="${G}" stroke-width=".4"/></g>${txt(80, 34, '四年一循環', 3, GH)}`),
  stable_knight: k => svg('crypto', `${ground(k)}
    ${fig(36, 18, 1.2, k, `<path d="M30.6 15 Q36 9.6 41.4 15Z" fill="#cfd6e0" stroke="none"/>`)}${shield(36, 40, 1.1, '#2a5a7a')}${txt(36, 42, '1:1', 5, GH)}
    ${cur(70, 24, 6, 'USDT', '#26a17b', '#fff')}<path d="M70 32 V38" stroke="${GH}" stroke-width=".5"/>${cur(70, 46, 6, '$1', G)}${txt(70, 60, '足額儲備', 3.2, GH)}`),
  defi_alchemist: k => svg('crypto', `${ground(k)}
    <path d="M32 26 Q30 44 40 50 H60 Q70 44 68 26Z" fill="#cfe8ff" opacity=".25" stroke="${W}" stroke-width=".6"/><path d="M33 38 Q50 34 67 38 Q68 46 60 50 H40 Q32 46 33 38Z" fill="#d9467f" opacity=".6"/>
    ${[[42, 44], [50, 42], [58, 45]].map(([x, y]) => blk(x, y, .6)).join('')}${txt(50, 20, '流動性池', 3.4, GH)}
    <g fill="${G}">${[[74, 30], [78, 24], [82, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>${txt(86, 12, '收益', 3, GR)}`),
  pump_shark: k => svg('crypto', `${ground(k)}
    ${poly([[6, 50], [30, 48], [44, 46], [50, 30], [56, 10], [62, 14]], UP, 1.4)}${txt(70, 12, '×10', 5, UP)}
    <path d="M10 56 Q24 44 40 54 L36 46 Q42 50 46 56" fill="#3a3a5a" stroke="${G}" stroke-width=".4"/><path d="M22 50 L26 42 L30 50" fill="#3a3a5a" stroke="${G}" stroke-width=".4"/>
    <g transform="translate(80 40)"><path d="M-10 -5 H10 V5 H2 L0 9 L-2 5 H-10Z" fill="${W}" stroke="${k}" stroke-width=".4"/>${txt(0, 1.4, '衝！', 4, '#b0472f')}</g>`),
  contract_scribe: k => svg('crypto', `${ground(k)}
    <rect x="14" y="12" width="56" height="40" rx="2" fill="#1a0a1a" stroke="${G}" stroke-width=".5"/>
    ${[['if (價格 ≥ 目標)', GR], ['  transfer(買方)', '#d9a6ff'], ['else', GR], ['  refund()', '#d9a6ff']].map(([t, c], i) => txt(18, 21 + i * 8, t, 3.2, c, 'start')).join('')}
    ${blk(84, 30, 1.6)}<path d="M70 30 H76" stroke="${GH}" stroke-width=".6"/>${txt(50, 62, '條件成立，自動執行', 3, GH)}`),
  funding_wisp: k => svg('crypto', `${ground(k)}
    <path d="M10 40 L50 34 L90 40" stroke="#a87a3a" stroke-width="1.4" fill="none"/><path d="M50 34 L46 40 H54Z" fill="${G}"/>
    <rect x="10" y="30" width="16" height="8" fill="#5a1a1a" stroke="${G}" stroke-width=".4"/>${txt(18, 36, '多', 4, UP)}<rect x="78" y="34" width="10" height="6" fill="#1a3a2a" stroke="${G}" stroke-width=".4"/>${txt(83, 39, '空', 3.4, GR)}
    ${[[30, 18], [50, 14], [70, 18]].map(([x, y]) => `<path d="M${x} ${y - 6} Q${x + 4} ${y} ${x} ${y + 4} Q${x - 4} ${y} ${x} ${y - 6}Z" fill="#7fd0ff" opacity=".7" filter="url(#glow)"/>`).join('')}${txt(50, 56, '每 8 小時燃起一次', 3, GH)}`),
  /* ★3 */
  halving_phoenix: k => svg('crypto', `${ground(k)}
    <g transform="translate(50 30)"><path d="M0 -14 Q6 -8 4 0 Q16 -10 28 -6 Q16 0 8 6 Q4 12 0 16 Q-4 12 -8 6 Q-16 0 -28 -6 Q-16 -10 -4 0 Q-6 -8 0 -14Z" fill="#ff6b3a" stroke="${G}" stroke-width=".5" filter="url(#glow)"/></g>
    ${[['6.25', 18], ['3.125', 50], ['1.5625', 82]].map(([t, x]) => txt(x, 58, `${t} ₿`, 3.2, GH)).join('')}${txt(50, 64, '每 21 萬個區塊減半', 2.8, GH)}`, [50, 30]),
  bridge_thief: k => svg('crypto', `<path d="M0 50 Q50 46 100 50 V70 H0Z" fill="#1a0a2a"/>
    <path d="M10 36 Q50 20 90 36" fill="none" stroke="${G}" stroke-width="1.2"/><path d="M10 36 V50 M90 36 V50" stroke="${G}" stroke-width="1.2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 8} ${f1(36 - Math.sin((i + 1) / 10 * Math.PI) * 16 * .9)} V40" stroke="${G}" stroke-width=".4"/>`).join('')}
    <path d="M48 26 L52 30 L48 32 L52 36" fill="none" stroke="${R}" stroke-width="1"/>${blk(10, 30, 1.2)}${blk(90, 30, 1.2, '#7f3fdc')}${txt(10, 20, '鏈 A', 3, GH)}${txt(90, 20, '鏈 B', 3, GH)}
    ${fig(62, 38, .7, k, `<path d="M57.4 36 H66.6" stroke="${k}" stroke-width="1.6"/>`)}${txt(50, 62, '一個漏洞，捲走數億', 3, '#ff9c86')}`, [50, 26]),
  stake_guard: k => svg('crypto', `${ground(k)}
    ${stack(26, 52, 8, 4)}${txt(26, 36, '押上代幣', 3, GH)}
    ${fig(54, 22, 1.2, k, `<path d="M60 26 V48" stroke="${G}" stroke-width=".7"/><path d="M58.6 26 L60 21 L61.4 26Z" fill="${W}"/>`)}${shield(54, 40, .8, '#5a2a6a')}${txt(54, 41.4, 'PoS', 3.6, GH)}
    ${txt(82, 30, '作惡', 3.2, '#ff9c86')}${txt(82, 36, '＝罰沒', 3.2, '#ff9c86')}`, [54, 30]),
  amm_kitsune: k => svg('crypto', `${ground(k)}
    <path d="M14 10 V54 H90" stroke="#b9a6e0" stroke-width=".5" fill="none"/>${txt(10, 12, 'y', 3.4, GH)}${txt(92, 58, 'x', 3.4, GH)}
    <path d="M18 12 Q24 40 40 46 Q60 52 88 52" fill="none" stroke="${GH}" stroke-width="1.4"/><circle cx="40" cy="46" r="1.8" fill="${R}"/>${txt(60, 26, 'x × y ＝ k', 5, GH)}
    <g transform="translate(70 40)" fill="#e9a65a" stroke="${G}" stroke-width=".4"><path d="M-6 4 Q-4 -3 2 -2 L5 -6 L6 -1 Q8 1 7 4Z"/><path d="M-6 4 Q-14 2 -12 -5 Q-9 0 -4 1Z" fill="${W}"/></g>`, [60, 26]),
};

const CACHE = {};
/* the card's own illustration, or '' when it has none */
export function ownArt(m) {
  const f = ART[m.id]; if (!f) return '';
  return CACHE[m.id] || (CACHE[m.id] = f(INK[m.cat] || '#000'));
}
export const OWN_IDS = Object.keys(ART);
