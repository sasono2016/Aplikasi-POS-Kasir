<?php
declare(strict_types=1);

/**
 * AJAX Endpoint: Generate Dynamic QRIS Charge dari Layar Kasir POS
 */

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/../../app/Core/Session.php';
require_once __DIR__ . '/../../app/Services/MidtransService.php';

use App\Core\Session;
use App\Services\MidtransService;

header('Content-Type: application/json; charset=utf-8');

Session::start();
if (!Session::currentUser()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi login telah berakhir']);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!isset($payload['order_id'], $payload['gross_amount'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter order_id dan gross_amount wajib diisi']);
    exit;
}

$orderId = (string) $payload['order_id'];
$grossAmount = (int) $payload['gross_amount'];
$items = (array) ($payload['items'] ?? []);

try {
    $midtrans = new MidtransService();
    $chargeResponse = $midtrans->chargeGopayQris($orderId, $grossAmount, $items);

    // Ambil URL QR code gambar & deeplink dari array actions
    $qrUrl = null;
    $deeplinkUrl = null;
    if (isset($chargeResponse['actions']) && is_array($chargeResponse['actions'])) {
        foreach ($chargeResponse['actions'] as $act) {
            if (($act['name'] ?? '') === 'generate-qr-code') {
                $qrUrl = $act['url'] ?? null;
            } elseif (($act['name'] ?? '') === 'deeplink-redirect') {
                $deeplinkUrl = $act['url'] ?? null;
            }
        }
    }

    echo json_encode([
        'success'        => true,
        'order_id'       => $orderId,
        'gross_amount'   => $grossAmount,
        'transaction_id' => $chargeResponse['transaction_id'] ?? null,
        'qr_string'      => $chargeResponse['qr_string'] ?? null,
        'qr_url'         => $qrUrl,
        'deeplink_url'   => $deeplinkUrl,
        'status'         => $chargeResponse['transaction_status'] ?? 'pending',
        'raw_response'   => $chargeResponse
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menghubungi Midtrans API: ' . $e->getMessage()
    ]);
}
