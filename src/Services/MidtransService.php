<?php
namespace Vicmic\Services;

/**
 * MidtransService — Midtrans Snap API integration.
 * 
 * Handles:
 * - Creating Snap payment tokens
 * - Verifying webhook signatures
 * - Checking transaction status
 * - Payment expiry handling
 */
class MidtransService
{
    private string $serverKey;
    private string $clientKey;
    private string $apiUrl;
    private string $snapUrl;
    private bool $isProduction;

    public function __construct()
    {
        $this->serverKey = config('MIDTRANS_SERVER_KEY', '');
        $this->clientKey = config('MIDTRANS_CLIENT_KEY', '');
        $this->isProduction = config('MIDTRANS_ENV', 'sandbox') === 'production';
        
        $this->apiUrl = $this->isProduction 
            ? 'https://api.midtrans.com/v2' 
            : 'https://api.sandbox.midtrans.com/v2';
        
        $this->snapUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    /**
     * Get Snap.js URL for frontend
     */
    public function getSnapJsUrl(): string
    {
        return $this->isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }

    /**
     * Get client key for frontend
     */
    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    /**
     * Create a Snap transaction token
     */
    public function createTransaction(array $orderData): array
    {
        $payload = [
            'transaction_details' => [
                'order_id'     => $orderData['order_number'],
                'gross_amount' => (int) $orderData['total_amount'],
            ],
            'customer_details' => [
                'first_name' => $orderData['customer_name'],
                'email'      => $orderData['customer_email'],
                'phone'      => $orderData['customer_phone'],
                'shipping_address' => [
                    'first_name' => $orderData['customer_name'],
                    'phone'      => $orderData['customer_phone'],
                    'address'    => $orderData['shipping_address'],
                ],
            ],
            'item_details' => [],
            'expiry' => [
                'unit'     => 'minutes',
                'duration' => (int) config('payment_ttl_minutes', 1440),
            ],
            'callbacks' => [
                'finish' => config('APP_URL') . '/order/success',
            ],
        ];

        // Add item details
        if (!empty($orderData['items'])) {
            foreach ($orderData['items'] as $item) {
                $payload['item_details'][] = [
                    'id'       => $item['product_id'] . ($item['variant_id'] ? '-' . $item['variant_id'] : ''),
                    'price'    => (int) $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'name'     => mb_substr($item['product_name'], 0, 50),
                ];
            }
        }

        // Add shipping as item
        if (!empty($orderData['shipping_cost']) && $orderData['shipping_cost'] > 0) {
            $payload['item_details'][] = [
                'id'       => 'SHIPPING',
                'price'    => (int) $orderData['shipping_cost'],
                'quantity' => 1,
                'name'     => 'Ongkos Kirim (' . ($orderData['courier_name'] ?? 'Kurir') . ')',
            ];
        }

        // Add discount as negative item
        if (!empty($orderData['discount_amount']) && $orderData['discount_amount'] > 0) {
            $payload['item_details'][] = [
                'id'       => 'DISCOUNT',
                'price'    => -(int) $orderData['discount_amount'],
                'quantity' => 1,
                'name'     => 'Diskon',
            ];
        }

        // Enable all payment methods
        $payload['enabled_payments'] = [
            'bank_transfer', 'bca_va', 'bni_va', 'bri_va', 'permata_va',
            'echannel', // Mandiri Bill
            'gopay', 'shopeepay',
            'qris',
            'credit_card',
        ];

        $response = $this->apiRequest('POST', $this->snapUrl . '/transactions', $payload);

        return [
            'snap_token'  => $response['token'] ?? null,
            'redirect_url'=> $response['redirect_url'] ?? null,
            'error'       => $response['error_messages'] ?? null,
        ];
    }

    /**
     * Verify webhook notification signature
     * 
     * Signature = SHA512(order_id + status_code + gross_amount + server_key)
     */
    public function verifySignature(array $notification): bool
    {
        if (empty($notification['signature_key'])) {
            return false;
        }

        $orderId = $notification['order_id'] ?? '';
        $statusCode = $notification['status_code'] ?? '';
        $grossAmount = $notification['gross_amount'] ?? '';

        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        return hash_equals($expectedSignature, $notification['signature_key']);
    }

    /**
     * Parse webhook notification into normalized status
     */
    public function parseNotification(array $notification): array
    {
        $transactionStatus = $notification['transaction_status'] ?? '';
        $fraudStatus = $notification['fraud_status'] ?? '';
        $paymentType = $notification['payment_type'] ?? '';

        $status = match ($transactionStatus) {
            'capture' => ($fraudStatus === 'accept') ? 'paid' : 'pending',
            'settlement' => 'paid',
            'pending' => 'pending',
            'deny', 'cancel' => 'failed',
            'expire' => 'expired',
            'refund', 'partial_refund' => 'refunded',
            default => 'unknown',
        };

        return [
            'order_number'       => $notification['order_id'] ?? '',
            'payment_status'     => $status,
            'payment_method'     => $paymentType,
            'payment_reference'  => $notification['transaction_id'] ?? '',
            'gross_amount'       => $notification['gross_amount'] ?? 0,
            'transaction_status' => $transactionStatus,
            'fraud_status'       => $fraudStatus,
            'transaction_time'   => $notification['transaction_time'] ?? null,
        ];
    }

    /**
     * Check transaction status directly from Midtrans API
     * (Fallback if webhook not received)
     */
    public function checkStatus(string $orderId): ?array
    {
        $response = $this->apiRequest('GET', $this->apiUrl . '/' . $orderId . '/status');
        
        if (empty($response['transaction_status'])) {
            return null;
        }

        return $this->parseNotification($response);
    }

    /**
     * Cancel a transaction
     */
    public function cancelTransaction(string $orderId): bool
    {
        $response = $this->apiRequest('POST', $this->apiUrl . '/' . $orderId . '/cancel');
        return ($response['status_code'] ?? '') === '200';
    }

    /**
     * Make API request to Midtrans
     */
    private function apiRequest(string $method, string $url, ?array $data = null): array
    {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'Content-Type: application/json',
                'Authorization: Basic ' . base64_encode($this->serverKey . ':'),
            ],
        ]);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException("Midtrans API error: $error");
        }

        return json_decode($response, true) ?? [];
    }

    /**
     * Check if Midtrans is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->serverKey) && !empty($this->clientKey);
    }
}
