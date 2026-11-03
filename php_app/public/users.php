<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Enums/UserRole.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Csrf.php';
require_once __DIR__ . '/../app/Core/AuthMiddleware.php';

use App\Core\AuthMiddleware;
use App\Core\Csrf;
use App\Core\Session;
use App\Enums\UserRole;
use App\Config\Database;

// RBAC: Hanya Owner yang boleh mengelola pengguna sistem
$currentUser = AuthMiddleware::requireRole(UserRole::OWNER);
$userRole = UserRole::tryFrom($currentUser['role']);

$db = Database::getConnection();

// Handle Tambah / Update / Toggle Status
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Csrf::validateToken($_POST['_csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token CSRF tidak valid.');
        header('Location: users.php');
        exit;
    }

    $action = $_POST['action'] ?? '';

    try {
        if ($action === 'create') {
            $username = trim($_POST['username'] ?? '');
            $fullName = trim($_POST['full_name'] ?? '');
            $password = $_POST['password'] ?? '';
            $role     = $_POST['role'] ?? 'cashier';

            if (empty($username) || empty($password) || empty($fullName)) {
                throw new Exception("Seluruh kolom wajib diisi.");
            }

            // Enkripsi password menggunakan BCRYPT
            $hash = password_hash($password, PASSWORD_BCRYPT);

            $stmt = $db->prepare(
                "INSERT INTO users (username, password, full_name, role, is_active) 
                 VALUES (:username, :password, :full_name, :role, 1)"
            );
            $stmt->execute([
                ':username'  => $username,
                ':password'  => $hash,
                ':full_name' => $fullName,
                ':role'      => $role,
            ]);

            Session::setFlash('success', "Pengguna {$username} berhasil didaftarkan!");
        } elseif ($action === 'toggle_active') {
            $id = (int)$_POST['id'];
            if ($id === (int)$currentUser['id']) {
                throw new Exception("Anda tidak dapat menonaktifkan akun Anda sendiri!");
            }
            $stmt = $db->prepare("UPDATE users SET is_active = NOT is_active WHERE id = :id");
            $stmt->execute([':id' => $id]);
            Session::setFlash('success', "Status aktif pengguna berhasil diubah.");
        }
    } catch (Exception $e) {
        Session::setFlash('error', $e->getMessage());
    }

    header('Location: users.php');
    exit;
}

$users = $db->query("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen Pengguna (RBAC) - Kedai ES Zefa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen flex flex-col">

    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="fa-solid fa-users-gear"></i>
            </div>
            <div>
                <h1 class="font-bold text-lg text-slate-800 tracking-tight">Kedai ES Zefa</h1>
                <p class="text-xs text-slate-500">Manajemen Pengguna & Hak Akses (RBAC)</p>
            </div>
        </div>

        <nav class="flex items-center space-x-2">
            <a href="pos.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-receipt"></i> Kasir (POS)
            </a>
            <a href="products.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked"></i> Produk
            </a>
            <a href="purchases.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-truck-ramp-box"></i> Restock
            </a>
            <a href="reports.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-chart-line"></i> Laporan
            </a>
            <a href="users.php" class="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold text-sm flex items-center gap-2">
                <i class="fa-solid fa-users-gear"></i> Pengguna
            </a>
        </nav>

        <div class="flex items-center space-x-4">
            <div class="text-right">
                <div class="text-sm font-bold text-slate-800"><?= htmlspecialchars($currentUser['full_name']) ?></div>
                <div class="text-xs text-purple-600 uppercase font-semibold"><?= $userRole?->label() ?></div>
            </div>
            <a href="logout.php" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Logout">
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
            </a>
        </div>
    </header>

    <main class="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        <?php if ($msg = Session::getFlash('success')): ?>
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-600"></i> <?= htmlspecialchars($msg) ?>
            </div>
        <?php endif; ?>
        <?php if ($err = Session::getFlash('error')): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> <?= htmlspecialchars($err) ?>
            </div>
        <?php endif; ?>

        <!-- Form Tambah User -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 class="font-bold text-slate-800 text-base mb-1">Tambah Pengguna Baru</h2>
            <p class="text-xs text-slate-500 mb-4">Buat akun untuk kasir atau manajer operasional toko</p>

            <form method="POST" class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <?= Csrf::inputField() ?>
                <input type="hidden" name="action" value="create">

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                    <input type="text" name="full_name" required placeholder="Siti Aminah" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Username *</label>
                    <input type="text" name="username" required placeholder="siti_kasir" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Password *</label>
                    <div class="relative">
                        <input type="password" id="newUserPassword" name="password" required placeholder="Min. 6 karakter" class="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300">
                        <button type="button" onclick="togglePasswordVisibility('newUserPassword', this)" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1" title="Lihat password">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Role Hak Akses</label>
                    <select name="role" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                        <option value="cashier">Kasir (Hanya POS)</option>
                        <option value="manager">Manajer (POS + Inventaris + Laporan)</option>
                        <option value="owner">Pemilik (Akses Penuh)</option>
                    </select>
                </div>
                <div class="sm:col-span-4 flex justify-end">
                    <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-sm transition">
                        Daftarkan Pengguna
                    </button>
                </div>
            </form>
        </div>

        <!-- Tabel Daftar Pengguna -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                        <th class="py-3 px-4">Nama Pengguna</th>
                        <th class="py-3 px-4">Username</th>
                        <th class="py-3 px-4">Role Akses</th>
                        <th class="py-3 px-4 text-center">Status</th>
                        <th class="py-3 px-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php foreach ($users as $u): ?>
                        <tr class="hover:bg-slate-50/70 transition">
                            <td class="py-3 px-4 font-bold text-slate-800"><?= htmlspecialchars($u['full_name']) ?></td>
                            <td class="py-3 px-4 font-mono text-slate-600"><?= htmlspecialchars($u['username']) ?></td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase <?= $u['role'] === 'owner' ? 'bg-purple-100 text-purple-700' : ($u['role'] === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700') ?>">
                                    <?= htmlspecialchars($u['role']) ?>
                                </span>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold <?= $u['is_active'] ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700' ?>">
                                    <?= $u['is_active'] ? 'Aktif' : 'Nonaktif' ?>
                                </span>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <?php if ($u['id'] !== $currentUser['id']): ?>
                                    <form method="POST" class="inline">
                                        <?= Csrf::inputField() ?>
                                        <input type="hidden" name="action" value="toggle_active">
                                        <input type="hidden" name="id" value="<?= $u['id'] ?>">
                                        <button type="submit" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold">
                                            <?= $u['is_active'] ? 'Nonaktifkan' : 'Aktifkan' ?>
                                        </button>
                                    </form>
                                <?php else: ?>
                                    <span class="text-slate-400 text-[11px] italic">Sedang Digunakan</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </main>

    <script>
        function togglePasswordVisibility(inputId, btn) {
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');
            if (!input || !icon) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                btn.setAttribute('title', 'Sembunyikan password');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                btn.setAttribute('title', 'Lihat password');
            }
        }
    </script>
</body>
</html>
