// debug.js — test build only (vite --mode test): exposes internals to the Playwright scripts as window.__T.
import * as state from './state.js';
import * as game from './game.js';
import * as board from './board.js';
import * as cards from './cards.js';
import { SKILLS } from './skills.js';
import { DATA } from './data.js';
import { DIFFS, foeAtkOf, SET, Store } from './core.js';
import { startDuel, onPlay, cpuTurn, playerTurn, resumeDuel, renderMarket } from './flow.js';
import { saveGame, readSave, migrateSave } from './save.js';
import { makeReport } from './report.js';
import * as pt from './playtime.js';
import { Sound } from './sound.js';
import { BG } from './backgrounds.js';
import { placeField, clearField } from './fx.js';
import * as col from './collection.js';
import * as rec from './records.js';
import { advOf } from './rules.js';
import { cpuPick, cpuScore } from './ai.js';
import { renderRecord } from './recordui.js';
import { openDeck } from './deckui.js';
import { openZoom } from './wiring.js';
import * as fsm from './fsm.js';
import * as calc from './calc.js';
import * as daily from './daily.js';
import { openDaily, renderDailyCard } from './dailyui.js';
import * as knowledge from './knowledge.js';
import { openKnow } from './knowledgeui.js';
import * as ranked from './ranked.js';
import * as market from './market.js';
import { openRanked } from './rankedui.js';
import * as online from './online.js';
import { openBoard } from './boardui.js';
import * as usage from './usage.js';
import * as challenge from './challenge.js';
import { openChallenge } from './challengeui.js';
import * as sharecard from './sharecard.js';
import * as version from './version.js';
import * as nbexport from './nbexport.js';
import * as treeui from './treeui.js';
import * as skilltree from './skilltree.js';
import * as notebook from './notebook.js';



window.__T = {
  get G() { return game.G; }, get MON() { return cards.MON; }, SKILLS, get MONSTERS() { return cards.MONSTERS; }, get CATS() { return cards.CATS; }, get DIFFS() { return DIFFS; },
  startDuel, onPlay, saveGame, readSave, resumeDuel, makeReport, get PT() { return pt.PT; }, Sound, get BG() { return BG; },
  ptTick: pt.ptTick, startRest: pt.startRest, foeAtkOf, setPhase: board.setPhase, placeField, clearField, renderAll: board.renderAll, cpuTurn, playerTurn,
  get COL() { return col.COL; }, get DECK() { return col.DECK; }, get RECS() { return rec.RECS; }, get QS() { return rec.QS; }, get SET() { return SET; },
  advOf, weakCat: rec.weakCat, lifetimeByCat: rec.lifetimeByCat, cpuPick, cpuScore, autoDeck: col.autoDeck, deckValid: col.deckValid,
  rewardOffer: col.rewardOffer, claimReward: col.claimReward, cpuDeckList: col.cpuDeckList, renderRecord, openDeck, recordGame: rec.recordGame,
  get BANK() { return DATA.questions.questions; }, get Store() { return Store; }, cardHTML: (...a) => cards.cardHTML(...a), migrateSave, fitDeck: col.fitDeck, openZoom, fsm, calc, renderMarket, daily, openDaily, renderDailyCard, knowledge, openKnow, ranked, market, openRanked, online, openBoard, usage, challenge, openChallenge, sharecard, version, nbexport, notebook, treeui, skilltree,
};
