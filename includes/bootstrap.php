<?php
declare(strict_types=1);
$configPath = dirname(__DIR__) . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing config.php. Copy config.sample.php to config.php and fill in your database settings.']);
    exit;
}
$config = require $configPath;
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($config['session_name'] ?? 'iac_admin_session');
    session_start();
}
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
$pdo = get_pdo($config);
ensure_defaults($pdo);
