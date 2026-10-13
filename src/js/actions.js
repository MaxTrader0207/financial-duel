// actions.js — screen-level actions other modules trigger without importing their owners
// (a result screen's 「再戰一場」 starts a duel, a reward opens the deck builder, …).
// The owning module registers the function at init; callers use Actions.x(). This keeps the import graph one-way:
// flow.js may import result.js, and result.js still reaches startDuel.
const missing = name => () => { throw new Error(`action ${name} is not registered`); };
export const Actions = {
  startDuel: missing('startDuel'),        // flow.js
  resumeDuel: missing('resumeDuel'),      // flow.js
  renderTitle: missing('renderTitle'),    // screens.js
  openDeck: missing('openDeck'),          // deckui.js
  openRanked: missing('openRanked'),      // rankedui.js
  openBoard: missing('openBoard'),        // boardui.js
};
export function register(fns) { Object.assign(Actions, fns); }
