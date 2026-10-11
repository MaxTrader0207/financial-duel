import base64, json
from playwright.sync_api import sync_playwright
from lib import BASE
REC = """
(() => {
  const Base = window.AudioContext;
  window.AudioContext = class extends Base {
    constructor(...a) { super(...a); this.__rec = this.createMediaStreamDestination(); window.__actx = this; }
    get destination() { return this.__rec; }
  };
})();
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page()
    pg.add_init_script(REC)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE); pg.wait_for_timeout(300)
    pg.click('#btn-dex'); pg.click('#btn-dex-back')   # user gesture
    pg.evaluate("""(() => { window.__T.Sound.startBGM();
      const rec = new MediaRecorder(window.__actx.__rec.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
      window.__chunks = []; rec.ondataavailable = e => window.__chunks.push(e.data); rec.start(1000); window.__recorder = rec; })()""")
    log = []
    def mark(label, ms):
        pg.wait_for_timeout(ms); log.append((label, pg.evaluate("window.__T.Sound._debug()")))
    mark('ally 0-45s', 45000)
    pg.evaluate("window.__T.Sound.duck(true)"); mark('thinking 45-60s', 15000)
    pg.evaluate("window.__T.Sound.duck(false); window.__T.Sound.setMood('foe')"); mark('foe 60-95s', 35000)
    pg.evaluate("window.__T.Sound.setMood('ally'); window.__T.Sound.setDanger(true)"); mark('danger 95-125s', 30000)
    data = pg.evaluate("""new Promise(res => { const r = window.__recorder; r.onstop = async () => {
        const blob = new Blob(window.__chunks, { type: 'audio/webm' }); const buf = new Uint8Array(await blob.arrayBuffer());
        let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); res(btoa(s)); }; r.stop(); })""")
    open('bgm_preview.webm', 'wb').write(base64.b64decode(data))
    for l, d in log: print(l, d)
    print('errors', errs)
    b.close()
