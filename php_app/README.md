# KASIR-UMKM Pro - Aplikasi POS & Inventaris Berbasis Web (PHP 8.3+ Native OOP)

Aplikasi Point of Sale (POS) Kasir dan Inventaris Stok UMKM modern dengan arsitektur Native OOP, Typed Properties, Backed Enums, Prepared Statements (PDO), CSRF Protection, ACID Transactions, dan Tailwind CSS.

---

## 🚀 Fitur Utama
1. **Terminal POS Kasir Modern:**
   - Grid visual katalog produk dengan foto, harga, dan indikator sisa stok realtime.
   - Live search (nama / SKU) & Filter kategori tanpa reload.
   - Panel Keranjang Belanja interaktif (tambah, kurang, hapus item).
   - Kalkulasi otomatis Subtotal, Diskon, Grand Total.
   - Pilihan metode bayar: Tunai (Cash), QRIS, Transfer Bank.
   - Kalkulasi uang kembalian instan secara client-side (JavaScript).
   - Validasi stok ketat (mencegah transaksi jika stok 0 / melebihi kuantitas).
   - Cetak struk/nota penjualan instan (Print Modal).

2. **Manajemen Inventaris & Restock (Pembelian):**
   - CRUD Produk: Nama, SKU, Kategori, Harga Beli (HPP), Harga Jual, Stok saat ini, Ambang batas stok minimum.
   - Transaksi Penerimaan Barang (Restock): Input barang masuk dari supplier.
   - **Kalkulasi Moving Average HPP (Weighted Average Cost)** otomatis:
     $$\text{HPP Baru} = \frac{(\text{Stok Lama} \times \text{HPP Lama}) + (\text{Qty Beli} \times \text{Harga Beli Baru})}{\text{Stok Lama} + \text{Qty Beli}}$$
   - Penambahan stok otomatis secara atomic dalam database transaction.

3. **Keamanan & Role-Based Access Control (RBAC):**
   - **Role Kasir (`cashier`)**: Hanya dapat mengakses kasir/POS dan memproses checkout.
   - **Role Manajer (`manager`)**: Akses POS, Inventaris Produk, Restock, dan Laporan Keuangan.
   - **Role Pemilik (`owner`)**: Akses penuh ke seluruh fitur termasuk Manajemen Pengguna.
   - Enkripsi password menggunakan `password_hash(..., PASSWORD_BCRYPT)`.
   - Proteksi CSRF token di setiap form & request AJAX.
   - Mitigasi SQL Injection menggunakan PDO Prepared Statements dengan native types.

4. **Dashboard Analitik & Laporan Trend:**
   - Widget KPI: Omset & Transaksi Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir.
   - Perhitungan **Total Keuntungan Bersih (Net Profit)** = $\sum(\text{Harga Jual} - \text{HPP}) \times \text{Qty} - \text{Diskon}$.
   - Ranking 10 Produk Terlaris (Top Selling Products).
   - Visualisasi Trend Harian Omset vs Laba Bersih.
   - Filter Riwayat Faktur Penjualan berdasarkan rentang tanggal.

5. **Integrasi Midtrans GoPay / QRIS POS (Core API Dynamic QR):**
   - Integrasi resmi sesuai panduan: https://docs.midtrans.com/docs/gopay-qris-pos-integration
   - Generate Dynamic QRIS EMVCo via endpoint `/v2/charge` (`payment_type: gopay` / `qris`).
   - Customer-Facing & Cashier POS QR Display dengan countdown masa berlaku 15 menit.
   - Status polling otomatis setiap 3 detik (`/v2/{order_id}/status`) tanpa perlu refresh halaman.
   - Webhook notifikasi otomatis (`public/midtrans-webhook.php`) dengan validasi SHA-512 Signature Hash.
   - Simulator pengujian sandbox terintegrasi untuk test settlement dan expire.

---

## 📁 Struktur Direktori Project
```
php_app/
├── app/
│   ├── Core/
│   │   ├── AuthMiddleware.php  # Guard RBAC & Session Check
│   │   ├── Csrf.php            # CSRF Token Generator & Validator
│   │   └── Session.php         # Sesi Aman, Flash Messages, Regenerasi ID
│   ├── Enums/
│   │   ├── PaymentMethod.php   # Backed Enum: cash, qris, transfer
│   │   └── UserRole.php        # Backed Enum: owner, manager, cashier
│   └── Services/
│       ├── InventoryService.php # CRUD Produk, Restock & Hitung Rata-Rata HPP
│       ├── MidtransService.php  # Integrasi Midtrans Core API (GoPay QRIS POS)
│       ├── PosService.php       # Transaksi Kasir, Validasi Stok, Invoice
│       └── ReportService.php    # Agregasi Omset, Laba Bersih & Trend
├── config/
│   └── Database.php            # PDO Singleton Connection (MySQL/MariaDB)
├── public/
│   ├── api/
│   │   ├── midtrans-charge.php # AJAX endpoint generate QRIS Midtrans
│   │   └── midtrans-status.php # AJAX endpoint status polling Midtrans
│   ├── index.php               # Front Controller / Redirector
│   ├── login.php               # Form Login & Otentikasi Bcrypt
│   ├── logout.php              # Destruksi Sesi
│   ├── midtrans-webhook.php    # Webhook listener HTTP POST dari Midtrans (SHA-512)
│   ├── pos.php                 # Terminal Kasir POS & Dynamic QRIS Modal
│   ├── products.php            # Manajemen Inventaris & Katalog Produk
│   ├── purchases.php           # Penerimaan Barang Restock dari Supplier
│   ├── reports.php             # Dashboard Analitik & Laporan Trend
│   └── users.php               # Manajemen Pengguna & Hak Akses
├── sql/
│   └── database.sql            # DDL Schema, Relasi Foreign Key, Midtrans Fields & Seeder
└── README.md
```

---

## 🛠️ Cara Instalasi & Menjalankan

### Persyaratan Sistem:
- PHP 8.3 atau lebih baru (dengan ekstensi `pdo_mysql`, `mbstring`)
- MySQL 8.0+ atau MariaDB 10.4+
- Web Server: Apache / Nginx / XAMPP / Laragon, atau PHP Built-in Server.

### Langkah-langkah:
1. **Import Database:**
   - Buka phpMyAdmin / HeidiSQL / MySQL CLI.
   - Buat database `pos_umkm` (atau jalankan langsung file `sql/database.sql`).
   ```bash
   mysql -u root -p < sql/database.sql
   ```

2. **Konfigurasi Database:**
   - Buka file `config/Database.php`.
   - Sesuaikan `$host`, `$db`, `$user`, dan `$pass` sesuai server Anda.

3. **Jalankan Aplikasi:**
   - **Opsi A (PHP Built-in Server - Paling Cepat):**
     Buka terminal di dalam folder `php_app`, lalu jalankan:
     ```bash
     php -S localhost:8000 -t public
     ```
     Buka browser di `http://localhost:8000`.
   - **Opsi B (XAMPP / Laragon):**
     Pindahkan folder `php_app` ke `htdocs` atau `www`, lalu akses `http://localhost/php_app/public/`.

4. **Login Default:**
   - **Owner:** Username: `owner` | Password: `password123`
   - **Kasir:** Username: `kasir` | Password: `password123`
