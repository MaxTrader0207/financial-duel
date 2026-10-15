// art-parts.js — the card-art parts library (主體零件庫): drawing primitives, the shared palette, and ready-made
// subjects (characters, beasts, buildings) and props (scales, candles, coins…) that combine into a 100 × 70 card picture.
// card-art.js draws the 144 hand-made pictures with the primitives; card-recipes.js lists new cards as
// 「零件＋代表物」 recipes; compose() turns a recipe into the picture, and autoRecipe() picks parts from a card's race
// and attribute so even a card with no recipe gets a consistent picture.
export const INK = { money: '#14031a', tech: '#04102e', fund: '#021a14', etf: '#0a1403', fx: '#021419', chips: '#1a0f02', risk: '#1e0604', deriv: '#08021a', crypto: '#10020f' };
export const G = '#f3dc95', GH = '#fff2b0', W = '#f4ead2', R = '#e14b32', PK = '#f2a6e6', BL = '#9fd8ff', GR = '#7fdcae';
export const f1 = n => Math.round(n * 10) / 10;
export const rays = (cx, cy, n = 14, r = 80) => `<g fill="#fff4c8" opacity=".11">${Array.from({ length: n }, (_, i) => {
  const a = i * 2 * Math.PI / n, b = a + Math.PI / n * 0.5;
  return `<path d="M${cx} ${cy}L${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}L${f1(cx + r * Math.cos(b))} ${f1(cy + r * Math.sin(b))}Z"/>`; }).join('')}</g>`;
export const svg = (cat, inner, sun = null) => `<svg class="scene ur own" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="70" fill="url(#sky-${cat})"/>${sun ? rays(...sun) : ''}${inner}</svg>`;
export const ground = (k, d = 'M0 62 H100 V70 H0Z') => `<path d="${d}" fill="${k}"/>`;
export const coin = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>`;
export const stack = (x, y, n, r = 2.4) => Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${f1(y - i * 1.5)}" rx="${r}" ry="${f1(r * .45)}" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".25"/>`).join('');
/* a small robed figure: head centre (x, y), scale s */
export const fig = (x, y, s, k, more = '') => `<g fill="${k}" stroke="${G}" stroke-width=".45" stroke-linejoin="round"><circle cx="${x}" cy="${y}" r="${f1(2.6 * s)}"/>
  <path d="M${f1(x - 3.6 * s)} ${f1(y + 13 * s)} Q${f1(x - 3.8 * s)} ${f1(y + 4.4 * s)} ${x} ${f1(y + 3.2 * s)} Q${f1(x + 3.8 * s)} ${f1(y + 4.4 * s)} ${f1(x + 3.6 * s)} ${f1(y + 13 * s)}Z"/>${more}</g>`;
