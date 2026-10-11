from t_misc_helpers import *
with sync_playwright() as p:
    b, pg, errs = new_page(p)
    pg.click('#btn-start')
    until(pg, "window.__T.G.phase === 'attack' && !window.__T.G.busy")
    bg1 = pg.evaluate("document.body.dataset.bg || 'wave'"); lab1 = pg.inner_text('#bg-label')
    pg.click('#btn-save'); pg.wait_for_timeout(300)
    title_clear = pg.evaluate("!document.body.dataset.bg")
    pg.reload(); pg.wait_for_timeout(300)
    if not vis(pg, '#resume'):
        print('NO RESUME', pg.evaluate("localStorage.getItem('soba-ketto.save.v1') ? JSON.parse(localStorage.getItem('soba-ketto.save.v1')).phase : 'none'"), vis(pg,'#scr-title'), vis(pg,'#rest'), vis(pg,'#care')); raise SystemExit
    pg.click('#btn-resume')
    until(pg, "window.__T.G && window.__T.G.phase === 'attack'", limit=20)
    print({'bg_before': bg1, 'label': lab1, 'cleared_on_title': title_clear, 'bg_after_resume': pg.evaluate("document.body.dataset.bg || 'wave'"), 'errors': [e for e in errs if 'ERR_FAILED' not in e]})
    b.close()
