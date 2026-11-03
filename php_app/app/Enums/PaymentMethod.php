<?php
declare(strict_types=1);

namespace App\Enums;

/**
 * PaymentMethod Enum - PHP 8.1+ Backed Enum
 */
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
}
