import { describe, it, expect } from 'vitest';
import { MONSTERS, MON, CATS } from '../src/js/cards.js';
import { SKILLS } from '../src/js/skills.js';
import { BUILTIN, normalizeQ } from '../src/js/bank.js';
import { DATA } from '../src/js/data.js';

describe('cards.json', () => {
  it('has 160 unique cards, 20 per category with the rarity split 6/6/4/4', () => {
    expect(MONSTERS).toHaveLength(160);
    expect(new Set(MONSTERS.map(m => m.id)).size).toBe(160);
    for (const k of Object.keys(CATS)) {
      const list = MONSTERS.filter(m => m.cat === k);
      expect(list, k).toHaveLength(20);
      expect([1, 2, 3, 4].map(r => list.filter(m => m.rank === r).length), k).toEqual([6, 6, 4, 4]);
    }
  });
  it('gives every card a skill with a name and text', () => {
    for (const m of MONSTERS) { expect(SKILLS[m.id], m.id).toBeTruthy(); expect(SKILLS[m.id].name).toBeTruthy(); expect(SKILLS[m.id].text).toBeTruthy(); }
    expect(Object.keys(SKILLS).filter(id => !MON[id])).toEqual([]);
  });
  it('keeps stats inside the ranges the balance assumes', () => {
    for (const m of MONSTERS) { expect(m.atk).toBeGreaterThanOrEqual(700); expect(m.atk).toBeLessThanOrEqual(2300); expect(m.def).toBeGreaterThanOrEqual(500); expect(m.def).toBeLessThanOrEqual(2300); }
  });
});

describe('questions.json', () => {
  const raw = DATA.questions.questions;
  it('has 400 questions, 50 per category, difficulty 17/18/15', () => {
    expect(raw).toHaveLength(400);
    expect(new Set(raw.map(q => q.id)).size).toBe(400);
    for (const k of Object.keys(CATS)) {
      const list = raw.filter(q => q.category === k);
      expect(list, k).toHaveLength(50);
      expect([1, 2, 3].map(d => list.filter(q => q.difficulty === d).length), k).toEqual([17, 18, 15]);
    }
  });
  it('passes the importer validation and has distinct options', () => {
    raw.forEach((q, i) => {
      const r = normalizeQ(q, i);
      expect(r.err, q.id).toBeUndefined();
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
      expect(q.explain, q.id).toBeTruthy();
    });
    expect(BUILTIN).toHaveLength(400);
  });
});
