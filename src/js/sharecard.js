// sharecard.js — 分享戰績圖: one 1080 × 1350 picture of a finished duel (result, accuracy, damage, ranked points or
// challenge score), shared through the phone's share sheet (LINE, IG …) or saved as a PNG where sharing files is not
// available.
import { $, LP_MAX } from './core.js';
import { G } from './game.js';
import { TIERS } from './rankrules.js';
import { linkFor, PUBLIC_URL } from './challenge.js';
import { downloadsP } from './report.js';

export const W = 1080, H = 1350;
const SERIF = '"FD Serif","Noto Serif TC","Songti TC","PMingLiU",serif';
const SANS = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
const GOLD = '#e7c873', INK = '#0f1530', TEXT = '#eef0f8', MUTED = '#9aa3c0';

export function modeLabel(g) {
  if (g.mode === 'ranked') return `排位賽 · ${(TIERS[g.rank ? g.rank.tierAfter : 0] || TIERS[0]).name}`;
  if (g.mode === 'challenge') return g.challenge && g.challenge.by ? `好友挑戰 · ${g.challenge.by} 出的題` : '好友挑戰';
  if (g.mode === 'tutorial') return '新手場';
  return `休閒對戰 · ${g.diff.name}`;
}
/* the numbers on the card, also used by the tests */
export function cardData(g) {
  const s = g.stats || { total: 0, correct: 0 };
  const big = g.mode === 'ranked' && g.rank ? { label: '排位積分', value: `${g.rank.delta >= 0 ? '+' : ''}${g.rank.delta}`, sub: `${g.rank.after} 分 · ${TIERS[g.rank.tierAfter].name}` }
    : g.mode === 'challenge' && g.chScore != null ? { label: '挑戰分數', value: String(g.chScore), sub: '滿分 1500' }
    : g.perfResult ? { label: '表現分', value: String(g.perfResult.score), sub: '滿分 100' } : null;
  return {
    win: !!g.win, mode: modeLabel(g),
    stats: [['答對率', s.total ? `${Math.round(s.correct / s.total * 100)}%` : '—'], ['答對題數', `${s.correct}/${s.total}`],
      ['造成傷害', String(g.dealt || 0)], ['剩餘資金', `${Math.max(0, g.lp ? g.lp.p : 0)}`]],
    big, turns: g.turn,
    url: g.mode === 'challenge' && g.challenge && g.challenge.id ? linkFor(g.challenge.id) : PUBLIC_URL,
  };
}

export async function drawCard(g = G) {
  const d = cardData(g);
  if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load(`700 80px ${SERIF}`), document.fonts.load(`700 40px ${SANS}`)]).catch(() => {});
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1b2452'); bg.addColorStop(1, INK);
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  /* wave pattern, faint */
  x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2;
  for (let yy = 0; yy < H; yy += 48) for (let xx = (yy / 48) % 2 ? 0 : 48; xx < W + 96; xx += 96) { x.beginPath(); x.arc(xx, yy, 44, Math.PI, 0); x.stroke(); }
  x.strokeStyle = GOLD; x.lineWidth = 6; x.strokeRect(36, 36, W - 72, H - 72);
  x.lineWidth = 2; x.strokeRect(52, 52, W - 104, H - 104);
  const text = (s, px, py, font, color = TEXT, align = 'left') => { x.font = font; x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillText(s, px, py); };
  text('金融決鬥', 110, 190, `700 72px ${SERIF}`, GOLD);
  text(d.mode, 110, 250, `700 36px ${SANS}`, MUTED);
  /* verdict */
  const vg = x.createLinearGradient(0, 320, 0, 560);
  if (d.win) { vg.addColorStop(0, '#fff3c8'); vg.addColorStop(1, '#c99a3a'); } else { vg.addColorStop(0, '#d8dcef'); vg.addColorStop(1, '#6b7398'); }
  text(d.win ? '勝利' : '敗北', 104, 540, `700 230px ${SERIF}`, vg);
  text(d.win ? '大獲全勝' : '再接再厲', W - 110, 540, `700 40px ${SANS}`, d.win ? GOLD : MUTED, 'right');
  /* stats 2 × 2 */
  d.stats.forEach(([label, v], i) => {
    const bx = 110 + (i % 2) * 440, by = 620 + Math.floor(i / 2) * 170;
    x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(bx, by, 420, 150);
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 2; x.strokeRect(bx, by, 420, 150);
    text(v, bx + 30, by + 88, `700 64px ${SANS}`);
    text(label, bx + 30, by + 128, `700 28px ${SANS}`, MUTED);
  });
  /* the headline number */
  if (d.big) {
    x.strokeStyle = GOLD; x.lineWidth = 3; x.strokeRect(110, 980, W - 220, 150);
    text(d.big.label, 150, 1050, `700 34px ${SANS}`, MUTED);
    text(d.big.sub, 150, 1100, `700 30px ${SANS}`, MUTED);
    text(d.big.value, W - 150, 1095, `700 96px ${SERIF}`, GOLD, 'right');
  }
  text('用卡牌對戰學金融知識', 110, 1215, `700 32px ${SANS}`, TEXT);
  text(d.url.replace(/^https?:\/\//, ''), 110, 1262, `700 26px ${SANS}`, MUTED);
  return c;
}

/* share sheet with the picture when the browser can share files, otherwise save it */
export async function shareCard(btn) {
  const st = $('#share-card-status');
  const say = (cls, t) => { if (st) { st.className = 'status' + (cls ? ' ' + cls : ''); st.textContent = t; } };
  if (btn) btn.disabled = true; say('', '正在產生戰績圖…');
  try {
    const c = await drawCard();
    const blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('圖片產生失敗'))), 'image/png'));
    const d = cardData(G), filename = `financial-duel-${d.win ? 'win' : 'lose'}.png`;
    const file = typeof File === 'function' ? new File([blob], filename, { type: 'image/png' }) : null;
    const text = `我在「金融決鬥」${d.mode}${d.win ? '獲勝' : '奮戰到底'}了！${d.big ? `${d.big.label} ${d.big.value}。` : ''}一起來用卡牌學金融：${d.url}`;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text, title: '金融決鬥 戰績' }); say('ok', '已開啟分享。'); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') { say('', '已取消分享。'); return 'cancel'; } }
    }
    const dl = await downloadsP;
    if (dl) await dl.save({ filename, data: blob });
    else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
    say('ok', `已存成 ${filename}，可以從相簿或下載資料夾分享。`); return 'saved';
  } catch (e) {
    say('err', (e && e.code === 'declined') ? '已取消儲存。' : '戰績圖產生失敗：' + ((e && e.message) || '未知錯誤')); return 'error';
  } finally { if (btn) btn.disabled = false; }
}
