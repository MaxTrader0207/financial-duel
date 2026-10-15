// cards.js — drawing cards: the card face (art by rarity, skill text, stats), card backs, and lazily drawn grids.
// The card data itself is carddata.js (re-exported here so screens can import everything card-related from one place).
import { SCENE_B, SCENE_C } from './scenes.js';
import { urArt } from './ur-art.js';
import { ownArt } from './card-art.js';
import { recipeArt } from './card-recipes.js';
import { esc } from './core.js';
import { SKILLS } from './skills.js';
import { CATS, CAT_ALIAS, MON, MONSTERS, RARITY, RARITY_FULL, RARITY_TC } from './carddata.js';

let SCENE, VAR_HUE, backHTML;

function cardHTML(m) {
  const c = CATS[m.cat], rar = RARITY[m.rank];
  return `<div class="card" data-id="${m.id}" data-cat="${m.cat}" data-rar="${rar}" aria-label="${esc(m.name)}，${c.name}，${RARITY_FULL[rar]}，攻擊 ${m.atk}，守備 ${m.def}">
    ${rar === 'UR' ? '<div class="holo"></div>' : ''}
    <div class="c-head"><span class="c-name">${esc(m.name)}</span><span class="c-badge">${c.badge}</span></div>
    <div class="c-rank">${'◆'.repeat(m.rank)}</div>
    ${artHTML(m, rar)}
    <div class="c-type"><span>【${c.jp}／${m.race}】</span><span class="c-rar">${RARITY_TC[rar]}</span></div>
    <div class="c-text"><p><b>【${esc(SKILLS[m.id].name)}】</b>${esc(SKILLS[m.id].text)}</p><div class="c-stats"><span><b>攻</b>${m.atk}</span><span><b>守</b>${m.def}</span></div></div>
  </div>`;
}

/* card art by rarity (a card with its own illustration in card-art.js uses that instead): N / R = one of the three shared scenes (hue-shifted, mirrored per card);
   SR = the scene behind a family-crest medallion with the card's sigil; UR = its own illustration (ur-art.js) */
function artHTML(m, rar) {
  const ur = rar === 'UR' && urArt(m);
  if (ur) return `<div class="c-art c-art-ur">${ur}<span class="c-seal">${esc(m.sigil)}</span></div>`;
  /* hand-made picture (card-art.js); otherwise the parts library draws one from a recipe or from the card's race */
  const own = rar === 'UR' ? recipeArt(m) : ownArt(m) || recipeArt(m);
  if (own) return `<div class="c-art c-art-own${rar === 'SR' ? ' sr' : ''}">${own}<span class="c-seal">${esc(m.sigil)}</span></div>`;
  const scene = [SCENE, SCENE_B, SCENE_C][(m.v || 0) % 3][m.cat];
  const style = `--hue:${VAR_HUE[m.v || 0]}deg;--flip:${(m.v || 0) % 2 ? -1 : 1}`;
  if (rar === 'SR') return `<div class="c-art c-art-sr" style="${style}">${scene}<span class="c-crest" aria-hidden="true"><i>${esc(m.sigil)}</i></span></div>`;
  return `<div class="c-art" style="${style}">${scene}<span class="c-seal">${esc(m.sigil)}</span></div>`;
}

/* long grids (圖鑑, 牌組) draw each card only when it scrolls near the screen: a light placeholder first,
   the full card (SVG scene, foil) from an IntersectionObserver. Without IntersectionObserver everything is drawn. */
function cardSlot(m) { return `<div class="card lazy" data-lazy="${m.id}" data-cat="${m.cat}" data-rar="${RARITY[m.rank]}" aria-label="${esc(m.name)}"></div>`; }
const lazyObs = new WeakMap();
function fillLazy(root) {
  if (!root) return;
  const fill = el => { const m = MON[el.dataset.lazy]; if (m && el.isConnected) el.outerHTML = cardHTML(m); };
  const prev = lazyObs.get(root); if (prev) prev.disconnect();
  const els = root.querySelectorAll('.card.lazy');
  if (typeof IntersectionObserver !== 'function') { els.forEach(fill); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }), { rootMargin: '400px 0px' });
  /* cards already on screen are drawn at once, so re-rendering a grid (deck +/−) never flashes placeholders */
  const vh = innerHeight || 800;
  els.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom > -400 && r.top < vh + 400 && (r.width || r.height)) fill(el); else io.observe(el); });
  lazyObs.set(root, io);
}

