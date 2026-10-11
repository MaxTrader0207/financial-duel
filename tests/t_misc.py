import json, time, random
from lib import *
random.seed(5)
def state(pg):
    return pg.evaluate("(() => { const G = window.__T.G; return { turn: G.turn, phase: G.phase, lp: G.lp, hand: G.hand.p.map(i => i.id), handC: G.hand.c.length, deck: G.deck.p.length, hist: G.history.length, foe: G.foeCard && G.foeCard.id, used: G.used.size, streak: G.streak }; })()")
def until(pg, cond, acc=0.7, limit=120):
    t0 = time.time()
    while time.time() - t0 < limit:
        if pg.evaluate(cond): return True
        step(pg, acc); pg.wait_for_timeout(80)
    return False
res = {}
with sync_playwright() as p:
    b, pg, errs = new_page(p)
    # ---- save / resume in attack phase
    pg.click('#btn-start')
    until(pg, "window.__T.G.turn >= 2 && window.__T.G.phase === 'attack' && !window.__T.G.busy")
    pg.wait_for_timeout(300)
    s1 = state(pg)
    res['save_btn_enabled_attack'] = pg.is_enabled('#btn-save')
    pg.click('#btn-save'); pg.wait_for_timeout(300)
    res['title_after_save'] = vis(pg, '#scr-title'); res['resume_box'] = vis(pg, '#resume')
    pg.reload(); pg.wait_for_timeout(400)
    res['resume_box_after_reload'] = vis(pg, '#resume')
    pg.screenshot(path='shots/resume_box.png', clip={'x':0,'y':0,'width':1280,'height':860})
    if not res['resume_box_after_reload']:
        print('DIAG', s1, res, pg.evaluate("localStorage.getItem('soba-ketto.save.v1') ? 'has save' : 'no save'"), pg.evaluate("document.querySelector('#scr-title').hidden"), [e for e in errs if 'ERR_FAILED' not in e]); raise SystemExit
    pg.click('#btn-resume')
    until(pg, "window.__T.G && window.__T.G.phase === 'attack'", limit=20)
    s2 = state(pg)
    res['attack_resume_match'] = {k: (s1[k], s2[k]) for k in s1 if s1[k] != s2[k]} or 'identical'
    # ---- save / resume in defend phase
    until(pg, "window.__T.G.phase === 'defend' && !window.__T.G.busy")
    pg.wait_for_timeout(300)
    s3 = state(pg)
    pg.click('#btn-save'); pg.wait_for_timeout(200); pg.reload(); pg.wait_for_timeout(300)
    pg.click('#btn-resume')
    until(pg, "window.__T.G && window.__T.G.phase === 'defend'", limit=20)
    s4 = state(pg)
    res['defend_resume_match'] = {k: (s3[k], s4[k]) for k in s3 if s3[k] != s4[k]} or 'identical'
    res['foe_card_on_field'] = pg.evaluate("!!document.querySelector('#slot-c .card')")
    # save button disabled during quiz
    pg.click('#hand .hand-card:not([disabled])'); pg.wait_for_timeout(700)
    res['save_btn_disabled_in_quiz'] = not pg.is_enabled('#btn-save')
    # ---- finish and export
    ok, _ = play_to_end(pg, 0.75)
    res['finished'] = ok
    res['save_cleared_after_end'] = pg.evaluate("localStorage.getItem('soba-ketto.save.v1') === null")
    for kind in ('png', 'pdf'):
        with pg.expect_download(timeout=60000) as dl:
            pg.click(f'#btn-{kind}')
        d = dl.value; path = f'shots/report.{kind}'; d.save_as(path); res[f'export_{kind}'] = d.suggested_filename
    res['export_status'] = pg.inner_text('#export-result-status')
    # ---- play-time: 30-min reminder
    pg.evaluate("(() => { const s = JSON.parse(localStorage.getItem('soba-ketto.playtime.v1')); s.acc = 1795; s.last = Date.now(); s.reminded = false; localStorage.setItem('soba-ketto.playtime.v1', JSON.stringify(s)); })()")
    pg.reload(); pg.wait_for_timeout(11000)
    res['care_shown'] = vis(pg, '#care')
    pg.screenshot(path='shots/care.png')
    pg.click('#care-ok')
    # ---- 60-min forced rest, triggered mid-duel at a safe point
    pg.click('#btn-start')
    until(pg, "window.__T.G.phase === 'attack' && !window.__T.G.busy", limit=30)
    pg.evaluate("window.__T.PT.acc = 3598; window.__T.PT.last = Date.now();")
    pg.wait_for_timeout(11000)
    res['rest_shown'] = vis(pg, '#rest')
    res['save_written_on_rest'] = pg.evaluate("!!localStorage.getItem('soba-ketto.save.v1')")
    pg.screenshot(path='shots/rest.png')
    pg.reload(); pg.wait_for_timeout(600)
    res['rest_survives_reload'] = vis(pg, '#rest')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    res['duel_blocked_during_rest'] = not vis(pg, '#scr-duel')
    pg.evaluate("(() => { const s = JSON.parse(localStorage.getItem('soba-ketto.playtime.v1')); s.lockUntil = Date.now() + 3000; localStorage.setItem('soba-ketto.playtime.v1', JSON.stringify(s)); })()")
    pg.reload(); pg.wait_for_timeout(9000)
    res['rest_done_button'] = vis(pg, '#rest-done')
    if res['rest_done_button']: pg.click('#rest-done'); pg.wait_for_timeout(300)
    res['unlocked'] = not vis(pg, '#rest') and vis(pg, '#scr-title')
    res['resume_after_rest'] = vis(pg, '#resume')
    res['errors'] = [e for e in errs if 'ERR_FAILED' not in e]
    print(json.dumps(res, ensure_ascii=False, indent=1))
    b.close()
