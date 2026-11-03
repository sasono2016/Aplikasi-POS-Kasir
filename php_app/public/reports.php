<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Enums/UserRole.php';
require_once __DIR__ . '/../app/Core/Session.php';
require_once __DIR__ . '/../app/Core/AuthMiddleware.php';
require_once __DIR__ . '/../app/Services/ReportService.php';

use App\Core\AuthMiddleware;
use App\Enums\UserRole;
use App\Services\ReportService;

// RBAC: Hanya Owner dan Manager yang boleh mengakses Laporan & Analitik Keuntungan
$currentUser = AuthMiddleware::requireRole(UserRole::OWNER, UserRole::MANAGER);
$userRole = UserRole::tryFrom($currentUser['role']);

$reportService = new ReportService();

// Data Analitik
$todaySummary   = $reportService->getTodaySummary();
$weeklySummary  = $reportService->getWeeklySummary();
$monthlySummary = $reportService->getMonthlySummary();
$topProducts    = $reportService->getTopSellingProducts(10);
$dailyTrends    = $reportService->getDailyTrend(14); // 14 hari terakhir

// Filter Transaksi
$startDate = filter_input(INPUT_GET, 'start_date', FILTER_DEFAULT);
$endDate   = filter_input(INPUT_GET, 'end_date', FILTER_DEFAULT);
$transactions = $reportService->getTransactions($startDate, $endDate);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Analitik & Laporan - KASIR-UMKM Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div>
                <h1 class="font-bold text-lg text-slate-800 tracking-tight">Kedai ES Zefa</h1>
                <p class="text-xs text-slate-500">Dashboard Laporan & Analitik Trend Keuntungan</p>
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
            <a href="reports.php" class="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center gap-2">
                <i class="fa-solid fa-chart-line"></i> Laporan
            </a>
            <?php if ($userRole?->canAccessUsers()): ?>
            <a href="users.php" class="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium flex items-center gap-2">
                <i class="fa-solid fa-users-gear"></i> Pengguna
            </a>
            <?php endif; ?>
        </nav>

        <div class="flex items-center space-x-4">
            <div class="text-right">
                <div class="text-sm font-bold text-slate-800"><?= htmlspecialchars($currentUser['full_name']) ?></div>
                <div class="text-xs text-indigo-600 uppercase font-semibold"><?= $userRole?->label() ?></div>
            </div>
            <a href="logout.php" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Logout">
                <i class="fa-solid fa-arrow-right-from-bracket text-lg"></i>
            </a>
        </div>
    </header>

    <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <!-- 1. KPI Metric Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <!-- Hari Ini -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider">Omset Hari Ini</span>
                    <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                        <i class="fa-solid fa-calendar-day"></i>
                    </span>
                </div>
                <div class="text-2xl font-black text-slate-900">
                    Rp <?= number_format((float)$todaySummary['total_omset'], 0, ',', '.') ?>
                </div>
                <div class="flex items-center justify-between text-xs mt-2 text-slate-500">
                    <span><?= $todaySummary['total_transaksi'] ?> Transaksi</span>
                    <span class="font-semibold text-emerald-600">Laba: Rp <?= number_format((float)$todaySummary['total_laba_bersih'], 0, ',', '.') ?></span>
                </div>
            </div>

            <!-- Mingguan (7 Hari) -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider">Omset 7 Hari</span>
                    <span class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm font-bold">
                        <i class="fa-solid fa-calendar-week"></i>
                    </span>
                </div>
                <div class="text-2xl font-black text-slate-900">
                    Rp <?= number_format((float)$weeklySummary['total_omset'], 0, ',', '.') ?>
                </div>
                <div class="flex items-center justify-between text-xs mt-2 text-slate-500">
                    <span><?= $weeklySummary['total_transaksi'] ?> Transaksi</span>
                    <span class="font-semibold text-sky-600">Laba: Rp <?= number_format((float)$weeklySummary['total_laba_bersih'], 0, ',', '.') ?></span>
                </div>
            </div>

            <!-- Bulanan (30 Hari) -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider">Omset 30 Hari</span>
                    <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        <i class="fa-solid fa-calendar-alt"></i>
                    </span>
                </div>
                <div class="text-2xl font-black text-slate-900">
                    Rp <?= number_format((float)$monthlySummary['total_omset'], 0, ',', '.') ?>
                </div>
                <div class="flex items-center justify-between text-xs mt-2 text-slate-500">
                    <span><?= $monthlySummary['total_transaksi'] ?> Transaksi</span>
                    <span class="text-indigo-600 font-semibold"><?= number_format(((float)$monthlySummary['total_laba_bersih'] / max(1, (float)$monthlySummary['total_omset'])) * 100, 1) ?>% Margin</span>
                </div>
            </div>

            <!-- Total Keuntungan Bersih (Net Profit) -->
            <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm">
                <div class="flex items-center justify-between text-emerald-100 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider">Laba Bersih 30 Hari</span>
                    <span class="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                        <i class="fa-solid fa-wallet"></i>
                    </span>
                </div>
                <div class="text-2xl font-black text-white">
                    Rp <?= number_format((float)$monthlySummary['total_laba_bersih'], 0, ',', '.') ?>
                </div>
                <div class="text-xs text-emerald-100/90 mt-2">
                    Rumus: <span class="font-mono text-[11px]">(Omset - HPP) - Diskon</span>
                </div>
            </div>
        </div>

        <!-- 2. Grid: Grafik Trend Omset (Kiri 60%) + Top 10 Produk Terlaris (Kanan 40%) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Trend Penjualan Harian Bar Visualization -->
            <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="font-bold text-slate-800 text-base">Trend Omset & Laba Bersih (14 Hari Terakhir)</h2>
                        <p class="text-xs text-slate-500">Perbandingan harian nilai omset terhadap laba bersih</p>
                    </div>
                </div>

                <?php 
                    $maxVal = 1;
                    foreach ($dailyTrends as $d) {
                        $maxVal = max($maxVal, (float)$d['total_omset']);
                    }
                ?>
                <div class="space-y-3 pt-2">
                    <?php if (empty($dailyTrends)): ?>
                        <p class="text-center text-xs text-slate-400 py-8">Belum ada transaksi dalam periode ini.</p>
                    <?php else: ?>
                        <?php foreach ($dailyTrends as $trend): ?>
                            <?php 
                                $omsetPct = round(((float)$trend['total_omset'] / $maxVal) * 100);
                                $profitPct = round(((float)$trend['laba_bersih'] / $maxVal) * 100);
                            ?>
                            <div class="text-xs">
                                <div class="flex justify-between text-slate-600 font-medium mb-1">
                                    <span><?= date('d M', strtotime($trend['tanggal'])) ?></span>
                                    <span>
                                        Omset: <b class="text-slate-800">Rp <?= number_format((float)$trend['total_omset'], 0, ',', '.') ?></b> 
                                        &bull; Laba: <b class="text-emerald-600">Rp <?= number_format((float)$trend['laba_bersih'], 0, ',', '.') ?></b>
                                    </span>
                                </div>
                                <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                                    <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: <?= $omsetPct ?>%"></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Top Selling Products -->
            <div class="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="font-bold text-slate-800 text-base">10 Produk Terlaris</h2>
                        <p class="text-xs text-slate-500">Berdasarkan volume penjualan 1 bulan terakhir</p>
                    </div>
                    <span class="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200">
                        <i class="fa-solid fa-crown text-amber-500 mr-1"></i> Ranking
                    </span>
                </div>

                <div class="divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-1">
                    <?php if (empty($topProducts)): ?>
                        <p class="text-center text-xs text-slate-400 py-8">Belum ada data penjualan produk.</p>
                    <?php else: ?>
                        <?php foreach ($topProducts as $index => $top): ?>
                            <div class="py-2.5 flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-3 min-w-0">
                                    <span class="w-6 h-6 rounded-md <?= $index < 3 ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 text-slate-600' ?> flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        <?= $index + 1 ?>
                                    </span>
                                    <div class="truncate">
                                        <div class="font-bold text-slate-800 truncate"><?= htmlspecialchars($top['nama_produk']) ?></div>
                                        <div class="text-[10px] text-slate-400"><?= htmlspecialchars($top['kategori']) ?> &bull; SKU: <?= htmlspecialchars($top['sku']) ?></div>
                                    </div>
                                </div>
                                <div class="text-right flex-shrink-0 pl-2">
                                    <div class="font-extrabold text-emerald-600"><?= number_format((int)$top['total_terjual']) ?> pcs</div>
                                    <div class="text-[10px] text-slate-500">Rp <?= number_format((float)$top['total_omset_produk'], 0, ',', '.') ?></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- 3. Tabel Riwayat Transaksi & Filter Tanggal -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                    <h2 class="font-bold text-slate-800 text-base">Riwayat Transaksi Penjualan</h2>
                    <p class="text-xs text-slate-500">Log faktur penjualan yang telah tersimpan di database</p>
                </div>

                <!-- Form Filter Rentang Tanggal -->
                <form method="GET" class="flex items-center space-x-2 text-xs">
                    <input 
                        type="date" 
                        name="start_date" 
                        value="<?= htmlspecialchars($startDate ?? '') ?>" 
                        class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                    <span class="text-slate-400">&ndash;</span>
                    <input 
                        type="date" 
                        name="end_date" 
                        value="<?= htmlspecialchars($endDate ?? '') ?>" 
                        class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                    <button type="submit" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                        Filter
                    </button>
                    <?php if ($startDate || $endDate): ?>
                        <a href="reports.php" class="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Reset</a>
                    <?php endif; ?>
                </form>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                            <th class="py-3 px-4">No. Faktur</th>
                            <th class="py-3 px-4">Tanggal & Waktu</th>
                            <th class="py-3 px-4">Kasir</th>
                            <th class="py-3 px-4 text-center">Jml Item</th>
                            <th class="py-3 px-4 text-right">Subtotal</th>
                            <th class="py-3 px-4 text-right">Diskon</th>
                            <th class="py-3 px-4 text-right">Grand Total</th>
                            <th class="py-3 px-4 text-center">Metode</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($transactions)): ?>
                            <tr>
                                <td colspan="8" class="text-center py-8 text-slate-400">Belum ada transaksi ditemukan.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($transactions as $tx): ?>
                                <tr class="hover:bg-slate-50/80 transition">
                                    <td class="py-3 px-4 font-mono font-bold text-slate-900"><?= htmlspecialchars($tx['invoice_number']) ?></td>
                                    <td class="py-3 px-4 text-slate-500"><?= date('d/m/Y H:i', strtotime($tx['transaction_date'])) ?></td>
                                    <td class="py-3 px-4 font-medium text-slate-700"><?= htmlspecialchars($tx['cashier_name']) ?></td>
                                    <td class="py-3 px-4 text-center font-bold"><?= $tx['total_item'] ?></td>
                                    <td class="py-3 px-4 text-right text-slate-600">Rp <?= number_format((float)$tx['subtotal'], 0, ',', '.') ?></td>
                                    <td class="py-3 px-4 text-right text-rose-500">-Rp <?= number_format((float)$tx['discount'], 0, ',', '.') ?></td>
                                    <td class="py-3 px-4 text-right font-black text-emerald-700">Rp <?= number_format((float)$tx['grand_total'], 0, ',', '.') ?></td>
                                    <td class="py-3 px-4 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                            <?= htmlspecialchars($tx['payment_method']) ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

</body>
</html>