export function init() {


/* scene art: ukiyo-e style backdrop per attribute (sky, sun, clouds, silhouette, seigaiha sea) */
SCENE = (() => {
  const wrap = inner => `<svg class="scene" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}<rect y="60" width="100" height="10" fill="#060a20"/><rect y="60" width="100" height="10" fill="url(#seigaiha)"/></svg>`;
  const clouds = (x, y) => `<g fill="#ffffff" opacity=".2"><rect x="${x}" y="${y}" width="26" height="2.6" rx="1.3"/><rect x="${x + 6}" y="${y - 3.6}" width="15" height="2.6" rx="1.3"/><rect x="${x + 12}" y="${y + 3.6}" width="18" height="2.6" rx="1.3"/></g>`;
  const candles = [[14,52,46,44,55],[24,47,50,45,53],[34,50,42,40,52],[44,43,38,35,45],[54,38,41,36,44],[64,41,32,29,43],[74,33,26,23,35],[84,27,20,16,29]]
    .map(([x, o, c, h, l]) => { const up = c < o, top = Math.min(o, c), ht = Math.abs(o - c);
      return `<line x1="${x}" y1="${h}" x2="${x}" y2="${l}" stroke="#fff2c8" stroke-width=".7"/><rect x="${x - 2.4}" y="${top}" width="4.8" height="${ht}" fill="${up ? '#f6e2a0' : '#e14b32'}" stroke="#2a1a05" stroke-width=".35"/>`; }).join('');
  const coins = [[20, 4], [33, 7], [50, 11], [67, 7], [80, 4]].map(([x, n]) =>
    Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${59 - i * 2}" rx="5.6" ry="1.7" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".3"/>`).join('')).join('');
  return {
    tech: wrap(`<rect width="100" height="60" fill="url(#sky-tech)"/><circle cx="76" cy="20" r="12" fill="url(#sun-shu)"/>${clouds(6, 14)}
      <path d="M0 52 L18 40 L30 46 L48 31 L64 44 L82 36 L100 44 V60 H0Z" fill="#06173f" opacity=".9"/>${candles}
      <path d="M6 55 C30 51 52 42 94 17" fill="none" stroke="#fff2b0" stroke-width="1.5" filter="url(#glow)"/>`),
    fund: wrap(`<rect width="100" height="60" fill="url(#sky-fund)"/><circle cx="24" cy="19" r="11" fill="url(#sun-gold)"/>${clouds(60, 12)}
      <path d="M0 52 Q25 40 50 49 T100 45 V60 H0Z" fill="#03201a"/>
      <g fill="#06231b" stroke="#e8c46a" stroke-width=".6" stroke-linejoin="round">
        <path d="M27 60 L33 50 H67 L73 60Z"/><rect x="37" y="42" width="26" height="8"/><path d="M31 43.5 L50 36.5 L69 43.5 L66 44.5 H34Z"/>
        <rect x="41" y="31" width="18" height="6"/><path d="M36.5 32.5 L50 26 L63.5 32.5 L61 33.5 H39Z"/>
        <rect x="44.5" y="21" width="11" height="5.5"/><path d="M41 22.5 L50 15 L59 22.5 L57 23.5 H43Z"/></g>
      <g fill="#f3dc95" opacity=".85"><rect x="41" y="45" width="2" height="2"/><rect x="46" y="45" width="2" height="2"/><rect x="52" y="45" width="2" height="2"/><rect x="57" y="45" width="2" height="2"/><rect x="45" y="33.5" width="2" height="2"/><rect x="53" y="33.5" width="2" height="2"/><rect x="49" y="22.5" width="2" height="2"/></g>`),
    deriv: wrap(`<rect width="100" height="60" fill="url(#sky-deriv)"/><g fill="#ffffff"><circle cx="12" cy="9" r=".6"/><circle cx="30" cy="5" r=".5"/><circle cx="46" cy="12" r=".7"/><circle cx="90" cy="38" r=".5"/><circle cx="58" cy="6" r=".5"/></g>
      <circle cx="74" cy="19" r="11" fill="#f6e2a0" filter="url(#glow)"/><circle cx="78.5" cy="16" r="9.6" fill="url(#sky-deriv)"/>
      <path d="M0 54 L22 44 L38 50 L60 40 L80 48 L100 42 V60 H0Z" fill="#0b0420"/>
      <path d="M0 42 Q12 28 24 42 T48 42 T72 42 T96 42" fill="none" stroke="#c9b0ff" stroke-width="1" opacity=".9"/>
      <path d="M6 52 H46 L90 12" fill="none" stroke="#fff2b0" stroke-width="1.8" filter="url(#glow)"/><path d="M10 12 L54 52 H94" fill="none" stroke="#ff9cc0" stroke-width="1.3" filter="url(#glow)"/>`),
    risk: wrap(`<rect width="100" height="60" fill="url(#sky-risk)"/><circle cx="50" cy="30" r="17" fill="url(#sun-gold)" opacity=".95"/>${clouds(4, 12)}${clouds(68, 20)}
      <rect y="55" width="100" height="5" fill="#2a0805"/>
      <g fill="#b8291a" stroke="#2a0805" stroke-width=".5" stroke-linejoin="round">
        <path d="M33.5 24 H36.2 L37.4 60 H32.6Z"/><path d="M63.8 24 H66.5 L67.4 60 H62.6Z"/>
        <rect x="29" y="28.5" width="42" height="3"/><rect x="48.6" y="23.5" width="2.8" height="5.2"/>
        <path d="M22 19.5 Q50 14 78 19.5 L77 24.5 Q50 20.5 23 24.5Z"/></g>
      <path d="M22 19.5 Q50 14 78 19.5 L77.6 21 Q50 16 22.4 21Z" fill="#1a0503"/>`),
    chips: wrap(`<rect width="100" height="60" fill="url(#sky-chips)"/><circle cx="82" cy="15" r="8" fill="url(#sun-shu)"/>${clouds(8, 16)}
      <path d="M8 60 L41 21 Q50 16 59 21 L92 60Z" fill="#3a2508"/>
      <path d="M41 21 Q50 16 59 21 L64 27.5 L58.5 25.5 L54.5 29.5 L50 25.5 L45.5 29.5 L41.5 25.5 L36 27.5Z" fill="#fff4dc"/>${coins}`),
    fx: wrap(`<rect width="100" height="60" fill="url(#sky-fx)"/><circle cx="22" cy="17" r="9" fill="url(#sun-gold)"/>${clouds(56, 11)}
      <path d="M0 50 Q30 44 60 49 T100 46 V60 H0Z" fill="#021a20"/>
      <g stroke="#e8c46a" stroke-width=".6" stroke-linejoin="round"><path d="M30 52 H74 L68 58 H36Z" fill="#05232a"/>
        <path d="M51 51 V22" stroke="#f3dc95" stroke-width="1"/><path d="M52 24 Q66 34 52 49Z" fill="#f4ead2"/><path d="M50 27 Q39 36 50 48Z" fill="#e7dcc0"/>
        <path d="M58 33 V52" stroke="#f3dc95" stroke-width=".8"/><path d="M59 35 Q67 41 59 49Z" fill="#e14b32" stroke="#5a1408"/></g>
      <g class="unflip" font-family="serif" font-weight="700" font-size="8" text-anchor="middle"><text x="80" y="26" fill="#fff2b0">$</text><text x="88" y="36" fill="#c9f2ee">¥</text><text x="74" y="38" fill="#c9f2ee">€</text></g>
      <path d="M4 40 C24 34 40 44 60 30 S88 20 98 14" fill="none" stroke="#fff2b0" stroke-width="1.2" filter="url(#glow)"/>
      <path d="M4 30 C24 38 44 26 62 38 S88 42 98 36" fill="none" stroke="#7fe3d8" stroke-width=".9" opacity=".8"/>`),
    crypto: wrap(`<rect width="100" height="60" fill="url(#sky-crypto)"/><g fill="#ffffff"><circle cx="10" cy="8" r=".6"/><circle cx="28" cy="14" r=".5"/><circle cx="62" cy="6" r=".6"/><circle cx="92" cy="12" r=".5"/></g>
      <g stroke="#ffd2e6" stroke-width=".5" opacity=".55" fill="none"><path d="M0 46 H18 V40 H34"/><path d="M100 44 H84 V36 H70"/><path d="M8 54 H30 V50"/></g>
      <circle cx="72" cy="22" r="13" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".6"/><circle cx="72" cy="22" r="10" fill="none" stroke="#fff3c4" stroke-width=".7"/>
      <path d="M72 14 L79 18 V26 L72 30 L65 26 V18Z" fill="none" stroke="#6b470f" stroke-width="1.2"/><path d="M72 14 V22 L79 26 M72 22 L65 26" stroke="#6b470f" stroke-width=".8" fill="none"/>
      <g stroke="#2a0620" stroke-width=".5"><rect x="10" y="44" width="10" height="10" fill="#f0a8c8"/><rect x="26" y="38" width="10" height="10" fill="#e46fa0"/><rect x="42" y="31" width="10" height="10" fill="#c43c7c"/></g>
      <g stroke="#ffe7f2" stroke-width="1" fill="none"><path d="M20 49 H26 M36 43 H42"/></g>
      <path d="M0 60 L0 56 L100 56 L100 60Z" fill="#14031a"/>`),
    etf: wrap(`<rect width="100" height="60" fill="url(#sky-etf)"/><circle cx="78" cy="16" r="10" fill="url(#sun-gold)"/>${clouds(8, 12)}
      <path d="M0 54 Q30 46 56 52 T100 50 V60 H0Z" fill="#0b1603"/>
      <g stroke="#0b1603" stroke-width=".4"><rect x="30" y="30" width="5" height="16" fill="#3f7fe0"/><rect x="36" y="25" width="5" height="21" fill="#2f9e74"/><rect x="42" y="20" width="5" height="26" fill="#f3dc95"/><rect x="48" y="27" width="5" height="19" fill="#d8553a"/><rect x="54" y="23" width="5" height="23" fill="#8d5ee0"/><rect x="60" y="31" width="5" height="15" fill="#c3902e"/></g>
      <path d="M24 42 H72 L66 59 H30Z" fill="#7a5222" stroke="#2a1a05" stroke-width=".6"/>
      <g stroke="#3b260c" stroke-width=".6" fill="none"><path d="M26 46 H70 M27.5 50 H68.5 M29 54 H67"/><path d="M34 42 L36 59 M42 42 L43 59 M50 42 V59 M58 42 L57 59 M66 42 L64 59"/></g>
      <path d="M24 42 H72" stroke="#f3dc95" stroke-width="1"/>
      <path d="M4 40 L16 36 L24 38 L40 26 L52 28 L70 14 L96 8" fill="none" stroke="#fff2b0" stroke-width="1.3" filter="url(#glow)"/>`),
    /* the storehouse (kura) and chests of coins */
    money: wrap(`<rect width="100" height="60" fill="url(#sky-money)"/><circle cx="80" cy="15" r="9" fill="url(#sun-gold)"/>${clouds(6, 12)}
      <path d="M0 54 Q30 48 60 52 T100 50 V60 H0Z" fill="#1a0622"/>
      <g stroke="#2a0a30" stroke-width=".5" stroke-linejoin="round"><path d="M16 31 L35 22 L54 31Z" fill="#2a0a30" stroke="#f3dc95"/><rect x="20" y="31" width="30" height="24" fill="#f4ead2"/>
        <rect x="20" y="45" width="30" height="10" fill="#3a1440"/><rect x="30" y="35" width="10" height="9" fill="#2a0a30" stroke="#f3dc95"/></g>
      <g stroke="#f4ead2" stroke-width=".35" opacity=".6"><path d="M20 48 L50 48 M20 51.5 H50 M25 45 L22 55 M31 45 L28 55 M37 45 L34 55 M43 45 L40 55 M49 45 L46 55"/></g>
      <circle cx="35" cy="39.5" r="2" fill="none" stroke="#f3dc95" stroke-width=".6"/><path d="M35 37.5 V41.5 M33 39.5 H37" stroke="#f3dc95" stroke-width=".5"/>
      <g fill="#7a4a1a" stroke="#2a1405" stroke-width=".5"><rect x="60" y="47" width="15" height="8"/><rect x="77" y="47" width="15" height="8"/><rect x="68.5" y="39" width="15" height="8"/></g>
      <g stroke="#f3dc95" stroke-width=".8"><path d="M60 51 H75 M77 51 H92 M68.5 43 H83.5"/></g>
      ${[[71, 38], [76, 37.4], [81, 38]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry=".9" fill="url(#gold-v)" stroke="#6b470f" stroke-width=".25"/>`).join('')}
      <path d="M4 44 C24 41 44 33 62 27 S90 13 98 9" fill="none" stroke="#fff2b0" stroke-width="1.3" filter="url(#glow)"/>`),
  };
})();
VAR_HUE = [0, 14, -14, 24, -22, 8, -8, 18, -18, 30, -28, 4, -4, 34, -34, 12, -12, 22, -26, 28];
backHTML = () => `<div class="card back" aria-hidden="true"><div class="mark"><span>金</span></div></div>`;
}

export { CATS, CAT_ALIAS, MON, MONSTERS, RARITY, RARITY_FULL, RARITY_TC, SCENE, VAR_HUE, backHTML, cardHTML, cardSlot, fillLazy };
