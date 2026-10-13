-- one-time transfer codes: a device uploads its saved progress, another device redeems the code once within 24 hours
CREATE TABLE transfers (
  code TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX transfers_expires ON transfers (expires);
