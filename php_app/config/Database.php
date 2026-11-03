<?php
declare(strict_types=1);

namespace App\Config;

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

    private function __construct()
    {
        // Singleton pattern: Mencegah instansiasi langsung
    }

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
                PDO::ATTR_EMULATE_PREPARES   => false, // Mencegah SQL Injection via native prepared statements
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, self::$user, self::$pass, $options);
            } catch (PDOException $e) {
                // Log error internal & tampilkan pesan aman kepada user
                error_log("Database Connection Error: " . $e->getMessage());
                die("Koneksi Database Gagal. Pastikan server MySQL berjalan dan konfigurasi telah disesuaikan.");
            }
        }

        return self::$instance;
    }
}
