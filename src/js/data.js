// data.js — card and question data, loaded once before any module initialises.
// '@data-source' is data-fetch.js (GitHub Pages: data/*.json can be edited without rebuilding)
// or data-inline.js (single-file builds), chosen in vite.config.js.
import { loadSources } from '@data-source';

export const DATA = { cards: null, questions: null };

export async function loadData() {
  try {
    const { cards, questions } = await loadSources();
    DATA.cards = cards.cards; DATA.questions = questions;
    if (!Array.isArray(DATA.cards) || !DATA.cards.length) throw new Error('cards.json 沒有卡牌');
    if (!DATA.questions || !Array.isArray(DATA.questions.questions)) throw new Error('questions.json 格式不符');
  } catch (e) {
    document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;display:grid;place-items:center;background:#0d1230;color:#eceaf6;font:16px sans-serif;padding:24px;text-align:center;z-index:999">遊戲資料載入失敗：${String(e.message || e)}<br>請確認 data 資料夾與 index.html 放在一起，並透過網頁伺服器開啟。</div>`);
    throw e;
  }
}
