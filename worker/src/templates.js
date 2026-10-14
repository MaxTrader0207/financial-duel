// templates.js — 排位賽的計算題：每次出題都換一組數字，由伺服器算出正解。
// The numbers are drawn on the server for every question, so a ranked question cannot be looked up in the public bank:
// the answer has to be worked out. Each template returns { q, a, w: [three wrong answers], ex } from a random source;
// make() below rejects a draw whose four options are not all different and tries again.
//
// difficulty: 1 初階 · 2 中階 · 3 高階 (the same levels as the question bank)

/* ---------- formatting ---------- */
const fix = (x, d = 0) => {
  const v = Math.round(x * 10 ** d) / 10 ** d;
  const [i, f] = Math.abs(v).toFixed(d).split('.');
  return (v < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
};
const pct = (x, d = 1) => fix(x * 100, d) + '%';
const spct = (x, d = 1) => (x > 0 ? '+' : '') + pct(x, d);                // signed percentage
const money = (x, d = 0) => fix(x, d) + ' 元';

/* ---------- random helpers (r() is a source of numbers in [0, 1)) ---------- */
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, list) => list[Math.floor(r() * list.length)];

/* Taiwan stock tick size by price level (證交所升降單位) */
export const tick = p => (p < 10 ? 0.01 : p < 50 ? 0.05 : p < 100 ? 0.1 : p < 500 ? 0.5 : p < 1000 ? 1 : 5);
const decOf = t => (t < 0.1 ? 2 : t < 1 ? 1 : 0);
/* limit-up price: previous close × 1.1, the part below one tick dropped (tick of the resulting price level) */
export function limitUp(prev) {
  const raw = prev * 1.1, t = tick(raw);
  return Math.floor(raw / t + 1e-9) * t;
}

