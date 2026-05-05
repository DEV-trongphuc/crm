<?php
// f:\CRM\backend\controllers\FinanceController.php

class FinanceController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    // ─────────────────────── INVOICES ───────────────────────────

    public function listInvoices(array $auth): void {
        $tid    = $auth['tenant_id'];
        $status = $_GET['status'] ?? '';
        $search = $_GET['search'] ?? '';
        $where  = ['i.tenant_id=?']; $params = [$tid];
        if ($status) { $where[] = 'i.status=?'; $params[] = $status; }
        if ($search) { $where[] = '(i.invoice_number LIKE ? OR ct.first_name LIKE ? OR ct.last_name LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }
        $w = implode(' AND ', $where);

        $stmt = $this->db->prepare("
            SELECT i.*, c.name as company_name,
                   CONCAT(ct.first_name,' ',ct.last_name) as contact_name,
                   u.full_name as creator_name
            FROM invoices i
            LEFT JOIN companies c  ON i.company_id  = c.id
            LEFT JOIN contacts ct  ON i.contact_id  = ct.id
            LEFT JOIN users u      ON i.created_by  = u.id
            WHERE $w ORDER BY i.issue_date DESC LIMIT 100
        ");
        $stmt->execute($params);
        respond(200, $stmt->fetchAll());
    }

    public function showInvoice(array $auth, int $id): void {
        $stmt = $this->db->prepare("
            SELECT i.*, CONCAT(ct.first_name,' ',ct.last_name) as contact_name, c.name as company_name
            FROM invoices i
            LEFT JOIN contacts ct ON i.contact_id = ct.id
            LEFT JOIN companies c ON i.company_id = c.id
            WHERE i.id=? AND i.tenant_id=?
        ");
        $stmt->execute([$id, $auth['tenant_id']]);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy hóa đơn', false);

        // Load items
        $sItems = $this->db->prepare("SELECT ii.*, p.name as product_name FROM invoice_items ii LEFT JOIN products p ON ii.product_id=p.id WHERE ii.invoice_id=?");
        $sItems->execute([$id]);
        $row['items'] = $sItems->fetchAll();
        respond(200, $row);
    }

    public function createInvoice(array $auth): void {
        $tid  = $auth['tenant_id'];
        $uid  = $auth['user_id'];
        $data = getBody();

        if (empty($data['title'])) respond(400, null, 'Tiêu đề hóa đơn là bắt buộc', false);

        // Auto-generate invoice number
        if (empty($data['invoice_number'])) {
            $cnt = $this->db->prepare("SELECT COUNT(*)+1 FROM invoices WHERE tenant_id=? AND YEAR(created_at)=YEAR(NOW())");
            $cnt->execute([$tid]);
            $data['invoice_number'] = 'INV-' . date('Y') . '-' . str_pad((int)$cnt->fetchColumn(), 3, '0', STR_PAD_LEFT);
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO invoices (tenant_id,deal_id,company_id,contact_id,created_by,invoice_number,title,status,issue_date,due_date,subtotal,discount,tax,total,notes)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $stmt->execute([
                $tid, $data['deal_id']??null, $data['company_id']??null, $data['contact_id']??null, $uid,
                $data['invoice_number'], $data['title'], $data['status']??'pending',
                $data['issue_date']??date('Y-m-d'), $data['due_date']??date('Y-m-d', strtotime('+30 days')),
                $data['subtotal']??0, $data['discount']??0, $data['tax']??0, $data['total']??0, $data['notes']??null
            ]);
            $invId = $this->db->lastInsertId();

            if (!empty($data['items']) && is_array($data['items'])) {
                $sItem = $this->db->prepare("INSERT INTO invoice_items (invoice_id,product_id,name,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)");
                foreach ($data['items'] as $item) {
                    $sItem->execute([$invId, $item['product_id']??null, $item['name'], $item['quantity']??1, $item['unit_price']??0, $item['subtotal']??0]);
                }
            }
            $this->db->commit();
            $this->showInvoice($auth, $invId);
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }

    public function updateInvoice(array $auth, int $id): void {
        $data = getBody();
        $fields = ['title','status','issue_date','due_date','subtotal','discount','tax','total','notes','contact_id','company_id','deal_id'];
        $sets = []; $params = [];
        foreach ($fields as $f) { if (array_key_exists($f, $data)) { $sets[] = "$f=?"; $params[] = $data[$f]; } }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        $params[] = $id; $params[] = $auth['tenant_id'];
        $this->db->prepare("UPDATE invoices SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->showInvoice($auth, $id);
    }

    public function deleteInvoice(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM invoices WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy hóa đơn', false);
        respond(200, null, 'Đã xóa hóa đơn');
    }

    public function markPaid(array $auth, int $id): void {
        $this->db->prepare("UPDATE invoices SET status='paid', paid_at=NOW() WHERE id=? AND tenant_id=?")
            ->execute([$id, $auth['tenant_id']]);
        respond(200, null, 'Đã đánh dấu đã thanh toán');
    }

    // ─────────────────────── EXPENSES ───────────────────────────

    public function listExpenses(array $auth): void {
        $tid    = $auth['tenant_id'];
        $status = $_GET['status'] ?? '';
        $from   = $_GET['from'] ?? '';
        $to     = $_GET['to'] ?? '';
        $where  = ['e.tenant_id=?']; $params = [$tid];
        if ($status) { $where[] = 'e.status=?'; $params[] = $status; }
        if ($from)   { $where[] = 'e.date >= ?'; $params[] = $from; }
        if ($to)     { $where[] = 'e.date <= ?'; $params[] = $to; }
        $w = implode(' AND ', $where);

        $stmt = $this->db->prepare("
            SELECT e.*, u.full_name as creator_name
            FROM expenses e LEFT JOIN users u ON e.created_by = u.id
            WHERE $w ORDER BY e.date DESC LIMIT 200
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Summary totals
        $sTotal = $this->db->prepare("SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(CASE WHEN status='approved' THEN amount END),0) as approved FROM expenses WHERE tenant_id=?");
        $sTotal->execute([$tid]);
        $summary = $sTotal->fetch();

        respond(200, ['items' => $rows, 'summary' => $summary]);
    }

    public function showExpense(array $auth, int $id): void {
        $stmt = $this->db->prepare("SELECT e.*, u.full_name as creator_name FROM expenses e LEFT JOIN users u ON e.created_by=u.id WHERE e.id=? AND e.tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy chi phí', false);
        respond(200, $row);
    }

    public function createExpense(array $auth): void {
        $data = getBody();
        if (empty($data['title']) || empty($data['amount'])) respond(400, null, 'Thiếu tiêu đề hoặc số tiền', false);

        $stmt = $this->db->prepare("INSERT INTO expenses (tenant_id,created_by,title,category,amount,date,status,notes) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $auth['tenant_id'], $auth['user_id'],
            $data['title'], $data['category']??'Khác',
            $data['amount'], $data['date']??date('Y-m-d'),
            $data['status']??'pending', $data['notes']??null
        ]);
        $this->showExpense($auth, (int)$this->db->lastInsertId());
    }

    public function updateExpense(array $auth, int $id): void {
        $data = getBody();
        $fields = ['title','category','amount','date','status','notes'];
        $sets = []; $params = [];
        foreach ($fields as $f) { if (array_key_exists($f, $data)) { $sets[] = "$f=?"; $params[] = $data[$f]; } }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        $params[] = $id; $params[] = $auth['tenant_id'];
        $this->db->prepare("UPDATE expenses SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?")->execute($params);
        $this->showExpense($auth, $id);
    }

    public function deleteExpense(array $auth, int $id): void {
        $stmt = $this->db->prepare("DELETE FROM expenses WHERE id=? AND tenant_id=?");
        $stmt->execute([$id, $auth['tenant_id']]);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy chi phí', false);
        respond(200, null, 'Đã xóa chi phí');
    }

    public function approveExpense(array $auth, int $id): void {
        $data = getBody();
        $status = $data['status'] ?? 'approved';
        $this->db->prepare("UPDATE expenses SET status=? WHERE id=? AND tenant_id=?")->execute([$status, $id, $auth['tenant_id']]);
        respond(200, null, 'Đã cập nhật trạng thái');
    }

    public function summary(array $auth): void {
        $tid = $auth['tenant_id'];
        $sInv = $this->db->prepare("
            SELECT COALESCE(SUM(total),0) as total_revenue,
                   COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as total_paid,
                   COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count
            FROM invoices WHERE tenant_id=?
        ");
        $sInv->execute([$tid]);
        $inv = $sInv->fetch();

        $sExp = $this->db->prepare("
            SELECT COALESCE(SUM(amount),0) as total_expenses,
                   COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END),0) as approved_expenses
            FROM expenses WHERE tenant_id=?
        ");
        $sExp->execute([$tid]);
        $exp = $sExp->fetch();

        respond(200, array_merge($inv, $exp));
    }
}
