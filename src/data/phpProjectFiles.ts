/**
 * Data repository of all PHP 8.3 source code files for the in-app Code Explorer & ZIP Exporter
 */

export interface PhpFileItem {
  path: string;
  name: string;
  category: 'sql' | 'config' | 'enum' | 'core' | 'service' | 'view' | 'doc';
  description: string;
  code: string;
}

export const PHP_PROJECT_FILES: PhpFileItem[] = [
  {
    path: 'sql/database.sql',
    name: 'database.sql',
    category: 'sql',
    description: 'Skema DDL Database MySQL 8.0+ dengan Relasi Foreign Key, Indeks Performa & Data Seeder Awal',
    code: `-- ===================================================
-- SKEMA DATABASE APLIKASI POS & INVENTARIS UMKM
-- DBMS: MySQL 8.0+ / MariaDB 10.4+
-- Engine: InnoDB (Mendukung Foreign Key Constraints & ACID Transaction)
-- ===================================================

CREATE DATABASE IF NOT EXISTS \`pos_umkm\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE \`pos_umkm\`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`sale_details\`;
DROP TABLE IF EXISTS \`sales\`;
DROP TABLE IF EXISTS \`purchase_details\`;
DROP TABLE IF EXISTS \`purchases\`;
DROP TABLE IF EXISTS \`suppliers\`;
DROP TABLE IF EXISTS \`products\`;
DROP TABLE IF EXISTS \`categories\`;
DROP TABLE IF EXISTS \`users\`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABEL USERS (Manajemen Pengguna & Hak Akses RBAC)
CREATE TABLE \`users\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`username\` VARCHAR(50) NOT NULL UNIQUE,
    \`password\` VARCHAR(255) NOT NULL,
    \`full_name\` VARCHAR(100) NOT NULL,
    \`role\` ENUM('owner', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
    \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABEL CATEGORIES (Kategori Produk)
CREATE TABLE \`categories\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL UNIQUE,
    \`description\` TEXT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABEL PRODUCTS (Katalog & Stok Barang)
CREATE TABLE \`products\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`category_id\` INT UNSIGNED NULL,
    \`sku\` VARCHAR(50) NOT NULL UNIQUE,
    \`name\` VARCHAR(150) NOT NULL,
    \`image_url\` VARCHAR(255) NULL,
    \`purchase_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- HPP
    \`selling_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- Harga Jual
    \`stock\` INT NOT NULL DEFAULT 0,
    \`min_stock\` INT NOT NULL DEFAULT 5,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT \`fk_products_category\` 
        FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. TABEL SUPPLIERS (Pemasok Barang Restock)
CREATE TABLE \`suppliers\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`name\` VARCHAR(100) NOT NULL,
    \`phone\` VARCHAR(20) NULL,
    \`address\` TEXT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. TABEL PURCHASES (Header Transaksi Pembelian Stok)
CREATE TABLE \`purchases\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`purchase_code\` VARCHAR(50) NOT NULL UNIQUE,
    \`supplier_id\` INT UNSIGNED NULL,
    \`user_id\` INT UNSIGNED NOT NULL,
    \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`purchase_date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`notes\` TEXT NULL,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT \`fk_purchases_supplier\` 
        FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT \`fk_purchases_user\` 
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. TABEL PURCHASE_DETAILS (Detail Barang Restock)
CREATE TABLE \`purchase_details\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`purchase_id\` INT UNSIGNED NOT NULL,
    \`product_id\` INT UNSIGNED NOT NULL,
    \`qty\` INT NOT NULL,
    \`purchase_price\` DECIMAL(12,2) NOT NULL,
    \`subtotal\` DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT \`fk_pdetails_purchase\` 
        FOREIGN KEY (\`purchase_id\`) REFERENCES \`purchases\` (\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT \`fk_pdetails_product\` 
        FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. TABEL SALES (Header Transaksi Penjualan Kasir)
CREATE TABLE \`sales\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`invoice_number\` VARCHAR(50) NOT NULL UNIQUE,
    \`user_id\` INT UNSIGNED NOT NULL,
    \`total_item\` INT NOT NULL DEFAULT 0,
    \`subtotal\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`discount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`grand_total\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`pay_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`change_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    \`payment_method\` ENUM('cash', 'qris', 'transfer') NOT NULL DEFAULT 'cash',
    \`payment_status\` ENUM('pending', 'settled', 'expired', 'cancelled') NOT NULL DEFAULT 'settled',
    \`midtrans_transaction_id\` VARCHAR(100) NULL,          -- UUID Transaksi Midtrans
    \`payment_reference\` VARCHAR(100) NULL,                -- Acquirer (GoPay / ShopeePay / QRIS)
    \`transaction_date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT \`fk_sales_user\` 
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. TABEL SALE_DETAILS (Detail Item Penjualan Kasir)
CREATE TABLE \`sale_details\` (
    \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`sale_id\` INT UNSIGNED NOT NULL,
    \`product_id\` INT UNSIGNED NOT NULL,
    \`qty\` INT NOT NULL,
    \`cost_price\` DECIMAL(12,2) NOT NULL,
    \`selling_price\` DECIMAL(12,2) NOT NULL,
    \`subtotal\` DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT \`fk_sdetails_sale\` 
        FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\` (\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT \`fk_sdetails_product\` 
        FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- INDEKS
CREATE INDEX \`idx_sales_date\` ON \`sales\` (\`transaction_date\`);
CREATE INDEX \`idx_purchases_date\` ON \`purchases\` (\`purchase_date\`);
CREATE INDEX \`idx_products_name\` ON \`products\` (\`name\`);
CREATE INDEX \`idx_products_sku\` ON \`products\` (\`sku\`);

-- SEEDER
INSERT INTO \`users\` (\`username\`, \`password\`, \`full_name\`, \`role\`, \`is_active\`) VALUES
('owner', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Budi Santoso (Owner)', 'owner', 1),
('kasir', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Siti Rahma (Kasir)', 'cashier', 1);

INSERT INTO \`categories\` (\`name\`, \`description\`) VALUES
('Kopi & Minuman', 'Minuman espresso based, susu, dan teh'),
('Makanan & Snack', 'Camilan dan makanan siap saji'),
('Sembako & Retail', 'Kebutuhan pokok harian toko UMKM');

INSERT INTO \`suppliers\` (\`name\`, \`phone\`, \`address\`) VALUES
('PT Sumber Pangan Makmur', '081234567890', 'Kawasan Industri Rungkut, Surabaya'),
('CV Roastery Kopi Nusantara', '081987654321', 'Jl. Malioboro No. 45, Yogyakarta');

INSERT INTO \`products\` (\`category_id\`, \`sku\`, \`name\`, \`image_url\`, \`purchase_price\`, \`selling_price\`, \`stock\`, \`min_stock\`) VALUES
(1, 'PRD-001', 'Kopi Susu Gula Aren', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60', 8000.00, 18000.00, 45, 10),
(1, 'PRD-002', 'Matcha Latte Ice', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60', 10000.00, 22000.00, 32, 8),
(1, 'PRD-003', 'Americano Dingin', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', 5000.00, 15000.00, 50, 10),
(2, 'PRD-004', 'Croissant Mentega Gurih', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60', 9000.00, 18000.00, 20, 5),
(2, 'PRD-005', 'Kentang Goreng Keju', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', 6000.00, 14000.00, 15, 5),
(3, 'PRD-006', 'Minyak Goreng Sawit 1L', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60', 14500.00, 18500.00, 4, 10);
`
  },
  {
    path: 'config/Database.php',
    name: 'Database.php',
    category: 'config',
    description: 'Singleton PDO Database Handler dengan Prepared Statements aman & error mode exception',
    code: `<?php
declare(strict_types=1);

namespace App\\Config;

use PDO;
use PDOException;

/**
 * Database Singleton Connection Class
 * Menggunakan PDO dengan Prepared Statements & Strict Error Mode
 */
class Database
{
    private static ?PDO $instance = null;

    private static string $host = '127.0.0.1';
    private static string $db   = 'pos_umkm';
    private static string $user = 'root';
    private static string $pass = '';
    private static string $port = '3306';
    private static string $charset = 'utf8mb4';

    private function __construct() {}

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                self::$host,
                self::$port,
                self::$db,
                self::$charset
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Mencegah SQL Injection native
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, self::$user, self::$pass, $options);
            } catch (PDOException $e) {
                error_log("Database Connection Error: " . $e->getMessage());
                die("Koneksi Database Gagal. Periksa konfigurasi MySQL.");
            }
        }

        return self::$instance;
    }
}`
  },
  {
    path: 'app/Enums/UserRole.php',
    name: 'UserRole.php',
    category: 'enum',
    description: 'PHP 8.1+ Backed Enum untuk Hak Akses Role (RBAC) Kasir, Manager, dan Owner',
    code: `<?php
declare(strict_types=1);

namespace App\\Enums;

enum UserRole: string
{
    case OWNER   = 'owner';
    case MANAGER = 'manager';
    case CASHIER = 'cashier';

    public function label(): string
    {
        return match($this) {
            self::OWNER   => 'Pemilik Toko (Owner)',
            self::MANAGER => 'Manajer Operasional',
            self::CASHIER => 'Kasir',
        };
    }

    public function canAccessInventory(): bool
    {
        return match($this) {
            self::OWNER, self::MANAGER => true,
            self::CASHIER => false,
        };
    }

    public function canAccessReports(): bool
    {
        return match($this) {
            self::OWNER, self::MANAGER => true,
            self::CASHIER => false,
        };
    }

    public function canAccessUsers(): bool
    {
        return $this === self::OWNER;
    }
}`
  },
  {
    path: 'app/Enums/PaymentMethod.php',
    name: 'PaymentMethod.php',
    category: 'enum',
    description: 'PHP 8.1+ Backed Enum untuk Metode Pembayaran (Cash, QRIS, Transfer)',
    code: `<?php
declare(strict_types=1);

namespace App\\Enums;

enum PaymentMethod: string
{
    case CASH     = 'cash';
    case QRIS     = 'qris';
    case TRANSFER = 'transfer';

    public function label(): string
    {
        return match($this) {
            self::CASH     => 'Tunai (Cash)',
            self::QRIS     => 'QRIS (GoPay/OVO/ShopeePay/DANA)',
            self::TRANSFER => 'Transfer Bank',
        };
    }
}`
  },
  {
    path: 'app/Core/Session.php',
    name: 'Session.php',
    category: 'core',
    description: 'Manajemen Sesi Aman: HttpOnly, SameSite, Regenerasi ID & Flash Messages',
    code: `<?php
declare(strict_types=1);

namespace App\\Core;

use App\\Enums\\UserRole;

class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.cookie_httponly', '1');
            ini_set('session.use_only_cookies', '1');
            ini_set('session.cookie_samesite', 'Lax');
            session_start();
        }
    }

    public static function set(string $key, mixed $value): void
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    public static function has(string $key): bool
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    public static function regenerate(): void
    {
        self::start();
        session_regenerate_id(true);
    }

    public static function destroy(): void
    {
        self::start();
        $_SESSION = [];
        session_destroy();
    }

    public static function setFlash(string $type, string $message): void
    {
        self::start();
        $_SESSION['_flash'][$type] = $message;
    }

    public static function getFlash(string $type): ?string
    {
        self::start();
        if (isset($_SESSION['_flash'][$type])) {
            $msg = $_SESSION['_flash'][$type];
            unset($_SESSION['_flash'][$type]);
            return $msg;
        }
        return null;
    }

    public static function currentUser(): ?array
    {
        return self::get('user');
    }
}`
  },
  {
    path: 'app/Core/Csrf.php',
    name: 'Csrf.php',
    category: 'core',
    description: 'Proteksi Token CSRF dengan random_bytes dan hash_equals',
    code: `<?php
declare(strict_types=1);

namespace App\\Core;

class Csrf
{
    public static function generateToken(): string
    {
        Session::start();
        if (!Session::has('_csrf_token')) {
            $token = bin2hex(random_bytes(32));
            Session::set('_csrf_token', $token);
        }
        return (string) Session::get('_csrf_token');
    }

    public static function validateToken(?string $token): bool
    {
        Session::start();
        $stored = Session::get('_csrf_token');
        if (!$stored || !$token) {
            return false;
        }
        return hash_equals($stored, $token);
    }

    public static function inputField(): string
    {
        $token = self::generateToken();
        return '<input type="hidden" name="_csrf_token" value="' . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
    }
}`
  },
  {
    path: 'app/Core/AuthMiddleware.php',
    name: 'AuthMiddleware.php',
    category: 'core',
    description: 'Middleware RBAC untuk memverifikasi autentikasi login dan otorisasi role pengguna',
    code: `<?php
declare(strict_types=1);

namespace App\\Core;

use App\\Enums\\UserRole;

class AuthMiddleware
{
    public static function requireAuth(): array
    {
        Session::start();
        $user = Session::currentUser();
        if (!$user) {
            header('Location: login.php');
            exit;
        }
        return $user;
    }

    public static function requireRole(UserRole ...$allowedRoles): array
    {
        $user = self::requireAuth();
        $userRole = UserRole::tryFrom($user['role'] ?? '');

        if (!$userRole || !in_array($userRole, $allowedRoles, true)) {
            Session::setFlash('error', 'Akses ditolak! Anda tidak memiliki izin untuk halaman tersebut.');
            header('Location: pos.php');
            exit;
        }

        return $user;
    }
}`
  },
  {
    path: 'app/Services/PosService.php',
    name: 'PosService.php',
    category: 'service',
    description: 'Transaksi Kasir POS: ACID Transaction, Row-locking (FOR UPDATE), Validasi Stok & Pembuatan Struk',
    code: `<?php
declare(strict_types=1);

namespace App\\Services;

use App\\Config\\Database;
use App\\Enums\\PaymentMethod;
use PDO;
use Exception;

class PosService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

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

        $this->db->beginTransaction();

        try {
            $totalItem = 0;
            $subtotal = 0.0;
            $processedItems = [];

            // 1. Validasi Stok & Snapshot Harga dengan Row-Level Locking
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
                    throw new Exception("Produk ID {$productId} tidak ditemukan.");
                }

                if ((int)$product['stock'] < $qty) {
                    throw new Exception("Stok '{$product['name']}' tidak mencukupi! Sisa: {$product['stock']}, diminta: {$qty}");
                }

                $itemSubtotal = (float)$product['selling_price'] * $qty;
                $subtotal += $itemSubtotal;
                $totalItem += $qty;

                $processedItems[] = [
                    'product_id'     => (int)$product['id'],
                    'name'           => $product['name'],
                    'sku'            => $product['sku'],
                    'qty'            => $qty,
                    'cost_price'     => (float)$product['purchase_price'], // HPP saat transaksi
                    'selling_price'  => (float)$product['selling_price'],
                    'subtotal'       => $itemSubtotal,
                ];
            }

            // 2. Hitung Grand Total & Kembalian
            $discount = max(0.0, $discount);
            $grandTotal = max(0.0, $subtotal - $discount);

            if ($payAmount < $grandTotal && $paymentMethod === PaymentMethod::CASH) {
                throw new Exception("Nominal uang bayar kurang dari total belanja!");
            }

            $changeAmount = ($paymentMethod === PaymentMethod::CASH) ? ($payAmount - $grandTotal) : 0.0;

            // 3. Generate Nomor Invoice (INV-YYYYMMDD-0001)
            $today = date('Ymd');
            $prefix = "INV-{$today}-";
            $stmtInv = $this->db->prepare(
                "SELECT invoice_number FROM sales WHERE invoice_number LIKE :prefix ORDER BY id DESC LIMIT 1"
            );
            $stmtInv->execute([':prefix' => "{$prefix}%"]);
            $lastInv = $stmtInv->fetchColumn();

            $seq = $lastInv ? ((int)substr((string)$lastInv, -4) + 1) : 1;
            $invoiceNumber = $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);

            // 4. Simpan Header Transaksi
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

            // 5. Simpan Detail & Potong Stok Produk Otomatis
            $stmtDetail = $this->db->prepare(
                "INSERT INTO sale_details (sale_id, product_id, qty, cost_price, selling_price, subtotal)
                 VALUES (:sale_id, :product_id, :qty, :cost_price, :selling_price, :subtotal)"
            );

            $stmtStock = $this->db->prepare("UPDATE products SET stock = stock - :qty WHERE id = :id");

            foreach ($processedItems as $item) {
                $stmtDetail->execute([
                    ':sale_id'       => $saleId,
                    ':product_id'    => $item['product_id'],
                    ':qty'           => $item['qty'],
                    ':cost_price'    => $item['cost_price'],
                    ':selling_price' => $item['selling_price'],
                    ':subtotal'      => $item['subtotal'],
                ]);

                $stmtStock->execute([
                    ':qty' => $item['qty'],
                    ':id'  => $item['product_id'],
                ]);
            }

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
            $this->db->rollBack();
            throw $e;
        }
    }
}`
  },
  {
    path: 'app/Services/InventoryService.php',
    name: 'InventoryService.php',
    category: 'service',
    description: 'Manajemen Produk & Penerimaan Restock dengan Rumus Weighted Average HPP',
    code: `<?php
declare(strict_types=1);

namespace App\\Services;

use App\\Config\\Database;
use PDO;
use Exception;

class InventoryService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getProducts(?string $search = null, ?int $categoryId = null): array
    {
        $sql = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1";
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

    public function processRestock(int $userId, ?int $supplierId, array $items, ?string $notes = null): array
    {
        if (empty($items)) {
            throw new Exception("Daftar barang restock kosong.");
        }

        $this->db->beginTransaction();

        try {
            $totalAmount = 0.0;
            $today = date('Ymd');
            $prefix = "PUR-{$today}-";
            $stmtLast = $this->db->prepare("SELECT purchase_code FROM purchases WHERE purchase_code LIKE :prefix ORDER BY id DESC LIMIT 1");
            $stmtLast->execute([':prefix' => "{$prefix}%"]);
            $lastCode = $stmtLast->fetchColumn();

            $seq = $lastCode ? ((int)substr((string)$lastCode, -3) + 1) : 1;
            $purchaseCode = $prefix . str_pad((string)$seq, 3, '0', STR_PAD_LEFT);

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

                $stmtProd->execute([':id' => $productId]);
                $prod = $stmtProd->fetch();
                if (!$prod) throw new Exception("Produk ID {$productId} tidak valid.");

                $oldStock = (int)$prod['stock'];
                $oldHpp = (float)$prod['purchase_price'];
                $subtotal = $qty * $unitPrice;
                $totalAmount += $subtotal;

                // Rumus Weighted Average HPP (Moving Average):
                $newHpp = ($oldStock > 0) 
                    ? round((($oldStock * $oldHpp) + ($qty * $unitPrice)) / ($oldStock + $qty), 2)
                    : $unitPrice;

                $stmtDetail->execute([
                    ':purchase_id' => $purchaseId,
                    ':product_id'  => $productId,
                    ':qty'         => $qty,
                    ':price'       => $unitPrice,
                    ':subtotal'    => $subtotal,
                ]);

                $stmtUpdateStock->execute([
                    ':qty'     => $qty,
                    ':new_hpp' => $newHpp,
                    ':id'      => $productId,
                ]);
            }

            $stmtTotal = $this->db->prepare("UPDATE purchases SET total_amount = :total WHERE id = :id");
            $stmtTotal->execute([':total' => $totalAmount, ':id' => $purchaseId]);

            $this->db->commit();
            return ['purchase_id' => $purchaseId, 'purchase_code' => $purchaseCode, 'total_amount' => $totalAmount];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}`
  },
  {
    path: 'app/Services/ReportService.php',
    name: 'ReportService.php',
    category: 'service',
    description: 'Analitik Laba Bersih = SUM(Harga Jual - HPP) * Qty - Diskon, Top 10 Produk, & Trend Transaksi',
    code: `<?php
declare(strict_types=1);

namespace App\\Services;

use App\\Config\\Database;
use PDO;

class ReportService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getTodaySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE DATE(s.transaction_date) = CURRENT_DATE";
        return $this->db->query($sql)->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

    public function getWeeklySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        return $this->db->query($sql)->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

    public function getMonthlySummary(): array
    {
        $sql = "SELECT 
                    COALESCE(COUNT(DISTINCT s.id), 0) AS total_transaksi,
                    COALESCE(SUM(s.grand_total), 0) AS total_omset,
                    COALESCE(SUM((sd.selling_price - sd.cost_price) * sd.qty) - SUM(s.discount), 0) AS total_laba_bersih
                FROM sales s
                LEFT JOIN sale_details sd ON s.id = sd.sale_id
                WHERE s.transaction_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        return $this->db->query($sql)->fetch() ?: ['total_transaksi' => 0, 'total_omset' => 0, 'total_laba_bersih' => 0];
    }

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
}`
  },
  {
    path: 'app/Services/MidtransService.php',
    name: 'MidtransService.php',
    category: 'service',
    description: 'Integrasi Midtrans GoPay & QRIS POS: Charge Dynamic QRIS, Status Polling & SHA-512 Verification',
    code: `<?php
declare(strict_types=1);

namespace App\\Services;

use Exception;

/**
 * MidtransService - Integrasi Midtrans GoPay / QRIS POS (Point of Sale)
 * Berdasarkan Spesifikasi Resmi: https://docs.midtrans.com/docs/gopay-qris-pos-integration
 */
class MidtransService
{
    private string $serverKey;
    private string $clientKey;
    private string $merchantId;
    private bool $isProduction;

    public function __construct(
        ?string $serverKey = null,
        ?string $clientKey = null,
        ?string $merchantId = null,
        bool $isProduction = false
    ) {
        $this->serverKey = $serverKey ?? getenv('MIDTRANS_SERVER_KEY') ?: 'SB-Mid-server-DemoKeyZefaPos889';
        $this->clientKey = $clientKey ?? getenv('MIDTRANS_CLIENT_KEY') ?: 'SB-Mid-client-DemoKeyZefaPos889';
        $this->merchantId = $merchantId ?? getenv('MIDTRANS_MERCHANT_ID') ?: 'G901238472';
        $this->isProduction = $isProduction;
    }

    private function getBaseUrl(): string
    {
        return $this->isProduction 
            ? 'https://api.midtrans.com/v2' 
            : 'https://api.sandbox.midtrans.com/v2';
    }

    /**
     * Membuat Transaksi Dynamic QRIS GoPay untuk Kasir POS
     */
    public function chargeGopayQris(
        string $orderId,
        int $grossAmount,
        array $items = [],
        array $customer = [],
        int $expiryMinutes = 15
    ): array {
        $endpoint = $this->getBaseUrl() . '/charge';

        $payload = [
            'payment_type' => 'gopay',
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'gopay' => [
                'enable_callback' => true,
                'callback_url'    => 'kedaieszefa://order-status',
            ],
            'custom_expiry' => [
                'expiry_duration' => $expiryMinutes,
                'unit'            => 'minute',
            ],
        ];

        if (!empty($items)) {
            $payload['item_details'] = array_map(function($i) {
                return [
                    'id'       => (string) ($i['id'] ?? $i['product_id'] ?? 'ITEM'),
                    'price'    => (int) ($i['price'] ?? $i['selling_price'] ?? 0),
                    'quantity' => (int) ($i['quantity'] ?? $i['qty'] ?? 1),
                    'name'     => substr((string) ($i['name'] ?? 'Item Produk'), 0, 50),
                ];
            }, $items);
        }

        $payload['customer_details'] = [
            'first_name' => $customer['name'] ?? 'Pelanggan Kedai ES Zefa',
            'email'      => $customer['email'] ?? 'customer@kedaieszefa.com',
            'phone'      => $customer['phone'] ?? '0812000000',
        ];

        return $this->sendRequest('POST', $endpoint, $payload);
    }

    public function checkStatus(string $orderId): array
    {
        $endpoint = $this->getBaseUrl() . '/' . urlencode($orderId) . '/status';
        return $this->sendRequest('GET', $endpoint);
    }

    public function cancelTransaction(string $orderId): array
    {
        $endpoint = $this->getBaseUrl() . '/' . urlencode($orderId) . '/cancel';
        return $this->sendRequest('POST', $endpoint);
    }

    public function verifySignature(
        string $orderId,
        string $statusCode,
        string $grossAmount,
        string $receivedSignature
    ): bool {
        $rawString = $orderId . $statusCode . $grossAmount . $this->serverKey;
        $calculatedSignature = hash('sha512', $rawString);
        return hash_equals($calculatedSignature, $receivedSignature);
    }

    private function sendRequest(string $method, string $url, ?array $payload = null): array
    {
        $curl = curl_init();
        $authHeader = 'Basic ' . base64_encode($this->serverKey . ':');

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: ' . $authHeader,
        ];

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_CUSTOMREQUEST  => $method,
        ];

        if ($method === 'POST' && $payload !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($payload);
        }

        curl_setopt_array($curl, $options);
        $response = curl_exec($curl);
        curl_close($curl);

        return json_decode((string) $response, true) ?: [];
    }
}`
  },
  {
    path: 'public/midtrans-webhook.php',
    name: 'midtrans-webhook.php',
    category: 'core',
    description: 'Webhook Notifikasi Midtrans: Verifikasi Signature SHA-512 & Auto Settlement DB Sales',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Services/MidtransService.php';

use App\\Config\\Database;
use App\\Services\\MidtransService;

header('Content-Type: application/json; charset=utf-8');

$rawInput = file_get_contents('php://input');
$notification = json_decode($rawInput, true);

if (!is_array($notification)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
    exit;
}

$orderId       = $notification['order_id'] ?? '';
$statusCode    = $notification['status_code'] ?? '';
$grossAmount   = $notification['gross_amount'] ?? '';
$signatureKey  = $notification['signature_key'] ?? '';
$trxStatus     = $notification['transaction_status'] ?? '';
$transactionId = $notification['transaction_id'] ?? '';

$midtransService = new MidtransService();
if (!$midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid SHA-512 Signature Key']);
    exit;
}

try {
    $db = Database::getConnection();
    $finalStatus = match ($trxStatus) {
        'capture', 'settlement' => 'settled',
        'deny', 'cancel'        => 'cancelled',
        'expire'                => 'expired',
        default                 => 'pending'
    };

    $stmt = $db->prepare(
        "UPDATE sales 
         SET payment_status = :status,
             midtrans_transaction_id = :trx_id,
             payment_reference = 'Midtrans GoPay QRIS'
         WHERE invoice_number = :invoice"
    );

    $stmt->execute([
        ':status'  => $finalStatus,
        ':trx_id'  => $transactionId,
        ':invoice' => $orderId
    ]);

    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Settlement processed']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
`
  },
  {
    path: 'public/api/midtrans-charge.php',
    name: 'midtrans-charge.php',
    category: 'core',
    description: 'AJAX API Endpoint Kasir: Create Dynamic GoPay / QRIS Charge ke Midtrans Core API',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../app/Core/Session.php';
require_once __DIR__ . '/../../app/Services/MidtransService.php';

use App\\Core\\Session;
use App\\Services\\MidtransService;

header('Content-Type: application/json; charset=utf-8');
Session::start();

if (!Session::currentUser()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

try {
    $midtrans = new MidtransService();
    $res = $midtrans->chargeGopayQris(
        (string) $payload['order_id'],
        (int) $payload['gross_amount'],
        (array) ($payload['items'] ?? [])
    );

    echo json_encode([
        'success'        => true,
        'order_id'       => $payload['order_id'],
        'qr_string'      => $res['qr_string'] ?? null,
        'transaction_id' => $res['transaction_id'] ?? null,
        'status'         => $res['transaction_status'] ?? 'pending'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}`
  },
  {
    path: 'public/api/midtrans-status.php',
    name: 'midtrans-status.php',
    category: 'core',
    description: 'AJAX API Endpoint Kasir: Polling Status Settlement Midtrans Realtime',
    code: `<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../app/Core/Session.php';
require_once __DIR__ . '/../../app/Services/MidtransService.php';

use App\\Core\\Session;
use App\\Services\\MidtransService;

header('Content-Type: application/json; charset=utf-8');
Session::start();

$orderId = (string) ($_GET['order_id'] ?? '');

try {
    $midtrans = new MidtransService();
    $res = $midtrans->checkStatus($orderId);
    $status = $res['transaction_status'] ?? 'pending';

    echo json_encode([
        'success'    => true,
        'order_id'   => $orderId,
        'status'     => $status,
        'is_settled' => in_array($status, ['settlement', 'capture'], true)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}`
  },
  {
    path: 'public/pos.php',
    name: 'pos.php',
    category: 'view',
    description: 'Halaman Terminal Kasir POS Utama: Grid Produk, Realtime Cart, Kembalian & Cetak Struk',
    code: `<!-- Lihat file php_app/public/pos.php lengkap di direktori project -->`
  },
  {
    path: 'public/reports.php',
    name: 'reports.php',
    category: 'view',
    description: 'Dashboard Laporan & Analitik Keuntungan: Widget KPI, Grafik Trend, Top 10 Produk & Filter',
    code: `<!-- Lihat file php_app/public/reports.php lengkap di direktori project -->`
  },
  {
    path: 'public/products.php',
    name: 'products.php',
    category: 'view',
    description: 'Halaman Inventaris Katalog Produk: Tambah, Edit, Hapus, Alert Stok Minimum',
    code: `<!-- Lihat file php_app/public/products.php lengkap di direktori project -->`
  },
  {
    path: 'public/purchases.php',
    name: 'purchases.php',
    category: 'view',
    description: 'Halaman Penerimaan Barang Restock dari Supplier & Perhitungan HPP Rata-Rata',
    code: `<!-- Lihat file php_app/public/purchases.php lengkap di direktori project -->`
  },
  {
    path: 'public/users.php',
    name: 'users.php',
    category: 'view',
    description: 'Manajemen Pengguna & Role Access Control (Owner only)',
    code: `<!-- Lihat file php_app/public/users.php lengkap di direktori project -->`
  },
  {
    path: 'public/login.php',
    name: 'login.php',
    category: 'view',
    description: 'Halaman Login Otentikasi Password Bcrypt & Session Regeneration',
    code: `<!-- Lihat file php_app/public/login.php lengkap di direktori project -->`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'doc',
    description: 'Dokumentasi Panduan Instalasi (XAMPP / Laragon / Docker), Konfigurasi & Kredensial',
    code: `# KASIR-UMKM Pro - Aplikasi POS & Inventaris Berbasis Web (PHP 8.3+ Native OOP)`
  }
];
