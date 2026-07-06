-- =====================================================
-- FishCare Pro - Complete MySQL Database Schema
-- সম্পূর্ণ সিস্টেম ইনস্টলেশনের জন্য এই একটি ফাইল phpMyAdmin-এ রান করুন
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- 1. Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    mobile VARCHAR(20),
    division VARCHAR(100),
    district VARCHAR(100),
    upazila VARCHAR(100),
    village VARCHAR(255),
    role ENUM('user', 'admin', 'farmer', 'customer') DEFAULT 'farmer',
    avatar_url TEXT,
    dashboard_settings JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Companies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    company_type ENUM('supplier', 'manufacturer', 'distributor') DEFAULT 'supplier',
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Brands Table
-- =====================================================
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    company_id INT,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'medicine',
    image_url TEXT,
    external_link TEXT DEFAULT 'https://fishcare.com.bd',
    stock_quantity INT DEFAULT 0,
    stock_status ENUM('in_stock', 'out_of_stock', 'low_stock') DEFAULT 'in_stock',
    reorder_level INT DEFAULT 10,
    sku VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'pcs',
    weight_kg DECIMAL(10,2) DEFAULT 0,
    brand_id INT,
    company_id INT,
    focus_keyword VARCHAR(255),
    meta_title VARCHAR(255),
    meta_description TEXT,
    image_alt_text VARCHAR(255),
    seo_url VARCHAR(255),
    featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_sku (sku),
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. Product Images Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. Market Prices Table
-- =====================================================
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fish_name VARCHAR(255) NOT NULL,
    fish_name_bn VARCHAR(255) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    market_name VARCHAR(255),
    price_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_division (division),
    INDEX idx_district (district),
    INDEX idx_fish_name (fish_name),
    INDEX idx_price_date (price_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. Orders Table
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'verification_pending') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'cod',
    payment_trx_id VARCHAR(100),
    payment_sender_number VARCHAR(20),
    payment_verified_at TIMESTAMP NULL,
    payment_verified_by INT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    division VARCHAR(100),
    district VARCHAR(100),
    upazila VARCHAR(100),
    notes TEXT,
    admin_note TEXT,
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    tracking_url VARCHAR(500),
    estimated_delivery DATE,
    sender_number VARCHAR(20),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. Order Items Table
