<?php
// SearchController — Global search across contacts, companies, deals, notes
class SearchController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function global(array $auth): void {
        $q   = trim($_GET['q'] ?? '');
        if (strlen($q) < 2) respond(200, ['results' => []]);

        $tid  = $auth['tenant_id'];
        $like = "%{$q}%";
        $results = [];

        // Contacts
        $sqlC = "SELECT id, CONCAT(first_name,' ',last_name) as label, email as sublabel, 'contact' as type, status FROM contacts WHERE tenant_id=? AND (CONCAT(first_name,' ',last_name) LIKE ? OR email LIKE ? OR phone LIKE ?)";
        $pC = [$tid, $like, $like, $like];
        if ($auth['role'] === 'sale') { $sqlC .= " AND owner_id=?"; $pC[] = $auth['user_id']; }
        $s = $this->db->prepare($sqlC . " LIMIT 5");
        $s->execute($pC);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Companies
        $sqlComp = "SELECT id, name as label, city as sublabel, 'company' as type, status FROM companies WHERE tenant_id=? AND (name LIKE ? OR email LIKE ?)";
        $pComp = [$tid, $like, $like];
        if ($auth['role'] === 'sale') { $sqlComp .= " AND owner_id=?"; $pComp[] = $auth['user_id']; }
        $s = $this->db->prepare($sqlComp . " LIMIT 5");
        $s->execute($pComp);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Deals
        $sqlD = "SELECT d.id, d.title as label, ps.name as sublabel, 'deal' as type, 'deal' as status FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id WHERE d.tenant_id=? AND d.title LIKE ?";
        $pD = [$tid, $like];
        if ($auth['role'] === 'sale') { $sqlD .= " AND d.owner_id=?"; $pD[] = $auth['user_id']; }
        $s = $this->db->prepare($sqlD . " LIMIT 5");
        $s->execute($pD);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Notes (full-text content search)
        $sqlN = "SELECT n.id, SUBSTRING(n.body,1,80) as label, n.entity_type as sublabel, 'note' as type, 'note' as status FROM notes n WHERE n.tenant_id=? AND n.body LIKE ?";
        $pN = [$tid, $like];
        if ($auth['role'] === 'sale') { $sqlN .= " AND n.created_by=?"; $pN[] = $auth['user_id']; }
        $s = $this->db->prepare($sqlN . " LIMIT 3");
        $s->execute($pN);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        respond(200, ['results' => $results, 'query' => $q]);
    }

    public function smartFilter(array $auth): void {
        $q  = strtolower(trim($_GET['q'] ?? ''));
        $tid = $auth['tenant_id'];

        // Parse smart queries
        $results = ['type' => 'contacts', 'items' => []];

        if (str_contains($q, 'chưa gọi')) {
            // Contacts with no call activity in N days
            preg_match('/(\d+)\s*ngày/', $q, $m);
            $days = isset($m[1]) ? (int)$m[1] : 3;
            
            $saleFilter = "";
            $params = [$tid, $tid, $days];
            if ($auth['role'] === 'sale') {
                $saleFilter = " AND c.owner_id = ?";
                $params[] = $auth['user_id'];
            }

            $s = $this->db->prepare("
                SELECT c.id, CONCAT(c.first_name,' ',c.last_name) as name, c.phone, c.status
                FROM contacts c
                WHERE c.tenant_id=? AND c.id NOT IN (
                    SELECT related_id FROM activities
                    WHERE tenant_id=? AND type='call' AND related_type='contact'
                    AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                ) $saleFilter
                ORDER BY c.updated_at ASC LIMIT 20
            ");
            $s->execute($params);
            $results['items'] = $s->fetchAll();
            $results['description'] = "Khách chưa được gọi trong {$days} ngày qua";
        }
        elseif (str_contains($q, 'deal') && str_contains($q, 'tr')) {
            // Deals > X million not closed
            preg_match('/([\d.]+)\s*tr/', $q, $m);
            $val = isset($m[1]) ? (float)$m[1] * 1000000 : 10000000;

            $saleFilter = "";
            $params = [$tid, $val];
            if ($auth['role'] === 'sale') {
                $saleFilter = " AND d.owner_id = ?";
                $params[] = $auth['user_id'];
            }

            $s = $this->db->prepare("
                SELECT d.id, d.title, d.value, ps.name as stage
                FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
                WHERE d.tenant_id=? AND d.value >= ? AND (ps.is_won=0 OR ps.is_won IS NULL) $saleFilter
                ORDER BY d.value DESC LIMIT 20
            ");
            $s->execute($params);
            $results['type'] = 'deals';
            $results['items'] = $s->fetchAll();
            $results['description'] = "Deal trên " . number_format($val/1e6, 0) . "tr chưa chốt";
        }
        else {
            // Fall back to global search
            $this->global($auth);
            return;
        }

        respond(200, $results);
    }
}
