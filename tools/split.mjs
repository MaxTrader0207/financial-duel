// Splits the single-file game (soba-ketto.html) into ES modules for the Vite project in app/.
// Every top-level statement goes to the module whose start marker precedes it. Function declarations stay
// at module top level; every other statement moves, in its original order, into that module's init(),
// and main.js calls the inits in the original order, so side effects run exactly as before.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url + '/../../app/');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC = process.argv[2], OUT = process.argv[3];
const html = fs.readFileSync(SRC, 'utf8');
const open = '<script>\n(() => {\n';
const s0 = html.lastIndexOf(open) + open.length, s1 = html.lastIndexOf('})();\n</script>');
let code = html.slice(s0, s1);

// module start markers, in source order (first match of each regex at the start of a line)
const MODS = [
  ['core', /^const \$ = s =>/m],
  ['sound', /^\/\* ---------- sound/m],
  ['cards', /^\/\* ---------- categories & cards/m],
  ['bank', /^\/\* ---------- question bank/m],
  ['screens', /^\/\* ---------- screens/m],
  ['rules', /^\/\* ---------- type advantage/m],
  ['records', /^\/\* ---------- learning record \(this/m],
  ['collection', /^\/\* ---------- collection \+ deck/m],
  ['ai', /^\/\* ---------- opponent AI/m],
  ['state', /^\/\* ---------- game state/m],
  ['save', /^\/\* ---------- save \/ resume/m],
  ['fx', /^function log\(html\)/m],
  ['quiz', /^\/\* ---------- quiz ----------/m],
  ['skills', /^\/\* ---------- card skills/m],
  ['ask', /^function ask\(m, mode, foe\)/m],
  ['flow', /^\/\* ---------- flow/m],
  ['result', /^\/\* ---------- result/m],
  ['report', /^\/\* ---------- report export/m],
  ['notebook', /^\/\* ---------- wrong-answer notebook/m],
  ['feedback', /^\/\* ---------- question reports/m],
  ['tutor', /^\/\* ---------- first-duel tutorial/m],
  ['backgrounds', /^\/\* ---------- battle backgrounds/m],
  ['bankui', /^\/\* ---------- bank screen/m],
  ['wiring', /^\/\* ---------- wiring/m],
  ['recordui', /^\/\* ---------- learning record screen/m],
  ['deckui', /^\/\* ---------- deck builder/m],
  ['settings', /^\/\* ---------- settings ----------/m],
  ['playtime', /^\/\* ---------- play-time care/m],
  ['boot', /^\/\* tell the player once/m],
];
let starts, modAt;

let ast, body, stmtMod, modOfNode, bindings, uses, writes;
function analyse() {
starts = MODS.map(([name, re]) => { const m = re.exec(code); if (!m) throw new Error('marker not found: ' + name); return [name, m.index]; });
for (let i = 1; i < starts.length; i++) if (starts[i][1] <= starts[i - 1][1]) throw new Error('markers out of order at ' + starts[i][0]);
modAt = pos => { let n = starts[0][0]; for (const [name, p] of starts) if (p <= pos) n = name; return n; };
ast = parse(code, { sourceType: 'script', allowReturnOutsideFunction: false, ranges: true });
body = ast.program.body;
// statement → module, preferring the leading comment position so a section comment stays with its code
stmtMod = new Map();
body.forEach(st => stmtMod.set(st, modAt(st.start)));
modOfNode = p => { let q = p; while (q.parentPath && q.parentPath.node !== ast.program) q = q.parentPath; return stmtMod.get(q.node); };

bindings = {};   // name -> { mod, kind }
uses = {};       // mod -> Set(names from other modules)
writes = [];     // cross-module reassignments
traverse(ast, {
  Program(p) {
    for (const [name, b] of Object.entries(p.scope.bindings)) {
      const mod = modOfNode(b.path);
      bindings[name] = { mod, kind: b.kind };
      for (const r of b.referencePaths) { const m = modOfNode(r); if (m !== mod) (uses[m] ||= new Set()).add(name); }
      for (const v of b.constantViolations) { const m = modOfNode(v); if (m !== mod) { writes.push({ name, owner: mod, mod: m, path: v, decl: b.path }); (uses[m] ||= new Set()).add(name); } }
    }
  },
});
}
analyse();
/* a binding reassigned from another module gets a setter in its owner module: X = v  →  __set_X(v) */
if (writes.length) {
  const edits = [], setters = new Map();
  for (const w of writes) {
    const n = w.path.node;
    if (n.type !== 'AssignmentExpression' || n.operator !== '=' || n.left.type !== 'Identifier') throw new Error('unsupported write to ' + w.name + ': ' + code.slice(n.start, n.end));
    edits.push([n.left.start, n.right.start, `__set_${w.name}(`], [n.end, n.end, ')']);
    let decl = w.decl; while (decl.parentPath && decl.parentPath.node !== ast.program) decl = decl.parentPath;
    setters.set(w.name, decl.node.end);
  }
  for (const [name, at] of setters) edits.push([at, at, `\nfunction __set_${name}(v) { ${name} = v; }`]);
  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [a0, a1, t] of edits) code = code.slice(0, a0) + t + code.slice(a1);
  console.error('setters:', [...setters.keys()].join(', '));
  analyse();
  if (writes.length) throw new Error('writes remain: ' + writes.map(w => w.name));
}


