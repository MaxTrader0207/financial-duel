# 金融決鬥

日式卡牌對決風格的金融知識遊戲：召喚交易怪獸，答對題目才能攻擊或防禦。9 個屬性、180 張卡、900 題。

**▶ 線上遊玩：https://maxtrader0207.github.io/financial-duel/**

每天還有一則 3 分鐘的生活金融挑戰（信用卡、詐騙、保險、儲蓄…），完成可以拿經驗值、卡牌碎片和稱號；排位賽依段位與表現計分，每月賽季發放限定稱號與卡背，也可以取個暱稱加入線上排行榜（後端在 `worker/`，Cloudflare Workers + D1）；還有 100 張「金融知識卡」（股票、防禦、事件、陷阱各 25 張）可以收集、升級，集成一套金融知識圖鑑。

免安裝、免登入，電腦與手機都能玩。手機可以「安裝到主畫面」，像 App 一樣全螢幕開啟，離線也能玩。

![標題畫面](docs/media/title-desktop.png)

---

# 原始碼專案

Vite 建置的 ES 模組專案。卡牌與題庫是 `public/data/` 裡的 JSON，執行時載入；遊戲邏輯分成 50 個模組，彼此沒有循環引用。

## 指令

```bash
npm install
npm run dev               # 開發伺服器，改檔即時更新
npm test                  # 單元測試（Vitest）：傷害計算、180 張卡、狀態機、存檔轉換、資料完整性
npm run build             # dist/：GitHub Pages 版，data/*.json 執行時載入；可安裝成 App、離線可玩（sw.js 建置時產生）
npm run build:artifact    # artifact/index.html：claude.ai Artifact 單檔版（資料內嵌，jsPDF 走 cdnjs）
npm run build:standalone  # standalone/：雙擊即可開的單檔版，jsPDF 放在旁邊的 vendor/，可離線
npm run build:test        # dist-test/：加上 window.__T 測試掛鉤，給瀏覽器測試用
npm run e2e               # 瀏覽器測試（Playwright）：建置 dist-test/ 後在桌面與手機兩種尺寸各跑一次
npm run test:all          # 單元測試 + 三種建置 + 瀏覽器測試，和 GitHub Actions 做的一樣
npm run build:all         # 前三種一次建置
npm run sim               # 平衡模擬：不開瀏覽器打上萬場，輸出 sim/out/<名稱>.json（見下方）
cd worker && npm ci && npm test   # 線上排行榜 API 的整合測試（本機 D1）
```

## 發布新版本

1. 在 `src/data/changelog.json` 的 `releases` 最前面加一筆：`version`、`date`（台灣時間 `YYYY-MM-DD HH:mm`）、`title`、`items`（給玩家看的更新項目）。
2. 把 `package.json` 的 `version` 改成一樣（單元測試會檢查兩者一致、版本與日期由新到舊）。
3. 推上 main。玩家下次開啟遊戲會看到這次的更新內容；標題畫面顯示「v版本 · 更新時間」。

## 部署到 GitHub Pages

1. 把這個資料夾推到 GitHub repo 的根目錄（main 分支）。
2. repo 的 Settings → Pages → Source 選「GitHub Actions」。
3. 之後每次 push，`.github/workflows/pages.yml` 會先跑單元測試與瀏覽器測試（桌面＋手機），全部通過才建置並發布 `dist/`。Pull request 也會跑測試，但不發布；失敗時測試報告與截圖會附在 Actions 頁面的 `playwright-report`。

`vite.config.js` 的 `base: './'` 讓網站放在任何子路徑都能運作，例如 `https://<帳號>.github.io/<repo>/`。

## 資料檔

