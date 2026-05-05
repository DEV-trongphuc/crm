<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// f:\CRM\backend\index.php — Main API entry point

require_once __DIR__ . '/config.php';          // DB constants + CORS origins
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
    $stmt = $db->prepare("
        INSERT INTO activities (tenant_id, user_id, type, subject, body, status, related_type, related_id)
        VALUES (?, ?, ?, ?, ?, 'done', ?, ?)
    ");
    $stmt->execute([$tid, $uid, $type, $subject, $body, $relType, $relId]);
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

// ── Route dispatch ────────────────────────────────────────────
switch ($resource) {
    // AUTH
    case 'auth':
        $ctrl = new AuthController($db);
        if ($resourceId === 'login'   && $method === 'POST') $ctrl->login();
        elseif ($resourceId === 'refresh' && $method === 'POST') $ctrl->refresh();
        elseif ($resourceId === 'logout'  && $method === 'POST') $ctrl->logout();
        elseif ($resourceId === 'me'      && $method === 'GET')  $ctrl->me(requireAuth());
        elseif ($resourceId === 'reset-demo' && $method === 'GET') {
            $hash = password_hash('password', PASSWORD_BCRYPT, ['cost' => 12]);
            $db->prepare("UPDATE users SET password_hash = ? WHERE email = 'admin@minth.crm'")->execute([$hash]);
            respond(200, null, 'Đã reset mật khẩu admin thành: password');
        }
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
        if     ($resourceId === 'sales')     $ctrl->sales($auth);
        elseif ($resourceId === 'pipeline')  $ctrl->pipeline($auth);
        elseif ($resourceId === 'activities')$ctrl->activities($auth);
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
        elseif ($resourceId === 'pay' && $method === 'POST') $ctrl->markPaid($auth, (int)$segments[1]);
        else respond(404, null, 'Route không tồn tại', false);
        break;

    case 'expenses':
        $auth = requireAuth();
        $ctrl = new FinanceController($db);
        if     (!$resourceId && $method === 'GET')    $ctrl->listExpenses($auth);
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

    default:
        respond(404, null, 'Route không tồn tại', false);
}
