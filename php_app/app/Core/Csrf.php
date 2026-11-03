<?php
declare(strict_types=1);

namespace App\Core;

/**
 * CSRF Protection Helper
 * Menghasilkan dan memvalidasi token CSRF anti cross-site request forgery.
 */
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
}
