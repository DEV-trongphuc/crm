<?php
require_once __DIR__ . '/config.php';          // DB constants + CORS origins

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// require_once __DIR__ . '/config/Config.php';   // Removed to prevent 'already defined' warnings
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/JWT.php';

// ── CORS ──────────────────────────────────────────────────────
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_map('trim', explode(',', ALLOWED_ORIGINS));
// Also allow any localhost origin (any port) for local dev
$isLocalhost = (bool) preg_match('#^https?://localhost(:\d+)?$#', $origin);
if ($isLocalhost || in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . ($allowed[0] ?? '*'));
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }


// ── Helper functions ──────────────────────────────────────────
function respond(int $code, $data = null, string $message = '', bool $success = true): void {
    http_response_code($code);
    echo json_encode(['success' => $success, 'data' => $data, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function getBearerToken(): ?string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $h, $m)) return $m[1];
    return null;
}

function requireAuth(): array {
    $token = getBearerToken();
    if (!$token) respond(401, null, 'Token không hợp lệ', false);
    $payload = JWT::decode($token);
    if (!$payload) respond(401, null, 'Token hết hạn hoặc không hợp lệ', false);
    return $payload;
}

function requireRole(array $payload, array $roles): void {
    if (!in_array($payload['role'], $roles, true)) {
        respond(403, null, 'Bạn không có quyền thực hiện thao tác này', false);
    }
}

