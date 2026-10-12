// Vitest setup: a jsdom page with the game's markup, browser APIs the game touches, and the real data files.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(__dirname, '..');
import { DATA } from '../src/js/data.js';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
Element.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, onfinish: null }; };
Element.prototype.getAnimations = () => [];
window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
window.scrollTo = () => {};
HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: false }, configurable: true });

DATA.cards = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/cards.json'), 'utf8')).cards;
DATA.questions = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/questions.json'), 'utf8'));
DATA.knowledge = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/knowledge.json'), 'utf8'));
DATA.daily = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/daily.json'), 'utf8')).scenarios;
const { initAll } = await import('../src/js/app.js');
initAll();
