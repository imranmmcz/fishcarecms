-- FishCare Pro MySQL Database Schema
-- Run this SQL in your Hostinger phpMyAdmin to create the database structure

-- Create users table
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

-- Create products table
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

-- Create market_prices table
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

-- Create system_settings table
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

-- Create ad_settings table
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

-- Create page_content table
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
('site_name', 'FishCare Pro', 'Website name'),
('default_language', 'bn', 'Default language'),
('default_currency', 'BDT', 'Default currency'),
('maintenance_mode', 'false', 'Maintenance mode status')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
