import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
import pwa from './tools/pwa-plugin.js';
import { execSync } from 'node:child_process';
const here = p => fileURLToPath(new URL(p, import.meta.url));
/* build stamp shown in 版本資訊: when this build was made and from which commit */
const commit = (() => { try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } })();
const BUILD = { time: new Date().toISOString(), commit };

// npm run build             → dist/        GitHub Pages: index.html + assets/ + data/*.json loaded at runtime
// npm run build:artifact    → artifact/    one self-contained HTML file for claude.ai (data inlined, jsPDF from cdnjs)
// npm run build:standalone  → standalone/  one HTML file that opens by double-click, with vendor/jspdf next to it
// npm run build:test        → dist-test/   Pages layout plus window.__T hooks for the Playwright scripts
export default defineConfig(({ mode }) => {
  const single = mode === 'artifact' || mode === 'standalone';
  return {
    base: './',
    publicDir: single ? false : 'public',
    resolve: { alias: { '@data-source': here(single ? './src/js/data-inline.js' : './src/js/data-fetch.js') } },
    build: {
      outDir: { artifact: 'artifact', standalone: 'standalone', test: 'dist-test' }[mode] || 'dist',
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: single ? 100000000 : 4096,
    },
    define: { __PWA__: JSON.stringify(!single), __BUILD__: JSON.stringify(BUILD), __API__: JSON.stringify(process.env.VITE_API || 'https://financial-duel-api.maxwei6699.workers.dev') },     // installable web app + offline cache only for the Pages build
    plugins: single ? [viteSingleFile()] : [pwa()],
    test: { environment: 'jsdom', include: ['tests/**/*.test.js'], setupFiles: ['tests/setup.js'] },
  };
});
