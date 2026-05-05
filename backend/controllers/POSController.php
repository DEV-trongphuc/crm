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
            respond(400, "Missing cart or customer info");
        }

        $this->db->beginTransaction();
        try {
            // 1. Create a Deal (automatically Won)
            $sDeal = $this->db->prepare("
                INSERT INTO deals (tenant_id, contact_id, owner_id, created_by, title, value, probability, expected_close_date, actual_close_date)
                VALUES (?, ?, ?, ?, ?, ?, 100, CURDATE(), CURDATE())
            ");
            $title = "Đơn hàng POS - " . date('d/m/Y H:i');
            $sDeal->execute([
                $tid,
                $data['customer_id'],
                $uid,
                $uid,
                $title,
                $data['total_amount']
            ]);
            $dealId = $this->db->lastInsertId();

            // 2. Create an Invoice
            $invNum = 'INV-' . time();
            $sInv = $this->db->prepare("
                INSERT INTO invoices (tenant_id, deal_id, contact_id, created_by, invoice_number, title, status, issue_date, due_date, paid_at, total)
                VALUES (?, ?, ?, ?, ?, ?, 'paid', CURDATE(), CURDATE(), NOW(), ?)
            ");
            $sInv->execute([$tid, $dealId, $data['customer_id'], $uid, $invNum, $title, $data['total_amount']]);
            $invId = $this->db->lastInsertId();

            // 3. Add Invoice Items and Deduct Stock (if applicable)
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
                
                // Deduct stock if product_id is present
                if (!empty($item['id'])) {
                    $sStock = $this->db->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?"); 
                    $sStock->execute([$item['quantity'], $item['id'], $tid]);
                }
            }

            // 4. Update Customer Stats
            $sCust = $this->db->prepare("
                UPDATE contacts 
                SET total_spent = total_spent + ?, 
                    order_count = order_count + 1, 
                    last_order_at = NOW(),
                    status = 'customer'
                WHERE id = ? AND tenant_id = ?
            ");
            $sCust->execute([$data['total_amount'], $data['customer_id'], $tid]);

            // 5. Audit Trail Activity
            $sAct = $this->db->prepare("
                INSERT INTO activities (tenant_id, user_id, type, subject, body, status, related_type, related_id)
                VALUES (?, ?, 'task', ?, ?, 'done', 'contact', ?)
            ");
            $sAct->execute([
                $tid, $uid, 
                "Tạo đơn hàng POS #$invNum", 
                "Đơn hàng trị giá " . number_format($data['total_amount'], 0, ',', '.') . " đ cho khách hàng.",
                $data['customer_id']
            ]);

            $this->db->commit();
            respond(201, ["invoice_id" => $invId, "message" => "Order completed successfully"]);
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, $e->getMessage());
        }
    }
}
