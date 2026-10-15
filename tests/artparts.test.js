// 主體零件庫: every part draws valid SVG, auto recipes pick sensible parts, recipes only name real cards
import { describe, it, expect } from 'vitest';
import { PARTS, PART_NAMES, compose, autoRecipe, PROP_BY_CAT } from '../src/js/art-parts.js';
import { RECIPES, recipeArt } from '../src/js/card-recipes.js';
import { OWN_IDS } from '../src/js/card-art.js';
import { MON } from '../src/js/carddata.js';

const valid = s => new DOMParser().parseFromString(s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml').getElementsByTagName('parsererror').length === 0;
describe('parts library', () => {
  it('has the core subjects and props, each drawing one valid SVG', () => {
    for (const p of ['samurai', 'ninja', 'monk', 'dragon', 'castle', 'scale', 'candles', 'coin']) expect(PART_NAMES).toContain(p);
    for (const p of PART_NAMES) {
      const kind = PARTS[p].kind, s = compose('tech', kind === 'prop' ? { props: [{ part: p, t: '$' }] } : { subject: { part: p } });
      expect(s, p).not.toMatch(/NaN|undefined/); expect(valid(s), p).toBe(true);
      expect(['character', 'beast', 'building', 'prop']).toContain(kind); expect(PARTS[p].label).toBeTruthy();
    }
  });
  it('unknown parts are an error, not a blank picture', () => {
    expect(() => compose('tech', { subject: { part: 'nope' } })).toThrow(/unknown part/);
  });
  it('auto recipes take the subject from the race or name and the 代表物 from the attribute', () => {
    const r = (race, cat, name = '') => autoRecipe({ id: 'x', race, name, cat, rank: 1 });
    expect(r('忍', 'tech').subject.part).toBe('ninja'); expect(r('僧兵', 'fund').subject.part).toBe('monk');
    expect(r('', 'fx', '匯市神龍').subject.part).toBe('dragon'); expect(r('城主', 'etf').subject.part).toBe('general');
    expect(r('未知', 'risk').subject.part).toBe('samurai');
    for (const [cat, prop] of Object.entries(PROP_BY_CAT)) expect(r('武士', cat).props[0].part).toBe(prop);
    expect(autoRecipe({ id: 'y', race: '龍', cat: 'tech', rank: 3 })).toMatchObject({ sky: 'sun', rays: true });
  });
  it('recipes only name real cards that have no hand-made picture, and draw valid SVG', () => {
    for (const id of Object.keys(RECIPES)) { expect(MON[id], id).toBeTruthy(); expect(OWN_IDS).not.toContain(id); expect(valid(recipeArt(MON[id]))).toBe(true); }
  });
});
