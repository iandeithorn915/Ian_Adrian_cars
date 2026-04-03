<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
$data = get_public_schedule($pdo);
$data['bookings'] = $pdo->query("SELECT id, status, service, service_tier, vehicle_type, car, custom_request, name, email, phone, booking_date AS date, booking_time AS time, address, created_at FROM bookings ORDER BY booking_date ASC, booking_time ASC, created_at DESC")->fetchAll();
$data['blockedDays'] = $pdo->query("SELECT id, date, reason FROM blocked_days ORDER BY date ASC")->fetchAll();
$data['blockedSlots'] = $pdo->query("SELECT id, date, slot FROM blocked_slots ORDER BY date ASC, slot ASC")->fetchAll();
json_response($data);
