<?php
declare(strict_types=1);

/**
 * Endpoint Webhook Notifikasi Midtrans
 * URL: https://yourdomain.com/php_app/public/midtrans-webhook.php
 * 
 * Midtrans mengirimkan HTTP POST otomatis saat status pembayaran berubah
 * (misal: pending -> settlement setelah konsumen scan QRIS via GoPay/BCA/Dana/dll)
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Services/MidtransService.php';

use App\Config\Database;
use App\Services\MidtransService;

header('Content-Type: application/json; charset=utf-8');

// 1. Tangkap Raw Body JSON dari Midtrans
$rawInput = file_get_contents('php://input');
$notification = json_decode($rawInput, true);

if (!is_array($notification)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON Payload']);
    exit;
}

$orderId       = $notification['order_id'] ?? '';
$statusCode    = $notification['status_code'] ?? '';
$grossAmount   = $notification['gross_amount'] ?? '';
$signatureKey  = $notification['signature_key'] ?? '';
$trxStatus     = $notification['transaction_status'] ?? '';
$paymentType   = $notification['payment_type'] ?? '';
$transactionId = $notification['transaction_id'] ?? '';
$fraudStatus   = $notification['fraud_status'] ?? 'accept';

// 2. Verifikasi SHA-512 Signature Hash Keamanan
$midtransService = new MidtransService();
$isValidSignature = $midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey);

if (!$isValidSignature) {
    http_response_code(403);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Akses ditolak: Signature Key tidak cocok! Potensi pemalsuan payload.'
    ]);
    exit;
}

// 3. Update Status Transaksi di Database POS
try {
    $db = Database::getConnection();

    // Map status Midtrans ke status internal POS
    $finalStatus = match ($trxStatus) {
        'capture', 'settlement' => 'settled',
        'pending'               => 'pending',
        'deny', 'cancel'        => 'cancelled',
        'expire'                => 'expired',
        default                 => 'pending'
    };

    $stmt = $db->prepare(
        "UPDATE sales 
         SET payment_status = :status,
             midtrans_transaction_id = :trx_id,
             payment_reference = :ref
         WHERE invoice_number = :invoice"
    );

    $stmt->execute([
        ':status'  => $finalStatus,
        ':trx_id'  => $transactionId,
        ':ref'     => 'Midtrans ' . strtoupper($paymentType),
        ':invoice' => $orderId
    ]);

    // Respon HTTP 200 OK ke Midtrans agar tidak dikirim ulang
    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Status pembayaran order ' . $orderId . ' berhasil disinkronkan ke ' . $finalStatus
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Database update error: ' . $e->getMessage()
    ]);
}
