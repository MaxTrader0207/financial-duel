// pool.mjs — 排位賽不公開題庫的加密與建置。
//   node tools/pool.mjs keygen              產生一把新金鑰（base64），放進 GitHub secret RANKED_POOL_KEY
//   node tools/pool.mjs encrypt             pool/pool.json（明文，不進 git）→ pool/pool.enc.json（加密，進 git）
//   node tools/pool.mjs decrypt             pool/pool.enc.json → pool/pool.json（要編輯題目時）
//   node tools/pool.mjs build [--fixture]   產生 src/pool.gen.json 給 Worker 打包：有金鑰就解密；沒有金鑰時是空題庫
//                                           （--fixture：沒有金鑰時改用 test/pool.fixture.json，給整合測試用）
// 金鑰從環境變數 RANKED_POOL_KEY 讀取。AES-256-GCM，內容先 gzip 再加密。
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const at = p => fileURLToPath(new URL('../' + p, import.meta.url));
const PLAIN = at('pool/pool.json'), ENC = at('pool/pool.enc.json'), OUT = at('src/pool.gen.json'), FIXTURE = at('test/pool.fixture.json');
const CATS = ['tech', 'fund', 'deriv', 'risk', 'chips', 'fx', 'crypto', 'etf'];

function key() {
  const k = process.env.RANKED_POOL_KEY ? Buffer.from(process.env.RANKED_POOL_KEY.trim(), 'base64') : null;
  if (k && k.length !== 32) throw new Error('RANKED_POOL_KEY 必須是 32 bytes 的 base64 字串');
  return k;
}
export function check(pool) {
  if (!pool || !Array.isArray(pool.questions)) throw new Error('題庫格式不正確：缺少 questions');
  const ids = new Set();
  for (const q of pool.questions) {
    const where = `題目 ${q && q.id}`;
    if (!q || typeof q.id !== 'string' || !/^p-[\w-]+$/.test(q.id) || ids.has(q.id)) throw new Error(`${where}：id 必須是 p- 開頭且不重複`);
    ids.add(q.id);
    if (!CATS.includes(q.category)) throw new Error(`${where}：category 不正確`);
    if (![1, 2, 3].includes(q.difficulty)) throw new Error(`${where}：difficulty 必須是 1～3`);
    if (typeof q.q !== 'string' || q.q.length < 6) throw new Error(`${where}：題目太短`);
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4 || q.options.some(o => typeof o !== 'string' || !o)) throw new Error(`${where}：需要 4 個不同的選項`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) throw new Error(`${where}：answer 必須是 0～3`);
    if (typeof q.explain !== 'string' || q.explain.length < 10) throw new Error(`${where}：解說太短`);
  }
  return pool.questions.length;
}
function encrypt(obj, k) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([c.update(gzipSync(Buffer.from(JSON.stringify(obj)))), c.final()]);
  return { v: 1, alg: 'aes-256-gcm+gzip', iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function decrypt(enc, k) {
  const d = createDecipheriv('aes-256-gcm', k, Buffer.from(enc.iv, 'base64'));
  d.setAuthTag(Buffer.from(enc.tag, 'base64'));
  return JSON.parse(gunzipSync(Buffer.concat([d.update(Buffer.from(enc.data, 'base64')), d.final()])).toString('utf8'));
}

const [cmd, flag] = process.argv.slice(2);
if (cmd === 'keygen') console.log(randomBytes(32).toString('base64'));
else if (cmd === 'encrypt') {
  const k = key(); if (!k) throw new Error('請先設定 RANKED_POOL_KEY');
  const pool = JSON.parse(readFileSync(PLAIN, 'utf8')); const n = check(pool);
  writeFileSync(ENC, JSON.stringify(encrypt(pool, k)) + '\n');
  if (JSON.stringify(decrypt(JSON.parse(readFileSync(ENC, 'utf8')), k)) !== JSON.stringify(pool)) throw new Error('加密後解不回來');
  console.log(`已加密 ${n} 題 → pool/pool.enc.json`);
} else if (cmd === 'decrypt') {
  const k = key(); if (!k) throw new Error('請先設定 RANKED_POOL_KEY');
  const pool = decrypt(JSON.parse(readFileSync(ENC, 'utf8')), k);
  writeFileSync(PLAIN, JSON.stringify(pool, null, 2) + '\n'); console.log(`已解密 ${check(pool)} 題 → pool/pool.json`);
} else if (cmd === 'build') {
  const k = key();
  let pool = { questions: [] }, from = '空題庫（沒有 RANKED_POOL_KEY）';
  if (k && existsSync(ENC)) { pool = decrypt(JSON.parse(readFileSync(ENC, 'utf8')), k); from = '加密題庫'; }
  else if (flag === '--fixture' && existsSync(FIXTURE)) { pool = JSON.parse(readFileSync(FIXTURE, 'utf8')); from = '測試用題庫'; }
  const n = check(pool);
  writeFileSync(OUT, JSON.stringify({ questions: pool.questions }));
  console.log(`src/pool.gen.json：${from}，${n} 題`);
} else {
  console.log('用法：node tools/pool.mjs keygen | encrypt | decrypt | build [--fixture]');
  process.exitCode = 1;
}
