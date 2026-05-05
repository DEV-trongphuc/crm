<?php
// f:\CRM\backend\controllers\ContactController.php

class ContactController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid    = $auth['tenant_id'];
        $page   = max(1, (int)($_GET['page']   ?? 1));
        $limit  = min(100, max(10, (int)($_GET['limit']  ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';
        $source = $_GET['source'] ?? '';
        $owner  = $_GET['owner_id'] ?? '';

        $where  = ['c.tenant_id = ?', 'c.deleted_at IS NULL'];
        $params = [$tid];

        if ($search) {
            $where[]  = 'MATCH(c.first_name, c.last_name, c.email) AGAINST(? IN BOOLEAN MODE)';
            $params[] = "$search*";
        }
        if ($status) { $where[] = 'c.status = ?'; $params[] = $status; }
        if ($source) { $where[] = 'c.source = ?'; $params[] = $source; }
        if ($owner)  { $where[] = 'c.owner_id = ?'; $params[] = (int)$owner; }

        $whereStr = implode(' AND ', $where);

        $count = $this->db->prepare("SELECT COUNT(*) FROM contacts c WHERE $whereStr");
        $count->execute($params);
        $total = (int)$count->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT c.*, 
                   comp.name as company_name,
                   u.full_name as owner_name
            FROM contacts c
            LEFT JOIN companies comp ON c.company_id = comp.id
            LEFT JOIN users u ON c.owner_id = u.id
            WHERE $whereStr
            ORDER BY c.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        // Parse JSON tags
        foreach ($data as &$row) $row['tags'] = json_decode($row['tags'] ?? '[]');

        respond(200, [
            'items' => $data, 'total' => $total,
            'page' => $page, 'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
    }

    public function store(array $auth): void {
        $b = getBody();
        $required = ['first_name'];
        foreach ($required as $f) {
            if (empty($b[$f])) respond(422, null, "Trường '$f' là bắt buộc", false);
        }
        $tags = json_encode($b['tags'] ?? []);
        $stmt = $this->db->prepare("
            INSERT INTO contacts (tenant_id,company_id,owner_id,created_by,first_name,last_name,
                email,phone,mobile,job_title,department,source,status,tags,notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");
        $stmt->execute([
            $auth['tenant_id'],
            $b['company_id']  ?? null, $b['owner_id'] ?? $auth['user_id'],
            $auth['user_id'], $b['first_name'], $b['last_name'] ?? '',
            $b['email'] ?? null, $b['phone'] ?? null, $b['mobile'] ?? null,
            $b['job_title'] ?? null, $b['department'] ?? null,
            $b['source'] ?? 'other', $b['status'] ?? 'lead',
            $tags, $b['notes'] ?? null,
        ]);
        $id = (int)$this->db->lastInsertId();
        $this->show($auth, $id);
    }

    public function show(array $auth, int $id): void {
        $stmt = $this->db->prepare("
            SELECT c.*, comp.name as company_name, u.full_name as owner_name
            FROM contacts c
            LEFT JOIN companies comp ON c.company_id = comp.id
            LEFT JOIN users u ON c.owner_id = u.id
            WHERE c.id=? AND c.tenant_id=? AND c.deleted_at IS NULL
        ");
        $stmt->execute([$id, $auth['tenant_id']]);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy liên hệ', false);
        $row['tags'] = json_decode($row['tags'] ?? '[]');
        respond(200, $row);
    }

    public function update(array $auth, int $id): void {
        $b = getBody();
        $fields = ['company_id','owner_id','first_name','last_name','email','phone',
                   'mobile','job_title','department','source','status','notes'];
        $sets = []; $params = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $b)) { $sets[] = "$f=?"; $params[] = $b[$f]; }
        }
        if (isset($b['tags'])) { $sets[] = 'tags=?'; $params[] = json_encode($b['tags']); }
        if (!$sets) respond(422, null, 'Không có dữ liệu để cập nhật', false);
        $params[] = $id; $params[] = $auth['tenant_id'];
        $this->db->prepare("UPDATE contacts SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->show($auth, $id);
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("UPDATE contacts SET deleted_at=NOW() WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy liên hệ', false);
        respond(200, null, 'Đã xóa liên hệ (vào thùng rác)');
    }

    public function bulkDelete(array $auth): void {
        $b = getBody();
        $ids = $b['ids'] ?? [];
        if (empty($ids)) respond(400, null, 'Danh sách ID không hợp lệ', false);
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare("UPDATE contacts SET deleted_at=NOW() WHERE tenant_id=? AND id IN ($placeholders)");
        $stmt->execute(array_merge([$auth['tenant_id']], $ids));
        
        respond(200, null, "Đã xóa " . $stmt->rowCount() . " liên hệ");
    }
}
