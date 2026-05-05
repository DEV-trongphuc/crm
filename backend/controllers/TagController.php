<?php
class TagController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function index($auth) {
        $stmt = $this->db->prepare("
            SELECT t.*, 
                   (SELECT COUNT(*) FROM entity_tags et WHERE et.tag_id = t.id) as count
            FROM tags t 
            WHERE t.tenant_id = ?
            ORDER BY t.name ASC
        ");
        $stmt->execute([$auth['tenant_id']]);
        respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function store($auth) {
        $data = getBody();
        if (empty($data['name'])) respond(400, null, 'Tên tag không được để trống', false);

        $stmt = $this->db->prepare("
            INSERT INTO tags (tenant_id, name, color, entity_type)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $auth['tenant_id'],
            $data['name'],
            $data['color'] ?? '#6366f1',
            $data['entity_type'] ?? 'all'
        ]);
        
        $id = $this->db->lastInsertId();
        respond(201, ['id' => $id], 'Đã tạo tag mới');
    }

    public function update($auth, $id) {
        $data = getBody();
        $stmt = $this->db->prepare("
            UPDATE tags 
            SET name = ?, color = ?, entity_type = ?
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute([
            $data['name'],
            $data['color'],
            $data['entity_type'] ?? 'all',
            $id,
            $auth['tenant_id']
        ]);
        respond(200, null, 'Đã cập nhật tag');
    }

    public function destroy($auth, $id) {
        // Delete associations first
        $this->db->prepare("DELETE FROM entity_tags WHERE tag_id = ?")->execute([$id]);
        
        $stmt = $this->db->prepare("DELETE FROM tags WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $auth['tenant_id']]);
        respond(200, null, 'Đã xóa tag');
    }

    /**
     * GET /tags/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&date_field=created_at
     * Returns [{tag, count, color}] aggregated from contacts.tags JSON column.
     */
    public function tagStats(array $auth): void {
        $from       = $_GET['from']       ?? null;
        $to         = $_GET['to']         ?? null;
        $dateField  = in_array($_GET['date_field'] ?? '', ['updated_at']) ? 'updated_at' : 'created_at';

        $params = [$auth['tenant_id']];
        $where  = 'tenant_id = ? AND deleted_at IS NULL';
        if ($from) { $where .= " AND DATE($dateField) >= ?"; $params[] = $from; }
        if ($to)   { $where .= " AND DATE($dateField) <= ?"; $params[] = $to;   }

        $stmt = $this->db->prepare("SELECT tags FROM contacts WHERE $where");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $counts = [];
        foreach ($rows as $jsonTags) {
            $tags = json_decode($jsonTags ?? '[]', true) ?: [];
            foreach ($tags as $tag) {
                $tag = trim((string)$tag);
                if ($tag === '') continue;
                $counts[$tag] = ($counts[$tag] ?? 0) + 1;
            }
        }

        // Fetch tag colors from the tags table
        $tagRows = $this->db->prepare("SELECT name, color FROM tags WHERE tenant_id = ?");
        $tagRows->execute([$auth['tenant_id']]);
        $colorMap = [];
        foreach ($tagRows->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $colorMap[$r['name']] = $r['color'];
        }

        $palette = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899'];
        $i = 0;
        $result = [];
        arsort($counts);
        foreach ($counts as $tag => $count) {
            $result[] = [
                'tag'   => $tag,
                'count' => $count,
                'color' => $colorMap[$tag] ?? $palette[$i % count($palette)],
            ];
            $i++;
        }

        respond(200, $result);
    }
}
