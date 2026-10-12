// ur-art.js — one exclusive illustration per ★4 (極稀有) card, keyed by card id.
// Same 100 × 70 box as the scenes; drawn over the attribute's sky with a gold sunburst behind the subject.
// Unlike the shared scenes these are never hue-shifted or mirrored (see .c-art svg.scene.ur in styles.css).
const INK = { tech: '#04102e', fund: '#021a14', deriv: '#08021a', risk: '#1e0604', chips: '#1a0f02', fx: '#021419', crypto: '#10020f', etf: '#0a1403' };
const G = '#f3dc95', GH = '#fff2b0', W = '#f4ead2', R = '#e14b32';
const f1 = n => Math.round(n * 10) / 10;
const rays = (cx, cy, n = 18, r = 90) => `<g fill="#fff4c8" opacity=".16">${Array.from({ length: n }, (_, i) => {
  const a = i * 2 * Math.PI / n, b = a + Math.PI / n * 0.55;
  return `<path d="M${cx} ${cy}L${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}L${f1(cx + r * Math.cos(b))} ${f1(cy + r * Math.sin(b))}Z"/>`; }).join('')}</g>`;
const frame = (cat, cx, cy, inner) => `<svg class="scene ur" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="70" fill="url(#sky-${cat})"/>${rays(cx, cy)}${inner}</svg>`;
const ground = (k, d = 'M0 60 Q50 54 100 60 V70 H0Z') => `<path d="${d}" fill="${k}"/>`;
const sea = y => `<rect y="${y}" width="100" height="${70 - y}" fill="#060a20"/><rect y="${y}" width="100" height="${70 - y}" fill="url(#seigaiha)"/>`;
const coin = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>`;
const flag = (x, y, h, c) => `<path d="M${x} ${y}V${y + h}" stroke="${G}" stroke-width=".5"/><path d="M${x} ${y}h${h * .45}v${h * .62}h-${h * .45}Z" fill="${c}"/>`;
const candle = (x, o, c, h, l, k) => { const up = c < o; return `<path d="M${x} ${h}V${l}" stroke="${GH}" stroke-width=".6"/><rect x="${x - 2}" y="${Math.min(o, c)}" width="4" height="${Math.abs(o - c)}" fill="${up ? '#f6e2a0' : R}" stroke="${k}" stroke-width=".3"/>`; };

const ART = {
  /* tech */
  sweep_ninja: k => frame('tech', 62, 22, `<circle cx="62" cy="22" r="14" fill="#f6e2a0" filter="url(#glow)"/>
    ${[[16, 48, 44, 42, 50], [26, 45, 49, 43, 51], [36, 49, 47, 45, 50], [46, 47, 52, 46, 62], [56, 52, 44, 42, 53], [66, 44, 40, 37, 46], [76, 40, 36, 33, 42]].map(a => candle(...a, k)).join('')}
    <path d="M6 50 H94" stroke="#7cbcff" stroke-width=".6" stroke-dasharray="2 1.5"/>
    <path d="M40 64 Q46 63 52 56 T86 30" fill="none" stroke="${GH}" stroke-width="1.6" filter="url(#glow)"/>
    <g stroke="${k}" stroke-linecap="round" fill="none"><path d="M59 21 L53 30" stroke-width="3.4"/><path d="M53 30 L45 33 M53 30 L57 38" stroke-width="2.6"/><path d="M58 24 L65 22" stroke-width="2"/><path d="M57 25 L50 22" stroke-width="2"/></g>
    <circle cx="59.5" cy="17.6" r="3" fill="${k}"/><path d="M57 17 Q52 15 47 17 Q51 18 47 20" fill="none" stroke="${R}" stroke-width=".9"/>
    <path d="M65 22 L80 12" stroke="#e9ecf6" stroke-width="1.1" stroke-linecap="round"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  elliott_god: k => frame('tech', 50, 26, `<circle cx="50" cy="26" r="20" fill="none" stroke="${G}" stroke-width="1.2" opacity=".8"/><circle cx="50" cy="26" r="16" fill="#f6e2a0" opacity=".25"/>
    <path d="M6 54 L22 36 L32 44 L56 12 L64 24 L88 6" fill="none" stroke="${GH}" stroke-width="1.8" stroke-linejoin="round" filter="url(#glow)"/>
    ${[[22, 36, 1], [32, 44, 2], [56, 12, 3], [64, 24, 4], [88, 6, 5]].map(([x, y, n]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${k}" stroke="${G}" stroke-width=".5"/><text x="${x}" y="${y + 1.2}" font-size="3.4" text-anchor="middle" fill="${GH}" font-family="serif">${n}</text>`).join('')}
    <path d="M0 70 V56 Q14 44 30 48 Q40 50 44 58 Q38 52 32 56 Q40 54 46 60 Q60 48 76 52 Q90 55 100 50 V70Z" fill="#0b2c6a"/>
    <path d="M30 48 Q40 50 44 58 Q38 52 32 56" fill="none" stroke="#fff" stroke-width=".9"/>
    <path d="M0 62 Q20 58 40 62 T80 60 T100 62 V70 H0Z" fill="${k}"/>`),
  gann_oracle: k => frame('tech', 64, 26, `${[8, 14, 22, 32, 46, 64].map(dy => `<path d="M6 62 L96 ${62 - dy * 1.3}" stroke="${G}" stroke-width=".5" opacity=".7"/>`).join('')}
    <path d="M6 62 L60 0" stroke="${GH}" stroke-width="1.1" filter="url(#glow)"/>
    <g stroke="#7cbcff" stroke-width=".3" opacity=".4">${[20, 34, 48, 62, 76, 90].map(x => `<path d="M${x} 0V62"/>`).join('')}${[10, 24, 38, 52].map(y => `<path d="M0 ${y}H100"/>`).join('')}</g>
    <path d="M46 26 Q64 10 82 26 Q64 42 46 26Z" fill="${W}" stroke="${G}" stroke-width=".8"/><circle cx="64" cy="26" r="7" fill="#1d58b8"/><circle cx="64" cy="26" r="3.2" fill="${k}"/><circle cx="62.4" cy="24.4" r="1.2" fill="#fff"/>
    <g fill="${GH}" font-size="3" font-family="serif" text-anchor="middle"><text x="64" y="12">90°</text><text x="88" y="27">180°</text><text x="40" y="27">360°</text></g>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  vwap_titan: k => frame('tech', 50, 20, `<g fill="#7cbcff" opacity=".55">${[6, 12, 9, 16, 22, 14, 10, 18, 25, 15, 8, 12, 20, 11].map((h, i) => `<rect x="${4 + i * 6.7}" y="${62 - h}" width="4.6" height="${h}"/>`).join('')}</g>
    <path d="M24 60 L28 40 Q30 32 38 30 L42 28 L40 20 Q42 14 50 14 Q58 14 60 20 L58 28 L62 30 Q70 32 72 40 L76 60Z" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M38 31 L26 18 M62 31 L74 18" stroke="${k}" stroke-width="5" stroke-linecap="round"/>
    <path d="M4 17 H96" stroke="${GH}" stroke-width="2" filter="url(#glow)"/><text x="50" y="12" font-size="4" text-anchor="middle" fill="${GH}" font-family="serif" letter-spacing=".5">VWAP</text>
    <circle cx="46" cy="21" r="1" fill="${GH}"/><circle cx="54" cy="21" r="1" fill="${GH}"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),

  /* fund */
  moat_lord: k => frame('fund', 50, 26, `<circle cx="80" cy="14" r="8" fill="url(#sun-gold)"/>
    <ellipse cx="50" cy="58" rx="48" ry="9" fill="#1a7a9a"/><ellipse cx="50" cy="58" rx="48" ry="9" fill="url(#seigaiha)" opacity=".5"/>
    <ellipse cx="50" cy="55" rx="30" ry="5" fill="${k}"/><path d="M28 55 L32 46 H68 L72 55Z" fill="#5a5448" stroke="${k}" stroke-width=".4"/>
    <g stroke="${k}" stroke-width=".5" stroke-linejoin="round"><rect x="36" y="38" width="28" height="8" fill="${W}"/><path d="M31 39 L50 32 L69 39 L66 40 H34Z" fill="#2a3b44"/>
      <rect x="40" y="27" width="20" height="6" fill="${W}"/><path d="M36 28.5 L50 22 L64 28.5 L61 29.5 H39Z" fill="#2a3b44"/>
      <rect x="44" y="17" width="12" height="5.5" fill="${W}"/><path d="M40 18.5 L50 11 L60 18.5 L58 19.5 H42Z" fill="#2a3b44"/></g>
    <path d="M42 12.5 q-2 -3 0 -4 M58 12.5 q2 -3 0 -4" stroke="${G}" stroke-width="1" fill="none"/>
    <path d="M2 60 Q14 52 28 55" fill="none" stroke="#8a5a2a" stroke-width="1.6"/><path d="M2 60 Q14 52 28 55" fill="none" stroke="${G}" stroke-width=".4"/>
    <g fill="${k}"><rect x="47.5" y="41" width="5" height="5"/><rect x="42" y="29" width="2" height="2"/><rect x="56" y="29" width="2" height="2"/></g>`),
  value_sage: k => frame('fund', 50, 20, `<path d="M0 54 Q50 44 100 54 V70 H0Z" fill="#0d3a2b"/>
    <path d="M48 56 Q47 40 50 32 Q53 40 52 56Z" fill="#3a2508"/><path d="M50 40 L40 32 M51 38 L62 30" stroke="#3a2508" stroke-width="1.6"/>
    <ellipse cx="50" cy="22" rx="30" ry="16" fill="#1f6b46"/><ellipse cx="38" cy="26" rx="14" ry="9" fill="#2a8a5a"/><ellipse cx="62" cy="24" rx="15" ry="9" fill="#2a8a5a"/>
    ${[[30, 20], [40, 14], [52, 12], [64, 16], [72, 24], [46, 26], [58, 30], [34, 30], [68, 32]].map(([x, y]) => coin(x, y, 2)).join('')}
    <g fill="${k}"><path d="M20 62 Q20 50 26 48 Q32 50 32 62Z"/><circle cx="26" cy="45" r="3"/><path d="M20 44 L26 39 L32 44Z"/></g>
    <path d="M32 54 L37 52" stroke="${k}" stroke-width="1.4"/>${coin(38, 52, 1.6)}${ground(k, 'M0 62 Q50 58 100 62 V70 H0Z')}`),
  compound_dragon: k => { const pts = Array.from({ length: 15 }, (_, i) => { const t = i * 0.55, r = 3 * Math.exp(0.26 * t); return [f1(46 + r * Math.cos(t)), f1(33 + r * Math.sin(t) * 0.8), f1(1.1 + i * 0.26)]; });
    const path = 'M' + Array.from({ length: 60 }, (_, i) => { const t = i * 0.14, r = 3 * Math.exp(0.26 * t); return `${f1(46 + r * Math.cos(t))} ${f1(33 + r * Math.sin(t) * 0.8)}`; }).join(' L');
    const [hx, hy] = pts[pts.length - 1];
    return frame('fund', 50, 32, `<path d="${path}" fill="none" stroke="#2a8a5a" stroke-width="3.4" stroke-linecap="round"/><path d="${path}" fill="none" stroke="${G}" stroke-width=".7" stroke-dasharray="1.4 1.2"/>
      ${pts.map(([x, y, r]) => coin(x, y, r)).join('')}
      <g transform="translate(${hx} ${hy}) scale(1.7)"><path d="M-4 -2 L6 -6 L10 -3 L6 0 L9 2 L2 3 L-4 2Z" fill="#2a8a5a" stroke="${G}" stroke-width=".5"/><path d="M5 -6 L8 -11 M2 -5 L3 -10" stroke="${G}" stroke-width=".8"/><circle cx="5.5" cy="-3" r=".8" fill="${R}"/></g>
      <text x="14" y="16" font-size="5" fill="${GH}" font-family="serif" font-style="italic">(1+r)ⁿ</text>${ground(k)}`); },
  activist_shogun: k => frame('fund', 50, 22, `${flag(12, 14, 40, '#f4ead2')}${flag(20, 20, 34, R)}${flag(84, 14, 40, '#f4ead2')}${flag(76, 20, 34, R)}
    <g fill="${R}" font-size="5" font-family="serif"><text x="13.5" y="22">改</text><text x="85.5" y="22">革</text></g>
    <path d="M30 62 L34 42 Q36 34 44 32 H56 Q64 34 66 42 L70 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M42 30 Q42 20 50 20 Q58 20 58 30Z" fill="${k}" stroke="${G}" stroke-width=".5"/><path d="M38 28 H62 L60 31 H40Z" fill="${k}" stroke="${G}" stroke-width=".4"/>
    <path d="M50 21 L41 8 Q46 14 50 16 Q54 14 59 8Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>
    <path d="M64 40 L76 30" stroke="${k}" stroke-width="2.4" stroke-linecap="round"/><path d="M76 30 Q84 18 74 20 Q70 26 76 30Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/><circle cx="76" cy="24" r="1.6" fill="${R}"/>
    <path d="M46 26 H54" stroke="${GH}" stroke-width=".8"/>${ground(k, 'M0 62 Q50 58 100 62 V70 H0Z')}`),

  /* deriv */
  gamma_tyrant: k => frame('deriv', 50, 30, `<path d="M4 60 Q50 60 96 4" fill="none" stroke="#ff9cc0" stroke-width="1.2" opacity=".8" filter="url(#glow)"/>
    <path d="M18 2 L12 16 L17 16 L10 30" fill="none" stroke="${GH}" stroke-width="1" filter="url(#glow)"/><path d="M86 30 L80 42 L85 42 L79 54" fill="none" stroke="${GH}" stroke-width="1" filter="url(#glow)"/>
    <path d="M26 62 L30 42 Q34 32 43 30 L45 23 Q50 18 55 23 L57 30 Q66 32 70 42 L74 62Z" fill="${k}" stroke="#c9b0ff" stroke-width=".5"/>
    <path d="M43 19 L44 11 L47.5 15.5 L50 8 L52.5 15.5 L56 11 L57 19Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>
    <circle cx="47.5" cy="24" r=".9" fill="${R}"/><circle cx="52.5" cy="24" r=".9" fill="${R}"/>
    <text x="50" y="50" font-size="14" font-family="serif" font-weight="700" text-anchor="middle" fill="${GH}" filter="url(#glow)">Γ</text>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  vix_kitsune: k => frame('deriv', 58, 30, `<circle cx="22" cy="14" r="8" fill="#f6e2a0" filter="url(#glow)"/>
    <path d="M4 10 L12 8 L16 18 L22 4 L28 16 L34 6 L40 20 L48 2 L54 14 L62 8 L70 18 L78 4 L86 12 L96 8" fill="none" stroke="#ff9cc0" stroke-width=".8" opacity=".8"/>
    ${Array.from({ length: 9 }, (_, i) => { const a = -150 + i * 15; return `<path d="M0 0 Q6 -4 4 -26 Q0 -16 -4 -26 Q-6 -4 0 0Z" transform="translate(58 46) rotate(${a + 90})" fill="${i % 2 ? '#f4ead2' : '#e7dcc0'}" stroke="${k}" stroke-width=".4"/>`; }).join('')}
    <path d="M40 62 Q38 48 44 42 Q46 34 44 26 L48 30 L52 26 L52 34 Q56 42 54 52 L56 62Z" fill="${W}" stroke="${k}" stroke-width=".5"/>
    <path d="M44 26 L46 31 M52 26 L50.5 31" stroke="${R}" stroke-width=".7"/><path d="M45 33 Q48 36 51 33" stroke="${R}" stroke-width=".7" fill="none"/>
    <circle cx="46" cy="31.5" r=".6" fill="${k}"/><circle cx="50" cy="31.5" r=".6" fill="${k}"/>${ground(k, 'M0 62 Q50 58 100 62 V70 H0Z')}`),
  pricing_sage: k => frame('deriv', 50, 22, `<g fill="${GH}" font-family="serif" font-style="italic" font-size="5" opacity=".9"><text x="10" y="14">σ</text><text x="82" y="16">√T</text><text x="14" y="34">N(d₁)</text><text x="78" y="36">e⁻ʳᵗ</text></g>
    <path d="M34 62 L38 40 Q40 32 50 31 Q60 32 62 40 L66 62Z" fill="${k}" stroke="#c9b0ff" stroke-width=".5"/>
    <circle cx="50" cy="26" r="5" fill="${k}" stroke="#c9b0ff" stroke-width=".5"/><path d="M44 24 Q50 14 56 24" fill="${k}" stroke="#c9b0ff" stroke-width=".5"/><path d="M47 30 Q50 40 53 30" fill="${W}" opacity=".8"/>
    <rect x="28" y="40" width="44" height="16" rx="1" fill="${W}" stroke="#6b470f" stroke-width=".5"/><rect x="26" y="39" width="3" height="18" rx="1.4" fill="#8a5a2a"/><rect x="71" y="39" width="3" height="18" rx="1.4" fill="#8a5a2a"/>
    <path d="M32 53 Q42 53 46 46 Q50 38 54 46 Q58 53 68 53" fill="none" stroke="#3a1878" stroke-width="1"/><path d="M50 41 V53" stroke="${R}" stroke-width=".5" stroke-dasharray="1 .8"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  leverage_kraken: k => frame('deriv', 50, 24, `<circle cx="78" cy="14" r="7" fill="#f6e2a0" filter="url(#glow)"/>
    <g transform="translate(44 30)"><path d="M-6 6 H14 L10 11 H-3Z" fill="#5a3a1a" stroke="${k}" stroke-width=".4"/><path d="M4 6 V-10" stroke="#5a3a1a" stroke-width=".8"/><path d="M4.5 -9 Q11 -2 4.5 4Z" fill="${W}"/></g>
    ${[['M12 66 Q8 44 22 34 Q30 30 34 38', 3.6], ['M30 66 Q28 50 38 44 Q44 40 46 42', 3], ['M66 66 Q72 46 60 40 Q54 38 54 42', 3], ['M88 66 Q94 40 80 28 Q70 22 64 30', 3.6]].map(([d, w]) => `<path d="${d}" fill="none" stroke="#5a1878" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ff9cc0" stroke-width=".9" stroke-dasharray=".2 2.4" stroke-linecap="round"/>`).join('')}
    <circle cx="50" cy="64" r="10" fill="#5a1878"/><circle cx="46" cy="61" r="1.4" fill="${GH}"/><circle cx="54" cy="61" r="1.4" fill="${GH}"/>${sea(64)}
    <text x="14" y="16" font-size="6" fill="${GH}" font-family="serif" font-weight="700">×10</text>`),

  /* risk */
  sharpe_appraiser: k => frame('risk', 44, 30, `<path d="M44 16 L54 24 L50 40 L38 40 L34 24Z" fill="#9fe0f0" stroke="#fff" stroke-width=".6"/><path d="M34 24 H54 M44 16 L40 24 L44 40 L48 24Z" fill="none" stroke="#fff" stroke-width=".4"/>
    <circle cx="44" cy="29" r="15" fill="#ffffff22" stroke="url(#gold-v)" stroke-width="3"/><circle cx="44" cy="29" r="15" fill="none" stroke="#6b470f" stroke-width=".4"/>
    <path d="M55 40 L72 58" stroke="${k}" stroke-width="5" stroke-linecap="round"/><path d="M55 40 L58 43" stroke="url(#gold-v)" stroke-width="5"/>
    <g fill="#fff"><path d="M24 12 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1Z"/><path d="M66 18 l.8 2.4 2.4 .8 -2.4 .8 -.8 2.4 -.8 -2.4 -2.4 -.8 2.4 -.8Z"/></g>
    <text x="80" y="14" font-size="6" fill="${GH}" font-family="serif" font-style="italic" text-anchor="middle">μ/σ</text>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  sortino_keep: k => frame('risk', 50, 22, `<circle cx="50" cy="22" r="16" fill="url(#sun-gold)" opacity=".9"/>
    <path d="M26 62 Q30 50 34 44 H66 Q70 50 74 62Z" fill="#5a5448" stroke="${k}" stroke-width=".4"/><g stroke="${k}" stroke-width=".3" opacity=".6"><path d="M30 52 H70 M28 57 H72 M33 47 H67"/></g>
    <g stroke="${k}" stroke-width=".5" stroke-linejoin="round"><rect x="38" y="34" width="24" height="10" fill="${W}"/><path d="M33 35 L50 28 L67 35 L64 36 H36Z" fill="${k}"/>
      <rect x="42" y="22" width="16" height="7" fill="${W}"/><path d="M38 23.5 L50 16 L62 23.5 L60 24.5 H40Z" fill="${k}"/><path d="M45 17 L50 11 L55 17Z" fill="${k}"/></g>
    <g fill="${k}"><rect x="41" y="38" width="3" height="3"/><rect x="48.5" y="38" width="3" height="3"/><rect x="56" y="38" width="3" height="3"/></g>
    <path d="M14 58 Q50 72 86 58" fill="none" stroke="${GH}" stroke-width="1.6" filter="url(#glow)"/>
    ${[18, 32, 68, 82].map(x => `<path d="M${x} 46 V54 M${x - 2} 51.5 L${x} 54 L${x + 2} 51.5" stroke="${R}" stroke-width="1" fill="none"/>`).join('')}${ground(k, 'M0 64 H100 V70 H0Z')}`),
  ruin_judge: k => frame('risk', 50, 28, `${[18, 30, 70, 82].map((x, i) => `<path d="M${x - 6} 62 Q${x - 4} ${48 - i % 2 * 4} ${x} ${40 - i % 2 * 4} Q${x + 2} 50 ${x + 6} 62Z" fill="#ff8a3d" opacity=".85"/><path d="M${x - 3} 62 Q${x - 1} 54 ${x} 50 Q${x + 1} 56 ${x + 3} 62Z" fill="#ffe08a"/>`).join('')}
    <path d="M30 62 L34 40 Q38 32 50 31 Q62 32 66 40 L70 62Z" fill="#6a0f0a" stroke="${G}" stroke-width=".5"/>
    <circle cx="50" cy="25" r="6" fill="#b8291a"/><path d="M44 27 Q50 40 56 27" fill="${k}"/>
    <rect x="40" y="10" width="20" height="10" fill="${k}" stroke="${G}" stroke-width=".6"/><path d="M38 20 H62 V22 H38Z" fill="${G}"/>
    <text x="50" y="18.4" font-size="7" text-anchor="middle" fill="${GH}" font-family="serif" font-weight="700">王</text>
    <path d="M47 23.5 l2 1 M53 23.5 l-2 1" stroke="${k}" stroke-width=".8"/>
    <rect x="47" y="36" width="6" height="16" rx="1" fill="${W}" stroke="${G}" stroke-width=".4"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  barbell_titan: k => frame('risk', 50, 30, `<path d="M8 14 H92" stroke="#9aa0ad" stroke-width="2"/>
    <rect x="8" y="4" width="8" height="20" rx="1" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".4"/><rect x="17" y="6" width="5" height="16" rx="1" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".4"/>
    <rect x="84" y="9" width="5" height="10" rx="1" fill="${R}" stroke="${k}" stroke-width=".4"/>
    <g fill="${GH}" font-size="3.4" font-family="serif" text-anchor="middle"><text x="15" y="29">90% 安全</text><text x="86" y="25">10% 冒險</text></g>
    <path d="M34 15 L40 28 M66 15 L60 28" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 62 L36 42 Q38 30 50 29 Q62 30 64 42 L68 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/><circle cx="50" cy="24" r="5" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M44 38 Q50 42 56 38" stroke="${G}" stroke-width=".5" fill="none"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),

  /* chips */
  squeeze_beast: k => frame('chips', 50, 34, `${[[10, 20, 30], [22, 26, 26], [74, 18, 34], [86, 28, 22]].map(([x, y, h]) => `<rect x="${x}" y="${y}" width="6" height="${h}" fill="${R}" opacity=".85"/>`).join('')}
    <g fill="${R}"><path d="M32 22 l4 -3 1 4Z"/><path d="M64 18 l3 4 -4 1Z"/><path d="M28 34 l3 2 -3 2Z"/><path d="M70 30 l-3 2 3 2Z"/></g>
    <path d="M50 4 L58 14 H53 V22 H47 V14 H42Z" fill="${GH}" filter="url(#glow)"/>
    <path d="M43 37 Q30 34 26 20 Q34 28 46 33Z M57 37 Q70 34 74 20 Q66 28 54 33Z" fill="${W}" stroke="${k}" stroke-width=".5"/><path d="M41 39 L33 37 L39 43Z M59 39 L67 37 L61 43Z" fill="${k}" stroke="${G}" stroke-width=".4"/>
    <path d="M34 62 Q32 48 40 40 Q42 34 50 34 Q58 34 60 40 Q68 48 66 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <circle cx="45" cy="42" r="1.4" fill="${R}"/><circle cx="55" cy="42" r="1.4" fill="${R}"/><path d="M46 54 Q50 57 54 54" stroke="${G}" stroke-width=".6" fill="none"/><circle cx="50" cy="56" r="2.2" fill="none" stroke="${G}" stroke-width=".7"/>
    ${ground(k, 'M0 62 H100 V70 H0Z')}`),
  limitup_dragon: k => frame('chips', 70, 14, `<rect x="0" y="4" width="100" height="5" fill="${R}"/><text x="18" y="8.2" font-size="4" fill="#fff" font-family="serif" font-weight="700">漲停</text>
    <path d="M10 64 Q4 50 20 46 Q38 42 30 32 Q22 22 42 20 Q60 18 56 28 Q52 36 66 34 Q76 32 72 18" fill="none" stroke="#c8321f" stroke-width="6" stroke-linecap="round"/>
    <path d="M10 64 Q4 50 20 46 Q38 42 30 32 Q22 22 42 20 Q60 18 56 28 Q52 36 66 34 Q76 32 72 18" fill="none" stroke="${G}" stroke-width="1.2" stroke-dasharray="1 1.6" stroke-linecap="round"/>
    <g transform="translate(72 16)"><path d="M-5 4 L-2 -4 L6 -6 L9 -2 L4 0 L6 3 L-1 4Z" fill="#c8321f" stroke="${G}" stroke-width=".5"/><path d="M2 -5 L4 -10 M-1 -4 L-1 -9" stroke="${G}" stroke-width=".9"/><circle cx="3" cy="-2.5" r=".9" fill="${GH}"/><path d="M8 -2 Q14 0 12 4 M8 -1 Q16 -4 16 2" stroke="${G}" stroke-width=".5" fill="none"/></g>
    ${[[16, 36], [42, 40], [86, 28], [84, 46]].map(([x, y]) => coin(x, y, 2)).join('')}${ground(k, 'M0 62 Q50 56 100 62 V70 H0Z')}`),
  circuit_raijin: k => frame('chips', 50, 28, `${Array.from({ length: 8 }, (_, i) => { const a = Math.PI + i * Math.PI / 7; return `<circle cx="${f1(50 + 30 * Math.cos(a))}" cy="${f1(32 + 22 * Math.sin(a))}" r="4" fill="#c8321f" stroke="${G}" stroke-width=".6"/><circle cx="${f1(50 + 30 * Math.cos(a))}" cy="${f1(32 + 22 * Math.sin(a))}" r="1.6" fill="${G}"/>`; }).join('')}
    <path d="M20 32 Q50 -4 80 32" fill="none" stroke="${G}" stroke-width=".7"/>
    <path d="M36 62 L38 44 Q40 36 50 35 Q60 36 62 44 L64 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/><circle cx="50" cy="30" r="5" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M46 26 L43 20 M54 26 L57 20" stroke="${G}" stroke-width="1"/><circle cx="48" cy="30" r=".8" fill="${GH}"/><circle cx="52" cy="30" r=".8" fill="${GH}"/>
    <path d="M30 40 L24 50 H29 L22 62" fill="none" stroke="${GH}" stroke-width="1.3" filter="url(#glow)"/><path d="M70 40 L76 50 H71 L78 62" fill="none" stroke="${GH}" stroke-width="1.3" filter="url(#glow)"/>
    <path d="M4 56 L14 52 L20 54 M80 40 L88 42 L96 38" stroke="#fff4dc" stroke-width=".8" fill="none"/><path d="M20 54 V58 M80 40 V36" stroke="#fff4dc" stroke-width=".5" stroke-dasharray="1 1"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  market_maker_king: k => frame('chips', 50, 24, `${[0, 1, 2, 3, 4].map(i => `<rect x="${30 - (5 - i) * 4.6}" y="${30 + i * 5}" width="${(5 - i) * 4.6}" height="3.6" fill="#2f9e74"/><rect x="70" y="${30 + i * 5}" width="${(5 - i) * 4.6}" height="3.6" fill="${R}"/>`).join('')}
    <g fill="${GH}" font-size="3.2" font-family="serif" text-anchor="middle"><text x="16" y="28">買</text><text x="84" y="28">賣</text></g>
    <path d="M36 62 V30 Q36 22 50 20 Q64 22 64 30 V62Z" fill="#6b1d10" stroke="${G}" stroke-width=".7"/>
    <path d="M40 62 L42 44 Q44 38 50 37 Q56 38 58 44 L60 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/><circle cx="50" cy="32" r="4.4" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M45 28 L45.5 22 L48 25 L50 20 L52 25 L54.5 22 L55 28Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>
    <path d="M57 46 L64 40" stroke="${k}" stroke-width="1.6"/><circle cx="64.5" cy="39.5" r="1.6" fill="url(#gold-v)"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),

  /* fx */
  rate_titan: k => frame('fx', 50, 16, `<path d="M20 46 V20 Q26 6 50 4 Q74 6 80 20 V46" fill="${k}" opacity=".8"/>
    <circle cx="44" cy="12" r="1.2" fill="${GH}"/><circle cx="56" cy="12" r="1.2" fill="${GH}"/>
    <path d="M30 26 L20 8 M70 26 L80 8" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
    <path d="M76 10 L84 2 M84 2 H79 M84 2 V7" stroke="${GH}" stroke-width="1.6" fill="none" filter="url(#glow)"/>
    <text x="16" y="7" font-size="7" fill="${GH}" font-family="serif" font-weight="700" filter="url(#glow)">%</text>
    <path d="M24 34 L50 24 L76 34Z" fill="${W}" stroke="${k}" stroke-width=".5"/><rect x="26" y="34" width="48" height="2.4" fill="${W}"/>
    ${[30, 38, 46, 54, 62, 70].map(x => `<rect x="${x - 1.6}" y="36.4" width="3.2" height="18" fill="${W}" stroke="${k}" stroke-width=".3"/>`).join('')}
    <rect x="22" y="54" width="56" height="3" fill="${W}"/><rect x="18" y="57" width="64" height="3" fill="${W}"/>${ground(k, 'M0 60 H100 V70 H0Z')}`),
  dollar_emperor: k => frame('fx', 50, 22, `<circle cx="50" cy="22" r="15" fill="url(#sun-gold)" filter="url(#glow)"/><text x="50" y="29.5" font-size="20" font-family="serif" font-weight="700" text-anchor="middle" fill="#8a5a12">$</text>
    <path d="M10 70 V58 A40 30 0 0 1 90 58 V70Z" fill="#11707e" stroke="${G}" stroke-width=".6"/>
    <g fill="none" stroke="${G}" stroke-width=".4" opacity=".7"><path d="M50 40 V70 M30 46 Q36 58 34 70 M70 46 Q64 58 66 70 M14 54 Q50 48 86 54"/></g>
    <path d="M34 46 L36 36 L42 41 L50 32 L58 41 L64 36 L66 46Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".4"/>
    <g fill="${R}"><circle cx="42" cy="42" r="1"/><circle cx="50" cy="40" r="1.3"/><circle cx="58" cy="42" r="1"/></g>`),
  peg_guardian: k => frame('fx', 50, 26, `<path d="M4 18 Q14 6 22 22 T42 14 T62 26 T82 10 T96 20" fill="none" stroke="#7fe3d8" stroke-width=".8" opacity=".5"/>
    <path d="M4 28 H96" stroke="${GH}" stroke-width="1.8" filter="url(#glow)"/><text x="88" y="25" font-size="4" fill="${GH}" font-family="serif" text-anchor="middle">7.8</text>
    ${[0, 1, 2, 3].map(i => `<ellipse cx="${66 + i * 3.4}" cy="${30 + i * 2}" rx="2" ry="1.2" fill="none" stroke="${G}" stroke-width=".7"/>`).join('')}
    <path d="M30 56 Q28 44 34 40 Q34 32 40 28 Q50 24 56 30 Q60 36 58 42 Q66 46 64 56Z" fill="#11707e" stroke="${G}" stroke-width=".6"/>
    <path d="M36 32 Q34 26 40 24 Q38 30 44 28 Q42 34 48 30" fill="none" stroke="${G}" stroke-width=".8"/>
    <circle cx="50" cy="34" r="1.1" fill="${GH}"/><path d="M52 38 Q56 40 58 37" stroke="${GH}" stroke-width=".6" fill="none"/>
    <path d="M64 46 Q70 44 74 38" stroke="${G}" stroke-width=".7" fill="none"/>
    <rect x="24" y="56" width="46" height="6" fill="#5a5448" stroke="${k}" stroke-width=".4"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  triangle_sage: k => frame('fx', 50, 30, `<path d="M50 8 L84 48 H16Z" fill="none" stroke="${GH}" stroke-width="1" stroke-dasharray="2.4 1.2"/>
    <g stroke="${GH}" stroke-width=".9" fill="none"><path d="M64 22 l3 4 -4.6 .6"/><path d="M52 48 l-4 -2.4 4 -2.4"/><path d="M30 30 l.4 -4.8 3.8 3"/></g>
    ${[[50, 8, '$'], [84, 48, '€'], [16, 48, '¥']].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".4"/><text x="${x}" y="${y + 3}" font-size="8" font-family="serif" font-weight="700" text-anchor="middle" fill="#6b3a08">${s}</text>`).join('')}
    <g fill="#ffffff" opacity=".85"><ellipse cx="50" cy="50" rx="12" ry="3"/><ellipse cx="44" cy="48" rx="6" ry="2.6"/><ellipse cx="56" cy="48.5" rx="7" ry="2.4"/></g>
    <path d="M45 48 L46 38 Q47 34 50 34 Q53 34 54 38 L55 48Z" fill="${k}"/><circle cx="50" cy="31" r="2.6" fill="${k}"/><path d="M48 33 Q50 40 52 33" fill="#ffffffcc"/>
    <path d="M54 40 L58 30" stroke="#8a5a2a" stroke-width=".9"/>${sea(62)}`),

  /* crypto */
  genesis_dragon: k => frame('crypto', 46, 22, `<g stroke="#2a0620" stroke-width=".5"><path d="M30 46 L44 40 L58 46 L44 52Z" fill="#ffd2e6"/><path d="M30 46 V58 L44 64 V52Z" fill="#e46fa0"/><path d="M58 46 V58 L44 64 V52Z" fill="#c43c7c"/></g>
    <text x="44" y="47.4" font-size="3.6" text-anchor="middle" fill="#6a1650" font-family="serif" font-weight="700">#0</text>
    <path d="M44 44 Q36 30 46 22 Q58 14 50 6" fill="none" stroke="#c43c7c" stroke-width="5" stroke-linecap="round"/><path d="M44 44 Q36 30 46 22 Q58 14 50 6" fill="none" stroke="${G}" stroke-width="1" stroke-dasharray="1 1.4"/>
    <g transform="translate(51 6)"><path d="M-5 2 L-1 -4 L8 -4 L10 0 L4 2 L7 4 L-2 4Z" fill="#c43c7c" stroke="${G}" stroke-width=".5"/><path d="M1 -4 L2 -9 M4 -4 L7 -8" stroke="${G}" stroke-width=".8"/><circle cx="5" cy="-1.5" r=".8" fill="${GH}"/></g>
    ${[66, 76, 86, 96].map((x, i) => `<rect x="${x - 4}" y="${54 - i * 3}" width="7" height="4" rx="2" fill="none" stroke="${G}" stroke-width="1" transform="rotate(${i % 2 ? 0 : -20} ${x} ${56 - i * 3})"/>`).join('')}
    <path d="M14 30 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1Z" fill="#fff"/>${ground(k, 'M0 64 H100 V70 H0Z')}`),
  majority_hydra: k => frame('crypto', 50, 30, `<circle cx="50" cy="30" r="20" fill="#6a1650" opacity=".7"/><path d="M50 30 L50 10 A20 20 0 1 1 48.7 50 Z" fill="${R}" opacity=".85"/>
    <text x="70" y="14" font-size="6" fill="${GH}" font-family="serif" font-weight="700">51%</text>
    ${[[-48, 26, 16], [-24, 38, 10], [0, 50, 6], [24, 62, 10], [48, 74, 16]].map(([a, x, y]) => `<path d="M50 50 Q${(50 + x) / 2} ${y + 18} ${x} ${y + 4}" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/><g transform="translate(${x} ${y + 4}) rotate(${a / 3})"><path d="M-3 0 L0 -4 L6 -2 L4 1Z" fill="${k}" stroke="${G}" stroke-width=".4"/><circle cx="1" cy="-1.6" r=".6" fill="${GH}"/></g>`).join('')}
    <path d="M30 62 Q36 46 50 46 Q64 46 70 62Z" fill="${k}" stroke="${G}" stroke-width=".5"/>${ground(k, 'M0 62 H100 V70 H0Z')}`),
  onchain_whale: k => frame('crypto', 50, 26, `<path d="M20 52 Q24 26 50 20 Q72 16 80 30 Q84 22 90 22 Q86 28 88 34 Q80 32 78 36 Q70 44 56 48 Q40 52 30 58Z" fill="#2a0a3a" stroke="${G}" stroke-width=".6"/>
    <path d="M30 50 Q46 44 62 40" stroke="#ffd2e6" stroke-width=".5" fill="none"/><path d="M34 54 Q50 48 66 44" stroke="#ffd2e6" stroke-width=".5" fill="none"/>
    <circle cx="34" cy="38" r="1.2" fill="${GH}"/><path d="M28 44 Q30 46 34 44" stroke="${G}" stroke-width=".6" fill="none"/>
    ${[[18, 34], [12, 44], [62, 10], [70, 8], [44, 10], [86, 46]].map(([x, y]) => coin(x, y, 2.2)).join('')}
    <path d="M14 60 Q12 50 18 46 M22 60 Q26 48 22 42" stroke="#fff" stroke-width="1" fill="none" opacity=".8"/>
    <g stroke="#ffd2e6" stroke-width=".4" fill="#14031a">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 12 - 2} 64 l3 -3 h6 l3 3 -3 3 h-6Z"/>`).join('')}</g><rect y="67" width="100" height="3" fill="#14031a"/>`),
  node_titan: k => { const nodes = [[50, 12], [38, 18], [62, 18], [32, 30], [50, 26], [68, 30], [40, 40], [60, 40], [50, 44]];
    const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [4, 8]];
    return frame('crypto', 50, 28, `<circle cx="50" cy="28" r="20" fill="#2a0a3a" stroke="${G}" stroke-width=".7"/><g fill="none" stroke="#ee7fae" stroke-width=".4" opacity=".6"><ellipse cx="50" cy="28" rx="20" ry="7"/><ellipse cx="50" cy="28" rx="9" ry="20"/></g>
      <g stroke="${GH}" stroke-width=".6">${links.map(([a, b]) => `<path d="M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}"/>`).join('')}</g>${nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${GH}" filter="url(#glow)"/>`).join('')}
      <path d="M26 44 Q24 56 34 62 M74 44 Q76 56 66 62" stroke="${k}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M32 70 L36 56 Q40 50 50 50 Q60 50 64 56 L68 70Z" fill="${k}" stroke="${G}" stroke-width=".5"/>`); },

  /* etf */
  tw50_shogun: k => frame('etf', 50, 24, `${Array.from({ length: 50 }, (_, i) => { const row = Math.floor(i / 10), col = i % 10; const x = 6 + col * 9.6 + (row % 2) * 2, y = 14 + row * 7;
      return (col > 3 && col < 6 && row > 1) ? '' : `<path d="M${x} ${y}V${y + 7}" stroke="${G}" stroke-width=".3"/><path d="M${x} ${y}h2.6v3.6h-2.6Z" fill="${[R, '#f4ead2', '#3f7fe0', '#f3dc95', '#2f9e74'][row]}"/>`; }).join('')}
    <text x="50" y="10" font-size="5" fill="${GH}" font-family="serif" font-weight="700" text-anchor="middle">五十</text>
    <path d="M36 64 L40 46 Q42 38 50 37 Q58 38 60 46 L64 64Z" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <path d="M44 36 Q44 26 50 26 Q56 26 56 36Z" fill="${k}" stroke="${G}" stroke-width=".5"/><path d="M50 27 L42 16 Q47 22 50 23 Q53 22 58 16Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>
    <path d="M58 46 L70 32" stroke="#8a5a2a" stroke-width="1"/><path d="M70 32 h8 v5 h-8Z" fill="${R}" stroke="${G}" stroke-width=".3"/><text x="74" y="36" font-size="3.4" fill="#fff" text-anchor="middle" font-family="serif">台</text>
    ${ground(k, 'M0 62 H100 V70 H0Z')}`),
  passive_titan: k => frame('etf', 74, 14, `<circle cx="74" cy="14" r="9" fill="url(#sun-gold)"/>
    <path d="M4 50 L14 46 L22 47 L30 42 L38 43 L46 37 L54 38 L62 31 L70 32 L80 24 L96 18" fill="none" stroke="${GH}" stroke-width="1.4" filter="url(#glow)"/>
    <path d="M0 62 Q50 46 100 62 V70 H0Z" fill="#1c3008"/>
    <path d="M30 60 Q30 50 40 48 Q38 40 42 34 Q50 28 58 34 Q62 40 60 48 Q70 50 70 60Z" fill="${k}" stroke="${G}" stroke-width=".5"/>
    <circle cx="50" cy="26" r="6" fill="${k}" stroke="${G}" stroke-width=".5"/><path d="M46.5 26 q1.4 1.2 2.8 0 M50.7 26 q1.4 1.2 2.8 0" stroke="${G}" stroke-width=".5" fill="none"/>
    <ellipse cx="50" cy="54" rx="8" ry="2.4" fill="${G}" opacity=".4"/><text x="16" y="14" font-size="4" fill="${GH}" font-family="serif">買進 · 持有</text>${ground(k, 'M0 64 Q50 60 100 64 V70 H0Z')}`),
  global_fleet: k => frame('etf', 50, 50, `<path d="M18 56 A32 32 0 0 1 82 56Z" fill="#2f6b9a" stroke="${G}" stroke-width=".6"/><g fill="none" stroke="${G}" stroke-width=".4" opacity=".7"><path d="M50 24 V56 M34 30 Q40 44 38 56 M66 30 Q60 44 62 56 M22 46 H78 M28 36 H72"/></g>
    <g fill="#4a8a3a" opacity=".85"><path d="M30 44 q4 -6 10 -2 q2 4 -4 6Z"/><path d="M56 36 q6 -2 8 4 q-4 4 -8 0Z"/><path d="M60 48 q6 0 6 4 h-8Z"/></g>
    ${[[16, 58, R, 1], [44, 62, '#3f7fe0', .9], [74, 57, '#f3dc95', 1.1]].map(([x, y, c, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 0 H9 L6 4 H-6Z" fill="#5a3a1a" stroke="${k}" stroke-width=".4"/><path d="M0 0 V-14" stroke="#5a3a1a" stroke-width=".7"/><path d="M.6 -13 Q7 -7 .6 -1Z" fill="${W}"/><path d="M-.6 -11 Q-6 -6 -.6 -1Z" fill="#e7dcc0"/><path d="M0 -14 h3 v1.6 h-3Z" fill="${c}"/></g>`).join('')}
    ${sea(62)}`),
  nav_engine: k => { const gear = (cx, cy, r, n, rot = 0) => `<g transform="rotate(${rot} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#8a6a2a" stroke="${G}" stroke-width=".6"/>${Array.from({ length: n }, (_, i) => `<rect x="${f1(cx - 1.6)}" y="${f1(cy - r - 2.6)}" width="3.2" height="3.4" fill="#8a6a2a" stroke="${G}" stroke-width=".4" transform="rotate(${f1(i * 360 / n)} ${cx} ${cy})"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${f1(r * .35)}" fill="${k}" stroke="${G}" stroke-width=".5"/></g>`;
    return frame('etf', 50, 30, `${gear(40, 32, 12, 12)}${gear(62, 24, 8, 9, 10)}${gear(64, 46, 7, 8, 5)}
      <path d="M2 30 H24" stroke="#5a5448" stroke-width="5"/><path d="M2 30 H24" stroke="${G}" stroke-width=".5" stroke-dasharray="2 2"/><path d="M76 46 H98" stroke="#5a5448" stroke-width="5"/><path d="M76 46 H98" stroke="${G}" stroke-width=".5" stroke-dasharray="2 2"/>
      <path d="M14 24 l4 -3 v6Z M88 52 l-4 3 v-6Z" fill="${GH}"/>
      ${[[6, 30], [12, 30]].map(([x, y]) => coin(x, y, 1.8)).join('')}<g transform="translate(90 42)"><path d="M-4 0 H4 L3 4 H-3Z" fill="#7a5222" stroke="#2a1a05" stroke-width=".4"/></g>
      <g fill="${GH}" font-size="3.4" font-family="serif" text-anchor="middle"><text x="12" y="22">申購</text><text x="88" y="38">贖回</text><text x="40" y="54">NAV</text></g>${ground(k, 'M0 62 H100 V70 H0Z')}`); },
};
const CACHE = {};
export function urArt(m) {
  const f = ART[m.id]; if (!f) return '';
  return CACHE[m.id] || (CACHE[m.id] = f(INK[m.cat] || '#000'));
}
export const UR_IDS = Object.keys(ART);
