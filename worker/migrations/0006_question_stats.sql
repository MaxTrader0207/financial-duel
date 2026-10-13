-- 題目品質: answer counts per built-in question, added up from anonymous usage pings
CREATE TABLE question_stats (
  qid TEXT PRIMARY KEY,
  n INTEGER NOT NULL DEFAULT 0,
  c INTEGER NOT NULL DEFAULT 0,
  p0 INTEGER NOT NULL DEFAULT 0,
  p1 INTEGER NOT NULL DEFAULT 0,
  p2 INTEGER NOT NULL DEFAULT 0,
  p3 INTEGER NOT NULL DEFAULT 0,
  timeouts INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL
);
