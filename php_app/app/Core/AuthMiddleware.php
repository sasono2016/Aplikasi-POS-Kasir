<?php
declare(strict_types=1);

namespace App\Core;

use App\Enums\UserRole;

/**
 * Authentication & RBAC Authorization Middleware
 */
class AuthMiddleware
{
    /**
     * Memastikan user telah login. Jika belum, redirect ke login.php.
     */
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

    /**
     * Membatasi akses hanya untuk role tertentu (misal: OWNER / MANAGER).
     */
    public static function requireRole(UserRole ...$allowedRoles): array
    {
        $user = self::requireAuth();
        $userRole = UserRole::tryFrom($user['role'] ?? '');

        if (!$userRole || !in_array($userRole, $allowedRoles, true)) {
            // Tampilkan forbidden atau redirect dengan flash alert
            Session::setFlash('error', 'Akses ditolak! Anda tidak memiliki izin untuk membuka halaman tersebut.');
            header('Location: pos.php');
            exit;
        }

        return $user;
    }
}
