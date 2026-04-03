<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = read_json_input();
$date = trim((string)($data['date'] ?? ''));
$slot = trim((string)($data['slot'] ?? ''));
$dt = DateTime::createFromFormat('Y-m-d', $date);
if (!$dt || $dt->format('Y-m-d') !== $date) json_response(['error' => 'Invalid date.'], 422);
if ($slot === '') json_response(['error' => 'Missing time slot.'], 422);
$stmt = $pdo->prepare("INSERT INTO blocked_slots (date, slot) VALUES (?, ?) ON DUPLICATE KEY UPDATE slot = VALUES(slot)");
$stmt->execute([$date, $slot]);
json_response(['ok' => true]);
