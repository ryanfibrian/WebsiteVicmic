<?php
namespace Vicmic\Services;

use Vicmic\Core\Database;

/**
 * StockService — Manages inventory operations.
 * 
 * Handles stock adjustments, reservations, and mutations
 * with atomic transaction support.
 */
class StockService
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get stock for a product across all warehouses
     */
    public function getProductStock(int $productId, ?int $variantId = null): array
    {
        $sql = "SELECT ps.*, w.name as warehouse_name, w.code as warehouse_code
                FROM product_stocks ps
                JOIN warehouses w ON ps.warehouse_id = w.id
                WHERE ps.product_id = ?";
        $params = [$productId];

        if ($variantId !== null) {
            $sql .= " AND ps.variant_id = ?";
            $params[] = $variantId;
        }

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get total available stock (quantity - reserved)
     */
    public function getAvailableStock(int $productId, ?int $variantId = null, ?int $warehouseId = null): int
    {
        $sql = "SELECT COALESCE(SUM(quantity - reserved_quantity), 0) FROM product_stocks WHERE product_id = ?";
        $params = [$productId];

        if ($variantId !== null) {
            $sql .= " AND variant_id = ?";
            $params[] = $variantId;
        }
        if ($warehouseId !== null) {
            $sql .= " AND warehouse_id = ?";
            $params[] = $warehouseId;
        }

        return (int) $this->db->fetchColumn($sql, $params);
    }

    /**
     * Reserve stock for an order (atomic)
     */
    public function reserveStock(int $productId, ?int $variantId, int $warehouseId, int $quantity): bool
    {
        return $this->db->transaction(function (Database $db) use ($productId, $variantId, $warehouseId, $quantity) {
            // Lock the row for update
            $stock = $db->fetch(
                "SELECT * FROM product_stocks 
                 WHERE product_id = ? AND warehouse_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
                 FOR UPDATE",
                [$productId, $warehouseId, $variantId, $variantId]
            );

            if (!$stock || ($stock['quantity'] - $stock['reserved_quantity']) < $quantity) {
                throw new \RuntimeException("Stok tidak mencukupi");
            }

            $db->update('product_stocks', [
                'reserved_quantity' => $stock['reserved_quantity'] + $quantity,
            ], ['id' => $stock['id']]);

            return true;
        });
    }

    /**
     * Confirm stock deduction (after payment confirmed)
     * Moves from reserved to actually deducted
     */
    public function confirmDeduction(int $productId, ?int $variantId, int $warehouseId, int $quantity): bool
    {
        return $this->db->transaction(function (Database $db) use ($productId, $variantId, $warehouseId, $quantity) {
            $stock = $db->fetch(
                "SELECT * FROM product_stocks 
                 WHERE product_id = ? AND warehouse_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
                 FOR UPDATE",
                [$productId, $warehouseId, $variantId, $variantId]
            );

            if (!$stock) return false;

            $db->update('product_stocks', [
                'quantity'          => $stock['quantity'] - $quantity,
                'reserved_quantity' => max(0, $stock['reserved_quantity'] - $quantity),
            ], ['id' => $stock['id']]);

            return true;
        });
    }

    /**
     * Release reserved stock (payment expired/cancelled)
     */
    public function releaseStock(int $productId, ?int $variantId, int $warehouseId, int $quantity): bool
    {
        return $this->db->transaction(function (Database $db) use ($productId, $variantId, $warehouseId, $quantity) {
            $stock = $db->fetch(
                "SELECT * FROM product_stocks 
                 WHERE product_id = ? AND warehouse_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
                 FOR UPDATE",
                [$productId, $warehouseId, $variantId, $variantId]
            );

            if (!$stock) return false;

            $db->update('product_stocks', [
                'reserved_quantity' => max(0, $stock['reserved_quantity'] - $quantity),
            ], ['id' => $stock['id']]);

            return true;
        });
    }

    /**
     * Adjust stock (manual admin adjustment)
     */
    public function adjustStock(int $productId, ?int $variantId, int $warehouseId, int $newQuantity): bool
    {
        $existing = $this->db->fetch(
            "SELECT * FROM product_stocks 
             WHERE product_id = ? AND warehouse_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))",
            [$productId, $warehouseId, $variantId, $variantId]
        );

        if ($existing) {
            return $this->db->update('product_stocks', [
                'quantity' => $newQuantity,
            ], ['id' => $existing['id']]) > 0;
        }

        // Create new stock record
        $this->db->insert('product_stocks', [
            'product_id'   => $productId,
            'variant_id'   => $variantId,
            'warehouse_id' => $warehouseId,
            'quantity'      => $newQuantity,
        ]);
        return true;
    }

    /**
     * Get low stock items
     */
    public function getLowStock(?int $warehouseId = null): array
    {
        $sql = "SELECT ps.*, p.name as product_name, p.sku, pv.variant_name, w.name as warehouse_name
                FROM product_stocks ps
                JOIN products p ON ps.product_id = p.id
                LEFT JOIN product_variants pv ON ps.variant_id = pv.id
                JOIN warehouses w ON ps.warehouse_id = w.id
                WHERE (ps.quantity - ps.reserved_quantity) <= ps.low_stock_threshold";
        $params = [];

        if ($warehouseId) {
            $sql .= " AND ps.warehouse_id = ?";
            $params[] = $warehouseId;
        }

        $sql .= " ORDER BY (ps.quantity - ps.reserved_quantity) ASC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get inventory overview for all products in a warehouse
     */
    public function getWarehouseInventory(int $warehouseId, int $offset = 0, int $limit = 50): array
    {
        $total = (int) $this->db->fetchColumn(
            "SELECT COUNT(*) FROM product_stocks WHERE warehouse_id = ?", [$warehouseId]
        );

        $items = $this->db->fetchAll(
            "SELECT ps.*, p.name as product_name, p.sku, p.brand, pv.variant_name,
                    (ps.quantity - ps.reserved_quantity) as available_stock,
                    (SELECT COUNT(*) FROM product_serial_numbers sn WHERE sn.product_id = ps.product_id AND sn.warehouse_id = ps.warehouse_id AND sn.status = 'available') as available_sns
             FROM product_stocks ps
             JOIN products p ON ps.product_id = p.id
             LEFT JOIN product_variants pv ON ps.variant_id = pv.id
             WHERE ps.warehouse_id = ?
             ORDER BY p.name ASC
             LIMIT ? OFFSET ?",
            [$warehouseId, $limit, $offset]
        );

        return ['items' => $items, 'total' => $total];
    }
}
