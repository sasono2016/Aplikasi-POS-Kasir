<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Enums/UserRole.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Csrf.php';

use App\Config\Database;
use App\Core\Csrf;
use App\Core\Session;

Session::start();

// Jika sudah login, redirect langsung ke POS
if (Session::currentUser()) {
    header('Location: pos.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Csrf::validateToken($_POST['_csrf_token'] ?? '')) {
        $error = 'Validasi keamanan (CSRF) gagal. Silakan coba lagi.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($username) || empty($password)) {
            $error = 'Username dan password wajib diisi.';
        } else {
            $db = Database::getConnection();
            $stmt = $db->prepare("SELECT * FROM users WHERE username = :username AND is_active = 1 LIMIT 1");
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch();

            // Verifikasi Password Hash Bcrypt
            if ($user && password_verify($password, $user['password'])) {
                // Regenerasi session ID untuk mitigasi Session Fixation
                Session::regenerate();
                Session::set('user', [
                    'id'        => (int)$user['id'],
                    'username'  => $user['username'],
                    'full_name' => $user['full_name'],
                    'role'      => $user['role'],
                ]);

                header('Location: pos.php');
                exit;
            } else {
                $error = 'Username atau password salah, atau akun nonaktif.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Kedai ES Zefa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-100 font-sans min-h-screen flex items-center justify-center p-4">

    <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-200/80">
        <div class="text-center mb-6">
            <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-3">
                <i class="fa-solid fa-cash-register"></i>
            </div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">Kedai ES Zefa</h1>
            <p class="text-xs text-slate-500 mt-1">Sistem POS & Inventaris UMKM Modern PHP 8.3+</p>
        </div>

        <?php if ($error): ?>
            <div class="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-4 text-xs">
            <?= Csrf::inputField() ?>

            <div>
                <label class="block font-bold text-slate-700 mb-1">Username</label>
                <div class="relative">
                    <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-slate-400"></i>
                    <input 
                        type="text" 
                        name="username" 
                        required 
                        placeholder="owner atau kasir"
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                </div>
            </div>

            <div>
                <label class="block font-bold text-slate-700 mb-1">Password</label>
                <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-400"></i>
                    <input 
                        type="password" 
                        name="password" 
                        required 
                        placeholder="••••••••"
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                </div>
            </div>

            <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition">
                Masuk ke Aplikasi
            </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
            <p class="font-semibold text-slate-600 mb-1">Akun Default Demo:</p>
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
                <div>Owner : <span class="font-bold text-slate-800">owner</span> / <span class="font-bold text-slate-800">password123</span></div>
                <div>Kasir : <span class="font-bold text-slate-800">kasir</span> / <span class="font-bold text-slate-800">password123</span></div>
            </div>
        </div>
    </div>

</body>
</html>
