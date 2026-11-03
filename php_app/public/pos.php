<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Enums/UserRole.php';
require_once __DIR__ . '/../app/Enums/PaymentMethod.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/Csrf.php';
require_once __DIR__ . '/../app/Core/AuthMiddleware.php';
require_once __DIR__ . '/../app/Services/PosService.php';
require_once __DIR__ . '/../app/Services/InventoryService.php';

use App\Core\AuthMiddleware;
use App\Core\Csrf;
use App\Core\Session;
use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use App\Services\InventoryService;
use App\Services\PosService;

// RBAC: Semua role (Cashier, Manager, Owner) boleh mengakses halaman POS
$currentUser = AuthMiddleware::requireAuth();
$userRole = UserRole::tryFrom($currentUser['role']);

$inventoryService = new InventoryService();
$posService = new PosService();

// Ambil Kategori dan Produk
$search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
$catId = filter_input(INPUT_GET, 'category', FILTER_VALIDATE_INT) ?: null;
$products = $inventoryService->getProducts($search ?: null, $catId);

// Handle Checkout POST via AJAX / Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'checkout') {
    header('Content-Type: application/json');
    if (!Csrf::validateToken($_POST['_csrf_token'] ?? '')) {
        echo json_encode(['success' => false, 'message' => 'Token CSRF tidak valid!']);
        exit;
    }

    try {
        $rawItems = json_decode($_POST['cart_items'] ?? '[]', true);
        $discount = (float)($_POST['discount'] ?? 0);
        $payAmount = (float)($_POST['pay_amount'] ?? 0);
        $method = PaymentMethod::tryFrom($_POST['payment_method'] ?? 'cash') ?? PaymentMethod::CASH;

        $receipt = $posService->processCheckout(
            (int)$currentUser['id'],
            $rawItems,
            $discount,
            $payAmount,
            $method
        );

        echo json_encode(['success' => true, 'receipt' => $receipt]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS Kedai ES Zefa</title>
    <!-- Tailwind CSS & FontAwesome CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        /* Format Struk Kertas Roll Khusus Printer Thermal Portabel 58mm & 80mm */
        @media print {
            @page {
                size: 58mm auto;
                margin: 0;
            }
            body {
                width: 58mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                color: #000 !important;
                font-family: 'Courier New', Courier, monospace !important;
            }
            body * { visibility: hidden; }
            #receiptThermalRoll, #receiptThermalRoll * { visibility: visible; }
            #receiptThermalRoll {
                position: absolute;
                left: 0;
                top: 0;
                width: 58mm !important;
                margin: 0 !important;
                padding: 2mm 3mm 8mm 3mm !important;
                display: block !important;
                background: #fff !important;
                color: #000 !important;
            }
            .no-print { display: none !important; }
        }

        .thermal-roll-paper {
            font-family: 'Courier New', Courier, monospace;
            background: #fff;
            color: #000;
        }
    </style>
</head>
<body class="bg-slate-100 font-sans text-slate-800 antialiased h-screen flex flex-col">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print shadow-xs">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="fa-solid fa-cash-register"></i>
            </div>
            <div>
                <h1 class="font-bold text-lg text-slate-800 tracking-tight">Kedai ES Zefa</h1>
                <p class="text-xs text-slate-500">Terminal Kasir POS </p>
            </div>
        </div>

        <!-- Navigation Menu based on RBAC -->
        <nav class="flex items-center space-x-2">
            <a href="pos.php" class="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center gap-2">
                <i class="fa-solid fa-receipt"></i> Kasir (POS)
            </a>
            <?php if ($userRole?->canAccessInventory()): ?>
            <a href="products.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked"></i> Produk
            </a>
            <a href="purchases.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-truck-ramp-box"></i> Restock
            </a>
            <?php endif; ?>
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

        <!-- User Profile & Logout -->
        <div class="flex items-center space-x-4">
            <div class="text-right">
                <div class="text-sm font-bold text-slate-800"><?= htmlspecialchars($currentUser['full_name']) ?></div>
                <div class="text-xs text-emerald-600 uppercase font-semibold"><?= $userRole?->label() ?></div>
            </div>
            <a href="logout.php" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Logout">
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
            </a>
        </div>
    </header>

    <!-- Main Content Area: Left Product Grid (65%), Right Cart Drawer (35%) -->
    <div class="flex-1 flex overflow-hidden">
        
        <!-- Sisi Kiri: Katalog Produk & Filter -->
        <section class="flex-1 flex flex-col p-6 overflow-hidden">
            <!-- Search & Category Filters -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div class="relative flex-1 min-w-[240px]">
                    <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                    <input 
                        type="text" 
                        id="searchProduct" 
                        placeholder="Cari nama produk atau SKU (Ketik otomatis)..." 
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition shadow-2xs"
                        value="<?= htmlspecialchars($search) ?>"
                    >
                </div>
                <div class="flex items-center space-x-2 overflow-x-auto pb-1" id="categoryTabs">
                    <button onclick="filterCategory(null)" class="category-chip px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white transition shadow-xs">
                        Semua Menu
                    </button>
                    <!-- Kategori Dinamis -->
                    <button onclick="filterCategory(1)" class="category-chip px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition">
                        Kopi & Minuman
                    </button>
                    <button onclick="filterCategory(2)" class="category-chip px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition">
                        Makanan & Snack
                    </button>
                    <button onclick="filterCategory(3)" class="category-chip px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition">
                        Sembako & Retail
                    </button>
                </div>
            </div>

            <!-- Grid Produk -->
            <div class="flex-1 overflow-y-auto pr-1">
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="productGrid">
                    <?php if (empty($products)): ?>
                        <div class="col-span-full py-16 text-center text-slate-400">
                            <i class="fa-solid fa-box-open text-5xl mb-3 text-slate-300"></i>
                            <p class="text-sm font-medium">Tidak ada produk yang cocok dengan pencarian.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($products as $prod): ?>
                            <?php 
                                $isOutOfStock = (int)$prod['stock'] <= 0;
                                $isLowStock = (int)$prod['stock'] <= (int)$prod['min_stock'] && !$isOutOfStock;
                            ?>
                            <div 
                                class="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden <?= $isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400' ?>"
                                onclick="<?= $isOutOfStock ? 'return false;' : 'addToCart(' . htmlspecialchars(json_encode($prod)) . ')' ?>"
                            >
                                <!-- Gambar Produk -->
                                <div class="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative mb-2.5">
                                    <img 
                                        src="<?= htmlspecialchars($prod['image_url'] ?: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400') ?>" 
                                        alt="<?= htmlspecialchars($prod['name']) ?>" 
                                        class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        loading="lazy"
                                    >
                                    <span class="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold <?= $isOutOfStock ? 'bg-rose-500 text-white' : ($isLowStock ? 'bg-amber-500 text-white' : 'bg-slate-900/70 text-white backdrop-blur-xs') ?>">
                                        Stok: <?= $prod['stock'] ?>
                                    </span>
                                </div>

                                <!-- Nama & SKU -->
                                <div>
                                    <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400"><?= htmlspecialchars($prod['sku']) ?></span>
                                    <h3 class="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-600 transition"><?= htmlspecialchars($prod['name']) ?></h3>
                                </div>

                                <!-- Harga & Tombol Tambah -->
                                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                    <span class="font-extrabold text-emerald-600 text-sm">
                                        Rp <?= number_format((float)$prod['selling_price'], 0, ',', '.') ?>
                                    </span>
                                    <button 
                                        class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shadow-2xs"
                                        <?= $isOutOfStock ? 'disabled' : '' ?>
                                    >
                                        <i class="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- Sisi Kanan: Panel Keranjang Belanja (Cart) -->
        <aside class="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg">
            <!-- Header Cart -->
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div class="flex items-center space-x-2">
                    <i class="fa-solid fa-cart-shopping text-emerald-600"></i>
                    <h2 class="font-bold text-slate-800">Keranjang Belanja</h2>
                </div>
                <button onclick="clearCart()" class="text-xs font-semibold text-rose-500 hover:text-rose-700 transition" id="clearCartBtn">
                    Kosongkan
                </button>
            </div>

            <!-- List Item Keranjang -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3" id="cartItemList">
                <div class="h-full flex flex-col items-center justify-center text-slate-400 py-12" id="emptyCartMessage">
                    <i class="fa-solid fa-basket-shopping text-4xl mb-2 text-slate-300"></i>
                    <p class="text-xs font-medium">Keranjang masih kosong.</p>
                    <p class="text-[11px] text-slate-400">Pilih produk di katalog untuk ditambahkan.</p>
                </div>
            </div>

            <!-- Panel Kalkulasi Pembayaran & Kembalian Real-time -->
            <div class="p-5 border-t border-slate-200 bg-slate-50 space-y-3 text-sm">
                <!-- Subtotal & Diskon -->
                <div class="flex justify-between text-slate-600 text-xs">
                    <span>Subtotal:</span>
                    <span id="labelSubtotal" class="font-semibold text-slate-800">Rp 0</span>
                </div>
                <div class="flex items-center justify-between text-slate-600 text-xs">
                    <span>Diskon (Rp):</span>
                    <input 
                        type="number" 
                        id="inputDiscount" 
                        value="0" 
                        min="0" 
                        class="w-24 px-2 py-1 text-right text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500"
                        oninput="calculateCart()"
                    >
                </div>
                <div class="flex justify-between items-center text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span id="labelGrandTotal" class="text-emerald-700 text-lg font-black">Rp 0</span>
                </div>

                <!-- Pilihan Metode Pembayaran -->
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                    <div class="grid grid-cols-3 gap-2">
                        <label class="flex flex-col items-center p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 cursor-pointer text-xs has-checked:border-emerald-600 has-checked:bg-emerald-50/50 has-checked:text-emerald-800">
                            <input type="radio" name="payment_method" value="cash" checked class="hidden" onchange="togglePaymentMethod()">
                            <i class="fa-solid fa-money-bill-wave mb-1 text-emerald-600"></i>
                            <span class="font-semibold">Tunai</span>
                        </label>
                        <label class="flex flex-col items-center p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 cursor-pointer text-xs has-checked:border-emerald-600 has-checked:bg-emerald-50/50 has-checked:text-emerald-800">
                            <input type="radio" name="payment_method" value="qris" class="hidden" onchange="togglePaymentMethod()">
                            <i class="fa-solid fa-qrcode mb-1 text-sky-600"></i>
                            <span class="font-semibold">QRIS</span>
                        </label>
                        <label class="flex flex-col items-center p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 cursor-pointer text-xs has-checked:border-emerald-600 has-checked:bg-emerald-50/50 has-checked:text-emerald-800">
                            <input type="radio" name="payment_method" value="transfer" class="hidden" onchange="togglePaymentMethod()">
                            <i class="fa-solid fa-building-columns mb-1 text-indigo-600"></i>
                            <span class="font-semibold">Transfer</span>
                        </label>
                    </div>
                </div>

                <!-- Input Uang Bayar & Kembalian Real-time (JavaScript) -->
                <div id="cashInputSection" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-700">Nominal Uang Bayar:</span>
                        <div class="flex gap-1">
                            <button type="button" onclick="setExactPay()" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-semibold">Uang Pas</button>
                            <button type="button" onclick="addPay(50000)" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-semibold">+50rb</button>
                            <button type="button" onclick="addPay(100000)" class="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 font-semibold">+100rb</button>
                        </div>
                    </div>
                    <input 
                        type="number" 
                        id="inputPayAmount" 
                        placeholder="Rp 0" 
                        class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-right font-bold text-slate-800 text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        oninput="calculateChange()"
                    >
                    <div class="flex justify-between items-center text-xs font-semibold pt-1">
                        <span class="text-slate-600">Kembalian:</span>
                        <span id="labelChangeAmount" class="text-slate-900 font-bold">Rp 0</span>
                    </div>
                </div>

                <!-- Tombol Submit Transaksi Selesai -->
                <button 
                    id="btnCheckout" 
                    onclick="submitTransaction()" 
                    disabled 
                    class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                    <i class="fa-solid fa-check"></i> Proses Pembayaran
                </button>
            </div>
        </aside>
    </div>

    <!-- Modal Nota / Struk Penjualan Khusus Printer Portabel Thermal (58mm / 80mm) -->
    <div id="receiptModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs hidden z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative my-auto">
            
            <!-- Controls Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-800 text-white mb-3">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-print text-emerald-400"></i>
                    <h3 class="font-bold text-xs">Struk Printer Portabel Kasir</h3>
                </div>
                <div class="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                    <button type="button" onclick="setPaperSize('58mm')" id="btnPaper58" class="px-2 py-0.5 rounded font-bold bg-emerald-600 text-white">58mm</button>
                    <button type="button" onclick="setPaperSize('80mm')" id="btnPaper80" class="px-2 py-0.5 rounded font-bold text-slate-400">80mm</button>
                </div>
            </div>

            <!-- Tampilan Kertas Struk Thermal Roll (Preview Nyata) -->
            <div class="flex justify-center my-2">
                <div id="receiptThermalRoll" class="thermal-roll-paper bg-white text-black p-3.5 shadow-xl border border-slate-300 w-[240px] text-[11px] leading-tight select-text">
                    <!-- Struk Header Toko -->
                    <div class="text-center">
                        <div class="font-black text-xs uppercase tracking-tight">Kedai ES Zefa</div>
                        <div class="text-[9px] text-slate-700">Jl. Ili Kp.Kranggan</div>
                        <div class="text-[9px] text-slate-700">Telp: 0812-</div>
                    </div>

                    <div style="border-top: 1px double #000; margin: 6px 0;"></div>

                    <!-- Meta Struk -->
                    <div class="text-[9px] space-y-0.5">
                        <div class="flex justify-between">
                            <span>No:</span>
                            <span class="font-bold" id="receiptInvoice">INV-20261029-0001</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tgl:</span>
                            <span id="receiptDate">29-10-2026 23:30</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Kasir:</span>
                            <span><?= htmlspecialchars($currentUser['full_name']) ?></span>
                        </div>
                    </div>

                    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

                    <!-- Struk Items -->
                    <div class="space-y-1.5 max-h-48 overflow-y-auto" id="receiptItems">
                        <!-- Diisi via JS -->
                    </div>

                    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

                    <!-- Struk Totals -->
                    <div class="space-y-0.5 text-[10px]">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span id="receiptSubtotal">Rp 0</span>
                        </div>
                        <div class="flex justify-between" id="receiptDiscountRow">
                            <span>Diskon:</span>
                            <span id="receiptDiscount" class="text-rose-600">-Rp 0</span>
                        </div>
                        <div class="flex justify-between font-black text-xs pt-0.5 my-0.5 border-t border-dotted border-black">
                            <span>TOTAL:</span>
                            <span id="receiptGrandTotal">Rp 0</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Bayar (<span id="receiptMethod">CASH</span>):</span>
                            <span id="receiptPay">Rp 0</span>
                        </div>
                        <div class="flex justify-between font-bold">
                            <span>Kembali:</span>
                            <span id="receiptChange">Rp 0</span>
                        </div>
                    </div>

                    <div style="border-top: 1px double #000; margin: 6px 0;"></div>

                    <!-- Struk Barcode & Footer -->
                    <div class="text-center space-y-1">
                        <div class="tracking-widest font-bold text-[10px]" id="receiptBarcode">*INV*</div>
                        <div class="text-[8px] text-slate-600">
                            <div>Terima kasih atas kunjungan Anda!</div>
                            <div>Barang yang dibeli tidak dapat ditukar.</div>
                            <div class="text-[7.5px] text-slate-400 mt-0.5">Kedai ES Zefa &bull; Portable POS Edition</div>
                        </div>
                    </div>

                    <!-- Feed space for paper cut -->
                    <div style="height: 12mm;"></div>
                </div>
            </div>

            <!-- Tombol Aksi Cetak Thermal -->
            <div class="mt-4 space-y-2 no-print">
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="printThermalPopup()" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md">
                        <i class="fa-solid fa-print"></i> Cetak via Popup
                    </button>
                    <button type="button" onclick="window.print()" class="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700">
                        <i class="fa-solid fa-receipt"></i> Cetak Browser
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="copyReceiptWhatsApp()" class="py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700">
                        <i class="fa-brands fa-whatsapp text-emerald-400"></i> Salin WhatsApp
                    </button>
                    <button type="button" onclick="closeReceiptModal()" class="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-check text-emerald-400"></i> Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Dynamic QRIS Midtrans POS -->
    <div id="midtransModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-xs hidden z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
            <!-- Header Midtrans -->
            <div class="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-qrcode text-lg"></i>
                        <div>
                            <h3 class="font-black text-sm">Midtrans QRIS GoPay</h3>
                            <p class="text-[10px] text-sky-100">Customer-Facing POS Terminal</p>
                        </div>
                    </div>
                    <button type="button" onclick="cancelMidtransQris()" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between mt-2.5 text-[9px] font-bold">
                    <span class="px-2 py-0.5 rounded-full bg-white/20">SANDBOX SIMULATOR</span>
                    <span class="font-mono text-sky-200">NMID: ID1020038921829</span>
                </div>
            </div>

            <!-- Body QRIS -->
            <div class="p-5 text-center space-y-3">
                <div>
                    <h4 class="text-sm font-black text-slate-900 uppercase">Kedai ES Zefa</h4>
                    <p class="text-[10px] text-slate-500 font-mono" id="midtransOrderIdText">INV-...</p>
                </div>

                <div class="relative inline-block p-3 bg-white rounded-2xl border-2 border-slate-900 shadow">
                    <div class="flex items-center justify-between border-b pb-1 mb-1.5 text-[8px] font-bold">
                        <span class="text-red-600 font-black">QRIS</span>
                        <span class="text-sky-600">GoPay &bull; GPN</span>
                    </div>
                    <div id="midtransQrContainer" class="flex justify-center my-1">
                        <img id="midtransQrImg" src="" alt="Midtrans QRIS" class="w-48 h-48 object-contain">
                    </div>
                </div>

                <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                    <span class="text-[10px] font-bold text-slate-500 block uppercase">Total Tagihan</span>
                    <span id="midtransAmountText" class="text-xl font-black text-emerald-600">Rp 0</span>
                    <div class="text-[10px] text-amber-700 font-bold mt-0.5" id="midtransTimerText">
                        ⏱️ Berlaku: 15:00
                    </div>
                </div>

                <div class="p-2 rounded-lg bg-sky-50 border border-sky-100 text-left text-[10px]">
                    <span class="font-bold text-sky-950 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-sky-600 animate-ping"></span> Menunggu Konsumen Memindai...
                    </span>
                    <p class="text-slate-500 mt-0.5">Dapat dibayar via GoPay, BCA, ShopeePay, Dana, m-Banking.</p>
                </div>

                <!-- Sandbox Simulator Controls -->
                <div class="pt-2 border-t border-slate-100 space-y-1.5 text-left text-[11px]">
                    <span class="font-bold text-slate-700 text-[10px]"><i class="fa-solid fa-bolt text-amber-500"></i> Simulator Uji Sandbox POS</span>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button type="button" onclick="simulateMidtransSuccess()" class="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold">
                            <i class="fa-solid fa-check"></i> Simulasi Bayar
                        </button>
                        <button type="button" onclick="cancelMidtransQris()" class="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                            Batalkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Hidden CSRF Token -->
    <?= Csrf::inputField() ?>

    <!-- JavaScript POS Cart & Checkout Logic -->
    <script>
        let cart = [];
        const csrfToken = document.querySelector('input[name="_csrf_token"]').value;

        function formatRupiah(number) {
            return 'Rp ' + Number(number).toLocaleString('id-ID');
        }

        // Tambah produk ke keranjang belanja
        function addToCart(product) {
            const existingIndex = cart.findIndex(item => item.id === product.id);
            const currentQty = existingIndex >= 0 ? cart[existingIndex].qty : 0;

            // Validasi Stok di Client
            if (currentQty + 1 > product.stock) {
                alert(`Stok tidak mencukupi! Sisa stok produk "${product.name}" hanya ${product.stock}.`);
                return;
            }

            if (existingIndex >= 0) {
                cart[existingIndex].qty += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: parseFloat(product.selling_price),
                    stock: parseInt(product.stock),
                    qty: 1
                });
            }

            renderCart();
        }

        // Ubah kuantitas produk
        function updateQty(productId, delta) {
            const index = cart.findIndex(item => item.id === productId);
            if (index === -1) return;

            const newQty = cart[index].qty + delta;
            if (newQty <= 0) {
                removeFromCart(productId);
                return;
            }

            if (newQty > cart[index].stock) {
                alert(`Stok maksimal tercapai! Sisa stok "${cart[index].name}" adalah ${cart[index].stock}.`);
                return;
            }

            cart[index].qty = newQty;
            renderCart();
        }

        // Hapus item dari keranjang
        function removeFromCart(productId) {
            cart = cart.filter(item => item.id !== productId);
            renderCart();
        }

        // Kosongkan keranjang
        function clearCart() {
            if (cart.length === 0) return;
            if (confirm('Kosongkan semua item di keranjang?')) {
                cart = [];
                renderCart();
            }
        }

        // Render tampilan keranjang belanja
        function renderCart() {
            const container = document.getElementById('cartItemList');
            const emptyMsg = document.getElementById('emptyCartMessage');
            
            if (cart.length === 0) {
                container.innerHTML = '';
                container.appendChild(emptyMsg);
                emptyMsg.classList.remove('hidden');
                calculateCart();
                return;
            }

            emptyMsg.classList.add('hidden');
            let html = '';

            cart.forEach(item => {
                const subtotal = item.qty * item.price;
                html += `
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div class="flex-1 min-w-0 pr-2">
                            <h4 class="font-bold text-xs text-slate-800 truncate">${item.name}</h4>
                            <div class="text-[11px] text-slate-500">${formatRupiah(item.price)}</div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                                <button onclick="updateQty(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 font-bold">-</button>
                                <span class="w-7 text-center text-xs font-bold text-slate-800">${item.qty}</span>
                                <button onclick="updateQty(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 font-bold">+</button>
                            </div>
                            <span class="text-xs font-extrabold text-slate-800 w-20 text-right">${formatRupiah(subtotal)}</span>
                            <button onclick="removeFromCart(${item.id})" class="text-slate-400 hover:text-rose-500 text-xs ml-1">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
            calculateCart();
        }

        // Kalkulasi Subtotal, Grand Total & Validasi Form
        function calculateCart() {
            let subtotal = 0;
            cart.forEach(item => {
                subtotal += item.qty * item.price;
            });

            const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
            const grandTotal = Math.max(0, subtotal - discount);

            document.getElementById('labelSubtotal').textContent = formatRupiah(subtotal);
            document.getElementById('labelGrandTotal').textContent = formatRupiah(grandTotal);

            calculateChange();
        }

        // Kalkulasi Uang Kembalian Real-time
        function calculateChange() {
            const grandTotalText = document.getElementById('labelGrandTotal').textContent;
            const grandTotal = parseFloat(grandTotalText.replace(/[^0-9]/g, '')) || 0;
            const payMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cash';
            const payInput = document.getElementById('inputPayAmount');
            const changeLabel = document.getElementById('labelChangeAmount');
            const checkoutBtn = document.getElementById('btnCheckout');

            if (cart.length === 0 || grandTotal <= 0) {
                checkoutBtn.disabled = true;
                changeLabel.textContent = formatRupiah(0);
                return;
            }

            if (payMethod !== 'cash') {
                // Untuk QRIS / Transfer tidak perlu kalkulasi kembalian tunai
                changeLabel.textContent = 'Rp 0 (Non-Tunai)';
                checkoutBtn.disabled = false;
                return;
            }

            const payAmount = parseFloat(payInput.value) || 0;
            const change = payAmount - grandTotal;

            if (change >= 0) {
                changeLabel.textContent = formatRupiah(change);
                changeLabel.className = 'text-emerald-600 font-black';
                checkoutBtn.disabled = false;
            } else {
                changeLabel.textContent = `Kurang ${formatRupiah(Math.abs(change))}`;
                changeLabel.className = 'text-rose-500 font-bold';
                checkoutBtn.disabled = true;
            }
        }

        function togglePaymentMethod() {
            const method = document.querySelector('input[name="payment_method"]:checked')?.value;
            const cashSection = document.getElementById('cashInputSection');
            if (method === 'cash') {
                cashSection.classList.remove('hidden');
            } else {
                cashSection.classList.add('hidden');
            }
            calculateChange();
        }

        function setExactPay() {
            const grandTotal = parseFloat(document.getElementById('labelGrandTotal').textContent.replace(/[^0-9]/g, '')) || 0;
            document.getElementById('inputPayAmount').value = grandTotal;
            calculateChange();
        }

        function addPay(amount) {
            const current = parseFloat(document.getElementById('inputPayAmount').value) || 0;
            document.getElementById('inputPayAmount').value = current + amount;
            calculateChange();
        }

        let midtransPollInterval = null;
        let midtransTimerInterval = null;
        let activeMidtransOrderId = null;

        function cancelMidtransQris() {
            if (midtransPollInterval) clearInterval(midtransPollInterval);
            if (midtransTimerInterval) clearInterval(midtransTimerInterval);
            document.getElementById('midtransModal').classList.add('hidden');
        }

        async function simulateMidtransSuccess() {
            if (midtransPollInterval) clearInterval(midtransPollInterval);
            if (midtransTimerInterval) clearInterval(midtransTimerInterval);
            document.getElementById('midtransModal').classList.add('hidden');
            // Proses finalisasi checkout di database
            await executeFinalCheckout('qris', 'Midtrans GoPay QRIS');
        }

        async function executeFinalCheckout(method, ref = '') {
            const grandTotal = parseFloat(document.getElementById('labelGrandTotal').textContent.replace(/[^0-9]/g, '')) || 0;
            const discount = parseFloat(document.getElementById('inputDiscount').value) || 0;
            let payAmount = parseFloat(document.getElementById('inputPayAmount').value) || 0;
            if (method !== 'cash') payAmount = grandTotal;

            const formData = new FormData();
            formData.append('action', 'checkout');
            formData.append('_csrf_token', csrfToken);
            formData.append('cart_items', JSON.stringify(cart.map(i => ({ product_id: i.id, qty: i.qty }))));
            formData.append('discount', discount);
            formData.append('pay_amount', payAmount);
            formData.append('payment_method', method);
            if (ref) formData.append('payment_reference', ref);

            const checkoutBtn = document.getElementById('btnCheckout');
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Transaksi...';

            try {
                const response = await fetch('pos.php', { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    showReceiptModal(result.receipt);
                    cart = [];
                    renderCart();
                } else {
                    alert('Gagal memproses transaksi: ' + result.message);
                }
            } catch (err) {
                alert('Terjadi kesalahan koneksi.');
                console.error(err);
            } finally {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="fa-solid fa-check"></i> Proses Pembayaran';
            }
        }

        // Kirim Transaksi ke Server via AJAX
        async function submitTransaction() {
            if (cart.length === 0) return;
            const grandTotal = parseFloat(document.getElementById('labelGrandTotal').textContent.replace(/[^0-9]/g, '')) || 0;
            const method = document.querySelector('input[name="payment_method"]:checked')?.value || 'cash';

            if (method === 'qris') {
                // Buat Midtrans Charge
                const newInvoice = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
                activeMidtransOrderId = newInvoice;
                
                document.getElementById('midtransOrderIdText').textContent = newInvoice;
                document.getElementById('midtransAmountText').textContent = formatRupiah(grandTotal);
                
                // Gunakan Google Charts API / QR server untuk preview SVG QR dynamic
                const emvcoString = encodeURIComponent(`00020101021226680016ID.CO.MIDTRANS.WWW0118936009110021301901021000000000005204581253033605405${grandTotal}5802ID5913KEDAI ES ZEFA6007JAKARTA61051234062220118${newInvoice}6304`);
                document.getElementById('midtransQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${emvcoString}`;
                
                document.getElementById('midtransModal').classList.remove('hidden');

                // Countdown Timer (15 menit = 900 detik)
                let remaining = 900;
                if (midtransTimerInterval) clearInterval(midtransTimerInterval);
                midtransTimerInterval = setInterval(() => {
                    remaining--;
                    if (remaining <= 0) {
                        clearInterval(midtransTimerInterval);
                        cancelMidtransQris();
                        alert('QRIS Midtrans telah kadaluarsa. Silakan buat transaksi ulang.');
                        return;
                    }
                    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
                    const s = (remaining % 60).toString().padStart(2, '0');
                    document.getElementById('midtransTimerText').textContent = `⏱️ Berlaku: ${m}:${s}`;
                }, 1000);

                // Polling Status Midtrans API setiap 3 detik
                if (midtransPollInterval) clearInterval(midtransPollInterval);
                midtransPollInterval = setInterval(async () => {
                    try {
                        const checkRes = await fetch(`api/midtrans-status.php?order_id=${encodeURIComponent(newInvoice)}`);
                        if (checkRes.ok) {
                            const data = await checkRes.json();
                            if (data.is_settled) {
                                clearInterval(midtransPollInterval);
                                clearInterval(midtransTimerInterval);
                                document.getElementById('midtransModal').classList.add('hidden');
                                await executeFinalCheckout('qris', 'Midtrans GoPay QRIS');
                            }
                        }
                    } catch (e) {
                        // ignore polling error
                    }
                }, 3000);

                return;
            }

            await executeFinalCheckout(method);
        }

        let currentReceipt = null;
        let selectedPaperSize = '58mm';

        function setPaperSize(size) {
            selectedPaperSize = size;
            const roll = document.getElementById('receiptThermalRoll');
            const btn58 = document.getElementById('btnPaper58');
            const btn80 = document.getElementById('btnPaper80');

            if (size === '58mm') {
                roll.classList.remove('w-[320px]', 'text-[12px]');
                roll.classList.add('w-[240px]', 'text-[11px]');
                btn58.className = 'px-2 py-0.5 rounded font-bold bg-emerald-600 text-white';
                btn80.className = 'px-2 py-0.5 rounded font-bold text-slate-400';
            } else {
                roll.classList.remove('w-[240px]', 'text-[11px]');
                roll.classList.add('w-[320px]', 'text-[12px]');
                btn80.className = 'px-2 py-0.5 rounded font-bold bg-emerald-600 text-white';
                btn58.className = 'px-2 py-0.5 rounded font-bold text-slate-400';
            }
        }

        // Tampilkan Modal Struk Penjualan
        function showReceiptModal(receipt) {
            currentReceipt = receipt;
            document.getElementById('receiptInvoice').textContent = receipt.invoice_number;
            document.getElementById('receiptDate').textContent = receipt.date;
            document.getElementById('receiptSubtotal').textContent = formatRupiah(receipt.subtotal);
            
            const discRow = document.getElementById('receiptDiscountRow');
            if (receipt.discount > 0) {
                discRow.style.display = 'flex';
                document.getElementById('receiptDiscount').textContent = '-' + formatRupiah(receipt.discount);
            } else {
                discRow.style.display = 'none';
            }

            document.getElementById('receiptGrandTotal').textContent = formatRupiah(receipt.grand_total);
            document.getElementById('receiptPay').textContent = formatRupiah(receipt.pay_amount);
            document.getElementById('receiptChange').textContent = formatRupiah(receipt.change_amount);
            document.getElementById('receiptMethod').textContent = receipt.payment_method.toUpperCase();
            document.getElementById('receiptBarcode').textContent = '*' + receipt.invoice_number + '*';

            let itemsHtml = '';
            receipt.items.forEach(item => {
                itemsHtml += `
                    <div class="leading-tight">
                        <div class="font-bold text-slate-900 truncate">${item.name}</div>
                        <div class="flex justify-between text-[10px] text-slate-800">
                            <span>${item.qty} x ${formatRupiah(item.selling_price)}</span>
                            <span class="font-bold">${formatRupiah(item.subtotal)}</span>
                        </div>
                    </div>
                `;
            });
            document.getElementById('receiptItems').innerHTML = itemsHtml;
            document.getElementById('receiptModal').classList.remove('hidden');
        }

        // Cetak Struk ke Printer Bluetooth Portabel melalui Jendela Khusus
        function printThermalPopup() {
            if (!currentReceipt) return;
            const is58 = selectedPaperSize === '58mm';
            const width = is58 ? '58mm' : '80mm';
            const popup = window.open('', '_blank', 'width=320,height=600,menubar=no,toolbar=no,location=no,status=no');
            if (!popup) {
                window.print();
                return;
            }

            let itemsHtml = '';
            currentReceipt.items.forEach(item => {
                itemsHtml += `
                    <div style="margin-bottom: 4px;">
                        <div style="font-weight: bold; font-size: ${is58 ? '11px' : '12px'};">${item.name}</div>
                        <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '10px' : '11px'}; color: #222;">
                            <span>${item.qty} x ${formatRupiah(item.selling_price)}</span>
                            <span style="font-weight: bold;">${formatRupiah(item.subtotal)}</span>
                        </div>
                    </div>
                `;
            });

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Struk_${currentReceipt.invoice_number}</title>
                    <style>
                        @page { size: ${width} auto; margin: 0; }
                        * { box-sizing: border-box; }
                        body {
                            margin: 0;
                            padding: 2mm 3mm 8mm 3mm;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: ${is58 ? '11px' : '12px'};
                            line-height: 1.25;
                            width: ${width};
                            color: #000;
                            background: #fff;
                        }
                        .text-center { text-align: center; }
                        .flex { display: flex; justify-content: space-between; }
                        .divider { border-top: 1px dashed #000; margin: 5px 0; }
                        .double-divider { border-top: 1px double #000; margin: 6px 0; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <div style="font-size: ${is58 ? '13px' : '15px'}; font-weight: 900;">TOKO UMKM BERKAH</div>
                        <div style="font-size: ${is58 ? '9px' : '10px'};">Jl. Pahlawan No. 88, Surabaya</div>
                        <div style="font-size: ${is58 ? '9px' : '10px'};">Telp: 0812-3456-7890</div>
                    </div>
                    <div class="double-divider"></div>
                    <div style="font-size: ${is58 ? '9px' : '10px'};">
                        <div class="flex"><span>No: ${currentReceipt.invoice_number}</span></div>
                        <div class="flex"><span>Tgl: ${currentReceipt.date}</span></div>
                    </div>
                    <div class="divider"></div>
                    <div>${itemsHtml}</div>
                    <div class="divider"></div>
                    <div style="font-size: ${is58 ? '10px' : '11px'};">
                        <div class="flex"><span>Subtotal:</span><span>${formatRupiah(currentReceipt.subtotal)}</span></div>
                        ${currentReceipt.discount > 0 ? `<div class="flex"><span>Diskon:</span><span>-${formatRupiah(currentReceipt.discount)}</span></div>` : ''}
                        <div class="flex" style="font-weight: 900; font-size: ${is58 ? '12px' : '14px'}; margin: 3px 0;">
                            <span>TOTAL:</span><span>${formatRupiah(currentReceipt.grand_total)}</span>
                        </div>
                        <div class="flex"><span>Bayar (${currentReceipt.payment_method.toUpperCase()}):</span><span>${formatRupiah(currentReceipt.pay_amount)}</span></div>
                        <div class="flex" style="font-weight: bold;"><span>Kembali:</span><span>${formatRupiah(currentReceipt.change_amount)}</span></div>
                    </div>
                    <div class="double-divider"></div>
                    <div class="text-center" style="font-size: ${is58 ? '8.5px' : '9.5px'}; margin-top: 4px;">
                        <div>Terima kasih atas kunjungan Anda!</div>
                        <div>Barang yang dibeli tidak dapat ditukar.</div>
                    </div>
                    <div style="height: 12mm;"></div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 250);
                        };
                    <\/script>
                </body>
                </html>
            `;

            popup.document.open();
            popup.document.write(html);
            popup.document.close();
        }

        // Salin Struk ke Format Teks WhatsApp / RawBT
        function copyReceiptWhatsApp() {
            if (!currentReceipt) return;
            const line = '--------------------------------';
            let t = '================================\n';
            t += '       TOKO UMKM BERKAH\n';
            t += '  Jl. Pahlawan No. 88, Surabaya\n';
            t += '       Telp: 0812-3456-7890\n';
            t += '================================\n';
            t += 'No. Faktur: ' + currentReceipt.invoice_number + '\n';
            t += 'Tanggal   : ' + currentReceipt.date + '\n';
            t += line + '\n';
            currentReceipt.items.forEach(i => {
                t += i.name + '\n';
                t += '  ' + i.qty + ' x ' + formatRupiah(i.selling_price) + ' = ' + formatRupiah(i.subtotal) + '\n';
            });
            t += line + '\n';
            t += 'Subtotal : ' + formatRupiah(currentReceipt.subtotal) + '\n';
            if (currentReceipt.discount > 0) {
                t += 'Diskon   : -' + formatRupiah(currentReceipt.discount) + '\n';
            }
            t += 'TOTAL    : ' + formatRupiah(currentReceipt.grand_total) + '\n';
            t += 'Bayar    : ' + formatRupiah(currentReceipt.pay_amount) + ' (' + currentReceipt.payment_method.toUpperCase() + ')\n';
            t += 'Kembali  : ' + formatRupiah(currentReceipt.change_amount) + '\n';
            t += '================================\n';
            t += 'Terima kasih atas kunjungan Anda!\n';
            t += '================================\n';

            navigator.clipboard.writeText(t).then(() => {
                alert('Struk teks berhasil disalin ke clipboard! Siap dikirim ke WhatsApp atau printer Bluetooth.');
            });
        }

        function closeReceiptModal() {
            document.getElementById('receiptModal').classList.add('hidden');
            cart = [];
            renderCart();
            document.getElementById('inputDiscount').value = '0';
            document.getElementById('inputPayAmount').value = '';
            window.location.reload();
        }

        // Live Search Filter di Grid Katalog
        document.getElementById('searchProduct').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('#productGrid > div');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });
        });
    </script>
</body>
</html>
