<?php
// f:\CRM\backend\api.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once './config.php';

$database = new Database();
$db = $database->getConnection();

$requestUri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
// Assuming URL is like /backend/api.php/deals or similar
$action = isset($_GET['action']) ? $_GET['action'] : '';

$method = $_SERVER['REQUEST_METHOD'];

function respond($status, $data = null, $message = '') {
    echo json_encode([
        'status' => $status,
        'data' => $data,
        'message' => $message
    ]);
    exit();
}

if (!$action) {
    respond('error', null, 'No action specified');
}

try {
    switch ($action) {
        case 'ping':
            respond('success', ['time' => time()], 'Pong');
            break;

        case 'deals':
            if ($method === 'GET') {
                $query = "SELECT d.*, c.first_name, c.last_name, ds.name as stage_name, ds.color as stage_color 
                          FROM deals d 
                          LEFT JOIN contacts c ON d.contact_id = c.id 
                          LEFT JOIN deal_stages ds ON d.stage_id = ds.id
                          ORDER BY ds.order_index ASC, d.created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
                respond('success', $deals);
            }
            break;

        case 'deal_stages':
            if ($method === 'GET') {
                $query = "SELECT * FROM deal_stages ORDER BY order_index ASC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $stages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                respond('success', $stages);
            }
            break;

        // More endpoints can be added here
        default:
            respond('error', null, 'Invalid action');
    }
} catch (Exception $e) {
    http_response_code(500);
    respond('error', null, $e->getMessage());
}
?>
