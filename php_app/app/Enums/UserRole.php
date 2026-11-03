<?php
declare(strict_types=1);

namespace App\Enums;

/**
 * UserRole Enum - PHP 8.1+ Backed Enum untuk Role-Based Access Control (RBAC)
 */
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
}
