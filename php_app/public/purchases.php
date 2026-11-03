<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Enums/UserRole.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Csrf.php';
require_once __DIR__ . '/../app/Core/AuthMiddleware.php';
require_once __DIR__ . '/../app/Services/InventoryService.php';

use App\Core\AuthMiddleware;
use App\Core\Csrf;
use App\Core\Session;
use App\Enums\UserRole;
use App\Services\InventoryService;
use App\Config\Database;

// RBAC: Hanya Owner dan Manager yang boleh mengakses Restock
$currentUser = AuthMiddleware::requireRole(UserRole::OWNER, UserRole::MANAGER);
$userRole = UserRole::tryFrom($currentUser['role']);

$inventoryService = new InventoryService();
$db = Database::getConnection();

// Ambil Suppliers & Produk
$suppliers = $db->query("SELECT id, name, phone FROM suppliers ORDER BY name ASC")->fetchAll();
$products = $db->query("SELECT id, sku, name, purchase_price, stock FROM products ORDER BY name ASC")->fetchAll();

// Handle Form Submission Restock
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Csrf::validateToken($_POST['_csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token CSRF tidak valid.');
        header('Location: purchases.php');
        exit;
    }

    try {
        $supplierId = (int)($_POST['supplier_id'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');
        $productIds = $_POST['product_ids'] ?? [];
        $qtys = $_POST['qtys'] ?? [];
        $prices = $_POST['prices'] ?? [];

        $items = [];
        for ($i = 0; $i < count($productIds); $i++) {
            $pId = (int)$productIds[$i];
            $q = (int)($qtys[$i] ?? 0);
            $p = (float)($prices[$i] ?? 0);

            if ($pId > 0 && $q > 0) {
                $items[] = [
                    'product_id'     => $pId,
                    'qty'            => $q,
                    'purchase_price' => $p,
                ];
            }
        }

        $res = $inventoryService->processRestock((int)$currentUser['id'], $supplierId ?: null, $items, $notes);
        Session::setFlash('success', "Restock berhasil! Faktur Pembelian: {$res['purchase_code']}");
    } catch (Exception $e) {
        Session::setFlash('error', "Gagal memproses restock: " . $e->getMessage());
    }

    header('Location: purchases.php');
    exit;
}

// Ambil Riwayat Pembelian Terbaru
$recentPurchases = $db->query(
    "SELECT p.*, s.name AS supplier_name, u.full_name AS user_name 
     FROM purchases p 
     LEFT JOIN suppliers s ON p.supplier_id = s.id 
     JOIN users u ON p.user_id = u.id 
     ORDER BY p.id DESC LIMIT 20"
)->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Penerimaan Stok (Restock) - KASIR-UMKM Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen flex flex-col">

    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="fa-solid fa-truck-ramp-box"></i>
            </div>
            <div>
                <h1 class="font-bold text-lg text-slate-800 tracking-tight">Kedai ES Zefa</h1>
                <p class="text-xs text-slate-500">Penerimaan Barang Supplier & Penyesuaian HPP</p>
            </div>
        </div>

        <nav class="flex items-center space-x-2">
            <a href="pos.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-receipt"></i> Kasir (POS)
            </a>
            <a href="products.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked"></i> Produk
            </a>
            <a href="purchases.php" class="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-semibold text-sm flex items-center gap-2">
                <i class="fa-solid fa-truck-ramp-box"></i> Restock
            </a>
            <?php if ($userRole?->canAccessReports()): ?>
            <a href="reports.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-chart-line"></i> Laporan
            </a>
            <?php endif; ?>
            <?php if ($userRole?->canAccessUsers()): ?>
            <a href="users.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-users-gear"></i> Pengguna
            </a>
            <?php endif; ?>
        </nav>

        <div class="flex items-center space-x-4">
            <div class="text-right">
                <div class="text-sm font-bold text-slate-800"><?= htmlspecialchars($currentUser['full_name']) ?></div>
                <div class="text-xs text-amber-600 uppercase font-semibold"><?= $userRole?->label() ?></div>
            </div>
            <a href="logout.php" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Logout">
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
            </a>
        </div>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
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

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Form Input Restock (Kiri 60%) -->
            <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div class="border-b border-slate-100 pb-3 mb-4">
                    <h2 class="font-bold text-slate-800 text-base">Form Penerimaan Barang (Restock)</h2>
                    <p class="text-xs text-slate-500">Mencatat barang masuk dari supplier & update HPP rata-rata bergerak otomatis</p>
                </div>

                <form method="POST" id="restockForm" class="space-y-4 text-xs">
                    <?= Csrf::inputField() ?>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block font-semibold text-slate-700 mb-1">Supplier Pemasok</label>
                            <select name="supplier_id" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                                <option value="">-- Pilih Supplier --</option>
                                <?php foreach ($suppliers as $s): ?>
                                    <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['name']) ?> (<?= htmlspecialchars($s['phone'] ?? '-') ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label class="block font-semibold text-slate-700 mb-1">Catatan Penerimaan / No. Surat Jalan</label>
                            <input type="text" name="notes" placeholder="No. DO / Surat Jalan" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                        </div>
                    </div>

                    <!-- Item Restock Dinamis -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="font-bold text-slate-700">Daftar Barang Masuk</label>
                            <button type="button" onclick="addRestockRow()" class="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                <i class="fa-solid fa-plus-circle"></i> Tambah Baris
                            </button>
                        </div>

                        <div id="restockItemsContainer" class="space-y-2">
                            <!-- Template row -->
                            <div class="restock-row grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                <div class="col-span-5">
                                    <select name="product_ids[]" required onchange="onProductSelect(this)" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs">
                                        <option value="">-- Pilih Produk --</option>
                                        <?php foreach ($products as $p): ?>
                                            <option value="<?= $p['id'] ?>" data-price="<?= $p['purchase_price'] ?>" data-stock="<?= $p['stock'] ?>">
                                                <?= htmlspecialchars($p['name']) ?> (Stok: <?= $p['stock'] ?>)
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div class="col-span-3">
                                    <input type="number" name="qtys[]" required min="1" placeholder="Qty" oninput="calcRestockTotal()" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center text-xs">
                                </div>
                                <div class="col-span-3">
                                    <input type="number" name="prices[]" required min="0" placeholder="Harga Beli" oninput="calcRestockTotal()" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-right text-xs">
                                </div>
                                <div class="col-span-1 text-center">
                                    <button type="button" onclick="removeRestockRow(this)" class="text-slate-400 hover:text-rose-500">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Total Estimasi -->
                    <div class="p-3 rounded-xl bg-slate-100 flex items-center justify-between font-bold text-sm text-slate-800">
                        <span>Total Nilai Pembelian:</span>
                        <span id="labelTotalRestock" class="text-amber-700 font-extrabold">Rp 0</span>
                    </div>

                    <button type="submit" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm transition">
                        Simpan Penerimaan Barang & Update Stok
                    </button>
                </form>
            </div>

            <!-- Riwayat Restock Terakhir (Kanan 40%) -->
            <div class="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h2 class="font-bold text-slate-800 text-base mb-1">Riwayat Penerimaan Stok</h2>
                <p class="text-xs text-slate-500 mb-4">Daftar transaksi faktur restock masuk</p>

                <div class="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
                    <?php if (empty($recentPurchases)): ?>
                        <p class="text-center text-xs text-slate-400 py-8">Belum ada riwayat restock.</p>
                    <?php else: ?>
                        <?php foreach ($recentPurchases as $pur): ?>
                            <div class="py-3 text-xs">
                                <div class="flex justify-between items-start font-bold text-slate-800">
                                    <span><?= htmlspecialchars($pur['purchase_code']) ?></span>
                                    <span class="text-amber-700 font-black">Rp <?= number_format((float)$pur['total_amount'], 0, ',', '.') ?></span>
                                </div>
                                <div class="text-[11px] text-slate-500 mt-0.5">
                                    Supplier: <?= htmlspecialchars($pur['supplier_name'] ?? 'Umum') ?> &bull; <?= date('d M Y H:i', strtotime($pur['purchase_date'])) ?>
                                </div>
                                <div class="text-[10px] text-slate-400 mt-0.5">Petugas: <?= htmlspecialchars($pur['user_name']) ?></div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>

    <script>
        function addRestockRow() {
            const container = document.getElementById('restockItemsContainer');
            const firstRow = container.querySelector('.restock-row');
            const clone = firstRow.cloneNode(true);
            clone.querySelector('select').selectedIndex = 0;
            clone.querySelector('input[name="qtys[]"]').value = '';
            clone.querySelector('input[name="prices[]"]').value = '';
            container.appendChild(clone);
        }

        function removeRestockRow(btn) {
            const rows = document.querySelectorAll('.restock-row');
            if (rows.length > 1) {
                btn.closest('.restock-row').remove();
                calcRestockTotal();
            } else {
                alert('Minimal satu baris produk wajib diisi.');
            }
        }

        function onProductSelect(select) {
            const opt = select.options[select.selectedIndex];
            const price = opt.getAttribute('data-price') || 0;
            const row = select.closest('.restock-row');
            row.querySelector('input[name="prices[]"]').value = price;
            calcRestockTotal();
        }

        function calcRestockTotal() {
            let total = 0;
            document.querySelectorAll('.restock-row').forEach(row => {
                const qty = parseFloat(row.querySelector('input[name="qtys[]"]').value) || 0;
                const price = parseFloat(row.querySelector('input[name="prices[]"]').value) || 0;
                total += qty * price;
            });
            document.getElementById('labelTotalRestock').textContent = 'Rp ' + Number(total).toLocaleString('id-ID');
        }
    </script>
</body>
</html>
