<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = read_json_input();
if (isset($data['allowedWeekdays'])) {
    $weekdays = array_values(array_unique(array_map('intval', (array)$data['allowedWeekdays'])));
    sort($weekdays);
    if (!$weekdays) json_response(['error' => 'Pick at least one weekday.'], 422);
    foreach ($weekdays as $w) { if ($w < 0 || $w > 6) json_response(['error' => 'Invalid weekday.'], 422); }
    $pdo->beginTransaction();
    $pdo->exec("DELETE FROM allowed_weekdays");
    $stmt = $pdo->prepare("INSERT INTO allowed_weekdays (weekday) VALUES (?)");
    foreach ($weekdays as $w) $stmt->execute([$w]);
    $pdo->commit();
}
if (isset($data['password'])) {
    $password = trim((string)$data['password']);
    if (strlen($password) < 4) json_response(['error' => 'Password must be at least 4 characters.'], 422);
    $stmt = $pdo->prepare("UPDATE admin_settings SET password_hash = ? WHERE id = 1");
    $stmt->execute([password_hash($password, PASSWORD_DEFAULT)]);
}
json_response(['ok' => true]);
