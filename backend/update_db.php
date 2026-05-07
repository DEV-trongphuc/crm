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
        $logs[] = "Cột stage_id trong companies có thể đã tồn tại.";
    }

    // Đảm bảo bảng ticket_comments tồn tại cho tính năng thảo luận
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `ticket_comments` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `ticket_id` int(11) NOT NULL,
          `user_id` int(11) NOT NULL,
          `body` text NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `idx_tc_ticket` (`ticket_id`),
          KEY `user_id` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $logs[] = "Đã kiểm tra/tạo bảng ticket_comments.";
    } catch (Exception $e) {
        $logs[] = "Lỗi khi xử lý bảng ticket_comments: " . $e->getMessage();
    }

    // Thêm resolved_at cho tickets (nếu chưa có)
    try {
        $db->exec("ALTER TABLE `tickets` ADD COLUMN `resolved_at` DATETIME NULL AFTER `due_date` ");
        $logs[] = "Đã thêm cột resolved_at vào bảng tickets.";
    } catch (Exception $e) {
        // Bỏ qua nếu đã tồn tại
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
