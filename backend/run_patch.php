<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config.php';

try {
    $db = Database::getInstance();
    $sql = file_get_contents(__DIR__ . '/db_patch_v3.sql');
    
    // Split SQL by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    echo "<h3>Executing DB Patch v3...</h3><ul>";
    foreach ($statements as $stmt) {
        try {
            $db->exec($stmt);
            echo "<li style='color:green'>SUCCESS: " . htmlspecialchars(substr($stmt, 0, 100)) . "...</li>";
        } catch (Exception $e) {
            echo "<li style='color:orange'>INFO/ERROR: " . htmlspecialchars($e->getMessage()) . "</li>";
        }
    }
    echo "</ul><p>Patch completed.</p>";
} catch (Exception $e) {
    echo "<h3 style='color:red'>Connection Error: " . $e->getMessage() . "</h3>";
}
