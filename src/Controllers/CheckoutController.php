<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response, Validator, Database};
use Vicmic\Models\Order;
use Vicmic\Services\{StockService, MidtransService, WarehouseRouter};

class CheckoutController
{
    public function process(Request $request): void
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'customer_name'    => 'required|string|max:150',
            'customer_email'   => 'required|email',
            'customer_phone'   => 'required|phone',
            'shipping_address' => 'required|string',
            'shipping_city_id' => 'required|integer',
            'courier_code'     => 'required|string',
            'courier_service'  => 'required|string',
            'shipping_cost'    => 'required|numeric',
            'payment_gateway'  => 'required|in:midtrans,manual_transfer',
        ]);

        $data = $validator->validateOrFail();

        // Get cart items from session
        if (session_status() === PHP_SESSION_NONE) session_start();
        $cart = $_SESSION['cart'] ?? [];

        if (empty($cart)) {
            Response::error('Keranjang belanja kosong', 400);
            return;
        }

        $db = Database::getInstance();
        $stockService = new StockService();
        $warehouseRouter = new WarehouseRouter();

        // Prepare cart items for routing
        $cartItems = array_values($cart);

        // Find best warehouse
        $warehouse = $warehouseRouter->findBestWarehouse($cartItems, (int) $data['shipping_city_id']);
        if (!$warehouse) {
            Response::error('Maaf, stok tidak mencukupi untuk pesanan ini', 400);
            return;
        }

        // Build order
        $orderModel = new Order();
        $orderNumber = $orderModel->generateOrderNumber();

        // Calculate totals
        $subtotal = 0;
        $orderItems = [];
        
        foreach ($cartItems as $item) {
            $product = $db->fetch("SELECT * FROM products WHERE id = ?", [$item['product_id']]);
            if (!$product) continue;

            $price = $product['sale_price'] ?? $product['base_price'];
            $variant = null;
            
            if (!empty($item['variant_id'])) {
                $variant = $db->fetch("SELECT * FROM product_variants WHERE id = ?", [$item['variant_id']]);
                if ($variant) $price += $variant['price_adjustment'];
            }

            $qty = (int) ($item['quantity'] ?? 1);
            $subtotal += $price * $qty;

            $orderItems[] = [
                'product_id'   => $product['id'],
                'variant_id'   => $item['variant_id'] ?? null,
                'product_name' => $product['name'],
                'variant_name' => $variant['variant_name'] ?? null,
                'quantity'     => $qty,
                'unit_price'   => $price,
            ];
        }

        $shippingCost = (float) $data['shipping_cost'];
        $totalAmount = $subtotal + $shippingCost;

        // Create order
        $ttlMinutes = (int) config('payment_ttl_minutes', 1440);

        $orderData = [
            'order_number'            => $orderNumber,
            'customer_name'           => $data['customer_name'],
            'customer_email'          => $data['customer_email'],
            'customer_phone'          => $data['customer_phone'],
            'shipping_address'        => $data['shipping_address'],
            'shipping_city_id'        => $data['shipping_city_id'],
            'shipping_city_name'      => $request->input('shipping_city_name'),
            'shipping_province'       => $request->input('shipping_province'),
            'shipping_postal_code'    => $request->input('shipping_postal_code'),
            'fulfillment_warehouse_id'=> $warehouse['warehouse_id'],
            'subtotal'                => $subtotal,
            'shipping_cost'           => $shippingCost,
            'total_amount'            => $totalAmount,
            'payment_gateway'         => $data['payment_gateway'],
            'courier_name'            => $data['courier_code'],
            'courier_service'         => $data['courier_service'],
            'customer_notes'          => $request->input('customer_notes'),
            'payment_expiry_at'       => date('Y-m-d H:i:s', strtotime("+$ttlMinutes minutes")),
        ];

        try {
            $orderId = $orderModel->create($orderData, $orderItems);

            // Reserve stock
            foreach ($cartItems as $item) {
                $stockService->reserveStock(
                    $item['product_id'],
                    $item['variant_id'] ?? null,
                    $warehouse['warehouse_id'],
                    (int) ($item['quantity'] ?? 1)
                );
            }

            // Create Midtrans payment (if selected)
            $snapToken = null;
            if ($data['payment_gateway'] === 'midtrans') {
                $midtrans = new MidtransService();
                if ($midtrans->isConfigured()) {
                    $paymentData = array_merge($orderData, ['items' => $orderItems]);
                    $result = $midtrans->createTransaction($paymentData);
                    $snapToken = $result['snap_token'];

                    if ($snapToken) {
                        $orderModel->updatePayment($orderId, [
                            'payment_snap_token' => $snapToken,
                            'payment_status'     => 'pending',
                        ]);
                    }
                }
            }

            // Clear cart
            $_SESSION['cart'] = [];

            Response::created([
                'order_id'     => $orderId,
                'order_number' => $orderNumber,
                'total_amount' => $totalAmount,
                'snap_token'   => $snapToken,
                'snap_js_url'  => (new MidtransService())->getSnapJsUrl(),
                'client_key'   => (new MidtransService())->getClientKey(),
                'payment_expiry' => $orderData['payment_expiry_at'],
            ], 'Pesanan berhasil dibuat');

        } catch (\Throwable $e) {
            Response::error('Gagal membuat pesanan: ' . $e->getMessage(), 500);
        }
    }
}
