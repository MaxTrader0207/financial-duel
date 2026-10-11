import random, time
from playwright.sync_api import sync_playwright
from lib import BASE, vis, step, play_to_end
URL = BASE.replace('test.html', 'test_fonts.html')
random.seed(4)
with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, vp, sf in [('d', {'width':1280,'height':860}, 1), ('m', {'width':390,'height':844}, 2)]:
        ctx = b.new_context(viewport=vp, device_scale_factor=sf, is_mobile=(tag=='m'), has_touch=(tag=='m'))
        ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        ctx.add_init_script("try { localStorage.setItem('soba-ketto.tutorial.v1', 'done'); } catch (e) {}")
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(2500)
        pg.screenshot(path=f'shots/tc_{tag}_title.png')
        pg.click('#btn-start'); pg.wait_for_timeout(750)
        pg.screenshot(path=f'shots/tc_{tag}_trans.png')
        for _ in range(200):
            if pg.evaluate("window.__T.G.phase") == 'attack': break
            pg.wait_for_timeout(50)
        pg.wait_for_timeout(600); pg.screenshot(path=f'shots/tc_{tag}_duel.png')
        pg.click('#hand .hand-card:not([disabled])')
        for _ in range(200):
            if pg.query_selector('#q-opts .q-opt:not([disabled])'): break
            pg.wait_for_timeout(50)
        pg.wait_for_timeout(500); pg.screenshot(path=f'shots/tc_{tag}_quiz.png')
        ok, n = play_to_end(pg, 0.8, limit=400)
        pg.wait_for_timeout(2500); pg.screenshot(path=f'shots/tc_{tag}_result.png')
        print(tag, ok, errs)
        ctx.close()
    b.close()
