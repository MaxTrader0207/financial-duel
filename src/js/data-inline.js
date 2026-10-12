// data-inline.js — single-file builds (claude.ai artifact, standalone): the same JSON files bundled into the page
import cards from '../../public/data/cards.json';
import questions from '../../public/data/questions.json';
export async function loadSources() { return { cards, questions }; }
