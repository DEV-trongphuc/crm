<?php
require_once 'f:/CRM/backend/config/Database.php';
$db = Database::getInstance();

$stmt = $db->prepare("SELECT id, email, full_name, role, tenant_id FROM users WHERE email = 'admin@minth.crm' LIMIT 1");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "User not found\n";
    exit;
}

echo "Logged in as: " . json_encode($user, JSON_PRETTY_PRINT) . "\n\n";

$tid = $user['tenant_id'];

$stmt = $db->prepare("SELECT COUNT(*) FROM deals WHERE tenant_id = ?");
$stmt->execute([$tid]);
echo "Deals for tenant $tid: " . $stmt->fetchColumn() . "\n";

$stmt = $db->prepare("SELECT COUNT(*) FROM deals WHERE tenant_id != ?");
$stmt->execute([$tid]);
echo "Deals for OTHER tenants: " . $stmt->fetchColumn() . "\n";

$stmt = $db->prepare("SELECT DISTINCT tenant_id FROM deals");
$stmt->execute();
echo "Active tenant IDs in deals table: " . json_encode($stmt->fetchAll(PDO::FETCH_COLUMN)) . "\n";

$stmt = $db->prepare("SELECT id, name FROM pipeline_stages WHERE tenant_id = ?");
$stmt->execute([$tid]);
echo "Stages for tenant $tid: " . json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n";
