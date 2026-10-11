import json, time, random
from lib import *
random.seed(9)
R = {}
def wrong_answer(pg):
    for _ in range(200):
        if vis(pg, '#quiz') and pg.query_selector('#q-opts .q-opt:not([disabled])'): break
        pg.wait_for_timeout(40)
    ans = pg.evaluate("window.__lastQ.options[window.__lastQ.answer]").strip()
    while not vis(pg, '#q-feedback'):
        btns = [b for b in pg.query_selector_all('#q-opts .q-opt:not([disabled])') if b.inner_text().split('\n',1)[-1].strip() != ans]
        btns[0].click(); pg.wait_for_timeout(150)
with sync_playwright() as p:
    b, pg, errs = new_page(p)
    pg.click('#btn-start')
    # 1) three wrong answers go into the notebook
    wrong_ids = []
    for i in range(3):
        for _ in range(300):
            if pg.evaluate("window.__T.G.phase") in ('attack', 'defend') and pg.query_selector('#hand .hand-card:not([disabled])'): break
            pg.wait_for_timeout(50)
        pg.click('#hand .hand-card:not([disabled])')
        wrong_answer(pg)
        wrong_ids.append(pg.evaluate("window.__lastQ.id"))
        if i == 0:
            R['feedback_note'] = pg.inner_text('#q-explain').split('\n')[-1]
            # 2) report this question
            pg.click('#q-report-open'); pg.click('#q-report-reasons label:nth-child(4)')
            pg.fill('#q-report-note', '測試回報：規定可能已更新')
            pg.keyboard.press('Enter')  # Enter inside textarea must not close the quiz
            R['enter_in_textarea_kept_quiz'] = vis(pg, '#quiz')
            pg.click('#q-report-send'); pg.wait_for_timeout(100)
            R['report_status'] = pg.inner_text('#q-report-status')
            pg.screenshot(path='shots/report_form.png')
        pg.click('#q-continue')
    nb = pg.evaluate("JSON.parse(localStorage.getItem('soba-ketto.notebook.v1'))")
    R['nb_entries_after_3_wrong'] = sorted(nb.keys()) == sorted(set(wrong_ids))
    # surrender back to title
    for _ in range(300):
        if pg.evaluate("window.__T.G.phase") in ('attack','defend') and not pg.evaluate("window.__T.G.busy"): break
        pg.wait_for_timeout(50)
    pg.click('#btn-quit'); pg.click('#btn-quit'); pg.wait_for_timeout(300)
    R['badge'] = pg.inner_text('#nb-badge') if vis(pg, '#nb-badge') else 'hidden'
    # 3) notebook page and review
    pg.click('#btn-nb'); pg.wait_for_timeout(200)
    R['nb_stats'] = pg.inner_text('#nb-stats').replace('\n', ' ')
    pg.screenshot(path='shots/notebook.png', full_page=True)
    pg.click('#nb-review-due'); pg.wait_for_timeout(200)
    pg.screenshot(path='shots/review.png')
    n = 0
    while vis(pg, '#rv-opts') and pg.query_selector('#rv-opts .q-opt'):
        qid = pg.evaluate("(() => { const t = document.querySelector('#rv-q').textContent; return t; })()")
        # answer correctly by looking up the question text
        ans = pg.evaluate("(() => { const t = document.querySelector('#rv-q').textContent; const all = JSON.parse(document.getElementById('builtin-bank').textContent).questions; const q = all.find(x => x.q === t); return q.options[q.answer]; })()")
        btn = [b for b in pg.query_selector_all('#rv-opts .q-opt') if b.inner_text().split('\n',1)[-1].strip() == ans][0]
        btn.click(); pg.wait_for_timeout(100); n += 1
        pg.keyboard.press('Enter'); pg.wait_for_timeout(100)
    R['reviewed'] = n; R['review_end_text'] = pg.inner_text('#rv-q')
    pg.click('#rv-done'); pg.wait_for_timeout(100)
    R['nb_stats_after_review'] = pg.inner_text('#nb-stats').replace('\n', ' ')
    nb = pg.evaluate("JSON.parse(localStorage.getItem('soba-ketto.notebook.v1'))")
    R['boxes_after_review'] = sorted(v['box'] for v in nb.values())
    # 4) time travel: make them due again, answer correct twice more -> mastered
    for rnd in range(2):
        pg.evaluate("(() => { const nb = JSON.parse(localStorage.getItem('soba-ketto.notebook.v1')); Object.values(nb).forEach(e => e.due = Date.now() - 1000); localStorage.setItem('soba-ketto.notebook.v1', JSON.stringify(nb)); })()")
        pg.reload(); pg.wait_for_timeout(300); pg.click('#btn-nb'); pg.click('#nb-review-due'); pg.wait_for_timeout(150)
        while pg.query_selector('#rv-opts .q-opt'):
            ans = pg.evaluate("(() => { const t = document.querySelector('#rv-q').textContent; const all = JSON.parse(document.getElementById('builtin-bank').textContent).questions; const q = all.find(x => x.q === t); return q.options[q.answer]; })()")
            [b for b in pg.query_selector_all('#rv-opts .q-opt') if b.inner_text().split('\n',1)[-1].strip() == ans][0].click()
            pg.wait_for_timeout(80); pg.click('#rv-next'); pg.wait_for_timeout(80)
        pg.click('#rv-done')
    R['nb_stats_final'] = pg.inner_text('#nb-stats').replace('\n', ' ')
    # 5) bank page shows the report
    pg.click('#btn-nb-back'); pg.click('#btn-bank'); pg.wait_for_timeout(200)
    R['reports_listed'] = pg.inner_text('#rp-count')
    # 6) due notebook questions get mixed into duels
    pg.evaluate("""(() => { const all = JSON.parse(document.getElementById('builtin-bank').textContent).questions; const nb = {};
      all.slice(0, 120).forEach(q => nb[q.id] = { box: 1, wrong: 1, right: 0, due: 0, last: 0, added: 0, mastered: false });
      localStorage.setItem('soba-ketto.notebook.v1', JSON.stringify(nb)); })()""")
    pg.reload(); pg.wait_for_timeout(300)
    pg.click('#btn-start')
    metas = []
    def on(pg, s, n):
        if vis(pg, '#quiz') and not vis(pg, '#q-feedback'):
            m = pg.inner_text('#q-meta')
            if not metas or metas[-1] != m: metas.append(m)
    play_to_end(pg, 0.7, on_step=on)
    h = pg.evaluate("window.__T.G.history.map(x => !!x.fromNb)")
    R['questions_in_duel'] = len(h); R['from_notebook'] = sum(h)
    R['result_banner'] = vis(pg, '.nb-banner')
    R['errors'] = [e for e in errs if 'ERR_FAILED' not in e]
    print(json.dumps(R, ensure_ascii=False, indent=1))
    b.close()
