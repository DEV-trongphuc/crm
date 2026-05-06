-- Migration for Advanced Categories and Gift Tracking
-- Date: 2026-05-06

-- 1. Update product_categories table
ALTER TABLE `product_categories` 
ADD COLUMN `track_inventory` TINYINT(1) DEFAULT 1,
ADD COLUMN `has_cost` TINYINT(1) DEFAULT 1,
ADD COLUMN `track_batches` TINYINT(1) DEFAULT 0;

-- 2. Update inventory_logs table to track receivers for gifts/losses
ALTER TABLE `inventory_logs`
ADD COLUMN `receiver_id` INT(11) DEFAULT NULL,
ADD COLUMN `receiver_type` ENUM('contact', 'company', 'user') DEFAULT NULL;

-- 3. Add index for better performance on receiver lookups
CREATE INDEX idx_inv_logs_receiver ON `inventory_logs` (`receiver_type`, `receiver_id`);

-- 4. Seed initial categories data (optional but helpful for transition)
-- Note: You might want to map existing product.category (string) to these IDs later
INSERT INTO `product_categories` (tenant_id, name, track_inventory, has_cost, track_batches) VALUES
(1, 'Phần mềm', 0, 0, 0),
(1, 'Dịch vụ', 0, 0, 0),
(1, 'Hàng hóa', 1, 1, 1),
(1, 'Linh kiện', 1, 1, 0);
