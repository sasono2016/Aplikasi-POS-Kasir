<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;

/**
 * ReportService - Menghasilkan Laporan Analitik Keuangan, Trend Omset & Laba Bersih
 */
class ReportService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Widget Ringkasan Kinerja Penjualan Hari Ini
     */
    public function getTodaySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE DATE(s.transaction_date) = CURRENT_DATE";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

    /**
     * Ringkasan 7 Hari Terakhir (Mingguan)
     */
    public function getWeeklySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

    /**
     * Ringkasan 30 Hari Terakhir (Bulanan)
     */
    public function getMonthlySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

    /**
     * Top Selling Products (10 Produk Terlaris 30 Hari Terakhir)
     */
    public function getTopSellingProducts(int $limit = 10): array
    {
        $sql = "SELECT 
                    p.id AS product_id,
                    p.sku,
                    p.name AS nama_produk,
                    COALESCE(c.name, 'Tanpa Kategori') AS kategori,
                    SUM(sd.qty) AS total_terjual,
                    SUM(sd.subtotal) AS total_omset_produk,
                    SUM((sd.selling_price - sd.cost_price) * sd.qty) AS total_profit_produk
                FROM sale_details sd
                JOIN sales s ON sd.sale_id = s.id
                JOIN products p ON sd.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
                GROUP BY p.id, p.sku, p.name, c.name
                ORDER BY total_terjual DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Trend Harian 7 atau 30 Hari Terakhir (untuk Grafik/Visualisasi)
     */
    public function getDailyTrend(int $days = 7): array
    {
        $sql = "SELECT 
                    DATE(s.transaction_date) AS tanggal,
                    COUNT(DISTINCT s.id) AS total_transaksi,
                    SUM(s.grand_total) AS total_omset,
                    SUM(sd.cost_price * sd.qty) AS total_hpp,
                    SUM(s.grand_total) - SUM(sd.cost_price * sd.qty) AS laba_bersih
                FROM sales s
                JOIN sale_details sd ON s.id = sd.sale_id
                WHERE s.transaction_date >= CURRENT_DATE - INTERVAL :days DAY
                GROUP BY DATE(s.transaction_date)
                ORDER BY tanggal ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Riwayat Transaksi dengan Filter Tanggal & Kasir
     */
    public function getTransactions(?string $startDate = null, ?string $endDate = null, ?int $userId = null): array
    {
        $sql = "SELECT s.*, u.full_name AS cashier_name 
                FROM sales s 
                JOIN users u ON s.user_id = u.id 
                WHERE 1=1";
        $params = [];

        if (!empty($startDate)) {
            $sql .= " AND DATE(s.transaction_date) >= :start_date";
            $params[':start_date'] = $startDate;
        }

        if (!empty($endDate)) {
            $sql .= " AND DATE(s.transaction_date) <= :end_date";
            $params[':end_date'] = $endDate;
        }

        if (!empty($userId)) {
            $sql .= " AND s.user_id = :user_id";
            $params[':user_id'] = $userId;
        }

        $sql .= " ORDER BY s.id DESC LIMIT 100";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Mengambil Detail Item dari Sebuah Faktur
     */
    public function getSaleDetail(int $saleId): ?array
    {
        $stmt = $this->db->prepare("SELECT s.*, u.full_name AS cashier_name FROM sales s JOIN users u ON s.user_id = u.id WHERE s.id = :id");
        $stmt->execute([':id' => $saleId]);
        $sale = $stmt->fetch();

        if (!$sale) {
            return null;
        }

        $stmtItems = $this->db->prepare(
            "SELECT sd.*, p.name AS product_name, p.sku 
             FROM sale_details sd 
             JOIN products p ON sd.product_id = p.id 
             WHERE sd.sale_id = :id"
        );
        $stmtItems->execute([':id' => $saleId]);
        $sale['items'] = $stmtItems->fetchAll();

        return $sale;
    }
}
