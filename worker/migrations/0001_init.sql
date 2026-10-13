-- players: an anonymous id, the hash of its secret token, and a public nickname (unique, case-insensitive)
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE UNIQUE INDEX players_name ON players (name COLLATE NOCASE);

-- one row per player per monthly season
CREATE TABLE standings (
  season TEXT NOT NULL,
  player TEXT NOT NULL,
  rp INTEGER NOT NULL,
  peak INTEGER NOT NULL,
  w INTEGER NOT NULL DEFAULT 0,
  l INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL,
  PRIMARY KEY (season, player)
);
CREATE INDEX standings_board ON standings (season, rp DESC, updated ASC);

-- every ranked duel: opened by a ticket at the start, closed once with its result
CREATE TABLE matches (
  ticket TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  season TEXT NOT NULL,
  started INTEGER NOT NULL,
  ended INTEGER,
  win INTEGER,
  perf INTEGER,
  delta INTEGER
);
CREATE INDEX matches_open ON matches (player, ended, started);

-- fixed-window counters for rate limits
CREATE TABLE ratelimit (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  until INTEGER NOT NULL
);
