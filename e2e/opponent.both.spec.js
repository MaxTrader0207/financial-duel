// The opponent answers its block question on screen (desktop: over the field; phone: over the whole screen).
import { test, expect, open, startDuel, answer, until } from './fixtures.js';

test.use({ fastWaits: false });               // the panel must stay up long enough to be read

async function attackWithForcedBlock(page, rate, lpC) {
  await page.evaluate(([rate, lp]) => { const T = window.__T, G = T.G; T.calc.FOE_BLOCK.normal = rate;
    G.foeProf = { strong: ['fx', 'etf'], weak: ['crypto', 'fund'] }; T.renderAll();
    G.hand.c = [{ uid: 92001, id: 'sortino_keep' }]; G.hand.p = [{ uid: 92002, id: 'gamma_tyrant' }, { uid: 92003, id: 'genesis_dragon' }]; G.lp.c = lp;
    T.setPhase('attack', '攻擊階段', 't'); }, [rate, lpC]);
  await page.click('#hand .hand-card >> nth=0');
  await answer(page, true);
  await expect(page.locator('#foe-quiz')).toBeVisible();
  await expect(page.locator('#foe-quiz .fq-opts li')).toHaveCount(4);
  await expect(page.locator('#foe-quiz li.ok, #foe-quiz li.ng')).toHaveCount(1);
}

test('the opponent answers wrong: the right answer is shown and the result screen counts it', async ({ page, errors }) => {
  await open(page); await startDuel(page);
  await expect(page.locator('#foe-prof')).toContainText('擅長');
  await attackWithForcedBlock(page, 0, 800);                         // 0 % (clamped to 5 %): almost always wrong
  const q = await page.evaluate(() => window.__lastFoeQ);
  if (!q.ok) {
    await expect(page.locator('#foe-quiz li.right')).toHaveCount(1);
    await expect(page.locator('#foe-quiz .fq-foot')).toContainText('正解');
    await until(page, () => window.__T.G.over && !document.querySelector('#scr-result').hidden);
    await expect(page.locator('.foe-line')).toContainText('對手防禦答題 0/1');
  }
  expect(await page.evaluate(() => window.__T.G.fsm.violations)).toEqual([]);
});

test('the opponent answers right and blocks; its weak attributes are tagged in the hand', async ({ page, errors }) => {
  await open(page); await startDuel(page);
  await attackWithForcedBlock(page, 1, 10000);                       // 100 % (clamped to 95 %)
  const q = await page.evaluate(() => window.__lastFoeQ);
  if (q.ok) await expect(page.locator('#foe-quiz .fq-foot')).toContainText('對手答對');
  await until(page, () => window.__T.G.phase === 'defend', { timeout: 30_000 });
  await page.evaluate(() => { const T = window.__T; T.G.hand.p = ['onchain_whale', 'pe_sage', 'ma_samurai'].map((id, i) => ({ uid: 93000 + i, id })); T.setPhase('attack', '攻擊階段', 't'); });
  await expect(page.locator('#hand .tag-foe')).toHaveCount(2);
});
