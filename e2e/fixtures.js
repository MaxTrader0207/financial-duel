// Shared fixtures and helpers for the browser tests.
//  • every page: Google Fonts blocked (the game must not depend on them), tutorial marked done,
//    and console errors / page errors collected — a test fails if any appear (see `errors`).
//  • helpers drive a duel the way a player would: play a card, answer right or wrong, continue.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  tutorialDone: [true, { option: true }],
  fastWaits: [true, { option: true }],      // test build: every in-game wait ≤ 15 ms (see core.js sleep)
  errors: async ({ page }, use) => {
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await use(errs);
    expect(errs, 'no errors in the page').toEqual([]);
  },
  page: async ({ page, tutorialDone, fastWaits }, use) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    /* the real server is never called: usage pings are answered here, everything else fails (a spec may route it) */
    await page.route(/financial-duel-api\./, r => {
      const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' };
      if (new URL(r.request().url()).pathname !== '/v1/ping') return r.abort();
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: '{"ok":true,"days":1}' });
    });
    if (fastWaits) await page.addInitScript(() => { try { localStorage.setItem('soba-ketto.e2e.fast', '1'); } catch (e) {} });
    if (tutorialDone) await page.addInitScript(() => { try { localStorage.setItem('soba-ketto.tutorial.v1', 'done'); } catch (e) {} });
    await use(page);
  },
});
export { expect };

export async function open(page, path = './') {
  await page.goto(path);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
}
export const T = (page, fn, arg) => page.evaluate(fn, arg);           // run code against window.__T
export const visible = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && !e.closest('[hidden]'); }, sel);
export async function until(page, fn, { timeout = 30_000, arg } = {}) {
  await page.waitForFunction(fn, arg, { timeout, polling: 50 });
}
export async function startDuel(page) {
  await page.click('#btn-start');
  await until(page, () => window.__T.G && window.__T.G.phase === 'attack' && !window.__T.G.busy);
}
/* answer the open question right (or wrong) */
export async function answer(page, right = true) {
  await until(page, () => !document.querySelector('#quiz').hidden && document.querySelector('#q-opts .q-opt:not([disabled])'));
  const i = await page.evaluate(right => {
    const ans = window.__lastQ.options[window.__lastQ.answer].trim();
    const opts = [...document.querySelectorAll('#q-opts .q-opt')].map(b => b.lastElementChild.textContent.trim());
    const pick = opts.map((t, i) => [t, i]).filter(([t]) => (t === ans) === right);
    return pick.length ? pick[Math.floor(Math.random() * pick.length)][1] : 0;
  }, right);
  /* a DOM click: the options pop in with a tiny layout shift that makes Playwright wait ~0.5 s for "stable" each time */
  await page.locator('#q-opts .q-opt').nth(i).dispatchEvent('click');
  await until(page, () => !document.querySelector('#q-feedback').hidden);
  await page.locator('#q-continue').dispatchEvent('click');
}
/* one step of a duel: answers with accuracy `acc`; returns what it did. One round trip reads the whole screen state. */
const SCREEN = () => {
  const vis = s => { const e = document.querySelector(s); return !!e && !e.hidden && !e.closest('[hidden]'); };
  if (vis('#scr-result')) return 'result';
  if (vis('#care')) return 'care';
  if (vis('#quiz')) return vis('#q-feedback') ? 'feedback' : document.querySelector('#q-opts .q-opt:not([disabled])') ? 'options' : 'wait';
  const G = window.__T.G;
  if (G && !G.busy && (G.phase === 'attack' || G.phase === 'defend') && document.querySelector('#hand .hand-card:not([disabled])')) return 'play';
  return 'wait';
};
export async function step(page, acc = 0.7) {
  const s = await page.evaluate(SCREEN);
  if (s === 'care') await page.click('#care-ok');
  else if (s === 'feedback') await page.locator('#q-continue').dispatchEvent('click');
  else if (s === 'options') await answer(page, Math.random() < acc);
  else if (s === 'play') { const hand = page.locator('#hand .hand-card:not([disabled])'); const n = await hand.count(); if (n) await hand.nth(Math.floor(Math.random() * n)).dispatchEvent('click'); }
  return s;
}
export async function playToEnd(page, acc = 0.7, { limit = 280_000, until: stop } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < limit) {
    if (stop && await page.evaluate(stop)) return 'stopped';
    const s = await step(page, acc);
    if (s === 'result') return s;
    await page.waitForTimeout(s === 'wait' ? 50 : 30);
  }
  throw new Error('duel did not finish in time');
}
/* shorter duels for tests that only need "a duel that ends": both sides start with less money */
export const shortDuel = (page, lp = 4000) => page.evaluate(lp => { window.__T.G.lp.p = window.__T.G.lp.c = lp; window.__T.renderAll(); }, lp);
export const fsmViolations = page => page.evaluate(() => window.__T.G.fsm.violations);
