<?php
class ActivityController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid = $auth['tenant_id'];
        $page = max(1,(int)($_GET['page']??1));
        $limit = min(100,max(10,(int)($_GET['limit']??20)));
        $offset = ($page-1)*$limit;
        $type = $_GET['type']??''; $status = $_GET['status']??''; $uid = $_GET['user_id']??'';
        $relType = $_GET['related_type']??''; $relId = $_GET['related_id']??'';
        
        $where=['a.tenant_id=?']; $params=[$tid];
        if ($auth['role'] === 'sale') {
            $where[] = 'a.user_id = ?';
            $params[] = $auth['user_id'];
        }
        if ($type)     { $where[]='a.type=?';    $params[]=$type; }
        if ($status)   { $where[]='a.status=?';  $params[]=$status; }
        if ($uid)      { $where[]='a.user_id=?'; $params[]=(int)$uid; }
        if ($relType)  { $where[]='a.related_type=?'; $params[]=$relType; }
        if ($relId)    { $where[]='a.related_id=?';   $params[]=(int)$relId; }
        $w=implode(' AND ',$where);

        $cnt=$this->db->prepare("SELECT COUNT(*) FROM activities a WHERE $w");
        $cnt->execute($params); $total=(int)$cnt->fetchColumn();

        $stmt=$this->db->prepare("
            SELECT a.*, u.full_name as user_name, u.avatar_url,
                   CONCAT(ct.first_name,' ',ct.last_name) as contact_name,
                   d.title as deal_name,
                   c.name as company_name
            FROM activities a 
            LEFT JOIN users u ON a.user_id=u.id
            LEFT JOIN contacts ct ON a.related_type='contact' AND a.related_id=ct.id
            LEFT JOIN deals d ON a.related_type='deal' AND a.related_id=d.id
            LEFT JOIN companies c ON a.related_type='company' AND a.related_id=c.id
            WHERE $w ORDER BY a.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        respond(200,['items'=>$stmt->fetchAll(),'total'=>$total,'page'=>$page,'limit'=>$limit]);
    }

    public function store(array $auth): void {
        $b=getBody();
        if (empty($b['subject'])||empty($b['type'])) respond(422,null,'Tiêu đề và loại là bắt buộc',false);
        
        // Verify related entity if provided
        if (!empty($b['related_type']) && !empty($b['related_id'])) {
            $table = $b['related_type'] === 'contact' ? 'contacts' : ($b['related_type'] === 'company' ? 'companies' : 'deals');
            $check = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
            $check->execute([(int)$b['related_id'], $auth['tenant_id']]);
            if (!$check->fetch()) {
                $b['related_type'] = null; $b['related_id'] = null; // Reset if unauthorized
            }
        }

        $this->db->prepare("
            INSERT INTO activities (tenant_id,user_id,type,subject,body,status,priority,due_date,related_type,related_id)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        ")->execute([
            $auth['tenant_id'], $b['user_id']??$auth['user_id'], $b['type'],
            $b['subject'], $b['body']??null, $b['status']??'planned', $b['priority']??'medium',
            $b['due_date']??null, $b['related_type']??null, $b['related_id']??null,
        ]);
        $this->show($auth,(int)$this->db->lastInsertId());
    }

    public function show(array $auth,int $id): void {
        $sql = "SELECT a.*,u.full_name as user_name FROM activities a LEFT JOIN users u ON a.user_id=u.id WHERE a.id=? AND a.tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND a.user_id=?";
            $p[] = $auth['user_id'];
        }
        $stmt=$this->db->prepare($sql);
        $stmt->execute($p);
        $row=$stmt->fetch(); if(!$row) respond(404,null,'Không tìm thấy',false);
        respond(200,$row);
    }

    public function update(array $auth,int $id): void {
        $b=getBody();
        
        // Auto set done_at if status changes to done
        if (isset($b['status']) && $b['status'] === 'done' && !isset($b['done_at'])) {
            $b['done_at'] = date('Y-m-d H:i:s');
        }

        // Verify related entity if changed
        if (!empty($b['related_type']) && !empty($b['related_id'])) {
            $table = $b['related_type'] === 'contact' ? 'contacts' : ($b['related_type'] === 'company' ? 'companies' : 'deals');
            $check = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
            $check->execute([(int)$b['related_id'], $auth['tenant_id']]);
            if (!$check->fetch()) {
                $b['related_type'] = null; $b['related_id'] = null;
            }
        }

        $fields=['user_id','type','subject','body','status','priority','due_date','done_at','related_type','related_id'];
        $sets=[];$params=[];
        foreach($fields as $f){if(array_key_exists($f,$b)){$sets[]="$f=?";$params[]=$b[$f];}}
        if(!$sets) respond(422,null,'Không có dữ liệu',false);

        // Check permission first
        $check = $this->db->prepare("SELECT id FROM activities WHERE id=? AND tenant_id=? " . ($auth['role'] === 'sale' ? " AND user_id=?" : ""));
        $cp = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') $cp[] = $auth['user_id'];
        $check->execute($cp);
        if (!$check->fetch()) respond(404, null, 'Không tìm thấy hoặc không có quyền', false);

        $params[]=$id;$params[]=$auth['tenant_id'];
        $stmt = $this->db->prepare("UPDATE activities SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?");
        $stmt->execute($params);
        $this->show($auth,$id);
    }

    public function destroy(array $auth,int $id): void {
        $sql = "DELETE FROM activities WHERE id=? AND tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND user_id=?";
            $p[] = $auth['user_id'];
        }
        $stmt=$this->db->prepare($sql);
        $stmt->execute($p);
        if(!$stmt->rowCount()) respond(404,null,'Không tìm thấy',false);
        respond(200,null,'Đã xóa thành công');
    }
}
