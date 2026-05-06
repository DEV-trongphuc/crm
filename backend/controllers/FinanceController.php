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
        if ($auth['role'] === 'sale') {
            $where[] = 'i.created_by = ?';
            $params[] = $auth['user_id'];
        }
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
        $sql = "
            SELECT i.*, CONCAT(ct.first_name,' ',ct.last_name) as contact_name, c.name as company_name
            FROM invoices i
            LEFT JOIN contacts ct ON i.contact_id = ct.id
            LEFT JOIN companies c ON i.company_id = c.id
            WHERE i.id=? AND i.tenant_id=?
        ";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND i.created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
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

        // Auto-generate invoice number (Race condition safe)
        if (empty($data['invoice_number'])) {
            $data['invoice_number'] = 'INV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        }

        $this->db->beginTransaction();
        try {
            // Verify entities belong to tenant
            if (!empty($data['contact_id'])) {
                $c = $this->db->prepare("SELECT id FROM contacts WHERE id=? AND tenant_id=?");
                $c->execute([(int)$data['contact_id'], $tid]);
                if (!$c->fetch()) $data['contact_id'] = null;
            }
            if (!empty($data['company_id'])) {
                $c = $this->db->prepare("SELECT id FROM companies WHERE id=? AND tenant_id=?");
                $c->execute([(int)$data['company_id'], $tid]);
                if (!$c->fetch()) $data['company_id'] = null;
            }

            $stmt = $this->db->prepare("
                INSERT INTO invoices (tenant_id,deal_id,company_id,contact_id,created_by,invoice_number,title,status,issue_date,due_date,subtotal,discount,tax,total,notes,shipping_customer_pay,shipping_fee)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $stmt->execute([
                $tid, $data['deal_id']??null, $data['company_id']??null, $data['contact_id']??null, $uid,
                $data['invoice_number'], $data['title'], $data['status']??'pending',
                $data['issue_date']??date('Y-m-d'), $data['due_date']??date('Y-m-d', strtotime('+30 days')),
                $data['subtotal']??0, $data['discount']??0, $data['tax']??0, $data['total']??0, $data['notes']??null,
                $data['shipping_customer_pay']??1, $data['shipping_fee']??0
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
        $fields = ['title','status','issue_date','due_date','subtotal','discount','tax','total','notes','contact_id','company_id','deal_id','shipping_customer_pay','shipping_fee'];
        $sets = []; $params = [];
        foreach ($fields as $f) { if (array_key_exists($f, $data)) { $sets[] = "$f=?"; $params[] = $data[$f]; } }
        if (!$sets) respond(422, null, 'Không có dữ liệu', false);
        // Check permission first
        $check = $this->db->prepare("SELECT id FROM invoices WHERE id=? AND tenant_id=? " . ($auth['role'] === 'sale' ? " AND created_by=?" : ""));
        $cp = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') $cp[] = $auth['user_id'];
        $check->execute($cp);
        if (!$check->fetch()) respond(404, null, 'Không tìm thấy hoặc không có quyền', false);

        $params[] = $id; $params[] = $auth['tenant_id'];
        $stmt = $this->db->prepare("UPDATE invoices SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?");
        $stmt->execute($params);
        $this->showInvoice($auth, $id);
    }

    public function deleteInvoice(array $auth, int $id): void {
        $sql = "DELETE FROM invoices WHERE id=? AND tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy hóa đơn hoặc không có quyền', false);
        respond(200, null, 'Đã xóa hóa đơn');
    }

    public function markPaid(array $auth, int $id): void {
        try {
            $this->db->beginTransaction();
            
            $sql = "UPDATE invoices SET status='paid', paid_at=NOW() WHERE id=? AND tenant_id=?";
            $p = [$id, $auth['tenant_id']];
            if ($auth['role'] === 'sale') {
                $sql .= " AND created_by=?";
                $p[] = $auth['user_id'];
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($p);
            
            if ($stmt->rowCount()) {
                // Deduct stock for items in this invoice
                $items = $this->db->prepare("
                    SELECT ii.product_id, ii.quantity, p.track_inventory 
                    FROM invoice_items ii 
                    JOIN products p ON ii.product_id = p.id 
                    WHERE ii.invoice_id = ?
                ");
                $items->execute([$id]);
                while ($item = $items->fetch()) {
                    if ($item['track_inventory'] && !empty($item['product_id'])) {
                        $this->db->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id=? AND tenant_id=?")
                             ->execute([$item['quantity'], $item['product_id'], $auth['tenant_id']]);
                    }
                }
                
                // Update contact's last_contact
                $invData = $this->db->prepare("SELECT contact_id FROM invoices WHERE id=?");
                $invData->execute([$id]);
                $cId = $invData->fetchColumn();
                if ($cId) {
                    $this->db->prepare("UPDATE contacts SET last_contact = CURRENT_DATE WHERE id = ? AND tenant_id = ?")
                         ->execute([(int)$cId, $auth['tenant_id']]);
                }
                
                $this->db->commit();
                respond(200, null, 'Hóa đơn đã được thanh toán và tồn kho đã được cập nhật');
            } else {
                $this->db->rollBack();
                respond(404, null, 'Không tìm thấy hoặc không có quyền', false);
            }
        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            respond(500, null, 'Lỗi hệ thống: ' . $e->getMessage(), false);
        }
    }

    // ─────────────────────── EXPENSES ───────────────────────────

    public function listExpenses(array $auth): void {
        $tid    = $auth['tenant_id'];
        $status = $_GET['status'] ?? '';
        $from   = $_GET['from'] ?? '';
        $to     = $_GET['to'] ?? '';
        $where  = ['e.tenant_id=?']; $params = [$tid];
        if ($auth['role'] === 'sale') {
            $where[] = 'e.created_by = ?';
            $params[] = $auth['user_id'];
        }
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

        // Fetch entities for all these rows
        if (!empty($rows)) {
            $ids = array_column($rows, 'id');
            $in = str_repeat('?,', count($ids) - 1) . '?';
            $sEE = $this->db->prepare("SELECT ee.*, c.first_name, c.last_name FROM expense_entities ee LEFT JOIN contacts c ON ee.entity_type='contact' AND ee.entity_id=c.id WHERE ee.expense_id IN ($in)");
            $sEE->execute($ids);
            $allEntities = $sEE->fetchAll();

            $entitiesByExp = [];
            foreach ($allEntities as $ee) {
                $ee['name'] = trim(($ee['first_name'] ?? '') . ' ' . ($ee['last_name'] ?? ''));
                $entitiesByExp[$ee['expense_id']][] = $ee;
            }

            foreach ($rows as &$r) {
                $r['entities'] = $entitiesByExp[$r['id']] ?? [];
            }
        }

        // Summary totals
        $sTotal = $this->db->prepare("SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(CASE WHEN status='approved' THEN amount END),0) as approved FROM expenses WHERE tenant_id=?");
        $sTotal->execute([$tid]);
        $summary = $sTotal->fetch();

        respond(200, ['items' => $rows, 'summary' => $summary]);
    }

    public function showExpense(array $auth, int $id): void {
        $sql = "SELECT e.*, u.full_name as creator_name FROM expenses e LEFT JOIN users u ON e.created_by=u.id WHERE e.id=? AND e.tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND e.created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        $row = $stmt->fetch();
        if (!$row) respond(404, null, 'Không tìm thấy chi phí', false);
        
        // Fetch linked entities
        $sEE = $this->db->prepare("SELECT * FROM expense_entities WHERE expense_id=?");
        $sEE->execute([$id]);
        $row['entities'] = $sEE->fetchAll();
        
        respond(200, $row);
    }

    public function createExpense(array $auth): void {
        $data = getBody();
        if (empty($data['title']) || empty($data['amount'])) respond(400, null, 'Thiếu tiêu đề hoặc số tiền', false);

        $totalAmount = (float)$data['amount'];
        $entities = $data['entities'] ?? [];
        
        // Validate split amounts
        if (!empty($entities)) {
            $splitSum = array_reduce($entities, fn($s, $e) => $s + (float)($e['amount'] ?? 0), 0);
            if ($splitSum > $totalAmount) {
                respond(422, null, 'Tổng số tiền phân bổ không được lớn hơn tổng số tiền chi phí', false);
            }
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO expenses (tenant_id,created_by,title,category,amount,date,status,notes,
                    vendor_name,has_vat_invoice,is_vat_inclusive)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ");
            $stmt->execute([
                $auth['tenant_id'], $auth['user_id'],
                $data['title'], $data['category']??'Khác',
                $totalAmount, $data['date']??date('Y-m-d'),
                $data['status']??'pending', $data['notes']??null,
                $data['vendor_name']??null,
                $data['has_vat_invoice']??0,
                $data['is_vat_inclusive']??0
            ]);
            $expId = (int)$this->db->lastInsertId();

            if (!empty($entities)) {
                $sEE = $this->db->prepare("INSERT INTO expense_entities (tenant_id, expense_id, entity_type, entity_id, amount) VALUES (?,?,?,?,?)");
                foreach ($entities as $ee) {
                    // Verify entity exists in this tenant
                    $table = $ee['entity_type'] === 'contact' ? 'contacts' : ($ee['entity_type'] === 'company' ? 'companies' : 'deals');
                    $check = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
                    $check->execute([(int)$ee['entity_id'], $auth['tenant_id']]);
                    if (!$check->fetch()) continue; // Skip unauthorized/missing entities

                    $sEE->execute([$auth['tenant_id'], $expId, $ee['entity_type'], (int)$ee['entity_id'], (float)($ee['amount'] ?? 0)]);
                }
            }

            $this->db->commit();
            $this->showExpense($auth, $expId);
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }

    public function updateExpense(array $auth, int $id): void {
        $data = getBody();
        $fields = ['title','category','amount','date','status','notes',
                   'vendor_name','has_vat_invoice','is_vat_inclusive'];
        $sets = []; $params = [];
        foreach ($fields as $f) { if (array_key_exists($f, $data)) { $sets[] = "$f=?"; $params[] = $data[$f]; } }
        
        $this->db->beginTransaction();
        try {
            // Check permission and get current amount if not provided
            $check = $this->db->prepare("SELECT id, amount FROM expenses WHERE id=? AND tenant_id=? " . ($auth['role'] === 'sale' ? " AND created_by=?" : ""));
            $cp = [$id, $auth['tenant_id']];
            if ($auth['role'] === 'sale') $cp[] = $auth['user_id'];
            $check->execute($cp);
            $row = $check->fetch();
            if (!$row) respond(404, null, 'Không tìm thấy hoặc không có quyền', false);

            $currentTotal = (float)($data['amount'] ?? $row['amount']);

            if ($sets) {
                $params[] = $id; $params[] = $auth['tenant_id'];
                $stmt = $this->db->prepare("UPDATE expenses SET ".implode(',',$sets)." WHERE id=? AND tenant_id=?");
                $stmt->execute($params);
            }

            if (isset($data['entities']) && is_array($data['entities'])) {
                $entities = $data['entities'];
                $splitSum = array_reduce($entities, fn($s, $e) => $s + (float)($e['amount'] ?? 0), 0);
                if ($splitSum > $currentTotal) {
                    throw new Exception('Tổng số tiền phân bổ không được lớn hơn tổng số tiền chi phí');
                }

                $this->db->prepare("DELETE FROM expense_entities WHERE expense_id=?")->execute([$id]);
                $sEE = $this->db->prepare("INSERT INTO expense_entities (tenant_id, expense_id, entity_type, entity_id, amount) VALUES (?,?,?,?,?)");
                foreach ($entities as $ee) {
                    // Verify entity exists in this tenant
                    $table = $ee['entity_type'] === 'contact' ? 'contacts' : ($ee['entity_type'] === 'company' ? 'companies' : 'deals');
                    $eCheck = $this->db->prepare("SELECT id FROM $table WHERE id=? AND tenant_id=?");
                    $eCheck->execute([(int)$ee['entity_id'], $auth['tenant_id']]);
                    if (!$eCheck->fetch()) continue;

                    $sEE->execute([$auth['tenant_id'], $id, $ee['entity_type'], (int)$ee['entity_id'], (float)($ee['amount'] ?? 0)]);
                }
            }

            $this->db->commit();
            $this->showExpense($auth, $id);
        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            respond(422, null, $e->getMessage(), false);
        }
    }

    public function listEntityExpenses(array $auth, string $type, int $id): void {
        $where = "ee.entity_type=? AND ee.entity_id=? AND e.tenant_id=?";
        $p = [$type, $id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $where .= " AND e.created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare("
            SELECT e.*, ee.amount as split_amount, u.full_name as creator_name
            FROM expenses e
            JOIN expense_entities ee ON e.id = ee.expense_id
            LEFT JOIN users u ON e.created_by = u.id
            WHERE $where
            ORDER BY e.date DESC
        ");
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function deleteExpense(array $auth, int $id): void {
        $sql = "DELETE FROM expenses WHERE id=? AND tenant_id=?";
        $p = [$id, $auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $sql .= " AND created_by=?";
            $p[] = $auth['user_id'];
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        if (!$stmt->rowCount()) respond(404, null, 'Không tìm thấy chi phí hoặc không có quyền', false);
        respond(200, null, 'Đã xóa chi phí');
    }

    public function approveExpense(array $auth, int $id): void {
        requireRole($auth, ['admin', 'manager']);
        $data = getBody();
        $status = $data['status'] ?? 'approved';
        if ($status === 'approved') {
            $this->db->prepare("UPDATE expenses SET status=?, approver_id=?, approved_at=NOW() WHERE id=? AND tenant_id=?")
                ->execute([$status, $auth['user_id'], $id, $auth['tenant_id']]);
        } else {
            $this->db->prepare("UPDATE expenses SET status=?, approver_id=NULL, approved_at=NULL WHERE id=? AND tenant_id=?")
                ->execute([$status, $id, $auth['tenant_id']]);
        }
        respond(200, null, 'Đã cập nhật trạng thái');
    }

    public function summary(array $auth): void {
        requireRole($auth, ['admin', 'manager']);
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
