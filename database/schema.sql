-- ==============================================
-- Vicmic E-Commerce Platform — Full Database Schema
-- MySQL / MariaDB (cPanel compatible)
-- ==============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Settings (key-value store)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) UNIQUE NOT NULL,
    `setting_value` TEXT,
    `setting_group` VARCHAR(50) DEFAULT 'general',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Admin Users (RBAC)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `role` ENUM('super_admin', 'admin', 'warehouse_staff', 'finance', 'customer_service') NOT NULL DEFAULT 'admin',
    `assigned_warehouse_id` INT NULL COMMENT 'For warehouse_staff role, which warehouse they manage',
    `avatar_url` VARCHAR(255) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Warehouses
-- ----------------------------
CREATE TABLE IF NOT EXISTS `warehouses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) UNIQUE NOT NULL,
    `address` TEXT NOT NULL,
    `city_id` INT NOT NULL COMMENT 'RajaOngkir city ID',
    `district_id` INT NOT NULL COMMENT 'RajaOngkir district/subdistrict ID',
    `city_name` VARCHAR(100) NULL,
    `province_name` VARCHAR(100) NULL,
    `postal_code` VARCHAR(10),
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `phone` VARCHAR(50) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK for admin_users.assigned_warehouse_id
ALTER TABLE `admin_users` ADD FOREIGN KEY (`assigned_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL;

-- ----------------------------
-- Product Categories
-- ----------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) UNIQUE NOT NULL,
    `icon` VARCHAR(50) NULL,
    `parent_id` INT NULL,
    `sort_order` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Products
-- ----------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sku` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `brand` VARCHAR(100),
    `category_id` INT NULL,
    `description` LONGTEXT,
    `short_description` VARCHAR(500) NULL,
    `processor` VARCHAR(100) NULL,
    `ram_capacity` VARCHAR(50) NULL,
    `storage_type` VARCHAR(100) NULL,
    `gpu` VARCHAR(100) NULL,
    `display_specs` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `weight_grams` INT DEFAULT 2500 COMMENT 'Product weight in grams for shipping calc',
    `base_price` DECIMAL(15, 2) NOT NULL,
    `sale_price` DECIMAL(15, 2) NULL COMMENT 'Discounted price, NULL if no discount',
    `warranty_period_months` INT DEFAULT 12,
    `images` JSON COMMENT 'Array of image URLs',
    `specifications` JSON COMMENT 'Additional spec key-value pairs',
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `is_published` BOOLEAN DEFAULT TRUE,
    `view_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    INDEX `idx_products_slug` (`slug`),
    INDEX `idx_products_brand` (`brand`),
    INDEX `idx_products_category` (`category_id`),
    INDEX `idx_products_published` (`is_published`),
    INDEX `idx_products_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Product Variants
-- ----------------------------
CREATE TABLE IF NOT EXISTS `product_variants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `variant_sku` VARCHAR(50) UNIQUE NOT NULL,
    `variant_name` VARCHAR(100) NOT NULL,
    `price_adjustment` DECIMAL(15, 2) DEFAULT 0 COMMENT 'Add/subtract from base_price',
    `weight_adjustment_grams` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    INDEX `idx_variant_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Warehouse Inventory (Stock per warehouse)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `product_stocks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `variant_id` INT NULL,
    `warehouse_id` INT NOT NULL,
    `quantity` INT DEFAULT 0,
    `reserved_quantity` INT DEFAULT 0 COMMENT 'Units reserved for pending orders',
    `low_stock_threshold` INT DEFAULT 3,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_stock_location` (`product_id`, `variant_id`, `warehouse_id`),
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
    INDEX `idx_stock_warehouse` (`warehouse_id`),
    INDEX `idx_stock_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Product Serial Numbers
