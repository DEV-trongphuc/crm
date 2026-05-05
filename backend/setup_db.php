<?php
require 'backend/config/Config.php';
$db = Config::getDB();
try {
    $db->exec("ALTER TABLE contacts ADD COLUMN lead_score INT NOT NULL DEFAULT 0;");
    echo "Added lead_score column.\n";
} catch (PDOException $e) {
    echo "Column might exist: " . $e->getMessage() . "\n";
}

try {
    $db->exec("
    CREATE TABLE IF NOT EXISTS `lead_scoring_rules` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `tenant_id` INT NOT NULL,
      `rule_type` ENUM('demographic', 'behavioral') NOT NULL,
      `condition_field` VARCHAR(50) NOT NULL,
      `condition_operator` VARCHAR(20) NOT NULL,
      `condition_value` VARCHAR(255) NOT NULL,
      `score_impact` INT NOT NULL,
      `is_active` TINYINT(1) DEFAULT 1,
      FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Created lead_scoring_rules table.\n";
} catch (PDOException $e) {
    echo "Table error: " . $e->getMessage() . "\n";
}

try {
    // Insert some default rules for tenant 1
    $db->exec("INSERT INTO lead_scoring_rules (tenant_id, rule_type, condition_field, condition_operator, condition_value, score_impact) VALUES 
        (1, 'demographic', 'job_title', 'contains', 'Giám đốc', 20),
        (1, 'demographic', 'job_title', 'contains', 'Trưởng', 15),
        (1, 'demographic', 'phone', 'not_empty', '', 10),
        (1, 'behavioral', 'activities_count', 'greater_than', '3', 15)
    ON DUPLICATE KEY UPDATE id=id;");
    echo "Inserted default rules.\n";
} catch (Exception $e) {
    echo "Rule insertion error: " . $e->getMessage() . "\n";
}
