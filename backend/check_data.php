<?php
// f:\CRM\backend\check_data.php
require_once __DIR__ . '/config/Database.php';
$db = Database::getInstance();

echo "<h3>--- KIỂM TRA DỮ LIỆU CRM ---</h3>";

// 1. Kiểm tra Tenant hiện tại
$stmt = $db->prepare("SELECT tenant_id, full_name, email FROM users WHERE email = 'admin@domation.crm' LIMIT 1");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);
echo "<b>1. Người dùng:</b> " . json_encode($user) . "<br><br>";

$tid = $user ? $user['tenant_id'] : 1;

// 2. Kiểm tra số lượng bản ghi
$tables = ['contacts', 'deals', 'pipeline_stages', 'invoices', 'expenses', 'tags'];
echo "<b>2. Thống kê số lượng (Tenant ID = $tid):</b><br>";
foreach ($tables as $t) {
    try {
        $s = $db->prepare("SELECT COUNT(*) FROM $t WHERE tenant_id = ?");
        $s->execute([$tid]);
        echo "- $t: " . $s->fetchColumn() . " bản ghi<br>";
    } catch (Exception $e) {
        echo "- $t: <span style='color:red'>Lỗi: " . $e->getMessage() . "</span><br>";
    }
}

// 3. Kiểm tra sự sai lệch Stage ID
echo "<br><b>3. Kiểm tra khớp mã Giai đoạn (Deals vs Stages):</b><br>";
try {
    $s = $db->prepare("
        SELECT d.id as deal_id, d.title, d.stage_id as deal_stage_id, ps.id as actual_stage_id, ps.name as stage_name
        FROM deals d
        LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
        WHERE d.tenant_id = ?
        LIMIT 10
    ");
    $s->execute([$tid]);
    $checks = $s->fetchAll(PDO::FETCH_ASSOC);
    foreach ($checks as $c) {
        if (!$c['actual_stage_id']) {
            echo "<span style='color:red'>- Deal #{$c['deal_id']} ({$c['title']}) đang gắn vào Stage ID {$c['deal_stage_id']} NHƯNG ID này không tồn tại!</span><br>";
        } else {
            echo "<span style='color:green'>- Deal #{$c['deal_id']} khớp với Stage: {$c['stage_name']} (ID: {$c['actual_stage_id']})</span><br>";
        }
    }
    if (empty($checks)) echo "- Không có deal nào để kiểm tra.<br>";
} catch (Exception $e) {
    echo "- Lỗi kiểm tra deal: " . $e->getMessage() . "<br>";
}

echo "<br><b>4. Danh sách Giai đoạn hiện có:</b><br>";
try {
    $s = $db->prepare("SELECT id, name, tenant_id FROM pipeline_stages WHERE tenant_id = ?");
    $s->execute([$tid]);
    $stages = $s->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>" . print_r($stages, true) . "</pre>";
} catch (Exception $e) {
    echo "- Lỗi lấy danh sách stage: " . $e->getMessage() . "<br>";
}

echo "<br><b>5. Dữ liệu mồ côi (không có tenant_id hoặc tenant_id=0):</b><br>";
foreach ($tables as $t) {
    try {
        $s = $db->prepare("SELECT COUNT(*) FROM $t WHERE tenant_id IS NULL OR tenant_id = 0");
        $s->execute();
        $cnt = $s->fetchColumn();
        if ($cnt > 0) {
            echo "- <span style='color:orange'>$t: có $cnt bản ghi chưa gán Tenant!</span><br>";
        } else {
            echo "- $t: 0 bản ghi mồ côi.<br>";
        }
    } catch (Exception $e) {
        // Skip
    }
}
