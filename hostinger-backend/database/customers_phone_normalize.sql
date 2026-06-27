-- Migration: add `customer_phone_normalized` to existing `customers` table
-- and rebuild the uniqueness on the normalized form. Idempotent — safe to
-- run on every boot.

-- 1) Add the column if missing.
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'customers'
    AND COLUMN_NAME = 'customer_phone_normalized'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE customers ADD COLUMN customer_phone_normalized VARCHAR(32) NULL AFTER customer_phone',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2) Backfill the normalized value for any row that doesn't have it yet.
--    Mirrors utils/phone.js: digits only; strip BD "88" country code (13
--    digits) or leading "0" (11 digits).
UPDATE customers
SET customer_phone_normalized = (
  CASE
    WHEN CHAR_LENGTH(REGEXP_REPLACE(IFNULL(customer_phone, ''), '[^0-9]', '')) = 13
         AND LEFT(REGEXP_REPLACE(customer_phone, '[^0-9]', ''), 2) = '88'
      THEN SUBSTRING(REGEXP_REPLACE(customer_phone, '[^0-9]', ''), 3)
    WHEN CHAR_LENGTH(REGEXP_REPLACE(IFNULL(customer_phone, ''), '[^0-9]', '')) = 11
         AND LEFT(REGEXP_REPLACE(customer_phone, '[^0-9]', ''), 1) = '0'
      THEN SUBSTRING(REGEXP_REPLACE(customer_phone, '[^0-9]', ''), 2)
    WHEN CHAR_LENGTH(REGEXP_REPLACE(IFNULL(customer_phone, ''), '[^0-9]', '')) = 0
      THEN NULL
    ELSE REGEXP_REPLACE(customer_phone, '[^0-9]', '')
  END
)
WHERE customer_phone_normalized IS NULL;

-- 3) Drop the old raw-phone unique index if it still exists (collision-prone).
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'customers'
    AND INDEX_NAME = 'uq_customers_phone'
);
SET @sql := IF(
  @idx_exists > 0,
  'ALTER TABLE customers DROP INDEX uq_customers_phone',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 4) Add the unique index on the normalized column if missing.
--    NOTE: this will fail loudly if pre-existing rows still collide after
--    normalization — that is intentional, those duplicates must be merged.
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'customers'
    AND INDEX_NAME = 'uq_customers_phone_norm'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE customers ADD UNIQUE KEY uq_customers_phone_norm (customer_phone_normalized)',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;