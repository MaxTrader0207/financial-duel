import { describe, it, expect, vi } from 'vitest';
import { createMachine, TRANSITIONS, PHASE_OF } from '../src/js/fsm.js';

describe('duel state machine', () => {
  it('accepts a normal duel: intro, attack, opponent turn, defence, extra attack, end', () => {
    const f = createMachine({ strict: true });
    for (const s of ['intro', 'myTurn', 'attack', 'attackQuiz', 'attackResolve', 'attack', 'attackQuiz', 'attackResolve', 'foeTurn', 'defend', 'defendQuiz', 'defendResolve', 'myTurn', 'foeTurn', 'myTurn', 'attack', 'attackQuiz', 'attackResolve', 'over']) f.go(s);
    expect(f.state).toBe('over'); expect(f.violations).toEqual([]);
  });
  it('accepts resuming a saved duel in either phase', () => {
    for (const p of ['attack', 'defend']) { const f = createMachine({ strict: true }); f.go('resume'); f.go(p); expect(f.state).toBe(p); }
  });
  it('rejects skipping the quiz or acting after the duel ended', () => {
    expect(() => { const f = createMachine({ strict: true }); f.go('intro'); f.go('myTurn'); f.go('attack'); f.go('attackResolve'); }).toThrow(/attack → attackResolve/);
    expect(() => { const f = createMachine({ strict: true }); f.go('intro'); f.go('myTurn'); f.go('foeTurn'); f.go('defend'); f.go('defendQuiz'); f.go('defendResolve'); f.go('over'); f.go('myTurn'); }).toThrow(/over → myTurn/);
  });
  it('records (does not throw on) an illegal step outside strict mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = createMachine(); f.go('attackQuiz');
    expect(f.violations).toEqual(['illegal transition idle → attackQuiz']); warn.mockRestore();
  });
  it('maps every state to a UI phase and only names known states', () => {
    for (const [s, next] of Object.entries(TRANSITIONS)) { expect(PHASE_OF[s], s).toBeTruthy(); for (const n of next) expect(TRANSITIONS[n], `${s}→${n}`).toBeTruthy(); }
  });
});
