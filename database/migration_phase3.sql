-- Phase 3 Migration: Product fields, Customers, Customer Addresses

-- 1. Add new fields to products table
ALTER TABLE `products` 
ADD COLUMN `condition` ENUM('baru', 'bekas') DEFAULT 'baru' AFTER `os`,
ADD COLUMN `length_cm` INT NULL AFTER `weight_grams`,
ADD COLUMN `width_cm` INT NULL AFTER `length_cm`,
ADD COLUMN `height_cm` INT NULL AFTER `width_cm`,
ADD COLUMN `is_preorder` BOOLEAN DEFAULT FALSE AFTER `height_cm`,
ADD COLUMN `preorder_days` INT NULL AFTER `is_preorder`,
ADD COLUMN `is_insurance_required` BOOLEAN DEFAULT FALSE AFTER `preorder_days`,
ADD COLUMN `discount_percentage` INT DEFAULT 0 AFTER `sale_price`;

-- 2. Create customers table
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `phone` VARCHAR(50) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create customer_addresses table
CREATE TABLE IF NOT EXISTS `customer_addresses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `label` VARCHAR(50) NOT NULL COMMENT 'e.g., Rumah, Kantor',
    `recipient_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `address` TEXT NOT NULL,
    `city_id` INT NOT NULL,
    `city_name` VARCHAR(100) NULL,
    `district_id` INT NOT NULL,
    `province_name` VARCHAR(100) NULL,
    `postal_code` VARCHAR(10) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    INDEX `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
