<?php
// f:\CRM\backend\apply_migration.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance();

try {
    echo "Applying migrations...\n";
    
    // Update products table
    try {
        $db->exec("ALTER TABLE `products` ADD COLUMN `track_inventory` tinyint(1) NOT NULL DEFAULT 1 AFTER `stock_quantity` ");
        echo "Added track_inventory to products table.\n";
    } catch (Exception $e) {}

    try {
        $db->exec("ALTER TABLE `products` ADD COLUMN `cost` DECIMAL(15, 2) DEFAULT 0 AFTER `price` ");
        echo "Added cost column to products table.\n";
    } catch (Exception $e) {}
    
    // Update tickets table
    try {
        $db->exec("ALTER TABLE `tickets` ADD COLUMN `related_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL ");
        echo "Added related_contacts to tickets table.\n";
    } catch (Exception $e) {}

    try {
        $db->exec("ALTER TABLE `tickets` ADD COLUMN `related_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL ");
        echo "Added related_users to tickets table.\n";
    } catch (Exception $e) {}

    // Update users table
    try {
        $db->exec("ALTER TABLE `users` ADD COLUMN `bio` TEXT DEFAULT NULL ");
        echo "Added bio column to users table.\n";
    } catch (Exception $e) {}
    
    echo "Migration completed.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
