<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config.php';

try {
    $db = Database::getInstance();
    $logs = [];
    
    // Thêm stage_id cho contacts
    try {
        $db->exec("ALTER TABLE `contacts` ADD COLUMN `stage_id` INT(11) NULL AFTER `lead_score`");
        $logs[] = "Đã thêm cột stage_id vào contacts.";
    } catch (Exception $e) {
        $logs[] = "Cột stage_id trong contacts có thể đã tồn tại: " . $e->getMessage();
    }
    
    // Thêm stage_id cho companies
    try {
        $db->exec("ALTER TABLE `companies` ADD COLUMN `stage_id` INT(11) NULL AFTER `website`");
        $logs[] = "Đã thêm cột stage_id vào companies.";
    } catch (Exception $e) {
        $logs[] = "Cột stage_id trong companies có thể đã tồn tại: " . $e->getMessage();
    }

    echo "<h3>Quá trình cập nhật Database hoàn tất!</h3><ul>";
    foreach ($logs as $log) {
        echo "<li>$log</li>";
    }
    echo "</ul><p>Vui lòng thử lại chức năng Kanban.</p>";
} catch (PDOException $e) {
    echo "Lỗi kết nối CSDL: " . $e->getMessage();
}
?>