| 檔案 | 內容 |
|---|---|
| `public/data/cards.json` | 180 張卡：`id`、`name`、`cat`（tech fund deriv risk chips fx crypto etf money）、`rank` 1–4、`atk`、`def`、`race`、`sigil`、`text` |
| `public/data/questions.json` | 900 題（9 個屬性各 100 題，初階 34／中階 36／進階 30），格式與遊戲內「題庫管理」的匯入格式相同 |
| `public/data/knowledge.json` | 100 張金融知識卡（四種各 25 張）：`type`（stock 股票卡、defense 防禦卡、event 事件卡、trap 陷阱卡）、`name`、`sigil`、`summary`、`levels`（Lv1–Lv3 的說明：是什麼、實際例子、常見誤區）、`quiz`（升 Lv2、Lv3 的檢定題）；`starter` 是新玩家一開始擁有的卡 |
| `public/data/daily.json` | 每日挑戰的生活金融情境（目前 98 個 × 3 題，100 張知識卡中有 85 張連到情境）：`id`、`theme`、`title`、`scene`、`questions`（`q`、4 個 `options`、`answer`、`explain`）、`takeaway`、`card`（完成這天會解鎖的知識卡），有時效的數字可加 `asOf`／`reviewBy`。依日期輪替，98 天一輪；直接加情境就會排進輪替（已經開始的那一天不會被換掉） |

GitHub Pages 版直接改 JSON 就會生效，不必重新建置；單檔版要重新建置。

新增卡牌時，在 `cards.json` 加一筆，再到 `src/js/skills.js` 的 `SKILLS` 用同一個 `id` 寫技能。沒寫技能的卡會顯示「無技能」，照常可以出牌。

## 模組結構

遊戲邏輯分成 50 個 ES 模組，依賴關係**只往下、不繞圈**（`tests/architecture.test.js` 會檢查：沒有循環引用、規則模組不引用畫面模組）。

```
畫面與流程   flow  result  screens  deckui  recordui  bankui  wiring  settings  tutor  playtime  pwa
   │           │ 對戰回合順序、各畫面、事件綁定
桌面與動畫   board（手牌、資金條、階段）  fx（召喚、傷害動畫）  view（切換畫面、過場、提示）  foequiz  report
   │
規則         calc（傷害計算）  skills（180 個技能）  ai（對手出牌）  deck（抽牌、洗牌）  state（開新局）
             quiz  bank  notebook  records  collection  save  rules  fsm
   │
資料與基礎   carddata（卡牌資料）  cards（卡面繪製）  scenes  ur-art  core  data  sound  perf  backgrounds
   │
共用葉節點   game（對戰狀態 G）  actions（跨畫面動作）  ui（給技能用的畫面掛鉤）
```

