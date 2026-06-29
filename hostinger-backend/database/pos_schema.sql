-- =========================================================================
-- POS module schema (Phase 2)
-- Mirrors Supabase pos_* tables. Safe to re-run: every statement uses
-- IF NOT EXISTS. Stock side-effects are handled in the application layer
-- (routes/pos.js) inside a transaction.
-- =========================================================================

CREATE TABLE IF NOT EXISTS pos_shifts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  shift_number VARCHAR(64) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(12,2) NULL,
  expected_amount DECIMAL(12,2) NULL,
  cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  mobile_banking_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_transactions INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pos_shifts_user (user_id),
  INDEX idx_pos_shifts_status (status),
  INDEX idx_pos_shifts_opened (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_sales (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sale_number VARCHAR(64) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  shift_id CHAR(36) NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(32) NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
  payment_type VARCHAR(32) NOT NULL DEFAULT 'full',
  mobile_banking_provider VARCHAR(32) NULL,
  mobile_banking_number VARCHAR(32) NULL,
  transaction_id VARCHAR(128) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pos_sales_user (user_id),
  INDEX idx_pos_sales_shift (shift_id),
  INDEX idx_pos_sales_created (created_at),
  INDEX idx_pos_sales_phone (customer_phone),
  CONSTRAINT fk_pos_sales_shift FOREIGN KEY (shift_id) REFERENCES pos_shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sale_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_sale_items_sale (sale_id),
  INDEX idx_pos_sale_items_product (product_id),
  CONSTRAINT fk_pos_sale_items_sale FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_due_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sale_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
  mobile_banking_provider VARCHAR(32) NULL,
  transaction_id VARCHAR(128) NULL,
  notes TEXT NULL,
  collected_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_due_payments_sale (sale_id),
  CONSTRAINT fk_pos_due_payments_sale FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_expense_categories (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  name_bn VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_expense_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_expenses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT NULL,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
  reference_no VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pos_expenses_user (user_id),
  INDEX idx_pos_expenses_date (expense_date),
  INDEX idx_pos_expenses_category (category_id),
  CONSTRAINT fk_pos_expenses_category FOREIGN KEY (category_id)
    REFERENCES pos_expense_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;