<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
$data = read_json_input();
$required = ['service','name','email','phone','date','time'];
foreach ($required as $field) {
    if (empty(trim((string)($data[$field] ?? '')))) {
        json_response(['error' => 'Missing required field: ' . $field], 422);
    }
}
$email = trim((string)$data['email']);
$phone = trim((string)$data['phone']);
$date = trim((string)$data['date']);
$time = trim((string)$data['time']);
if (!valid_email($email)) json_response(['error' => 'Invalid email address.'], 422);
if (!valid_phone($phone)) json_response(['error' => 'Invalid phone number.'], 422);
$dt = DateTime::createFromFormat('Y-m-d', $date);
if (!$dt || $dt->format('Y-m-d') !== $date) json_response(['error' => 'Invalid date.'], 422);
$today = new DateTime('today');
if ($dt < $today) json_response(['error' => 'Date must be in the future.'], 422);
$allowedWeekdays = get_allowed_weekdays($pdo);
if (!in_array((int)$dt->format('w'), $allowedWeekdays, true)) {
    json_response(['error' => 'That weekday is not bookable right now.'], 422);
}
if (day_is_blocked($pdo, $date)) json_response(['error' => 'That date is blocked.'], 409);
if (slot_is_unavailable($pdo, $date, $time)) json_response(['error' => 'That time slot is already taken.'], 409);
$id = 'bk_' . bin2hex(random_bytes(6));
$stmt = $pdo->prepare("INSERT INTO bookings (id, created_at, status, service, service_tier, vehicle_type, car, custom_request, name, email, phone, booking_date, booking_time, address) VALUES (?, NOW(), 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    $id,
    trim((string)$data['service']),
    trim((string)($data['service_tier'] ?? '')),
    trim((string)($data['vehicle_type'] ?? '')),
    trim((string)($data['car'] ?? '')),
    trim((string)($data['custom_request'] ?? '')),
    trim((string)$data['name']),
    $email,
    $phone,
    $date,
    $time,
    trim((string)($data['address'] ?? '')),
]);
json_response(['ok' => true, 'booking' => ['id' => $id, 'date' => $date, 'time' => $time]]);