export const txt = (x, y, t, size = 4, c = GH, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" font-family="serif" fill="${c}" text-anchor="${anchor}">${t}</text>`;
export const UP = '#ff6b5a', DN = '#3fcf8e';                    // Taiwan colours: red up, green down
/* a candle at x: open o, close c, high h, low l (y coordinates) */
export const candle = (x, o, c, h, l, w = 3.6) => { const col = c < o ? UP : DN; return `<path d="M${x} ${h}V${l}" stroke="${col}" stroke-width=".55"/><rect x="${f1(x - w / 2)}" y="${Math.min(o, c)}" width="${w}" height="${Math.max(.6, Math.abs(o - c))}" fill="${col}"/>`; };
export const grid = (c = '#7cbcff', o = .18) => `<g stroke="${c}" stroke-width=".3" opacity="${o}">${[12, 24, 36, 48].map(y => `<path d="M0 ${y}H100"/>`).join('')}${[20, 40, 60, 80].map(x => `<path d="M${x} 0V62"/>`).join('')}</g>`;
export const poly = (pts, c, w = 1.2, extra = '') => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
/* a coin stamped with a currency sign */
export const cur = (x, y, r, sym, c = G, ink = '#2a1a05') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#6b470f" stroke-width=".35"/><text x="${x}" y="${f1(y + r * .42)}" font-size="${f1(r * 1.2)}" font-family="serif" fill="${ink}" text-anchor="middle">${sym}</text>`;
/* a blockchain block (isometric cube) */
export const blk = (x, y, s = 1, c = '#d9467f') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -5 L5 -2.4 L0 .2 L-5 -2.4Z" fill="#ffd2e6" stroke="#10020f" stroke-width=".3"/><path d="M-5 -2.4 L0 .2 V6 L-5 3.4Z" fill="${c}" stroke="#10020f" stroke-width=".3"/><path d="M5 -2.4 L0 .2 V6 L5 3.4Z" fill="#8a1a4a" stroke="#10020f" stroke-width=".3"/></g>`;
/* a heater shield */
export const shield = (x, y, s, fill, stroke = G) => `<path d="M${x} ${f1(y - 9 * s)} L${f1(x + 8 * s)} ${f1(y - 6 * s)} Q${f1(x + 8 * s)} ${f1(y + 6 * s)} ${x} ${f1(y + 10 * s)} Q${f1(x - 8 * s)} ${f1(y + 6 * s)} ${f1(x - 8 * s)} ${f1(y - 6 * s)}Z" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
/* option payoff axes: zero line at y0 */
export const axes = (y0 = 40, c = '#b9a6e0') => `<path d="M6 ${y0} H94" stroke="${c}" stroke-width=".5"/><path d="M50 8 V60" stroke="${c}" stroke-width=".3" opacity=".5"/>`;
export const cloud = (x, y, s = 1, c = '#3a2244') => `<g fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${8 * s}" ry="${3.2 * s}"/><ellipse cx="${x - 4 * s}" cy="${y - 2 * s}" rx="${4.4 * s}" ry="${3 * s}"/><ellipse cx="${x + 3 * s}" cy="${y - 2.6 * s}" rx="${5 * s}" ry="${3.4 * s}"/></g>`;


/* ======================================================================================================
   主體零件 (subjects) and 代表物 (props). Every part draws in its own local box and is placed with
   { x, y, s, flip }: characters, beasts and buildings stand on (x, y) (feet / base), props are centred on (x, y).
   A standing character is about 18 × s units tall; s = 1.6 fills a card nicely. k = the attribute's ink,
   c = an accent colour (robe trim, flag, hakama…).
   ====================================================================================================== */
const place = (o, inner) => `<g transform="translate(${o.x} ${o.y}) scale(${o.flip ? -(o.s || 1) : (o.s || 1)} ${o.s || 1})">${inner}</g>`;
const LINE = `stroke="${G}" stroke-width=".45" stroke-linejoin="round"`;
const body = (k, robe = k) => `<path d="M-4.6 0 Q-4.9 -8.6 0 -11.2 Q4.9 -8.6 4.6 0Z" fill="${robe}" ${LINE}/>`;
const head = (k, fill = k) => `<circle cy="-14.3" r="3.1" fill="${fill}" ${LINE}/>`;
const arm = (k, d) => `<path d="${d}" fill="none" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/>`;

export const PARTS = {
  /* —— characters —— */
  samurai: { kind: 'character', label: '武士', draw: (k, c = R) => `${body(k)}<path d="M0 -5.6 V0" stroke="${G}" stroke-width=".35"/>${head(k)}
    <ellipse cx="0" cy="-17.8" rx="1.1" ry="1.5" fill="${k}" ${LINE}/>${arm(k, 'M2.6 -9 L6.6 -5.4')}
    <path d="M-5.6 -3.2 L9.6 -10.6" stroke="#e9ecf6" stroke-width=".8" stroke-linecap="round"/><path d="M-5.6 -3.2 L-3 -4.4" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>` },
  ninja: { kind: 'character', label: '忍者', draw: (k, c = R) => `<path d="M-2.4 -16.8 L6 -6" stroke="#e9ecf6" stroke-width=".7"/>${body(k)}${head(k)}
    <rect x="-3.1" y="-15.4" width="6.2" height="1.6" fill="${W}"/><path d="M-1.8 -14.6 h1.2 M.6 -14.6 h1.2" stroke="${k}" stroke-width=".5"/>
    <path d="M-2.6 -11.4 Q-7 -12 -9 -9.6 Q-6.4 -10.6 -3 -10.4" fill="${c}"/>${arm(k, 'M-2.6 -8.6 L-7 -5')}` },
  monk: { kind: 'character', label: '僧侶', draw: (k, c = '#c9a86a') => `<path d="M6.4 0 V-21" stroke="${G}" stroke-width=".7"/><circle cx="6.4" cy="-21.6" r="1.4" fill="none" stroke="${G}" stroke-width=".5"/>
    ${body(k, k)}<path d="M-4.4 -1 L3.6 -10.4" stroke="${c}" stroke-width="1.6"/>${head(k, '#3a1a28')}
    ${Array.from({ length: 7 }, (_, i) => `<circle cx="${f1(-2.6 + i * .86)}" cy="${f1(-9.6 + Math.abs(i - 3) * .7)}" r=".42" fill="${G}"/>`).join('')}${arm(k, 'M3 -8.4 L6.4 -8')}` },
  miko: { kind: 'character', label: '巫女', draw: (k, c = R) => `<path d="M-3 -16 Q-5 -9 -3.6 -6 L3.6 -6 Q5 -9 3 -16Z" fill="${k}"/>
    <path d="M-4.4 -5.6 Q-4.6 -9.4 0 -11.2 Q4.6 -9.4 4.4 -5.6Z" fill="${W}" ${LINE}/><path d="M-4.6 0 L-4.4 -5.6 H4.4 L4.6 0Z" fill="${c}" ${LINE}/>${head(k)}
    <path d="M-3.4 -14.6 Q0 -18.6 3.4 -14.6" fill="${k}"/>${arm(k, 'M-2.4 -8 Q0 -6.6 2.4 -8').replace(k, W)}` },
  general: { kind: 'character', label: '武將', draw: (k, c = R) => `<path d="M4.6 -2 V-24" stroke="${G}" stroke-width=".55"/><path d="M4.6 -24 h5.4 v8 h-5.4Z" fill="${c}" ${LINE}/>
    ${body(k)}${[-8, -5.6, -3.2].map(y => `<path d="M-4.2 ${y} H4.2" stroke="${G}" stroke-width=".35"/>`).join('')}${head(k)}
    <path d="M-3.6 -15.4 Q0 -19.6 3.6 -15.4Z" fill="${k}" ${LINE}/><path d="M0 -18.4 Q-3 -22 -5 -21.6 M0 -18.4 Q3 -22 5 -21.6" fill="none" stroke="${G}" stroke-width=".8"/>` },
  sage: { kind: 'character', label: '賢者', draw: (k, c = W) => `<path d="M-6.4 0 V-19 Q-6.4 -21.4 -4.4 -21.4" fill="none" stroke="#8a6a4a" stroke-width=".8"/>${body(k)}${head(k)}
    <path d="M-1.8 -13 Q0 -6.6 1.8 -13Z" fill="${c}"/><path d="M-3.6 -15.6 Q0 -21 3.6 -15.6Z" fill="${k}" ${LINE}/>${arm(k, 'M-2.6 -8.6 L-6.4 -9.6')}` },
  merchant: { kind: 'character', label: '商人', draw: (k, c = '#c99a3f') => `${body(k)}${head(k)}<path d="M-5.4 -15 L0 -18.6 L5.4 -15Z" fill="#c9a86a" ${LINE}/>
    <rect x="2.6" y="-9" width="6" height="4.4" fill="${c}" stroke="${k}" stroke-width=".3"/>${[0, 1, 2].map(i => `<circle cx="${f1(3.8 + i * 1.8)}" cy="-6.8" r=".55" fill="${k}"/>`).join('')}${arm(k, 'M2 -8.6 L3 -7')}` },
  child: { kind: 'character', label: '童子', draw: (k, c = R) => `<g transform="scale(.75)">${body(k)}${head(k)}<path d="M-1 -17.4 Q0 -20.6 1 -17.4" fill="${k}" ${LINE}/>
    <path d="M-2.4 -16.8 Q0 -18 2.4 -16.8" fill="none" stroke="${c}" stroke-width=".8"/></g>` },
  knight: { kind: 'character', label: '騎士', draw: (k, c = '#3f7fe0') => `${body(k)}${head(k, '#5a6a7a')}<path d="M-3 -14.6 H3" stroke="${k}" stroke-width=".6"/>
    <path d="M0 -17.4 Q4 -21 6.6 -18.6" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>${shield(-5.4, -6, .52, c)}<path d="M5 -1 V-16" stroke="#e9ecf6" stroke-width=".6"/>` },
  witch: { kind: 'character', label: '魔女', draw: (k, c = '#d9a6ff') => `${body(k)}${head(k)}<path d="M-5.6 -15 L0 -26 L5.6 -15Z" fill="${k}" ${LINE}/>
    <path d="M4 -7 L10 -15" stroke="#8a6a4a" stroke-width=".7"/><circle cx="10" cy="-15" r="1.2" fill="${c}" filter="url(#glow)"/>` },
  /* —— beasts —— */
  dragon: { kind: 'beast', label: '龍', draw: (k, c = G) => `<path d="M-14 0 Q-12 -10 -4 -8 Q4 -6 4 -14 Q4 -20 10 -20" fill="none" stroke="${k}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M-14 0 Q-12 -10 -4 -8 Q4 -6 4 -14 Q4 -20 10 -20" fill="none" stroke="${c}" stroke-width=".6" stroke-dasharray="1 1.2"/>
    <path d="M8 -22 Q14 -24 16 -20 L12.6 -19 L15.4 -17 Q11 -15.6 8 -18Z" fill="${k}" ${LINE}/><path d="M9 -22 L7 -26 M11 -22.6 L10.6 -26.4" stroke="${c}" stroke-width=".6"/><circle cx="12" cy="-20.4" r=".6" fill="${R}"/>` },
  fox: { kind: 'beast', label: '狐', draw: (k, c = '#e9a65a') => `<path d="M-2 0 Q-12 -2 -10 -10 Q-7 -4 -1 -4" fill="${W}" ${LINE}/><path d="M-4 0 Q-5 -9 0 -10 Q5 -9 4 0Z" fill="${c}" ${LINE}/>
    <path d="M-3 -9 L-3.6 -15 L-.6 -11.6 L.6 -11.6 L3.6 -15 L3 -9 Q0 -6.6 -3 -9Z" fill="${c}" ${LINE}/><path d="M-1.6 -10.6 h.8 M.8 -10.6 h.8" stroke="${k}" stroke-width=".5"/>` },
  cat: { kind: 'beast', label: '貓', draw: (k, c = R) => `<ellipse cx="0" cy="-4.6" rx="5" ry="4.6" fill="${W}" ${LINE}/><circle cy="-11.6" r="4.2" fill="${W}" ${LINE}/>
    <path d="M-3.6 -14 L-3 -17.6 L-1 -15.4Z M3.6 -14 L3 -17.6 L1 -15.4Z" fill="${W}" ${LINE}/><path d="M-4 -8.4 H4" stroke="${c}" stroke-width="1"/><circle cy="-7.4" r=".9" fill="${G}"/>
    <path d="M4.4 -6 Q7.6 -8 6.6 -13" fill="none" stroke="${W}" stroke-width="1.6" stroke-linecap="round"/><path d="M-2 -11.6 Q-1.4 -12.4 -.8 -11.6 M.8 -11.6 Q1.4 -12.4 2 -11.6" fill="none" stroke="${k}" stroke-width=".4"/>` },
  turtle: { kind: 'beast', label: '龜', draw: (k, c = '#4a7a4a') => `<path d="M-10 0 Q-10 -9 0 -9 Q10 -9 10 0Z" fill="${c}" ${LINE}/><path d="M-6 -6 L0 -8 L6 -6 M-8 -2 H8 M0 -8 V0" fill="none" stroke="${G}" stroke-width=".35"/>
    <circle cx="11.6" cy="-3" r="2.4" fill="${c}" ${LINE}/>` },
  bird: { kind: 'beast', label: '鳥', draw: (k, c = '#fff') => `<path d="M-12 -6 Q-5 -13 0 -7 Q5 -13 12 -6 Q5 -8 0 -3 Q-5 -8 -12 -6Z" fill="${c}" stroke="${k}" stroke-width=".35"/><circle cy="-6.6" r="1.4" fill="${c}" stroke="${k}" stroke-width=".3"/><path d="M1.2 -6.8 L3 -6.2 L1.2 -5.8Z" fill="${G}"/>` },
  oni: { kind: 'beast', label: '鬼', draw: (k, c = '#8a1a1a') => `${body(k)}<circle cy="-14" r="4.4" fill="${c}" ${LINE}/><path d="M-2.6 -17.6 L-3.6 -21.6 L-1 -18.4Z M2.6 -17.6 L3.6 -21.6 L1 -18.4Z" fill="${W}"/>
    <path d="M-2.4 -14.6 L-.8 -14 M2.4 -14.6 L.8 -14" stroke="${GH}" stroke-width=".7"/><path d="M-2 -11.6 L-1 -12.2 L0 -11.6 L1 -12.2 L2 -11.6" fill="none" stroke="${W}" stroke-width=".45"/>` },
  ghost: { kind: 'beast', label: '幽靈', draw: (k, c = '#e9ecf6') => `<path d="M-6 0 Q-7 -16 0 -18 Q7 -16 6 0 L4 -3 L2 0 L0 -3 L-2 0 L-4 -3Z" fill="${c}" opacity=".85"/><circle cx="-2.2" cy="-11" r="1" fill="${k}"/><circle cx="2.2" cy="-11" r="1" fill="${k}"/>` },
  whale: { kind: 'beast', label: '鯨', draw: (k, c = G) => `<path d="M-22 -4 Q-14 -16 4 -14 Q18 -12 20 -6 Q22 0 14 1 Q-2 4 -16 1 Q-24 -1 -22 -4Z" fill="${k}" ${LINE}/>
    <path d="M20 -6 L27 -13 L25 -4 L28 2 L18 0Z" fill="${k}" ${LINE}/><circle cx="-14" cy="-6" r=".9" fill="${GH}"/><path d="M-6 -16 Q-6 -21 -4 -23 M-6 -16 Q-8 -21 -10 -22" fill="none" stroke="${BL}" stroke-width=".6"/>` },
  bull: { kind: 'beast', label: '牛', draw: (k, c = W) => `<path d="M-12 0 V-8 Q-12 -13 -4 -13 H6 Q10 -13 10 -9 V0 M-9 0 V-4 M7 0 V-4" fill="${k}" ${LINE}/><circle cx="10" cy="-12" r="4" fill="${k}" ${LINE}/>
    <path d="M7 -15 Q4 -20 2 -19 M13 -15 Q16 -20 18 -19" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>` },
  /* —— buildings —— */
  castle: { kind: 'building', label: '城', draw: (k, c = W) => `<path d="M-16 0 H16 L13 -6 H-13Z" fill="${k}" ${LINE}/><rect x="-10" y="-14" width="20" height="8" fill="${c}" ${LINE}/>
    <path d="M-13 -14 L0 -20 L13 -14Z" fill="${k}" ${LINE}/><rect x="-5" y="-25" width="10" height="5" fill="${c}" ${LINE}/><path d="M-7.6 -25 L0 -30 L7.6 -25Z" fill="${k}" ${LINE}/>
    ${[-6, 0, 6].map(x => `<rect x="${x - 1}" y="-12" width="2" height="2.4" fill="${k}"/>`).join('')}` },
  torii: { kind: 'building', label: '鳥居', draw: (k, c = R) => `<path d="M-10 0 V-18 M10 0 V-18" stroke="${c}" stroke-width="1.8"/><path d="M-14 -19 Q0 -22 14 -19 L13 -17 H-13Z" fill="${c}" ${LINE}/><path d="M-11 -14 H11" stroke="${c}" stroke-width="1.2"/>` },
  storehouse: { kind: 'building', label: '倉', draw: (k, c = W) => `<rect x="-11" y="-14" width="22" height="14" fill="${c}" ${LINE}/><path d="M-13 -14 L0 -21 L13 -14Z" fill="${k}" ${LINE}/>
    <rect x="-4" y="-9" width="8" height="9" fill="#3a2410" stroke="${k}" stroke-width=".3"/><rect x="-1.6" y="-6" width="3.2" height="2.6" fill="${G}"/>` },
  house: { kind: 'building', label: '屋', draw: (k, c = W) => `<rect x="-8" y="-10" width="16" height="10" fill="${c}" ${LINE}/><path d="M-10 -10 L0 -17 L10 -10Z" fill="${k}" ${LINE}/><rect x="-2" y="-6" width="4" height="6" fill="#3a2410"/>` },
  stall: { kind: 'building', label: '攤位', draw: (k, c = R) => `<rect x="-14" y="-10" width="28" height="10" fill="#3a2a1a" ${LINE}/><path d="M-16 -10 Q0 -16 16 -10 V-13 Q0 -19 -16 -13Z" fill="${c}" ${LINE}/>
    <path d="M-14 -13 V-10 M14 -13 V-10" stroke="${G}" stroke-width=".5"/>` },
  tower: { kind: 'building', label: '塔', draw: (k, c = W) => `<rect x="-5" y="-26" width="10" height="26" fill="#6a5a3a" ${LINE}/><path d="M-6 -26 L0 -33 L6 -26Z" fill="${k}" ${LINE}/>
    <circle cy="-20" r="3.4" fill="${c}" ${LINE}/><path d="M0 -20 V-22.4 M0 -20 L1.8 -19.4" stroke="#3a2a05" stroke-width=".45"/>` },
  /* —— props (centred on x, y) —— */
  scale: { kind: 'prop', label: '天秤', draw: (k, c = G) => `<path d="M0 -12 V10" stroke="${c}" stroke-width="1"/><path d="M-5 13 H5 L3 10 H-3Z" fill="${c}"/><path d="M-14 -9 H14" stroke="${c}" stroke-width=".8"/>
    <path d="M-14 -9 L-18 -1 M-14 -9 L-10 -1 M14 -9 L10 -1 M14 -9 L18 -1" stroke="${c}" stroke-width=".35"/><path d="M-19 -1 Q-14 3 -9 -1Z M9 -1 Q14 3 19 -1Z" fill="${c}"/>` },
  candles: { kind: 'prop', label: 'K 線', draw: () => [[-12, 6, 2, 0, 9], [-6, 3, -3, -5, 5], [0, -1, -6, -9, 1], [6, -4, -1, -7, 1], [12, -2, -9, -12, 0]].map(a => candle(...a, 4)).join('') },
  coin: { kind: 'prop', label: '錢幣', draw: () => `<circle r="7" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".5"/><rect x="-1.8" y="-1.8" width="3.6" height="3.6" fill="none" stroke="#6b470f" stroke-width=".6"/>` },
  coins: { kind: 'prop', label: '金幣堆', draw: () => `${stack(-6, 6, 4, 3.4)}${stack(1, 6, 7, 3.4)}${stack(8, 6, 3, 3.4)}` },
  currency: { kind: 'prop', label: '貨幣', draw: (k, c = G, t = '$') => cur(0, 0, 7, t, c) },
  scroll: { kind: 'prop', label: '卷軸', draw: (k, c = W, t = '') => `<rect x="-11" y="-8" width="22" height="16" fill="${c}" stroke="#a87a3a" stroke-width=".5"/><path d="M-12 -9 V9 M12 -9 V9" stroke="#8a5a2a" stroke-width="2" stroke-linecap="round"/>
    ${t ? txt(0, 1.6, t, 4, '#3a2a05') : [-4, -1, 2, 5].map(y => `<path d="M-8 ${y} H8" stroke="#c9b98f" stroke-width=".5"/>`).join('')}` },
  shield: { kind: 'prop', label: '盾', draw: (k, c = '#2a5a7a', t = '') => `${shield(0, 0, 1, c)}${t ? txt(0, 1.6, t, 4.4, GH) : ''}` },
  sword: { kind: 'prop', label: '刀', draw: () => `<path d="M-12 8 L10 -10" stroke="#e9ecf6" stroke-width="1.2" stroke-linecap="round"/><path d="M-12 8 L-8.4 5" stroke="#6a4a1a" stroke-width="2.2" stroke-linecap="round"/><path d="M-9.4 3.6 L-7 6.4" stroke="${G}" stroke-width="1"/>` },
  flag: { kind: 'prop', label: '旗', draw: (k, c = R, t = '') => `<path d="M-4 10 V-12" stroke="${G}" stroke-width=".7"/><path d="M-4 -12 H10 V-2 H-4Z" fill="${c}" ${LINE}/>${t ? txt(3, -5.4, t, 4, '#fff') : ''}` },
  lantern: { kind: 'prop', label: '燈籠', draw: (k, c = R) => `<ellipse rx="6" ry="7.6" fill="${c}" stroke="${G}" stroke-width=".5" filter="url(#glow)"/><path d="M-6 0 H6 M-5 -4 H5 M-5 4 H5" stroke="#ffb08a" stroke-width=".4"/><rect x="-3" y="-9" width="6" height="1.6" fill="${k}"/><rect x="-3" y="7.6" width="6" height="1.6" fill="${k}"/>` },
  block: { kind: 'prop', label: '區塊', draw: () => `${blk(-7, 2, 1.4)}${blk(7, 2, 1.4, '#7f3fdc')}<path d="M-1 1 H1" stroke="${GH}" stroke-width="1.2"/>` },
  chartUp: { kind: 'prop', label: '上漲線', draw: (k, c = UP) => poly([[-16, 8], [-8, 2], [-2, 5], [6, -3], [16, -10]], c, 1.4) },
  chartDown: { kind: 'prop', label: '下跌線', draw: (k, c = DN) => poly([[-16, -10], [-8, -3], [-2, -6], [6, 3], [16, 9]], c, 1.4) },
  bars: { kind: 'prop', label: '長條', draw: (k, c = BL) => [6, 9, 7, 12, 15, 11, 18].map((h, i) => `<rect x="${-14 + i * 4}" y="${10 - h}" width="3" height="${h}" fill="${c}" opacity=".8"/>`).join('') },
  pie: { kind: 'prop', label: '圓餅', draw: () => `<circle r="10" fill="#d8553a" ${LINE}/><path d="M0 0 L0 -10 A10 10 0 0 1 8.66 5Z" fill="#3f7fe0"/><path d="M0 0 L8.66 5 A10 10 0 0 1 -3.4 9.4Z" fill="#2f9e74"/>` },
  book: { kind: 'prop', label: '帳本', draw: (k, c = W) => `<path d="M-14 -8 Q-7 -10 0 -7 Q7 -10 14 -8 V8 Q7 6 0 9 Q-7 6 -14 8Z" fill="${c}" ${LINE}/><path d="M0 -7 V9" stroke="#b9a36a" stroke-width=".5"/>
    ${[-4, -1, 2, 5].map(y => `<path d="M-11 ${y} H-3 M3 ${y} H11" stroke="#c9b98f" stroke-width=".45"/>`).join('')}` },
  clock: { kind: 'prop', label: '時鐘', draw: (k, c = W) => `<circle r="9" fill="${c}" stroke="${G}" stroke-width=".8"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${f1(7.4 * Math.cos(a))} ${f1(7.4 * Math.sin(a))} L${f1(8.4 * Math.cos(a))} ${f1(8.4 * Math.sin(a))}" stroke="#3a2a05" stroke-width=".4"/>`; }).join('')}<path d="M0 0 V-6 M0 0 L4 2" stroke="#3a2a05" stroke-width=".7"/>` },
  umbrella: { kind: 'prop', label: '傘', draw: (k, c = R) => `<path d="M-14 0 Q0 -16 14 0 Q10.4 -2.4 7 0 Q3.4 -2.4 0 0 Q-3.4 -2.4 -7 0 Q-10.4 -2.4 -14 0Z" fill="${c}" ${LINE}/><path d="M0 -12 V0 V10 Q0 12 -2 12" fill="none" stroke="${G}" stroke-width=".7"/>` },
  key: { kind: 'prop', label: '鑰匙', draw: (k, c = G) => `<circle cx="-6" r="4" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M-2 0 H10 M6 0 V3 M9 0 V3" stroke="${c}" stroke-width="1.4"/>` },
  lock: { kind: 'prop', label: '鎖', draw: (k, c = G) => `<rect x="-5" y="-2" width="10" height="8" rx="1" fill="${c}" stroke="${k}" stroke-width=".4"/><path d="M-3.4 -2 V-5 Q0 -9 3.4 -5 V-2" fill="none" stroke="${c}" stroke-width="1.3"/>` },
  basket: { kind: 'prop', label: '籃子', draw: () => `<path d="M-12 -2 H12 L9 10 H-9Z" fill="#8a6a2a" ${LINE}/><path d="M-12 -2 Q0 -12 12 -2" fill="none" stroke="#a87a3a" stroke-width="1.1"/>
    ${[[-7, -5, '#3f7fe0'], [-2, -7, R], [3, -6, GR], [8, -4, G]].map(([x, y, c]) => `<rect x="${x - 2.4}" y="${y - 2.4}" width="4.8" height="4.8" rx=".6" fill="${c}" stroke="#000" stroke-width=".2"/>`).join('')}` },
  envelope: { kind: 'prop', label: '信封', draw: (k, c = W) => `<rect x="-8" y="-5.4" width="16" height="11" rx="1" fill="${c}" stroke="${R}" stroke-width=".7"/><path d="M-8 -5.4 L0 1 L8 -5.4" fill="none" stroke="${R}" stroke-width=".6"/>` },
  payoff: { kind: 'prop', label: '損益圖', draw: (k, c = GH) => `<path d="M-16 4 H16 M0 -12 V12" stroke="#b9a6e0" stroke-width=".4"/>${poly([[-16, 6], [0, 6], [16, -10]], c, 1.4)}` },
  crowd: { kind: 'prop', label: '人群', draw: k => Array.from({ length: 7 }, (_, i) => `<g transform="translate(${-15 + i * 5} ${8 + (i % 2) * 2}) scale(.42)">${body(k)}${head(k)}</g>`).join('') },
};
export const PART_NAMES = Object.keys(PARTS);
const drawPart = (name, o, k) => { const p = PARTS[name]; if (!p) throw new Error(`unknown part: ${name}`); return place(o, p.draw(k, o.c, o.t)); };

