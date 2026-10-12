// The 教學對戰 from start to finish: every coach mark in order, the suggested cards, the scripted opponent miss
// and the guaranteed 相剋 card, 初階 questions only, and the tutorial marked done at the end.
import { test, expect, open, answer, until } from './fixtures.js';

test.use({ tutorialDone: false });
test.describe.configure({ timeout: 180_000 });

const step = page => page.locator('#tutor').getAttribute('data-step');
const suggested = page => page.evaluate(() => (document.getElementById('tut-suggest-style')?.textContent.match(/data-uid="(\d+)"/) || [])[1]);
async function waitStep(page, id) { await expect(page.locator('#tutor')).toBeVisible(); await expect.poll(() => step(page)).toBe(id); }

test('a first-time player is walked through a whole tutorial duel', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#tut-hint')).toContainText('新手場');
  await page.click('#btn-start');

  await waitStep(page, 'goal');
  await expect(page.locator('#tut-step')).toHaveText('新手引導 1 / 8');
  expect(await page.evaluate(() => [window.__T.G.diff.name, window.__T.G.lp.c])).toEqual(['簡易', 5000]);
  await page.click('#tut-ok');

  await waitStep(page, 'hand');
  const uid = await suggested(page);
  expect(uid).toBe(String(await page.evaluate(() => window.__T.G.hand.p.reduce((a, b) => window.__T.MON[b.id].atk > window.__T.MON[a.id].atk ? b : a).uid)));
  await until(page, () => window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click(`#hand .hand-card[data-uid="${uid}"]`);

  await waitStep(page, 'quiz');                                         // the timer waits for 開始計時
  await expect(page.locator('#tut-ok')).toHaveText('開始計時');
  expect(await page.evaluate(() => window.__lastQ.difficulty)).toBe(1);
  await page.click('#tut-ok');
  await answer(page, true).catch(() => {});                            // answer() also presses 繼續; the feedback step comes first
  await expect.poll(() => page.evaluate(() => window.__T.G.tutorial && window.__T.G.history.length)).toBe(1);

  await expect.poll(() => step(page), { timeout: 15_000 }).toBe('foe');  // feedback was shown (and closed by 繼續), then the opponent answers
  await expect(page.locator('#foe-quiz li.ng')).toHaveCount(1);         // the scripted miss
  await page.click('#tut-ok');

  await until(page, () => window.__T.G.phase === 'defend' && !window.__T.G.busy, { timeout: 30_000 });
  await waitStep(page, 'defend');
  const duid = await suggested(page);
  await expect(page.locator(`#hand .hand-card[data-uid="${duid}"] .tag-adv`)).toContainText('相剋');
  await page.click(`#hand .hand-card[data-uid="${duid}"]`);
  await answer(page, true);

  await waitStep(page, 'skill'); await page.click('#tut-ok');
  await waitStep(page, 'done');
  await expect(page.locator('#tut-text')).toContainText('錯題本');
  await page.click('#tut-ok');
  await expect(page.locator('#tutor')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.tutorial.v1'))).toBe('done');
  expect(await page.evaluate(() => window.__T.G.fsm.violations)).toEqual([]);
});

test('the feedback step explains the 錯題本 before the attack resolves', async ({ page, errors }) => {
  await open(page); await page.click('#btn-start');
  await waitStep(page, 'goal'); await page.click('#tut-ok');
  await waitStep(page, 'hand');
  await until(page, () => window.__T.G.phase === 'attack' && !window.__T.G.busy);
  await page.click('#hand .hand-card >> nth=0');
  await waitStep(page, 'quiz'); await page.click('#tut-ok');
  await until(page, () => document.querySelector('#q-opts .q-opt:not([disabled])'));
  await page.locator('#q-opts .q-opt').first().dispatchEvent('click');
  await waitStep(page, 'feedback');
  await expect(page.locator('#tut-text')).toContainText('錯題本');
  await page.click('#tut-ok'); await expect(page.locator('#tutor')).toBeHidden();
});

test('skipping ends the tutorial and keeps it skippable for good', async ({ page, errors }) => {
  await open(page); await page.click('#btn-start');
  await waitStep(page, 'goal');
  await page.click('#tut-skip');
  await expect(page.locator('#tutor')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.tutorial.v1'))).toBe('done');
  await expect(page.locator('.toast')).toContainText('新手引導');
});
