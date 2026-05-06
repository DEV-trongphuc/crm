<?php
// ImportController — CSV/Excel import for contacts & companies
class ImportController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    /** GET /import/template?type=contact — Download CSV template */
    public function template(): void {
        $type = $_GET['type'] ?? 'contact';
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="template_' . $type . '.csv"');
        echo "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
        if ($type === 'contact') {
            echo "first_name,last_name,email,phone,job_title,source,status,company_name\n";
            echo "Nguyễn,Văn A,example@email.com,0901234567,Giám đốc,website,lead,Công ty ABC\n";
        } else {
            echo "name,industry,city,phone,email,website,status\n";
            echo "Công ty ABC,Công nghệ,TP.HCM,028 1234 5678,info@abc.vn,abc.vn,active\n";
        }
        exit;
    }

    /** POST /import/contacts — Upload & process CSV */
    public function contacts(array $auth): void {
        if (empty($_FILES['file'])) respond(422, null, 'Vui lòng upload file CSV', false);
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) respond(422, null, 'Upload thất bại', false);
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['csv', 'txt'])) respond(422, null, 'Chỉ hỗ trợ file CSV', false);

        $handle = fopen($file['tmp_name'], 'r');
        // Skip BOM
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        $headers = array_map('trim', fgetcsv($handle));
        $map = [
            'first_name' => array_search('first_name', $headers),
            'last_name'  => array_search('last_name',  $headers),
            'email'      => array_search('email',       $headers),
            'phone'      => array_search('phone',       $headers),
            'job_title'  => array_search('job_title',   $headers),
            'source'     => array_search('source',      $headers),
            'status'     => array_search('status',      $headers),
        ];
        
        // Get default stage for contacts
        $s = $this->db->prepare("SELECT id FROM pipeline_stages WHERE tenant_id=? ORDER BY order_index LIMIT 1");
        $s->execute([$auth['tenant_id']]);
        $stageId = $s->fetchColumn() ?: null;

        $imported = 0; $duplicates = 0; $errors = 0; $errorLog = [];

        $checkEmail = $this->db->prepare("SELECT id FROM contacts WHERE email=? AND tenant_id=?");
        $checkPhone = $this->db->prepare("SELECT id FROM contacts WHERE phone=? AND tenant_id=?");
        $insert     = $this->db->prepare("INSERT INTO contacts (tenant_id,first_name,last_name,email,phone,job_title,source,status,created_by,owner_id,stage_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)");

        $validSources  = ['website','referral','social','cold_call','event','other'];
        $validStatuses = ['lead','qualified','customer','churned'];

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) continue;
            
            $getVal = function($key) use ($row, $map) {
                return ($map[$key] !== false && isset($row[$map[$key]])) ? trim($row[$map[$key]]) : '';
            };

            $fn    = $getVal('first_name');
            $email = $getVal('email');
            $phone = $getVal('phone');

            if (empty($fn)) { $errors++; $errorLog[] = "Dòng: thiếu first_name"; continue; }

            // Duplicate check
            if ($email) {
                $checkEmail->execute([$email, $auth['tenant_id']]);
                if ($checkEmail->fetchColumn()) { $duplicates++; continue; }
            }
            if ($phone) {
                $checkPhone->execute([$phone, $auth['tenant_id']]);
                if ($checkPhone->fetchColumn()) { $duplicates++; continue; }
            }

            $srcRaw = $getVal('source');
            $statRaw = $getVal('status');
            $src  = in_array($srcRaw, $validSources) ? $srcRaw : 'other';
            $stat = in_array($statRaw, $validStatuses) ? $statRaw : 'lead';

            try {
                $insert->execute([
                    $auth['tenant_id'], $fn, $getVal('last_name'),
                    $email ?: null, $phone ?: null,
                    $getVal('job_title') ?: null,
                    $src, $stat, $auth['user_id'], $auth['user_id'], $stageId
                ]);
                $imported++;
            } catch (PDOException $e) { $errors++; $errorLog[] = $e->getMessage(); }
        }
        fclose($handle);

        respond(200, [
            'imported'   => $imported,
            'duplicates' => $duplicates,
            'errors'     => $errors,
            'error_log'  => array_slice($errorLog, 0, 10),
        ], "Import hoàn tất: {$imported} thành công, {$duplicates} trùng, {$errors} lỗi");
    }

    /** GET /import/export?type=contact — Export contacts as CSV */
    public function export(array $auth): void {
        $type = $_GET['type'] ?? 'contact';
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="export_' . $type . '_' . date('Ymd') . '.csv"');
        echo "\xEF\xBB\xBF";

        $saleFilter = "";
        $params = [$auth['tenant_id']];
        if ($auth['role'] === 'sale') {
            $saleFilter = " AND owner_id=?";
            $params[] = $auth['user_id'];
        }

        if ($type === 'contact') {
            $stmt = $this->db->prepare("SELECT c.first_name,c.last_name,c.email,c.phone,c.job_title,c.source,c.status,co.name as company_name,u.full_name as owner FROM contacts c LEFT JOIN companies co ON c.company_id=co.id LEFT JOIN users u ON c.owner_id=u.id WHERE c.tenant_id=? AND c.deleted_at IS NULL $saleFilter ORDER BY c.created_at DESC");
            $stmt->execute($params);
            echo "first_name,last_name,email,phone,job_title,source,status,company_name,owner\n";
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                echo implode(',', array_map(fn($v) => '"' . str_replace('"','""',$v??'') . '"', $row)) . "\n";
            }
        } elseif ($type === 'company') {
            $stmt = $this->db->prepare("SELECT name,industry,city,phone,email,website,status FROM companies WHERE tenant_id=? AND deleted_at IS NULL $saleFilter ORDER BY name");
            $stmt->execute($params);
            echo "name,industry,city,phone,email,website,status\n";
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                echo implode(',', array_map(fn($v) => '"' . str_replace('"','""',$v??'') . '"', $row)) . "\n";
            }
        }
        exit;
    }
}
