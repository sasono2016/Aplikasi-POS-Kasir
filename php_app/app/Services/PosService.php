<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use App\Enums\PaymentMethod;
use PDO;
use Exception;

/**
 * PosService - Menangani Logika Bisnis Transaksi Penjualan Kasir
 */
class PosService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Memproses transaksi POS secara atomic menggunakan Database Transaction
     * 
     * @param int $userId ID Kasir yang sedang login
     * @param array $items Array keranjang: [['product_id' => 1, 'qty' => 2], ...]
     * @param float $discount Potongan harga (diskon)
     * @param float $payAmount Nominal uang yang dibayarkan konsumen
     * @param PaymentMethod $paymentMethod Metode pembayaran
     * @return array Data struk/invoice yang berhasil diproses
     * @throws Exception Jika validasi gagal atau stok tidak mencukupi
     */
    public function processCheckout(
        int $userId,
        array $items,
        float $discount,
        float $payAmount,
        PaymentMethod $paymentMethod
    ): array {
        if (empty($items)) {
            throw new Exception("Keranjang belanja kosong!");
        }

        // Mulai ACID Database Transaction
        $this->db->beginTransaction();

        try {
            $totalItem = 0;
            $subtotal = 0.0;
            $processedItems = [];

            // 1. Validasi Stok & Snapshot Harga dengan Row-Level Locking (FOR UPDATE)
            $stmtProd = $this->db->prepare(
                "SELECT id, name, sku, purchase_price, selling_price, stock 
                 FROM products 
                 WHERE id = :id 
                 FOR UPDATE"
            );

            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $qty = (int) ($item['qty'] ?? 0);

                if ($qty <= 0) {
                    throw new Exception("Kuantitas produk tidak valid.");
                }

                $stmtProd->execute([':id' => $productId]);
                $product = $stmtProd->fetch();

                if (!$product) {
                    throw new Exception("Produk dengan ID {$productId} tidak ditemukan.");
                }

                if ((int)$product['stock'] < $qty) {
                    throw new Exception("Stok produk '{$product['name']}' tidak mencukupi! Sisa stok: {$product['stock']}, diminta: {$qty}");
                }

                $itemSubtotal = (float)$product['selling_price'] * $qty;
                $subtotal += $itemSubtotal;
                $totalItem += $qty;

                $processedItems[] = [
                    'product_id'     => (int)$product['id'],
                    'name'           => $product['name'],
                    'sku'            => $product['sku'],
                    'qty'            => $qty,
                    'cost_price'     => (float)$product['purchase_price'], // HPP saat transaksi terjadi
                    'selling_price'  => (float)$product['selling_price'],
                    'subtotal'       => $itemSubtotal,
                ];
            }

            // 2. Hitung Grand Total & Kembalian
            $discount = max(0.0, $discount);
            $grandTotal = max(0.0, $subtotal - $discount);

            if ($payAmount < $grandTotal && $paymentMethod === PaymentMethod::CASH) {
                throw new Exception("Nominal pembayaran kurang dari total tagihan! Kurang: Rp " . number_format($grandTotal - $payAmount, 0, ',', '.'));
            }

            $changeAmount = ($paymentMethod === PaymentMethod::CASH) ? ($payAmount - $grandTotal) : 0.0;

            // 3. Generate Nomor Invoice Unik (Format: INV-YYYYMMDD-0001)
            $today = date('Ymd');
            $prefix = "INV-{$today}-";
            $stmtInv = $this->db->prepare(
                "SELECT invoice_number FROM sales WHERE invoice_number LIKE :prefix ORDER BY id DESC LIMIT 1"
            );
            $stmtInv->execute([':prefix' => "{$prefix}%"]);
            $lastInv = $stmtInv->fetchColumn();

            if ($lastInv) {
                $lastSequence = (int) substr((string)$lastInv, -4);
                $newSequence = str_pad((string)($lastSequence + 1), 4, '0', STR_PAD_LEFT);
            } else {
                $newSequence = '0001';
            }
            $invoiceNumber = $prefix . $newSequence;

            // 4. Simpan Header Transaksi ke Tabel `sales`
            $stmtSale = $this->db->prepare(
                "INSERT INTO sales (invoice_number, user_id, total_item, subtotal, discount, grand_total, pay_amount, change_amount, payment_method, transaction_date)
                 VALUES (:invoice, :user_id, :total_item, :subtotal, :discount, :grand_total, :pay_amount, :change_amount, :payment_method, NOW())"
            );
            $stmtSale->execute([
                ':invoice'        => $invoiceNumber,
                ':user_id'        => $userId,
                ':total_item'     => $totalItem,
                ':subtotal'       => $subtotal,
                ':discount'       => $discount,
                ':grand_total'    => $grandTotal,
                ':pay_amount'     => $payAmount,
                ':change_amount'  => $changeAmount,
                ':payment_method' => $paymentMethod->value,
            ]);

            $saleId = (int) $this->db->lastInsertId();

            // 5. Simpan Detail Transaksi & Potong Stok Produk Otomatis
            $stmtDetail = $this->db->prepare(
                "INSERT INTO sale_details (sale_id, product_id, qty, cost_price, selling_price, subtotal)
                 VALUES (:sale_id, :product_id, :qty, :cost_price, :selling_price, :subtotal)"
            );

            $stmtStock = $this->db->prepare(
                "UPDATE products SET stock = stock - :qty WHERE id = :id"
            );

            foreach ($processedItems as $item) {
                $stmtDetail->execute([
                    ':sale_id'       => $saleId,
                    ':product_id'    => $item['product_id'],
                    ':qty'           => $item['qty'],
                    ':cost_price'    => $item['cost_price'],
                    ':selling_price' => $item['selling_price'],
                    ':subtotal'      => $item['subtotal'],
                ]);

                // Kurangi stok produk secara langsung
                $stmtStock->execute([
                    ':qty' => $item['qty'],
                    ':id'  => $item['product_id'],
                ]);
            }

            // Berhasil seluruhnya, lakukan commit transaction
            $this->db->commit();

            return [
                'sale_id'        => $saleId,
                'invoice_number' => $invoiceNumber,
                'total_item'     => $totalItem,
                'subtotal'       => $subtotal,
                'discount'       => $discount,
                'grand_total'    => $grandTotal,
                'pay_amount'     => $payAmount,
                'change_amount'  => $changeAmount,
                'payment_method' => $paymentMethod->value,
                'date'           => date('d-m-Y H:i:s'),
                'items'          => $processedItems,
            ];

        } catch (Exception $e) {
            // Jika ada kesalahan, batalkan semua perubahan data
            $this->db->rollBack();
            throw $e;
        }
    }
}
