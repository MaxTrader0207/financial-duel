// ui.js — the few screen updates that game rules (skills.js) need: redraw the hand or a money bar, float a number,
// add a log line. board.js and fx.js fill these in at init, so skills never import the screen modules
// (which themselves need the skills to draw cards).
const noop = () => {};
export const UI = { renderHands: noop, renderLP: noop, floatText: noop, log: noop };
export function provide(fns) { Object.assign(UI, fns); }
