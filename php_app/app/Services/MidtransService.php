<?php
declare(strict_types=1);

namespace App\Services;

use Exception;

/**
 * MidtransService - Integrasi Midtrans GoPay / QRIS POS (Point of Sale)
 * Berdasarkan Spesifikasi Resmi: https://docs.midtrans.com/docs/gopay-qris-pos-integration
 * 
 * Mendukung:
 * 1. Dynamic QRIS Generation (/v2/charge dengan payment_type: gopay/qris)
 * 2. Status Polling Kasir Real-time (/v2/{order_id}/status)
 * 3. Webhook Signature Verification (SHA-512)
 * 4. Pembatalan Transaksi (/v2/{order_id}/cancel)
 */
class MidtransService
{
    private string $serverKey;
    private string $clientKey;
    private string $merchantId;
    private bool $isProduction;

    public function __construct(
        ?string $serverKey = null,
        ?string $clientKey = null,
        ?string $merchantId = null,
        bool $isProduction = false
    ) {
        // Default konfigurasi Sandbox Demo untuk Kedai ES Zefa
        $this->serverKey = $serverKey ?? getenv('MIDTRANS_SERVER_KEY') ?: 'SB-Mid-server-DemoKeyZefaPos889';
        $this->clientKey = $clientKey ?? getenv('MIDTRANS_CLIENT_KEY') ?: 'SB-Mid-client-DemoKeyZefaPos889';
        $this->merchantId = $merchantId ?? getenv('MIDTRANS_MERCHANT_ID') ?: 'G901238472';
        $this->isProduction = $isProduction;
    }

    private function getBaseUrl(): string
    {
        return $this->isProduction 
            ? 'https://api.midtrans.com/v2' 
            : 'https://api.sandbox.midtrans.com/v2';
    }

    /**
     * Membuat Transaksi Dynamic QRIS GoPay untuk Kasir POS
     * 
     * @param string $orderId Invoice ID unik (contoh: INV-20261101-0001)
     * @param int $grossAmount Nominal total tagihan (tanpa desimal)
     * @param array $items Detail item belanja [['id' => 1, 'price' => 18000, 'quantity' => 2, 'name' => 'Kopi']]
     * @param array $customer Data pelanggan opsional
     * @param int $expiryMinutes Batas kadaluarsa QRIS (default 15 menit)
     * @return array Respon Midtrans berisi qr_string, action links, dan transaction_id
     */
    public function chargeGopayQris(
        string $orderId,
        int $grossAmount,
        array $items = [],
        array $customer = [],
        int $expiryMinutes = 15
    ): array {
        $endpoint = $this->getBaseUrl() . '/charge';

        $payload = [
            'payment_type' => 'gopay',
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'gopay' => [
                'enable_callback' => true,
                'callback_url'    => 'kedaieszefa://order-status',
            ],
            'custom_expiry' => [
                'expiry_duration' => $expiryMinutes,
                'unit'            => 'minute',
            ],
        ];

        // Item Details
        if (!empty($items)) {
            $formattedItems = [];
            foreach ($items as $item) {
                $formattedItems[] = [
                    'id'       => (string) ($item['id'] ?? $item['product_id'] ?? 'ITEM'),
                    'price'    => (int) ($item['price'] ?? $item['selling_price'] ?? 0),
                    'quantity' => (int) ($item['quantity'] ?? $item['qty'] ?? 1),
                    'name'     => substr((string) ($item['name'] ?? 'Item Produk'), 0, 50),
                ];
            }
            $payload['item_details'] = $formattedItems;
        }

        // Customer Details
        $payload['customer_details'] = [
            'first_name' => $customer['name'] ?? 'Pelanggan Kedai ES Zefa',
            'email'      => $customer['email'] ?? 'customer@kedaieszefa.com',
            'phone'      => $customer['phone'] ?? '0812000000',
        ];

        return $this->sendRequest('POST', $endpoint, $payload);
    }

    /**
     * Mengecek status pembayaran terkini ke Midtrans Core API (Polling dari POS)
     * Status yang mungkin kembali:
     * - 'pending'    : Menunggu scan & bayar
     * - 'settlement' : Berhasil dibayar & lunas
     * - 'expire'     : QRIS telah kadaluarsa
     * - 'cancel'     : Transaksi dibatalkan
     * 
     * @param string $orderId Invoice ID yang ingin dicek
     * @return array Status data transaksi
     */
    public function checkStatus(string $orderId): array
    {
        $endpoint = $this->getBaseUrl() . '/' . urlencode($orderId) . '/status';
        return $this->sendRequest('GET', $endpoint);
    }

    /**
     * Membatalkan transaksi pending di Midtrans
     * 
     * @param string $orderId Invoice ID
     * @return array
     */
    public function cancelTransaction(string $orderId): array
    {
        $endpoint = $this->getBaseUrl() . '/' . urlencode($orderId) . '/cancel';
        return $this->sendRequest('POST', $endpoint);
    }

    /**
     * Memverifikasi keaslian notifikasi Webhook Midtrans via SHA-512 Signature Hash
     * Rumus resmi: SHA512(order_id + status_code + gross_amount + ServerKey)
     * 
     * @param string $orderId
     * @param string $statusCode
     * @param string $grossAmount
     * @param string $receivedSignature
     * @return bool True jika valid dan aman dari pemalsuan
     */
    public function verifySignature(
        string $orderId,
        string $statusCode,
        string $grossAmount,
        string $receivedSignature
    ): bool {
        $rawString = $orderId . $statusCode . $grossAmount . $this->serverKey;
        $calculatedSignature = hash('sha512', $rawString);
        return hash_equals($calculatedSignature, $receivedSignature);
    }

    /**
     * Helper cURL HTTP request ke Midtrans Core API
     */
    private function sendRequest(string $method, string $url, ?array $payload = null): array
    {
        $curl = curl_init();
        $authHeader = 'Basic ' . base64_encode($this->serverKey . ':');

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: ' . $authHeader,
        ];

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_CUSTOMREQUEST  => $method,
        ];

        if ($method === 'POST' && $payload !== null) {
            $options[CURLOPT_POSTFIELDS] = json_encode($payload);
        }

        curl_setopt_array($curl, $options);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            throw new Exception("Midtrans cURL Error: " . $curlError);
        }

        $decoded = json_decode((string) $response, true);
        if (!is_array($decoded)) {
            throw new Exception("Respon Midtrans tidak valid (HTTP $httpCode): " . $response);
        }

        return $decoded;
    }
}