/* skies the recipe can ask for (on top of the attribute's gradient) */
const SKY = {
  plain: () => '',
  sun: () => `<circle cx="80" cy="14" r="7" fill="url(#sun-gold)"/>`,
  moon: () => `<circle cx="80" cy="13" r="6" fill="#fff6d8" opacity=".9" filter="url(#glow)"/>`,
  night: () => `<g fill="#fff">${[[8, 8], [24, 14], [44, 6], [66, 12], [90, 7]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join('')}</g>`,
  rain: () => `${cloud(24, 9, 1.2, '#00000055')}${cloud(76, 8, 1.1, '#00000055')}<g stroke="${BL}" stroke-width=".5" opacity=".6">${Array.from({ length: 14 }, (_, i) => `<path d="M${4 + i * 7} ${15 + (i % 3) * 3} l-2 5.4"/>`).join('')}</g>`,
};

/* a recipe → the card picture.
   recipe = { sky?, subject: { part, x, y, s, flip, c }, props: [{ part, x, y, s, c, t }], caption?, rays? }
   (x, y) default to a subject on the left and props on the right, so { subject: { part: 'samurai' }, props: [{ part: 'candles' }] } is enough. */
export function compose(cat, recipe) {
  const k = INK[cat] || '#000', r = recipe || {};
  const subj = r.subject ? { x: 30, y: 62, s: 1.7, ...r.subject } : null;
  const props = (r.props || []).map((p, i) => ({ x: 68 + i * 4, y: 34 + i * 14, s: 1, ...p }));
  return svg(cat, `${(SKY[r.sky] || SKY.plain)()}${ground(k)}${props.map(p => drawPart(p.part, p, k)).join('')}${subj ? drawPart(subj.part, subj, k) : ''}${r.caption ? txt(r.captionX || 68, r.captionY || 60, r.caption, 3.4, GH) : ''}`,
    r.rays ? [r.subject ? subj.x : 50, 24] : null);
}

