from playwright.sync_api import sync_playwright
from lib import BASE
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':1280,'height':800})
    pg.goto(BASE); pg.wait_for_timeout(6000)
    print(pg.evaluate("""(async () => { await document.fonts.ready;
      const el = document.querySelector('#diff b'); 
      return [getComputedStyle(el).fontFamily, document.fonts.check('800 19px "Shippori Mincho B1"', '簡易適中困難'),
        [...document.fonts].filter(f => f.family.includes('Shippori')).map(f => f.status + ' ' + f.unicodeRange.slice(0,40)).slice(0,5)]; })()"""))
    box = pg.query_selector('#diff').bounding_box()
    pg.screenshot(path='shots/diff_d2.png', clip={'x':330,'y':box['y']-5,'width':520,'height':box['height']+10}, full_page=True)
    b.close()