| 模組 | 負責 |
|---|---|
| `main.js` → `app.js` | 進入點：載入資料，依序呼叫各模組的 `init()` |
| `game.js` | 目前這場對戰的狀態 `G`（欄位說明寫在檔案開頭的 JSDoc）；只有 `flow.js` 會用 `setGame()` 換掉它 |
| `actions.js` | 跨畫面動作（開始對戰、續戰、回標題、打開牌組）：擁有者在 `init()` 註冊，呼叫方用 `Actions.x()`，不必互相引用 |
| `ui.js` | 技能需要的畫面更新（重畫手牌、資金條、飄字、記錄）；由 `board.js`、`fx.js` 提供 |
| `carddata.js`、`cards.js` | 卡牌資料（屬性、180 張卡、稀有度）／卡面繪製（依稀有度的插圖、延遲繪製） |
| `skills.js`、`calc.js`、`rules.js` | 180 個技能、傷害計算純函式、屬性相剋 |
| `deck.js`、`state.js`、`fsm.js` | 抽牌與洗牌、開新局、對戰狀態機 |
| `flow.js`、`ask.js`、`quiz.js` | 回合流程（含續戰）、答題畫面、出題 |
| `board.js`、`fx.js`、`view.js`、`foequiz.js` | 對戰桌面、動畫、切換畫面與過場、對手作答畫面 |
| `save.js`、`progress.js` | 對戰存檔與版本轉換、匯出／匯入進度、轉移碼（經伺服器把進度搬到另一台裝置） |
| `ai.js`、`collection.js`、`records.js` | 對手策略、收藏與牌組、學習紀錄 |
| `notebook.js`、`feedback.js`、`bank.js`、`bankui.js` | 錯題本（間隔複習：第 1 階立即、第 2 階隔 1 天、第 3 階隔 3 天；沒到期先答對不升階；記下上次選錯的答案；標題到期提醒與複習結果）、題目回報、題庫 |
| `report.js`、`result.js` | PDF／PNG 對戰報告、結算畫面 |
| `scenes.js`、`ur-art.js` | 每屬性第 2、3 種卡面場景、32 張極稀有卡的專屬插圖 |
| `perf.js`、`pwa.js` | 簡化特效、可安裝 App |
| `market.js` | 市場事件：休閒與排位對戰中每 3 回合翻出的金融事件，依屬性調整雙方攻擊力 |
| `rankrules.js` | 排位計分規則（段位、勝負加減分、段位保護、賽季重置、表現分檢查、台灣時間的賽季）。不 import 任何東西：遊戲和排行榜伺服器共用同一份 |
| `kbonus.js` | 知識加成：知識卡等級依種類加總，每 15 點一級（最高 5 級），對戰中給很小的加成（攻擊、減傷、市場事件、降低對手擋下率，各最多約 3～4%）。`sim/kbonus.sim.js` 比較有無加成的勝率 |
| `challenge.js`、`challengeui.js` | 好友挑戰：種子固定雙方牌序、對手牌組與市場事件，分數＝勝利 500＋表現分×5＋剩餘資金（滿分 1500）；建立／接受（網址 `?c=代碼`）、排名、分享到 LINE |
| `sharecard.js` | 分享戰績圖：1080×1350 的結算圖，手機用分享選單、其他裝置存成 PNG |
| `titlehook.js` | 標題標語下方的副標：依新玩家、排位快升段、弱項屬性挑選一句，否則每天輪換 |
| `backbar.js` | 選單畫面頂端固定的「‹ 回標題」列；按下時會觸發該畫面自己的回標題按鈕，保留各畫面的收尾動作 |
| `skilltree.js`、`treeui.js` | 卡牌技能族譜：每張卡依技能文字分到 6 個技能系統，排成屬性 → 技能系統 → 卡牌的族譜；分析儲存的牌組（相剋覆蓋、技能分布、答題正確率、排位點數）並列出收集建議；輸出 PNG 族譜圖（可分享）與 A4 PDF 規劃表 |
| `recexport.js` | 學習紀錄輸出：PDF 學習報告（各屬性正確率與趨勢、學習建議、最常答錯題目、全部對戰）、分享用的學習成績單圖片、對戰紀錄與題目統計兩種 CSV |
| `nbexport.js` | 錯題本輸出：PDF 複習講義（附正解與解說）、PDF 測驗卷（解答在最後一頁）、CSV（Excel）；依目前的屬性篩選，可選擇包含已掌握。選項順序依題號固定打散，印出來的答案不會都是 A |
| `reading.js` | 閱讀設定：文字大小（標準／大／特大，只放大題目、選項、解說等閱讀文字）、色弱友善配色（答對藍、答錯橘，加 ✓ ✗）；存在設定裡 |
| `jspdf.js` | 第一次輸出 PDF 時才載入 jsPDF，不拖慢開啟 |
| `version.js` | 版本資訊：`src/data/changelog.json`（最新在前）的目前版本與更新時間、更新內容視窗、更新後第一次開啟時的「這次更新了什麼」；建置時間與 commit 由 `vite.config.js` 寫入 |
| `usage.js` | 匿名使用統計：隨機編號＋每天的開啟、對戰、每日挑戰次數，以及每一道內建題目的作答次數與選項分布（題目品質），送到排行榜伺服器加總；設定裡可關閉 |
| `online.js`、`boardui.js` | 線上排行榜：加入／改名／退出、排位賽開局取憑證與結算、離線時暫存結果下次送出、排行榜畫面 |
| `ranked.js`、`rankedui.js` | 排位賽：段位、依勝負與表現計分、段位保護、牌組點數上限與排位自動組牌、每月賽季與獎勵、卡背／排位畫面、賽季結算、結算畫面的排位區塊 |
| `knowledge.js`、`knowledgeui.js` | 金融知識卡：收集（新手卡、每日挑戰、每天第一場勝利、碎片）、檢定升級、收集稱號、對戰勝利碎片／知識圖鑑畫面與卡片詳情 |
| `daily.js`、`dailyui.js` | 每日 3 分鐘金融挑戰：依日期選情境、經驗值與碎片、連續天數、稱號、等級／畫面與標題卡片 |
| `tutor.js`、`tutorial-script.js` | 新手引導的 8 個步驟與前幾場的出牌提示／教學對戰的設定（難度、資金、對手第一次答錯、保證相剋卡） |
| 其他 | 背景、音效、設定、遊玩時間、新手引導與小提示、事件綁定（`wiring.js`） |