-- ----------------------------
CREATE TABLE IF NOT EXISTS `product_serial_numbers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `serial_number` VARCHAR(100) UNIQUE NOT NULL,
    `product_id` INT NOT NULL,
    `variant_id` INT NULL,
    `warehouse_id` INT NOT NULL,
    `status` ENUM('available', 'reserved', 'sold', 'rma_defective', 'returned') DEFAULT 'available',
    `order_id` INT NULL,
    `order_item_id` INT NULL,
    `received_at` DATETIME NULL COMMENT 'When SN was received into warehouse',
    `sold_at` DATETIME NULL,
    `warranty_start_date` DATE NULL,
    `warranty_expiry` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`),
    INDEX `idx_sn_serial` (`serial_number`),
    INDEX `idx_sn_product` (`product_id`),
    INDEX `idx_sn_warehouse` (`warehouse_id`),
    INDEX `idx_sn_status` (`status`),
    INDEX `idx_sn_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Stock Mutations (Inter-warehouse transfers)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `stock_mutations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `mutation_code` VARCHAR(50) UNIQUE NOT NULL COMMENT 'e.g., MUT-20260826-001',
    `product_id` INT NOT NULL,
    `variant_id` INT NULL,
    `from_warehouse_id` INT NOT NULL,
    `to_warehouse_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `serial_numbers` JSON COMMENT 'Array of SN IDs transferred',
    `status` ENUM('pending', 'in_transit', 'received', 'cancelled') DEFAULT 'pending',
    `initiated_by` INT NOT NULL COMMENT 'admin_users.id',
    `received_by` INT NULL COMMENT 'admin_users.id who confirmed receipt',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME NULL,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`),
    FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`),
    FOREIGN KEY (`initiated_by`) REFERENCES `admin_users`(`id`),
    FOREIGN KEY (`received_by`) REFERENCES `admin_users`(`id`),
    INDEX `idx_mutation_code` (`mutation_code`),
    INDEX `idx_mutation_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Orders
