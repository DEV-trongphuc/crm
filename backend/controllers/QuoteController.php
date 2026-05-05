<?php
class QuoteController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $stmt=$this->db->prepare("SELECT q.*,u.full_name as created_by_name,CONCAT(c.first_name,' ',c.last_name) as contact_name FROM quotes q LEFT JOIN users u ON q.created_by=u.id LEFT JOIN contacts c ON q.contact_id=c.id WHERE q.tenant_id=? ORDER BY q.created_at DESC");
        $stmt->execute([$auth['tenant_id']]);
        respond(200,$stmt->fetchAll());
    }
    public function store(array $auth): void {
        $b=getBody(); if(empty($b['title'])) respond(422,null,'Tiêu đề là bắt buộc',false);
        // Generate quote number
        $cnt=$this->db->prepare("SELECT COUNT(*)+1 FROM quotes WHERE tenant_id=?");
        $cnt->execute([$auth['tenant_id']]); $num=(int)$cnt->fetchColumn();
        $qNum='QT-'.str_pad($num,5,'0',STR_PAD_LEFT);
        $this->db->prepare("INSERT INTO quotes (tenant_id,deal_id,contact_id,created_by,quote_number,title,status,subtotal,discount,tax,total,valid_until,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
            ->execute([$auth['tenant_id'],$b['deal_id']??null,$b['contact_id']??null,$auth['user_id'],$qNum,$b['title'],$b['status']??'draft',$b['subtotal']??0,$b['discount']??0,$b['tax']??0,$b['total']??0,$b['valid_until']??null,$b['notes']??null]);
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
        $stmt=$this->db->prepare("SELECT q.*,u.full_name as created_by_name FROM quotes q LEFT JOIN users u ON q.created_by=u.id WHERE q.id=? AND q.tenant_id=?");
        $stmt->execute([$id,$auth['tenant_id']]); $q=$stmt->fetch();
        if(!$q) respond(404,null,'Không tìm thấy báo giá',false);
        $items=$this->db->prepare("SELECT qi.*,p.name as product_name FROM quote_items qi LEFT JOIN products p ON qi.product_id=p.id WHERE qi.quote_id=? ORDER BY sort_order");
        $items->execute([$id]);
        $q['items']=$items->fetchAll();
        respond(200,$q);
    }
    public function update(array $auth,int $id): void {
        $b=getBody(); $fields=['title','status','subtotal','discount','tax','total','valid_until','notes','terms'];
        $sets=[];$params=[];
        foreach($fields as $f){if(array_key_exists($f,$b)){$sets[]="$f=?";$params[]=$b[$f];}}
        if($sets){$params[]=$id;$params[]=$auth['tenant_id'];$this->db->prepare("UPDATE quotes SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);}
        respond(200,null,'Đã cập nhật báo giá');
    }
    public function destroy(array $auth,int $id): void {
        $this->db->prepare("DELETE FROM quotes WHERE id=? AND tenant_id=?")->execute([$id,$auth['tenant_id']]);
        respond(200,null,'Đã xóa báo giá');
    }
}
