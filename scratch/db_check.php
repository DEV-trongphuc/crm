<?php
require_once 'f:/CRM/backend/config/Database.php';
$db = Database::getInstance();
$tid = 1; // Assuming tenant 1 is the demo tenant

$counts = [];
$tables = ['deals', 'contacts', 'companies', 'invoices', 'expenses', 'activities', 'pipeline_stages', 'tags'];
foreach ($tables as $t) {
    $s = $db->prepare("SELECT COUNT(*) FROM $t WHERE tenant_id = ?");
    $s->execute([$tid]);
    $counts[$t] = $s->fetchColumn();
}

$dealsByStage = [];
$s = $db->prepare("SELECT ps.name, COUNT(d.id) as cnt FROM pipeline_stages ps LEFT JOIN deals d ON d.stage_id = ps.id WHERE ps.tenant_id = ? GROUP BY ps.id");
$s->execute([$tid]);
$dealsByStage = $s->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'tenant_id' => $tid,
    'counts' => $counts,
    'dealsByStage' => $dealsByStage
], JSON_PRETTY_PRINT);
