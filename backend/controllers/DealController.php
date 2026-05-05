<?php
// f:\CRM\backend\controllers\DealController.php

class DealController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function stages(array $auth): void {
        $stmt = $this->db->prepare("
            SELECT ps.*, COUNT(c.id) as deals
            FROM pipeline_stages ps
            LEFT JOIN contacts c ON c.stage_id = ps.id AND c.deleted_at IS NULL AND c.tenant_id=?
            WHERE ps.tenant_id=?
            GROUP BY ps.id
            ORDER BY ps.order_index
        ");
        $stmt->execute([$auth['tenant_id'], $auth['tenant_id']]);
        respond(200, $stmt->fetchAll());
    }

    public function storeStage(array $auth): void {
        $b = getBody();
        if (empty($b['name'])) respond(422, null, 'Tên stage là bắt buộc', false);
        $maxIdx = $this->db->prepare("SELECT COALESCE(MAX(order_index),0)+1 FROM pipeline_stages WHERE tenant_id=?");
        $maxIdx->execute([$auth['tenant_id']]);
        $nextIdx = (int)$maxIdx->fetchColumn();
        $this->db->prepare("INSERT INTO pipeline_stages (tenant_id,name,color,order_index,is_won,is_lost) VALUES (?,?,?,?,?,?)")
            ->execute([$auth['tenant_id'], $b['name'], $b['color']??'#6366f1', $nextIdx, $b['is_won']??0, $b['is_lost']??0]);
        respond(201, ['id' => (int)$this->db->lastInsertId()], 'Stage đã tạo thành công');
    }

    public function updateStage(array $auth, int $id): void {
        $b = getBody();
        $fields = ['name','color','order_index','is_won','is_lost'];
        $sets=[]; $params=[];
        foreach ($fields as $f) { if (array_key_exists($f,$b)) { $sets[]="$f=?"; $params[]=$b[$f]; } }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        $params[]=$id; $params[]=$auth['tenant_id'];
        $this->db->prepare("UPDATE pipeline_stages SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        respond(200, null, 'Đã cập nhật stage');
    }

    public function destroyStage(array $auth, int $id): void {
        // Prevent deleting stages that have deals
        $cnt = $this->db->prepare("SELECT COUNT(*) FROM deals WHERE stage_id=? AND tenant_id=?");
        $cnt->execute([$id, $auth['tenant_id']]);
        if ($cnt->fetchColumn() > 0) respond(400, null, 'Không thể xóa stage đang có cơ hội bán hàng', false);
        
        $this->db->prepare("DELETE FROM pipeline_stages WHERE id=? AND tenant_id=?")->execute([$id, $auth['tenant_id']]);
        respond(200, null, 'Đã xóa stage thành công');
    }

    public function index(array $auth): void {
        $tid    = $auth['tenant_id'];
        $page   = max(1,(int)($_GET['page']??1));
        $limit  = min(100,max(10,(int)($_GET['limit']??50)));
        $offset = ($page-1)*$limit;
        $stage  = $_GET['stage_id'] ?? '';
        $owner  = $_GET['owner_id'] ?? '';

        $where=['d.tenant_id=?', 'd.deleted_at IS NULL']; $params=[$tid];
        if ($stage) { $where[]='d.stage_id=?'; $params[]=(int)$stage; }
        if ($owner) { $where[]='d.owner_id=?'; $params[]=(int)$owner; }
        $w = implode(' AND ',$where);

        $cnt = $this->db->prepare("SELECT COUNT(*) FROM deals d WHERE $w");
        $cnt->execute($params); $total=(int)$cnt->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT d.*,
                   ps.name as stage_name, ps.color as stage_color, ps.is_won, ps.is_lost,
                   CONCAT(c.first_name,' ',c.last_name) as contact_name,
                   comp.name as company_name,
                   u.full_name as owner_name, u.avatar_url as owner_avatar
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
            LEFT JOIN contacts c ON d.contact_id=c.id
            LEFT JOIN companies comp ON d.company_id=comp.id
            LEFT JOIN users u ON d.owner_id=u.id
            WHERE $w ORDER BY ps.order_index ASC, d.value DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        foreach ($data as &$row) $row['tags'] = json_decode($row['tags']??'[]');
        respond(200,['items'=>$data,'total'=>$total,'page'=>$page,'limit'=>$limit]);
    }

    public function store(array $auth): void {
        $b = getBody();
        if (empty($b['title'])) respond(422, null, 'Tiêu đề deal là bắt buộc', false);
        // Get first stage
        $stageId = $b['stage_id'] ?? null;
        if (!$stageId) {
            $s = $this->db->prepare("SELECT id FROM pipeline_stages WHERE tenant_id=? ORDER BY order_index LIMIT 1");
            $s->execute([$auth['tenant_id']]); $stageId = $s->fetchColumn();
        }
        $this->db->prepare("
            INSERT INTO deals (tenant_id,stage_id,contact_id,company_id,owner_id,created_by,
                title,value,probability,expected_close_date,source,tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ")->execute([
            $auth['tenant_id'], $stageId, $b['contact_id']??null, $b['company_id']??null,
            $b['owner_id']??$auth['user_id'], $auth['user_id'],
            $b['title'], $b['value']??0, $b['probability']??50,
            $b['expected_close_date']??null, $b['source']??null,
            json_encode($b['tags']??[]),
        ]);
        $id = (int)$this->db->lastInsertId();
        // Record history
        $this->db->prepare("INSERT INTO deal_stage_history (deal_id,from_stage,to_stage,moved_by) VALUES (?,NULL,?,?)")
            ->execute([$id, $stageId, $auth['user_id']]);
        
        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'note', 'Tạo Deal mới', "Deal \"{$b['title']}\" được tạo thành công.", 'deal', $id);
        $this->show($auth, $id);
    }

