import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { Perf, describe as fxNote } from '../src/js/perf.js';
import { MON, MONSTERS, cardSlot, fillLazy } from '../src/js/cards.js';

const lite = () => document.documentElement.classList.contains('fx-lite');
afterEach(() => { Perf.flag('畫面偏慢', false); Perf.set('auto'); });

describe('simplified effects', () => {
  it('follows the setting: on / off / auto', () => {
    Perf.set('on'); expect(lite()).toBe(true);
    Perf.set('off'); Perf.flag('畫面偏慢'); expect(lite()).toBe(false);          // off wins over detection
    Perf.set('auto'); expect(lite()).toBe(true); expect(fxNote()).toContain('畫面偏慢');
    Perf.flag('畫面偏慢', false); expect(lite()).toBe(false);
  });
  it('tells listeners when it switches', () => {
    const seen = []; Perf.onChange(v => seen.push(v));
    Perf.set('on'); Perf.set('off'); expect(seen.slice(-2)).toEqual([true, false]);
  });
});

describe('lazy card grid', () => {
  it('draws placeholders, and every card when IntersectionObserver is missing', () => {
    const box = document.createElement('div'); document.body.appendChild(box);
    box.innerHTML = MONSTERS.slice(0, 12).map(cardSlot).join('');
    expect(box.querySelectorAll('.card.lazy')).toHaveLength(12); expect(box.querySelector('svg')).toBeNull();
    const io = globalThis.IntersectionObserver; delete globalThis.IntersectionObserver;
    try { fillLazy(box); } finally { if (io) globalThis.IntersectionObserver = io; }
    expect(box.querySelectorAll('.card.lazy')).toHaveLength(0);
    expect(box.querySelector(`.card[data-id="${MONSTERS[0].id}"] .c-art`)).not.toBeNull();
    box.remove();
  });
});

describe('web app build', () => {
  it('lists every file of the Pages build in sw.js (when dist/ exists)', () => {
    if (!existsSync('dist/sw.js')) return;
    const sw = readFileSync('dist/sw.js', 'utf8'), files = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1]);
    for (const f of ['./', 'index.html', 'manifest.webmanifest', 'data/cards.json', 'data/questions.json', 'icons/icon-512.png']) expect(files).toContain(f);
    for (const part of ['core', 'cards', 'rest']) for (const n of ['serif', 'sans']) expect(files.some(f => new RegExp(`^assets/fd-${n}-${part}-.*\\.woff2$`).test(f))).toBe(true);
    expect(files).toContain('vendor/jspdf.umd.min.js');                         // cached for offline PDF export
    expect(sw).toMatch(/const VERSION = '[0-9a-f]{12}'/);
  });
});

describe('first load', () => {
  it('does not load jsPDF with the page (only on the first PDF export)', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toMatch(/jspdf|VITE_JSPDF_URL/i);
  });
  it('the display fonts are cut in parts that cover every card name and the title text', () => {
    const css = readFileSync('src/fonts/fonts.css', 'utf8');
    const faces = [...css.matchAll(/font-family:"(FD \w+)";src:url\("\.\/([\w-]+\.woff2)"\)[^}]*unicode-range:([^}]+)\}/g)];
    expect(faces).toHaveLength(6);
    for (const [, , file] of faces) expect(existsSync(`src/fonts/${file}`)).toBe(true);
    const covered = fam => { const set = new Set(); for (const [, f, , r] of faces) if (f === fam) for (const part of r.split(',')) {
      const [a, b] = part.replace('U+', '').split('-').map(h => parseInt(h, 16)); for (let c = a; c <= (b || a); c++) set.add(c); } return set; };
    const serif = covered('FD Serif');
    const cards = JSON.parse(readFileSync('public/data/cards.json', 'utf8')).cards;
    for (const c of cards) for (const ch of c.name) expect(serif.has(ch.codePointAt(0)), `${ch} in ${c.name}`).toBe(true);
    for (const ch of '金融決鬥') expect(serif.has(ch.codePointAt(0))).toBe(true);
  });
});
