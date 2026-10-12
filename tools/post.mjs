// post-processing after split.mjs: data comes from JSON, test-only hooks
import fs from 'node:fs';
const D = process.argv[2];
const edit = (f, a, b) => { const p = D + '/' + f; let s = fs.readFileSync(p, 'utf8'); if (!s.includes(a)) throw new Error(f + ': ' + a.slice(0, 50)); s = s.replace(a, b); fs.writeFileSync(p, s); };
{ const p = D + '/cards.js'; let s = fs.readFileSync(p, 'utf8'); const i = s.indexOf('MONSTERS = ['), j = s.indexOf('\n];', i) + 3;
  s = s.slice(0, i) + '/* card data lives in public/data/cards.json (loaded at start-up); skills are code, keyed by id, in skills.js */\nMONSTERS = DATA.cards.map(m => ({ ...m }));' + s.slice(j); fs.writeFileSync(p, s); }
edit('bank.js', "BUILTIN = JSON.parse($('#builtin-bank').textContent).questions.map(q => normalizeQ(q).q);", "/* built-in questions live in public/data/questions.json (loaded at start-up) */\nBUILTIN = DATA.questions.questions.map(q => normalizeQ(q).q);");
edit('quiz.js', "  G.used.add(q.id); return q;", "  G.used.add(q.id); if (import.meta.env.MODE === 'test') window.__lastQ = q; return q;");
edit('quiz.js', "G.used.add(q.id); G.lastFromNb = true; return q;", "G.used.add(q.id); G.lastFromNb = true; if (import.meta.env.MODE === 'test') window.__lastQ = q; return q;");
console.log('post ok');
