<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
json_response(get_public_schedule($pdo));
