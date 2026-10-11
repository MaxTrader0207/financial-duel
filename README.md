# 金融決鬥

日式卡牌對決風格的金融知識遊戲：召喚交易怪獸，答對題目才能攻擊或防禦。

**▶ 線上遊玩：https://maxtrader0207.github.io/financial-duel/**

免安裝、免登入，電腦與手機瀏覽器都能玩。手機可用「加入主畫面」當成 App 開啟，載入過一次後斷線也能玩。

![標題畫面](docs/media/title-desktop.png)

## 部署到 GitHub Pages（第一次設定，約 3 分鐘）

1. 在 GitHub 建立新的 repository，名稱填 `financial-duel`，設為 **Public**（免費帳號的 Pages 需要公開 repo）。
2. 把這個資料夾的**所有內容**（包含隱藏的 `.github/`、`.nojekyll`）上傳到 repo 的 `main` 分支：
   ```bash
   cd financial-duel
   git init -b main
   git add .
   git commit -m "金融決鬥 初版"
   git remote add origin https://github.com/MaxTrader0207/financial-duel.git
   git push -u origin main
   ```
   不用指令的話，也可以在 repo 頁面按 **Add file → Upload files**，把資料夾內容整個拖進去（網頁上傳時 `.github` 資料夾要另外確認有傳上去）。
3. 到 repo 的 **Settings → Pages**，**Source** 選 **GitHub Actions**。
4. 到 **Actions** 分頁，等「部署到 GitHub Pages」跑完（約 1 分鐘，綠色勾勾），網址就是
   `https://maxtrader0207.github.io/financial-duel/`

之後只要 push 到 `main`，網站就會自動更新。玩家下次開啟時會自動拿到新版。

> 若 repo 改用別的名稱，網址會變成 `https://maxtrader0207.github.io/<repo 名稱>/`，程式不用改（全部使用相對路徑）。
> 不想用 Actions 的話，Settings → Pages 的 Source 也可以選 **Deploy from a branch → main / (root)**，效果相同（只是 `tests/` 也會一起公開）。

## 檔案結構

```
financial-duel/
├─ index.html              遊戲本體（單一檔案：樣式、程式、內建 250 題題庫）
├─ sw.js                   Service Worker：離線遊玩、連線時自動取最新版
├─ manifest.webmanifest    手機「加入主畫面」設定
├─ icon.svg / icon-*.png   網站與 App 圖示
├─ data/
│  ├─ questions.json       內建題庫 250 題（5 屬性 × 50 題），格式同題庫匯入
│  └─ cards.json           卡池 50 張對照表
├─ vendor/
│  ├─ jspdf.umd.min.js     jsPDF 2.5.1，輸出 PDF 用
│  └─ jspdf-LICENSE.txt
├─ docs/
│  ├─ media/               截圖、八種對戰場景、配樂試聽
│  └─ samples/             對戰結果 PDF／PNG 範例
├─ tests/                  Playwright 自動化測試（不會部署到網站）
├─ .github/workflows/pages.yml   自動部署設定
└─ .nojekyll               讓 GitHub Pages 原樣提供檔案
```

## 本機執行

直接雙擊 `index.html` 就能玩。若要測試離線／加入主畫面功能，需透過 HTTP 開啟：

```bash
python3 -m http.server 8000
# 瀏覽器開 http://localhost:8000
```

## 遊戲規則

| 項目 | 設定 |
|---|---|
| 起始資金 | 雙方各 10,000 |
| 手牌 | 5 張，每回合補滿（部分技能可到 6 張） |
| 牌組 | 每方 100 張（50 種卡各 2 張） |
| 難易度 | 簡易 30 秒（速攻 12 秒、對手攻擊 ×0.7）／適中 20 秒（速攻 9 秒、×1.0）／困難 10 秒（速攻 6 秒、×1.3） |
| 攻擊 | 答對造成攻擊力傷害；速攻 +300；連續答對 3 題起每次 +500 |
| 防禦 | 答對只承受「攻擊力 − 守備力」，守備較高時反彈；答錯承受全額 |
| 技能 | 每張卡一個專屬技能；攻擊類技能在對手使用時於命中你時發動 |
| 錯題本 | 答錯的題目自動收錄；第 1 階立即複習、第 2 階隔 1 天、第 3 階隔 3 天，第 3 階再答對即掌握；對戰中有 35% 機率改出到期的錯題 |
| 題目回報 | 答題後可回報「答案有誤／選項有問題／題意不清／資訊過時／其他」，在題庫管理複製全部回報 |
| 對戰場景 | 每場隨機抽一種背景（青海波、七寶、龜甲、雷紋、矢絣、竹林、櫻吹雪、星空），不與上一場重複 |
| 新手引導 | 第一場對戰依序提示出牌、答題、防禦；可略過，也可從標題畫面「新手引導」重玩 |
| 遊玩時間 | 連續遊玩 30 分鐘跳出善意提醒；55 分鐘預告；滿 1 小時自動記錄對戰並強制休息 2 小時 |

