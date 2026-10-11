from playwright.sync_api import sync_playwright
from lib import BASE
URL = BASE.replace('test.html', 'test_fonts.html')
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, sf in [('d', {'width':1280,'height':800}, 1), ('m', {'width':390,'height':1100}, 2)]:
        pg = b.new_page(viewport=vp, device_scale_factor=sf)
        pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        pg.goto(URL); pg.wait_for_timeout(2500)
        print(name, pg.evaluate("[...document.fonts].filter(f => f.family.includes('Shippori') && f.status === 'loaded').length"))
        pg.screenshot(path=f'shots/real_{name}.png')
    b.close()
