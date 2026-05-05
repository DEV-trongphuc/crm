<?php
// Tự động set password thành "password" cho tài khoản admin
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config/Database.php';

try {
    $db = Database::getInstance();
    $hash = password_hash('password', PASSWORD_BCRYPT, ['cost' => 12]);
    
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE email = 'admin@minth.crm'");
    $stmt->execute([$hash]);
    
    echo "<h1>Thành công!</h1><p>Mật khẩu của admin@minth.crm đã được đổi thành: <b>password</b></p>";
    echo "<p>Hãy xóa file này sau khi chạy xong.</p>";
} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage();
}
