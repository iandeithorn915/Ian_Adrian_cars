<?php
declare(strict_types=1);

require_once __DIR__ . '/../../includes/bootstrap.php';

require_admin();

$input = read_json_input();
$id = trim((string)($input['id'] ?? ''));

if ($id === '') {
    json_response(['error' => 'Missing booking id.'], 400);
}

$stmt = $pdo->prepare("
    SELECT id, name, email, phone, service, service_tier, vehicle_type, car, custom_request, booking_date, booking_time, address, status
    FROM bookings
    WHERE id = ?
    LIMIT 1
");
$stmt->execute([$id]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$booking) {
    json_response(['error' => 'Booking not found.'], 404);
}

if (($booking['status'] ?? '') === 'cancelled') {
    json_response(['error' => 'Cannot resend a cancelled booking confirmation.'], 400);
}

$to = $booking['email'];
$subject = 'Booking Confirmation - Ian & Adrian Car Cleaning';

$message = "Hello " . $booking['name'] . ",\n\n";
$message .= "Your booking is confirmed.\n\n";
$message .= "Service: " . ($booking['service'] ?? '') . "\n";
$message .= "Tier: " . ($booking['service_tier'] ?? '') . "\n";
$message .= "Vehicle Type: " . ($booking['vehicle_type'] ?? '') . "\n";
$message .= "Vehicle: " . ($booking['car'] ?? '') . "\n";
$message .= "Date: " . ($booking['booking_date'] ?? '') . "\n";
$message .= "Time: " . ($booking['booking_time'] ?? '') . "\n";
$message .= "Address: " . ($booking['address'] ?? '') . "\n";
$message .= "Phone: " . ($booking['phone'] ?? '') . "\n";

if (!empty($booking['custom_request'])) {
    $message .= "Custom Request: " . $booking['custom_request'] . "\n";
}

$message .= "\nThank you,\nIan & Adrian Car Cleaning";

$headers = "From: noreply@yourdomain.com\r\n";
$headers .= "Reply-To: noreply@yourdomain.com\r\n";

$sent = mail($to, $subject, $message, $headers);

if (!$sent) {
    json_response(['error' => 'Mail sending failed on this server.'], 500);
}

json_response(['success' => true, 'message' => 'Confirmation resent to ' . $to]);