## 擴充題庫

**不改程式**：遊戲標題畫面 →「題庫管理」→ 貼上 JSON 或選擇 .json 檔匯入（只存在該玩家的瀏覽器）。

**寫進內建題庫（所有玩家都看得到）**：編輯 `index.html` 中 `<script type="application/json" id="builtin-bank">` 區塊，push 後自動上線。

```json
{
  "id": "t51",
  "category": "tech",
  "difficulty": 2,
  "q": "題目文字",
  "options": ["選項一", "選項二", "選項三", "選項四"],
  "answer": 0,
  "explain": "解析文字"
}
```

- `category`：`tech` 技術分析、`fund` 基本面、`deriv` 衍生性商品、`risk` 風險管理、`chips` 籌碼與市場（也接受中文名稱）
- `difficulty`：1 初階、2 中階、3 進階；1–2 星卡出初階、3 星出中階、4 星出進階
- `answer`：正確選項的索引，從 0 開始；出題時選項順序會隨機打亂
- 相同 `id` 會覆蓋舊題
- `asOf`（選填）：有時效性的題目填資料基準年月，例如 `"2026-10"`

## 新增卡牌

`data/cards.json` 是卡池對照表，遊戲實際讀取的是 `index.html` 內的兩處：

1. `const MONSTERS = [...]`：卡牌資料（id、名稱、屬性、星數 1–4、攻、守、種族、印章字、背景描述）
2. `const SKILLS = {...}`：以卡牌 id 為鍵的技能，可用的掛鉤：
   - `hit(c)` 攻擊命中時（可改 `c.dmg`、`c.mult`、`c.heal`、`c.lifesteal`）
   - `miss(c)` 攻擊失敗時（`c.dmg`、`c.backlash`、`c.heal`）
   - `defOk(c)` 防禦成功時（`c.reflect`、`c.pierce`、`c.heal`）
   - `defFail(c)` 防禦失敗時（`c.dmg`）
   - `defBonus` 守備加成（數字或函式）
   - `quiz: { remove, extraTime, retry }` 刪去錯誤選項、延長時間、答錯重答
   - 掛鉤回傳 `true` 代表技能有發動

## 資料儲存

存檔、錯題本、題目回報、自訂題目、遊玩時間、新手引導與音效設定都存在**玩家自己瀏覽器**的 localStorage（鍵名以 `soba-ketto.` 開頭），不會上傳到任何伺服器；換瀏覽器或清除網站資料就會消失。

## 執行測試

```bash
pip install playwright && python -m playwright install chromium
cd tests
sh build.sh                     # 由 ../index.html 產生可被腳本操控的 test.html
python t_full.py normal 0.7 1   # 完整打一場：難易度、答對率、亂數種子
python t_skills.py              # 50 張卡 × 4 種情況的技能測試（約 20 分鐘）
python t_misc.py                # 存檔讀檔、PDF/PNG 輸出、遊玩時間提醒
python t_nb.py                  # 錯題本、複習模式、題目回報
python t_tut.py                 # 新手引導（加參數 m 改用手機尺寸）
```

## 外部資源與授權

- jsPDF 2.5.1（MIT），已附於 `vendor/`
- Google Fonts：Noto Sans TC、Noto Serif TC（SIL Open Font License），執行時線上載入；離線時改用系統字型
- 音樂與音效全部由 Web Audio API 即時合成，沒有音檔
- 卡面插圖為內嵌 SVG 原創繪製
