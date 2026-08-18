-- Base schema, copied verbatim from ../schema.sql.
--
-- schema.sql is the human-readable source of truth and uses CREATE TABLE IF
-- NOT EXISTS throughout, so re-running it is a no-op on a database that
-- already has these tables. Mirroring it here as 0000 lets the CI migration
-- step bring a brand-new D1 database all the way up from zero in one pass
-- without special-casing the very first deploy. schema.sql stays where it is
-- for reading; this file is what runs against the database.

CREATE TABLE IF NOT EXISTS users (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  username           TEXT    NOT NULL UNIQUE,
  pw_hash            TEXT    NOT NULL,
  pw_salt            TEXT    NOT NULL,
  created_at         INTEGER NOT NULL,
  -- Progression settings. These used to live in localStorage, which meant a
  -- player lost them by switching browsers. They belong to the account.
  easy_mode          INTEGER NOT NULL DEFAULT 1,
  easy_mode_auto_set INTEGER NOT NULL DEFAULT 0,
  has_played_before  INTEGER NOT NULL DEFAULT 0,
  got_noi_medal      INTEGER NOT NULL DEFAULT 0,
  -- Denormalised pointer to this user's highest-scoring run. Keeping it here
  -- turns the leaderboard into a plain indexed join instead of a correlated
  -- MAX() subquery over every run ever played.
  best_run_id        INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- One row per playthrough. A run is append-only: levels are recorded as they
-- are finished and never rewritten, so a bad run can never damage a good one.
CREATE TABLE IF NOT EXISTS runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  easy_mode   INTEGER NOT NULL DEFAULT 0,
  challenges  TEXT    NOT NULL DEFAULT '{}',
  max_level   INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  -- Sum of the per-level durations below. Recomputed from run_levels on every
  -- write rather than incremented, for the same reason total_score is: a level
  -- can be re-recorded, and an accumulator would double-count it.
  --
  -- 0 means "not measured" — runs that predate the timer. The leaderboard sorts
  -- those last instead of letting a missing time win the tiebreak.
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  finished    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_score ON runs(total_score DESC);

CREATE TABLE IF NOT EXISTS run_levels (
  run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  level       INTEGER NOT NULL,
  match_name  TEXT    NOT NULL DEFAULT '',
  match_score INTEGER NOT NULL DEFAULT 0,
  passed      INTEGER NOT NULL DEFAULT 0,
  sim         INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  -- Wall-clock milliseconds from the moment the level's maps were generated to
  -- the moment it settled. The shop between levels is not part of it.
  duration_ms INTEGER NOT NULL DEFAULT 0,
  recorded_at INTEGER NOT NULL,
  PRIMARY KEY (run_id, level)
);

-- What this account has unlocked, per difficulty mode.
CREATE TABLE IF NOT EXISTS achievements (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode        TEXT    NOT NULL,
  ach_id      TEXT    NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, mode, ach_id)
);

-- Who got there first, globally. The primary key does the arbitration: the
-- unlock is an INSERT OR IGNORE, so the second player through the door loses
-- without anyone writing a read-then-check race condition.
CREATE TABLE IF NOT EXISTS achievement_firsts (
  mode        TEXT    NOT NULL,
  ach_id      TEXT    NOT NULL,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (mode, ach_id)
);
