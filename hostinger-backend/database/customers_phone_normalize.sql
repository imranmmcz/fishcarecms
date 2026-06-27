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
--    Mirrors utils/phone.js step-by-step so backfill matches what the API
--    will write going forward.

-- 2a) Digits only.
UPDATE customers
SET customer_phone_normalized = REGEXP_REPLACE(IFNULL(customer_phone, ''), '[^0-9]', '')
WHERE customer_phone_normalized IS NULL;

-- 2b) Strip international "00" exit prefix on long numbers.
UPDATE customers
SET customer_phone_normalized = SUBSTRING(customer_phone_normalized, 3)
WHERE customer_phone_normalized IS NOT NULL
  AND CHAR_LENGTH(customer_phone_normalized) > 11
  AND LEFT(customer_phone_normalized, 2) = '00';

-- 2c) Strip BD "88" country code (covers "+8801..." and "8801...").
UPDATE customers
SET customer_phone_normalized = SUBSTRING(customer_phone_normalized, 3)
WHERE customer_phone_normalized IS NOT NULL
  AND CHAR_LENGTH(customer_phone_normalized) >= 12
  AND LEFT(customer_phone_normalized, 2) = '88';

-- 2d) Strip leading "0" on the 11-digit local form.
UPDATE customers
SET customer_phone_normalized = SUBSTRING(customer_phone_normalized, 2)
WHERE customer_phone_normalized IS NOT NULL
  AND CHAR_LENGTH(customer_phone_normalized) = 11
  AND LEFT(customer_phone_normalized, 1) = '0';

-- 2e) Empty string → NULL so the unique index doesn't collide on blanks.
UPDATE customers
SET customer_phone_normalized = NULL
WHERE customer_phone_normalized = '';

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