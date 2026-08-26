<?php
namespace Vicmic\Services;

use Vicmic\Core\Database;
use Vicmic\Models\Warehouse;

/**
 * WarehouseRouter — Smart fulfillment warehouse selection.
 * 
 * Determines the optimal warehouse for order fulfillment based on:
 * 1. Stock availability
 * 2. Shipping cost to customer destination
 * 3. Proximity (if coordinates available)
 */
class WarehouseRouter
{
    private Database $db;
    private Warehouse $warehouseModel;
    private RajaOngkirService $shippingService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->warehouseModel = new Warehouse();
        $this->shippingService = new RajaOngkirService();
    }

    /**
     * Find the best warehouse for fulfillment
     * 
     * @param array $cartItems [{product_id, variant_id, quantity}]
     * @param int $destinationCityId Customer's RajaOngkir city ID
     * @return array|null {warehouse_id, warehouse_name, shipping_rates, reason}
     */
    public function findBestWarehouse(array $cartItems, int $destinationCityId): ?array
    {
        // Step 1: Find warehouses with sufficient stock for ALL items
        $eligibleWarehouses = $this->findEligibleWarehouses($cartItems);

        if (empty($eligibleWarehouses)) {
            return null; // No warehouse has full stock
        }

        // Step 2: If only one eligible, use it
        if (count($eligibleWarehouses) === 1) {
            $wh = $eligibleWarehouses[0];
            return [
                'warehouse_id'   => $wh['id'],
                'warehouse_name' => $wh['name'],
                'city_id'        => $wh['city_id'],
                'reason'         => 'Satu-satunya gudang dengan stok lengkap',
            ];
        }

        // Step 3: Calculate shipping cost from each eligible warehouse
        $candidates = [];
        $totalWeight = $this->calculateTotalWeight($cartItems);

        foreach ($eligibleWarehouses as $wh) {
            try {
                // Get cheapest shipping option from this warehouse
                $rates = $this->shippingService->calculateCost(
                    $wh['city_id'],
                    $destinationCityId,
                    $totalWeight,
                    'jne' // Use JNE as baseline for comparison
                );

                $cheapestRate = !empty($rates) ? $rates[0]['cost'] : PHP_INT_MAX;

                $candidates[] = [
                    'warehouse_id'   => $wh['id'],
                    'warehouse_name' => $wh['name'],
                    'city_id'        => $wh['city_id'],
                    'cheapest_cost'  => $cheapestRate,
                    'rates'          => $rates,
                ];
            } catch (\Throwable $e) {
                // If shipping calc fails, still include with high cost
                $candidates[] = [
                    'warehouse_id'   => $wh['id'],
                    'warehouse_name' => $wh['name'],
                    'city_id'        => $wh['city_id'],
                    'cheapest_cost'  => PHP_INT_MAX,
                    'rates'          => [],
                ];
            }
        }

        // Step 4: Sort by cheapest shipping cost
        usort($candidates, fn($a, $b) => $a['cheapest_cost'] - $b['cheapest_cost']);

        $best = $candidates[0];
        return [
            'warehouse_id'   => $best['warehouse_id'],
            'warehouse_name' => $best['warehouse_name'],
            'city_id'        => $best['city_id'],
            'reason'         => 'Ongkir termurah dari gudang terdekat',
        ];
    }

    /**
     * Find warehouses with sufficient stock for all items
     */
    private function findEligibleWarehouses(array $cartItems): array
    {
        $warehouses = $this->warehouseModel->getAll(true);
        $eligible = [];

        foreach ($warehouses as $wh) {
            $hasAllStock = true;

            foreach ($cartItems as $item) {
                $sql = "SELECT (quantity - reserved_quantity) as available
                        FROM product_stocks 
                        WHERE product_id = ? AND warehouse_id = ?";
                $params = [$item['product_id'], $wh['id']];

                if (!empty($item['variant_id'])) {
                    $sql .= " AND variant_id = ?";
                    $params[] = $item['variant_id'];
                } else {
                    $sql .= " AND variant_id IS NULL";
                }

                $stock = $this->db->fetch($sql, $params);
                $available = (int) ($stock['available'] ?? 0);

                if ($available < ($item['quantity'] ?? 1)) {
                    $hasAllStock = false;
                    break;
                }
            }

            if ($hasAllStock) {
                $eligible[] = $wh;
            }
        }

        return $eligible;
    }

    /**
     * Calculate total weight of cart items in grams
     */
    private function calculateTotalWeight(array $cartItems): int
    {
        $totalWeight = 0;

        foreach ($cartItems as $item) {
            $product = $this->db->fetch(
                "SELECT weight_grams FROM products WHERE id = ?",
                [$item['product_id']]
            );

            $weight = (int) ($product['weight_grams'] ?? 2500); // Default 2.5kg for laptops
            $quantity = (int) ($item['quantity'] ?? 1);
            $totalWeight += $weight * $quantity;
        }

        return $totalWeight;
    }
}
