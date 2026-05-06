-- CRM Database Catch-up Migration (2026-05-06)
-- Run this file to update your database to the latest schema version.

-- 1. Create Expenses tables if not exists
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date` date NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `has_vat_invoice` tinyint(1) NOT NULL DEFAULT 0,
  `is_vat_inclusive` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_exp_tenant` (`tenant_id`),
  KEY `idx_exp_status` (`status`),
  KEY `idx_exp_date` (`tenant_id`,`date`),
  CONSTRAINT `fk_exp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exp_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exp_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expense_entities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `expense_id` int(11) NOT NULL,
  `entity_type` enum('contact','company','deal') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ee_tenant` (`tenant_id`),
  KEY `idx_ee_expense` (`expense_id`),
  KEY `idx_ee_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_ee_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ee_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update Invoices (Shipping Fee Logic)
-- We check if columns exist before adding (using procedure for safety if needed, but standard ALTER usually okay)
ALTER TABLE `invoices` 
ADD COLUMN IF NOT EXISTS `shipping_customer_pay` tinyint(1) DEFAULT 1 COMMENT '1: Khách trả, 0: Shop trả' AFTER `total`,
ADD COLUMN IF NOT EXISTS `shipping_fee` decimal(15,2) DEFAULT 0.00 AFTER `shipping_customer_pay`;

-- 3. Update Products (Inventory & Hardening)
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `created_by` INT(11) DEFAULT NULL AFTER `tenant_id`,
ADD COLUMN IF NOT EXISTS `category` VARCHAR(100) DEFAULT NULL AFTER `category_id`,
ADD COLUMN IF NOT EXISTS `cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `price`,
ADD COLUMN IF NOT EXISTS `stock_quantity` INT(11) NOT NULL DEFAULT 0 AFTER `unit`;

-- Add FK for product creator
ALTER TABLE `products` 
ADD CONSTRAINT `fk_products_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- 4. Optimized Performance Indexes
ALTER TABLE `audit_logs` ADD INDEX IF NOT EXISTS `idx_audit_tenant_created` (`tenant_id`,`created_at`);
ALTER TABLE `contacts` ADD INDEX IF NOT EXISTS `idx_contact_tenant_created` (`tenant_id`,`created_at`);
ALTER TABLE `deals` ADD INDEX IF NOT EXISTS `idx_deal_tenant_created` (`tenant_id`,`created_at`);

-- 5. Data Integrity Check for Products (Default for category_id if missing)
-- (Optional) UPDATE products SET category = 'Phần mềm' WHERE category IS NULL;
