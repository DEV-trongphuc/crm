<?php
// f:\CRM\backend\controllers\DashboardController.php

class DashboardController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function stats(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-t');
        
        // Range formatting for index efficiency (avoiding DATE() function on columns)
        $fromTs = $from . ' 00:00:00';
        $toTs   = $to . ' 23:59:59';

        $saleFilter = "";
        $saleParams = [];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND owner_id = :uid";
            $saleParams['uid'] = $auth['user_id'];
        }

        $uidF = ($auth['role'] === 'sale') ? " AND user_id = :uid" : "";
        $uidD = ($auth['role'] === 'sale') ? " AND d.owner_id = :uid" : "";

        // Optimized consolidated query with unique parameter names
        $stats = $this->db->prepare("
            SELECT
                (SELECT COALESCE(SUM(value),0) FROM deals WHERE tenant_id=:tid1 AND deleted_at IS NULL AND created_at BETWEEN :f1 AND :t1 $saleFilter) as total_value,
                (SELECT COALESCE(SUM(total),0) FROM invoices WHERE tenant_id=:tid2 AND status='paid' AND paid_at BETWEEN :f2 AND :t2 ".(($auth['role'] === 'sale') ? " AND created_by = :uid" : "").") as actual_revenue,
                (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE tenant_id=:tid3 AND status='approved' AND date BETWEEN :f_date AND :t_date ".(($auth['role'] === 'sale') ? " AND created_by = :uid" : "").") as total_expenses,
                (SELECT COUNT(*) FROM contacts WHERE tenant_id=:tid4 AND deleted_at IS NULL AND created_at BETWEEN :f3 AND :t3 $saleFilter) as new_contacts,
                (SELECT COUNT(*) FROM activities WHERE tenant_id=:tid5 AND status='planned' AND due_date BETWEEN CURDATE() AND CONCAT(CURDATE(), ' 23:59:59') $uidF) as tasks_due_today,
                (SELECT COUNT(*) FROM activities WHERE tenant_id=:tid9 AND status='planned' AND due_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 23:59:59') $uidF) as tasks_due_tomorrow,
                (SELECT COUNT(*) FROM activities WHERE tenant_id=:tid10 AND status='planned' AND due_date < CURDATE() $uidF) as overdue_tasks,
                (SELECT COUNT(*) FROM deals d JOIN pipeline_stages ps ON d.stage_id=ps.id WHERE d.tenant_id=:tid6 AND d.deleted_at IS NULL AND ps.is_won=1 AND (d.actual_close_date BETWEEN :f_date4 AND :t_date4 OR (d.actual_close_date IS NULL AND d.updated_at BETWEEN :f4 AND :t4)) $uidD) as won_count,
                (SELECT COALESCE(SUM(d.value),0) FROM deals d JOIN pipeline_stages ps ON d.stage_id=ps.id WHERE d.tenant_id=:tid7 AND d.deleted_at IS NULL AND ps.is_won=1 AND (d.actual_close_date BETWEEN :f_date5 AND :t_date5 OR (d.actual_close_date IS NULL AND d.updated_at BETWEEN :f5 AND :t5)) $uidD) as won_value,
                (SELECT COALESCE(SUM(shipping_fee),0) FROM invoices WHERE tenant_id=:tid8 AND status='paid' AND shipping_customer_pay=1 AND paid_at BETWEEN :f6 AND :t6 ".(($auth['role'] === 'sale') ? " AND created_by = :uid" : "").") as shipping_collected
        ");
        
        $p = [
            'tid1' => $tid, 'tid2' => $tid, 'tid3' => $tid, 'tid4' => $tid, 'tid5' => $tid, 'tid6' => $tid, 'tid7' => $tid, 'tid8' => $tid, 'tid9' => $tid, 'tid10' => $tid,
            'f1' => $fromTs, 't1' => $toTs,
            'f2' => $fromTs, 't2' => $toTs,
            'f3' => $fromTs, 't3' => $toTs,
            'f4' => $fromTs, 't4' => $toTs,
            'f5' => $fromTs, 't5' => $toTs,
            'f6' => $fromTs, 't6' => $toTs,
            'f_date' => $from, 't_date' => $to,
            'f_date4' => $from, 't_date4' => $to,
            'f_date5' => $from, 't_date5' => $to
        ];
        if ($auth['role'] === 'sale') $p['uid'] = $auth['user_id'];
        $stats->execute($p);
        $res = $stats->fetch();

        // Fetch actual tasks for today for the "Focus" card
        $sqlToday = "SELECT id, subject, type, priority, due_date FROM activities WHERE tenant_id=? AND status='planned' AND due_date BETWEEN CURDATE() AND CONCAT(CURDATE(), ' 23:59:59')";
        $pToday = [$tid];
        if ($auth['role'] === 'sale') {
            $sqlToday .= " AND user_id=?";
            $pToday[] = $auth['user_id'];
        }
        $sToday = $this->db->prepare($sqlToday . " LIMIT 10");
        $sToday->execute($pToday);
        $todayTasks = $sToday->fetchAll();

        $rev = (float)$res['actual_revenue'];
        $wonVal = (float)$res['won_value'];
        $exp = (float)$res['total_expenses'];

        respond(200, [
            'total_value'       => (float)$res['total_value'],
            'won_value'         => $rev > 0 ? $rev : $wonVal,
            'won_count'         => (int)$res['won_count'],
            'expenses'          => $exp,
            'profit'            => ($rev > 0 ? $rev : $wonVal) - $exp,
            'new_contacts'      => (int)$res['new_contacts'],
            'tasks_due_today'   => (int)$res['tasks_due_today'],
            'tasks_due_tomorrow'=> (int)$res['tasks_due_tomorrow'],
            'overdue_tasks'     => (int)$res['overdue_tasks'],
            'shipping_collected'=> (float)$res['shipping_collected'],
            'today_tasks'       => $todayTasks
        ]);
    }

    public function chartRevenue(array $auth): void {
        $tid    = $auth['tenant_id'];
        $months = (int)($_GET['months'] ?? 6);

        $sql = "SELECT 
                DATE_FORMAT(d.created_at,'%Y-%m') as month,
                COALESCE(SUM(CASE WHEN ps.is_won=1 THEN d.value ELSE 0 END),0) as revenue,
                COUNT(CASE WHEN ps.is_won=1 THEN 1 END) as deals_won
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            WHERE d.tenant_id=? AND d.created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)";
        $p = [$tid, $months];
        if ($auth['role'] === 'sale') {
            $sql .= " AND d.owner_id = ?";
            $p[] = $auth['user_id'];
        }
        $sql .= " GROUP BY DATE_FORMAT(d.created_at,'%Y-%m') ORDER BY month ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function topDeals(array $auth): void {
        $tid = $auth['tenant_id'];
        $sql = "SELECT d.id, d.title, d.value, ps.name as stage_name, ps.color as stage_color,
                   CONCAT(c.first_name,' ',c.last_name) as contact_name,
                   u.full_name as owner_name
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            LEFT JOIN contacts c ON d.contact_id = c.id
            LEFT JOIN users u ON d.owner_id = u.id
            WHERE d.tenant_id=? AND (ps.is_won=0 OR ps.is_won IS NULL) AND (ps.is_lost=0 OR ps.is_lost IS NULL)";
        $p = [$tid];
        if ($auth['role'] === 'sale') {
            $sql .= " AND d.owner_id = ?";
            $p[] = $auth['user_id'];
        }
        $sql .= " ORDER BY d.value DESC LIMIT 5";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function recentActivities(array $auth): void {
        $tid = $auth['tenant_id'];
        $sql = "SELECT a.*, u.full_name as user_name, u.avatar_url
            FROM activities a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.tenant_id=?";
        $p = [$tid];
        if ($auth['role'] === 'sale') {
            $sql .= " AND a.user_id = ?";
            $p[] = $auth['user_id'];
        }
        $sql .= " ORDER BY a.created_at DESC LIMIT 10";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function pipelineFunnel(array $auth): void {
        $tid = $auth['tenant_id'];
        $sql = "SELECT ps.id, ps.name, ps.color, ps.order_index, ps.is_won, ps.is_lost,
                   COUNT(d.id) as deal_count,
                   COALESCE(SUM(d.value),0) as total_value
            FROM pipeline_stages ps
            LEFT JOIN deals d ON d.stage_id = ps.id AND d.deleted_at IS NULL AND d.tenant_id=?
        ";
        $p = [$tid, $tid];
        if ($auth['role'] === 'sale') {
            $sql .= " AND (d.owner_id=? OR d.id IS NULL)";
            $p[] = $auth['user_id'];
        }
        $sql .= " WHERE ps.tenant_id=? GROUP BY ps.id ORDER BY ps.order_index ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function leadSources(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = ($_GET['from'] ?? date('Y-m-01')) . ' 00:00:00';
        $to   = ($_GET['to']   ?? date('Y-m-t')) . ' 23:59:59';
        
        $sql = "SELECT source, COUNT(*) as count FROM contacts WHERE tenant_id=? AND deleted_at IS NULL AND created_at BETWEEN ? AND ?";
        $p = [$tid, $from, $to];
        if ($auth['role'] === 'sale') {
            $sql .= " AND owner_id = ?";
            $p[] = $auth['user_id'];
        }
        $sql .= " GROUP BY source ORDER BY count DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function salesLeaderboard(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = ($_GET['from'] ?? date('Y-m-01')) . ' 00:00:00';
        $to   = ($_GET['to']   ?? date('Y-m-t')) . ' 23:59:59';
        
        $where = "u.tenant_id=? AND u.is_active=1 AND u.role IN ('admin','manager','sales','sale')";
        $params = [$tid, $from, $to, $tid];
        
        if ($auth['role'] === 'sale') {
            $where .= " AND u.id=?";
            $params[] = $auth['user_id'];
        }

        $stmt = $this->db->prepare("
            SELECT u.id, u.full_name, u.avatar_url,
                   COUNT(d.id) as deal_count,
                   COALESCE(SUM(d.value),0) as pipeline_value,
                   COALESCE(SUM(CASE WHEN ps.is_won=1 THEN d.value ELSE 0 END),0) as won_value,
                   COUNT(CASE WHEN ps.is_won=1 THEN 1 END) as won_count
            FROM users u
            LEFT JOIN deals d ON d.owner_id=u.id AND d.deleted_at IS NULL AND d.tenant_id=? AND d.created_at BETWEEN ? AND ?
            LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
            WHERE $where
            GROUP BY u.id ORDER BY won_value DESC
        ");
        $stmt->execute($params);
        respond(200, $stmt->fetchAll());
    }

    public function myStats(array $auth): void {
        $tid = $auth['tenant_id'];
        $uid = $auth['user_id'];
        $from = ($_GET['from'] ?? date('Y-m-01')) . ' 00:00:00';
        $to   = ($_GET['to']   ?? date('Y-m-t')) . ' 23:59:59';

        $s1 = $this->db->prepare("SELECT COUNT(*) as total, COALESCE(SUM(value),0) as total_value FROM deals WHERE owner_id=? AND tenant_id=? AND deleted_at IS NULL");
        $s1->execute([$uid, $tid]);
        $myDeals = $s1->fetch();

        $s2 = $this->db->prepare("SELECT COUNT(*) as cnt FROM activities WHERE user_id=? AND tenant_id=? AND status='done' AND done_at BETWEEN ? AND ?");
        $s2->execute([$uid, $tid, $from, $to]);
        $doneTasks = (int)$s2->fetchColumn();

        $s3 = $this->db->prepare("SELECT COUNT(*) as cnt FROM activities WHERE user_id=? AND tenant_id=? AND status='planned' AND due_date <= CONCAT(CURDATE(), ' 23:59:59')");
        $s3->execute([$uid, $tid]);
        $overdue = (int)$s3->fetchColumn();

        $s4 = $this->db->prepare("SELECT COUNT(*) as cnt FROM contacts WHERE owner_id=? AND tenant_id=? AND deleted_at IS NULL AND created_at BETWEEN ? AND ?");
        $s4->execute([$uid, $tid, $from, $to]);
        $newLeads = (int)$s4->fetchColumn();

        respond(200, [
            'my_deals'       => (int)$myDeals['total'],
            'my_pipeline'    => (float)$myDeals['total_value'],
            'done_tasks'     => $doneTasks,
            'overdue_tasks'  => $overdue,
            'new_leads'      => $newLeads,
        ]);
    }
}
