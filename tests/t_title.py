from playwright.sync_api import sync_playwright
from lib import BASE
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [('d', {'width':1280,'height':800}), ('m', {'width':390,'height':700})]:
        pg = b.new_page(viewport=vp, device_scale_factor=2 if name=='m' else 1)
        pg.goto(BASE); pg.wait_for_timeout(4000)
        print(name, pg.evaluate("document.fonts.check('800 40px \"Shippori Mincho B1\"', '相場決闘')"))
        pg.screenshot(path=f'shots/title_{name}.png')
    b.close()
