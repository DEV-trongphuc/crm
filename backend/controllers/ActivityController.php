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
        $search = $_GET['search'] ?? '';
        $start = $_GET['start_date'] ?? '';
        $end   = $_GET['end_date'] ?? '';
        
        $sortBy = $_GET['sort']  ?? 'due_date';
        $order  = $_GET['order'] ?? 'ASC';

        $where=['a.tenant_id=?', 'a.deleted_at IS NULL']; $params=[$tid];

        if ($search) {
            $where[] = '(a.subject LIKE ? OR a.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($start) { $where[] = 'a.due_date >= ?'; $params[] = $start; }
        if ($end)   { $where[] = 'a.due_date <= ?'; $params[] = $end; }

        // Validating sort fields
        $allowedSort = ['created_at', 'due_date', 'priority', 'status'];
        if (!in_array($sortBy, $allowedSort)) $sortBy = 'due_date';
        if (!in_array(strtoupper($order), ['ASC', 'DESC'])) $order = 'ASC';

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
            LEFT JOIN contacts ct ON a.related_type='contact' AND a.related_id=ct.id AND ct.deleted_at IS NULL
            LEFT JOIN deals d ON a.related_type='deal' AND a.related_id=d.id AND d.deleted_at IS NULL
            LEFT JOIN companies c ON a.related_type='company' AND a.related_id=c.id AND c.deleted_at IS NULL
            WHERE $w ORDER BY a.$sortBy $order
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        respond(200,['items'=>$stmt->fetchAll(),'total'=>$total,'page'=>$page,'limit'=>$limit]);
    }

    public function store(array $auth): void {
        $b=getBody();
        if (empty($b['subject'])||empty($b['type'])) respond(422,null,'Tiêu đề và loại là bắt buộc',false);
        
        // Verify related entity if provided
        $allowedRelTypes = ['contact', 'company', 'deal'];
        if (!empty($b['related_type']) && !empty($b['related_id'])) {
            if (in_array($b['related_type'], $allowedRelTypes)) {
                $table = $b['related_type'] === 'contact' ? 'contacts' : ($b['related_type'] === 'company' ? 'companies' : 'deals');
                $check = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
                $check->execute([(int)$b['related_id'], $auth['tenant_id']]);
                if (!$check->fetch()) {
                    $b['related_type'] = null; $b['related_id'] = null; // Reset if unauthorized
                }
            } else {
                $b['related_type'] = null; $b['related_id'] = null; // Reset if type not allowed
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
        $actId = (int)$this->db->lastInsertId();

        // Update last_contact for the contact
        if (!empty($b['related_type']) && !empty($b['related_id'])) {
            if ($b['related_type'] === 'contact') {
                $this->db->prepare("UPDATE contacts SET last_contact = CURRENT_DATE WHERE id = ? AND tenant_id = ?")
                     ->execute([(int)$b['related_id'], $auth['tenant_id']]);
            } else if ($b['related_type'] === 'deal') {
                // Find contact linked to this deal
                $sDeal = $this->db->prepare("SELECT contact_id FROM deals WHERE id = ? AND tenant_id = ?");
                $sDeal->execute([(int)$b['related_id'], $auth['tenant_id']]);
                $cid = $sDeal->fetchColumn();
                if ($cid) {
                    $this->db->prepare("UPDATE contacts SET last_contact = CURRENT_DATE WHERE id = ? AND tenant_id = ?")
                         ->execute([(int)$cid, $auth['tenant_id']]);
                }
            }
        }

        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'CREATE', 'activity', $actId, json_encode(['subject' => $b['subject'], 'type' => $b['type']]));

        $this->show($auth,$actId);
    }

    public function show(array $auth,int $id): void {
        $sql = "SELECT a.*,u.full_name as user_name FROM activities a LEFT JOIN users u ON a.user_id=u.id WHERE a.id=? AND a.tenant_id=? AND a.deleted_at IS NULL";
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
        $allowedRelTypes = ['contact', 'company', 'deal'];
        if (!empty($b['related_type']) && !empty($b['related_id'])) {
            if (in_array($b['related_type'], $allowedRelTypes)) {
                $table = $b['related_type'] === 'contact' ? 'contacts' : ($b['related_type'] === 'company' ? 'companies' : 'deals');
                $check = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
                $check->execute([(int)$b['related_id'], $auth['tenant_id']]);
                if (!$check->fetch()) {
                    $b['related_type'] = null; $b['related_id'] = null;
                }
            } else {
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

        // If status changed to done, update contact's last_contact
        if (isset($b['status']) && $b['status'] === 'done') {
            $checkRel = $this->db->prepare("SELECT related_type, related_id FROM activities WHERE id=?");
            $checkRel->execute([$id]);
            $rel = $checkRel->fetch();
            if ($rel && !empty($rel['related_id'])) {
                if ($rel['related_type'] === 'contact') {
                    $this->db->prepare("UPDATE contacts SET last_contact = CURRENT_DATE WHERE id = ? AND tenant_id = ?")
                         ->execute([(int)$rel['related_id'], $auth['tenant_id']]);
                } else if ($rel['related_type'] === 'deal') {
                    $sDeal = $this->db->prepare("SELECT contact_id FROM deals WHERE id = ? AND tenant_id = ?");
                    $sDeal->execute([(int)$rel['related_id'], $auth['tenant_id']]);
                    $cid = $sDeal->fetchColumn();
                    if ($cid) {
                        $this->db->prepare("UPDATE contacts SET last_contact = CURRENT_DATE WHERE id = ? AND tenant_id = ?")
                             ->execute([(int)$cid, $auth['tenant_id']]);
                    }
                }
            }
        }

        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'UPDATE', 'activity', $id, json_encode($b));

        $this->show($auth,$id);
    }

    public function destroy(array $auth,int $id): void {
        $sql = "UPDATE activities SET deleted_at = NOW() WHERE id=? AND tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND user_id=?";
            $p[] = $auth['user_id'];
        }
        $stmt=$this->db->prepare($sql);
        $stmt->execute($p);
        if(!$stmt->rowCount()) respond(404,null,'Không tìm thấy hoặc không có quyền',false);
        logActivity($this->db, $auth['tenant_id'], $auth['user_id'], 'DELETE', 'activity', $id);
        respond(200,null,'Đã xóa hoạt động');
    }
}
