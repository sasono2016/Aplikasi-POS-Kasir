<?php
declare(strict_types=1);

require_once __DIR__ . '/../app/Core/Session.php';

use App\Core\Session;

Session::start();

// Jika sudah ada user di sesi, arahkan ke POS, jika belum arahkan ke Login
if (Session::currentUser()) {
    header('Location: pos.php');
} else {
    header('Location: login.php');
}
exit;
