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
        $s = $this->db->prepare("SELECT id, CONCAT(first_name,' ',last_name) as label, email as sublabel, 'contact' as type, status FROM contacts WHERE tenant_id=? AND (CONCAT(first_name,' ',last_name) LIKE ? OR email LIKE ? OR phone LIKE ?) LIMIT 5");
        $s->execute([$tid, $like, $like, $like]);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Companies
        $s = $this->db->prepare("SELECT id, name as label, city as sublabel, 'company' as type, status FROM companies WHERE tenant_id=? AND (name LIKE ? OR email LIKE ?) LIMIT 5");
        $s->execute([$tid, $like, $like]);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Deals
        $s = $this->db->prepare("SELECT d.id, d.title as label, ps.name as sublabel, 'deal' as type, 'deal' as status FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id WHERE d.tenant_id=? AND d.title LIKE ? LIMIT 5");
        $s->execute([$tid, $like]);
        foreach ($s->fetchAll() as $r) $results[] = $r;

        // Notes (full-text content search)
        $s = $this->db->prepare("SELECT n.id, SUBSTRING(n.body,1,80) as label, n.entity_type as sublabel, 'note' as type, 'note' as status FROM notes n WHERE n.tenant_id=? AND n.body LIKE ? LIMIT 3");
        $s->execute([$tid, $like]);
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
            $s = $this->db->prepare("
                SELECT c.id, CONCAT(c.first_name,' ',c.last_name) as name, c.phone, c.status
                FROM contacts c
                WHERE c.tenant_id=? AND c.id NOT IN (
                    SELECT related_id FROM activities
                    WHERE tenant_id=? AND type='call' AND related_type='contact'
                    AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                )
                ORDER BY c.updated_at ASC LIMIT 20
            ");
            $s->execute([$tid, $tid, $days]);
            $results['items'] = $s->fetchAll();
            $results['description'] = "Khách chưa được gọi trong {$days} ngày qua";
        }
        elseif (str_contains($q, 'deal') && str_contains($q, 'tr')) {
            // Deals > X million not closed
            preg_match('/([\d.]+)\s*tr/', $q, $m);
            $val = isset($m[1]) ? (float)$m[1] * 1000000 : 10000000;
            $s = $this->db->prepare("
                SELECT d.id, d.title, d.value, ps.name as stage
                FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id=ps.id
                WHERE d.tenant_id=? AND d.value >= ? AND (ps.is_won=0 OR ps.is_won IS NULL)
                ORDER BY d.value DESC LIMIT 20
            ");
            $s->execute([$tid, $val]);
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