**標題字型**：`src/fonts/` 的兩套字型只保留遊戲用到的字，再依用途切成三份（標題畫面、卡名、其他），用 `unicode-range` 讓瀏覽器只下載畫面需要的那份。新增卡牌或介面文字後，執行 `python3 tools/fonts.py <放 NotoSerifTC.ttf、NotoSansTC.ttf 的資料夾>` 重新產生（來源字型在 github.com/google/fonts 的 `ofl/notoseriftc`、`ofl/notosanstc`）。

每個模組開頭第一行註解說明它負責什麼。模組最初是用 `tools/split.mjs` 從單一 HTML 自動拆出來的（工具留作紀錄）；之後已整理成上面的分層：跨模組修改變數的 `__set_X()` 改成有名字的函式（`setGame`、`setDeck`、`setDiffKey`、`clearRecords`…），互相引用改由 `game.js`、`actions.js`、`ui.js` 三個葉節點銜接。

### 整理原則（之後改程式時照著做）

- 新模組只引用比自己低層的模組；需要呼叫上層（例如規則要更新畫面）時，透過 `ui.js` 或 `actions.js`。
- 對戰中的資料一律放在 `G`，並在 `game.js` 的 JSDoc 補上欄位說明。
- `npm test` 會擋下新的循環引用。

## 對戰狀態機（`fsm.js`）

```
idle ─→ intro ─→ myTurn ─→ attack ─→ attackQuiz ─→ attackResolve ─┬→ attack（當沖）
  │                 │                                               ├→ foeTurn
  └→ resume ─→ attack / defend                                      └→ over
                    └→ foeTurn（我方被跳過）
foeTurn ─→ defend ─→ defendQuiz ─→ defendResolve ─→ myTurn / over
foeTurn ─→ myTurn（對手被跳過）
```

`flow.js` 每一步都呼叫 `G.fsm.go(狀態)`。不在轉換表裡的跳轉會記在 `G.fsm.violations` 並輸出警告，但不中斷遊戲；單元測試與 e2e 測試都檢查完整一場不會出現任何違規。

## 對戰模式與公平性

- **新手場**：教學對戰（`tutorial-script.js`）。**休閒場**：自選難度、不影響排名。**排位場**：對手強度依段位，結果計分。
- 休閒與排位都有市場事件（`market.js`），對雙方一視同仁，改變的是「這段期間出哪個屬性最划算」。
- 排位賽的門檻只有一個：先完成新手場。牌組超過 80 點時不會擋住玩家，開始時自動改用合規牌組（只用在那一場）。
- 排位計分（`rankrules.js`，遊戲與伺服器共用）：每個段位有自己的勝／敗分與對手強度，表現分以 50 為基準再微調 ±6。段位越高，對手越強（`困難＋` 起多帶稀有卡、擋下機率更高）、贏得越少、輸得越多，所以積分會停在和實力相當的段位，不會只靠場數一路往上。`sim/table.sim.js` + `sim/ladder-model.mjs` 模擬五種玩家打一整季：答對率 50% 停在資深分析師、62% 操盤手、72% 基金經理人、82% 投資長、92% 傳奇投資人；舊規則（每段同分）下，答對率 72% 打 100 場就會到傳奇。
- 排位對手只看段位，不會因為你收集了很多卡而變強；你的牌組則有 80 點上限。`npm run sim` 的 `sim/fair.sim.js` 比較了幾種合法牌組：困難、答對率 60% 時，新手牌組勝率約 25%，全收藏在上限內的最佳組合約 36%，不設上限則是 84%。答對率從 60% 提高到 75%，勝率增加 25～45 個百分點——勝負主要取決於知識與策略。

## 線上排行榜（`worker/`）

