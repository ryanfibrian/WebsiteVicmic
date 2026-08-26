<?php
/**
 * Midtrans Webhook Handler
 * 
 * Receives POST notifications from Midtrans when payment status changes.
 * Verifies signature, updates order status, handles stock operations.
 */

// Auto-detect deployment structure (cPanel vs Local)
if (file_exists(dirname(__DIR__) . '/vendor/autoload.php')) {
    define('VICMIC_ROOT', dirname(__DIR__));
} else {
    define('VICMIC_ROOT', dirname(__DIR__, 2) . '/vicmic_core');
}
require_once VICMIC_ROOT . '/vendor/autoload.php';
require_once VICMIC_ROOT . '/config/app.php';

date_default_timezone_set(config('APP_TIMEZONE', 'Asia/Jakarta'));

use Vicmic\Core\{Database, Response};
use Vicmic\Models\{Order, SerialNumber};
use Vicmic\Services\{MidtransService, StockService};

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Get raw payload
$rawBody = file_get_contents('php://input');
$notification = json_decode($rawBody, true);

if (!$notification) {
    Response::error('Invalid payload', 400);
}

// Log webhook (for debugging)
$logDir = VICMIC_ROOT . '/logs';
if (!is_dir($logDir)) mkdir($logDir, 0755, true);
file_put_contents(
    $logDir . '/midtrans_webhook_' . date('Y-m-d') . '.log',
    date('Y-m-d H:i:s') . ' | ' . $rawBody . "\n",
    FILE_APPEND
);

try {
    $midtrans = new MidtransService();
    $orderModel = new Order();
    $stockService = new StockService();
    $db = Database::getInstance();

    // Verify signature
    if (config('WEBHOOK_MIDTRANS_VERIFY', true) && !$midtrans->verifySignature($notification)) {
        Response::error('Invalid signature', 401);
    }

    // Parse notification
    $parsed = $midtrans->parseNotification($notification);
    $orderNumber = $parsed['order_number'];

    // Find order
    $order = $orderModel->getByOrderNumber($orderNumber);
    if (!$order) {
        // Return 200 to prevent Midtrans from retrying
        Response::success(null, 'Order not found but acknowledged');
    }

    // Idempotency check — don't process if already in final state
    if (in_array($order['payment_status'], ['paid', 'refunded'])) {
        Response::success(null, 'Already processed');
    }

    // Process based on status
    switch ($parsed['payment_status']) {
        case 'paid':
            $db->transaction(function (Database $db) use ($order, $orderModel, $stockService, $parsed) {
                // Update order payment
                $orderModel->updatePayment($order['id'], [
                    'payment_status'    => 'paid',
                    'payment_method'    => $parsed['payment_method'],
                    'payment_reference' => $parsed['payment_reference'],
                    'paid_at'           => date('Y-m-d H:i:s'),
                ]);

                // Update order status
                $orderModel->updateStatus($order['id'], 'paid');

                // Confirm stock deduction (reserved → sold)
                foreach ($order['items'] as $item) {
                    $stockService->confirmDeduction(
                        $item['product_id'],
                        $item['variant_id'],
                        $order['fulfillment_warehouse_id'],
                        $item['quantity']
                    );
                }
            });
            break;

        case 'expired':
        case 'failed':
            $db->transaction(function (Database $db) use ($order, $orderModel, $stockService) {
                // Update order
                $orderModel->updatePayment($order['id'], [
                    'payment_status' => 'expired',
                ]);
                $orderModel->updateStatus($order['id'], 'cancelled');

                // Release reserved stock
                foreach ($order['items'] as $item) {
                    $stockService->releaseStock(
                        $item['product_id'],
                        $item['variant_id'],
                        $order['fulfillment_warehouse_id'],
                        $item['quantity']
                    );
                }

                // Release reserved serial numbers
                $snModel = new SerialNumber();
                $snModel->release($order['id']);
            });
            break;

        case 'pending':
            $orderModel->updatePayment($order['id'], [
                'payment_status'    => 'pending',
                'payment_method'    => $parsed['payment_method'],
                'payment_reference' => $parsed['payment_reference'],
            ]);
            break;
    }

    // Always return 200 to Midtrans
    Response::success(null, 'Webhook processed');

} catch (\Throwable $e) {
    // Log error but still return 200
    file_put_contents(
        $logDir . '/midtrans_errors_' . date('Y-m-d') . '.log',
        date('Y-m-d H:i:s') . ' | ERROR: ' . $e->getMessage() . "\n",
        FILE_APPEND
    );

    // Return 200 to prevent infinite retries
    http_response_code(200);
    echo json_encode(['status' => 'error_logged']);
    exit;
}
