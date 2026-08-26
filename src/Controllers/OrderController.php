<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response};
use Vicmic\Models\Order;

class OrderController
{
    public function track(Request $request): void
    {
        $orderNumber = $request->param('order_number');
        $email = $request->query('email');

        $orderModel = new Order();
        $order = $orderModel->getByOrderNumber($orderNumber);

        if (!$order) {
            Response::notFound('Pesanan tidak ditemukan');
            return;
        }

        // Verify email if provided (basic security)
        if ($email && strtolower($order['customer_email']) !== strtolower($email)) {
            Response::notFound('Pesanan tidak ditemukan');
            return;
        }

        // Return sanitized public data
        Response::success([
            'order_number'    => $order['order_number'],
            'order_status'    => $order['order_status'],
            'payment_status'  => $order['payment_status'],
            'total_amount'    => $order['total_amount'],
            'shipping_cost'   => $order['shipping_cost'],
            'courier_name'    => $order['courier_name'],
            'courier_service' => $order['courier_service'],
            'tracking_number' => $order['tracking_number'],
            'estimated_delivery' => $order['estimated_delivery'],
            'created_at'      => $order['created_at'],
            'paid_at'         => $order['paid_at'],
            'shipped_at'      => $order['shipped_at'],
            'items'           => array_map(fn($i) => [
                'product_name'  => $i['product_name'],
                'variant_name'  => $i['variant_name'],
                'quantity'      => $i['quantity'],
                'unit_price'    => $i['unit_price'],
                'total_price'   => $i['total_price'],
                'image'         => ($i['product_images'][0] ?? null),
            ], $order['items']),
        ]);
    }
}
