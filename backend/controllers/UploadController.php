<?php
class UploadController {
    private PDO $db;
    public function __construct(PDO $db) { $this->db = $db; }

    public function handle(array $auth): void {
        if (!isset($_FILES['file'])) {
            respond(400, null, 'Không có file nào được tải lên');
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            respond(500, null, 'Lỗi upload file: ' . $file['error']);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            respond(400, null, 'Định dạng file không hỗ trợ');
        }

        // Limit size to 2MB
        if ($file['size'] > 2 * 1024 * 1024) {
            respond(400, null, 'Dung lượng file quá lớn (tối đa 2MB)');
        }

        $storageDir = __DIR__ . '/../storage/uploads/';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0777, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('img_', true) . '.' . $ext;
        $targetPath = $storageDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Delete old file if requested
            $oldUrl = $_POST['previous_url'] ?? null;
            if ($oldUrl && strpos($oldUrl, '/storage/uploads/') !== false) {
                $oldFilename = basename($oldUrl);
                $oldPath = $storageDir . $oldFilename;
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            // Return relative URL from backend root
            $url = '/backend/storage/uploads/' . $filename;
            respond(200, ['url' => $url], 'Tải lên thành công');
        } else {
            respond(500, null, 'Không thể lưu file trên server');
        }
    }
}
