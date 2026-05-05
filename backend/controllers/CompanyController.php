<?php
// f:\CRM\backend\controllers\CompanyController.php

class CompanyController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid    = $auth['tenant_id'];
        $page   = max(1,(int)($_GET['page'] ?? 1));
        $limit  = min(100, max(10,(int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';

        $where = ['c.tenant_id=?','c.deleted_at IS NULL']; $params = [$tid];
        if ($search) { $where[] = 'MATCH(c.name,c.email) AGAINST(? IN BOOLEAN MODE)'; $params[] = "$search*"; }
        if ($status) { $where[] = 'c.status=?'; $params[] = $status; }
        $w = implode(' AND ', $where);

        $total = (int)$this->db->prepare("SELECT COUNT(*) FROM companies c WHERE $w")->execute($params) ? 0 : 0;
        $cnt = $this->db->prepare("SELECT COUNT(*) FROM companies c WHERE $w");
        $cnt->execute($params);
        $total = (int)$cnt->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT c.*, u.full_name as owner_name,
                   (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id=c.id) as contact_count,
                   (SELECT COUNT(*) FROM deals d WHERE d.company_id=c.id) as deal_count
            FROM companies c LEFT JOIN users u ON c.owner_id=u.id
            WHERE $w ORDER BY c.created_at DESC LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        foreach ($data as &$row) $row['tags'] = json_decode($row['tags'] ?? '[]');
        respond(200, ['items'=>$data,'total'=>$total,'page'=>$page,'limit'=>$limit,'total_pages'=>ceil($total/$limit)]);
    }

    public function store(array $auth): void {
        $b = getBody();
        if (empty($b['name'])) respond(422, null, 'Tên công ty là bắt buộc', false);
        $stmt = $this->db->prepare("
            INSERT INTO companies (tenant_id,owner_id,created_by,name,industry,website,phone,email,address,city,country,size,status,tags,notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");
        $stmt->execute([
            $auth['tenant_id'], $b['owner_id'] ?? $auth['user_id'], $auth['user_id'],
            $b['name'], $b['industry']??null, $b['website']??null, $b['phone']??null,
            $b['email']??null, $b['address']??null, $b['city']??null,
            $b['country']??'Việt Nam', $b['size']??null, $b['status']??'prospect',
            json_encode($b['tags']??[]), $b['notes']??null,
        ]);
        $this->show($auth, (int)$this->db->lastInsertId());
    }

    public function show(array $auth, int $id): void {
        $stmt = $this->db->prepare("
            SELECT c.*, u.full_name as owner_name,
                   (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id=c.id) as contact_count,
                   (SELECT COUNT(*) FROM deals d WHERE d.company_id=c.id) as deal_count
            FROM companies c LEFT JOIN users u ON c.owner_id=u.id
            WHERE c.id=? AND c.tenant_id=? AND c.deleted_at IS NULL
        ");
        $stmt->execute([$id, $auth['tenant_id']]);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy công ty', false);
        $row['tags'] = json_decode($row['tags'] ?? '[]');
        respond(200, $row);
    }

    public function update(array $auth, int $id): void {
        $b = getBody();
        $fields = ['owner_id','name','industry','website','phone','email','address','city','country','size','status','notes'];
        $sets=[]; $params=[];
        foreach ($fields as $f) { if (array_key_exists($f,$b)) { $sets[]="$f=?"; $params[]=$b[$f]; } }
        if (isset($b['tags'])) { $sets[]='tags=?'; $params[]=json_encode($b['tags']); }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        $params[]=$id; $params[]=$auth['tenant_id'];
        $this->db->prepare("UPDATE companies SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->show($auth, $id);
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("UPDATE companies SET deleted_at=NOW() WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy công ty', false);
        respond(200, null, 'Đã xóa công ty (vào thùng rác)');
    }

    public function bulkDelete(array $auth): void {
        $b = getBody();
        $ids = $b['ids'] ?? [];
        if (empty($ids)) respond(400, null, 'ID không hợp lệ', false);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->prepare("UPDATE companies SET deleted_at=NOW() WHERE tenant_id=? AND id IN ($placeholders)")
            ->execute(array_merge([$auth['tenant_id']], $ids));
        respond(200, null, "Đã xóa " . count($ids) . " công ty");
    }
}
