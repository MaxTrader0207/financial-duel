// Fast ranked-ladder model: replays seasons by sampling real simulated duels (sim/out/table-<player>.json, made by
// table.sim.js) instead of playing new ones, so the scoring rules can be tuned in seconds.
//   node sim/ladder-model.mjs            → current rules from src/js/rankrules.js
import { readFileSync, existsSync } from 'node:fs';
import { TIERS, tierOf, scoreMatch } from '../src/js/rankrules.js';

const PLAYERS = ['新手', '普通', '用功', '高手', '專家'];
const RUNS = 400, CHECK = [20, 50, 100, 200];
const tables = Object.fromEntries(PLAYERS.filter(p => existsSync(`sim/out/table-${p}.json`)).map(p => [p, JSON.parse(readFileSync(`sim/out/table-${p}.json`, 'utf8'))]));

console.log('勝率／平均表現（對手等級）');
for (const [p, t] of Object.entries(tables))
  console.log(p.padEnd(3, '　'), Object.entries(t).map(([lv, g]) => `${lv} ${Math.round(g.filter(x => x[0]).length / g.length * 100)}%/${Math.round(g.reduce((s, x) => s + x[1], 0) / g.length)}`).join('  '));

const pick = a => a[Math.floor(Math.random() * a.length)];
console.log('\n賽季中位數段位（積分）');
for (const [p, t] of Object.entries(tables)) {
  const at = CHECK.map(() => []);
  for (let r = 0; r < RUNS; r++) {
    let rp = 0;
    for (let g = 1; g <= CHECK[CHECK.length - 1]; g++) {
      const [win, perf] = pick(t[TIERS[tierOf(rp)].level]);
      rp = scoreMatch(rp, !!win, perf).after;
      const k = CHECK.indexOf(g); if (k >= 0) at[k].push(rp);
    }
  }
  console.log(p.padEnd(3, '　'), CHECK.map((g, k) => { const v = at[k].sort((a, b) => a - b), q = f => v[Math.floor(v.length * f)];
    return `${g}場 ${TIERS[tierOf(q(0.5))].name}(${q(0.5)}, ${q(0.1)}–${q(0.9)})`; }).join(' · '));
}
