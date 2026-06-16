-- Migration for existing databases: link users to the id.kbn.one identity
-- provider. Run once against an existing Turso database.
--
-- LibSQL/SQLite has no "ADD COLUMN IF NOT EXISTS"; if the column already exists
-- the ALTER errors harmlessly (skip it). The index is idempotent.
ALTER TABLE users ADD COLUMN idp_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_idp_sub ON users(idp_sub);
