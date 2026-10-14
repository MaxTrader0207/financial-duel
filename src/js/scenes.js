// scenes.js — two more ukiyo-e backdrops per category (the first set lives in cards.js as SCENE).
// Cards use scene (m.v % 3): 0 = SCENE, 1 = SCENE_B, 2 = SCENE_C; the hue shift and mirror per card still apply.
// Every scene is drawn in the 100 × 70 box; the bottom 10 units get the shared seigaiha sea strip.
const wrap = inner => `<svg class="scene" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}<rect y="60" width="100" height="10" fill="#060a20"/><rect y="60" width="100" height="10" fill="url(#seigaiha)"/></svg>`;
const clouds = (x, y) => `<g fill="#ffffff" opacity=".2"><rect x="${x}" y="${y}" width="26" height="2.6" rx="1.3"/><rect x="${x + 6}" y="${y - 3.6}" width="15" height="2.6" rx="1.3"/><rect x="${x + 12}" y="${y + 3.6}" width="18" height="2.6" rx="1.3"/></g>`;
const stars = pts => `<g fill="#ffffff">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r || 0.5}"/>`).join('')}</g>`;

export const SCENE_B = {
  /* lighthouse over a wave-shaped price line */
  tech: wrap(`<rect width="100" height="60" fill="url(#sky-tech)"/><circle cx="22" cy="15" r="8" fill="#f6e2a0" filter="url(#glow)"/>${clouds(30, 12)}
    <path d="M78 22 L20 6 L20 18Z M78 22 L30 34 L22 28Z" fill="#fff6c8" opacity=".18"/>
    <path d="M70 60 L72 50 H86 L88 60Z" fill="#06173f"/>
    <path d="M75 50 L76.6 26 H79.4 L81 50Z" fill="#eef2ff" stroke="#06173f" stroke-width=".4"/>
    <path d="M75.6 42 H80.4 L80.7 46 H75.3Z M76.1 33 H79.9 L80.1 37 H75.9Z" fill="#e14b32"/>
    <rect x="75.6" y="21" width="4.8" height="5" fill="#06173f"/><circle cx="78" cy="23.4" r="1.8" fill="#fff2b0" filter="url(#glow)"/><path d="M74.8 21 L78 17.5 L81.2 21Z" fill="#e14b32"/>
    <path d="M0 54 Q8 47 16 51 T32 45 T48 49 T64 41 T74 44" fill="none" stroke="#fff2b0" stroke-width="1.5" filter="url(#glow)"/>
    <path d="M0 58 Q12 54 24 57 T48 55 T72 57 T100 55" fill="none" stroke="#7cbcff" stroke-width=".8" opacity=".7"/>`),
  /* terraced rice fields at harvest */
  fund: wrap(`<rect width="100" height="60" fill="url(#sky-fund)"/><circle cx="76" cy="14" r="9" fill="url(#sun-gold)"/>${clouds(8, 10)}
    <path d="M0 30 Q50 22 100 30 V60 H0Z" fill="#2f6b2a"/><path d="M0 36 Q50 28 100 36" fill="none" stroke="#e8c46a" stroke-width=".7"/>
    <path d="M0 38 Q50 31 100 38 V60 H0Z" fill="#c9a43a"/><path d="M0 44 Q50 37 100 44" fill="none" stroke="#fff1c2" stroke-width=".6"/>
    <path d="M0 46 Q50 40 100 46 V60 H0Z" fill="#3f8a3a"/><path d="M0 53 Q50 47 100 53 V60 H0Z" fill="#d8b44a"/>
    <g fill="#8a5a12" stroke="#3a2508" stroke-width=".3">${[12, 22, 32, 66, 76, 86].map(x => `<path d="M${x} 52 L${x + 1.6} 46 L${x + 3.2} 52Z"/>`).join('')}</g>
    <g stroke="#2a1a05" stroke-width=".5"><path d="M40 33 H58 V27 H40Z" fill="#f4ead2"/><path d="M37 27.5 L49 21 L61 27.5Z" fill="#3a2508"/><rect x="47" y="29" width="4" height="4" fill="#3a2508"/></g>`),
  /* two blades crossing in front of a red sun: the two legs of a spread */
  deriv: wrap(`<rect width="100" height="60" fill="url(#sky-deriv)"/>${stars([[8, 8], [18, 20], [30, 6, .7], [88, 10], [92, 26], [70, 6]])}
    <circle cx="50" cy="28" r="17" fill="url(#sun-shu)"/>
    <path d="M0 52 L20 44 L40 50 L60 42 L80 50 L100 44 V60 H0Z" fill="#0b0420"/>
    <g stroke="#2a0a3a" stroke-width=".4"><path d="M16 50 L80 12 L82 13.6 L18.6 51.6Z" fill="#e9ecf6"/><path d="M84 50 L20 12 L18 13.6 L81.4 51.6Z" fill="#cfd5ea"/></g>
    <g fill="#3a1878" stroke="#f3dc95" stroke-width=".5"><rect x="11" y="49" width="8" height="3" transform="rotate(-30 15 50.5)"/><rect x="81" y="49" width="8" height="3" transform="rotate(30 85 50.5)"/></g>
    <circle cx="50" cy="31" r="2" fill="#fff2b0" filter="url(#glow)"/>`),
  /* castle wall, gate and crest */
  risk: wrap(`<rect width="100" height="60" fill="url(#sky-risk)"/><circle cx="76" cy="16" r="10" fill="url(#sun-gold)"/>${clouds(6, 14)}
    <path d="M0 34 H100 V60 H0Z" fill="#5a2a18"/>
    <g stroke="#2a0805" stroke-width=".35" fill="none">${[38, 44, 50, 56].map(y => `<path d="M0 ${y} H100"/>`).join('')}${[0, 1, 2, 3].map(r => [...Array(9)].map((_, i) => `<path d="M${i * 12 + (r % 2) * 6} ${34 + r * 6} V${40 + r * 6}"/>`).join('')).join('')}</g>
    <path d="M0 34 H100 V31 H0Z" fill="#2a0805"/>${[...Array(10)].map((_, i) => `<rect x="${i * 10 + 2}" y="28" width="6" height="3" fill="#2a0805"/>`).join('')}
    <path d="M42 60 V46 Q50 38 58 46 V60Z" fill="#1a0503"/>
    <path d="M50 14 L60 18 V26 C60 31 55 34 50 36 C45 34 40 31 40 26 V18Z" fill="#b8291a" stroke="#f3dc95" stroke-width=".8"/>
    <path d="M45 25 L50 20 L55 25 L50 30Z" fill="#f3dc95"/>`),
  /* market street with nobori banners */
  chips: wrap(`<rect width="100" height="60" fill="url(#sky-chips)"/><circle cx="18" cy="14" r="9" fill="url(#sun-gold)"/>${clouds(56, 10)}
    <path d="M0 40 H100 V60 H0Z" fill="#3a2508"/>
    ${[[4, '#e14b32'], [36, '#3f7fe0'], [68, '#2f9e74']].map(([x, c]) => `<g stroke="#241604" stroke-width=".4"><rect x="${x}" y="38" width="28" height="14" fill="#f4ead2"/><path d="M${x - 2} 38 H${x + 30} L${x + 28} 32 H${x}Z" fill="${c}"/><path d="M${x + 4} 32 V38 M${x + 10} 32 V38 M${x + 16} 32 V38 M${x + 22} 32 V38" stroke="#fff4dc" stroke-width=".8"/><rect x="${x + 4}" y="44" width="20" height="5" fill="#c3902e"/></g>`).join('')}
    ${[[33, '#e14b32'], [65, '#f3dc95'], [97, '#8d5ee0']].map(([x, c]) => `<g><path d="M${x} 20 V54" stroke="#241604" stroke-width=".8"/><rect x="${x - 4}" y="21" width="4" height="15" fill="${c}"/></g>`).join('')}
    <g fill="#241604">${[14, 20, 48, 54, 80, 86].map(x => `<circle cx="${x}" cy="55" r="1.6"/><rect x="${x - 1.5}" y="56" width="3" height="4"/>`).join('')}</g>`),
  /* red arched bridge between two shores */
  fx: wrap(`<rect width="100" height="60" fill="url(#sky-fx)"/><circle cx="80" cy="14" r="8" fill="url(#sun-gold)"/>${clouds(6, 12)}
    <path d="M0 44 L18 40 L24 46 V60 H0Z M100 44 L82 40 L76 46 V60 H100Z" fill="#021a20"/>
    <path d="M14 46 Q50 18 86 46" fill="none" stroke="#b8291a" stroke-width="3"/>
    <path d="M14 42 Q50 14 86 42" fill="none" stroke="#e14b32" stroke-width="1.4"/>
    <g stroke="#b8291a" stroke-width="1">${[24, 34, 44, 56, 66, 76].map(x => { const y = 46 - 28 * (1 - ((x - 50) / 36) ** 2); return `<path d="M${x} ${y - 4} V${y + 1}"/>`; }).join('')}</g>
    <g fill="#f3dc95">${[30, 70].map(x => `<circle cx="${x}" cy="${46 - 28 * (1 - ((x - 50) / 36) ** 2) - 6}" r="1.4"/>`).join('')}</g>
    <path d="M24 56 Q50 34 76 56" fill="none" stroke="#7fe3d8" stroke-width=".6" opacity=".6"/>
    <g fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"><ellipse cx="12" cy="52" rx="4" ry="1.3"/><ellipse cx="12" cy="50.6" rx="4" ry="1.3"/><ellipse cx="88" cy="52" rx="4" ry="1.3"/></g>`),
  /* city of blocks linked by a chain */
  crypto: wrap(`<rect width="100" height="60" fill="url(#sky-crypto)"/>${stars([[10, 6], [26, 12], [44, 5, .7], [62, 10], [84, 6], [94, 16]])}
    <g fill="#14031a">${[[0, 36, 12], [12, 30, 10], [22, 40, 12], [34, 26, 9], [43, 34, 14], [57, 22, 10], [67, 32, 12], [79, 28, 9], [88, 38, 12]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${60 - y}"/>`).join('')}</g>
    <g fill="#ffd2e6" opacity=".75">${[[3, 40], [7, 46], [15, 34], [25, 44], [37, 30], [47, 38], [52, 46], [60, 26], [70, 36], [74, 44], [82, 32], [92, 42]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="1.6"/>`).join('')}</g>
    <g fill="none" stroke="#f6e2a0" stroke-width="1.6" filter="url(#glow)">${[[18, 18], [32, 15], [46, 12], [60, 9], [74, 6]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${i % 2 ? 5 : 6}" ry="${i % 2 ? 2.4 : 3}" transform="rotate(-12 ${x} ${y})"/>`).join('')}</g>`),
  /* skyline of index constituents as bars */
  etf: wrap(`<rect width="100" height="60" fill="url(#sky-etf)"/><circle cx="20" cy="15" r="9" fill="url(#sun-gold)"/>${clouds(54, 10)}
    <g stroke="#0b1603" stroke-width=".4">${[[6, 30, '#3f7fe0'], [14, 22, '#2f9e74'], [22, 34, '#f3dc95'], [30, 16, '#d8553a'], [38, 26, '#8d5ee0'], [46, 12, '#c3902e'], [54, 20, '#1f9fb3'], [62, 28, '#d9467f'], [70, 18, '#6e9a2a'], [78, 32, '#3f7fe0'], [86, 24, '#2f9e74']].map(([x, y, c]) => `<rect x="${x}" y="${y + 6}" width="7" height="${54 - y}" fill="${c}"/>`).join('')}</g>
    <path d="M0 60 V58 H100 V60Z" fill="#0b1603"/>
    <path d="M4 38 L18 30 L28 34 L44 20 L58 24 L72 14 L96 8" fill="none" stroke="#fff2b0" stroke-width="1.3" filter="url(#glow)"/>`),
  /* six money jars on a shelf, filled to different levels, under a rising moon */
  money: wrap(`<rect width="100" height="60" fill="url(#sky-money)"/>${stars([[8, 8], [26, 12, .4], [44, 6], [90, 10]])}
    <circle cx="76" cy="16" r="9" fill="#f6e2a0" filter="url(#glow)"/><circle cx="80" cy="13.5" r="7.6" fill="url(#sky-money)"/>
    <path d="M0 56 H100 V60 H0Z" fill="#2a0c30"/><path d="M4 50 H96" stroke="#c89a5a" stroke-width="1.4"/><path d="M6 50 V56 M94 50 V56" stroke="#c89a5a" stroke-width="1.2"/>
    ${[[11, .35], [26, .8], [41, .55], [56, .95], [71, .45], [86, .7]].map(([x, f], i) => { const top = 34, h = 15, lv = top + h * (1 - f);
      return `<path d="M${x - 5} ${top} Q${x - 6} ${top + h} ${x - 4} ${top + h} H${x + 4} Q${x + 6} ${top + h} ${x + 5} ${top}Z" fill="#f4ead2" opacity=".18" stroke="#f4ead2" stroke-width=".5"/>
        <path d="M${x - 5.3} ${lv} H${x + 5.3} L${x + 4.2} ${top + h} H${x - 4.2}Z" fill="${['#e14b32', '#f3dc95', '#3f7fe0', '#2f9e74', '#d9467f', '#8d5ee0'][i]}" opacity=".85"/>
        <rect x="${x - 5.6}" y="${top - 2}" width="11.2" height="2.2" fill="#c89a5a"/>`; }).join('')}`),
};

export const SCENE_C = {
  /* constellation of price points */
  tech: wrap(`<rect width="100" height="60" fill="url(#sky-tech)"/>${stars([[6, 8], [14, 22], [40, 6], [52, 18, .4], [90, 30], [96, 8], [62, 4, .7]])}
    <path d="M78 10 A10 10 0 1 0 88 24 A8 8 0 1 1 78 10Z" fill="#f6e2a0" filter="url(#glow)"/>
    <path d="M0 50 L14 42 L26 48 L40 36 L54 44 L70 34 L84 42 L100 36 V60 H0Z" fill="#06173f"/>
    <path d="M8 44 L20 36 L30 40 L44 26 L56 30 L68 18 L80 22" fill="none" stroke="#fff2b0" stroke-width=".9" stroke-dasharray="2 1.2"/>
    <g fill="#fff2b0" filter="url(#glow)">${[[8, 44], [20, 36], [30, 40], [44, 26], [56, 30], [68, 18], [80, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>`),
  /* row of white-walled storehouses under lanterns */
  fund: wrap(`<rect width="100" height="60" fill="url(#sky-fund)"/><circle cx="50" cy="12" r="8" fill="#f6e2a0" filter="url(#glow)"/>
    <path d="M0 50 H100 V60 H0Z" fill="#03201a"/>
    ${[4, 36, 68].map(x => `<g stroke="#06231b" stroke-width=".5"><rect x="${x}" y="30" width="28" height="22" fill="#f4ead2"/><path d="M${x - 2} 31 L${x + 14} 22 L${x + 30} 31Z" fill="#1c2b26"/><rect x="${x}" y="44" width="28" height="8" fill="#2b3a35"/><path d="M${x} 46 H${x + 28} M${x} 49 H${x + 28} M${x + 7} 44 V52 M${x + 14} 44 V52 M${x + 21} 44 V52" stroke="#f4ead2" stroke-width=".4"/><rect x="${x + 11}" y="34" width="6" height="6" fill="#1c2b26"/></g>`).join('')}
    <path d="M0 18 Q50 26 100 18" fill="none" stroke="#3a2508" stroke-width=".4"/>
    <g fill="#e14b32" stroke="#3a2508" stroke-width=".3">${[12, 30, 50, 70, 88].map(x => `<ellipse cx="${x}" cy="${18 + 8 * (1 - ((x - 50) / 50) ** 2) + 2}" rx="2.2" ry="2.8"/>`).join('')}</g>`),
  /* hourglass: time value draining away */
  deriv: wrap(`<rect width="100" height="60" fill="url(#sky-deriv)"/>${stars([[8, 10], [20, 4], [34, 14], [66, 6], [80, 16], [92, 8, .7], [12, 30], [88, 34]])}
    <path d="M0 54 L30 46 L70 46 L100 54 V60 H0Z" fill="#0b0420"/>
    <g stroke="#f3dc95" stroke-width="1.2" fill="none"><path d="M34 8 H66 M34 52 H66"/><path d="M38 8 C38 22 48 26 48 30 C48 34 38 38 38 52 M62 8 C62 22 52 26 52 30 C52 34 62 38 62 52"/></g>
    <path d="M41 14 H59 C58 21 52 25 50 28 C48 25 42 21 41 14Z" fill="url(#gold-v)" opacity=".9"/>
    <path d="M40 51 C42 44 47 42 50 41 C53 42 58 44 60 51Z" fill="url(#gold-v)"/>
    <path d="M50 28 V41" stroke="#fff2b0" stroke-width=".8" filter="url(#glow)"/>`),
  /* misty peaks, a stone lantern and a balance */
  risk: wrap(`<rect width="100" height="60" fill="url(#sky-risk)"/><circle cx="24" cy="18" r="10" fill="url(#sun-gold)" opacity=".9"/>
    <path d="M30 60 L58 18 L86 60Z" fill="#7a2a14" opacity=".55"/><path d="M0 60 L22 30 L44 60Z" fill="#5a1d0e" opacity=".7"/>
    <rect y="40" width="100" height="6" fill="#ffd9b0" opacity=".25"/>
    <g fill="#3a1208" stroke="#1a0503" stroke-width=".4"><rect x="12" y="50" width="8" height="2"/><rect x="14.5" y="42" width="3" height="8"/><rect x="11" y="37" width="10" height="5"/><path d="M9 37 L16 32 L23 37Z"/><rect x="14" y="38.5" width="4" height="2.5" fill="#f3dc95"/></g>
    <g stroke="#f3dc95" stroke-width="1" fill="none"><path d="M66 22 V52 M58 52 H74 M50 26 H82"/><path d="M50 26 L46 36 H54Z M82 26 L78 36 H86Z" fill="#c8943a"/></g>
    <circle cx="66" cy="21" r="1.6" fill="#f3dc95"/>`),
  /* the great wave and a far mountain */
  chips: wrap(`<rect width="100" height="60" fill="url(#sky-chips)"/><circle cx="82" cy="14" r="7" fill="url(#sun-shu)"/>
    <path d="M60 60 L72 40 L84 60Z" fill="#3a2508"/><path d="M68 46.5 L72 40 L76 46.5 L74 45 L72 47 L70 45Z" fill="#fff4dc"/>
    <path d="M0 60 V44 C6 30 20 18 36 18 C48 18 54 26 50 32 C46 26 38 26 34 32 C40 30 44 36 40 42 C46 40 52 46 60 50 C66 54 72 56 80 60Z" fill="#1d3d6b" stroke="#fff4dc" stroke-width=".6"/>
    <g fill="#fff4dc">${[[34, 18], [40, 17], [46, 19], [50, 23], [52, 28], [31, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('')}</g>
    <path d="M6 46 C14 36 24 30 34 32" fill="none" stroke="#fff4dc" stroke-width=".5" opacity=".6"/>
    <path d="M58 56 L72 54 L70 57 H60Z" fill="#c3902e" stroke="#241604" stroke-width=".4"/>`),
  /* compass rose over a globe */
  fx: wrap(`<rect width="100" height="60" fill="url(#sky-fx)"/>${clouds(4, 10)}${clouds(70, 46)}
    <circle cx="50" cy="31" r="20" fill="#05323c" stroke="#9fe0dc" stroke-width=".6"/>
    <g fill="none" stroke="#7fe3d8" stroke-width=".4" opacity=".7"><ellipse cx="50" cy="31" rx="8" ry="20"/><ellipse cx="50" cy="31" rx="15" ry="20"/><path d="M30 31 H70 M33 21 H67 M33 41 H67"/></g>
    <path d="M50 6 L53 28 L76 31 L53 34 L50 56 L47 34 L24 31 L47 28Z" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".4"/>
    <path d="M50 18 L51.5 29.5 L62 31 L51.5 32.5 L50 44 L48.5 32.5 L38 31 L48.5 29.5Z" fill="#e14b32" opacity=".85"/>
    <circle cx="50" cy="31" r="1.6" fill="#fff2b0"/>`),
  /* crystal cave with a miner's pick */
  crypto: wrap(`<rect width="100" height="60" fill="#16041a"/>
    <path d="M0 0 H100 V60 H82 C82 36 70 20 50 20 C30 20 18 36 18 60 H0Z" fill="#3a0f2e"/>
    <path d="M18 60 C18 36 30 20 50 20 C70 20 82 36 82 60" fill="none" stroke="#6a1650" stroke-width="1.2"/>
    <g stroke="#ffe7f2" stroke-width=".4" filter="url(#glow)">${[[30, 60, 6, 18, '#ee7fae'], [40, 60, 5, 26, '#7fe3d8'], [52, 60, 7, 30, '#f6e2a0'], [64, 60, 5, 20, '#ee7fae'], [72, 60, 4, 14, '#7fe3d8']].map(([x, y, w, h, c]) => `<path d="M${x - w} ${y} L${x - w / 2} ${y - h * 0.7} L${x} ${y - h} L${x + w / 2} ${y - h * 0.7} L${x + w} ${y}Z" fill="${c}" opacity=".85"/>`).join('')}</g>
    <g stroke="#2a0620" stroke-width=".4"><path d="M14 58 L30 40 L31.6 41.4 L15.6 59.4Z" fill="#8a5a12"/><path d="M24 36 C28 38 34 44 36 48 L33 46 C31 42 28 40 24 38Z" fill="#cfd5ea"/></g>`),
  /* pie-chart sun over hills */
  etf: wrap(`<rect width="100" height="60" fill="url(#sky-etf)"/>${clouds(6, 40)}
    <g transform="translate(50 26)">${(() => { const parts = [[0.28, '#3f7fe0'], [0.18, '#2f9e74'], [0.16, '#f3dc95'], [0.14, '#d8553a'], [0.12, '#8d5ee0'], [0.12, '#1f9fb3']]; let a = -Math.PI / 2; return parts.map(([f, c]) => { const a2 = a + f * Math.PI * 2, r = 16; const d = `M0 0 L${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)} A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${(r * Math.cos(a2)).toFixed(2)} ${(r * Math.sin(a2)).toFixed(2)}Z`; a = a2; return `<path d="${d}" fill="${c}" stroke="#0d1a05" stroke-width=".5"/>`; }).join(''); })()}<circle r="16" fill="none" stroke="#fff2b0" stroke-width=".8" filter="url(#glow)"/></g>
    <path d="M0 50 Q25 40 50 48 T100 44 V60 H0Z" fill="#2f4d10"/><path d="M0 56 Q30 50 60 55 T100 52 V60 H0Z" fill="#1d3308"/>`),
  /* a reservoir with a level gauge and a water wheel: cash flow in and out */
  money: wrap(`<rect width="100" height="60" fill="url(#sky-money)"/><circle cx="20" cy="16" r="8" fill="url(#sun-gold)"/>${clouds(56, 12)}
    <path d="M0 40 L20 30 L36 38 L52 28 L70 36 L100 26 V60 H0Z" fill="#3a1440" opacity=".7"/>
    <path d="M14 44 H70 V60 H14Z" fill="#2e6fa8" opacity=".85"/><path d="M14 44 Q42 42 70 44" fill="none" stroke="#bfe6ff" stroke-width=".7"/>
    <path d="M10 36 H14 V60 H10Z M70 36 H74 V60 H70Z" fill="#5a3a2a" stroke="#f3dc95" stroke-width=".4"/>
    <g stroke="#f3dc95" stroke-width=".5"><path d="M20 36 V58"/>${[38, 42, 46, 50, 54].map(y => `<path d="M20 ${y} h2.4"/>`).join('')}</g><path d="M18.6 44 h4" stroke="#ff9cc0" stroke-width="1"/>
    <g transform="translate(84 46)"><circle r="9" fill="none" stroke="#c89a5a" stroke-width="1"/>${[0, 45, 90, 135].map(a => `<path d="M-9 0 H9" stroke="#c89a5a" stroke-width=".7" transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#f3dc95"/></g>
    <path d="M74 40 Q78 38 80 37" fill="none" stroke="#9fd8ff" stroke-width="1.6"/>
    ${[[36, 52], [46, 54], [56, 51]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry=".8" fill="url(#gold-v)" opacity=".8"/>`).join('')}`),
};