-- ----------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'e.g., VIC-20260826-XXXXX',
    `customer_name` VARCHAR(150) NOT NULL,
    `customer_email` VARCHAR(150) NOT NULL,
    `customer_phone` VARCHAR(50) NOT NULL,
    `shipping_address` TEXT NOT NULL,
    `shipping_city_id` INT NOT NULL,
    `shipping_city_name` VARCHAR(100) NULL,
    `shipping_province` VARCHAR(100) NULL,
    `shipping_postal_code` VARCHAR(10) NULL,
    `fulfillment_warehouse_id` INT NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `shipping_cost` DECIMAL(15, 2) NOT NULL,
    `discount_amount` DECIMAL(15, 2) DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `order_status` ENUM('pending_payment', 'paid', 'processing_packing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded') DEFAULT 'pending_payment',
    `payment_gateway` ENUM('midtrans', 'xendit', 'manual_transfer') NOT NULL,
    `payment_method` VARCHAR(50) NULL COMMENT 'e.g., bca_va, gopay, credit_card',
    `payment_reference` VARCHAR(100) NULL COMMENT 'Gateway transaction ID',
    `payment_status` ENUM('unpaid', 'pending', 'paid', 'expired', 'failed', 'refunded') DEFAULT 'unpaid',
    `payment_snap_token` VARCHAR(255) NULL COMMENT 'Midtrans Snap token',
    `payment_expiry_at` DATETIME NULL,
    `tracking_number` VARCHAR(100) NULL,
    `courier_name` VARCHAR(50) NULL,
    `courier_service` VARCHAR(50) NULL,
    `estimated_delivery` VARCHAR(50) NULL,
    `customer_notes` TEXT NULL,
    `admin_notes` TEXT NULL,
    `paid_at` DATETIME NULL,
    `shipped_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `cancelled_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`fulfillment_warehouse_id`) REFERENCES `warehouses`(`id`),
    INDEX `idx_order_number` (`order_number`),
    INDEX `idx_order_status` (`order_status`),
    INDEX `idx_order_payment_status` (`payment_status`),
    INDEX `idx_order_customer_email` (`customer_email`),
    INDEX `idx_order_customer_phone` (`customer_phone`),
    INDEX `idx_order_tracking` (`tracking_number`),
    INDEX `idx_order_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Order Items
-- ----------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `variant_id` INT NULL,
    `product_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot of product name at order time',
    `variant_name` VARCHAR(100) NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL,
    `assigned_serial_numbers` JSON COMMENT 'Array of assigned SN strings',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
    FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL,
    INDEX `idx_orderitem_order` (`order_id`),
    INDEX `idx_orderitem_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK for serial_numbers -> orders
ALTER TABLE `product_serial_numbers` ADD FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL;
ALTER TABLE `product_serial_numbers` ADD FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE SET NULL;

-- ----------------------------
-- Cart Sessions (guest & logged-in)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `cart_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(64) UNIQUE NOT NULL,
    `items` JSON NOT NULL COMMENT 'Cart items array',
    `customer_info` JSON NULL COMMENT 'Saved customer info for returning visitors',
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cart_session` (`session_id`),
    INDEX `idx_cart_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- RajaOngkir Cache (provinces & cities)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `shipping_provinces` (
    `id` INT PRIMARY KEY COMMENT 'RajaOngkir province_id',
    `name` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shipping_cities` (
    `id` INT PRIMARY KEY COMMENT 'RajaOngkir city_id',
    `province_id` INT NOT NULL,
    `type` VARCHAR(20) NOT NULL COMMENT 'Kota or Kabupaten',
    `name` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(10) NULL,
    FOREIGN KEY (`province_id`) REFERENCES `shipping_provinces`(`id`),
    INDEX `idx_city_province` (`province_id`),
    INDEX `idx_city_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Activity Log (audit trail)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_user_id` INT NULL,
    `action` VARCHAR(100) NOT NULL COMMENT 'e.g., order.status_update, product.create',
    `entity_type` VARCHAR(50) NULL COMMENT 'e.g., order, product, serial_number',
    `entity_id` INT NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL,
    INDEX `idx_log_action` (`action`),
    INDEX `idx_log_entity` (`entity_type`, `entity_id`),
    INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Media Library
-- ----------------------------
CREATE TABLE IF NOT EXISTS `media` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(50) NOT NULL,
    `file_size` INT NOT NULL COMMENT 'bytes',
    `width` INT NULL,
    `height` INT NULL,
    `path` VARCHAR(500) NOT NULL,
    `thumbnail_path` VARCHAR(500) NULL,
    `uploaded_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL,
    INDEX `idx_media_filename` (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- Default Data
-- ----------------------------

-- Default super admin (password: vicmic2026)
INSERT INTO `admin_users` (`username`, `email`, `password_hash`, `full_name`, `role`) VALUES
('admin', 'admin@vicmic.id', '$2y$12$LJ3bQZCVR6GKx6aNqjf0d.K8t8LW8YKOljE5z5Q.PBwWtE6NhH/Oe', 'Super Admin', 'super_admin');

-- Default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
('site_name', 'Vicmic Indonesia', 'general'),
('site_tagline', 'Your Trusted IT Hardware Partner', 'general'),
('site_email', 'info@vicmic.id', 'general'),
('site_phone', '+62 21 XXXXXXXX', 'general'),
('site_whatsapp', '6281XXXXXXXXX', 'general'),
('currency', 'IDR', 'general'),
('currency_symbol', 'Rp', 'general'),
('logo_url', '/assets/img/logo-vicmic.png', 'branding'),
('favicon_url', '/assets/img/favicon.ico', 'branding'),
('primary_color', '#16a34a', 'branding'),
('payment_ttl_minutes', '1440', 'payment'),
('auto_cancel_expired', '1', 'payment'),
('order_prefix', 'VIC', 'order'),
('warranty_default_months', '12', 'warranty');

-- Default categories
INSERT INTO `categories` (`name`, `slug`, `icon`, `sort_order`) VALUES
('Laptop', 'laptop', '💻', 1),
('Desktop PC', 'desktop-pc', '🖥️', 2),
('All-in-One PC', 'aio-pc', '🖥️', 3),
('Monitor', 'monitor', '📺', 4),
('Aksesoris', 'aksesoris', '🎧', 5),
('Networking', 'networking', '🌐', 6),
('Storage', 'storage', '💾', 7),
('Printer', 'printer', '🖨️', 8);
