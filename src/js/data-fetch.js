// data-fetch.js — GitHub Pages / dev server: read the JSON files next to index.html at start-up
async function fetchJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url} 讀取失敗（${r.status}）`);
  return r.json();
}
export async function loadSources() {
  const base = import.meta.env.BASE_URL;
  const [cards, questions, daily] = await Promise.all([fetchJSON(base + 'data/cards.json'), fetchJSON(base + 'data/questions.json'),
    fetchJSON(base + 'data/daily.json').catch(() => null)]);
  return { cards, questions, daily };
}
