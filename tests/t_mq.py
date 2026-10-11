from lib import *
with sync_playwright() as p:
    b, pg, errs = new_page(p, mobile=True)
    pg.evaluate("localStorage.setItem('soba-ketto.tutorial.v1','done')")
    pg.click('#btn-start')
    for _ in range(400):
        if pg.evaluate("window.__T.G.phase") == 'attack' and pg.query_selector('#hand .hand-card:not([disabled])'): break
        pg.wait_for_timeout(50)
    # force a time-sensitive, long question
    pg.evaluate("window.__T.G.hand.p = [{uid: 77777, id: 'three_generals'}]; window.__T.setPhase('attack','x','y')")
    pg.click('#hand .hand-card')
    for _ in range(200):
        if pg.query_selector('#q-opts .q-opt:not([disabled])'): break
        pg.wait_for_timeout(50)
    pg.query_selector('#q-opts .q-opt:not([disabled])').click(); pg.wait_for_timeout(400)
    pg.screenshot(path='shots/m_quiz_fb.png')
    print(pg.evaluate("""(() => { const q = document.querySelector('#quiz'); const p = document.querySelector('.q-panel'); const c = document.querySelector('#q-continue').getBoundingClientRect();
      return { qh: q.clientHeight, sh: q.scrollHeight, st: q.scrollTop, panelTop: p.getBoundingClientRect().top, cont: [c.top, c.bottom], hit: document.elementFromPoint(c.left + 5, c.top + 5)?.id || document.elementFromPoint(c.left + 5, c.top + 5)?.className }; })()"""))
    b.close()