-- =====================================================
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
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. Order Status History
-- =====================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. Order Sequence (for order number generation)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at DATE NOT NULL,
    sequence_number INT NOT NULL DEFAULT 1,
    UNIQUE KEY unique_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. Product Reviews Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    rating TINYINT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_product_id (product_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. Review Helpful Votes
-- =====================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    is_helpful BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_vote (review_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. Courier Services
-- =====================================================
CREATE TABLE IF NOT EXISTS courier_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_bn VARCHAR(100),
    tracking_url_template VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. System Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    INDEX idx_setting_key (setting_key),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. Ad Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_client_id VARCHAR(255),
    header_ad_enabled BOOLEAN DEFAULT FALSE,
    header_ad_slot VARCHAR(255),
    sidebar_ad_enabled BOOLEAN DEFAULT FALSE,
    sidebar_ad_slot VARCHAR(255),
    footer_ad_enabled BOOLEAN DEFAULT FALSE,
    footer_ad_slot VARCHAR(255),
    in_article_ad_enabled BOOLEAN DEFAULT FALSE,
    in_article_ad_slot VARCHAR(255),
    between_modules_ad_enabled BOOLEAN DEFAULT FALSE,
    between_modules_ad_slot VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 17. Page Content Table
-- =====================================================
CREATE TABLE IF NOT EXISTS page_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE,
    section_name VARCHAR(255) NOT NULL,
    content JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_section_key (section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 18. Hero Slides Table
-- =====================================================
CREATE TABLE IF NOT EXISTS hero_slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    tagline VARCHAR(255),
    tagline_icon VARCHAR(50) DEFAULT 'Sparkles',
    button_text VARCHAR(100),
    button_link VARCHAR(255) DEFAULT '/',
    button_variant VARCHAR(50) DEFAULT 'primary',
    background_type VARCHAR(50) DEFAULT 'gradient',
    background_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 19. Custom Pages Table
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255),
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT,
    content_type VARCHAR(50) DEFAULT 'rich',
    meta_title VARCHAR(255),
    meta_description TEXT,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 20. Delivery Charge Rules Table
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_charge_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_type VARCHAR(50) DEFAULT 'district',
    district_name VARCHAR(100),
    min_value DECIMAL(10,2) DEFAULT 0,
    max_value DECIMAL(10,2),
    charge_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 21. SMTP Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS smtp_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
    smtp_port INT DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT TRUE,
    smtp_user VARCHAR(255) DEFAULT '',
    smtp_password VARCHAR(255) DEFAULT '',
    smtp_from_name VARCHAR(255) DEFAULT 'FishCare BD',
    smtp_from_email VARCHAR(255) DEFAULT '',
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 22. Email Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 23. Stock Adjustments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 24. Farmer Ponds Table (কৃষক পুকুর ম্যানেজমেন্ট)
-- =====================================================
CREATE TABLE IF NOT EXISTS farmer_ponds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    area DECIMAL(10,2) NOT NULL DEFAULT 0,
    area_unit VARCHAR(50) DEFAULT 'শতক',
    depth DECIMAL(10,2) NOT NULL DEFAULT 0,
    depth_unit VARCHAR(50) DEFAULT 'ফুট',
    fish_types JSON DEFAULT NULL,
    fish_count INT DEFAULT 0,
    stocking_date DATE,
    fish_stock_entries JSON DEFAULT NULL,
    total_stocking_cost DECIMAL(10,2) DEFAULT 0,
    status ENUM('active', 'inactive', 'sold') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 25. Farmer Incomes Table (কৃষক আয়)
-- =====================================================
CREATE TABLE IF NOT EXISTS farmer_incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    category VARCHAR(100) DEFAULT 'মাছ বিক্রয়',
    description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    pond_name VARCHAR(255),
    fish_type VARCHAR(100),
    fish_weight DECIMAL(10,2),
    fish_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 26. Farmer Expenses Table (কৃষক ব্যয়)
-- =====================================================
CREATE TABLE IF NOT EXISTS farmer_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    category VARCHAR(100) DEFAULT 'খাবার',
    description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    pond_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 27. Farmer Samplings Table (স্যাম্পলিং)
-- =====================================================
CREATE TABLE IF NOT EXISTS farmer_samplings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pond_id INT,
    pond_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    fish_entries JSON DEFAULT NULL,
    total_fish INT DEFAULT 0,
    total_weight DECIMAL(10,2) DEFAULT 0,
    avg_weight DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pond_id) REFERENCES farmer_ponds(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_pond_id (pond_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 27b. Farming Alerts Table (কৃষি সতর্কতা / রিমাইন্ডার)
-- =====================================================
CREATE TABLE IF NOT EXISTS farming_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    created_by INT,
    pond_id INT,
    pond_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    title_bn VARCHAR(255),
    message TEXT NOT NULL,
    message_bn TEXT,
    alert_type VARCHAR(64) NOT NULL DEFAULT 'general',
    fish_species VARCHAR(128),
    alert_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    alert_time TIME NULL,
    priority VARCHAR(32) DEFAULT 'medium',
    status VARCHAR(32) DEFAULT 'pending',
    channels JSON DEFAULT NULL,
    is_global TINYINT(1) DEFAULT 0,
    is_recurring TINYINT(1) DEFAULT 0,
    recurrence_interval VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pond_id) REFERENCES farmer_ponds(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_alert_date (alert_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 28. Backup Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS backup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    backup_type VARCHAR(50) DEFAULT 'manual',
    backup_scope VARCHAR(50) DEFAULT 'system',
    status VARCHAR(50) DEFAULT 'pending',
    file_name VARCHAR(255),
    file_size BIGINT,
    tables_included JSON,
    google_drive_file_id VARCHAR(255),
    google_drive_url TEXT,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    restored_at TIMESTAMP NULL,
    restore_status VARCHAR(50) DEFAULT 'none',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Default admin (password: admin123)
INSERT INTO users (email, password, full_name, role) 
VALUES ('admin@fishcare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4x.EuS4NqSL5.mG2', 'Admin', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Default ad settings
INSERT INTO ad_settings (id, header_ad_enabled) VALUES (1, FALSE)
ON DUPLICATE KEY UPDATE id = id;

-- Default SMTP settings
INSERT INTO smtp_settings (id, is_enabled) VALUES (1, FALSE)
ON DUPLICATE KEY UPDATE id = id;

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', 'FishCare Pro', 'ওয়েবসাইটের নাম'),
('default_language', 'bn', 'ডিফল্ট ভাষা'),
('default_currency', 'BDT', 'ডিফল্ট মুদ্রা'),
('maintenance_mode', 'false', 'মেইনটেনেন্স মোড'),
('contact_email', 'info@fishcare.com.bd', 'যোগাযোগ ইমেইল'),
('contact_phone', '+880 1XXX-XXXXXX', 'যোগাযোগ ফোন')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Courier services
INSERT IGNORE INTO courier_services (name, name_bn, tracking_url_template, display_order) VALUES
('Sundarban Courier', 'সুন্দরবন কুরিয়ার', 'https://sundarbancourier.com/tracking?tracking_id={tracking_number}', 1),
('SA Paribahan', 'এসএ পরিবহন', 'https://saparibahan.com/tracking/{tracking_number}', 2),
('Pathao Courier', 'পাঠাও কুরিয়ার', 'https://pathao.com/track/{tracking_number}', 3),
('RedX', 'রেডএক্স', 'https://redx.com.bd/track/{tracking_number}', 4),
('Steadfast', 'স্টেডফাস্ট', 'https://steadfast.com.bd/t/{tracking_number}', 5),
('eCourier', 'ইকুরিয়ার', 'https://ecourier.com.bd/track/{tracking_number}', 6);

-- Default categories
INSERT IGNORE INTO categories (name, name_bn, slug, display_order) VALUES
('Medicine', 'ঔষধ', 'medicine', 1),
('Feed', 'খাবার', 'feed', 2),
('Equipment', 'সরঞ্জাম', 'equipment', 3),
('Chemicals', 'কেমিক্যাল', 'chemicals', 4),
('Probiotics', 'প্রোবায়োটিকস', 'probiotics', 5);

-- =====================================================
-- VERIFY: SHOW TABLES;
-- =====================================================
