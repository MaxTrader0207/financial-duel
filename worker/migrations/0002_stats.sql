-- anonymous daily statistics: which random player ids opened the game on a day (Taiwan date), and event counts per day
CREATE TABLE daily_players (
  day TEXT NOT NULL,
  pid TEXT NOT NULL,
  PRIMARY KEY (day, pid)
);
CREATE INDEX daily_players_pid ON daily_players (pid, day);

CREATE TABLE daily_counts (
  day TEXT NOT NULL,
  k TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, k)
);
