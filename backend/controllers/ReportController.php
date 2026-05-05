<?php
class ReportController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function sales(array $auth): void {
        $tid = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-d', strtotime('-11 months'));
        $to   = $_GET['to']   ?? date('Y-m-d');
        
        // Revenue by month (from Invoices)
        $stmt = $this->db->prepare("
            SELECT DATE_FORMAT(issue_date,'%Y-%m') as month,
                   SUM(total) as revenue,
                   COUNT(*) as total_invoices
            FROM invoices
            WHERE tenant_id=? AND status='paid' AND issue_date BETWEEN ? AND ?
            GROUP BY month ORDER BY month ASC
        ");
        $stmt->execute([$tid, $from, $to]);
        $byMonth = $stmt->fetchAll();

        // Performance by Owner
        $stmt2 = $this->db->prepare("
            SELECT u.full_name as name, 
                   COUNT(d.id) as deals, 
                   COALESCE(SUM(CASE WHEN ps.is_won=1 THEN d.value ELSE 0 END),0) as revenue
            FROM users u
            LEFT JOIN deals d ON u.id = d.owner_id AND d.tenant_id = u.tenant_id
            LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
            WHERE u.tenant_id = ?
            GROUP BY u.id ORDER BY revenue DESC
        ");
        $stmt2->execute([$tid]);
        
        respond(200, [
            'by_month' => $byMonth,
            'by_owner' => $stmt2->fetchAll() ?: [],
            'summary' => [
                'total_revenue' => array_sum(array_column($byMonth, 'revenue')),
                'deal_count' => (int)$this->db->query("SELECT COUNT(*) FROM deals WHERE tenant_id=$tid")->fetchColumn(),
                'customer_count' => (int)$this->db->query("SELECT COUNT(*) FROM contacts WHERE tenant_id=$tid")->fetchColumn()
            ]
        ]);
    }

    public function pipeline(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT ps.name as stage, ps.color, COUNT(d.id) as count,
                   COALESCE(SUM(d.value),0) as total_value
            FROM pipeline_stages ps LEFT JOIN deals d ON d.stage_id=ps.id
            WHERE ps.tenant_id=?
            GROUP BY ps.id ORDER BY ps.order_index
        ");
        $stmt->execute([$tid]);
        respond(200,$stmt->fetchAll());
    }

    public function activities(array $auth): void {
        $tid = $auth['tenant_id'];
        $stmt = $this->db->prepare("
            SELECT u.full_name as user_name, a.type,
                   COUNT(*) as total,
                   COUNT(CASE WHEN a.status='done' THEN 1 END) as done
            FROM activities a LEFT JOIN users u ON a.user_id=u.id
            WHERE a.tenant_id=?
            GROUP BY a.user_id, a.type ORDER BY u.full_name
        ");
        $stmt->execute([$tid]);
        respond(200,$stmt->fetchAll());
    }
}
