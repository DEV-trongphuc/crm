<?php
// f:\CRM\backend\controllers\DashboardController.php

class DashboardController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function stats(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-t');

        // Total deals value this period
        $s1 = $this->db->prepare("
            SELECT 
                COUNT(*) as total_deals,
                COALESCE(SUM(value),0) as total_value
            FROM deals 
            WHERE tenant_id=? AND DATE(created_at) BETWEEN ? AND ?
        ");
        $s1->execute([$tid, $from, $to]);
        $dealStats = $s1->fetch();

        // Actual Revenue from Paid Invoices
        $sRev = $this->db->prepare("SELECT COALESCE(SUM(total),0) as rev FROM invoices WHERE tenant_id=? AND status='paid' AND DATE(paid_at) BETWEEN ? AND ?");
        $sRev->execute([$tid, $from, $to]);
        $rev = (float)$sRev->fetch()['rev'];

        // Operating Expenses
        $sExp = $this->db->prepare("SELECT COALESCE(SUM(amount),0) as exp FROM expenses WHERE tenant_id=? AND status='approved' AND DATE(date) BETWEEN ? AND ?");
        $sExp->execute([$tid, $from, $to]);
        $exp = (float)$sExp->fetch()['exp'];

        // New contacts
        $s2 = $this->db->prepare("SELECT COUNT(*) as new_contacts FROM contacts WHERE tenant_id=? AND DATE(created_at) BETWEEN ? AND ?");
        $s2->execute([$tid, $from, $to]);
        $contactStats = $s2->fetch();

        // Tasks due today
        $s4 = $this->db->prepare("SELECT COUNT(*) as due_today FROM activities WHERE tenant_id=? AND status='planned' AND DATE(due_date)=CURDATE()");
        $s4->execute([$tid]);
        $taskStats = $s4->fetch();

        respond(200, [
            'total_value'    => (float)$dealStats['total_value'],
            'won_value'      => $rev,
            'expenses'       => $exp,
            'profit'         => $rev - $exp,
            'new_contacts'   => (int)$contactStats['new_contacts'],
            'tasks_due_today'=> (int)$taskStats['due_today'],
        ]);
    }

    public function chartRevenue(array $auth): void {
        $tid    = $auth['tenant_id'];
        $months = (int)($_GET['months'] ?? 6);

        $stmt = $this->db->prepare("
            SELECT 
                DATE_FORMAT(d.created_at,'%Y-%m') as month,
                COALESCE(SUM(CASE WHEN ps.is_won=1 THEN d.value ELSE 0 END),0) as revenue,
                COUNT(CASE WHEN ps.is_won=1 THEN 1 END) as deals_won
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            WHERE d.tenant_id=? AND d.created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(d.created_at,'%Y-%m')
            ORDER BY month ASC
        ");
        $stmt->execute([$tid, $months]);
        respond(200, $stmt->fetchAll());
    }

    public function topDeals(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT d.id, d.title, d.value, ps.name as stage_name, ps.color as stage_color,
                   CONCAT(c.first_name,' ',c.last_name) as contact_name,
                   u.full_name as owner_name
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            LEFT JOIN contacts c ON d.contact_id = c.id
            LEFT JOIN users u ON d.owner_id = u.id
            WHERE d.tenant_id=? AND (ps.is_won=0 OR ps.is_won IS NULL) AND (ps.is_lost=0 OR ps.is_lost IS NULL)
            ORDER BY d.value DESC LIMIT 5
        ");
        $stmt->execute([$tid]);
        respond(200, $stmt->fetchAll());
    }

    public function recentActivities(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT a.*, u.full_name as user_name, u.avatar_url
            FROM activities a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.tenant_id=?
            ORDER BY a.created_at DESC LIMIT 10
        ");
        $stmt->execute([$tid]);
        respond(200, $stmt->fetchAll());
    }

    public function pipelineFunnel(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT ps.id, ps.name, ps.color, ps.order_index, ps.is_won, ps.is_lost,
                   COUNT(d.id) as deal_count,
                   COALESCE(SUM(d.value),0) as total_value
            FROM pipeline_stages ps
            LEFT JOIN deals d ON d.stage_id = ps.id AND d.deleted_at IS NULL AND d.tenant_id=?
            WHERE ps.tenant_id=?
            GROUP BY ps.id ORDER BY ps.order_index ASC
        ");
        $stmt->execute([$tid, $tid]);
        respond(200, $stmt->fetchAll());
    }

    public function leadSources(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-t');
        $stmt = $this->db->prepare("
            SELECT source, COUNT(*) as count
            FROM contacts
            WHERE tenant_id=? AND deleted_at IS NULL AND DATE(created_at) BETWEEN ? AND ?
            GROUP BY source ORDER BY count DESC
        ");
        $stmt->execute([$tid, $from, $to]);
        respond(200, $stmt->fetchAll());
    }

    public function salesLeaderboard(array $auth): void {
        $tid  = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-t');
        $stmt = $this->db->prepare("
            SELECT u.id, u.full_name, u.avatar_url,
                   COUNT(d.id) as deal_count,
                   COALESCE(SUM(d.value),0) as pipeline_value,
                   COALESCE(SUM(CASE WHEN ps.is_won=1 THEN d.value ELSE 0 END),0) as won_value,
                   COUNT(CASE WHEN ps.is_won=1 THEN 1 END) as won_count
            FROM users u
            LEFT JOIN deals d ON d.owner_id=u.id AND d.deleted_at IS NULL AND d.tenant_id=? AND DATE(d.created_at) BETWEEN ? AND ?
            LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
            WHERE u.tenant_id=? AND u.is_active=1 AND u.role IN ('admin','manager','sales')
            GROUP BY u.id ORDER BY won_value DESC
        ");
        $stmt->execute([$tid, $from, $to, $tid]);
        respond(200, $stmt->fetchAll());
    }

    public function myStats(array $auth): void {
        $tid = $auth['tenant_id'];
        $uid = $auth['user_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-t');

        $s1 = $this->db->prepare("SELECT COUNT(*) as total, COALESCE(SUM(value),0) as total_value FROM deals WHERE owner_id=? AND tenant_id=? AND deleted_at IS NULL");
        $s1->execute([$uid, $tid]);
        $myDeals = $s1->fetch();

        $s2 = $this->db->prepare("SELECT COUNT(*) as cnt FROM activities WHERE user_id=? AND tenant_id=? AND status='done' AND DATE(done_at) BETWEEN ? AND ?");
        $s2->execute([$uid, $tid, $from, $to]);
        $doneTasks = (int)$s2->fetchColumn();

        $s3 = $this->db->prepare("SELECT COUNT(*) as cnt FROM activities WHERE user_id=? AND tenant_id=? AND status='planned' AND DATE(due_date)<=CURDATE()");
        $s3->execute([$uid, $tid]);
        $overdue = (int)$s3->fetchColumn();

        $s4 = $this->db->prepare("SELECT COUNT(*) as cnt FROM contacts WHERE owner_id=? AND tenant_id=? AND deleted_at IS NULL AND DATE(created_at) BETWEEN ? AND ?");
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
