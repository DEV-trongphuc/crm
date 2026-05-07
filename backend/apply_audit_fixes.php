<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config.php';

if (php_sapi_name() !== 'cli' && !isset($_GET['run'])) {
    die("Use CLI or ?run=1 to execute.");
}

try {
    $db = Database::getInstance();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $logs = [];

    $sqlStatements = [
        "ALTER TABLE `invoices` ADD COLUMN `is_inventory_deducted` TINYINT(1) DEFAULT 0 AFTER `shipping_fee`" => "Added is_inventory_deducted to invoices",
        "CREATE INDEX `idx_deals_deep_filter` ON `deals` (`tenant_id`, `stage_id`, `deleted_at`)" => "Added index for deals filter",
        "CREATE INDEX `idx_contacts_deep_filter` ON `contacts` (`tenant_id`, `status`, `deleted_at`)" => "Added index for contacts filter",
        "CREATE INDEX `idx_invoices_deep_filter` ON `invoices` (`tenant_id`, `status`, `paid_at`)" => "Added index for invoices filter",
        "CREATE INDEX `idx_expenses_deep_filter` ON `expenses` (`tenant_id`, `status`, `date`)" => "Added index for expenses filter",
        "CREATE INDEX `idx_audit_logs_deep_res` ON `audit_logs` (`tenant_id`, `resource`, `resource_id`)" => "Added index for audit_logs resource",
        "ALTER TABLE `contacts` MODIFY `deleted_at` TIMESTAMP NULL DEFAULT NULL" => "Standardized contacts deleted_at to TIMESTAMP",
        "ALTER TABLE `deals` MODIFY `deleted_at` TIMESTAMP NULL DEFAULT NULL" => "Standardized deals deleted_at to TIMESTAMP",
        "ALTER TABLE `companies` MODIFY `deleted_at` TIMESTAMP NULL DEFAULT NULL" => "Standardized companies deleted_at to TIMESTAMP"
    ];

    foreach ($sqlStatements as $sql => $desc) {
        try {
            $db->exec($sql);
            $logs[] = "SUCCESS: $desc";
        } catch (Exception $e) {
            $logs[] = "INFO: $desc (Already exists or error: " . $e->getMessage() . ")";
        }
    }

    echo "Migration completed.\n";
    print_r($logs);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
