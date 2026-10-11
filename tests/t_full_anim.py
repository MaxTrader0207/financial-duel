import sys, time, random
from lib import *
random.seed(int(sys.argv[3]) if len(sys.argv) > 3 else 1)
diff, acc = sys.argv[1], float(sys.argv[2])
with sync_playwright() as p:
    b, pg, errs = new_page(p, reduced=False)
    pg.click(f'#diff input[value={diff}]', force=True)
    t0 = time.time()
    pg.click('#btn-start')
    ok, n = play_to_end(pg, acc)
    G = pg.evaluate("(() => { const G = window.__T.G; return { win: G.win, turn: G.turn, lp: G.lp, total: G.stats.total, correct: G.stats.correct, dealt: G.dealt, taken: G.taken }; })()")
    print(diff, acc, 'finished' if ok else 'TIMEOUT', f'{time.time()-t0:.0f}s', G)
    pg.screenshot(path=f'shots/result_{diff}.png', full_page=True)
    print('\n'.join(errs[:20]) or 'no errors')
    b.close()
