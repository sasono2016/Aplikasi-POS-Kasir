<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;
use Exception;

/**
 * InventoryService - Manajemen Produk & Penerimaan Stok Barang (Restock)
 */
class InventoryService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Mengambil daftar produk dengan filter pencarian dan kategori
     */
    public function getProducts(?string $search = null, ?int $categoryId = null): array
    {
        $sql = "SELECT p.*, c.name AS category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $sql .= " AND (p.name LIKE :search OR p.sku LIKE :search)";
            $params[':search'] = "%{$search}%";
        }

        if (!empty($categoryId)) {
            $sql .= " AND p.category_id = :cat_id";
            $params[':cat_id'] = $categoryId;
        }

        $sql .= " ORDER BY p.name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Tambah Produk Baru
     */
    public function createProduct(array $data): int
    {
        $sql = "INSERT INTO products (category_id, sku, name, image_url, purchase_price, selling_price, stock, min_stock)
                VALUES (:category_id, :sku, :name, :image_url, :purchase_price, :selling_price, :stock, :min_stock)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':category_id'    => $data['category_id'] ?: null,
            ':sku'            => trim($data['sku']),
            ':name'           => trim($data['name']),
            ':image_url'      => trim($data['image_url'] ?? ''),
            ':purchase_price' => (float)$data['purchase_price'],
            ':selling_price'  => (float)$data['selling_price'],
            ':stock'          => (int)$data['stock'],
            ':min_stock'      => (int)($data['min_stock'] ?? 5),
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Update Data Produk
     */
    public function updateProduct(int $id, array $data): bool
    {
        $sql = "UPDATE products SET 
                    category_id = :category_id,
                    sku = :sku,
                    name = :name,
                    image_url = :image_url,
                    purchase_price = :purchase_price,
                    selling_price = :selling_price,
                    stock = :stock,
                    min_stock = :min_stock
                WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':category_id'    => $data['category_id'] ?: null,
            ':sku'            => trim($data['sku']),
            ':name'           => trim($data['name']),
            ':image_url'      => trim($data['image_url'] ?? ''),
            ':purchase_price' => (float)$data['purchase_price'],
            ':selling_price'  => (float)$data['selling_price'],
            ':stock'          => (int)$data['stock'],
            ':min_stock'      => (int)($data['min_stock'] ?? 5),
            ':id'             => $id,
        ]);
    }

    /**
     * Hapus Produk (Jika belum pernah ada di transaksi penjualan)
     */
    public function deleteProduct(int $id): bool
    {
        // Periksa apakah sudah ada di sale_details
        $check = $this->db->prepare("SELECT COUNT(*) FROM sale_details WHERE product_id = :id");
        $check->execute([':id' => $id]);
        if ((int)$check->fetchColumn() > 0) {
            throw new Exception("Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan. Gunakan opsi nonaktif atau set stok ke 0.");
        }

        $stmt = $this->db->prepare("DELETE FROM products WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Memproses Penerimaan Pembelian Stok (Restock) dari Supplier
     * Menghitung Harga Beli Rata-Rata Tertimbang (Weighted Average Cost / Moving Average HPP)
     * dan mengupdate total stok secara atomic.
     * 
     * Rumus Moving Average HPP:
     * HPP Baru = ((Stok Lama * HPP Lama) + (Qty Beli * Harga Beli Baru)) / (Stok Lama + Qty Beli)
     */
    public function processRestock(int $userId, ?int $supplierId, array $items, ?string $notes = null): array
    {
        if (empty($items)) {
            throw new Exception("Daftar barang restock tidak boleh kosong.");
        }

        $this->db->beginTransaction();

        try {
            $totalAmount = 0.0;
            $processed = [];

            // 1. Generate Purchase Code (misal: PUR-20261030-001)
            $today = date('Ymd');
            $prefix = "PUR-{$today}-";
            $stmtLast = $this->db->prepare(
                "SELECT purchase_code FROM purchases WHERE purchase_code LIKE :prefix ORDER BY id DESC LIMIT 1"
            );
            $stmtLast->execute([':prefix' => "{$prefix}%"]);
            $lastCode = $stmtLast->fetchColumn();

            $seq = $lastCode ? ((int)substr((string)$lastCode, -3) + 1) : 1;
            $purchaseCode = $prefix . str_pad((string)$seq, 3, '0', STR_PAD_LEFT);

            // 2. Simpan Header Pembelian
            $stmtPur = $this->db->prepare(
                "INSERT INTO purchases (purchase_code, supplier_id, user_id, total_amount, purchase_date, notes)
                 VALUES (:code, :supp_id, :user_id, 0.0, NOW(), :notes)"
            );
            $stmtPur->execute([
                ':code'    => $purchaseCode,
                ':supp_id' => $supplierId ?: null,
                ':user_id' => $userId,
                ':notes'   => $notes,
            ]);
            $purchaseId = (int)$this->db->lastInsertId();

            $stmtProd = $this->db->prepare("SELECT id, name, stock, purchase_price FROM products WHERE id = :id FOR UPDATE");
            $stmtDetail = $this->db->prepare(
                "INSERT INTO purchase_details (purchase_id, product_id, qty, purchase_price, subtotal)
                 VALUES (:purchase_id, :product_id, :qty, :price, :subtotal)"
            );
            $stmtUpdateStock = $this->db->prepare(
                "UPDATE products SET stock = stock + :qty, purchase_price = :new_hpp WHERE id = :id"
            );

            foreach ($items as $item) {
                $productId = (int)$item['product_id'];
                $qty = (int)$item['qty'];
                $unitPrice = (float)$item['purchase_price'];

                if ($qty <= 0 || $unitPrice < 0) {
                    throw new Exception("Kuantitas dan harga beli harus bernilai positif.");
                }

                $stmtProd->execute([':id' => $productId]);
                $prod = $stmtProd->fetch();
                if (!$prod) {
                    throw new Exception("Produk ID {$productId} tidak ditemukan.");
                }

                $oldStock = (int)$prod['stock'];
                $oldHpp = (float)$prod['purchase_price'];
                $subtotal = $qty * $unitPrice;
                $totalAmount += $subtotal;

                // Hitung Weighted Average HPP jika stok lama > 0
                if ($oldStock > 0) {
                    $newHpp = round((($oldStock * $oldHpp) + ($qty * $unitPrice)) / ($oldStock + $qty), 2);
                } else {
                    $newHpp = $unitPrice;
                }

                // Simpan detail restock
                $stmtDetail->execute([
                    ':purchase_id' => $purchaseId,
                    ':product_id'  => $productId,
                    ':qty'         => $qty,
                    ':price'       => $unitPrice,
                    ':subtotal'    => $subtotal,
                ]);

                // Update stok dan HPP terbaru
                $stmtUpdateStock->execute([
                    ':qty'     => $qty,
                    ':new_hpp' => $newHpp,
                    ':id'      => $productId,
                ]);

                $processed[] = [
                    'name'     => $prod['name'],
                    'qty'      => $qty,
                    'price'    => $unitPrice,
                    'old_hpp'  => $oldHpp,
                    'new_hpp'  => $newHpp,
                    'subtotal' => $subtotal,
                ];
            }

            // Update total_amount pada header purchases
            $stmtUpdateTotal = $this->db->prepare("UPDATE purchases SET total_amount = :total WHERE id = :id");
            $stmtUpdateTotal->execute([':total' => $totalAmount, ':id' => $purchaseId]);

            $this->db->commit();

            return [
                'purchase_id'   => $purchaseId,
                'purchase_code' => $purchaseCode,
                'total_amount'  => $totalAmount,
                'items'         => $processed,
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
