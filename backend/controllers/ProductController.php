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
        
        $sql = "INSERT INTO products (tenant_id, created_by, category_id, name, sku, category, description, price, cost, unit, stock_quantity, track_inventory, track_cost, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $auth['tenant_id'],
            $auth['user_id'],
            !empty($b['category_id']) ? (int)(is_string($b['category_id']) && str_starts_with($b['category_id'], 'c') ? substr($b['category_id'], 1) : $b['category_id']) : null,
            $b['name'],
            $b['sku'] ?? null,
            $b['category'] ?? null,
            $b['description'] ?? null,
            (float)($b['price'] ?? 0),
            (float)($b['cost'] ?? 0),
            $b['unit'] ?? 'cái',
            (int)($b['stock_quantity'] ?? 0),
            isset($b['track_inventory']) ? ($b['track_inventory'] ? 1 : 0) : 1,
            isset($b['track_cost']) ? ($b['track_cost'] ? 1 : 0) : 1,
            isset($b['is_active']) ? ($b['is_active'] ? 1 : 0) : 1
        ];

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $id = (int)$this->db->lastInsertId();
            $this->show($auth, $id);
        } catch (PDOException $e) {
            respond(500, null, 'Lỗi cơ sở dữ liệu: ' . $e->getMessage(), false);
        }
    }
    public function show(array $auth,int $id): void {
        $stmt=$this->db->prepare("SELECT * FROM products WHERE id=? AND tenant_id=? AND deleted_at IS NULL");
        $stmt->execute([$id,$auth['tenant_id']]);
        $row=$stmt->fetch(); if(!$row) respond(404,null,'Không tìm thấy',false);
        respond(200,$row);
    }
    public function update(array $auth,int $id): void {
        $b=getBody(); $fields=['name','sku','category','category_id','description','price','cost','unit','stock_quantity','track_inventory','track_cost','is_active'];
        $sets=[];$params=[];
        foreach($fields as $f){
            if(array_key_exists($f,$b)){
                $sets[]="$f=?";
                $val = $b[$f];
                if($f === 'category_id' && is_string($val) && str_starts_with($val, 'c')) {
                    $val = (int)substr($val, 1);
                }
                if(($f === 'category_id' || $f === 'stock_quantity' || $f === 'is_active') && $val === '') $val = null;
                if($f === 'track_inventory' || $f === 'track_cost' || $f === 'is_active') $val = $val ? 1 : 0;
                $params[]=$val;
            }
        }
        if(!$sets) respond(422,null,'Không có dữ liệu',false);
        $params[]=$id;$params[]=$auth['tenant_id'];
        try {
            $this->db->prepare("UPDATE products SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
            $this->show($auth,$id);
        } catch (PDOException $e) {
            respond(500, null, 'Lỗi cập nhật sản phẩm: ' . $e->getMessage(), false);
        }
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