// emit
fs.mkdirSync(OUT, { recursive: true });
const order = MODS.map(m => m[0]);
const exported = {}; for (const m of order) exported[m] = new Set();
for (const [m, set] of Object.entries(uses)) for (const n of set) exported[bindings[n].mod].add(n);
for (const mod of order) {
  const stmts = body.filter(st => stmtMod.get(st) === mod);
  const top = [], init = [], hoisted = [];
  // leading comments are part of the gap between statements; keep the raw text from each statement's predecessor end
  let prevEnd = null;
  for (const st of stmts) {
    const idx = body.indexOf(st), from = idx === 0 ? 0 : body[idx - 1].end;
    const text = code.slice(from, st.end).replace(/^\n/, '');
    if (st.type === 'FunctionDeclaration') top.push(text);
    else if (st.type === 'VariableDeclaration') {
      // const/let x = v  →  top: let x;   init: x = v;
      const names = [];
      for (const d of st.declarations) { if (d.id.type !== 'Identifier') throw new Error('destructuring at top level: ' + code.slice(st.start, st.start + 60)); names.push(d.id.name); }
      hoisted.push(...names);
      const lead = code.slice(from, st.start).replace(/^\n/, '');
      const assigns = st.declarations.filter(d => d.init).map(d => `${d.id.name} = ${code.slice(d.init.start, d.init.end)}`).join(';\n');
      init.push(lead + (assigns ? assigns + ';' : ''));
    } else init.push(text);
  }
  const imps = {};
  for (const n of uses[mod] || []) (imps[bindings[n].mod] ||= []).push(n);
  let out = `// ${mod}.js — generated from soba-ketto.html by tools/split.mjs, then maintained here\n`;
  for (const [from, names] of Object.entries(imps).sort()) out += `import { ${names.sort().join(', ')} } from './${from}.js';\n`;
  if (mod === 'cards' || mod === 'bank') out += `import { DATA } from './data.js';\n`;
  out += '\n';
  if (hoisted.length) out += `let ${hoisted.join(', ')};\n\n`;
  out += top.join('\n') + '\n\n';
  out += `export function init() {\n${init.join('\n')}\n}\n`;
  /* export every top-level binding, so tests and later modules can reach anything */
  const ex = Object.keys(bindings).filter(n => bindings[n].mod === mod).sort();
  if (ex.length) out += `\nexport { ${ex.join(', ')} };\n`;
  fs.writeFileSync(path.join(OUT, mod + '.js'), out);
}
let main = `// main.js — loads the card and question data, then initialises every module in the original order\nimport { loadData } from './data.js';\n`;
for (const m of order) main += `import { init as init_${m} } from './${m}.js';\n`;
main += `\nawait loadData();\n${order.map(m => `init_${m}();`).join('\n')}\nif (import.meta.env.MODE === 'test') await import('./debug.js');\n`;
fs.writeFileSync(path.join(OUT, 'main.js'), main);
console.log('modules', order.length, 'bindings', Object.keys(bindings).length, 'writes', writes.length);
