// pwa-plugin.js — makes the GitHub Pages build an installable, offline web app.
//  • adds the manifest, icons and theme-color tags to index.html
//  • after the build, writes sw.js listing every output file, versioned by a hash of their contents
// Single-file builds (artifact, standalone) do not use it: they have no server to install from.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE = fileURLToPath(new URL('./sw-template.js', import.meta.url));
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

export default function pwa() {
  let outDir;
  return {
    name: 'fd-pwa',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; if (!outDir.startsWith('/')) outDir = join(c.root, outDir); },
    transformIndexHtml(html) {
      return html.replace('</head>', `<link rel="manifest" href="./manifest.webmanifest">
<meta name="theme-color" content="#0b1230">
<link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32.png">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="金融決鬥">
</head>`);
    },
    closeBundle() {
      const files = walk(outDir).map(p => relative(outDir, p).split(sep).join('/'))
        .filter(f => f !== 'sw.js' && !f.endsWith('.txt') && !f.endsWith('.map')).sort();
      const h = createHash('sha256'); files.forEach(f => { h.update(f); h.update(readFileSync(join(outDir, f))); });
      const version = h.digest('hex').slice(0, 12);
      const sw = readFileSync(TEMPLATE, 'utf8').replace('__VERSION__', version).replace('__FILES__', JSON.stringify(['./', ...files], null, 1));
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`sw.js: ${files.length} files cached, version ${version}`);
    },
  };
}
