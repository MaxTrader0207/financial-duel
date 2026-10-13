# 金融決鬥 · 線上排行榜 API

這是 Cloudflare Workers 程式，資料存放在 D1 資料庫。

- 遊戲網址：`https://maxtrader0207.github.io/financial-duel/`
- API 網址：`https://financial-duel-api.maxwei6699.workers.dev`

## 第一次上線（只要做一次）

推到 `main` 時，GitHub Actions 的 `worker-deploy` 工作會自動部署。它需要 repo 裡有以下兩個 secret：

1. **建立 API Token**
   1. 打開 Cloudflare 後台的 **My Profile → API Tokens → Create Token**。
   2. 選範本 **Edit Cloudflare Workers**。
   3. 在 Permissions 再加一列：**Account · D1 · Edit**。
   4. Account Resources 選你的帳號，然後建立 Token。
2. **（可省略）Account ID**：登入 Cloudflare 後台後，網址 `dash.cloudflare.com/` 後面那段 32 個英數字。Token 只涵蓋一個帳號時可以不填，wrangler 會自己找到帳號。
3. **加到 GitHub**：打開 repo 的 **Settings → Secrets and variables → Actions → New repository secret**，新增：
   - `CLOUDFLARE_API_TOKEN`（必要）
   - `CLOUDFLARE_ACCOUNT_ID`（可省略）
4. **重新部署**：到 **Actions → Test and deploy to GitHub Pages → Run workflow** 再跑一次，或推一個新 commit。

第一次部署時，工作會自動做這些事：

- 建立名為 `financial-duel` 的 D1 資料庫。
- 套用 `migrations/` 裡的資料表。
- 部署 Worker。
- 呼叫 `/v1/health` 確認服務正常。

之後每次推送都會更新 Worker，新增的 migration 也會自動套用。

## API

所有回應都是 JSON。錯誤時回傳 `{ error: "中文說明", code }`。需要身分的請求帶 `Authorization: Bearer <id>.<token>`。

| 方法與路徑 | 用途 |
|---|---|
| `GET /v1/health` | 服務狀態與目前賽季 |
| `GET /v1/board?season=YYYY-MM` | 前 100 名；有帶身分時，另外回傳自己的名次 |
| `POST /v1/register` `{name, rp}` | 用暱稱加入。`rp` 是帶入的本機積分，最多 250 |
| `GET /v1/me` | 自己本季的積分、段位、名次 |
| `POST /v1/me` `{name}` | 改暱稱，一天最多 3 次 |
| `DELETE /v1/me` | 退出排行榜，刪除暱稱與所有成績 |
| `POST /v1/match/start` | 開始一場排位賽，取得對戰憑證。若有沒結束的上一場，先以敗場結算 |
| `POST /v1/match/end` `{ticket, win, perf}` 或 `{ticket, surrender: true}` | 結算這場 |

## 計分與防作弊

- **伺服器自己計分**：積分由伺服器依 `src/js/rankrules.js` 計算。這和遊戲使用的是同一個檔案。瀏覽器只送出勝負和三項表現分（知識 ≤ 40、策略 ≤ 35、風險 ≤ 25），不能直接指定積分。
- **對戰憑證**：每張只能結算一次，而且只有開局的玩家能用。
- **對戰時間限制**：
  - 短於 45 秒的對戰不予計分。
  - 超過 3 小時沒結算，以敗場計。
  - 每人每小時最多 30 場。
- **加入次數限制**：同一個網路位址每天最多加入 5 次。
- **暱稱規則**：2～12 個字，大小寫視為相同，不能重複，並過濾少數不雅字。
- **身分保存**：伺服器只存 token 的 SHA-256 雜湊，不存 token 本身。

**限制：** 對戰本身在瀏覽器裡進行，伺服器看不到每一題的作答過程，所以改過程式的人仍可能謊報勝場。目前的檢查只能讓作弊變得麻煩、效果有限。若要完全防止，題目和判定都必須改由伺服器出題與判分。

## 本機開發

```bash
cd worker
npm ci
npm run migrate:local     # 在本機 D1 建立資料表
npm run dev               # http://127.0.0.1:8787
npm test                  # 整合測試：啟動 wrangler dev，連到本機 D1
```

要讓遊戲連到本機的 API，在瀏覽器 console 執行：

```js
localStorage.setItem('soba-ketto.api', 'http://127.0.0.1:8787')
```

建置時也可以用環境變數 `VITE_API` 換掉預設的 API 網址。
