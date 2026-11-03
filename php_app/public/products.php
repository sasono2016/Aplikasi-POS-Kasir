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

// RBAC: Hanya Owner dan Manager yang boleh mengelola Master Produk
$currentUser = AuthMiddleware::requireRole(UserRole::OWNER, UserRole::MANAGER);
$userRole = UserRole::tryFrom($currentUser['role']);

$inventoryService = new InventoryService();
$db = Database::getConnection();

// Ambil Kategori untuk dropdown
$categories = $db->query("SELECT id, name FROM categories ORDER BY name ASC")->fetchAll();

// Handle Actions (Create, Update, Delete)
$action = $_POST['action'] ?? $_GET['action'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Csrf::validateToken($_POST['_csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token CSRF tidak valid.');
        header('Location: products.php');
        exit;
    }

    try {
        if ($action === 'create') {
            $inventoryService->createProduct([
                'category_id'    => $_POST['category_id'] ?: null,
                'sku'            => $_POST['sku'],
                'name'           => $_POST['name'],
                'image_url'      => $_POST['image_url'],
                'purchase_price' => $_POST['purchase_price'],
                'selling_price'  => $_POST['selling_price'],
                'stock'          => $_POST['stock'],
                'min_stock'      => $_POST['min_stock'],
            ]);
            Session::setFlash('success', 'Produk berhasil ditambahkan!');
        } elseif ($action === 'update') {
            $id = (int)$_POST['id'];
            $inventoryService->updateProduct($id, [
                'category_id'    => $_POST['category_id'] ?: null,
                'sku'            => $_POST['sku'],
                'name'           => $_POST['name'],
                'image_url'      => $_POST['image_url'],
                'purchase_price' => $_POST['purchase_price'],
                'selling_price'  => $_POST['selling_price'],
                'stock'          => $_POST['stock'],
                'min_stock'      => $_POST['min_stock'],
            ]);
            Session::setFlash('success', 'Produk berhasil diperbarui!');
        } elseif ($action === 'delete') {
            $id = (int)$_POST['id'];
            $inventoryService->deleteProduct($id);
            Session::setFlash('success', 'Produk berhasil dihapus!');
        }
    } catch (Exception $e) {
        Session::setFlash('error', $e->getMessage());
    }

    header('Location: products.php');
    exit;
}