- 加入是自願的：取暱稱之前，遊戲不會連線到任何伺服器。只公開暱稱、段位、積分與勝敗場數。
- 加入後，每場排位賽開局時向伺服器取對戰憑證，結束時送出勝負與三項表現分。伺服器用 `rankrules.js` 重新計分，它的結果就是你的積分，所以排行榜和遊戲裡的數字一致。
- 連不上伺服器時，對戰照常進行並計入本機；結果先暫存，下次連線時送出。
- 排位賽由伺服器出題：加入排行榜後，排位賽的每一題都向伺服器要題目，答案留在伺服器，作答後才判定對錯。題目是每次換數字的計算題，加上不公開題庫的概念題（沒有啟用時改用公開題庫），所以無法照著公開題庫作弊。斷線時改用本機備用題，一場最多 3 題。排位題答錯一樣會收進錯題本（存下題目本身）。詳見 `worker/README.md`。
- 部署方式、API 列表、防作弊檢查和每日玩家數統計頁見 [`worker/README.md`](worker/README.md)。
- 匿名使用統計（`usage.js`）不需要加入排行榜：每台裝置一個隨機編號，只送出每天的開啟與對戰次數；「設定 → 匿名使用統計」可以關閉。

## 瀏覽器測試（`e2e/`）

Playwright（JavaScript），和單元測試放在同一套流程。`npm run e2e` 會建置 `dist-test/`、用 `vite preview` 開一個本機伺服器，然後跑：

| 檔案 | 測什麼 |
|---|---|
| `duel.spec.js` | 三種難易度各打完一場；狀態機沒有違規跳轉；結束後寫入學習紀錄、清除存檔 |
| `save.spec.js` | 攻擊與防禦階段存檔後續戰完全一致；舊版存檔與 30 張牌組自動轉換；損毀存檔另存備份 |
| `opponent.both.spec.js` | 對手當場作答（答對擋下／答錯顯示正解）、擅長屬性、結算畫面統計、手牌「對手不擅長」標示 |
| `features.spec.js` | 錯題本與複習、一次性小提示、進度匯出匯入（含錯誤檔案）、牌組編輯、學習紀錄 |
| `cards.both.spec.js` | 圖鑑延遲繪製與各稀有度插圖、手機長按放大、卡面文字不溢出（含手機字體 150%） |
| `app.both.spec.js` | 可安裝 App：manifest、圖示、斷網後仍能開啟並對戰；Google Fonts 被擋時標題字型；簡化特效設定與自動偵測 |
| `report.spec.js` | 對戰報告 PNG／PDF 下載；30 分鐘提醒與 60 分鐘強制休息（重新整理也跳不過） |
| `board.both.spec.js` | 線上排行榜（API 用測試內的替身）：加入與暱稱錯誤、排位賽由伺服器計分並顯示名次、投降回報、離線暫存後補送、退出 |
| `recexport.spec.js` | 學習紀錄輸出：PDF 報告、成績單圖片、兩種 CSV 的列數與 BOM；沒有紀錄時不顯示輸出區塊 |
| `nav.both.spec.js` | 標題與導覽：對戰按鈕在功能分組之前、老玩家不顯示玩法介紹、新玩家看得到三步驟、每個選單畫面的固定回標題列；對戰頂端精簡、手牌屬性徽章與攻守數字、答題剩餘秒數 |
| `tree.both.spec.js` | 卡牌族譜：180 張卡都在族譜中、牌組分析、收集建議、PNG 與 PDF 輸出、從圖鑑與牌組畫面進入 |
| `ranked.both.spec.js` | 排位賽：排位畫面、未完成新手場時的引導、勝場依表現計分、高段位的對手、投降算敗場、超過點數上限時自動改用合規牌組、跨月賽季結算與卡背、休閒對戰的市場事件 |
| `knowledge.both.spec.js` | 知識圖鑑：新手卡、檢定升級（答錯不扣碎片、答對升級）、碎片解鎖、每日挑戰給卡、對戰勝利碎片 |
| `daily.both.spec.js` | 每日挑戰：標題卡片、3 題即時解析與獎勵（答錯也有）、成果頁、同日再開、隔天連續天數、未完成的進度保留、碎片兌換選卡 |
| `tutorial.both.spec.js` | 教學對戰從頭走到尾：8 個步驟依序出現、建議的卡、對手第一次固定答錯、保證有相剋卡、只出初階題、略過後不再出現 |
| `builds.spec.js` | 兩種單檔版用 `file://` 開啟可以對戰、不會出現安裝功能 |

