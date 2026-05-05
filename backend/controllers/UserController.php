<?php
class UserController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $stmt=$this->db->prepare("SELECT id,email,full_name,role,avatar_url,phone,is_active,last_login_at,created_at FROM users WHERE tenant_id=? ORDER BY full_name");
        $stmt->execute([$auth['tenant_id']]);
        respond(200,$stmt->fetchAll());
    }
    public function store(array $auth): void {
        $b=getBody();
        if(empty($b['email'])||empty($b['password'])||empty($b['full_name'])) respond(422,null,'Email, mật khẩu và tên là bắt buộc',false);
        // Check duplicate
        $chk=$this->db->prepare("SELECT id FROM users WHERE email=? AND tenant_id=?");
        $chk->execute([$b['email'],$auth['tenant_id']]);
        if($chk->fetch()) respond(409,null,'Email đã tồn tại trong hệ thống',false);
        $hash=password_hash($b['password'],PASSWORD_BCRYPT,['cost'=>12]);
        $this->db->prepare("INSERT INTO users (tenant_id,email,password_hash,full_name,role,phone) VALUES (?,?,?,?,?,?)")
            ->execute([$auth['tenant_id'],$b['email'],$hash,$b['full_name'],$b['role']??'sales',$b['phone']??null]);
        $this->show($auth,(int)$this->db->lastInsertId());
    }
    public function show(array $auth,int $id): void {
        $stmt=$this->db->prepare("SELECT id,email,full_name,role,avatar_url,phone,is_active,last_login_at,created_at FROM users WHERE id=? AND tenant_id=?");
        $stmt->execute([$id,$auth['tenant_id']]); $row=$stmt->fetch();
        if(!$row) respond(404,null,'Không tìm thấy người dùng',false);
        respond(200,$row);
    }
    public function update(array $auth,int $id): void {
        $b=getBody(); $fields=['full_name','role','phone','is_active'];
        $sets=[];$params=[];
        foreach($fields as $f){if(array_key_exists($f,$b)){$sets[]="$f=?";$params[]=$b[$f];}}
        if(!empty($b['password'])){$sets[]='password_hash=?';$params[]=password_hash($b['password'],PASSWORD_BCRYPT,['cost'=>12]);}
        if(!$sets) respond(422,null,'Không có dữ liệu',false);
        $params[]=$id;$params[]=$auth['tenant_id'];
        $this->db->prepare("UPDATE users SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->show($auth,$id);
    }
    public function destroy(array $auth,int $id): void {
        if($id===$auth['user_id']) respond(403,null,'Không thể xóa tài khoản của chính mình',false);
        $this->db->prepare("DELETE FROM users WHERE id=? AND tenant_id=?")->execute([$id,$auth['tenant_id']]);
        respond(200,null,'Đã xóa người dùng');
    }
}
