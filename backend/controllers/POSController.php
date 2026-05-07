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
                INSERT INTO invoices (tenant_id, contact_id, created_by, invoice_number, title, status, issue_date, due_date, paid_at, total, shipping_fee, shipping_customer_pay, is_inventory_deducted)
                VALUES (?, ?, ?, ?, ?, 'paid', CURDATE(), CURDATE(), NOW(), ?, ?, ?, 1)
            ");
            $sInv->execute([
                $tid, 
                $data['customer_id'], 
                $uid, 
                $invNum, 
                $title, 
                $data['total_amount'],
                $data['shipping_fee'] ?? 0,
                $data['shipping_customer_pay'] ?? 0
            ]);
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
                
                // Deduct stock if product_id is present
                if (!empty($item['id'])) {
                    deductStockFIFO($this->db, $tid, $uid, (int)$item['id'], (int)$item['quantity'], $invNum);
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

            // 4. Activity log (Internal Audit)
            logActivity($this->db, $tid, $uid, 'Tạo đơn hàng POS', 'invoice', (int)$invId, $invNum);

            // 5. Interaction History (Customer Timeline)
            logInteraction(
                $this->db, $tid, $uid, 'task', 
                "Đơn hàng POS #$invNum", 
                "Đơn hàng trị giá " . number_format($data['total_amount'], 0, ',', '.') . " đ đã hoàn tất.",
                'contact', (int)$data['customer_id']
            );

            $this->db->commit();
            respond(201, ["invoice_id" => $invId, "message" => "Đơn hàng hoàn tất thành công"]);
        } catch (Exception $e) {
            $this->db->rollBack();
            respond(500, null, $e->getMessage(), false);
        }
    }
}
