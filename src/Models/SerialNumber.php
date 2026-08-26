<?php
namespace Vicmic\Models;

use Vicmic\Core\Database;

/**
 * SerialNumber Model — Manages serial number lifecycle.
 */
class SerialNumber
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get paginated serial numbers with filters
     */
    public function getPaginated(array $filters = [], int $offset = 0, int $limit = 20): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 'sn.status = ?';
            $params[] = $filters['status'];
        }
        if (!empty($filters['product_id'])) {
            $where[] = 'sn.product_id = ?';
            $params[] = $filters['product_id'];
        }
        if (!empty($filters['warehouse_id'])) {
            $where[] = 'sn.warehouse_id = ?';
            $params[] = $filters['warehouse_id'];
        }
        if (!empty($filters['search'])) {
            $where[] = 'sn.serial_number LIKE ?';
            $params[] = '%' . $filters['search'] . '%';
        }

        $whereClause = implode(' AND ', $where);

        $total = (int) $this->db->fetchColumn(
            "SELECT COUNT(*) FROM product_serial_numbers sn WHERE $whereClause", $params
        );

        $items = $this->db->fetchAll(
            "SELECT sn.*, p.name as product_name, p.sku as product_sku,
                    pv.variant_name, w.name as warehouse_name,
                    o.order_number
             FROM product_serial_numbers sn
             LEFT JOIN products p ON sn.product_id = p.id
             LEFT JOIN product_variants pv ON sn.variant_id = pv.id
             LEFT JOIN warehouses w ON sn.warehouse_id = w.id
             LEFT JOIN orders o ON sn.order_id = o.id
             WHERE $whereClause
             ORDER BY sn.created_at DESC
             LIMIT ? OFFSET ?",
            [...$params, $limit, $offset]
        );

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Get SN by serial number string (warranty check)
     */
    public function getBySerialNumber(string $sn): ?array
    {
        return $this->db->fetch(
            "SELECT sn.*, p.name as product_name, p.sku as product_sku, p.brand,
                    p.warranty_period_months, pv.variant_name,
                    w.name as warehouse_name,
                    o.order_number, o.customer_name, o.customer_email, o.created_at as order_date
             FROM product_serial_numbers sn
             LEFT JOIN products p ON sn.product_id = p.id
             LEFT JOIN product_variants pv ON sn.variant_id = pv.id
             LEFT JOIN warehouses w ON sn.warehouse_id = w.id
             LEFT JOIN orders o ON sn.order_id = o.id
             WHERE sn.serial_number = ?",
            [$sn]
        );
    }

    /**
     * Register new serial number(s)
     */
    public function register(array $data): int
    {
        $data['received_at'] = date('Y-m-d H:i:s');
        return $this->db->insert('product_serial_numbers', $data);
    }

    /**
     * Bulk register serial numbers
     */
    public function bulkRegister(array $serialNumbers, int $productId, ?int $variantId, int $warehouseId): int
    {
        $count = 0;
        $this->db->beginTransaction();
        try {
            foreach ($serialNumbers as $sn) {
                $this->db->insert('product_serial_numbers', [
                    'serial_number'  => trim($sn),
                    'product_id'     => $productId,
                    'variant_id'     => $variantId,
                    'warehouse_id'   => $warehouseId,
                    'status'         => 'available',
                    'received_at'    => date('Y-m-d H:i:s'),
                ]);
                $count++;
            }
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollback();
            throw $e;
        }
        return $count;
    }

    /**
     * Reserve SN for an order
     */
    public function reserve(int $snId, int $orderId, int $orderItemId): bool
    {
        return $this->db->update('product_serial_numbers', [
            'status'        => 'reserved',
            'order_id'      => $orderId,
            'order_item_id' => $orderItemId,
            'updated_at'    => date('Y-m-d H:i:s'),
        ], ['id' => $snId, 'status' => 'available']) > 0;
    }

    /**
     * Mark SN as sold (set warranty dates)
     */
    public function markSold(int $snId, int $warrantyMonths = 12): bool
    {
        $today = date('Y-m-d');
        $expiry = date('Y-m-d', strtotime("+$warrantyMonths months"));

        return $this->db->update('product_serial_numbers', [
            'status'              => 'sold',
            'sold_at'             => date('Y-m-d H:i:s'),
            'warranty_start_date' => $today,
            'warranty_expiry'     => $expiry,
            'updated_at'          => date('Y-m-d H:i:s'),
        ], ['id' => $snId]) > 0;
    }

    /**
     * Release reserved SN back to available (payment expired/cancelled)
     */
    public function release(int $orderId): int
    {
        return $this->db->update('product_serial_numbers', [
            'status'        => 'available',
            'order_id'      => null,
            'order_item_id' => null,
            'updated_at'    => date('Y-m-d H:i:s'),
        ], ['order_id' => $orderId, 'status' => 'reserved']);
    }

    /**
     * Get available SNs for a product in a warehouse
     */
    public function getAvailable(int $productId, int $warehouseId, ?int $variantId = null, int $limit = 10): array
    {
        $sql = "SELECT * FROM product_serial_numbers 
                WHERE product_id = ? AND warehouse_id = ? AND status = 'available'";
        $params = [$productId, $warehouseId];

        if ($variantId) {
            $sql .= " AND variant_id = ?";
            $params[] = $variantId;
        }

        $sql .= " ORDER BY created_at ASC LIMIT ?";
        $params[] = $limit;

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Update SN status
     */
    public function updateStatus(int $id, string $status, ?string $notes = null): int
    {
        $data = ['status' => $status, 'updated_at' => date('Y-m-d H:i:s')];
        if ($notes !== null) $data['notes'] = $notes;
        return $this->db->update('product_serial_numbers', $data, ['id' => $id]);
    }
}
