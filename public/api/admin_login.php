<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
$data = read_json_input();
$password = (string)($data['password'] ?? '');
$stmt = $pdo->query("SELECT password_hash FROM admin_settings WHERE id = 1");
$hash = (string)$stmt->fetchColumn();
if (!$hash || !password_verify($password, $hash)) {
    json_response(['error' => 'Wrong password.'], 401);
}
$_SESSION['admin_logged_in'] = true;
json_response(['ok' => true]);
