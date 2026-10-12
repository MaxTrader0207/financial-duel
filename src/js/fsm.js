// fsm.js — the duel's turn structure as an explicit state machine.
// Every step of the flow (flow.js) announces the state it enters; a transition missing from TRANSITIONS is a bug
// (usually a stale async step from a duel that already ended). It is recorded in `violations` and logged,
// but the game keeps going so a player is never stuck; tests assert that a full duel produces none.
export const TRANSITIONS = {
  idle:          ['intro', 'resume'],
  intro:         ['myTurn'],                    // 對決開始 transition
  resume:        ['attack', 'defend'],          // continue a saved duel
  myTurn:        ['attack', 'foeTurn'],         // 我方回合 transition (foeTurn when our attack is skipped)
  attack:        ['attackQuiz'],                // waiting for the player to summon
  attackQuiz:    ['attackResolve'],
  attackResolve: ['attack', 'foeTurn', 'over'], // attack again (當沖), hand over, or the duel ends
  foeTurn:       ['defend', 'myTurn'],          // 對手回合 (myTurn when the opponent is skipped)
  defend:        ['defendQuiz'],                // waiting for the player to block
  defendQuiz:    ['defendResolve'],
  defendResolve: ['myTurn', 'over'],
  over:          [],
};
/* the UI phase (G.phase) each state shows */
export const PHASE_OF = { idle: 'idle', intro: 'idle', resume: 'idle', myTurn: 'idle', attack: 'attack', attackQuiz: 'busy', attackResolve: 'busy',
  foeTurn: 'idle', defend: 'defend', defendQuiz: 'busy', defendResolve: 'busy', over: 'idle' };

export function createMachine({ strict = false } = {}) {
  let state = 'idle';
  const trail = ['idle'], violations = [];
  return {
    get state() { return state; },
    trail, violations,
    can(next) { return (TRANSITIONS[state] || []).includes(next); },
    go(next) {
      if (!(next in TRANSITIONS)) throw new Error(`unknown state ${next}`);
      const ok = this.can(next);
      if (!ok) {
        const msg = `illegal transition ${state} → ${next}`;
        if (strict) throw new Error(msg);
        violations.push(msg); console.warn('[fsm]', msg);
      }
      state = next; trail.push(next); if (trail.length > 400) trail.splice(0, trail.length - 400);
      return ok;
    },
  };
}
