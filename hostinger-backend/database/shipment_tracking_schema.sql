-- ============================================
-- Shipment Tracking Schema for FishCare Pro
-- কুরিয়ার ও ট্র্যাকিং নম্বর ম্যানেজমেন্ট সিস্টেম
-- ============================================

USE u109046763_cal;

-- 1. Orders টেবিলে শিপমেন্ট ট্র্যাকিং ফিল্ড যোগ করুন
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100) DEFAULT NULL COMMENT 'কুরিয়ার সার্ভিস নাম',
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) DEFAULT NULL COMMENT 'ট্র্যাকিং নম্বর',
ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500) DEFAULT NULL COMMENT 'ট্র্যাকিং URL',
ADD COLUMN IF NOT EXISTS estimated_delivery DATE DEFAULT NULL COMMENT 'আনুমানিক ডেলিভারি তারিখ';

-- 2. কুরিয়ার সার্ভিস তালিকা টেবিল (ঐচ্ছিক - দ্রুত সিলেক্ট করার জন্য)
CREATE TABLE IF NOT EXISTS courier_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100) DEFAULT NULL,
  tracking_url_template VARCHAR(500) DEFAULT NULL COMMENT 'e.g. https://courier.com/track/{tracking_number}',
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_courier_name (name)
);

-- 3. জনপ্রিয় বাংলাদেশী কুরিয়ার সার্ভিস যোগ করুন
INSERT IGNORE INTO courier_services (name, name_bn, tracking_url_template, display_order) VALUES
('Sundarban Courier', 'সুন্দরবন কুরিয়ার', 'https://sundarbancourier.com/tracking?tracking_id={tracking_number}', 1),
('SA Paribahan', 'এসএ পরিবহন', 'https://saparibahan.com/tracking/{tracking_number}', 2),
('Pathao Courier', 'পাঠাও কুরিয়ার', 'https://pathao.com/track/{tracking_number}', 3),
('RedX', 'রেডএক্স', 'https://redx.com.bd/track/{tracking_number}', 4),
('Steadfast', 'স্টেডফাস্ট', 'https://steadfast.com.bd/t/{tracking_number}', 5),
('eCourier', 'ইকুরিয়ার', 'https://ecourier.com.bd/track/{tracking_number}', 6),
('Paperfly', 'পেপারফ্লাই', 'https://paperfly.com.bd/tracking/{tracking_number}', 7),
('Continental Courier', 'কন্টিনেন্টাল কুরিয়ার', NULL, 8),
('Karatoa Courier', 'করতোয়া কুরিয়ার', NULL, 9),
('Other', 'অন্যান্য', NULL, 100);

-- ============================================
-- Installation Instructions
-- ============================================
-- 1. phpMyAdmin-এ যান: https://hpanel.hostinger.com/databases
-- 2. u109046763_cal ডাটাবেজ সিলেক্ট করুন
-- 3. SQL ট্যাবে এই স্ক্রিপ্ট পেস্ট করুন
-- 4. Execute/Go বাটনে ক্লিক করুন
-- ============================================
