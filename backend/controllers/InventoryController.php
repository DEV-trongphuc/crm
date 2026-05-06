<?php
class InventoryController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    /**
     * Get all active batches with product info
     */
    public function index(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT b.*, p.name as product_name, p.sku, p.category, p.unit, s.name as supplier_name
            FROM batches b
            JOIN products p ON b.product_id = p.id
            LEFT JOIN suppliers s ON b.supplier_id = s.id
            WHERE b.tenant_id = ? AND b.status = 'active'
            ORDER BY b.import_date DESC, b.created_at DESC
        ");
        $stmt->execute([$tid]);
        respond(200, $stmt->fetchAll());
    }

    /**
     * Handle internal stock out (Damage, Gift, Loss)
     */
    public function internalExport(array $auth): void {
        $b = getBody();
        if (empty($b['batch_id']) || empty($b['qty']) || empty($b['reason'])) {
            respond(422, null, 'Thiếu thông tin xuất kho nội bộ', false);
        }

        $this->db->beginTransaction();
        try {
            // 1. Get batch info and lock for update
            $stmt = $this->db->prepare("SELECT current_qty, import_price, product_id FROM batches WHERE id = ? AND tenant_id = ? FOR UPDATE");
            $stmt->execute([$b['batch_id'], $auth['tenant_id']]);
            $batch = $stmt->fetch();

            if (!$batch) throw new Exception('Không tìm thấy lô hàng');
            if ($batch['current_qty'] < $b['qty']) throw new Exception('Số lượng tồn kho trong lô không đủ');

            // 2. Update batch quantity
            $newQty = $batch['current_qty'] - $b['qty'];
            $this->db->prepare("UPDATE batches SET current_qty = ? WHERE id = ?")
                 ->execute([$newQty, $b['batch_id']]);

            // 3. Create inventory log
            $logStmt = $this->db->prepare("
                INSERT INTO inventory_logs (tenant_id, batch_id, action_type, qty_change, reason, created_by, receiver_id, receiver_type)
                VALUES (?, ?, 'EXPORT_INTERNAL', ?, ?, ?, ?, ?)
            ");
            $receiverId = !empty($b['receiver_id']) ? (int)$b['receiver_id'] : null;
            $receiverType = $receiverId ? 'contact' : null; // Default to contact for now as per UI
            
            $logStmt->execute([
                $auth['tenant_id'], $b['batch_id'], -$b['qty'], $b['reason'], $auth['user_id'], $receiverId, $receiverType
            ]);

            // 4. Update overall product stock
            $this->db->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")
                 ->execute([$b['qty'], $batch['product_id']]);

            // 5. If gift/loss with receiver, create Expense record automatically
            if ($receiverId && $b['reason'] === 'Hàng tặng/Quà tặng') {
                $expenseAmount = $b['qty'] * $batch['import_price'];
                $productNameStmt = $this->db->prepare("SELECT name FROM products WHERE id = ?");
                $productNameStmt->execute([$batch['product_id']]);
                $pName = $productNameStmt->fetchColumn();

                $expStmt = $this->db->prepare("
                    INSERT INTO expenses (tenant_id, created_by, title, category, amount, vat_amount, date, status, notes, has_vat_invoice, is_vat_inclusive)
                    VALUES (?, ?, ?, 'Quà tặng khách hàng', ?, 0, CURRENT_DATE, 'approved', ?, 0, 1)
                ");
                $expTitle = "Tặng phẩm: $pName (x" . $b['qty'] . ")";
                $expNotes = "Xuất từ lô #" . $b['batch_id'] . ". Lý do: " . $b['reason'];
                $expStmt->execute([
                    $auth['tenant_id'], $auth['user_id'], $expTitle, $expenseAmount, $expNotes
                ]);
                $expenseId = (int)$this->db->lastInsertId();

                // Link expense to the receiver entity
                $this->db->prepare("
                    INSERT INTO expense_entities (tenant_id, expense_id, entity_type, entity_id, amount)
                    VALUES (?, ?, ?, ?, ?)
                ")->execute([
                    $auth['tenant_id'], $expenseId, $receiverType, $receiverId, $expenseAmount
                ]);
            }

            $this->db->commit();
            respond(200, null, 'Xuất kho nội bộ thành công');
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }

    /**
     * Get logs for a specific batch
     */
    public function getLogs(array $auth, int $batchId): void {
        $stmt = $this->db->prepare("
            SELECT l.*, u.full_name as creator_name
            FROM inventory_logs l
            LEFT JOIN users u ON l.created_by = u.id
            WHERE l.batch_id = ? AND l.tenant_id = ?
            ORDER BY l.created_at DESC
        ");
        $stmt->execute([$batchId, $auth['tenant_id']]);
        respond(200, $stmt->fetchAll());
    }

    /**
     * Manual adjustment
     */
    public function adjust(array $auth): void {
        $b = getBody();
        if (empty($b['batch_id']) || !isset($b['new_qty'])) respond(422, null, 'Thiếu thông tin điều chỉnh', false);

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT current_qty FROM batches WHERE id = ? AND tenant_id = ? FOR UPDATE");
            $stmt->execute([$b['batch_id'], $auth['tenant_id']]);
            $batch = $stmt->fetch();
            if (!$batch) throw new Exception('Không tìm thấy lô hàng');

            $qtyChange = $b['new_qty'] - $batch['current_qty'];

            $this->db->prepare("UPDATE batches SET current_qty = ? WHERE id = ?")
                 ->execute([$b['new_qty'], $b['batch_id']]);

            $logStmt = $this->db->prepare("
                INSERT INTO inventory_logs (tenant_id, batch_id, action_type, qty_change, reason, created_by)
                VALUES (?, ?, 'ADJUST', ?, ?, ?)
            ");
            $logStmt->execute([
                $auth['tenant_id'], $b['batch_id'], $qtyChange, $b['reason'] ?? 'Điều chỉnh thủ công', $auth['user_id']
            ]);

            // Update overall product stock
            $this->db->prepare("UPDATE products p JOIN batches b ON p.id = b.product_id SET p.stock_quantity = p.stock_quantity + ? WHERE b.id = ?")
                 ->execute([$qtyChange, $b['batch_id']]);

            $this->db->commit();
            respond(200, null, 'Điều chỉnh kho thành công');
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }
    /**
     * Get global inventory logs for the tenant
     */
    public function globalLogs(array $auth): void {
        $tid = $auth['tenant_id'];
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        
        $stmt = $this->db->prepare("
            SELECT l.*, b.batch_code, p.name as product_name, u.full_name as creator_name
            FROM inventory_logs l
            JOIN batches b ON l.batch_id = b.id
            JOIN products p ON b.product_id = p.id
            LEFT JOIN users u ON l.created_by = u.id
            WHERE l.tenant_id = ?
            ORDER BY l.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$tid, $limit]);
        respond(200, $stmt->fetchAll());
    }

    /**
     * Archive a batch (when it's empty and no longer needed in active list)
     */
    public function archive(array $auth, int $batchId): void {
        $stmt = $this->db->prepare("UPDATE batches SET status = 'archived' WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$batchId, $auth['tenant_id']]);
        respond(200, null, 'Đã lưu trữ lô hàng');
    }
}
