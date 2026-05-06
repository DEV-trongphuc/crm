<?php
// f:\CRM\backend\controllers\POSController.php

class POSController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }


    public function createOrder(array $auth): void {
        $tid = $auth['tenant_id'];
        $uid = $auth['user_id'];
        $data = getBody();

        if (empty($data['cart']) || empty($data['customer_id'])) {
            respond(400, null, "Thiếu giỏ hàng hoặc thông tin khách hàng", false);
        }

        // Verify customer belongs to tenant
        $checkCust = $this->db->prepare("SELECT id FROM contacts WHERE id=? AND tenant_id=?");
        $checkCust->execute([(int)$data['customer_id'], $tid]);
        if (!$checkCust->fetch()) {
            respond(403, null, "Khách hàng không hợp lệ hoặc không thuộc quyền quản lý", false);
        }

        $this->db->beginTransaction();
        try {
            $title = "Đơn hàng POS - " . date('d/m/Y H:i');
            
            // 1. Create an Invoice (Status: paid)
            $today = date('Ymd');
            $invNum = 'POS-' . $today . '-' . strtoupper(bin2hex(random_bytes(3)));
            $sInv = $this->db->prepare("
                INSERT INTO invoices (tenant_id, contact_id, created_by, invoice_number, title, status, issue_date, due_date, paid_at, total)
                VALUES (?, ?, ?, ?, ?, 'paid', CURDATE(), CURDATE(), NOW(), ?)
            ");
            $sInv->execute([$tid, $data['customer_id'], $uid, $invNum, $title, $data['total_amount']]);
            $invId = $this->db->lastInsertId();

            // 2. Add Invoice Items and Deduct Stock
            $sItem = $this->db->prepare("INSERT INTO invoice_items (invoice_id, product_id, name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['cart'] as $item) {
                $sItem->execute([
                    $invId,
                    $item['id'] ?? null,
                    $item['name'],
                    $item['quantity'],
                    $item['price'],
                    $item['price'] * $item['quantity']
                ]);
                
                // Deduct stock if product_id is present and tracking is enabled
                if (!empty($item['id'])) {
                    // 1. Get batches sorted by import date (FIFO)
                    $stmtBatches = $this->db->prepare("
                        SELECT id, current_qty 
                        FROM batches 
                        WHERE product_id = ? AND tenant_id = ? AND current_qty > 0 AND status = 'active'
                        ORDER BY import_date ASC, id ASC 
                        FOR UPDATE
                    ");
                    $stmtBatches->execute([$item['id'], $tid]);
                    $batches = $stmtBatches->fetchAll();

                    $remainingToDeduct = (int)$item['quantity'];

                    foreach ($batches as $batch) {
                        if ($remainingToDeduct <= 0) break;

                        $deductFromThisBatch = min($batch['current_qty'], $remainingToDeduct);
                        
                        // Update batch quantity
                        $this->db->prepare("UPDATE batches SET current_qty = current_qty - ? WHERE id = ?")
                             ->execute([$deductFromThisBatch, $batch['id']]);
                        
                        // Create inventory log
                        $this->db->prepare("
                            INSERT INTO inventory_logs (tenant_id, batch_id, action_type, qty_change, reason, created_by)
                            VALUES (?, ?, 'SALE', ?, ?, ?)
                        ")->execute([
                            $tid, $batch['id'], -$deductFromThisBatch, "Bán hàng qua POS - Đơn #$invNum", $uid
                        ]);

                        $remainingToDeduct -= $deductFromThisBatch;
                    }

                    // Update overall product stock
                    $sStock = $this->db->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND tenant_id = ? AND track_inventory = 1"); 
                    $sStock->execute([$item['quantity'], $item['id'], $tid]);
                }
            }

            // 3. Update Customer Stats
            $sCust = $this->db->prepare("
                UPDATE contacts 
                SET total_spent = total_spent + ?, 
                    order_count = order_count + 1, 
                    last_order_at = NOW(),
                    last_contact = CURRENT_DATE,
                    status = 'customer'
                WHERE id = ? AND tenant_id = ?
            ");
            $sCust->execute([$data['total_amount'], $data['customer_id'], $tid]);

            // 4. Audit Trail Activity
            logActivity(
                $this->db, $tid, $uid, 'task', 
                "Tạo đơn hàng POS #$invNum", 
                "Đơn hàng trị giá " . number_format($data['total_amount'], 0, ',', '.') . " đ cho khách hàng.",
                'contact', $data['customer_id']
            );

            $this->db->commit();
            respond(201, ["invoice_id" => $invId, "message" => "Đơn hàng hoàn tất thành công"]);
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }
}
