<?php
// f:\CRM\backend\controllers\AuthController.php

class AuthController {
    private PDO $db;

    public function __construct(PDO $db) { $this->db = $db; }

    public function login(): void {
        $body = getBody();
        $email    = trim($body['email']    ?? '');
        $password = trim($body['password'] ?? '');

        if (!$email || !$password) respond(422, null, 'Email và mật khẩu là bắt buộc', false);

        $stmt = $this->db->prepare(
            'SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, t.logo_url as tenant_logo
             FROM users u JOIN tenants t ON u.tenant_id = t.id
             WHERE u.email = ? AND u.is_active = 1 LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            respond(401, null, 'Email hoặc mật khẩu không đúng', false);
        }

        // Update last login
        $this->db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);

        $payload = [
            'user_id'   => $user['id'],
            'tenant_id' => $user['tenant_id'],
            'email'     => $user['email'],
            'role'       => $user['role'],
            'full_name'  => $user['full_name'],
        ];

        $accessToken = JWT::encode($payload);

        // Refresh token (random, store hash)
        $refreshToken = bin2hex(random_bytes(40));
        $hash = hash('sha256', $refreshToken);
        $this->db->prepare(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))'
        )->execute([$user['id'], $hash, 30]);

        // Log activity
        logActivity($this->db, $user['tenant_id'], $user['id'], 'system', 'Đăng nhập hệ thống', "Người dùng {$user['full_name']} đã đăng nhập thành công từ {$_SERVER['REMOTE_ADDR']}");

        respond(200, [
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => [
                'id'          => $user['id'],
                'email'       => $user['email'],
                'full_name'   => $user['full_name'],
                'role'        => $user['role'],
                'avatar_url'  => $user['avatar_url'],
                'tenant_id'   => $user['tenant_id'],
                'tenant_name' => $user['tenant_name'],
                'tenant_slug' => $user['tenant_slug'],
                'tenant_logo' => $user['tenant_logo'],
            ]
        ], 'Đăng nhập thành công');
    }

    public function refresh(): void {
        $body = getBody();
        $refreshToken = $body['refresh_token'] ?? '';
        if (!$refreshToken) respond(401, null, 'Thiếu refresh token', false);

        $hash = hash('sha256', $refreshToken);
        $stmt = $this->db->prepare(
            'SELECT rt.*, u.email, u.role, u.full_name, u.tenant_id, u.is_active
             FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
             WHERE rt.token_hash = ? AND rt.expires_at > NOW() AND u.is_active = 1 LIMIT 1'
        );
        $stmt->execute([$hash]);
        $row = $stmt->fetch();
        if (!$row) respond(401, null, 'Refresh token không hợp lệ hoặc đã hết hạn', false);

        $payload = [
            'user_id'   => $row['user_id'],
            'tenant_id' => $row['tenant_id'],
            'email'     => $row['email'],
            'role'       => $row['role'],
            'full_name'  => $row['full_name'],
        ];
        $newAccess = JWT::encode($payload);
        respond(200, ['access_token' => $newAccess], 'Token làm mới thành công');
    }

    public function logout(): void {
        $body = getBody();
        $refreshToken = $body['refresh_token'] ?? '';
        if ($refreshToken) {
            $hash = hash('sha256', $refreshToken);
            $this->db->prepare('DELETE FROM refresh_tokens WHERE token_hash = ?')->execute([$hash]);
        }
        respond(200, null, 'Đăng xuất thành công');
    }

    public function me(array $auth): void {
        $stmt = $this->db->prepare(
            'SELECT u.id, u.email, u.full_name, u.role, u.avatar_url, u.phone,
                    u.tenant_id, t.name as tenant_name, t.slug as tenant_slug, t.logo_url as tenant_logo
             FROM users u JOIN tenants t ON u.tenant_id = t.id
             WHERE u.id = ? AND u.is_active = 1'
        );
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();
        if (!$user) respond(404, null, 'Người dùng không tồn tại', false);
        respond(200, $user);
    }
}
