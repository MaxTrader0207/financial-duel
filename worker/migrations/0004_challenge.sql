-- friend challenges: the same seeded duel setup (deck order, opponent deck, market events) shared by a link
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  seed INTEGER NOT NULL,
  deck TEXT NOT NULL,
  by_name TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
-- one row per nickname per challenge; a replay keeps the better score
CREATE TABLE challenge_results (
  cid TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  win INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (cid, name)
);
