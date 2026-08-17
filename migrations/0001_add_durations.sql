-- Adds the per-level and per-run timers behind the leaderboard's second sort key.
--
-- schema.sql only has CREATE TABLE IF NOT EXISTS, so it is a no-op against a
-- database that already has these tables. Run this once against each existing
-- database instead:
--
--   npx wrangler d1 execute oi-race-db --remote --file=./migrations/0001_add_durations.sql
--   npx wrangler d1 execute oi-race-db --local  --file=./migrations/0001_add_durations.sql
--
-- Existing rows get 0, which the leaderboard reads as "not measured" and sorts
-- behind every timed run rather than ahead of them.

ALTER TABLE run_levels ADD COLUMN duration_ms INTEGER NOT NULL DEFAULT 0;
ALTER TABLE runs ADD COLUMN total_duration_ms INTEGER NOT NULL DEFAULT 0;