function logActivity(PDO $db, int $tid, int $uid, string $type, string $subject, string $body = null, string $relType = null, int $relId = null): void {
    // Redirecting automatic system activities to audit_logs instead of the activities table
    // to prevent cluttering the "Hoạt động & Lịch" UI as per user request.
    $stmt = $db->prepare("
        INSERT INTO audit_logs (tenant_id, user_id, action, resource, resource_id, new_data, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $tid, 
        $uid, 
        $subject, 
        $relType ?? 'system', 
        $relId, 
        $body, 
        $_SERVER['REMOTE_ADDR'] ?? null, 
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
}

/**
 * Shared Inventory Deduction Logic (FIFO)
 */
function deductStockFIFO(PDO $db, int $tid, int $uid, int $productId, int $qty, string $invNum): void {
    // 1. Get batches sorted by import date (FIFO)
    $stmtBatches = $db->prepare("
        SELECT id, current_qty 
        FROM batches 
        WHERE product_id = ? AND tenant_id = ? AND current_qty > 0 AND status = 'active'
        ORDER BY import_date ASC, id ASC 
        FOR UPDATE
    ");
    $stmtBatches->execute([$productId, $tid]);
    $batches = $stmtBatches->fetchAll();

    $remainingToDeduct = $qty;

    foreach ($batches as $batch) {
        if ($remainingToDeduct <= 0) break;

        $deductFromThisBatch = min($batch['current_qty'], $remainingToDeduct);
        
        // Update batch quantity
        $db->prepare("UPDATE batches SET current_qty = current_qty - ? WHERE id = ?")
             ->execute([$deductFromThisBatch, $batch['id']]);
        
        // Create inventory log
        $db->prepare("
            INSERT INTO inventory_logs (tenant_id, batch_id, action_type, qty_change, reason, created_by)
            VALUES (?, ?, 'SALE', ?, ?, ?)
        ")->execute([
            $tid, $batch['id'], -$deductFromThisBatch, "Bán hàng - Hóa đơn #$invNum", $uid
        ]);

        $remainingToDeduct -= $deductFromThisBatch;
    }

    // Update overall product stock
    $db->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id=? AND tenant_id=?")
         ->execute([$qty, $productId, $tid]);
}

// ── Load controllers ──────────────────────────────────────────
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/ContactController.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/DealController.php';
require_once __DIR__ . '/controllers/ActivityController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/QuoteController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/NotificationController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/NoteController.php';
require_once __DIR__ . '/controllers/SearchController.php';
require_once __DIR__ . '/controllers/ImportController.php';
require_once __DIR__ . '/controllers/FinanceController.php';
require_once __DIR__ . '/controllers/POSController.php';
require_once __DIR__ . '/controllers/TicketController.php';
require_once __DIR__ . '/controllers/TagController.php';
require_once __DIR__ . '/controllers/SupplierController.php';
require_once __DIR__ . '/controllers/InventoryController.php';
require_once __DIR__ . '/controllers/PurchaseOrderController.php';
require_once __DIR__ . '/controllers/CloudFileController.php';

// ── Parse route ───────────────────────────────────────────────
$requestUri = strtok($_SERVER['REQUEST_URI'], '?');
// Auto-detect base path: works for /crm/backend (prod) and /CRM/backend (local dev)
$requestUri = preg_replace('#^.*/backend#i', '', $requestUri);
$path       = trim($requestUri, '/');
$segments   = array_values(array_filter(explode('/', $path)));

$method        = $_SERVER['REQUEST_METHOD'];
$resource      = $segments[0] ?? '';
$resourceId    = $segments[1] ?? null;
$subResource   = $segments[2] ?? null;

$db = Database::getInstance();

if ($resource === 'check') {
    require_once __DIR__ . '/check_data.php';
    exit;
}

// ── Route dispatch ────────────────────────────────────────────
switch ($resource) {
    // AUTH
    case 'auth':
        $ctrl = new AuthController($db);
        if ($resourceId === 'login'   && $method === 'POST') $ctrl->login();
        elseif ($resourceId === 'refresh' && $method === 'POST') $ctrl->refresh();
        elseif ($resourceId === 'logout'  && $method === 'POST') $ctrl->logout();
        elseif ($resourceId === 'me'      && $method === 'GET')  $ctrl->me(requireAuth());
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // DASHBOARD
    case 'dashboard':
        $auth = requireAuth();
        $ctrl = new DashboardController($db);
        if     ($resourceId === 'stats')              $ctrl->stats($auth);
        elseif ($resourceId === 'chart-revenue')      $ctrl->chartRevenue($auth);
        elseif ($resourceId === 'top-deals')          $ctrl->topDeals($auth);
        elseif ($resourceId === 'recent-activities')  $ctrl->recentActivities($auth);
        elseif ($resourceId === 'pipeline-funnel')    $ctrl->pipelineFunnel($auth);
        elseif ($resourceId === 'lead-sources')       $ctrl->leadSources($auth);
        elseif ($resourceId === 'sales-leaderboard')  $ctrl->salesLeaderboard($auth);
        elseif ($resourceId === 'my-stats')           $ctrl->myStats($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // CONTACTS
    case 'contacts':
        $auth = requireAuth();
        $ctrl = new ContactController($db);
        if ($resourceId === 'bulk-delete' && $method === 'POST') $ctrl->bulkDelete($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $subResource === 'stage' && $method === 'PATCH') $ctrl->moveStage($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // COMPANIES
    case 'companies':
        $auth = requireAuth();
        $ctrl = new CompanyController($db);
        if ($resourceId === 'bulk-delete' && $method === 'POST') $ctrl->bulkDelete($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $subResource === 'stage' && $method === 'PATCH') $ctrl->moveStage($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // DEALS
    case 'deals':
        $auth = requireAuth();
        $ctrl = new DealController($db);
        if ($resourceId === 'bulk-delete' && $method === 'POST') $ctrl->bulkDelete($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $subResource === 'move' && $method === 'POST') $ctrl->moveStage($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // PIPELINE STAGES
    case 'pipeline-stages':
        $auth = requireAuth();
        $ctrl = new DealController($db);
        if ($method === 'GET') $ctrl->stages($auth);
        elseif (!$resourceId && $method === 'POST') { requireRole($auth, ['admin','manager']); $ctrl->storeStage($auth); }
        elseif ($resourceId  && $method === 'PUT')  { requireRole($auth, ['admin','manager']); $ctrl->updateStage($auth, (int)$resourceId); }
        elseif ($resourceId  && $method === 'DELETE') { requireRole($auth, ['admin']); $ctrl->destroyStage($auth, (int)$resourceId); }
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // ACTIVITIES
    case 'activities':
        $auth = requireAuth();
        $ctrl = new ActivityController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // UPLOAD
    case 'upload':
        $auth = requireAuth();
        require_once __DIR__ . '/controllers/UploadController.php';
        $ctrl = new UploadController($db);
        if ($method === 'POST') $ctrl->handle($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // PRODUCTS
    case 'products':
        $auth = requireAuth();
        $ctrl = new ProductController($db);
        if ($resourceId === 'bulk-delete' && $method === 'POST') $ctrl->bulkDelete($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   { requireRole($auth, ['admin','manager']); $ctrl->store($auth); }
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    { requireRole($auth, ['admin','manager']); $ctrl->update($auth, (int)$resourceId); }
        elseif ($resourceId  && $method === 'DELETE') { requireRole($auth, ['admin']); $ctrl->destroy($auth, (int)$resourceId); }
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // QUOTES
    case 'quotes':
        $auth = requireAuth();
        $ctrl = new QuoteController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $subResource === 'convert' && $method === 'POST') $ctrl->convert($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // USERS (admin only)
    case 'users':
        $auth = requireAuth();
        requireRole($auth, ['admin', 'super_admin']);
        $ctrl = new UserController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // NOTIFICATIONS
    case 'notifications':
        $auth = requireAuth();
        $ctrl = new NotificationController($db);
        if ($method === 'GET') $ctrl->index($auth);
        elseif ($resourceId && $method === 'PATCH') $ctrl->markRead($auth, (int)$resourceId);
        elseif ($method === 'DELETE') $ctrl->clearAll($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // REPORTS
    case 'reports':
        $auth = requireAuth();
        $ctrl = new ReportController($db);
        if     ($resourceId === 'sales')      $ctrl->sales($auth);
        elseif ($resourceId === 'pipeline')   $ctrl->pipeline($auth);
        elseif ($resourceId === 'activities') $ctrl->activities($auth);
        elseif ($resourceId === 'customers')  $ctrl->customers($auth);
        elseif ($resourceId === 'companies')  $ctrl->companies($auth);
        elseif ($resourceId === 'expenses')   $ctrl->expenses($auth);
        elseif ($resourceId === 'inventory')  $ctrl->inventory($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // NOTES (threaded, per entity)
    case 'notes':
        $auth = requireAuth();
        $ctrl = new NoteController($db);
        $entityType = $_GET['entity_type'] ?? $segments[1] ?? '';
        $entityId   = (int)($_GET['entity_id'] ?? $segments[2] ?? 0);
        if ($method === 'GET' && $entityType && $entityId) $ctrl->index($auth, $entityType, $entityId);
        elseif ($method === 'POST' && $entityType && $entityId) $ctrl->store($auth, $entityType, $entityId);
        elseif ($resourceId && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // SEARCH (global + smart filter)
    case 'search':
        $auth = requireAuth();
        $ctrl = new SearchController($db);
        if ($resourceId === 'smart') $ctrl->smartFilter($auth);
        else $ctrl->global($auth);
        break;

    // IMPORT / EXPORT
    case 'import':
        $auth = requireAuth();
        $ctrl = new ImportController($db);
        if ($resourceId === 'template') $ctrl->template();
        elseif ($resourceId === 'contacts' && $method === 'POST') $ctrl->contacts($auth);
        elseif ($resourceId === 'export') $ctrl->export($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // FINANCE (Invoices & Expenses)
    case 'invoices':
        $auth = requireAuth();
        $ctrl = new FinanceController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->listInvoices($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->createInvoice($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->showInvoice($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->updateInvoice($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->deleteInvoice($auth, (int)$resourceId);
        elseif ($subResource === 'pay' && $method === 'POST') $ctrl->markPaid($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'expenses':
        $auth = requireAuth();
        $ctrl = new FinanceController($db);
        if ($resourceId === 'entity' && $subResource && $method === 'GET') {
            $ctrl->listEntityExpenses($auth, $subResource, (int)($segments[3] ?? 0));
        }
        elseif ($resourceId === 'summary' && $method === 'GET') $ctrl->summary($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->listExpenses($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->createExpense($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->showExpense($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->updateExpense($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->deleteExpense($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PATCH')  $ctrl->approveExpense($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    // TICKETS (Helpdesk)
    case 'tickets':
        $auth = requireAuth();
        $ctrl = new TicketController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'pos':
        $auth = requireAuth();
        $ctrl = new POSController($db);
        if ($method === 'POST') $ctrl->createOrder($auth);
        break;

    case 'tags':
        $auth = requireAuth();
        $ctrl = new TagController($db);
        if     ($resourceId === 'stats' && $method === 'GET') $ctrl->tagStats($auth);
        elseif (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'inventory':
        $auth = requireAuth();
        $ctrl = new InventoryController($db);
        if     ($resourceId === 'export' && $method === 'POST') $ctrl->internalExport($auth);
        elseif ($resourceId === 'logs' && $method === 'GET') $ctrl->getLogs($auth, (int)($segments[2] ?? 0));
        elseif ($resourceId === 'global-logs' && $method === 'GET') $ctrl->globalLogs($auth);
        elseif ($resourceId === 'adjust' && $method === 'POST') $ctrl->adjust($auth);
        elseif ($resourceId === 'archive' && $method === 'POST') $ctrl->archive($auth, (int)($segments[2] ?? 0));
        elseif (!$resourceId && $method === 'GET') $ctrl->index($auth);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'suppliers':
        $auth = requireAuth();
        $ctrl = new SupplierController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'purchase-orders':
        $auth = requireAuth();
        $ctrl = new PurchaseOrderController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'GET')    $ctrl->show($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'PUT')    $ctrl->update($auth, (int)$resourceId);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        elseif ($subResource === 'receive' && $method === 'POST') $ctrl->receive($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'cloud-files':
        $auth = requireAuth();
        $ctrl = new CloudFileController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->index($auth);
        elseif (!$resourceId && $method === 'POST')   $ctrl->store($auth);
        elseif ($resourceId  && $method === 'DELETE') $ctrl->destroy($auth, (int)$resourceId);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'system':
        if ($resourceId === 'patch' && $method === 'POST') {
            $sqlFiles = ['migrate_2026_05_06_v3_files.sql'];
            $results = [];
            foreach ($sqlFiles as $file) {
                $path = __DIR__ . '/' . $file;
                if (file_exists($path)) {
                    $sql = file_get_contents($path);
                    $stmts = array_filter(array_map('trim', explode(';', $sql)));
                    foreach ($stmts as $s) {
                        try {
                            $db->exec($s);
                            $results[] = "SUCCESS: " . substr($s, 0, 50);
                        } catch (Exception $e) {
                            $results[] = "INFO/ERROR: " . $e->getMessage();
                        }
                    }
                }
            }
            respond(200, $results, 'Migration check completed');
        }
        break;

    default:
        respond(404, null, 'Route không tồn tại', false);
}
