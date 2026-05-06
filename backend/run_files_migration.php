<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config.php';

try {
    $db = Database::getInstance();
    $sql = file_get_contents(__DIR__ . '/migrate_2026_05_06_v3_files.sql');
    
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    echo "Executing Files Upgrade Migration...\n";
    foreach ($statements as $stmt) {
        try {
            $db->exec($stmt);
            echo "SUCCESS: " . substr($stmt, 0, 50) . "...\n";
        } catch (Exception $e) {
            echo "INFO/ERROR: " . $e->getMessage() . "\n";
        }
    }
    echo "Done.\n";
} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}
