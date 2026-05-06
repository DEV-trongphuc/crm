-- f:\CRM\backend\migrate_2026_05_06.sql
-- Cập nhật cấu trúc database để hỗ trợ đầy đủ các tính năng mới: 
-- Phân quyền tenant, Quản lý xóa mềm (Soft Delete), và Báo cáo nâng cao.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Đảm bảo bảng tenants tồn tại
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm tenant mặc định nếu chưa có
INSERT IGNORE INTO `tenants` (id, name, slug) VALUES (1, 'Minth CRM Demo', 'minth-demo');

-- 2. Cập nhật bảng contacts
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `owner_id` int(11) DEFAULT NULL;
ALTER TABLE `contacts` ADD INDEX IF NOT EXISTS `idx_contacts_tenant_deleted` (`tenant_id`, `deleted_at`);

-- 3. Cập nhật bảng deals
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `deals` ADD COLUMN IF NOT EXISTS `actual_close_date` date DEFAULT NULL;
ALTER TABLE `deals` ADD INDEX IF NOT EXISTS `idx_deals_tenant_deleted` (`tenant_id`, `deleted_at`);

-- 4. Cập nhật bảng pipeline_stages
ALTER TABLE `pipeline_stages` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `pipeline_stages` ADD COLUMN IF NOT EXISTS `is_won` tinyint(1) DEFAULT 0;
ALTER TABLE `pipeline_stages` ADD COLUMN IF NOT EXISTS `is_lost` tinyint(1) DEFAULT 0;

-- 5. Cập nhật bảng tags
ALTER TABLE `tags` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;

-- 6. Cập nhật bảng invoices
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `shipping_fee` decimal(15,2) DEFAULT 0.00;
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `shipping_customer_pay` tinyint(1) DEFAULT 1;

-- 7. Cập nhật bảng expenses
ALTER TABLE `expenses` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;

-- 8. Cập nhật bảng activities
ALTER TABLE `activities` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;

-- 9. Cập nhật bảng users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `tenant_id` int(11) NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) DEFAULT 1;

-- 10. Đảm bảo dữ liệu cũ được gắn vào tenant 1
UPDATE `contacts` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `deals` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `pipeline_stages` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `tags` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `users` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `invoices` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `expenses` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;
UPDATE `activities` SET `tenant_id` = 1 WHERE `tenant_id` IS NULL OR `tenant_id` = 0;

SET FOREIGN_KEY_CHECKS = 1;
