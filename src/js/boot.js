// boot.js — start-up: the title screen, difficulty choice and the storage warnings shown once everything is ready.
import { DECKS_FIXED, DECK_SIZE } from './collection.js';
import { Store } from './core.js';
import { toast } from './view.js';


export function init() {
/* tell the player once if old data had to be converted or set aside */
{ const msgs = [];
  if (DECKS_FIXED) msgs.push(`牌組改為 ${DECK_SIZE} 張，你原本的牌組已自動補足`);
  if (Store.issues.length) msgs.push(`有 ${Store.issues.length} 筆舊資料無法讀取，已另外備份`);
  if (msgs.length) toast(msgs.join('；') + '。', 7000); }
}
