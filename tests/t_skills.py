import json, time
from lib import *
FOE = 'boll_dragon'   # CPU attacker for defense tests: ATK 1800, its skill only fires for the player side
def wait_phase(pg, want, limit=20):
    t0 = time.time()
    while time.time() - t0 < limit:
        ph = pg.evaluate("window.__T.G.phase")
        if ph in want: return ph
        if vis(pg, '#scr-result'): return 'result'
        if vis(pg, '#quiz'):
            if vis(pg, '#q-feedback'): pg.click('#q-continue')
            else:
                b = pg.query_selector('#q-opts .q-opt:not([disabled])')
                if b: b.click()
        pg.wait_for_timeout(50)
    return None
def answer(pg, correct):
    for _ in range(200):
        if vis(pg, '#quiz') and not vis(pg, '#q-feedback') and pg.query_selector('#q-opts .q-opt:not([disabled])'): break
        pg.wait_for_timeout(40)
    ans = pg.evaluate("window.__lastQ.options[window.__lastQ.answer]").strip()
    for attempt in range(2):
        btns = pg.query_selector_all('#q-opts .q-opt:not([disabled])')
        r = [b for b in btns if b.inner_text().split('\n',1)[-1].strip() == ans]
        w = [b for b in btns if b not in r]
        (r[0] if correct else w[0]).click()
        pg.wait_for_timeout(120)
        if vis(pg, '#q-feedback'): break
        # KD twins retry: second chance
    for _ in range(100):
        if vis(pg, '#q-feedback'): pg.click('#q-continue'); return
        pg.wait_for_timeout(40)
def run(pg, cid, mode, correct):
    ph = wait_phase(pg, [mode] if mode == 'attack' else ['defend'])
    if ph != mode:
        # play through until we reach the wanted phase
        for _ in range(6):
            other = pg.evaluate("window.__T.G.phase")
            if other == mode: break
            pg.evaluate("(() => { const T = window.__T; T.G.lp = {p:10000, c:10000}; })()")
            pg.click('#hand .hand-card:not([disabled])'); answer(pg, True)
            wait_phase(pg, ['attack','defend'])
    pg.evaluate("""([cid, mode, foe]) => {
      const T = window.__T, G = T.G;
      G.lp = {p: 10000, c: 10000}; G.streak = 0; G.flags = {}; G.extraUsed = false;
      G.mods = {myAtk: 0, foeAtk: 0, skipFoe: false, skipMe: false};
      G.hand.p = [{uid: 90000 + Math.floor(Math.random()*9999), id: cid}];
      if (mode === 'defend') { G.foeCard = T.MON[foe]; T.placeField('c', G.foeCard); }
      T.setPhase(G.phase, mode === 'attack' ? '攻撃フェイズ' : '防御フェイズ', 'test');
      window.__floats = [];
    }""", [cid, mode, FOE])
    pg.click('#hand .hand-card:not([disabled])')
    answer(pg, correct)
    wait_phase(pg, ['attack','defend'], 25)
    return pg.evaluate("(() => { const G = window.__T.G; return { lp: G.lp, mods: G.mods, floats: window.__floats.slice(), handC: G.hand.c.length, handP: G.hand.p.length, phase: G.phase, flags: G.flags }; })()")
with sync_playwright() as p:
    b, pg, errs = new_page(p)
    pg.evaluate("""window.__floats = []; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('float')) window.__floats.push(n.textContent); }))).observe(document.body, {childList: true});""")
    pg.click('#btn-start')
    ids = pg.evaluate("window.__T.MONSTERS.map(m => m.id)")
    import os
    if os.environ.get("ONLY"): ids = os.environ["ONLY"].split(",")
    out = {}
    for cid in ids:
        rec = {}
        for mode, corr in [('attack', True), ('attack', False), ('defend', True), ('defend', False)]:
            try:
                r = run(pg, cid, mode, corr)
            except Exception as e:
                r = {'error': str(e)[:200]}
            rec[f"{mode}-{'ok' if corr else 'ng'}"] = r
        out[cid] = rec
        print(cid, {k: (v.get('lp'), [f for f in v.get('floats', []) if f.startswith('【')]) for k, v in rec.items()}, flush=True)
    json.dump(out, open('skills_' + str(abs(hash(','.join(ids))) % 10000) + '.json', 'w'), ensure_ascii=False, indent=1)
    print('ERRORS:', [e for e in errs if 'ERR_FAILED' not in e] or 'none')
    b.close()
