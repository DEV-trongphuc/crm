-- Cập nhật bảng products
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `track_inventory` tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `cost` DECIMAL(15, 2) DEFAULT 0;

-- Cập nhật bảng tickets
ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `related_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL;
ALTER TABLE `tickets` ADD COLUMN IF NOT EXISTS `related_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL;

-- Cập nhật bảng users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `bio` TEXT DEFAULT NULL;
