<?php
// f:\CRM\backend\sync_last_contact.php
// Script to sync contacts.last_contact with the most recent activity

require_once 'config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $db = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Bắt đầu đồng bộ ngày liên lạc cuối...\n";

    // 1. Update from direct activities
    $sql1 = "
        UPDATE contacts c
        SET c.last_contact = (
            SELECT MAX(DATE(a.created_at))
            FROM activities a
            WHERE a.related_type = 'contact' AND a.related_id = c.id
        )
        WHERE EXISTS (
            SELECT 1 FROM activities a 
            WHERE a.related_type = 'contact' AND a.related_id = c.id
        )
    ";
    $stmt1 = $db->prepare($sql1);
    $stmt1->execute();
    echo "Đã cập nhật " . $stmt1->rowCount() . " khách hàng từ nhật ký trực tiếp.\n";

    // 2. Update from deal-related activities
    $sql2 = "
        UPDATE contacts c
        SET c.last_contact = GREATEST(
            COALESCE(c.last_contact, '1970-01-01'),
            (
                SELECT MAX(DATE(a.created_at))
                FROM activities a
                JOIN deals d ON a.related_id = d.id
                WHERE a.related_type = 'deal' AND d.contact_id = c.id
            )
        )
        WHERE EXISTS (
            SELECT 1 FROM activities a 
            JOIN deals d ON a.related_id = d.id
            WHERE a.related_type = 'deal' AND d.contact_id = c.id
        )
    ";
    $stmt2 = $db->prepare($sql2);
    $stmt2->execute();
    echo "Đã cập nhật " . $stmt2->rowCount() . " khách hàng từ nhật ký cơ hội (deals).\n";

    echo "Đồng bộ hoàn tất thành công!\n";

} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
}
