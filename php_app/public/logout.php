<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/Core/Session.php';

use App\Core\Session;

Session::destroy();
header('Location: login.php');
exit;
