import { defineConfig } from 'vitest/config';
import base from './vite.config.js';
// npm run sim: same environment as the unit tests, but only the simulations in sim/
export default defineConfig(env => { const c = base(env); c.test = { ...c.test, include: ['sim/**/*.sim.js'], testTimeout: 3600_000 }; return c; });
