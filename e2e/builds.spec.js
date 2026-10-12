// The single-file builds open by double-click (file://) with cards, questions and jsPDF all present.
import { test, expect } from './fixtures.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const [name, file] of [['artifact', 'artifact/index.html'], ['standalone', 'standalone/index.html']]) {
  test(`the ${name} single file opens from disk`, async ({ page, errors }) => {
    const p = resolve(file);
    test.skip(!existsSync(p), `run npm run build:all first (${file} missing)`);
    await page.goto('file://' + p);
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.click('#btn-start');
    await expect(page.locator('#hand .hand-card').first()).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => !!document.querySelector('link[rel=manifest]'))).toBe(false);   // never installable
    if (name === 'standalone') expect(await page.evaluate(() => new Promise(r => { const s = document.createElement('script'); s.src = 'vendor/jspdf.umd.min.js'; s.onload = () => r(typeof window.jspdf); s.onerror = () => r('missing'); document.head.appendChild(s); }))).toBe('object');
  });
}
