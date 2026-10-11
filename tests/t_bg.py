from playwright.sync_api import sync_playwright
from lib import BASE
from PIL import Image
URL = BASE.replace('test.html', 'test_fonts.html')
ids = ['wave','shippo','kikko','raimon','yagasuri','bamboo','sakura','stars']
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width':1280,'height':800})
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    ctx.add_init_script("try { localStorage.setItem('soba-ketto.tutorial.v1', 'done'); } catch (e) {}")
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(2000)
    pg.screenshot(path='shots/bg_title.png', clip={'x':0,'y':0,'width':1280,'height':400})
    pg.click('#btn-start')
    for _ in range(200):
        if pg.evaluate("window.__T.G.phase") == 'attack': break
        pg.wait_for_timeout(50)
    print('picked', pg.evaluate("window.__T.G.bg"), pg.inner_text('#bg-label'))
    tiles = []
    for i in ids:
        pg.evaluate(f"window.__T.BG.apply('{i}')"); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'shots/bg_{i}.png')
        tiles.append(Image.open(f'shots/bg_{i}.png').resize((640, 400)))
    sheet = Image.new('RGB', (1280, 1600))
    for k, t in enumerate(tiles): sheet.paste(t, ((k % 2) * 640, (k // 2) * 400))
    sheet.save('shots/bg_sheet.png')
    print('errors', errs)
    b.close()
