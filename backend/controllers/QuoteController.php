<?php
class QuoteController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $sql = "SELECT q.*,u.full_name as created_by_name,CONCAT(c.first_name,' ',c.last_name) as contact_name FROM quotes q LEFT JOIN users u ON q.created_by=u.id LEFT JOIN contacts c ON q.contact_id=c.id WHERE q.tenant_id=?";
        $p = [$auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND q.created_by=?";
            $p[] = $auth['user_id'];
        }
        $sql .= " ORDER BY q.created_at DESC";
        $stmt=$this->db->prepare($sql);
        $stmt->execute($p);
        respond(200,$stmt->fetchAll());
    }
    public function store(array $auth): void {
        $tid = $auth['tenant_id'];
        $b=getBody(); if(empty($b['title'])) respond(422,null,'Tiêu đề là bắt buộc',false);
        
        // Verify contact belongs to tenant
        if (!empty($b['contact_id'])) {
            $c = $this->db->prepare("SELECT id FROM contacts WHERE id=? AND tenant_id=?");
            $c->execute([(int)$b['contact_id'], $tid]);
            if (!$c->fetch()) $b['contact_id'] = null;
        }

        // Generate robust quote number
        $qNum = 'QT-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $this->db->prepare("INSERT INTO quotes (tenant_id,deal_id,contact_id,created_by,quote_number,title,status,subtotal,discount,tax,total,valid_until,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
            ->execute([$tid,$b['deal_id']??null,$b['contact_id']??null,$auth['user_id'],$qNum,$b['title'],$b['status']??'draft',$b['subtotal']??0,$b['discount']??0,$b['tax']??0,$b['total']??0,$b['valid_until']??null,$b['notes']??null]);
        $qid=(int)$this->db->lastInsertId();
        if(!empty($b['items'])) {
            $ins=$this->db->prepare("INSERT INTO quote_items (quote_id,product_id,name,description,quantity,unit_price,discount,subtotal,sort_order) VALUES (?,?,?,?,?,?,?,?,?)");
            foreach($b['items'] as $i=>$item) {
                $ins->execute([$qid,$item['product_id']??null,$item['name'],$item['description']??null,$item['quantity']??1,$item['unit_price']??0,$item['discount']??0,$item['subtotal']??0,$i]);
            }
        }
        $this->show($auth,$qid);
    }
    public function show(array $auth,int $id): void {
        $sql = "SELECT q.*,u.full_name as created_by_name FROM quotes q LEFT JOIN users u ON q.created_by=u.id WHERE q.id=? AND q.tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND q.created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt=$this->db->prepare($sql);
        $stmt->execute($p); $q=$stmt->fetch();
        if(!$q) respond(404,null,'Không tìm thấy báo giá hoặc không có quyền',false);
        $items=$this->db->prepare("SELECT qi.*,p.name as product_name FROM quote_items qi LEFT JOIN products p ON qi.product_id=p.id WHERE qi.quote_id=? ORDER BY sort_order");
        $items->execute([$id]);
        $q['items']=$items->fetchAll();
        respond(200,$q);
    }
    public function update(array $auth,int $id): void {
        $b=getBody(); $fields=['title','status','subtotal','discount','tax','total','valid_until','notes','terms'];
        $sets=[];$params=[];
        foreach($fields as $f){if(array_key_exists($f,$b)){$sets[]="$f=?";$params[]=$b[$f];}}
        if($sets){
            $sql = "UPDATE quotes SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?";
            $params[]=$id;$params[]=$auth['tenant_id'];
            if ($auth['role'] === 'sale') {
                $sql .= " AND created_by=?";
                $params[] = $auth['user_id'];
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy hoặc không có quyền', false);
        }
        respond(200,null,'Đã cập nhật báo giá');
    }
    public function destroy(array $auth,int $id): void {
        $sql = "DELETE FROM quotes WHERE id=? AND tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy hoặc không có quyền', false);
        respond(200,null,'Đã xóa báo giá');
    }
}
