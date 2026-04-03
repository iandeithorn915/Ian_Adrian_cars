<?php
require_once dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_admin();
json_response(['ok' => true]);
