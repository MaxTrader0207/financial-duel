import random
from lib import *
random.seed(3)
with sync_playwright() as p:
    b, pg, errs = new_page(p, mobile=True)
    pg.click('#btn-start'); play_to_end(pg, 0.9)
    pg.wait_for_timeout(400)
    pg.screenshot(path='shots/seal.png', clip={'x':0,'y':0,'width':390,'height':260})
    b.close()
