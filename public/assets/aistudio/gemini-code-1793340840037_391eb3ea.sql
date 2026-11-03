-- ===================================================
-- SKEMA DATABASE APLIKASI POS & INVENTARIS UMKM
-- DBMS: MySQL 8.0+ / MariaDB 10.4+
-- Engine: InnoDB (Mendukung Foreign Key Constraints & Transaksi)
-- ===================================================

CREATE DATABASE IF NOT EXISTS `pos_umkm` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `pos_umkm`;

-- ---------------------------------------------------
-- 1. TABEL USERS (Manajemen Pengguna & Hak Akses)
-- ---------------------------------------------------
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `role` ENUM('owner', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 2. TABEL CATEGORIES (Kategori Produk)
-- ---------------------------------------------------
CREATE TABLE `categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 3. TABEL PRODUCTS (Katalog & Stok Barang)
-- ---------------------------------------------------
CREATE TABLE `products` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT UNSIGNED NULL,
    `sku` VARCHAR(50) NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- HPP / Harga Beli Terakhir
    `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- Harga Jual
    `stock` INT NOT NULL DEFAULT 0,
    `min_stock` INT NOT NULL DEFAULT 5,                   -- Alert Stok Minimum
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_products_category` 
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 4. TABEL SUPPLIERS (Pemasok Barang Restock)
-- ---------------------------------------------------
CREATE TABLE `suppliers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 5. TABEL PURCHASES (Header Transaksi Pembelian Stok)
-- ---------------------------------------------------
CREATE TABLE `purchases` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `purchase_code` VARCHAR(50) NOT NULL UNIQUE,          -- misal: PUR-20261030-001
    `supplier_id` INT UNSIGNED NULL,
    `user_id` INT UNSIGNED NOT NULL,                      -- Penginput (Manager/Owner)
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `purchase_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_purchases_supplier` 
        FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_purchases_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 6. TABEL PURCHASE_DETAILS (Detail Barang Restock)
-- ---------------------------------------------------
CREATE TABLE `purchase_details` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `purchase_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `qty` INT NOT NULL,
    `purchase_price` DECIMAL(12,2) NOT NULL,              -- Harga beli per unit saat restock
    `subtotal` DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT `fk_pdetails_purchase` 
        FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_pdetails_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 7. TABEL SALES (Header Transaksi Penjualan Kasir)
-- ---------------------------------------------------
CREATE TABLE `sales` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,         -- misal: INV-20261030-0001
    `user_id` INT UNSIGNED NOT NULL,                      -- Kasir yang bertugas
    `total_item` INT NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `pay_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `change_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `payment_method` ENUM('cash', 'qris', 'transfer') NOT NULL DEFAULT 'cash',
    `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_sales_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 8. TABEL SALE_DETAILS (Detail Item Terjual)
-- ---------------------------------------------------
CREATE TABLE `sale_details` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `qty` INT NOT NULL,
    `cost_price` DECIMAL(12,2) NOT NULL,                  -- HPP saat transaksi terjadi (untuk hitung profit)
    `selling_price` DECIMAL(12,2) NOT NULL,               -- Harga jual saat transaksi
    `subtotal` DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT `fk_sdetails_sale` 
        FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sdetails_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===================================================
-- INDEKS PERFORMA (Optimasi Laporan Trend & Pencarian)
-- ===================================================
CREATE INDEX `idx_sales_date` ON `sales` (`transaction_date`);
CREATE INDEX `idx_purchases_date` ON `purchases` (`purchase_date`);
CREATE INDEX `idx_products_name` ON `products` (`name`);

-- ===================================================
-- DATA AWAL (SEEDER)
-- Default Login: 
-- 1. Owner   (username: owner, password: password123)
-- 2. Kasir   (username: kasir, password: password123)
-- ===================================================
INSERT INTO `users` (`username`, `password`, `full_name`, `role`) VALUES
('owner', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Pemilik Toko', 'owner'),
('kasir', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Kasir Utama', 'cashier');

INSERT INTO `categories` (`name`, `description`) VALUES
('Makanan', 'Aneka makanan ringan dan berat'),
('Minuman', 'Minuman dingin dan hangat');