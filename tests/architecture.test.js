// Guards the module structure: no import cycles between src/js modules, and no leftovers of the old
// auto-split (__set_X setters). See "模組結構" in README.md for the layering these rules protect.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/js';
const files = readdirSync(DIR).filter(f => f.endsWith('.js'));
const src = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
const graph = Object.fromEntries(files.map(f => [f, [...src[f].matchAll(/from '\.\/([\w-]+\.js)'/g)].map(m => m[1]).filter(d => d in src)]));

function cycles() {                                 // Tarjan's strongly connected components
  let i = 0; const idx = {}, low = {}, stack = [], on = new Set(), out = [];
  const visit = v => {
    idx[v] = low[v] = i++; stack.push(v); on.add(v);
    for (const w of graph[v]) {
      if (!(w in idx)) { visit(w); low[v] = Math.min(low[v], low[w]); } else if (on.has(w)) low[v] = Math.min(low[v], idx[w]);
    }
    if (low[v] === idx[v]) { const c = []; let w; do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1 || graph[v].includes(v)) out.push(c.sort()); }
  };
  files.forEach(f => { if (!(f in idx)) visit(f); });
  return out;
}

describe('module structure', () => {
  it('has no import cycles', () => { expect(cycles()).toEqual([]); });
  it('the shared leaf modules import nothing from the game', () => {
    for (const f of ['game.js', 'actions.js', 'ui.js', 'rankrules.js', 'kbonus.js']) expect(graph[f], f).toEqual([]);
  });
  it('game rules never import screen code', () => {
    const screen = ['board.js', 'fx.js', 'view.js', 'screens.js', 'wiring.js', 'result.js', 'flow.js', 'rankedui.js', 'boardui.js'];
    for (const f of ['skills.js', 'calc.js', 'deck.js', 'carddata.js', 'rules.js', 'records.js', 'daily.js', 'knowledge.js', 'ranked.js', 'market.js', 'online.js', 'usage.js'])
      expect(graph[f].filter(d => screen.includes(d)), f).toEqual([]);
  });
  it('has no auto-generated setters left', () => {
    expect(files.filter(f => /__set_\w+/.test(src[f]))).toEqual([]);
  });
});
