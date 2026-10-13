-- how many questions the server judged in a ranked duel, and how many were right
ALTER TABLE matches ADD COLUMN q_total INTEGER;
ALTER TABLE matches ADD COLUMN q_correct INTEGER;
