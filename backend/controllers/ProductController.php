<?php
class ProductController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $stmt=$this->db->prepare("SELECT * FROM products WHERE tenant_id=? AND deleted_at IS NULL ORDER BY name ASC");
        $stmt->execute([$auth['tenant_id']]);
        respond(200,$stmt->fetchAll());
    }
    public function store(array $auth): void {
        $b=getBody();
        if(empty($b['name'])) respond(422,null,'Tên sản phẩm là bắt buộc',false);
        $this->db->prepare("INSERT INTO products (tenant_id,name,sku,category,description,price,currency,unit,stock) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([$auth['tenant_id'],$b['name'],$b['sku']??null,$b['category']??null,$b['description']??null,$b['price']??0,$b['currency']??'VND',$b['unit']??'cái',$b['stock']??0]);
        $this->show($auth,(int)$this->db->lastInsertId());
    }
    public function show(array $auth,int $id): void {
        $stmt=$this->db->prepare("SELECT * FROM products WHERE id=? AND tenant_id=? AND deleted_at IS NULL");
        $stmt->execute([$id,$auth['tenant_id']]);
        $row=$stmt->fetch(); if(!$row) respond(404,null,'Không tìm thấy',false);
        respond(200,$row);
    }
    public function update(array $auth,int $id): void {
        $b=getBody(); $fields=['name','sku','category','description','price','currency','unit','stock','is_active'];
        $sets=[];$params=[];
        foreach($fields as $f){if(array_key_exists($f,$b)){$sets[]="$f=?";$params[]=$b[$f];}}
        if(!$sets) respond(422,null,'Không có dữ liệu',false);
        $params[]=$id;$params[]=$auth['tenant_id'];
        $this->db->prepare("UPDATE products SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->show($auth,$id);
    }
    public function destroy(array $auth,int $id): void {
        $this->db->prepare("UPDATE products SET deleted_at=NOW() WHERE id=? AND tenant_id=?")->execute([$id,$auth['tenant_id']]);
        respond(200,null,'Đã xóa sản phẩm (vào thùng rác)');
    }

    public function bulkDelete(array $auth): void {
        $b = getBody();
        $ids = $b['ids'] ?? [];
        if (empty($ids)) respond(400, null, 'ID không hợp lệ', false);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->prepare("UPDATE products SET deleted_at=NOW() WHERE tenant_id=? AND id IN ($placeholders)")
            ->execute(array_merge([$auth['tenant_id']], $ids));
        respond(200, null, "Đã xóa " . count($ids) . " sản phẩm");
    }
}