    public function show(array $auth, int $id): void {
        $stmt = $this->db->prepare("
            SELECT d.*, ps.name as stage_name, ps.color as stage_color, ps.is_won, ps.is_lost,
                   CONCAT(c.first_name,' ',c.last_name) as contact_name,
                   comp.name as company_name, u.full_name as owner_name
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
            LEFT JOIN contacts c ON d.contact_id=c.id
            LEFT JOIN companies comp ON d.company_id=comp.id
            LEFT JOIN users u ON d.owner_id=u.id
            WHERE d.id=? AND d.tenant_id=? AND d.deleted_at IS NULL
        ");
        $stmt->execute([$id, $auth['tenant_id']]);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy deal', false);
        $row['tags'] = json_decode($row['tags']??'[]');
        respond(200, $row);
    }

    public function moveStage(array $auth, int $id): void {
        $b = getBody();
        if (empty($b['stage_id'])) respond(422, null, 'stage_id là bắt buộc', false);
        // Get current stage
        $cur = $this->db->prepare("SELECT stage_id FROM deals WHERE id=? AND tenant_id=?");
        $cur->execute([$id, $auth['tenant_id']]); $old = $cur->fetchColumn();
        if ($old === false) respond(404, null, 'Deal không tồn tại', false);

        $this->db->prepare("UPDATE deals SET stage_id=? WHERE id=? AND tenant_id=?")
            ->execute([$b['stage_id'], $id, $auth['tenant_id']]);
        $this->db->prepare("INSERT INTO deal_stage_history (deal_id,from_stage,to_stage,moved_by) VALUES (?,?,?,?)")
            ->execute([$id, $old, $b['stage_id'], $auth['user_id']]);

        // Get stage names for log
        $sn = $this->db->prepare("SELECT name FROM pipeline_stages WHERE id IN (?,?)");
        $sn->execute([$old, $b['stage_id']]); $names = $sn->fetchAll(PDO::FETCH_COLUMN);
        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'note', 'Chuyển giai đoạn Deal', "Deal đã được chuyển trạng thái.", 'deal', $id);

        respond(200, null, 'Đã cập nhật stage thành công');
    }

    public function update(array $auth, int $id): void {
        $b = getBody();
        $fields = ['stage_id','contact_id','company_id','owner_id','title','value',
                   'probability','expected_close_date','source','lost_reason'];
        $sets=[]; $params=[];
        foreach ($fields as $f) { if (array_key_exists($f,$b)) { $sets[]="$f=?"; $params[]=$b[$f]; } }
        if (isset($b['tags'])) { $sets[]='tags=?'; $params[]=json_encode($b['tags']); }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        $params[]=$id; $params[]=$auth['tenant_id'];
        $this->db->prepare("UPDATE deals SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->show($auth, $id);
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("UPDATE deals SET deleted_at=NOW() WHERE id=? AND tenant_id=?");
        $stmt->execute([$id,$auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy deal', false);
        
        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'note', 'Xóa Deal', "Một cơ hội bán hàng đã bị xóa.", 'deal', $id);
        respond(200, null, 'Đã xóa deal (vào thùng rác)');
    }

    public function bulkDelete(array $auth): void {
        $b = getBody();
        $ids = $b['ids'] ?? [];
        if (empty($ids)) respond(400, null, 'ID không hợp lệ', false);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->prepare("UPDATE deals SET deleted_at=NOW() WHERE tenant_id=? AND id IN ($placeholders)")
            ->execute(array_merge([$auth['tenant_id']], $ids));
        respond(200, null, "Đã xóa " . count($ids) . " deal");
    }
}
