import json, sys
from lib import *
mobile = len(sys.argv) > 1 and sys.argv[1] == 'm'; tag = 'm' if mobile else 'd'
R = {}
def wait(pg, js, ms=15000):
    for _ in range(ms // 50):
        if pg.evaluate(js): return True
        pg.wait_for_timeout(50)
    return False
with sync_playwright() as p:
    b, pg, errs = new_page(p, mobile=mobile, skip_tutorial=False)
    R['hint'] = pg.inner_text('#tut-hint')
    pg.screenshot(path=f'shots/tut_{tag}_0_title.png')
    pg.click('#btn-start')
    R['step1'] = wait(pg, "!document.querySelector('#tutor').hidden && document.querySelector('#tut-step').textContent.includes('1 / 3')")
    pg.wait_for_timeout(400); pg.screenshot(path=f'shots/tut_{tag}_1.png')
    pg.click('#hand .hand-card:not([disabled])')
    R['step2'] = wait(pg, "!document.querySelector('#tutor').hidden && document.querySelector('#tut-step').textContent.includes('2 / 3')")
    pg.wait_for_timeout(2500)
    R['timer_held'] = pg.evaluate("document.querySelector('#q-timer-bar').style.transform") == 'scaleX(1)'
    pg.screenshot(path=f'shots/tut_{tag}_2.png')
    pg.click('#tut-ok'); pg.wait_for_timeout(1500)
    R['timer_running_after_ok'] = pg.evaluate("document.querySelector('#q-timer-bar').style.transform") != 'scaleX(1)'
    ans = pg.evaluate("window.__lastQ.options[window.__lastQ.answer]").strip()
    [x for x in pg.query_selector_all('#q-opts .q-opt:not([disabled])') if x.inner_text().split('\n',1)[-1].strip() == ans][0].click()
    pg.wait_for_timeout(200); pg.click('#q-continue')
    R['step3'] = wait(pg, "!document.querySelector('#tutor').hidden && document.querySelector('#tut-step').textContent.includes('3 / 3')", 30000)
    pg.wait_for_timeout(400); pg.screenshot(path=f'shots/tut_{tag}_3.png')
    pg.click('#hand .hand-card:not([disabled])')
    for _ in range(300):
        if vis(pg, '#quiz') and pg.query_selector('#q-opts .q-opt:not([disabled])'): break
        pg.wait_for_timeout(50)
    R['no_hold_on_defense_quiz'] = vis(pg, '#tutor') is False
    pg.query_selector('#q-opts .q-opt:not([disabled])').click(); pg.wait_for_timeout(200); pg.click('#q-continue')
    R['done_flag'] = wait(pg, "localStorage.getItem('soba-ketto.tutorial.v1') === 'done'", 20000)
    R['toast'] = pg.evaluate("(document.querySelector('.toast') || {}).textContent || ''")
    ok, _ = play_to_end(pg, 0.7)
    R['game_finished'] = ok
    pg.click('#btn-home'); pg.wait_for_timeout(200)
    R['hint_after'] = pg.inner_text('#tut-hint')
    # replay from title button, then skip
    pg.click('#btn-tut')
    R['replay_step1'] = wait(pg, "!document.querySelector('#tutor').hidden")
    pg.click('#tut-skip'); pg.wait_for_timeout(200)
    R['skip_hides'] = not vis(pg, '#tutor')
    R['errors'] = [e for e in errs if 'ERR_FAILED' not in e]
    print(json.dumps(R, ensure_ascii=False, indent=1))
    b.close()
