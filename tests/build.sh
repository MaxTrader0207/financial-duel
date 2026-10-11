#!/bin/sh
# Builds tests/test.html: a copy of ../index.html that exposes internals (window.__T)
# and the current question (window.__lastQ) so the Playwright scripts can drive the game.
cd "$(dirname "$0")"
rm -rf ./vendor; cp -r ../vendor ./vendor
python3 - <<'PY'
h = open('../index.html', encoding='utf-8').read()
hook = """window.__T = { get G() { return G; }, MON, SKILLS, MONSTERS, CATS, DIFFS, startDuel, onPlay, saveGame, readSave, resumeDuel, makeReport,
  get PT() { return PT; }, Sound, BG, ptTick, startRest, foeAtkOf, setPhase, placeField, clearField, renderAll, cpuTurn, playerTurn };
renderTitle();
})();"""
a = "renderTitle();\n})();"; assert h.count(a) == 1; h = h.replace(a, hook)
a = "  G.used.add(q.id); return q;"; assert h.count(a) == 1; h = h.replace(a, "  G.used.add(q.id); window.__lastQ = q; return q;")
a = "G.used.add(q.id); G.lastFromNb = true; return q;"; assert h.count(a) == 1; h = h.replace(a, "G.used.add(q.id); G.lastFromNb = true; window.__lastQ = q; return q;")
open('test.html', 'w', encoding='utf-8').write(h)
print('built tests/test.html')
PY
