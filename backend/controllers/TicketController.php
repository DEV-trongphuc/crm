<?php
// f:\CRM\backend\controllers\TicketController.php

class TicketController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid = $auth['tenant_id'];
        $status = $_GET['status'] ?? '';
        
        $where = ['t.tenant_id=?'];
        $params = [$tid];
        
        if ($auth['role'] === 'sale') {
            $where[] = '(t.created_by = ? OR t.assignee_id = ?)';
            $params[] = $auth['user_id'];
            $params[] = $auth['user_id'];
        }

        if ($status && $status !== 'all') {
            $where[] = 't.status=?';
            $params[] = $status;
        }

        $w = implode(' AND ', $where);
        $stmt = $this->db->prepare("
            SELECT t.*, u.full_name as assignee_name
            FROM tickets t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE $w ORDER BY t.created_at DESC LIMIT 200
        ");
        $stmt->execute($params);
        $tickets = $stmt->fetchAll();
        
        respond(200, ['items' => $tickets]);
    }

    public function show(array $auth, int $id): void {
        $stmt = $this->db->prepare("
            SELECT t.*, u.full_name as assignee_name
            FROM tickets t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.id=? AND t.tenant_id=?
        ");
        $stmt->execute([$id, $auth['tenant_id']]);
        $ticket = $stmt->fetch();
        if (!$ticket) respond(404, null, 'Không tìm thấy ticket', false);
        respond(200, $ticket);
    }

    public function store(array $auth): void {
        $data = getBody();
        if (empty($data['subject']) || empty($data['customer_name'])) {
            respond(400, null, 'Thiếu tiêu đề hoặc tên khách hàng', false);
        }

        $stmt = $this->db->prepare("
            INSERT INTO tickets (tenant_id, created_by, assignee_id, subject, customer_name, description, status, priority, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $auth['tenant_id'],
            $auth['user_id'],
            $data['assignee_id'] ?? $auth['user_id'], // assign to self by default
            $data['subject'],
            $data['customer_name'],
            $data['description'] ?? null,
            $data['status'] ?? 'open',
            $data['priority'] ?? 'medium',
            $data['due_date'] ?? date('Y-m-d H:i:s', strtotime('+1 day'))
        ]);
        $id = $this->db->lastInsertId();
        $this->show($auth, (int)$id);
    }

    public function update(array $auth, int $id): void {
        $data = getBody();
        $fields = ['subject', 'customer_name', 'description', 'status', 'priority', 'due_date', 'assignee_id'];
        $sets = []; 
        $params = [];
        
        foreach ($fields as $f) { 
            if (array_key_exists($f, $data)) { 
                $sets[] = "$f=?"; 
                $params[] = $data[$f]; 
            } 
        }
        
        if (isset($data['status']) && $data['status'] === 'resolved') {
            $sets[] = "resolved_at=NOW()";
        }

        if (!$sets) respond(422, null, 'Không có dữ liệu cập nhật', false);
        
        $params[] = $id; 
        $params[] = $auth['tenant_id'];
        
        $stmt = $this->db->prepare("UPDATE tickets SET " . implode(',', $sets) . " WHERE id=? AND tenant_id=?");
        $stmt->execute($params);
        
        $this->show($auth, $id);
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM tickets WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy ticket', false);
        respond(200, null, 'Đã xóa ticket thành công');
    }
}
