-- Align legacy INT primary keys with the UUID ids used by the app
-- (market_prices, product_reviews, review_helpful_votes).
-- Idempotent: each block only runs when the column is still an INT.
DROP PROCEDURE IF EXISTS fc_align_uuid_ids;
CREATE PROCEDURE fc_align_uuid_ids()
BEGIN
  DECLARE t VARCHAR(64);

  -- market_prices.id
  SELECT DATA_TYPE INTO t FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_prices' AND COLUMN_NAME = 'id';
  IF t = 'int' THEN
    ALTER TABLE market_prices MODIFY id CHAR(36) NOT NULL;
    ALTER TABLE market_prices ALTER COLUMN id SET DEFAULT (UUID());
  END IF;

  -- product_reviews + dependent votes table
  SET t = NULL;
  SELECT DATA_TYPE INTO t FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'id';
  IF t = 'int' THEN
    SET FOREIGN_KEY_CHECKS = 0;
    ALTER TABLE review_helpful_votes MODIFY review_id CHAR(36) NOT NULL;
    ALTER TABLE review_helpful_votes MODIFY user_id CHAR(36) NOT NULL;
    ALTER TABLE product_reviews MODIFY id CHAR(36) NOT NULL;
    ALTER TABLE product_reviews ALTER COLUMN id SET DEFAULT (UUID());
    ALTER TABLE product_reviews MODIFY product_id CHAR(36) NOT NULL;
    ALTER TABLE product_reviews MODIFY user_id CHAR(36) NULL;
    SET FOREIGN_KEY_CHECKS = 1;
  END IF;

  -- product_reviews.comment (app uses `comment`, legacy schema used review_text)
  SET t = NULL;
  SELECT COLUMN_NAME INTO t FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'comment';
  IF t IS NULL THEN
    ALTER TABLE product_reviews ADD COLUMN `comment` TEXT NULL;
  END IF;

  SET t = NULL;
  SELECT COLUMN_NAME INTO t FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_reviews' AND COLUMN_NAME = 'user_name';
  IF t IS NULL THEN
    ALTER TABLE product_reviews ADD COLUMN user_name VARCHAR(191) NULL;
  END IF;
END;

CALL fc_align_uuid_ids();
DROP PROCEDURE IF EXISTS fc_align_uuid_ids;
