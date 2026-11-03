<?php
declare(strict_types=1);

/**
 * AJAX Endpoint: Polling Status Pembayaran Midtrans dari Layar Kasir POS
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

$orderId = (string) ($_GET['order_id'] ?? '');
if (!$orderId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parameter order_id wajib disertakan']);
    exit;
}

try {
    $midtrans = new MidtransService();
    $statusResponse = $midtrans->checkStatus($orderId);

    $trxStatus = $statusResponse['transaction_status'] ?? 'pending';
    $isSettled = in_array($trxStatus, ['settlement', 'capture'], true);

    echo json_encode([
        'success'            => true,
        'order_id'           => $orderId,
        'transaction_status' => $trxStatus,
        'is_settled'         => $isSettled,
        'payment_type'       => $statusResponse['payment_type'] ?? 'gopay',
        'transaction_id'     => $statusResponse['transaction_id'] ?? null,
        'settlement_time'    => $statusResponse['settlement_time'] ?? null,
        'raw_response'       => $statusResponse
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal memeriksa status: ' . $e->getMessage()
    ]);
}
