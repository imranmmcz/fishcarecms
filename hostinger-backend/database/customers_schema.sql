-- Customers table — used by Admin Customer Management and POS.
-- UUID-shaped CHAR(36) id so the response matches the Supabase facade shape.

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  customer_phone_normalized VARCHAR(32) NULL,
  customer_email VARCHAR(255) NULL,
  division VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  upazila VARCHAR(100) NULL,
  village VARCHAR(150) NULL,
  shipping_address TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customers_phone_norm (customer_phone_normalized),
  KEY idx_customers_name (customer_name),
  KEY idx_customers_email (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;