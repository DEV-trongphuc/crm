<?php
// f:\CRM\backend\fix_db_migration.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance();

echo "<pre>";
echo "Bắt đầu cập nhật cơ sở dữ liệu...\n";

$queries = [
    // 1. Cập nhật bảng products (nếu thiếu)
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `category_id` INT(11) DEFAULT NULL AFTER `created_by`",
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `track_inventory` TINYINT(1) DEFAULT 1",
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `track_cost` TINYINT(1) DEFAULT 1",
    
    // 2. Cập nhật bảng product_categories
    "ALTER TABLE `product_categories` ADD COLUMN IF NOT EXISTS `track_inventory` TINYINT(1) DEFAULT 1",
    "ALTER TABLE `product_categories` ADD COLUMN IF NOT EXISTS `has_cost` TINYINT(1) DEFAULT 1",
    "ALTER TABLE `product_categories` ADD COLUMN IF NOT EXISTS `track_batches` TINYINT(1) DEFAULT 0",
    
    // 3. Cập nhật bảng inventory_logs
    "ALTER TABLE `inventory_logs` ADD COLUMN IF NOT EXISTS `receiver_id` INT(11) DEFAULT NULL",
    "ALTER TABLE `inventory_logs` ADD COLUMN IF NOT EXISTS `receiver_type` ENUM('contact', 'company', 'user') DEFAULT NULL",
    "CREATE INDEX IF NOT EXISTS idx_inv_logs_receiver ON `inventory_logs` (`receiver_type`, `receiver_id`)"
];

foreach ($queries as $q) {
    try {
        $db->exec($q);
        echo "SUCCESS: $q\n";
    } catch (Exception $e) {
        echo "INFO/ERROR: " . $e->getMessage() . " (Query: $q)\n";
    }
}

// Thêm dữ liệu mẫu nếu bảng danh mục trống
$count = $db->query("SELECT COUNT(*) FROM product_categories")->fetchColumn();
if ($count == 0) {
    echo "Đang khởi tạo dữ liệu danh mục mẫu...\n";
    $db->exec("INSERT INTO `product_categories` (tenant_id, name, track_inventory, has_cost, track_batches) VALUES
        (1, 'Phần mềm', 0, 0, 0),
        (1, 'Dịch vụ', 0, 0, 0),
        (1, 'Hàng hóa', 1, 1, 1),
        (1, 'Linh kiện', 1, 1, 0)");
    echo "Đã thêm dữ liệu mẫu.\n";
}

echo "Hoàn tất.\n";
echo "</pre>";
