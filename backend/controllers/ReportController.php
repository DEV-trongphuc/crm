<?php
class ReportController
{
    private PDO $db;
    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function sales(array $auth): void
    {
        $tid = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-d', strtotime('-11 months'));
        $to = $_GET['to'] ?? date('Y-m-d');
        
        $saleFilterInv = "";
        $saleFilterDeal = "";
        $pInv = [$tid, $from, $to];
        $pOwner = [$tid];
        
        if ($auth['role'] === 'sale') {
            $saleFilterInv = " AND created_by=?";
            $pInv[] = $auth['user_id'];
            
            $saleFilterDeal = " AND d.owner_id=?";
            $pOwner[] = $auth['user_id'];
        }

        // Revenue by month (from Invoices)
        $stmt = $this->db->prepare("
            SELECT DATE_FORMAT(issue_date,'%Y-%m') as month,
                   SUM(total) as revenue,
                   COUNT(*) as total_invoices
            FROM invoices
            WHERE tenant_id=? AND status='paid' AND issue_date BETWEEN ? AND ? $saleFilterInv
            GROUP BY month ORDER BY month ASC
        ");
        $stmt->execute($pInv);
        $revs = $stmt->fetchAll(PDO::FETCH_UNIQUE|PDO::FETCH_ASSOC);

        // Expenses by month
        $saleFilterExp = ($auth['role'] === 'sale') ? " AND created_by=?" : "";
        $pExp = [$tid, $from, $to]; if($auth['role'] === 'sale') $pExp[] = $auth['user_id'];
        
        $stmtE = $this->db->prepare("
            SELECT DATE_FORMAT(date,'%Y-%m') as month,
                   SUM(amount) as cost
            FROM expenses
            WHERE tenant_id=? AND date BETWEEN ? AND ? $saleFilterExp
            GROUP BY month
        ");
        $stmtE->execute($pExp);
        $costs = $stmtE->fetchAll(PDO::FETCH_UNIQUE|PDO::FETCH_ASSOC);

        // Merge
        $byMonth = [];
        $allMonths = array_unique(array_merge(array_keys($revs), array_keys($costs)));
        sort($allMonths);
        foreach ($allMonths as $m) {
            $byMonth[] = [
                'month' => $m,
                'revenue' => (float)($revs[$m]['revenue'] ?? 0),
                'cost' => (float)($costs[$m]['cost'] ?? 0),
                'total_invoices' => (int)($revs[$m]['total_invoices'] ?? 0)
            ];
        }

        // Performance by Owner
        $stmt2 = $this->db->prepare("
            SELECT name, SUM(deals) as deals, SUM(revenue) as revenue
            FROM (
                SELECT u.full_name as name, 
                       COUNT(d.id) as deals, 
                       COALESCE(SUM(d.expected_revenue),0) as revenue
                FROM users u
                LEFT JOIN contacts d ON u.id = d.owner_id AND d.tenant_id = u.tenant_id AND d.deleted_at IS NULL
                WHERE u.tenant_id = ? ".($auth['role'] === 'sale' ? " AND u.id=?" : "")."
                GROUP BY u.id
                UNION ALL
                SELECT u.full_name as name, 
                       COUNT(co.id) as deals, 
                       COALESCE(SUM(co.expected_revenue),0) as revenue
                FROM users u
                LEFT JOIN companies co ON u.id = co.owner_id AND co.tenant_id = u.tenant_id AND co.deleted_at IS NULL
                WHERE u.tenant_id = ? ".($auth['role'] === 'sale' ? " AND u.id=?" : "")."
                GROUP BY u.id
            ) combined
            GROUP BY name ORDER BY revenue DESC
        ");
        $pOwner2 = array_merge($pOwner, $pOwner);
        $stmt2->execute($pOwner2);

        $sDeals = $this->db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM contacts WHERE tenant_id=:tid1 AND deleted_at IS NULL ".($auth['role'] === 'sale' ? " AND owner_id=:uid1" : "").") +
                (SELECT COUNT(*) FROM companies WHERE tenant_id=:tid2 AND deleted_at IS NULL ".($auth['role'] === 'sale' ? " AND owner_id=:uid2" : "").") as total_deals,
                (SELECT COALESCE(SUM(expected_revenue),0) FROM contacts WHERE tenant_id=:tid3 AND deleted_at IS NULL ".($auth['role'] === 'sale' ? " AND owner_id=:uid3" : "").") +
                (SELECT COALESCE(SUM(expected_revenue),0) FROM companies WHERE tenant_id=:tid4 AND deleted_at IS NULL ".($auth['role'] === 'sale' ? " AND owner_id=:uid4" : "").") as total_revenue
        ");
        $pDeals = ['tid1' => $tid, 'tid2' => $tid, 'tid3' => $tid, 'tid4' => $tid];
        if ($auth['role'] === 'sale') {
            $pDeals['uid1'] = $auth['user_id']; $pDeals['uid2'] = $auth['user_id'];
            $pDeals['uid3'] = $auth['user_id']; $pDeals['uid4'] = $auth['user_id'];
        }
        $sDeals->execute($pDeals);
        $dealStats = $sDeals->fetch(PDO::FETCH_ASSOC);

        $sWon = $this->db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM contacts d JOIN pipeline_stages ps ON d.stage_id=ps.id WHERE d.tenant_id=:tid1 AND d.deleted_at IS NULL AND ps.is_won=1 ".($auth['role'] === 'sale' ? " AND d.owner_id=:uid1" : "").") +
                (SELECT COUNT(*) FROM companies co JOIN pipeline_stages ps ON co.stage_id=ps.id WHERE co.tenant_id=:tid2 AND co.deleted_at IS NULL AND ps.is_won=1 ".($auth['role'] === 'sale' ? " AND co.owner_id=:uid2" : "").") as won_count
        ");
        $pWon = ['tid1' => $tid, 'tid2' => $tid];
        if ($auth['role'] === 'sale') {
            $pWon['uid1'] = $auth['user_id']; $pWon['uid2'] = $auth['user_id'];
        }
        $sWon->execute($pWon);
        $wonCount = (int)$sWon->fetchColumn();

        $sContacts = $this->db->prepare("SELECT COUNT(*) FROM contacts WHERE tenant_id=? AND deleted_at IS NULL ".($auth['role'] === 'sale' ? " AND owner_id=?" : ""));
        $sContacts->execute($pOwner);

        $sRevTotal = $this->db->prepare("SELECT SUM(total) FROM invoices WHERE tenant_id=? AND status='paid' $saleFilterInv");
        $pRev = [$tid]; if ($auth['role'] === 'sale') $pRev[] = $auth['user_id'];
        $sRevTotal->execute($pRev);
        $revTotal = $sRevTotal->fetchColumn();

        respond(200, [
            'by_month' => $byMonth,
            'by_owner' => $stmt2->fetchAll() ?: [],
            'summary' => [
                'deals' => (int)$dealStats['total_deals'],
                'expected_revenue' => (float)$dealStats['total_revenue'],
                'total_revenue' => (float)($revTotal ?: 0),
                'win_rate' => $dealStats['total_deals'] > 0 ? round(($wonCount / $dealStats['total_deals']) * 100, 1) : 0,
                'contacts' => (int)$sContacts->fetchColumn()
            ]
        ]);
    }

    public function pipeline(array $auth): void
    {
        $tid = $auth['tenant_id'];
        $from = ($_GET['from'] ?? date('Y-m-01')) . ' 00:00:00';
        $to = ($_GET['to'] ?? date('Y-m-t')) . ' 23:59:59';
        
        $saleFilter = "";
        $params = [$from, $to, $tid];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND d.owner_id=?";
            $params[] = $auth['user_id'];
        }

        $stmt = $this->db->prepare("
            SELECT ps.name as stage, ps.color, 
                   (
                     (SELECT COUNT(*) FROM contacts c WHERE c.stage_id = ps.id AND c.deleted_at IS NULL AND c.tenant_id = :tid1 ".(($auth['role'] === 'sale') ? " AND c.owner_id = :uid" : "").") +
                     (SELECT COUNT(*) FROM companies comp WHERE comp.stage_id = ps.id AND comp.deleted_at IS NULL AND comp.tenant_id = :tid2 ".(($auth['role'] === 'sale') ? " AND comp.owner_id = :uid" : "").")
                   ) as count,
                    (
                      (SELECT COALESCE(SUM(expected_revenue),0) FROM contacts c WHERE c.stage_id = ps.id AND c.deleted_at IS NULL AND c.tenant_id = :tid3 ".(($auth['role'] === 'sale') ? " AND c.owner_id = :uid" : "").") +
                      (SELECT COALESCE(SUM(expected_revenue),0) FROM companies comp WHERE comp.stage_id = ps.id AND comp.deleted_at IS NULL AND comp.tenant_id = :tid5 ".(($auth['role'] === 'sale') ? " AND comp.owner_id = :uid" : "").")
                    ) as total_value
            FROM pipeline_stages ps 
            WHERE ps.tenant_id = :tid4
            GROUP BY ps.id ORDER BY ps.order_index
        ");
        $p = ['tid1' => $tid, 'tid2' => $tid, 'tid3' => $tid, 'tid4' => $tid, 'tid5' => $tid];
        if ($auth['role'] === 'sale') $p['uid'] = $auth['user_id'];
        $stmt->execute($p);
        respond(200, $stmt->fetchAll());
    }

    public function customers(array $auth): void
    {
        $tid = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $to = $_GET['to'] ?? date('Y-m-d');
        
        $saleFilter = "";
        $params = [$tid];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND owner_id=?";
            $params[] = $auth['user_id'];
        }

        // By Source
        $s1 = $this->db->prepare("SELECT source, COUNT(*) as count FROM contacts WHERE tenant_id=? AND deleted_at IS NULL $saleFilter GROUP BY source");
        $s1->execute($params);
        $bySource = $s1->fetchAll();

        // By Status
        $s2 = $this->db->prepare("SELECT status, COUNT(*) as count FROM contacts WHERE tenant_id=? AND deleted_at IS NULL $saleFilter GROUP BY status");
        $s2->execute($params);
        $byStatus = $s2->fetchAll();

        // Growth trend
        $pTrend = array_merge([$tid], [$from . ' 00:00:00', $to . ' 23:59:59']);
        if ($auth['role'] === 'sale') $pTrend[] = $auth['user_id'];
        
        $s3 = $this->db->prepare("
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count 
            FROM contacts 
            WHERE tenant_id=? AND deleted_at IS NULL AND created_at BETWEEN ? AND ? $saleFilter
            GROUP BY date ORDER BY date ASC
        ");
        $s3->execute($pTrend);

        // Lead score distribution
        $s4 = $this->db->prepare("
            SELECT 
                CASE 
                    WHEN lead_score < 20 THEN '0-20'
                    WHEN lead_score < 50 THEN '21-50'
                    WHEN lead_score < 80 THEN '51-80'
                    ELSE '81-100'
                END as bucket,
                COUNT(*) as count
            FROM contacts
            WHERE tenant_id=? AND deleted_at IS NULL $saleFilter
            GROUP BY bucket
        ");
        $s4->execute($params);

        respond(200, [
            'by_source' => $bySource,
            'by_status' => $byStatus,
            'trend'     => $s3->fetchAll(),
            'by_score'  => $s4->fetchAll()
        ]);
    }

    public function companies(array $auth): void
    {
        $tid = $auth['tenant_id'];

        $saleFilter = "";
        $params = [$tid];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND owner_id=?";
            $params[] = $auth['user_id'];
        }

        // By Industry
        $s1 = $this->db->prepare("SELECT industry, COUNT(*) as count FROM companies WHERE tenant_id=? AND deleted_at IS NULL $saleFilter GROUP BY industry ORDER BY count DESC");
        $s1->execute($params);

        // By City
        $s2 = $this->db->prepare("SELECT city, COUNT(*) as count FROM companies WHERE tenant_id=? AND deleted_at IS NULL $saleFilter GROUP BY city ORDER BY count DESC LIMIT 10");
        $s2->execute($params);

        // By Size
        $s3 = $this->db->prepare("SELECT size, COUNT(*) as count FROM companies WHERE tenant_id=? AND deleted_at IS NULL $saleFilter GROUP BY size ORDER BY count DESC");
        $s3->execute($params);

        respond(200, [
            'by_industry' => $s1->fetchAll(),
            'by_city' => $s2->fetchAll(),
            'by_size' => $s3->fetchAll()
        ]);
    }

    public function expenses(array $auth): void
    {
        $tid = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-t');

        $saleFilter = "";
        $params = [$tid, $from, $to];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND created_by=?";
            $params[] = $auth['user_id'];
        }

        // By Category
        $s1 = $this->db->prepare("SELECT COALESCE(NULLIF(category,''), 'Khác') as category, SUM(amount) as total FROM expenses WHERE tenant_id=? AND date BETWEEN ? AND ? $saleFilter GROUP BY category");
        $s1->execute($params);

        // Daily trend
        $s2 = $this->db->prepare("
            SELECT date, SUM(amount) as total 
            FROM expenses 
            WHERE tenant_id=? AND date BETWEEN ? AND ? $saleFilter
            GROUP BY date ORDER BY date ASC
        ");
        $s2->execute($params);

        respond(200, [
            'by_category' => $s1->fetchAll(),
            'trend' => $s2->fetchAll()
        ]);
    }

    public function activities(array $auth): void
    {
        $tid = $auth['tenant_id'];
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-t');

        // Activities by User and Type (as expected by frontend table)
        $sql = "
            SELECT u.full_name as user_name, a.type, COUNT(*) as total
            FROM activities a
            JOIN users u ON a.user_id = u.id
            WHERE a.tenant_id=? AND a.created_at BETWEEN ? AND ?
        ";
        $params = [$tid, $from . ' 00:00:00', $to . ' 23:59:59'];
        if ($auth['role'] === 'sale') {
            $sql .= " AND a.user_id=?";
            $params[] = $auth['user_id'];
        }
        $sql .= " GROUP BY u.id, a.type ORDER BY user_name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $byUserType = $stmt->fetchAll();

        // Global type breakdown
        $sql2 = "SELECT type, COUNT(*) as total FROM activities WHERE tenant_id=? AND created_at BETWEEN ? AND ?";
        $p2 = [$tid, $from . ' 00:00:00', $to . ' 23:59:59'];
        if ($auth['role'] === 'sale') {
            $sql2 .= " AND user_id=?";
            $p2[] = $auth['user_id'];
        }
        $sql2 .= " GROUP BY type";
        $stmt2 = $this->db->prepare($sql2);
        $stmt2->execute($p2);
        $byType = $stmt2->fetchAll();

        respond(200, [
            'by_user_type' => $byUserType,
            'by_type' => $byType
        ]);
    }
}
