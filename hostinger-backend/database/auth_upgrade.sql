-- =====================================================
-- Auth upgrade: custom JWT/MySQL auth support
-- Idempotent-ish: failures on already-applied statements are
-- tolerated by the statement-by-statement bootstrap runner.
-- =====================================================

ALTER TABLE users
  MODIFY COLUMN role ENUM('user','admin','farmer','customer','manager','cashier','delivery_staff','blogger','partner','moderator') DEFAULT 'farmer';

ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN blocked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN last_sign_in_at DATETIME NULL;

CREATE UNIQUE INDEX idx_users_mobile ON users (mobile);
