-- =====================================================
-- FishCare Pro MySQL Database Schema
-- Database: u109046763_cal
-- Host: mysql.hostinger.com
-- Run this SQL in Hostinger phpMyAdmin
-- =====================================================

-- Drop existing tables if needed (uncomment if fresh install)
-- DROP TABLE IF EXISTS page_content;
-- DROP TABLE IF EXISTS ad_settings;
-- DROP TABLE IF EXISTS system_settings;
-- DROP TABLE IF EXISTS market_prices;
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS users;

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
    role ENUM('user', 'admin') DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_division (division),
    INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'medicine',
    image_url TEXT,
    external_link TEXT DEFAULT 'https://fishcare.com.bd',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Market Prices Table
-- =====================================================
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fish_name VARCHAR(255) NOT NULL,
    fish_name_bn VARCHAR(255) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    market_name VARCHAR(255),
    price_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_division (division),
    INDEX idx_district (district),
    INDEX idx_upazila (upazila),
    INDEX idx_fish_name (fish_name),
    INDEX idx_price_date (price_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. System Settings Table
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
-- 5. Ad Settings Table
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
-- 6. Page Content Table
-- =====================================================
CREATE TABLE IF NOT EXISTS page_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE,
    section_name VARCHAR(255) NOT NULL,
    content JSON NOT NULL DEFAULT ('{}'),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_section_key (section_key),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. User Profiles Table (for additional user data)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(20),
    division VARCHAR(100),
    district VARCHAR(100),
    upazila VARCHAR(100),
    village VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT DATA INSERTS
-- =====================================================

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password, full_name, role) 
VALUES ('admin@fishcare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4x.EuS4NqSL5.mG2', 'Admin User', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Insert default ad settings
INSERT INTO ad_settings (id, header_ad_enabled, sidebar_ad_enabled, footer_ad_enabled)
VALUES (1, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE id = id;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', 'FishCare Pro', 'ওয়েবসাইটের নাম'),
('default_language', 'bn', 'ডিফল্ট ভাষা'),
('default_currency', 'BDT', 'ডিফল্ট মুদ্রা'),
('maintenance_mode', 'false', 'মেইনটেনেন্স মোড স্ট্যাটাস'),
('contact_email', 'info@fishcare.com.bd', 'যোগাযোগ ইমেইল'),
('contact_phone', '+880 1XXX-XXXXXX', 'যোগাযোগ ফোন'),
('facebook_url', 'https://facebook.com/fishcarebd', 'ফেসবুক পেজ'),
('youtube_url', 'https://youtube.com/fishcarebd', 'ইউটিউব চ্যানেল')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Insert sample market prices for testing
INSERT INTO market_prices (fish_name, fish_name_bn, price_per_kg, min_price, max_price, division, district, upazila, market_name, price_date) VALUES
('Rohu', 'রুই', 280.00, 250.00, 320.00, 'Dhaka', 'Dhaka', 'Dhanmondi', 'Karwan Bazar', CURDATE()),
('Catla', 'কাতলা', 320.00, 290.00, 350.00, 'Dhaka', 'Dhaka', 'Dhanmondi', 'Karwan Bazar', CURDATE()),
('Tilapia', 'তেলাপিয়া', 180.00, 160.00, 200.00, 'Dhaka', 'Dhaka', 'Mirpur', 'Mirpur Mach Bazar', CURDATE()),
('Pangasius', 'পাঙ্গাশ', 150.00, 130.00, 170.00, 'Chittagong', 'Chittagong', 'Pahartali', 'Riazuddin Bazar', CURDATE()),
('Silver Carp', 'সিলভার কার্প', 200.00, 180.00, 220.00, 'Rajshahi', 'Rajshahi', 'Boalia', 'Shaheb Bazar', CURDATE())
ON DUPLICATE KEY UPDATE fish_name = fish_name;

-- Insert sample products for testing
INSERT INTO products (name, description, price, discount_percentage, category, image_url, external_link) VALUES
('Aqua Medicine Pro', 'মাছের রোগ প্রতিরোধক ঔষধ', 450.00, 10.00, 'medicine', 'https://via.placeholder.com/300x200', 'https://fishcare.com.bd'),
('Fish Feed Premium', 'উচ্চ প্রোটিন মাছের খাবার', 850.00, 5.00, 'feed', 'https://via.placeholder.com/300x200', 'https://fishcare.com.bd'),
('Water Testing Kit', 'পানির গুণমান পরীক্ষার কিট', 1200.00, 15.00, 'equipment', 'https://via.placeholder.com/300x200', 'https://fishcare.com.bd'),
('Aerator Pump', 'পুকুরে অক্সিজেন সরবরাহ যন্ত্র', 3500.00, 8.00, 'equipment', 'https://via.placeholder.com/300x200', 'https://fishcare.com.bd'),
('Fish Net Large', 'বড় মাছ ধরার জাল', 650.00, 0.00, 'equipment', 'https://via.placeholder.com/300x200', 'https://fishcare.com.bd')
ON DUPLICATE KEY UPDATE name = name;

-- =====================================================
-- VERIFY INSTALLATION
-- =====================================================
-- Run these queries to verify tables were created:
-- SHOW TABLES;
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM products;
-- SELECT COUNT(*) FROM market_prices;
