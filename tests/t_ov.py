from lib import *
with sync_playwright() as p:
    b, pg, errs = new_page(p, mobile=True)
    pg.evaluate("localStorage.setItem('soba-ketto.tutorial.v1','done')")
    pg.click('#btn-start')
    for _ in range(400):
        if pg.evaluate("window.__T.G.phase") == 'attack': break
        pg.wait_for_timeout(50)
    pg.wait_for_timeout(500)
    print(pg.evaluate("""(() => { const W = document.documentElement.clientWidth; const out = [];
      document.querySelectorAll('#scr-duel *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > W + 0.5 && r.width > 0) out.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.right)); });
      return { W, sw: document.documentElement.scrollWidth, out: out.slice(0, 12) }; })()"""))
    b.close()