export const TEMPLATES = [
  /* ============ 技術分析 ============ */
  { id: 'tech-ma5', cat: 'tech', diff: 1, title: '5 日均線計算', make(r) {
    const c = Array.from({ length: 5 }, () => int(r, 60, 140)); const s = c.reduce((a, b) => a + b, 0);
    return { q: `某股最近 5 個交易日的收盤價依序是 ${c.join('、')} 元，5 日移動平均（5MA）是多少？`,
      a: money(s / 5, 1), w: [money(c[4], 1), money(s / 4, 1), money((Math.max(...c) + Math.min(...c)) / 2, 1)],
      ex: `5 日均線＝最近 5 個收盤價加總 ÷ 5 = ${s} ÷ 5 = ${fix(s / 5, 1)} 元。` }; } },
  { id: 'tech-chg', cat: 'tech', diff: 1, title: '漲跌幅計算', make(r) {
    const p = int(r, 40, 400), d = int(r, 1, 9) * (r() < 0.5 ? -1 : 1) * Math.max(1, Math.round(p / 100)), c = p + d;
    return { q: `昨天收盤 ${p} 元，今天收盤 ${c} 元，今天的漲跌幅是多少？`,
      a: spct(d / p, 2), w: [spct(d / c, 2), spct(-d / p, 2), spct(d / p / 10, 2)],
      ex: `漲跌幅＝（今收 − 昨收）÷ 昨收 = ${d > 0 ? '+' : '−'}${Math.abs(d)} ÷ ${p} = ${spct(d / p, 2)}。分母是「昨天」的收盤價。` }; } },
  { id: 'tech-rsi', cat: 'tech', diff: 2, title: 'RSI 計算', make(r) {
    let g = int(r, 1, 9), l = int(r, 1, 9); if (g === l) l = g === 9 ? 3 : g + 1;
    return { q: `14 日 RSI 的計算期間內，平均漲幅是 ${g}、平均跌幅是 ${l}，RSI 約是多少？`,
      a: fix(100 * g / (g + l), 1), w: [fix(100 * l / (g + l), 1), fix(Math.min(99, 10 * g / l), 1), fix(100 * g / (g + 2 * l), 1)],
      ex: `RS = 平均漲幅 ÷ 平均跌幅 = ${g} ÷ ${l}；RSI = 100 − 100 ÷（1 + RS）= 100 × 平均漲幅 ÷（平均漲幅 + 平均跌幅）= ${fix(100 * g / (g + l), 1)}。` }; } },
  { id: 'tech-atr', cat: 'tech', diff: 2, title: 'ATR 停損價', make(r) {
    const e = int(r, 40, 180) * 5, a = int(r, 4, 30), k = pick(r, [1.5, 2, 3]);
    return { q: `多單進場價 ${e} 元，ATR 為 ${a} 元，以「進場價 − ${k} × ATR」設停損，停損價是多少？`,
      a: money(e - k * a, 1), w: [money(e - a, 1), money(e + k * a, 1), money(e - k * a * 2, 1)],
      ex: `停損價 = ${e} − ${k} × ${a} = ${fix(e - k * a, 1)} 元。用 ATR 設停損，停損距離會隨行情波動調整。` }; } },
  { id: 'tech-boll', cat: 'tech', diff: 2, title: '布林通道上軌', make(r) {
    const m = int(r, 30, 250), s = int(r, 2, 12) / 2;
    return { q: `一檔股票 20 日均線為 ${m} 元，20 日收盤價標準差為 ${fix(s, 1)} 元，標準布林通道（±2 個標準差）的上軌是多少？`,
      a: money(m + 2 * s, 1), w: [money(m + s, 1), money(m + 4 * s, 1), money(m - 2 * s, 1)],
      ex: `上軌 = 中軌（20 日均線）+ 2 × 標準差 = ${m} + 2 × ${fix(s, 1)} = ${fix(m + 2 * s, 1)} 元；下軌則是減 2 個標準差。` }; } },
  { id: 'tech-fib', cat: 'tech', diff: 2, title: '斐波那契回撤', make(r) {
    const lo = int(r, 10, 40) * 10, hi = lo + int(r, 5, 20) * 10, d = hi - lo;
    return { q: `股價從 ${lo} 元漲到 ${hi} 元後拉回，0.618 的斐波那契回撤位置大約在多少？`,
      a: money(hi - 0.618 * d, 1), w: [money(hi - 0.382 * d, 1), money(hi - 0.236 * d, 1), money(hi - 0.5 * d, 1)],
      ex: `回撤位置 = 高點 − 漲幅 × 0.618 = ${hi} − ${d} × 0.618 = ${fix(hi - 0.618 * d, 1)} 元（0.382 回撤則是 ${fix(hi - 0.382 * d, 1)} 元）。` }; } },
  { id: 'tech-kd', cat: 'tech', diff: 3, title: 'KD 指標的 K 值', make(r) {
    const span = pick(r, [20, 25, 40, 50]), lo = int(r, 40, 150), hi = lo + span, c = lo + int(r, 1, span - 1);
    const rsv = (c - lo) / span * 100, kp = int(r, 20, 80), k = kp * 2 / 3 + rsv / 3;
    return { q: `近 9 日最高價 ${hi}、最低價 ${lo}，今天收盤 ${c}；昨天的 K 值是 ${kp}。依台股常用算法（K = 前日 K × 2/3 + RSV × 1/3），今天的 K 值約是多少？`,
      a: fix(k, 1), w: [fix(rsv, 1), fix(kp / 3 + rsv * 2 / 3, 1), fix((kp + rsv) / 2 + 3, 1)],
      ex: `RSV =（收盤 − 9 日最低）÷（9 日最高 − 9 日最低）× 100 = ${c - lo} ÷ ${span} × 100 = ${fix(rsv, 1)}；K = ${kp} × 2/3 + ${fix(rsv, 1)} × 1/3 = ${fix(k, 1)}。` }; } },

  /* ============ 基本面 ============ */
  { id: 'fund-yield', cat: 'fund', diff: 1, title: '現金殖利率', make(r) {
    const p = int(r, 20, 200) * 1, d = int(r, 4, 40) / 4;
    return { q: `股價 ${p} 元，一年配發現金股利 ${fix(d, 2)} 元，現金殖利率是多少？`,
      a: pct(d / p, 2), w: [pct(d / (p - d), 2), pct(d / p * 2, 2), pct(d / p / 2, 2)],
      ex: `現金殖利率 = 現金股利 ÷ 股價 = ${fix(d, 2)} ÷ ${p} = ${pct(d / p, 2)}。` }; } },
  { id: 'fund-exdiv', cat: 'fund', diff: 1, title: '除息參考價', make(r) {
    const p = int(r, 30, 300), d = int(r, 2, 20) / 2;
    return { q: `某股除息前一日收盤 ${p} 元，配發現金股利 ${fix(d, 1)} 元（沒有股票股利），除息參考價是多少？`,
      a: money(p - d, 1), w: [money(p + d, 1), money(p / (1 + d / 10), 1), money(p - 2 * d, 1)],
      ex: `除息參考價 = 前一日收盤 − 現金股利 = ${p} − ${fix(d, 1)} = ${fix(p - d, 1)} 元。` }; } },
  { id: 'fund-gm', cat: 'fund', diff: 1, title: '毛利率', make(r) {
    const rev = int(r, 20, 90) * 10, cost = Math.round(rev * int(r, 35, 85) / 100);
    return { q: `某公司一季營收 ${rev} 億元、營業成本 ${cost} 億元，毛利率是多少？`,
      a: pct((rev - cost) / rev, 1), w: [pct((rev - cost) / cost, 1), pct(cost / rev, 1), pct((rev - cost) / (rev + cost), 1)],
      ex: `毛利率 =（營收 − 營業成本）÷ 營收 = ${rev - cost} ÷ ${rev} = ${pct((rev - cost) / rev, 1)}。` }; } },
  { id: 'fund-epsg', cat: 'fund', diff: 1, title: 'EPS 年增率', make(r) {
    const a = int(r, 10, 80) / 10, b = Math.round(a * (1 + int(r, -40, 80) / 100) * 10) / 10;
    if (a === b) return null;
    return { q: `一家公司去年 EPS ${fix(a, 1)} 元，今年 EPS ${fix(b, 1)} 元，EPS 年增率是多少？`,
      a: spct((b - a) / a, 1), w: [spct((b - a) / b, 1), spct((a - b) / a, 1), spct(b / a, 1)],
      ex: `年增率 =（今年 − 去年）÷ 去年 = ${fix(b - a, 1)} ÷ ${fix(a, 1)} = ${spct((b - a) / a, 1)}。` }; } },
  { id: 'fund-pe4', cat: 'fund', diff: 2, title: '近四季本益比', make(r) {
    const e = Array.from({ length: 4 }, () => int(r, 5, 40) / 10), s = e.reduce((x, y) => x + y, 0), p = Math.round(s * int(r, 8, 30));
    return { q: `某股近四季 EPS 依序是 ${e.map(x => fix(x, 1)).join('、')} 元，股價 ${p} 元，以近四季 EPS 計算的本益比約是幾倍？`,
      a: fix(p / s, 1) + ' 倍', w: [fix(p / e[3], 1) + ' 倍', fix(p / (e[3] * 4), 1) + ' 倍', fix(s / p * 100, 1) + ' 倍'],
      ex: `近四季 EPS 合計 ${fix(s, 1)} 元，本益比 = 股價 ÷ 近四季 EPS = ${p} ÷ ${fix(s, 1)} = ${fix(p / s, 1)} 倍。` }; } },
  { id: 'fund-exright', cat: 'fund', diff: 2, title: '除權參考價', make(r) {
    const p = int(r, 20, 200), s = pick(r, [0.5, 1, 1.5, 2, 3]);
    return { q: `某股除權前一日收盤 ${p} 元，配發股票股利 ${fix(s, 1)} 元（沒有現金股利），除權參考價約是多少？`,
      a: money(p / (1 + s / 10), 2), w: [money(p - s, 2), money(p / (1 + s), 2), money(p * (1 - s / 10), 2)],
      ex: `股票股利 ${fix(s, 1)} 元代表每股配 ${fix(s / 10, 2)} 股，除權參考價 = ${p} ÷（1 + ${fix(s / 10, 2)}）= ${fix(p / (1 + s / 10), 2)} 元。` }; } },
  { id: 'fund-roe', cat: 'fund', diff: 2, title: 'ROE 與 ROA', make(r) {
    const eq = int(r, 20, 80) * 10, assets = eq + int(r, 10, 120) * 10, ni = Math.round(eq * int(r, 4, 25) / 100);
    return { q: `一家公司稅後淨利 ${ni} 億元，股東權益 ${eq} 億元，總資產 ${assets} 億元，ROE（股東權益報酬率）是多少？`,
      a: pct(ni / eq, 1), w: [pct(ni / assets, 1), pct(ni / (assets - eq), 1), pct(eq / assets, 1)],
      ex: `ROE = 稅後淨利 ÷ 股東權益 = ${ni} ÷ ${eq} = ${pct(ni / eq, 1)}；除以總資產得到的 ${pct(ni / assets, 1)} 是 ROA。` }; } },
  { id: 'fund-capm', cat: 'fund', diff: 2, title: 'CAPM 預期報酬', make(r) {
    const rf = int(r, 1, 4), rm = rf + int(r, 3, 8), b = pick(r, [0.6, 0.8, 1.2, 1.4, 1.5, 1.8]);
    return { q: `依 CAPM，無風險利率 ${rf}%、市場預期報酬率 ${rm}%、股票 Beta ${b}，這檔股票的預期報酬率是多少？`,
      a: pct((rf + b * (rm - rf)) / 100, 1), w: [pct(b * rm / 100, 1), pct((rf + b * rm) / 100, 1), pct((rm + b * (rm - rf)) / 100, 1)],
      ex: `預期報酬 = 無風險利率 + Beta ×（市場報酬 − 無風險利率）= ${rf}% + ${b} × ${rm - rf}% = ${pct((rf + b * (rm - rf)) / 100, 1)}。` }; } },
  { id: 'fund-gordon', cat: 'fund', diff: 3, title: '高登成長模型', make(r) {
    const d = int(r, 2, 12) / 2, k = int(r, 7, 12), g = int(r, 2, k - 3);
    return { q: `以高登成長模型估價：明年預期股利 ${fix(d, 1)} 元，要求報酬率 ${k}%，股利永續成長率 ${g}%，合理股價是多少？`,
      a: money(d / ((k - g) / 100), 1), w: [money(d / (k / 100), 1), money(d / ((k + g) / 100), 1), money(d * (1 + g / 100) / ((k - g) / 100), 1)],
      ex: `合理價 = 明年股利 ÷（要求報酬率 − 成長率）= ${fix(d, 1)} ÷ ${k - g}% = ${fix(d / ((k - g) / 100), 1)} 元。題目已給「明年」股利，不必再乘（1 + g）。` }; } },
  { id: 'fund-exboth', cat: 'fund', diff: 3, title: '除權息參考價', make(r) {
    const p = int(r, 30, 240), c = int(r, 1, 8) / 2, s = pick(r, [0.5, 1, 2]);
    return { q: `某股除權息前一日收盤 ${p} 元，同時配發現金股利 ${fix(c, 1)} 元與股票股利 ${fix(s, 1)} 元，除權息參考價約是多少？`,
      a: money((p - c) / (1 + s / 10), 2), w: [money(p / (1 + s / 10) - c, 2), money((p - c) / (1 + s), 2), money(p - c - s, 2)],
      ex: `先扣現金股利，再除以（1 + 配股率）：（${p} − ${fix(c, 1)}）÷（1 + ${fix(s / 10, 2)}）= ${fix((p - c) / (1 + s / 10), 2)} 元。` }; } },

  /* ============ 衍生性商品 ============ */
  { id: 'deriv-tx', cat: 'deriv', diff: 1, title: '大台損益', make(r) {
    const n = int(r, 1, 5), a = int(r, 180, 260) * 100, pts = int(r, 20, 300) * (r() < 0.5 ? -1 : 1);
    return { q: `在 ${fix(a)} 點買進 ${n} 口大型台指期（每點 200 元），${fix(a + pts)} 點平倉，損益是多少（不計手續費與稅）？`,
      a: money(pts * 200 * n), w: [money(pts * 50 * n), money(pts * 10 * n), money(-pts * 200 * n)],
      ex: `損益 = 點數差 × 每點價值 × 口數 = ${pts > 0 ? '+' : '−'}${Math.abs(pts)} × 200 × ${n} = ${fix(pts * 200 * n)} 元。` }; } },
  { id: 'deriv-mtx', cat: 'deriv', diff: 1, title: '小台損益', make(r) {
    const n = int(r, 1, 6), pts = int(r, 15, 250) * (r() < 0.5 ? -1 : 1);
    return { q: `放空 ${n} 口小型台指期（每點 50 元），指數之後${pts > 0 ? '下跌' : '上漲'} ${Math.abs(pts)} 點時平倉，損益是多少？`,
      a: money(pts * 50 * n), w: [money(pts * 200 * n), money(-pts * 50 * n), money(pts * 10 * n)],
      ex: `空單在指數下跌時獲利：損益 = ${pts > 0 ? '+' : '−'}${Math.abs(pts)} 點 × 50 元 × ${n} 口 = ${fix(pts * 50 * n)} 元。` }; } },
  { id: 'deriv-callbe', cat: 'deriv', diff: 1, title: '買權損益兩平', make(r) {
    const k = int(r, 180, 260) * 100, p = int(r, 20, 300);
    return { q: `以 ${p} 點權利金買進履約價 ${fix(k)} 的台指買權，到期時指數要高於多少才開始獲利？`,
      a: fix(k + p) + ' 點', w: [fix(k - p) + ' 點', fix(k) + ' 點', fix(k + 2 * p) + ' 點'],
      ex: `買權損益兩平點 = 履約價 + 權利金 = ${fix(k)} + ${p} = ${fix(k + p)} 點；賣權則是履約價 − 權利金。` }; } },
  { id: 'deriv-putbe', cat: 'deriv', diff: 2, title: '賣權損益兩平', make(r) {
    const k = int(r, 180, 260) * 100, p = int(r, 20, 300);
    return { q: `以 ${p} 點權利金買進履約價 ${fix(k)} 的台指賣權，到期時指數要低於多少才開始獲利？`,
      a: fix(k - p) + ' 點', w: [fix(k + p) + ' 點', fix(k) + ' 點', fix(k - 2 * p) + ' 點'],
      ex: `買進賣權的損益兩平點 = 履約價 − 權利金 = ${fix(k)} − ${p} = ${fix(k - p)} 點。` }; } },
  { id: 'deriv-callpnl', cat: 'deriv', diff: 2, title: '買權到期損益', make(r) {
    const k = int(r, 180, 260) * 100, p = int(r, 30, 200), s = k + int(r, p + 10, p + 400), n = int(r, 1, 4);
    return { q: `買進 ${n} 口履約價 ${fix(k)} 的台指買權（TXO，每點 50 元），權利金 ${p} 點；到期結算價 ${fix(s)}，總損益是多少？`,
      a: money((s - k - p) * 50 * n), w: [money((s - k) * 50 * n), money((s - k - p) * 200 * n), money((s - k + p) * 50 * n)],
      ex: `每口損益 =（結算價 − 履約價 − 權利金）× 50 =（${fix(s)} − ${fix(k)} − ${p}）× 50 = ${fix((s - k - p) * 50)} 元，${n} 口共 ${fix((s - k - p) * 50 * n)} 元。` }; } },
  { id: 'deriv-tv', cat: 'deriv', diff: 2, title: '時間價值', make(r) {
    const k = int(r, 180, 260) * 100, s = k + int(r, 50, 400), p = (s - k) + int(r, 20, 200);
    return { q: `指數 ${fix(s)} 點時，履約價 ${fix(k)} 的買權報價 ${p} 點，這個權利金裡的時間價值是多少點？`,
      a: fix(p - (s - k)) + ' 點', w: [fix(s - k) + ' 點', fix(p) + ' 點', fix(p + (s - k)) + ' 點'],
      ex: `內含價值 = 指數 − 履約價 = ${s - k} 點；時間價值 = 權利金 − 內含價值 = ${p} − ${s - k} = ${p - (s - k)} 點。` }; } },
  { id: 'deriv-margin', cat: 'deriv', diff: 2, title: '期貨權益數', make(r) {
    const im = int(r, 30, 45) * 10000, pts = int(r, 40, 160);
    return { q: `以原始保證金 ${fix(im)} 元買進 1 口大台（每點 200 元），指數下跌 ${pts} 點後，帳戶權益數是多少？`,
      a: money(im - pts * 200), w: [money(im - pts * 50), money(im + pts * 200), money(im - pts * 2000)],
      ex: `虧損 = ${pts} × 200 = ${fix(pts * 200)} 元，權益數 = ${fix(im)} − ${fix(pts * 200)} = ${fix(im - pts * 200)} 元；低於維持保證金時會被追繳。` }; } },
  { id: 'deriv-delta', cat: 'deriv', diff: 3, title: 'Delta 避險口數', make(r) {
    const n = int(r, 1, 6) * 10, d = pick(r, [0.3, 0.4, 0.5, 0.6, 0.7]), big = r() < 0.5;
    const need = n * d * 50 / (big ? 200 : 50);
    if (!Number.isInteger(need)) return null;
    const unit = big ? '大台（每點 200 元）' : '小台（每點 50 元）';
    return { q: `持有 ${n} 口 Delta ${d} 的 TXO 買權多單（每點 50 元），要用${unit}做 Delta 中性避險，應該怎麼做？`,
      a: `放空 ${fix(need)} 口`, w: [`買進 ${fix(need)} 口`, `放空 ${fix(need * 4)} 口`, `放空 ${fix(n)} 口`],
      ex: `部位 Delta = ${n} × ${d} × 50 = 每點 ${fix(n * d * 50)} 元的多方曝險，要放空等值的期貨：${fix(n * d * 50)} ÷ ${big ? 200 : 50} = ${fix(need)} 口。` }; } },

  /* ============ 風險管理 ============ */
  { id: 'risk-recover', cat: 'risk', diff: 1, title: '虧損後回本', make(r) {
    const l = pick(r, [10, 20, 25, 30, 40, 50, 60, 75, 80]) / 100;
    return { q: `資金虧損 ${pct(l, 0)} 之後，需要上漲多少才能回到原點？`,
      a: pct(l / (1 - l), 1), w: [pct(l, 1), pct(l * 1.5, 1), pct(l / 2, 1)],
      ex: `剩下 ${pct(1 - l, 0)}，要回到 100% 需上漲 ${pct(l, 0)} ÷ ${pct(1 - l, 0)} = ${pct(l / (1 - l), 1)}。虧得越深，回本越難。` }; } },
  { id: 'risk-rmul', cat: 'risk', diff: 1, title: '幾 R 的交易', make(r) {
    const e = int(r, 20, 200) * 5, d = int(r, 2, 10) * 2, m = pick(r, [-1, 0.5, 1.5, 2, 2.5, 3, 4]), x = e + d * m;
    return { q: `多單進場 ${e} 元，停損設在 ${e - d} 元，最後在 ${fix(x, 1)} 元出場，這筆交易是幾 R？`,
      a: (m > 0 ? '+' : '') + fix(m, 1) + 'R', w: [(m > 0 ? '+' : '') + fix(m * d, 1) + 'R', (m > 0 ? '−' : '+') + fix(Math.abs(m), 1) + 'R', (m > 0 ? '+' : '') + fix(m + 1, 1) + 'R'],
      ex: `1R = 進場價到停損的距離 = ${d} 元；這筆損益 ${fix(x - e, 1)} 元 ÷ ${d} = ${fix(m, 1)}R。` }; } },
  { id: 'risk-size', cat: 'risk', diff: 2, title: '部位大小', make(r) {
    const c = int(r, 10, 200) * 10000, k = pick(r, [0.5, 1, 1.5, 2]), s = pick(r, [2, 4, 5, 8, 10]);
    return { q: `總資金 ${fix(c)} 元，每筆交易最多承擔總資金 ${k}% 的風險，停損距離是進場價的 ${s}%，這筆部位最多可以買多少金額？`,
      a: money(c * k / s), w: [money(c * k / 100), money(c * s / 100), money(c * k / 100 * s)],
      ex: `可承擔風險 = ${fix(c)} × ${k}% = ${fix(c * k / 100)} 元；部位 = 風險金額 ÷ 停損比例 = ${fix(c * k / 100)} ÷ ${s}% = ${fix(c * k / s)} 元。` }; } },
  { id: 'risk-ev', cat: 'risk', diff: 2, title: '每筆期望值', make(r) {
    const p = int(r, 3, 7) / 10, w = int(r, 2, 12) * 1000, l = int(r, 2, 10) * 1000;
    return { q: `一個策略勝率 ${pct(p, 0)}，平均獲利 ${fix(w)} 元，平均虧損 ${fix(l)} 元，每筆交易的期望值是多少？`,
      a: money(p * w - (1 - p) * l), w: [money(p * w), money(p * (w - l)), money((w - l) / 2)],
      ex: `期望值 = 勝率 × 平均獲利 − 敗率 × 平均虧損 = ${p} × ${fix(w)} − ${fix(1 - p, 1)} × ${fix(l)} = ${fix(p * w - (1 - p) * l)} 元。` }; } },
  { id: 'risk-sharpe', cat: 'risk', diff: 2, title: '夏普比率', make(r) {
    const R = int(r, 6, 25), rf = int(r, 1, 4), s = int(r, 8, 30);
    return { q: `一檔基金年化報酬 ${R}%，無風險利率 ${rf}%，年化標準差 ${s}%，夏普比率約是多少？`,
      a: fix((R - rf) / s, 2), w: [fix(R / s, 2), fix(s / (R - rf), 2), fix((R - rf) / s * 2, 2)],
      ex: `夏普比率 =（報酬 − 無風險利率）÷ 標準差 =（${R} − ${rf}）÷ ${s} = ${fix((R - rf) / s, 2)}。` }; } },
  { id: 'risk-mdd', cat: 'risk', diff: 2, title: '最大回撤', make(r) {
    const a = int(r, 100, 140), peak = a + int(r, 20, 60), trough = Math.round(peak * int(r, 55, 85) / 100), end = trough + int(r, 5, 40);
    const seq = [a, peak, trough, end];
    return { q: `一個帳戶的淨值依序是 ${seq.join(' → ')}（萬元），這段期間的最大回撤（MDD）是多少？`,
      a: pct((peak - trough) / peak, 1), w: [pct((peak - trough) / trough, 1), pct((peak - end) / peak, 1), pct((a - trough) / a, 1)],
      ex: `最大回撤 = 從最高點到之後最低點的跌幅 =（${peak} − ${trough}）÷ ${peak} = ${pct((peak - trough) / peak, 1)}。` }; } },
  { id: 'risk-kelly', cat: 'risk', diff: 3, title: '凱利公式', make(r) {
    const p = pick(r, [0.45, 0.5, 0.55, 0.6, 0.65]), b = pick(r, [1, 1.5, 2, 3]), f = p - (1 - p) / b;
    if (f <= 0.02) return null;
    return { q: `以凱利公式 f* = p − q ÷ b 計算：勝率 ${pct(p, 0)}、賠率（平均獲利 ÷ 平均虧損）${b}，最適下注比例是多少？`,
      a: pct(f, 1), w: [pct(p - (1 - p) * b, 1), pct(p * b - (1 - p), 1), pct(f / 2, 1)],
      ex: `f* = ${p} − ${fix(1 - p, 2)} ÷ ${b} = ${pct(f, 1)}。實務上常用一半（半凱利）降低波動。` }; } },
  { id: 'risk-streak', cat: 'risk', diff: 3, title: '連續虧損後的資金', make(r) {
    const f = pick(r, [1, 2, 3, 5]) / 100, n = pick(r, [5, 8, 10, 15, 20]);
    return { q: `每筆交易固定承擔「當時資金」的 ${pct(f, 0)}，連續虧損 ${n} 次後，資金約剩原本的多少？`,
      a: pct((1 - f) ** n, 1), w: [pct(1 - n * f, 1), pct((1 - f) ** (n - 1), 1), pct(1 - n * f * 1.3, 1)],
      ex: `每次剩下 ${pct(1 - f, 0)}，${n} 次後 = ${fix(1 - f, 2)}^${n} ≈ ${pct((1 - f) ** n, 1)}。按當時資金計算，虧損會越來越小。` }; } },

  /* ============ 籌碼與市場 ============ */
  { id: 'chips-amount', cat: 'chips', diff: 1, title: '成交金額', make(r) {
    const n = int(r, 1, 9), m = int(r, 1, 9) * 100, p = int(r, 20, 300) / 2;
    return { q: `以每股 ${fix(p, 1)} 元買進 ${n} 張又 ${m} 股零股，成交金額是多少（不含手續費）？`,
      a: money(p * (n * 1000 + m)), w: [money(p * (n * 100 + m)), money(p * (n + m) * 1000), money(p * n * 1000)],
      ex: `1 張 = 1,000 股，共 ${fix(n * 1000 + m)} 股 × ${fix(p, 1)} 元 = ${fix(p * (n * 1000 + m))} 元。` }; } },
  { id: 'chips-daytax', cat: 'chips', diff: 1, title: '當沖證交稅', make(r) {
    const a = int(r, 10, 200) * 10000;
    return { q: `現股當沖賣出成交金額 ${fix(a)} 元，依目前的當沖減半稅率，證交稅是多少？`,
      a: money(a * 0.0015), w: [money(a * 0.003), money(a * 0.001425), money(a * 0.00015)],
      ex: `現股當沖賣出的證交稅率是 0.15%（一般賣出為 0.3%）：${fix(a)} × 0.15% = ${fix(a * 0.0015)} 元。` }; } },
  { id: 'chips-ratio', cat: 'chips', diff: 1, title: '券資比', make(r) {
    const b = int(r, 20, 200) * 100, s = Math.round(b * int(r, 5, 60) / 100);
    return { q: `某股融資餘額 ${fix(b)} 張、融券餘額 ${fix(s)} 張，券資比是多少？`,
      a: pct(s / b, 1), w: [pct(b / s, 1), pct(s / (s + b), 1), pct((b - s) / b, 1)],
      ex: `券資比 = 融券餘額 ÷ 融資餘額 = ${fix(s)} ÷ ${fix(b)} = ${pct(s / b, 1)}。券資比高，軋空的可能性較大。` }; } },
  { id: 'chips-fee', cat: 'chips', diff: 2, title: '買進手續費', make(r) {
    const a = int(r, 5, 90) * 10000;
    return { q: `買進成交金額 ${fix(a)} 元，券商手續費以上限 0.1425% 計算（沒有折扣），手續費是多少？`,
      a: money(Math.floor(a * 0.001425)), w: [money(a * 0.003), money(Math.floor(a * 0.001425) * 2), money(a * 0.01425)],
      ex: `手續費 = ${fix(a)} × 0.1425% = ${fix(Math.floor(a * 0.001425))} 元（未滿 1 元捨去）。買進只付手續費，賣出才另外課 0.3% 證交稅。` }; } },
  { id: 'chips-dtc', cat: 'chips', diff: 2, title: '空單回補天數', make(r) {
    const v = int(r, 2, 40) * 100000, d = pick(r, [1.5, 2, 2.5, 3, 4, 5, 6, 8]), s = v * d;
    return { q: `一檔美股的放空股數為 ${fix(s)} 股，平均日成交量 ${fix(v)} 股，Days to Cover（空單回補天數）是多少？`,
      a: fix(d, 1) + ' 天', w: [fix(v / s, 2) + ' 天', fix(d * 5, 1) + ' 天', fix(d / 5, 1) + ' 天'],
      ex: `Days to Cover = 放空股數 ÷ 平均日成交量 = ${fix(s)} ÷ ${fix(v)} = ${fix(d, 1)} 天，天數越多，空方回補越不容易。` }; } },
  { id: 'chips-net', cat: 'chips', diff: 3, title: '賣出實收金額', make(r) {
    const a = int(r, 10, 99) * 10000, fee = Math.floor(a * 0.001425), tax = Math.floor(a * 0.003);
    return { q: `一般現股賣出，成交金額 ${fix(a)} 元，手續費 0.1425%（無折扣）、證交稅 0.3%，實際入帳約是多少？`,
      a: money(a - fee - tax), w: [money(a - fee), money(a - tax), money(a - fee - Math.floor(a * 0.0015))],
      ex: `手續費 ${fix(fee)} 元 + 證交稅 ${fix(tax)} 元，入帳 = ${fix(a)} − ${fix(fee)} − ${fix(tax)} = ${fix(a - fee - tax)} 元。` }; } },
  { id: 'chips-maint', cat: 'chips', diff: 3, title: '融資維持率', make(r) {
    const p = int(r, 10, 60) * 5, q = Math.round(p * int(r, 70, 120) / 100 * 2) / 2;
    return { q: `以每股 ${p} 元融資買進（自備 40%、融資 60%），股價變成 ${fix(q, 1)} 元時，該股的融資維持率約是多少？`,
      a: pct(q / (p * 0.6), 1), w: [pct(q / p, 1), pct(q / (p * 0.4), 1), pct((q - p * 0.6) / q, 1)],
      ex: `融資金額 = ${p} × 60% = ${fix(p * 0.6, 1)} 元；維持率 = 股票市值 ÷ 融資金額 = ${fix(q, 1)} ÷ ${fix(p * 0.6, 1)} = ${pct(q / (p * 0.6), 1)}，低於 130% 會被追繳。` }; } },
  { id: 'chips-limit', cat: 'chips', diff: 3, title: '漲停價', make(r) {
    const prev = pick(r, [int(r, 900, 4900) / 100, int(r, 100, 990) / 10 * 1, int(r, 200, 980) / 2, int(r, 101, 999)]);
    const p = Math.round(prev / tick(prev)) * tick(prev), up = limitUp(p), d = decOf(tick(p * 1.1));
    const raw = p * 1.1, t = tick(raw), ceil = Math.ceil(raw / t - 1e-9) * t;
    const w = [ceil !== up ? ceil : up + t, up - t, Math.floor(p * 1.07 / t) * t];
    return { q: `某上市股票昨天收盤 ${fix(p, decOf(tick(p)))} 元，今天的漲停價是多少？`,
      a: money(up, d), w: w.map(x => money(x, d)),
      ex: `漲停價 = 昨收 × 1.1 = ${fix(raw, 3)}，再依該價位的升降單位（${fix(t, decOf(t))} 元）把不足一檔的部分捨去，得到 ${fix(up, d)} 元。` }; } },

  /* ============ 外匯 ============ */
  { id: 'fx-move', cat: 'fx', diff: 1, title: '升值或貶值', make(r) {
    const a = int(r, 290, 330) / 10; let b = int(r, 290, 330) / 10; if (Math.abs(a - b) < 0.3) b = a + 0.8;
    const up = b > a;
    return { q: `美元兌新台幣（USD/TWD）從 ${fix(a, 1)} 變成 ${fix(b, 1)}，下列敘述何者正確？`,
      a: `新台幣${up ? '貶值' : '升值'}，1 美元可換的新台幣${up ? '增加' : '減少'}約 ${pct(Math.abs(b - a) / a, 1)}`,
      w: [`新台幣${up ? '升值' : '貶值'}，1 美元可換的新台幣${up ? '增加' : '減少'}約 ${pct(Math.abs(b - a) / a, 1)}`,
        `新台幣${up ? '貶值' : '升值'}，1 美元可換的新台幣${up ? '減少' : '增加'}約 ${pct(Math.abs(b - a) / a, 1)}`,
        `新台幣${up ? '升值' : '貶值'}，1 美元可換的新台幣${up ? '減少' : '增加'}約 ${pct(Math.abs(b - a) / b, 1)}`],
      ex: `1 美元從 ${fix(a, 1)} 元變成 ${fix(b, 1)} 元新台幣，要用${up ? '更多' : '更少'}新台幣換 1 美元，代表新台幣${up ? '貶值' : '升值'}；變動幅度 = ${fix(Math.abs(b - a), 1)} ÷ ${fix(a, 1)} ≈ ${pct(Math.abs(b - a) / a, 1)}。` }; } },
  { id: 'fx-conv', cat: 'fx', diff: 1, title: '換外幣', make(r) {
    const buy = int(r, 2950, 3250) / 100, sell = buy + int(r, 5, 12) / 100, n = int(r, 3, 30) * 10000;
    return { q: `銀行美元牌告：即期買入 ${fix(buy, 2)}、即期賣出 ${fix(sell, 2)}。用 ${fix(n)} 元新台幣換美元，大約可以換到多少美元？`,
      a: fix(n / sell, 2) + ' 美元', w: [fix(n / buy, 2) + ' 美元', fix(n / ((buy + sell) / 2), 2) + ' 美元', fix(n / sell * 1.01, 2) + ' 美元'],
      ex: `牌告是站在銀行的角度：你買美元，就是銀行「賣出」美元，用即期賣出價 ${fix(sell, 2)}：${fix(n)} ÷ ${fix(sell, 2)} ≈ ${fix(n / sell, 2)} 美元。` }; } },
  { id: 'fx-pnl', cat: 'fx', diff: 2, title: '匯兌損益', make(r) {
    const u = int(r, 1, 20) * 1000, a = int(r, 295, 330) / 10; let b = int(r, 295, 330) / 10; if (a === b) b = a + 0.5;
    return { q: `在 USD/TWD = ${fix(a, 1)} 時買進 ${fix(u)} 美元，之後在 ${fix(b, 1)} 換回新台幣，匯兌損益是多少（不計手續費與匯差）？`,
      a: (b > a ? '賺 ' : '虧 ') + money(Math.abs(u * (b - a))), w: [(b > a ? '虧 ' : '賺 ') + money(Math.abs(u * (b - a))), (b > a ? '賺 ' : '虧 ') + money(Math.abs(u * (b - a) / 10)), (b > a ? '賺 ' : '虧 ') + money(Math.abs(u * (b - a)) * 2)],
      ex: `損益 = 美元金額 ×（賣出匯率 − 買入匯率）= ${fix(u)} ×（${fix(b, 1)} − ${fix(a, 1)}）= ${fix(u * (b - a))} 元。` }; } },
  { id: 'fx-cross', cat: 'fx', diff: 2, title: '交叉匯率', make(r) {
    const y = int(r, 130, 160), e = int(r, 100, 125) / 100;
    return { q: `USD/JPY = ${y}、EUR/USD = ${fix(e, 2)}，EUR/JPY 約是多少？`,
      a: fix(y * e, 1), w: [fix(y / e, 1), fix(y + e, 1), fix(y * e / 100 * 90, 1)],
      ex: `1 歐元 = ${fix(e, 2)} 美元，1 美元 = ${y} 日圓，所以 1 歐元 = ${fix(e, 2)} × ${y} ≈ ${fix(y * e, 1)} 日圓。` }; } },
  { id: 'fx-irp', cat: 'fx', diff: 3, title: '遠期匯率（利率平價）', make(r) {
    const s = int(r, 290, 330) / 10, iu = int(r, 3, 6), it = int(r, 1, 3);
    const f = s * (1 + it / 100) / (1 + iu / 100);
    return { q: `一年期美元利率 ${iu}%、新台幣利率 ${it}%，即期 USD/TWD = ${fix(s, 1)}，依拋補利率平價，一年期遠期匯率約是多少？`,
      a: fix(f, 2), w: [fix(s * (1 + iu / 100) / (1 + it / 100), 2), fix(s, 2), fix(s * (1 + (iu - it) / 50), 2)],
      ex: `遠期 = 即期 ×（1 + 新台幣利率）÷（1 + 美元利率）= ${fix(s, 1)} × ${fix(1 + it / 100, 2)} ÷ ${fix(1 + iu / 100, 2)} ≈ ${fix(f, 2)}。利率較高的美元，遠期會較便宜（貼水）。` }; } },
  { id: 'fx-deposit', cat: 'fx', diff: 3, title: '外幣定存含匯差', make(r) {
    const a = int(r, 290, 330) / 10, i = int(r, 2, 5), b = int(r, 280, 340) / 10;
    const ret = (1 + i / 100) * b / a - 1;
    return { q: `在 USD/TWD = ${fix(a, 1)} 時換美元做一年期定存，年利率 ${i}%；到期時匯率為 ${fix(b, 1)}，換回新台幣的報酬率約是多少？`,
      a: spct(ret, 1), w: [spct(i / 100, 1), spct((1 + i / 100) * a / b - 1, 1), spct(i / 100 + (b - a) / b * 2, 1)],
      ex: `報酬率 =（1 + 利率）× 到期匯率 ÷ 起始匯率 − 1 = ${fix(1 + i / 100, 2)} × ${fix(b, 1)} ÷ ${fix(a, 1)} − 1 ≈ ${spct(ret, 1)}，匯率變動可能吃掉利息。` }; } },

  /* ============ 虛擬貨幣 ============ */
  { id: 'crypto-sats', cat: 'crypto', diff: 1, title: '聰換算', make(r) {
    const x = int(r, 1, 999) / 10000;
    return { q: `${fix(x, 4)} 枚比特幣等於多少聰（satoshi）？`,
      a: fix(x * 1e8) + ' 聰', w: [fix(x * 1e6) + ' 聰', fix(x * 1e7) + ' 聰', fix(x * 1e9) + ' 聰'],
      ex: `1 BTC = 1 億聰（10⁸），${fix(x, 4)} × 100,000,000 = ${fix(x * 1e8)} 聰。` }; } },
  { id: 'crypto-chg', cat: 'crypto', diff: 1, title: '幣價漲跌幅', make(r) {
    const a = int(r, 40, 120) * 1000, b = Math.round(a * (1 + int(r, -35, 50) / 100) / 100) * 100; if (a === b) return null;
    return { q: `比特幣從 ${fix(a)} 美元變成 ${fix(b)} 美元，漲跌幅約是多少？`,
      a: spct((b - a) / a, 1), w: [spct((b - a) / b, 1), spct((a - b) / a, 1), spct((b - a) / a * 2, 1)],
      ex: `漲跌幅 =（${fix(b)} − ${fix(a)}）÷ ${fix(a)} = ${spct((b - a) / a, 1)}。` }; } },
  { id: 'crypto-liq', cat: 'crypto', diff: 2, title: '槓桿與爆倉', make(r) {
    const L = pick(r, [2, 4, 5, 8, 10, 20, 25, 50]);
    return { q: `以 ${L} 倍槓桿做多比特幣（不計手續費與維持保證金），價格大約下跌多少時本金就幾乎歸零？`,
      a: pct(1 / L, 1), w: [pct(L / 100, 1), pct(1 / L / 2, 1), pct(Math.min(0.9, 1 / L * 3), 1)],
      ex: `${L} 倍槓桿下，價格每跌 1%，本金虧 ${L}%；跌 100% ÷ ${L} = ${pct(1 / L, 1)} 時本金就虧光。實際上維持保證金會讓爆倉來得更早。` }; } },
  { id: 'crypto-halving', cat: 'crypto', diff: 2, title: '減半後的區塊獎勵', make(r) {
    const n = int(r, 1, 6), v = 50 / 2 ** n;
    return { q: `比特幣創世時每個區塊獎勵 50 BTC，經過第 ${n} 次減半之後，每個區塊的獎勵是多少？`,
      a: fix(v, 4).replace(/\.?0+$/, '') + ' BTC', w: [fix(v * 2, 4).replace(/\.?0+$/, '') + ' BTC', fix(v / 2, 4).replace(/\.?0+$/, '') + ' BTC', fix(50 / (n + 1), 4).replace(/\.?0+$/, '') + ' BTC'],
      ex: `每次減半獎勵變一半：50 ÷ 2^${n} = ${fix(v, 4).replace(/\.?0+$/, '')} BTC。2024 年 4 月是第 4 次減半，獎勵變成 3.125 BTC。` }; } },
  { id: 'crypto-funding', cat: 'crypto', diff: 3, title: '資金費率成本', make(r) {
    const n = int(r, 1, 20) * 1000, f = pick(r, [0.01, 0.02, 0.03, 0.05]), d = pick(r, [3, 7, 10, 14, 30]);
    return { q: `持有 ${fix(n)} USDT 的永續合約多單，資金費率固定 ${f}%、每 8 小時收付一次，持有 ${d} 天要付多少資金費？`,
      a: fix(n * f / 100 * 3 * d, 2) + ' USDT', w: [fix(n * f / 100 * d, 2) + ' USDT', fix(n * f / 100 * 3, 2) + ' USDT', fix(n * f / 100 * 24 * d, 2) + ' USDT'],
      ex: `一天收付 3 次：${fix(n)} × ${f}% × 3 × ${d} 天 = ${fix(n * f / 100 * 3 * d, 2)} USDT。資金費率為正時，多方付給空方。` }; } },
  { id: 'crypto-il', cat: 'crypto', diff: 3, title: '無常損失', make(r) {
    const k = pick(r, [2, 4, 9, 16]), il = 2 * Math.sqrt(k) / (1 + k) - 1;
    return { q: `在 50/50 的 AMM 流動性池提供兩種代幣，其中一種相對另一種漲成原本的 ${k} 倍，與單純持有相比，無常損失約是多少？`,
      a: pct(il, 1), w: [pct(-(1 - 1 / Math.sqrt(k)), 1), pct(il / 2, 1), pct(-(k - 1) / (2 * k), 1)],
      ex: `無常損失 = 2√k ÷（1 + k）− 1 = 2 × ${fix(Math.sqrt(k), 2)} ÷ ${1 + k} − 1 ≈ ${pct(il, 1)}；價格回到原點時損失會消失。` }; } },

  /* ============ ETF ============ */
  { id: 'etf-prem', cat: 'etf', diff: 1, title: 'ETF 溢價率', make(r) {
    const n = int(r, 200, 1500) / 10, p = Math.round(n * (1 + int(r, -30, 50) / 1000) * 100) / 100; if (Math.abs(p - n) < 0.05) return null;
    return { q: `某 ETF 淨值 ${fix(n, 2)} 元、市價 ${fix(p, 2)} 元，${p > n ? '溢價' : '折價'}幅度約是多少？`,
      a: pct(Math.abs(p - n) / n, 2), w: [pct(Math.abs(p - n) / p, 2), pct(Math.abs(p - n) / n * 10, 2), pct(Math.abs(p - n) / n / 10, 2)],
      ex: `${p > n ? '溢' : '折'}價率 =（市價 − 淨值）÷ 淨值 =（${fix(p, 2)} − ${fix(n, 2)}）÷ ${fix(n, 2)} ≈ ${spct((p - n) / n, 2)}。` }; } },
  { id: 'etf-nhi', cat: 'etf', diff: 1, title: '二代健保補充保費', make(r) {
    const a = int(r, 21, 90) * 1000;
    return { q: `單筆領到 ETF 股利 ${fix(a)} 元，二代健保補充保費（費率 2.11%）要扣多少？`,
      a: money(Math.round(a * 0.0211)), w: [money(Math.round((a - 20000) * 0.0211)), money(Math.round(a * 0.0191)), money(Math.round(a * 0.00211))],
      ex: `單筆股利達 2 萬元就以「全額」計算：${fix(a)} × 2.11% = ${fix(Math.round(a * 0.0211))} 元。` }; } },
  { id: 'etf-yield', cat: 'etf', diff: 1, title: '季配息殖利率', make(r) {
    const p = int(r, 15, 60), d = Array.from({ length: 4 }, () => int(r, 2, 12) / 10), s = d.reduce((x, y) => x + y, 0);
    return { q: `一檔季配息 ETF 股價 ${p} 元，過去四季配息依序為 ${d.map(x => fix(x, 1)).join('、')} 元，以此計算的年化殖利率約是多少？`,
      a: pct(s / p, 2), w: [pct(d[3] / p, 2), pct(d[3] * 12 / p, 2), pct(s / 4 / p * 12, 2)],
      ex: `把四季配息加總 ${fix(s, 1)} 元，除以股價：${fix(s, 1)} ÷ ${p} = ${pct(s / p, 2)}。` }; } },
  { id: 'etf-lev2', cat: 'etf', diff: 2, title: '正 2 的兩天報酬', make(r) {
    const a = int(r, 2, 10) / 100, b = -int(r, 2, 10) / 100;
    const etf = (1 + 2 * a) * (1 + 2 * b) - 1, idx = (1 + a) * (1 + b) - 1;
    return { q: `指數第一天漲 ${pct(a, 0)}、第二天跌 ${pct(-b, 0)}。每日追蹤 2 倍的正 2 ETF，兩天的累積報酬約是多少（不計費用）？`,
      a: spct(etf, 2), w: [spct(2 * idx, 2), spct(2 * (a + b), 2), spct(idx, 2)],
      ex: `正 2 每天各自放大 2 倍：（1 + ${pct(2 * a, 0)}）×（1 − ${pct(-2 * b, 0)}）− 1 = ${spct(etf, 2)}，不等於指數兩天報酬 ${spct(idx, 2)} 的 2 倍。` }; } },
  { id: 'etf-dur', cat: 'etf', diff: 2, title: '債券 ETF 存續期間', make(r) {
    const D = int(r, 3, 20), dy = pick(r, [0.25, 0.5, 0.75, 1]) * (r() < 0.5 ? -1 : 1);
    return { q: `債券 ETF 的存續期間為 ${D} 年，殖利率${dy > 0 ? '上升' : '下降'} ${fix(Math.abs(dy), 2)} 個百分點時，價格約變動多少？`,
      a: spct(-D * dy / 100, 2), w: [spct(D * dy / 100, 2), spct(-dy / 100, 2), spct(-D * dy / 100 / 2, 2)],
      ex: `價格變動 ≈ −存續期間 × 殖利率變動 = −${D} × ${dy > 0 ? '' : '−'}${fix(Math.abs(dy), 2)}% = ${spct(-D * dy / 100, 2)}。殖利率上升，債券價格下跌。` }; } },
  { id: 'etf-fee', cat: 'etf', diff: 3, title: '費用率的長期差距', make(r) {
    const n = pick(r, [10, 20, 30]), g = pick(r, [5, 6, 7, 8]), f1 = pick(r, [0.8, 1, 1.5]), f2 = pick(r, [0.05, 0.1, 0.2]);
    const ratio = ((1 + (g - f1) / 100) / (1 + (g - f2) / 100)) ** n, less = 1 - ratio;
    return { q: `兩檔 ETF 的年報酬（未扣費用）都是 ${g}%，總費用率分別是 ${f1}% 與 ${f2}%，${n} 年後前者的期末資產約比後者少多少？`,
      a: pct(less, 1), w: [pct((f1 - f2) / 100, 1), pct((f1 - f2) * n / 100 * 0.5, 1), pct(less * 2, 1)],
      ex: `期末資產比 =（${fix(1 + (g - f1) / 100, 3)} ÷ ${fix(1 + (g - f2) / 100, 3)}）^${n} ≈ ${pct(ratio, 1)}，約少 ${pct(less, 1)}。費用每年複利累積，時間越長差距越大。` }; } },

  /* ============ 資金管理 ============ */
  { id: 'money-72', cat: 'money', diff: 1, title: '72 法則', make(r) {
    const k = pick(r, [3, 4, 6, 8, 9, 12]);
    return { q: `年報酬率 ${k}%，依 72 法則估算，資產大約幾年會翻倍？`,
      a: fix(72 / k, 0) + ' 年', w: [fix(100 / k, 1) + ' 年', fix(72 / k / 2, 0) + ' 年', fix(k * 72 / 100, 1) + ' 年'],
      ex: `72 法則：72 ÷ 年報酬率 = 72 ÷ ${k} ≈ ${fix(72 / k, 0)} 年。` }; } },
  { id: 'money-reserve', cat: 'money', diff: 1, title: '緊急預備金', make(r) {
    const e = int(r, 20, 80) * 1000, m = pick(r, [3, 4, 6, 9, 12]);
    return { q: `每月必要支出 ${fix(e)} 元，想準備 ${m} 個月的緊急預備金，需要多少錢？`,
      a: money(e * m), w: [money(e * 12), money(e * m / 2), money(e * (m + 3))],
      ex: `緊急預備金 = 每月必要支出 × 月數 = ${fix(e)} × ${m} = ${fix(e * m)} 元。` }; } },
  { id: 'money-goal', cat: 'money', diff: 1, title: '儲蓄目標', make(r) {
    const n = pick(r, [12, 18, 24, 30, 36, 48]), per = int(r, 3, 30) * 1000, g = per * n;
    return { q: `${n} 個月後需要 ${fix(g)} 元，不計利息，每月至少要存多少？`,
      a: money(per), w: [money(g / (n / 12)), money(per * 2), money(g / 100)],
      ex: `${fix(g)} ÷ ${n} 個月 = 每月 ${fix(per)} 元。把大目標拆成每月金額，比較容易執行。` }; } },
  { id: 'money-compound', cat: 'money', diff: 2, title: '複利本利和', make(r) {
    const p = int(r, 5, 50) * 10000, k = pick(r, [2, 3, 4, 5, 6]), n = pick(r, [2, 3, 5]);
    return { q: `${fix(p)} 元以年利率 ${k}% 複利存 ${n} 年，到期本利和約是多少？`,
      a: money(p * (1 + k / 100) ** n), w: [money(p * (1 + k / 100 * n)), money(p * (1 + k / 100) ** (n - 1)), money(p * k / 100 * n)],
      ex: `複利本利和 = 本金 ×（1 + 利率）^年數 = ${fix(p)} × ${fix(1 + k / 100, 2)}^${n} ≈ ${fix(p * (1 + k / 100) ** n)} 元；單利只有 ${fix(p * (1 + k / 100 * n))} 元。` }; } },
  { id: 'money-real', cat: 'money', diff: 2, title: '實質報酬', make(r) {
    const i = int(r, 0, 8), pi = int(r, 1, 5); if (i === pi) return null;
    return { q: `存款或投資的名目報酬率 ${i}%，通膨率 ${pi}%，實質報酬率大約是多少？`,
      a: spct((i - pi) / 100, 0), w: [spct((i + pi) / 100, 0), spct((pi - i) / 100, 0), spct(i / 100, 0)],
      ex: `實質報酬 ≈ 名目報酬 − 通膨率 = ${i}% − ${pi}% = ${spct((i - pi) / 100, 0)}；為負代表購買力在下降。` }; } },
  { id: 'money-4pct', cat: 'money', diff: 2, title: '4% 法則', make(r) {
    const e = int(r, 30, 150) * 10000;
    return { q: `退休後每年預計支出 ${fix(e)} 元，依 4% 法則，大約需要準備多少退休資產？`,
      a: money(e * 25), w: [money(e * 4), money(e * 10), money(e / 0.4)],
      ex: `所需資產 ≈ 年支出 ÷ 4% = ${fix(e)} × 25 = ${fix(e * 25)} 元。` }; } },
  { id: 'money-shares', cat: 'money', diff: 2, title: '可以買多少股', make(r) {
    const c = int(r, 20, 200) * 10000, k = pick(r, [1, 2]), d = pick(r, [2, 4, 5, 8, 10, 20]);
    const sh = c * k / 100 / d; if (!Number.isInteger(sh)) return null;
    return { q: `總資金 ${fix(c)} 元，每筆最多承擔 ${k}% 的風險，停損距離每股 ${d} 元，最多可以買多少股？`,
      a: fix(sh) + ' 股', w: [fix(sh * 10) + ' 股', fix(c / d) + ' 股', fix(sh / 2) + ' 股'],
      ex: `可承擔風險 = ${fix(c)} × ${k}% = ${fix(c * k / 100)} 元；${fix(c * k / 100)} ÷ 每股 ${d} 元 = ${fix(sh)} 股。` }; } },
  { id: 'money-leverage', cat: 'money', diff: 2, title: '實際槓桿', make(r) {
    const eq = int(r, 20, 200) * 10000, lev = pick(r, [1.5, 2, 2.5, 3, 4, 5, 8]);
    return { q: `帳戶權益 ${fix(eq)} 元，持有名目價值 ${fix(eq * lev)} 元的期貨部位，實際槓桿約是幾倍？`,
      a: fix(lev, 1) + ' 倍', w: [fix(lev * 10, 1) + ' 倍', fix(1 / lev, 2) + ' 倍', fix(lev + 1, 1) + ' 倍'],
      ex: `實際槓桿 = 名目價值 ÷ 帳戶權益 = ${fix(eq * lev)} ÷ ${fix(eq)} = ${fix(lev, 1)} 倍；標的變動 1%，帳戶約變動 ${fix(lev, 1)}%。` }; } },
  { id: 'money-mortgage', cat: 'money', diff: 3, title: '房貸月付金', make(r) {
    const L = int(r, 3, 15) * 1000000, y = pick(r, [20, 30]), k = pick(r, [1.8, 2, 2.2, 2.5, 3]);
    const i = k / 1200, n = y * 12, pay = L * i / (1 - (1 + i) ** -n);
    return { q: `房貸 ${fix(L / 10000)} 萬元、${y} 年、年利率 ${k}%，本息平均攤還，每月還款約是多少？`,
      a: money(pay), w: [money(L / n), money(L * (1 + k / 100 * y) / n), money(L * k / 1200)],
      ex: `本息平均攤還每月 = 貸款 × 月利率 ÷（1 −（1 + 月利率）^−期數）≈ ${fix(pay)} 元；只看本金 ÷ 期數的 ${fix(L / n)} 元忽略了利息。` }; } },
  { id: 'money-fv', cat: 'money', diff: 3, title: '定期定額終值', make(r) {
    const s = int(r, 3, 20) * 1000, y = pick(r, [10, 15, 20, 25, 30]), k = pick(r, [3, 4, 5, 6, 7]);
    const i = k / 1200, n = y * 12, fv = s * ((1 + i) ** n - 1) / i;
    return { q: `每月定期定額投入 ${fix(s)} 元，年報酬率 ${k}%（按月複利），${y} 年後大約累積多少？`,
      a: money(fv), w: [money(s * n), money(s * 12 * (1 + k / 100) ** y), money(fv * 1.5)],
      ex: `終值 = 每月金額 ×（（1 + 月利率）^月數 − 1）÷ 月利率 ≈ ${fix(fv)} 元；投入本金只有 ${fix(s * n)} 元，其餘是複利。` }; } },
  { id: 'money-kelly', cat: 'money', diff: 3, title: '連續型凱利', make(r) {
    const m = pick(r, [3, 4, 5, 6, 8]), sd = pick(r, [10, 15, 20, 25]);
    const f = (m / 100) / (sd / 100) ** 2;
    return { q: `依連續型凱利公式 f* ≈ 超額報酬 ÷ 變異數，年超額報酬 ${m}%、年波動率 ${sd}%，最適槓桿約是幾倍？`,
      a: fix(f, 2) + ' 倍', w: [fix(m / sd, 2) + ' 倍', fix(sd / m, 2) + ' 倍', fix(f / 2, 2) + ' 倍'],
      ex: `f* = ${m}% ÷（${sd}%）² = ${fix(m / 100, 2)} ÷ ${fix((sd / 100) ** 2, 4)} ≈ ${fix(f, 2)} 倍；實務上常只用一半（半凱利）。` }; } },
  { id: 'money-atr', cat: 'money', diff: 3, title: 'ATR 部位大小', make(r) {
    const R = int(r, 5, 30) * 1000, a = pick(r, [2, 2.5, 4, 5, 8, 10]), k = pick(r, [1, 2, 3]);
    const sh = R / (k * a); if (!Number.isInteger(sh)) return null;
    return { q: `每筆願意虧損 ${fix(R)} 元，停損設在 ${k} 倍 ATR，ATR 為 ${fix(a, 1)} 元，最多可以買多少股？`,
      a: fix(sh) + ' 股', w: [fix(R / a) + ' 股', fix(R * k / a) + ' 股', fix(sh * 10) + ' 股'],
      ex: `停損距離 = ${k} × ${fix(a, 1)} = ${fix(k * a, 1)} 元；部位 = ${fix(R)} ÷ ${fix(k * a, 1)} = ${fix(sh)} 股。` }; } },
];

/* draw one question from a template: → { q, options (right one first), answer: 0, explain } or null */
export function make(t, rnd) {
  for (let i = 0; i < 12; i++) {
    const x = t.make(rnd);
    if (!x) continue;
    const wrong = [...new Set(x.w)].filter(w => w !== x.a);
    if (wrong.length < 3) continue;
    return { q: x.q, options: [x.a, ...wrong.slice(0, 3)], answer: 0, explain: x.ex };
  }
  return null;
}
export const templateById = id => TEMPLATES.find(t => t.id === id) || null;
