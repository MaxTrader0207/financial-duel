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
    expect(files.some(f => /^assets\/fd-serif-.*\.woff2$/.test(f))).toBe(true);
    expect(sw).toMatch(/const VERSION = '[0-9a-f]{12}'/);
  });
});
