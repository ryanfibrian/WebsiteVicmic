<?php
namespace Vicmic\Models;

use Vicmic\Core\Database;

/**
 * Order Model — Handles order CRUD and queries.
 */
class Order
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Create a new order with items
     */
    public function create(array $orderData, array $items): int
    {
        return $this->db->transaction(function (Database $db) use ($orderData, $items) {
            $orderId = $db->insert('orders', $orderData);

            foreach ($items as $item) {
                $item['order_id'] = $orderId;
                $item['total_price'] = $item['unit_price'] * $item['quantity'];
                $db->insert('order_items', $item);
            }

            return $orderId;
        });
    }

    /**
     * Generate unique order number: VIC-YYYYMMDD-XXXXX
     */
    public function generateOrderNumber(): string
    {
        $prefix = config('order_prefix', 'VIC');
        $date = date('Ymd');
        $random = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
        return "$prefix-$date-$random";
    }

    /**
     * Get order by order number (public tracking)
     */
    public function getByOrderNumber(string $orderNumber): ?array
    {
        $order = $this->db->fetch(
            "SELECT o.*, w.name as warehouse_name
             FROM orders o
             LEFT JOIN warehouses w ON o.fulfillment_warehouse_id = w.id
             WHERE o.order_number = ?",
            [$orderNumber]
        );

        if (!$order) return null;

        $order['items'] = $this->db->fetchAll(
            "SELECT oi.*, p.slug as product_slug, p.images as product_images
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?",
            [$order['id']]
        );

        foreach ($order['items'] as &$item) {
            $item['product_images'] = json_decode($item['product_images'] ?? '[]', true);
            $item['assigned_serial_numbers'] = json_decode($item['assigned_serial_numbers'] ?? '[]', true);
        }

        return $order;
    }

    /**
     * Get order by ID (admin)
     */
    public function getById(int $id): ?array
    {
        $order = $this->db->fetch(
            "SELECT o.*, w.name as warehouse_name, w.code as warehouse_code
             FROM orders o
             LEFT JOIN warehouses w ON o.fulfillment_warehouse_id = w.id
             WHERE o.id = ?",
            [$id]
        );

        if (!$order) return null;

        $order['items'] = $this->db->fetchAll(
            "SELECT oi.*, p.sku as product_sku, p.slug as product_slug, p.images as product_images
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?",
            [$id]
        );

        foreach ($order['items'] as &$item) {
            $item['product_images'] = json_decode($item['product_images'] ?? '[]', true);
            $item['assigned_serial_numbers'] = json_decode($item['assigned_serial_numbers'] ?? '[]', true);
        }

        return $order;
    }

    /**
     * Get paginated orders (admin)
     */
    public function getPaginated(array $filters = [], int $offset = 0, int $limit = 20): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 'o.order_status = ?';
            $params[] = $filters['status'];
        }

        if (!empty($filters['payment_status'])) {
            $where[] = 'o.payment_status = ?';
            $params[] = $filters['payment_status'];
        }

        if (!empty($filters['warehouse_id'])) {
            $where[] = 'o.fulfillment_warehouse_id = ?';
            $params[] = $filters['warehouse_id'];
        }

        if (!empty($filters['date_from'])) {
            $where[] = 'o.created_at >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'o.created_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = implode(' AND ', $where);

        $total = (int) $this->db->fetchColumn(
            "SELECT COUNT(*) FROM orders o WHERE $whereClause", $params
        );

        $items = $this->db->fetchAll(
            "SELECT o.*, w.name as warehouse_name
             FROM orders o
             LEFT JOIN warehouses w ON o.fulfillment_warehouse_id = w.id
             WHERE $whereClause
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?",
            [...$params, $limit, $offset]
        );

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Update order status
     */
    public function updateStatus(int $id, string $status): int
    {
        $data = ['order_status' => $status, 'updated_at' => date('Y-m-d H:i:s')];

        switch ($status) {
            case 'paid':
                $data['paid_at'] = date('Y-m-d H:i:s');
                $data['payment_status'] = 'paid';
                break;
            case 'shipped':
                $data['shipped_at'] = date('Y-m-d H:i:s');
                break;
            case 'completed':
                $data['completed_at'] = date('Y-m-d H:i:s');
                break;
            case 'cancelled':
                $data['cancelled_at'] = date('Y-m-d H:i:s');
                break;
        }

        return $this->db->update('orders', $data, ['id' => $id]);
    }

    /**
     * Update payment info
     */
    public function updatePayment(int $id, array $paymentData): int
    {
        $paymentData['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->update('orders', $paymentData, ['id' => $id]);
    }

    /**
     * Update tracking info
     */
    public function updateTracking(int $id, string $trackingNumber, string $courierName, ?string $courierService = null): int
    {
        return $this->db->update('orders', [
            'tracking_number'  => $trackingNumber,
            'courier_name'     => $courierName,
            'courier_service'  => $courierService,
            'order_status'     => 'shipped',
            'shipped_at'       => date('Y-m-d H:i:s'),
            'updated_at'       => date('Y-m-d H:i:s'),
        ], ['id' => $id]);
    }

    /**
     * Get revenue stats for dashboard
     */
    public function getRevenueStats(string $period = 'today'): array
    {
        $dateCondition = match($period) {
            'today'     => "DATE(o.created_at) = CURDATE()",
            'week'      => "o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
            'month'     => "o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
            'year'      => "o.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)",
            default     => "1=1",
        };

        return $this->db->fetch(
            "SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN order_status = 'pending_payment' THEN 1 ELSE 0 END), 0) as pending_orders,
                COALESCE(SUM(CASE WHEN order_status = 'processing_packing' THEN 1 ELSE 0 END), 0) as processing_orders,
                COALESCE(SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END), 0) as shipped_orders
             FROM orders o
             WHERE $dateCondition"
        ) ?? [];
    }

    /**
     * Get recent orders
     */
    public function getRecent(int $limit = 10): array
    {
        return $this->db->fetchAll(
            "SELECT o.order_number, o.customer_name, o.total_amount, o.order_status, o.payment_status, o.created_at
             FROM orders o
             ORDER BY o.created_at DESC
             LIMIT ?",
            [$limit]
        );
    }

    /**
     * Get expired unpaid orders (for auto-cancellation)
     */
    public function getExpiredOrders(): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM orders 
             WHERE payment_status = 'unpaid' 
             AND order_status = 'pending_payment'
             AND payment_expiry_at IS NOT NULL 
             AND payment_expiry_at < NOW()"
        );
    }
}
