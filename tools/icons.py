"""Renders the app icons (public/icons/*.png) from one SVG with the bundled display font.
    python3 tools/icons.py        (needs Python Playwright + Chromium)"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
FONT = 'file://' + os.path.join(ROOT, 'src/fonts/fd-serif.woff2')
def svg(pad):
    # pad = share of the canvas kept clear around the seal (maskable icons need ~10 % per side)
    s = 100 - 2 * pad
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7de"/><stop offset=".5" stop-color="#f3dc95"/><stop offset="1" stop-color="#c8943a"/></linearGradient>
  <pattern id="w" width="10" height="5" patternUnits="userSpaceOnUse"><path d="M0 5a5 5 0 0 1 10 0M2 5a3 3 0 0 1 6 0" fill="none" stroke="#1b2a66" stroke-width=".7"/></pattern></defs>
  <rect width="100" height="100" fill="#0b1230"/><rect y="70" width="100" height="30" fill="url(#w)" opacity=".9"/>
  <g transform="translate({pad} {pad}) scale({s / 100})">
    <g transform="rotate(-6 50 50)"><rect x="12" y="12" width="76" height="76" rx="6" fill="#e14b32"/><rect x="17" y="17" width="66" height="66" rx="3.5" fill="none" stroke="#fff3ea" stroke-width="1.8" opacity=".85"/>
    <text x="50" y="69.5" text-anchor="middle" font-family="FD Serif" font-weight="900" font-size="54" fill="#fff3c4">金</text></g>
  </g></svg>'''
SIZES = [('icon-192.png', 192, 0), ('icon-512.png', 512, 0), ('maskable-512.png', 512, 14), ('apple-touch-icon.png', 180, 4), ('favicon-32.png', 32, 0)]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for name, px, pad in SIZES:
        pg.set_viewport_size({'width': px, 'height': px})
        pg.set_content(f'<style>@font-face{{font-family:"FD Serif";src:url("{FONT}");font-weight:600 900}}html,body{{margin:0;background:#0b1230}}</style>{svg(pad)}')
        pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(ROOT, 'public/icons', name), clip={'x': 0, 'y': 0, 'width': px, 'height': px})
        print(name, px)
    b.close()