- 檔名含 `.both` 的在桌面（1280×860）與手機（Pixel 7）各跑一次，`.phone` 只跑手機，其餘只跑桌面。
- `e2e/fixtures.js`：每頁都擋掉 Google Fonts、略過新手引導，並收集主控台錯誤，有錯就算失敗；`step()`、`playToEnd()` 模擬玩家出牌與答題。
- 測試建置裡設定 `soba-ketto.e2e.fast` 會把遊戲內所有等待縮到 15 毫秒，一場對戰幾十秒就打完；只有對手作答畫面的測試用正常速度。
- 舊的 Python 腳本仍在專案包的 `e2e/`，可以手動跑，但 CI 只跑這套。

## 傷害計算（`calc.js`）

`attackHit`、`attackMiss`、`defendSetup`、`defendOk`、`defendFail` 只讀取對戰狀態並回傳數字，不碰畫面。`flow.js` 拿結果去播動畫。`tests/calc.test.js` 會：

- 驗證基本規則，例如速攻、連鎖、弱項、重答、相剋、貫通與反彈。
- 驗證條件型技能。
- 把 180 張卡 × 5 種情況存成快照。之後任何卡的數字變動，都會在測試失敗訊息中列出。

## 平衡模擬（`sim/`）

`sim/duel.js` 用遊戲本身的模組（傷害計算、技能、對手 AI、牌組）在不播動畫的情況下打完整場。玩家模型：
- `acc`：一般四選一題目的答對率；刪去選項、答錯重答的技能會照真實情況提高答對機會。
- `fast`：答對時落在速攻秒數內的比例，預設 50%。
- `policy`：`smart` 攻擊挑攻擊力最高、防禦挑守備 × 相剋最高；`random` 隨機出牌。

```bash
npm run sim                                     # 勝率表：起始牌組／全收藏 × 三種難易度 × 答對率 50–90%，加上每張卡的強弱
SIM_N=150 SIM_DECKS=starter SIM_CARDS=0 npm run sim   # 只跑起始牌組的勝率表
SIM_TUNE='{"block":{"normal":0.55},"foeMult":{"hard":1.4}}' npm run sim   # 不改程式先試參數
python3 sim/report.py sim/out/run.json cards    # 印出勝率表與各星數最強／最弱的卡
```

排位段位分布：

```bash
npx vitest run --config vitest.sim.config.js sim/table.sim.js   # 五種玩家 × 六種對手等級，各 200 場 → sim/out/table-*.json（PLAYER=用功 只跑一種）
node sim/ladder-model.mjs                                         # 用上面的結果重播整季，印出 20／50／100／200 場後的段位
```

改 `rankrules.js` 的勝敗分或段位對手後，只要重跑 `ladder-model.mjs`（幾秒）就能看到段位分布的變化。

可以試的參數：`block`（對手擋下機率）、`foeMult`（對手攻擊倍率）、`mix`（對手牌組的普通稀有／超稀有／極稀有張數）、`sense`（對手出最佳牌的機率）。

## 存檔版本

- **對戰存檔**：存檔內含版本號 `v`（目前 2）。`save.js` 的 `MIGRATE_SAVE[n]` 負責把 v`n` 升級成 v`n+1`。
- **其他資料**：牌組、收藏、錯題本、學習紀錄、設定等，版本號集中記在 `soba-ketto.meta`。`Store.load(key, { version, migrate, validate, fallback })` 會依序執行轉換。
- **讀不懂的資料**：不會直接丟掉。原始內容會先另存成 `<key>.backup`，再改用預設值，並在標題畫面提示。
- **卡牌改名**：在 `core.js` 的 `ID_RENAMES` 加上「舊 id → 新 id」。存檔、牌組、收藏載入時會自動跟著改名。
- **改資料結構時**：
  1. 把該資料的版本號加 1，例如 `DECK_V`。
  2. 在 `migrate` 加上從舊版本轉換的函式。
  3. 在 `tests/storage.test.js` 補一個測試。
