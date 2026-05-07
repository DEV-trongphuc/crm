<?php
// f:\CRM\backend\controllers\TicketController.php

class TicketController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function index(array $auth): void {
        $tid    = $auth['tenant_id'];
        $page   = max(1, (int)($_GET['page']   ?? 1));
        $limit  = min(100, max(10, (int)($_GET['limit']  ?? 20)));
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? '';
        $search = $_GET['search'] ?? '';
        
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

        if ($search) {
            $where[] = '(t.subject LIKE ? OR t.customer_name LIKE ? OR t.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $w = implode(' AND ', $where);

        $cnt = $this->db->prepare("SELECT COUNT(*) FROM tickets t WHERE $w");
        $cnt->execute($params);
        $total = (int)$cnt->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT t.*, u.full_name as assignee_name
            FROM tickets t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE $w 
            ORDER BY t.created_at DESC 
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $tickets = $stmt->fetchAll();
        foreach ($tickets as &$t) {
            $t['related_contacts'] = json_decode($t['related_contacts'] ?? '[]');
            $t['related_users'] = json_decode($t['related_users'] ?? '[]');
        }
        
        respond(200, [
            'items' => $tickets,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ]);
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
        $ticket['related_contacts'] = json_decode($ticket['related_contacts'] ?? '[]');
        $ticket['related_users'] = json_decode($ticket['related_users'] ?? '[]');
        respond(200, $ticket);
    }

    public function store(array $auth): void {
        $data = getBody();
        if (empty($data['subject']) || empty($data['customer_name'])) {
            respond(400, null, 'Thiếu tiêu đề hoặc tên khách hàng', false);
        }

        $stmt = $this->db->prepare("
            INSERT INTO tickets (tenant_id, created_by, assignee_id, subject, customer_name, description, status, priority, due_date, related_contacts, related_users)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            $data['due_date'] ?? date('Y-m-d H:i:s', strtotime('+1 day')),
            isset($data['related_contacts']) ? json_encode($data['related_contacts']) : null,
            isset($data['related_users']) ? json_encode($data['related_users']) : null
        ]);
        $id = $this->db->lastInsertId();

        // Log interaction for related contacts
        if (!empty($data['related_contacts']) && is_array($data['related_contacts'])) {
            foreach ($data['related_contacts'] as $cId) {
                logInteraction($this->db, $auth['tenant_id'], $auth['user_id'], 'task', "Tạo Ticket mới: {$data['subject']}", "Ticket #$id đã được khởi tạo cho khách hàng.", 'contact', (int)$cId);
            }
        }

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
        if (isset($data['related_contacts'])) { $sets[] = 'related_contacts=?'; $params[] = json_encode($data['related_contacts']); }
        if (isset($data['related_users'])) { $sets[] = 'related_users=?'; $params[] = json_encode($data['related_users']); }
        
        if (isset($data['status']) && $data['status'] === 'resolved') {
            $sets[] = "resolved_at=NOW()";
        }

        if (!$sets) respond(422, null, 'Không có dữ liệu cập nhật', false);
        
        $params[] = $id; 
        $params[] = $auth['tenant_id'];
        
        $stmt = $this->db->prepare("UPDATE tickets SET " . implode(',', $sets) . " WHERE id=? AND tenant_id=?");
        $stmt->execute($params);

        // Log if resolved
        if (isset($data['status']) && $data['status'] === 'resolved') {
            $tick = $this->db->prepare("SELECT subject, related_contacts FROM tickets WHERE id=?");
            $tick->execute([$id]);
            $tData = $tick->fetch();
            if ($tData && !empty($tData['related_contacts'])) {
                $cIds = json_decode($tData['related_contacts'], true);
                if (is_array($cIds)) {
                    foreach ($cIds as $cId) {
                        logInteraction($this->db, $auth['tenant_id'], $auth['user_id'], 'task', "Hoàn thành Ticket #$id", "Vấn đề \"{$tData['subject']}\" đã được xử lý xong.", 'contact', (int)$cId);
                    }
                }
            }
        }
        
        $this->show($auth, $id);
    }

    public function destroy(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM tickets WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy ticket', false);
        respond(200, null, 'Đã xóa ticket thành công');
    }

    public function getComments(array $auth, int $ticketId): void {
        $stmt = $this->db->prepare("
            SELECT tc.*, u.full_name as user_name, u.avatar_url
            FROM ticket_comments tc
            LEFT JOIN users u ON tc.user_id = u.id
            JOIN tickets t ON tc.ticket_id = t.id
            WHERE tc.ticket_id = ? AND t.tenant_id = ?
            ORDER BY tc.created_at ASC
        ");
        $stmt->execute([$ticketId, $auth['tenant_id']]);
        respond(200, $stmt->fetchAll());
    }

    public function addComment(array $auth, int $ticketId): void {
        $data = getBody();
        if (empty($data['body'])) respond(400, null, 'Nội dung ghi chú không được để trống', false);

        $check = $this->db->prepare("SELECT id FROM tickets WHERE id=? AND tenant_id=?");
        $check->execute([$ticketId, $auth['tenant_id']]);
        if (!$check->fetch()) respond(404, null, 'Không tìm thấy ticket', false);

        $stmt = $this->db->prepare("INSERT INTO ticket_comments (ticket_id, user_id, body) VALUES (?, ?, ?)");
        $stmt->execute([$ticketId, $auth['user_id'], $data['body']]);
        
        $this->getComments($auth, $ticketId);
    }
}
