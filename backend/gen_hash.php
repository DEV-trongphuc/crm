<?php
// Chạy file này 1 lần để lấy hash, sau đó xóa!
// Truy cập: http://open.domation.net/crm/backend/gen_hash.php

$passwords = [
    'Admin@123' => password_hash('Admin@123', PASSWORD_BCRYPT, ['cost' => 12]),
    'password'  => password_hash('password',  PASSWORD_BCRYPT, ['cost' => 12]),
];

header('Content-Type: text/plain');
foreach ($passwords as $pw => $hash) {
    echo "$pw  =>  $hash\n";
}

// Tự xóa sau khi chạy
// unlink(__FILE__);
