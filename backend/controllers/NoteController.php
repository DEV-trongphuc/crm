<?php
// NoteController — Threaded notes with @mentions on contacts, companies, deals
class NoteController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth, string $type, int $entityId): void {
        $stmt = $this->db->prepare("
            SELECT n.*, u.full_name as author_name, u.avatar_url as author_avatar,
                   p.full_name as parent_author
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            LEFT JOIN notes np ON n.parent_id = np.id
            LEFT JOIN users p ON np.user_id = p.id
            WHERE n.tenant_id=? AND n.entity_type=? AND n.entity_id=? AND n.parent_id IS NULL
            ORDER BY n.is_pinned DESC, n.created_at DESC
        ");
        $stmt->execute([$auth['tenant_id'], $type, $entityId]);
        $notes = $stmt->fetchAll();

        // Fetch replies for each note
        foreach ($notes as &$note) {
            $replies = $this->db->prepare("
                SELECT n.*, u.full_name as author_name, u.avatar_url as author_avatar
                FROM notes n LEFT JOIN users u ON n.user_id=u.id
                WHERE n.parent_id=? ORDER BY n.created_at ASC
            ");
            $replies->execute([$note['id']]);
            $note['replies'] = $replies->fetchAll();
        }
        respond(200, $notes);
    }

    public function store(array $auth, string $type, int $entityId): void {
        $b = getBody();
        if (empty($b['body'])) respond(422, null, 'Nội dung ghi chú là bắt buộc', false);
        $this->db->prepare("
            INSERT INTO notes (tenant_id, user_id, entity_type, entity_id, body, type, parent_id, is_pinned)
            VALUES (?,?,?,?,?,?,?,?)
        ")->execute([
            $auth['tenant_id'], $auth['user_id'], $type, $entityId,
            $b['body'], $b['type'] ?? 'internal',
            $b['parent_id'] ?? null, $b['is_pinned'] ?? 0
        ]);
        $id = (int)$this->db->lastInsertId();
        // Parse @mentions: extract user IDs from mentions array
        if (!empty($b['mentions']) && is_array($b['mentions'])) {
            $ins = $this->db->prepare("INSERT IGNORE INTO note_mentions (note_id, user_id) VALUES (?,?)");
            foreach ($b['mentions'] as $uid) $ins->execute([$id, (int)$uid]);
        }
        respond(201, ['id' => $id], 'Đã thêm ghi chú');
    }

    public function update(array $auth, int $id): void {
        $b = getBody();
        if (empty($b['body'])) respond(422, null, 'Nội dung là bắt buộc', false);
        $this->db->prepare("UPDATE notes SET body=?, is_pinned=?, updated_at=NOW() WHERE id=? AND user_id=? AND tenant_id=?")
            ->execute([$b['body'], $b['is_pinned'] ?? 0, $id, $auth['user_id'], $auth['tenant_id']]);
        respond(200, null, 'Đã cập nhật ghi chú');
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM notes WHERE id=? AND tenant_id=? AND (user_id=? OR ? IN (SELECT id FROM users WHERE tenant_id=? AND role IN ('admin','manager')))");
        $stmt->execute([$id, $auth['tenant_id'], $auth['user_id'], $auth['user_id'], $auth['tenant_id']]);
        respond(200, null, 'Đã xóa ghi chú');
    }
}
