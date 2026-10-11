import time
from lib import *
def state(pg):
    return pg.evaluate("(() => { const G = window.__T.G; return { turn: G.turn, phase: G.phase, busy: G.busy, lp: G.lp, hist: G.history.length, foe: G.foeCard && G.foeCard.id }; })()")
def until(pg, cond, acc=0.7, limit=120):
    t0 = time.time()
    while time.time() - t0 < limit:
        if pg.evaluate(cond): return True
        step(pg, acc); pg.wait_for_timeout(80)
    return False
