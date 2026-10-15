// exclusive card illustrations (pilot: 資金管理 ★1–★3)
import { describe, it, expect } from 'vitest';
import { OWN_IDS, ownArt } from '../src/js/card-art.js';
import { MON, MONSTERS } from '../src/js/carddata.js';
import { cardHTML } from '../src/js/cards.js';

describe('card art', () => {
  it('covers every 資金管理 card below 極稀有, and only real cards', () => {
    const want = MONSTERS.filter(m => m.cat === 'money' && m.rank < 4).map(m => m.id).sort();
    expect(OWN_IDS.slice().sort()).toEqual(want);
    expect(want).toHaveLength(16);
  });
  it('each illustration is one well-formed SVG and is used by the card face', () => {
    for (const id of OWN_IDS) {
      const s = ownArt(MON[id]);
      expect(s.startsWith('<svg class="scene ur own"')).toBe(true);
      expect(s.match(/<svg/g)).toHaveLength(1); expect(s.endsWith('</svg>')).toBe(true);
      expect(s).not.toMatch(/NaN|undefined/);
      const doc = new DOMParser().parseFromString(s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml');
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      expect(cardHTML(MON[id])).toContain('c-art-own');
    }
    expect(cardHTML(MONSTERS.find(m => m.cat === 'tech' && m.rank === 1))).not.toContain('c-art-own');
  });
});
