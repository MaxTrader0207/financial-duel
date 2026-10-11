import random, time, json
from playwright.sync_api import sync_playwright
import os
BASE = 'file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.html')
def new_page(p, mobile=False, reduced=True, skip_tutorial=True):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width':390,'height':844} if mobile else {'width':1280,'height':860},
                        device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile,
                        reduced_motion='reduce' if reduced else 'no-preference', accept_downloads=True)
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    if skip_tutorial: ctx.add_init_script("try { localStorage.setItem('soba-ketto.tutorial.v1', 'done'); } catch (e) {}")
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error','warning') else None)
    pg.goto(BASE)
    pg.wait_for_timeout(300)
    return b, pg, errs
def vis(pg, sel):
    return pg.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); return !!e && !e.hidden && !e.closest('[hidden]'); }})()")
def step(pg, acc, pick=None):
    """Advance the game one action. Returns a state string."""
    if vis(pg, '#scr-result'): return 'result'
    if vis(pg, '#care'): pg.click('#care-ok'); return 'care'
    if vis(pg, '#quiz'):
        if vis(pg, '#q-feedback'):
            pg.click('#q-continue'); return 'continue'
        btns = pg.query_selector_all('#q-opts .q-opt:not([disabled])')
        if not btns: return 'wait'
        ans = pg.evaluate("window.__lastQ.options[window.__lastQ.answer]")
        right = [b for b in btns if b.inner_text().split('\n',1)[-1].strip() == ans.strip()]
        wrong = [b for b in btns if b not in right]
        target = right[0] if (random.random() < acc and right) or not wrong else random.choice(wrong)
        target.click(); return 'answer'
    ph = pg.evaluate("window.__T.G && window.__T.G.phase")
    if ph in ('attack','defend'):
        hand = pg.query_selector_all('#hand .hand-card:not([disabled])')
        if hand:
            (pick(pg, hand) if pick else random.choice(hand)).click(); return 'play-' + ph
    return 'wait'
def play_to_end(pg, acc, limit=900, pick=None, on_step=None):
    t0 = time.time(); n = 0
    while time.time() - t0 < limit:
        s = step(pg, acc, pick); n += 1
        if on_step: on_step(pg, s, n)
        if s == 'result': return True, n
        pg.wait_for_timeout(60 if s == 'wait' else 120)
    return False, n
