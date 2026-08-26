<?php
namespace Vicmic\Models;

use Vicmic\Core\Database;

/**
 * Warehouse Model
 */
class Warehouse
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(bool $activeOnly = true): array
    {
        $sql = "SELECT * FROM warehouses";
        if ($activeOnly) $sql .= " WHERE is_active = 1";
        $sql .= " ORDER BY name ASC";
        return $this->db->fetchAll($sql);
    }

    public function getById(int $id): ?array
    {
        return $this->db->fetch("SELECT * FROM warehouses WHERE id = ?", [$id]);
    }

    public function create(array $data): int
    {
        return $this->db->insert('warehouses', $data);
    }

    public function update(int $id, array $data): int
    {
        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->update('warehouses', $data, ['id' => $id]);
    }

    /**
     * Find warehouses that have stock for given product IDs
     */
    public function findWithStock(array $productIds, ?int $variantId = null): array
    {
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $params = $productIds;

        $sql = "SELECT DISTINCT w.*, ps.product_id, (ps.quantity - ps.reserved_quantity) as available_stock
                FROM warehouses w
                JOIN product_stocks ps ON w.id = ps.warehouse_id
                WHERE w.is_active = 1 
                AND ps.product_id IN ($placeholders)
                AND (ps.quantity - ps.reserved_quantity) > 0";

        if ($variantId) {
            $sql .= " AND ps.variant_id = ?";
            $params[] = $variantId;
        }

        return $this->db->fetchAll($sql, $params);
    }
}
