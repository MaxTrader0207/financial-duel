// Notebook, tutorial, one-time tips, progress backup, deck builder and learning record.
import { test, expect, open, startDuel, answer, until, visible, playToEnd , shortDuel } from './fixtures.js';

test('wrong answers go to the notebook and can be reviewed', async ({ page, errors }) => {
  await open(page); await startDuel(page);
  const ids = [];
  for (let i = 0; i < 2; i++) {
    await until(page, () => ['attack', 'defend'].includes(window.__T.G.phase) && !window.__T.G.busy && document.querySelector('#hand .hand-card:not([disabled])'));
    await page.click('#hand .hand-card:not([disabled]) >> nth=0');
    await answer(page, false); ids.push(await page.evaluate(() => window.__lastQ.id));
  }
  const nb = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('soba-ketto.notebook.v1'))));
  expect(nb.sort()).toEqual([...new Set(ids)].sort());
  await until(page, () => ['attack', 'defend'].includes(window.__T.G.phase) && !window.__T.G.busy);
  await page.click('#btn-quit'); await page.click('#btn-quit');
  await page.click('#btn-nb'); await expect(page.locator('#nb-stats')).toBeVisible();
  await page.click('#nb-review-due');
  await expect(page.locator('#rv-opts button').first()).toBeVisible();
  await page.locator('#rv-opts button').first().click();
  await expect(page.locator('#rv-fb')).toBeVisible();
});

test('tips appear once, and progress exports and imports (bad files are refused)', async ({ page, errors }, info) => {
  await open(page);
  await page.evaluate(() => localStorage.removeItem('soba-ketto.tips.v1')); await page.reload();
  await startDuel(page);
  await page.evaluate(() => { const T = window.__T, G = T.G; T.calc.FOE_BLOCK.normal = 1; G.hand.c = [{ uid: 91001, id: 'sortino_keep' }]; G.hand.p = [{ uid: 91002, id: 'vol_ghost' }]; T.setPhase('attack', '攻擊階段', 't'); });
  await page.click('#hand .hand-card'); await answer(page, true);
  await expect(page.locator('#tipbox')).toContainText('對手也會答題防禦');
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.tips.v1'))).toContain('foeBlock');
  await until(page, () => ['attack', 'defend'].includes(window.__T.G.phase) && !window.__T.G.busy);
  await page.click('#btn-quit'); await page.click('#btn-quit');

  await page.click('#btn-set');
  const dl = page.waitForEvent('download'); await page.click('#prog-export');
  const path = info.outputPath('progress.json'); await (await dl).saveAs(path);
  await page.click('#set-ok');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('soba-ketto.tutorial.v1', 'done'); }); await page.reload();
  await page.click('#btn-set'); await page.setInputFiles('#prog-file', path);
  await expect(page.locator('#prog-apply')).toBeVisible();
  await page.click('#prog-apply'); await Promise.all([page.waitForEvent('load'), page.click('#prog-apply')]);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1' && localStorage.getItem('soba-ketto.tips.v1'));
  expect(await page.evaluate(() => localStorage.getItem('soba-ketto.tips.v1'))).toContain('foeBlock');
  await page.click('#btn-set');
  await page.setInputFiles('#prog-file', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"other"}') });
  await expect(page.locator('#prog-status')).toContainText('不是金融決鬥的進度檔');
});

test('deck builder saves a 40-card deck; the learning record shows finished duels', async ({ page, errors }) => {
  test.setTimeout(240_000);                                           // includes a whole (short) duel
  await open(page); await page.click('#btn-deck');
  await page.click('#deck-clear');
  await expect(page.locator('#deck-status')).toContainText('還差 40 張');
  await page.click('#deck-auto'); await page.click('#deck-save');
  await expect(page.locator('#deck-status')).toContainText('牌組已儲存');
  expect(await page.evaluate(() => window.__T.DECK.length)).toBe(40);
  await page.click('#btn-deck-back');
  await startDuel(page); await shortDuel(page); await playToEnd(page, 0.8);
  await page.goto('./'); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.click('#btn-rec');
  await expect(page.locator('#rec-body')).toContainText(/勝率|場/);
});
