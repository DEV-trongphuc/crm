-- Add missing columns to products table to fix 500 error in ProductController::store
ALTER TABLE `products` 
ADD COLUMN `created_by` INT(11) DEFAULT NULL AFTER `tenant_id`,
ADD COLUMN `category` VARCHAR(100) DEFAULT NULL AFTER `category_id`,
ADD COLUMN `cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `price`,
ADD COLUMN `stock_quantity` INT(11) NOT NULL DEFAULT 0 AFTER `unit`;

-- Update foreign key or indices if necessary
ALTER TABLE `products` ADD CONSTRAINT `fk_products_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;
