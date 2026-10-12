// main.js — entry point: load card and question data, then start every module
import { loadData } from './data.js';
import { initAll } from './app.js';

await loadData();
initAll();
if (import.meta.env.MODE === 'test') await import('./debug.js');
document.documentElement.dataset.ready = '1';
