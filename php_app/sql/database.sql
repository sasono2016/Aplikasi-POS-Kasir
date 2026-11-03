-- ===================================================
-- SKEMA DATABASE APLIKASI POS & INVENTARIS UMKM
-- DBMS: MySQL 8.0+ / MariaDB 10.4+
-- Engine: InnoDB (Mendukung Foreign Key Constraints & ACID Transaction)
-- ===================================================

CREATE DATABASE IF NOT EXISTS `pos_umkm` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `pos_umkm`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sale_details`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `purchase_details`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------
-- 1. TABEL USERS (Manajemen Pengguna & Hak Akses RBAC)
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
    `sku` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `purchase_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- HPP (Harga Pokok Penjualan)
    `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- Harga Jual Kasir
    `stock` INT NOT NULL DEFAULT 0,
    `min_stock` INT NOT NULL DEFAULT 5,                   -- Ambang batas stok tipis
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
    `purchase_code` VARCHAR(50) NOT NULL UNIQUE,
    `supplier_id` INT UNSIGNED NULL,
    `user_id` INT UNSIGNED NOT NULL,                      -- Petugas input
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
    `purchase_price` DECIMAL(12,2) NOT NULL,              -- Harga beli per unit
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
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,         -- Nomor Struk/Faktur
    `user_id` INT UNSIGNED NOT NULL,                      -- Kasir yang bertransaksi
    `total_item` INT NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `pay_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `change_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `payment_method` ENUM('cash', 'qris', 'transfer') NOT NULL DEFAULT 'cash',
    `payment_status` ENUM('pending', 'settled', 'expired', 'cancelled') NOT NULL DEFAULT 'settled',
    `midtrans_transaction_id` VARCHAR(100) NULL,          -- UUID Transaksi Midtrans
    `payment_reference` VARCHAR(100) NULL,                -- Catatan/Acquirer (GoPay / ShopeePay / QRIS)
    `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_sales_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- 8. TABEL SALE_DETAILS (Detail Item Penjualan Kasir)
-- ---------------------------------------------------
CREATE TABLE `sale_details` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `qty` INT NOT NULL,
    `cost_price` DECIMAL(12,2) NOT NULL,                  -- Snapshot HPP saat transaksi (kunci laba bersih!)
    `selling_price` DECIMAL(12,2) NOT NULL,               -- Snapshot Harga Jual saat transaksi
    `subtotal` DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT `fk_sdetails_sale` 
        FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sdetails_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===================================================
-- INDEKS PERFORMA
-- ===================================================
CREATE INDEX `idx_sales_date` ON `sales` (`transaction_date`);
CREATE INDEX `idx_purchases_date` ON `purchases` (`purchase_date`);
CREATE INDEX `idx_products_name` ON `products` (`name`);
CREATE INDEX `idx_products_sku` ON `products` (`sku`);

-- ===================================================
-- DATA AWAL (SEEDER DEMO)
-- Akun Login:
-- 1. Owner   -> username: owner | password: password123
-- 2. Kasir   -> username: kasir | password: password123
-- ===================================================
INSERT INTO `users` (`username`, `password`, `full_name`, `role`, `is_active`) VALUES
('owner', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Budi Santoso (Owner)', 'owner', 1),
('kasir', '$2y$10$8K1p/a0dL1LXMIgoEDFrw.B5sF9NqjZ512K/lM.gOQe19jG2rD/2i', 'Siti Rahma (Kasir)', 'cashier', 1);

INSERT INTO `categories` (`name`, `description`) VALUES
('Kopi & Minuman', 'Minuman espresso based, susu, dan teh'),
('Makanan & Snack', 'Camilan dan makanan siap saji'),
('Sembako & Retail', 'Kebutuhan pokok harian toko UMKM');

INSERT INTO `suppliers` (`name`, `phone`, `address`) VALUES
('PT Sumber Pangan Makmur', '081234567890', 'Kawasan Industri Rungkut, Surabaya'),
('CV Roastery Kopi Nusantara', '081987654321', 'Jl. Malioboro No. 45, Yogyakarta');

INSERT INTO `products` (`category_id`, `sku`, `name`, `image_url`, `purchase_price`, `selling_price`, `stock`, `min_stock`) VALUES
(1, 'PRD-001', 'Kopi Susu Gula Aren', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60', 8000.00, 18000.00, 45, 10),
(1, 'PRD-002', 'Matcha Latte Ice', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60', 10000.00, 22000.00, 32, 8),
(1, 'PRD-003', 'Americano Dingin', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', 5000.00, 15000.00, 50, 10),
(2, 'PRD-004', 'Croissant Mentega Gurih', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60', 9000.00, 18000.00, 20, 5),
(2, 'PRD-005', 'Kentang Goreng Keju', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', 6000.00, 14000.00, 15, 5),
(3, 'PRD-006', 'Minyak Goreng Sawit 1L', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60', 14500.00, 18500.00, 4, 10);
