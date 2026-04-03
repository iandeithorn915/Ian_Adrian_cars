<?php
declare(strict_types=1);

function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function read_json_input(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_admin(): void {
    if (empty($_SESSION['admin_logged_in'])) {
        json_response(['error' => 'Unauthorized'], 401);
    }
}

function ensure_defaults(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS admin_settings (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS allowed_weekdays (
        weekday TINYINT UNSIGNED NOT NULL PRIMARY KEY
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS blocked_days (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS blocked_slots (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        slot VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_slot (date, slot)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(40) NOT NULL PRIMARY KEY,
        created_at DATETIME NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        service VARCHAR(255) NOT NULL,
        service_tier VARCHAR(100) NULL,
        vehicle_type VARCHAR(100) NULL,
        car VARCHAR(255) NULL,
        custom_request TEXT NULL,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time VARCHAR(100) NOT NULL,
        address TEXT NULL,
        KEY idx_booking_date_time_status (booking_date, booking_time, status)
    )");

    $exists = (int)$pdo->query("SELECT COUNT(*) FROM admin_settings WHERE id = 1")->fetchColumn();
    if ($exists === 0) {
        $stmt = $pdo->prepare("INSERT INTO admin_settings (id, password_hash) VALUES (1, ?)");
        $stmt->execute([password_hash('admin123', PASSWORD_DEFAULT)]);
    }

    $weekdayCount = (int)$pdo->query("SELECT COUNT(*) FROM allowed_weekdays")->fetchColumn();
    if ($weekdayCount === 0) {
        $stmt = $pdo->prepare("INSERT INTO allowed_weekdays (weekday) VALUES (?)");
        for ($i = 0; $i <= 6; $i++) {
            $stmt->execute([$i]);
        }
    }
}

function valid_email(string $email): bool {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    if (strpos($email, '..') !== false) {
        return false;
    }

    return true;
}

function valid_phone(string $phone): bool {
    $digits = preg_replace('/\D+/', '', $phone);
    return is_string($digits) && strlen($digits) >= 10;
}

function get_allowed_weekdays(PDO $pdo): array {
    return array_map(
        'intval',
        $pdo->query("SELECT weekday FROM allowed_weekdays ORDER BY weekday ASC")->fetchAll(PDO::FETCH_COLUMN)
    );
}

function get_public_schedule(PDO $pdo): array {
    $blockedDays = $pdo->query("SELECT date, reason FROM blocked_days ORDER BY date ASC")->fetchAll();
    $blockedSlots = $pdo->query("SELECT date, slot FROM blocked_slots ORDER BY date ASC, slot ASC")->fetchAll();
    $bookedSlots = $pdo->query("SELECT booking_date AS date, booking_time AS slot FROM bookings WHERE status <> 'cancelled' ORDER BY booking_date ASC, booking_time ASC")->fetchAll();

    return [
        'allowedWeekdays' => get_allowed_weekdays($pdo),
        'blockedDays' => $blockedDays,
        'blockedSlots' => $blockedSlots,
        'bookedSlots' => $bookedSlots,
    ];
}

function slot_is_unavailable(PDO $pdo, string $date, string $slot, ?string $ignoreBookingId = null): bool {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM blocked_slots WHERE date = ? AND slot = ?");
    $stmt->execute([$date, $slot]);

    if ((int)$stmt->fetchColumn() > 0) {
        return true;
    }

    $sql = "SELECT COUNT(*) FROM bookings WHERE booking_date = ? AND booking_time = ? AND status <> 'cancelled'";
    $params = [$date, $slot];

    if ($ignoreBookingId !== null) {
        $sql .= " AND id <> ?";
        $params[] = $ignoreBookingId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return (int)$stmt->fetchColumn() > 0;
}

function day_is_blocked(PDO $pdo, string $date): bool {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM blocked_days WHERE date = ?");
    $stmt->execute([$date]);
    return (int)$stmt->fetchColumn() > 0;
}