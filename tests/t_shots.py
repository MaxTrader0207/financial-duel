import sys, random
from lib import *
random.seed(11)
mobile = sys.argv[1] == 'm'; tag = 'm' if mobile else 'd'
with sync_playwright() as p:
    b, pg, errs = new_page(p, mobile=mobile)
    pg.screenshot(path=f'shots/{tag}_1_title.png', full_page=True)
    pg.click('#btn-dex'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'shots/{tag}_2_dex.png')
    pg.click('#btn-dex-back'); pg.click('#btn-start')
    seen = set()
    def on_step(pg, s, n):
        ph = pg.evaluate("window.__T.G && window.__T.G.phase")
        if s == 'wait' and ph in ('attack','defend') and ph not in seen:
            seen.add(ph); pg.wait_for_timeout(400); pg.screenshot(path=f'shots/{tag}_3_{ph}.png')
        if vis(pg, '#quiz') and not vis(pg, '#q-feedback'):
            mode = pg.evaluate("document.querySelector('#q-mode').classList.contains('def') ? 'qdef' : 'qatk'")
            if mode not in seen: seen.add(mode); pg.wait_for_timeout(350); pg.screenshot(path=f'shots/{tag}_4_{mode}.png')
        if vis(pg, '#q-feedback') and 'fb' not in seen:
            seen.add('fb'); pg.screenshot(path=f'shots/{tag}_5_feedback.png')
    # step manually to capture before acting
    import time
    t0=time.time()
    while time.time()-t0 < 300:
        on_step(pg, 'wait', 0)
        s = step(pg, 0.7)
        if s == 'result': break
        pg.wait_for_timeout(120)
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'shots/{tag}_6_result.png', full_page=True)
    print([e for e in errs if 'ERR_FAILED' not in e] or 'no errors')
    b.close()