/* the parts a card gets when nobody has written a recipe: the subject from its race (or name), the 代表物 from its attribute */
const SUBJECT_BY_WORD = [
  [/忍/, 'ninja'], [/巫女|天女/, 'miko'], [/魔女/, 'witch'], [/僧/, 'monk'], [/騎士|衛兵|守衛|守門|守夜/, 'knight'],
  [/將軍|武將|大將|將|奉行|主宰|城主|帝|王/, 'general'], [/賢者|長老|聖者|預言|神諭|占卜|術師|學士|軍師|書記|書吏|鑑定/, 'sage'],
  [/商|掌櫃|船伕|使者|傳令|旅人|領航/, 'merchant'], [/童子|學徒/, 'child'], [/武士|浪人|武者|戰士|劍|足輕|兵/, 'samurai'],
  [/龍/, 'dragon'], [/狐|九尾/, 'fox'], [/貓/, 'cat'], [/龜/, 'turtle'], [/鳥|鶴|鴉|燕|鷹|鳳|鷲|雁/, 'bird'], [/鬼/, 'oni'],
  [/亡靈|幽|靈/, 'ghost'], [/鯨|海妖|巨艦/, 'whale'], [/牛|獸/, 'bull'], [/城/, 'castle'], [/倉/, 'storehouse'],
];
export const PROP_BY_CAT = { tech: 'candles', fund: 'scale', money: 'coins', etf: 'basket', fx: 'currency', chips: 'crowd', risk: 'shield', deriv: 'payoff', crypto: 'block' };
export function autoRecipe(m) {
  const words = `${m.race || ''}${m.name || ''}`;
  const hit = SUBJECT_BY_WORD.find(([re]) => re.test(words));
  const subject = hit ? hit[1] : 'samurai';
  const kind = PARTS[subject].kind, h = [...(m.id || '')].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return { sky: m.rank >= 3 ? 'sun' : ['plain', 'moon', 'night'][h % 3], rays: m.rank >= 3,
    subject: { part: subject, x: 30, y: kind === 'beast' && subject === 'bird' ? 30 : 62, s: kind === 'building' ? 1.5 : 1.7, flip: !!(h & 1) && kind !== 'building' },
    props: [{ part: PROP_BY_CAT[m.cat] || 'coin', x: 70, y: 36, s: 1.3, t: m.cat === 'fx' ? '$' : '' }] };
}
