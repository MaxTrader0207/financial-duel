// ranked duels ask built-in questions only (the server judges them against its copy of the bank)
import { describe, it, expect, beforeEach } from 'vitest';
import { pickQuestion } from '../src/js/quiz.js';
import { BUILTIN, setCustomQuestions } from '../src/js/bank.js';
import { G } from '../src/js/game.js';
import { fresh } from './helpers.js';

describe('question source by mode', () => {
  const custom = { id: 'c-mine', category: 'tech', difficulty: 1, q: '自訂題', options: ['a', 'b', 'c', 'd'], answer: 0, explain: '' };
  beforeEach(() => { fresh(); setCustomQuestions([custom, { ...BUILTIN.find(q => q.category === 'tech'), answer: 3 }]); });
  it('a casual duel may ask custom questions', () => {
    G.mode = 'casual'; const ids = new Set();
    for (let i = 0; i < 300; i++) { G.used.clear(); ids.add(pickQuestion('tech', 1).id); }
    expect(ids.has('c-mine')).toBe(true);
  });
  it('a ranked duel never does, and uses the built-in version of an overridden question', () => {
    G.mode = 'ranked'; const builtin = new Map(BUILTIN.map(q => [q.id, q]));
    for (let i = 0; i < 300; i++) { G.used.clear(); const q = pickQuestion('tech', 1); expect(builtin.get(q.id)).toBe(q); }
  });
});
