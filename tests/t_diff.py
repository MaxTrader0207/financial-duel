from playwright.sync_api import sync_playwright
from lib import BASE
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, sf in [('d', {'width':1280,'height':800}, 1), ('m', {'width':390,'height':844}, 2)]:
        pg = b.new_page(viewport=vp, device_scale_factor=sf)
        pg.goto(BASE); pg.wait_for_timeout(4000)
        box = pg.query_selector('#diff').bounding_box()
        pg.screenshot(path=f'shots/diff_{name}.png', clip={'x':0,'y':box['y']-10,'width':vp['width'],'height':box['height']+20}, full_page=True)
    b.close()
