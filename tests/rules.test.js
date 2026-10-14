import { describe, it, expect } from 'vitest';
import { CATS } from '../src/js/cards.js';
import { advOf, ADV_CYCLE, BEATS, ADV_WHY } from '../src/js/rules.js';

describe('type advantage', () => {
  it('forms one cycle through all nine categories', () => {
    expect([...ADV_CYCLE].sort()).toEqual(Object.keys(CATS).sort());
    let k = ADV_CYCLE[0], seen = new Set();
    for (let i = 0; i < 9; i++) { seen.add(k); k = BEATS[k]; }
    expect(seen.size).toBe(9); expect(k).toBe(ADV_CYCLE[0]);
  });
  it('gives ×1.5 to the defender that beats the attacker, ×0.5 the other way, ×1 otherwise', () => {
    for (const d of ADV_CYCLE) for (const a of ADV_CYCLE) {
      const want = BEATS[d] === a ? 1.5 : BEATS[a] === d ? 0.5 : 1;
      expect(advOf(d, a), `${d} vs ${a}`).toBe(want);
    }
  });
  it('explains every advantage', () => { for (const k of ADV_CYCLE) expect(ADV_WHY[k]).toBeTruthy(); });
});
