<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = read_json_input();
$id = trim((string)($data['id'] ?? ''));
$action = trim((string)($data['action'] ?? ''));
if ($id === '' || $action === '') json_response(['error' => 'Missing action or booking id.'], 422);
if ($action === 'cancel') {
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
    $stmt->execute([$id]);
    json_response(['ok' => true]);
}
if ($action === 'delete') {
    $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
    $stmt->execute([$id]);
    json_response(['ok' => true]);
}
if ($action === 'edit') {
    $date = trim((string)($data['date'] ?? ''));
    $time = trim((string)($data['time'] ?? ''));
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt || $dt->format('Y-m-d') !== $date) json_response(['error' => 'Invalid date.'], 422);
    if ($time === '') json_response(['error' => 'Missing time slot.'], 422);
    if (day_is_blocked($pdo, $date)) json_response(['error' => 'That date is blocked.'], 409);
    $allowedWeekdays = get_allowed_weekdays($pdo);
    if (!in_array((int)$dt->format('w'), $allowedWeekdays, true)) json_response(['error' => 'That weekday is not bookable right now.'], 422);
    if (slot_is_unavailable($pdo, $date, $time, $id)) json_response(['error' => 'That time slot is already taken.'], 409);
    $stmt = $pdo->prepare("UPDATE bookings SET booking_date = ?, booking_time = ?, status = 'confirmed' WHERE id = ?");
    $stmt->execute([$date, $time, $id]);
    json_response(['ok' => true]);
}
json_response(['error' => 'Unknown action.'], 422);
