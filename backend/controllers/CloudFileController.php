<?php
class CloudFileController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid = $auth['tenant_id'];
        $uid = $auth['user_id'];
        $stmt = $this->db->prepare("
            SELECT cf.*, u.full_name as uploader_name, u2.full_name as editor_name 
            FROM cloud_files cf
            LEFT JOIN users u ON cf.uploaded_by = u.id
            LEFT JOIN users u2 ON cf.updated_by = u2.id
            WHERE cf.tenant_id = ? 
            AND (cf.visibility = 'shared' OR cf.uploaded_by = ?)
            ORDER BY cf.created_at DESC
        ");
        $stmt->execute([$tid, $uid]);
        respond(200, $stmt->fetchAll());
    }

    public function store(array $auth): void {
        $b = getBody();
        if (empty($b['name']) || empty($b['file_path'])) respond(422, null, 'Thiếu thông tin tệp tin', false);

        $stmt = $this->db->prepare("
            INSERT INTO cloud_files (tenant_id, uploaded_by, name, file_path, mime_type, file_size, category, visibility)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $auth['tenant_id'], $auth['user_id'], $b['name'],
            $b['file_path'], $b['mime_type'] ?? null, $b['file_size'] ?? 0,
            $b['category'] ?? 'general', $b['visibility'] ?? 'shared'
        ]);
        respond(200, ['id' => $this->db->lastInsertId()], 'Đã lưu tệp tin vào kho lưu trữ');
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM cloud_files WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $auth['tenant_id']]);
        respond(200, null, 'Đã xóa tệp tin');
    }
}
