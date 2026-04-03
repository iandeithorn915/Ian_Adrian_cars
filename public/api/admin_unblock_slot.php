<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = read_json_input();
$id = (int)($data['id'] ?? 0);
$stmt = $pdo->prepare("DELETE FROM blocked_slots WHERE id = ?");
$stmt->execute([$id]);
json_response(['ok' => true]);
