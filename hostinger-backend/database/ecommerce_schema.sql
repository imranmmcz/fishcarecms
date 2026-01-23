-- ============================================
-- E-Commerce Schema for FishCare Pro
-- WooCommerce-স্টাইল অর্ডার ম্যানেজমেন্ট সিস্টেম
-- ============================================

USE u109046763_cal;

-- 1. Products টেবিলে stock ফিল্ড যোগ করুন
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_status ENUM('in_stock', 'out_of_stock', 'low_stock') DEFAULT 'in_stock',
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS featured TINYINT(1) DEFAULT 0;

-- 2. Orders টেবিল
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'cod',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Shipping Address
  shipping_name VARCHAR(255) NOT NULL,
  shipping_mobile VARCHAR(20) NOT NULL,
  shipping_division VARCHAR(100),
  shipping_district VARCHAR(100),
  shipping_upazila VARCHAR(100),
  shipping_address TEXT,
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_order_number (order_number),
  INDEX idx_created_at (created_at)
);

-- 3. Order Items টেবিল
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);

-- 4. Order Status History (ট্র্যাকিং এর জন্য)
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  changed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id)
);

-- 5. Sample data for products stock
UPDATE products SET stock_quantity = 100, stock_status = 'in_stock' WHERE stock_quantity IS NULL OR stock_quantity = 0;

-- 6. Order number generator function-এর জন্য sequence table
CREATE TABLE IF NOT EXISTS order_sequence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATE NOT NULL,
  sequence_number INT NOT NULL DEFAULT 1,
  UNIQUE KEY unique_date (created_at)
);

-- ============================================
-- Installation Instructions
-- ============================================
-- 1. phpMyAdmin-এ যান: https://hpanel.hostinger.com/databases
-- 2. u109046763_cal ডাটাবেজ সিলেক্ট করুন
-- 3. SQL ট্যাবে এই স্ক্রিপ্ট পেস্ট করুন
-- 4. Execute/Go বাটনে ক্লিক করুন
-- ============================================