$search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
$catId  = filter_input(INPUT_GET, 'category', FILTER_VALIDATE_INT) ?: null;
$products = $inventoryService->getProducts($search ?: null, $catId);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen Produk & Stok - Kedai ES Zefa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Header -->
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div>
                <h1 class="font-bold text-lg text-slate-800 tracking-tight">Kedai ES Zefa</h1>
                <p class="text-xs text-slate-500">Manajemen Inventaris & Katalog Produk</p>
            </div>
        </div>

        <nav class="flex items-center space-x-2">
            <a href="pos.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-receipt"></i> Kasir (POS)
            </a>
            <a href="products.php" class="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked"></i> Produk
            </a>
            <a href="purchases.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
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
                <div class="text-xs text-blue-600 uppercase font-semibold"><?= $userRole?->label() ?></div>
            </div>
            <a href="logout.php" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Logout">
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
            </a>
        </div>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-5">
        <!-- Flash Alert Messages -->
        <?php if ($successMsg = Session::getFlash('success')): ?>
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-emerald-600"></i> <?= htmlspecialchars($successMsg) ?>
            </div>
        <?php endif; ?>
        <?php if ($errorMsg = Session::getFlash('error')): ?>
            <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> <?= htmlspecialchars($errorMsg) ?>
            </div>
        <?php endif; ?>

        <!-- Action Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-black text-slate-900">Katalog Produk UMKM</h2>
                <p class="text-xs text-slate-500">Kelola informasi produk, harga pokok (HPP), harga jual, dan stok barang</p>
            </div>
            <button onclick="openProductModal()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm">
                <i class="fa-solid fa-plus"></i> Tambah Produk Baru
            </button>
        </div>

        <!-- Tabel Produk -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                            <th class="py-3 px-4">Produk</th>
                            <th class="py-3 px-4">SKU</th>
                            <th class="py-3 px-4">Kategori</th>
                            <th class="py-3 px-4 text-right">Harga Beli (HPP)</th>
                            <th class="py-3 px-4 text-right">Harga Jual</th>
                            <th class="py-3 px-4 text-center">Stok</th>
                            <th class="py-3 px-4 text-center">Status</th>
                            <th class="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($products)): ?>
                            <tr>
                                <td colspan="8" class="text-center py-10 text-slate-400">Tidak ada data produk.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($products as $prod): ?>
                                <?php 
                                    $isOutOfStock = (int)$prod['stock'] <= 0;
                                    $isLowStock = (int)$prod['stock'] <= (int)$prod['min_stock'] && !$isOutOfStock;
                                ?>
                                <tr class="hover:bg-slate-50/70 transition">
                                    <td class="py-3 px-4">
                                        <div class="flex items-center space-x-3">
                                            <img src="<?= htmlspecialchars($prod['image_url'] ?: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100') ?>" alt="" class="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200">
                                            <div>
                                                <div class="font-bold text-slate-800"><?= htmlspecialchars($prod['name']) ?></div>
                                                <div class="text-[10px] text-slate-400">Min. Alert: <?= $prod['min_stock'] ?> pcs</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 font-mono font-semibold text-slate-600"><?= htmlspecialchars($prod['sku']) ?></td>
                                    <td class="py-3 px-4 text-slate-600"><?= htmlspecialchars($prod['category_name'] ?? '-') ?></td>
                                    <td class="py-3 px-4 text-right text-slate-600">Rp <?= number_format((float)$prod['purchase_price'], 0, ',', '.') ?></td>
                                    <td class="py-3 px-4 text-right font-bold text-emerald-600">Rp <?= number_format((float)$prod['selling_price'], 0, ',', '.') ?></td>
                                    <td class="py-3 px-4 text-center font-black <?= $isOutOfStock ? 'text-rose-600' : ($isLowStock ? 'text-amber-600' : 'text-slate-800') ?>">
                                        <?= $prod['stock'] ?>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <?php if ($isOutOfStock): ?>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Habis</span>
                                        <?php elseif ($isLowStock): ?>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Menipis</span>
                                        <?php else: ?>
                                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Aman</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex items-center justify-center space-x-1">
                                            <button onclick="editProduct(<?= htmlspecialchars(json_encode($prod)) ?>)" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Edit">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <form method="POST" onsubmit="return confirm('Yakin ingin menghapus produk ini?');" class="inline">
                                                <?= Csrf::inputField() ?>
                                                <input type="hidden" name="action" value="delete">
                                                <input type="hidden" name="id" value="<?= $prod['id'] ?>">
                                                <button type="submit" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus">
                                                    <i class="fa-solid fa-trash"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Modal Form Tambah/Edit Produk -->
    <div id="productModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 class="font-bold text-base text-slate-900" id="modalTitle">Tambah Produk Baru</h3>
                <button onclick="closeProductModal()" class="text-slate-400 hover:text-slate-600">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <form method="POST" id="productForm" class="space-y-3.5 text-xs">
                <?= Csrf::inputField() ?>
                <input type="hidden" name="action" id="formAction" value="create">
                <input type="hidden" name="id" id="productId" value="">

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nama Produk *</label>
                    <input type="text" name="name" id="pName" required placeholder="Contoh: Kopi Susu Aren" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">SKU / Kode Unik *</label>
                        <input type="text" name="sku" id="pSku" required placeholder="PRD-001" class="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Kategori</label>
                        <select name="category_id" id="pCategory" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                            <option value="">-- Pilih Kategori --</option>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Harga Beli (HPP) *</label>
                        <input type="number" name="purchase_price" id="pPurchasePrice" required min="0" placeholder="0" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-right">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Harga Jual Kasir *</label>
                        <input type="number" name="selling_price" id="pSellingPrice" required min="0" placeholder="0" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-right font-bold text-emerald-600">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Stok Awal Saat Ini *</label>
                        <input type="number" name="stock" id="pStock" required min="0" value="0" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Ambang Stok Minimum</label>
                        <input type="number" name="min_stock" id="pMinStock" value="5" class="w-full px-3 py-2 rounded-lg border border-slate-300">
                    </div>
                </div>

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">URL Gambar Produk</label>
                    <input type="url" name="image_url" id="pImage" placeholder="https://..." class="w-full px-3 py-2 rounded-lg border border-slate-300">
                </div>

                <div class="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                    <button type="button" onclick="closeProductModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Batal</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Simpan Produk</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openProductModal() {
            document.getElementById('modalTitle').textContent = 'Tambah Produk Baru';
            document.getElementById('formAction').value = 'create';
            document.getElementById('productId').value = '';
            document.getElementById('productForm').reset();
            document.getElementById('productModal').classList.remove('hidden');
        }

        function closeProductModal() {
            document.getElementById('productModal').classList.add('hidden');
        }

        function editProduct(prod) {
            document.getElementById('modalTitle').textContent = 'Edit Data Produk';
            document.getElementById('formAction').value = 'update';
            document.getElementById('productId').value = prod.id;
            document.getElementById('pName').value = prod.name;
            document.getElementById('pSku').value = prod.sku;
            document.getElementById('pCategory').value = prod.category_id || '';
            document.getElementById('pPurchasePrice').value = prod.purchase_price;
            document.getElementById('pSellingPrice').value = prod.selling_price;
            document.getElementById('pStock').value = prod.stock;
            document.getElementById('pMinStock').value = prod.min_stock;
            document.getElementById('pImage').value = prod.image_url || '';
            document.getElementById('productModal').classList.remove('hidden');
        }
    </script>
</body>
</html>
