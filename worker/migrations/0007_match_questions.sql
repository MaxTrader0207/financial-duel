-- 排位賽由伺服器出題：每一題的內容（含正解）、發題時間、作答與結果。整場結算後就不再需要題目內容。
CREATE TABLE match_questions (
  ticket TEXT NOT NULL,
  n INTEGER NOT NULL,            -- 這場的第幾題（從 1 開始）
  qid TEXT NOT NULL,             -- 題庫題號、p- 不公開題號，或 tpl:範本代號
  src TEXT NOT NULL,             -- 'pub' | 'pool' | 'tpl'
  data TEXT NOT NULL,            -- 顯示給玩家的題目 JSON：{ q, options, answer(顯示順序), explain, category, difficulty, orig }
  issued INTEGER NOT NULL,
  limit_ms INTEGER NOT NULL,
  retry INTEGER NOT NULL DEFAULT 0,      -- 1 = 卡牌技能允許答錯後再答一次；2 = 已經用掉
  pick INTEGER,                  -- 最後的作答（顯示順序），-1 = 時間到
  answered INTEGER,
  correct INTEGER,
  fast INTEGER NOT NULL DEFAULT 0,       -- 作答快得不合理
  PRIMARY KEY (ticket, n)
);
CREATE INDEX match_questions_issued ON match_questions (issued);
