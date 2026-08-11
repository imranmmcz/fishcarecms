-- Align legacy INT primary keys with the UUID ids used by the app.
-- Statements are idempotent / tolerant: re-running them is a no-op.
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE market_prices MODIFY id CHAR(36) NOT NULL;
ALTER TABLE market_prices ALTER COLUMN id SET DEFAULT (UUID());

ALTER TABLE review_helpful_votes MODIFY review_id CHAR(36) NOT NULL;
ALTER TABLE review_helpful_votes MODIFY user_id CHAR(36) NOT NULL;
ALTER TABLE product_reviews MODIFY id CHAR(36) NOT NULL;
ALTER TABLE product_reviews ALTER COLUMN id SET DEFAULT (UUID());
ALTER TABLE product_reviews MODIFY product_id CHAR(36) NOT NULL;
ALTER TABLE product_reviews MODIFY user_id CHAR(36) NULL;
ALTER TABLE product_reviews ADD COLUMN `comment` TEXT NULL;
ALTER TABLE product_reviews ADD COLUMN user_name VARCHAR(191) NULL;

SET FOREIGN_KEY_CHECKS = 1;
