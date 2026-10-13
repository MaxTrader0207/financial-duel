// names.js — nickname rules for the leaderboard and friend challenges (no imports, so tests can load it directly)
/* nicknames: 2–12 letters or digits (any script), with _ - · allowed inside; a small list of words is refused */
export const BLOCK = ['幹你', '操你', '靠北', '雞巴', '屌你', '王八', 'fuck', 'shit', 'bitch', 'admin', '管理員', '官方', '客服'];
export function cleanName(raw) {
  if (typeof raw !== 'string') return { error: '請輸入暱稱' };
  const name = raw.normalize('NFKC').trim().replace(/\s+/g, ' ');
  const len = [...name].length;
  if (len < 2 || len > 12) return { error: '暱稱需要 2～12 個字' };
  if (!/^[\p{L}\p{N}](?:[\p{L}\p{N}_\-· ]*[\p{L}\p{N}])?$/u.test(name)) return { error: '暱稱只能用文字、數字，中間可以有 _ - · 或空格' };
  const low = name.toLowerCase().replace(/[\s_\-·]/g, '');
  if (BLOCK.some(w => low.includes(w))) return { error: '這個暱稱不能使用，請換一個' };
  return { name };
}

