# 金融決鬥 · 線上排行榜 API

這是 Cloudflare Workers 程式，資料存放在 D1 資料庫。

- 遊戲網址：`https://maxtrader0207.github.io/financial-duel/`
- API 網址：`https://financial-duel-api.maxwei6699.workers.dev`

## 第一次上線（只要做一次）

推到 `main` 時，GitHub Actions 的 `worker-deploy` 工作會自動部署。它需要 repo 裡有 `CLOUDFLARE_API_TOKEN` 這個 secret：

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
| `POST /v1/match/q` `{ticket, cat, rank, limit, remove, retry}` | 排位賽出一題：回傳題目與選項，不含答案。上一題沒作答就以時間到計 |
| `POST /v1/match/a` `{ticket, n, pick}` | 送出作答（顯示順序，−1 = 時間到），回傳對錯、正解與解說；重送同一題會得到同樣的結果 |
| `POST /v1/match/end` `{ticket, win, perf, answers}` 或 `{ticket, surrender: true}` | 結算這場。`answers` 只放斷線時改用本機題庫的題目（最多 3 題） |
| `POST /v1/ping` `{pid, days}` | 匿名使用統計：一個隨機編號，加上每天的開啟與對戰次數 |
| `GET /v1/stats?key=密碼` | 最近 30 天的每日統計頁（加 `&format=json` 取得 JSON） |
| `POST /v1/transfer` `{data}` | 上傳進度，換一組 8 碼轉移碼（24 小時內有效，同一網路位址每天最多 10 組） |
| `POST /v1/transfer/redeem` `{code}` | 用轉移碼取回進度；只能用一次，取回後伺服器立即刪除 |
| `POST /v1/challenge` `{seed, deck, name, score, win}` | 建立好友挑戰（同時記下出題者的分數），回傳 6 碼代碼；30 天有效 |
| `GET /v1/challenge/代碼` | 挑戰內容與前 50 名分數 |
| `POST /v1/challenge/代碼/result` `{name, score, win}` | 留下分數；同一個暱稱只保留最高分 |

## 每日玩家數

遊戲第一次開啟時會產生一個隨機的匿名編號。之後每天記下開啟次數、對戰（休閒／排位／新手場）、勝場、每日挑戰，送到 `/v1/ping`。這些資料不含帳號、暱稱、IP 或任何個人資料；玩家可以在「設定 → 匿名使用統計」關閉。

查看統計：

1. 在 GitHub repo 的 **Settings → Secrets and variables → Actions** 新增 secret `STATS_KEY`，內容是你自己取的一組密碼（建議 16 個字以上）。
2. 重新部署（Actions → Run workflow，或推一個 commit）。
3. 打開 `https://financial-duel-api.maxwei6699.workers.dev/v1/stats?key=你的密碼`。

統計頁顯示以下內容：

- 今天的玩家數，近 7 天的玩家數與對戰數。
- 累計玩家數、加入排行榜的人數、線上排位賽場數。
- 次日留存（新玩家隔天又開啟的比例）、7 日留存、新手場完成率。
- 題目品質（累積 20 次以上作答的題目）：可能有爭議的題目（某個錯誤選項被選得比正解還多）、最難的 10 題、答對率 97% 以上的題目。
- 最近 30 天每一天的明細：玩家、新玩家、次日回來比例、開啟次數、對戰、休閒、排位、好友挑戰、新手場、每日挑戰。

「玩家」是當天開啟遊戲的不同裝置數，日期以台灣時間計算。密碼連續錯 10 次，該網路位址會被擋一小時。

## 排位賽由伺服器出題

排位賽的每一題都由伺服器出（`src/pool.js`），答案留在伺服器，玩家送出選擇後才判定對錯、回傳正解。題目有三種來源：

- **計算題**（`src/templates.js`，59 種）：例如停損價、殖利率、期貨損益、匯率換算、槓桿爆倉。每次出題都隨機換數字，答案必須算出來，沒辦法查表。
- **不公開題庫**（`pool/pool.enc.json`，目前 96 題）：概念題。檔案是加密的，部署時才用 GitHub secret 解密，所以公開的程式碼裡看不到題目和答案。
- **公開題庫**（`public/data/questions.json`）：只在不公開題庫沒有啟用時使用。

有不公開題庫時，計算題佔 40%、不公開題 60%；沒有時，計算題與公開題各半。卡牌技能照常有效：「刪去錯誤選項」由伺服器挑要刪的選項，「再答一次」由伺服器允許第二次作答，「答題時間 +N 秒」最多到 35 秒。

斷線時遊戲會改用本機題庫的備用題，結算時一起送出；一場最多 3 題，超過就不列入排行榜。

### 啟用不公開題庫（只要做一次）

1. 在 GitHub repo 的 **Settings → Secrets and variables → Actions** 新增 secret `RANKED_POOL_KEY`，內容是作者提供的金鑰（44 個字元的 base64）。
2. 重新部署（Actions → Run workflow，或推一個 commit）。
3. 打開 `/v1/health`，`rankedPool` 顯示題數（目前 96）就代表已啟用；`0` 代表還沒有金鑰。

金鑰請自己另外保存一份：GitHub secret 存進去之後就看不到內容了，之後要修改題目時需要它。

### 修改不公開題庫

```bash
cd worker
export RANKED_POOL_KEY='金鑰'
npm run pool:decrypt     # pool/pool.enc.json → pool/pool.json（明文，已在 .gitignore，不會被提交）
# 編輯 pool/pool.json：id 用 p- 開頭，四個選項，answer 是正解的位置（0～3），伺服器出題時會打亂選項順序
npm run pool:encrypt     # 檢查格式後加密回 pool/pool.enc.json
git add pool/pool.enc.json && git commit -m "更新排位題庫"
```

`npm test` 與 `npm run dev` 使用 `test/pool.fixture.json` 的假題目，不需要金鑰。

## 計分與防作弊

- **伺服器自己計分**：積分由伺服器依 `src/js/rankrules.js` 計算。這和遊戲使用的是同一個檔案。瀏覽器送出勝負、策略與風險兩項表現分，以及每一題的作答紀錄，不能直接指定積分。
- **伺服器判分**：排位題由伺服器出題、計時並判定對錯，知識分（≤ 40）以伺服器為準。以下情況不列入排行榜：
  - 有任何一題作答快於 0.4 秒。
  - 斷線時改答的本機備用題超過 3 題，或備用題的紀錄不正確（不存在的題目、格式錯誤、時間加總超過對戰時間）。
  - 答對不到 2 題卻宣稱獲勝。
  - 超過時限（加 4 秒網路延遲）才送出的作答算時間到；出了題卻沒作答也算時間到。
- **對戰憑證**：每張只能結算一次，而且只有開局的玩家能用。
- **對戰時間限制**：
  - 短於 45 秒的對戰不予計分。
  - 超過 3 小時沒結算，以敗場計。
  - 每人每小時最多 30 場。
- **加入次數限制**：同一個網路位址每天最多加入 5 次。
- **暱稱規則**：2～12 個字，大小寫視為相同，不能重複，並過濾少數不雅字。
- **身分保存**：伺服器只存 token 的 SHA-256 雜湊，不存 token 本身。

**限制：** 排位題的正解會在作答後顯示（為了學習），所以有心人玩很多場後，有可能把不公開題庫的概念題慢慢收集起來；計算題每次數字不同，不受影響。題庫會持續擴充；若發現外流，換掉題目重新加密即可。

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
