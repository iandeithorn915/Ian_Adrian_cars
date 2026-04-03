<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = read_json_input();
$date = trim((string)($data['date'] ?? ''));
$reason = trim((string)($data['reason'] ?? ''));
$dt = DateTime::createFromFormat('Y-m-d', $date);
if (!$dt || $dt->format('Y-m-d') !== $date) json_response(['error' => 'Invalid date.'], 422);
$stmt = $pdo->prepare("INSERT INTO blocked_days (date, reason) VALUES (?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)");
$stmt->execute([$date, $reason !== '' ? $reason : null]);
json_response(['ok' => true]);
