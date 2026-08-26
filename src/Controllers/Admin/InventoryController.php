<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Auth, Database, Validator};
use Vicmic\Services\StockService;

class InventoryController
{
    private StockService $stockService;

    public function __construct()
    {
        $this->stockService = new StockService();
    }

    public function index(Request $request): void
    {
        $warehouseId = (int) $request->query('warehouse_id', 0);
        
        if (!$warehouseId) {
            // Return all stock across warehouses
            $db = Database::getInstance();
            $pagination = $request->pagination();
            
            $total = (int) $db->fetchColumn("SELECT COUNT(*) FROM product_stocks");
            $items = $db->fetchAll(
                "SELECT ps.*, p.name as product_name, p.sku, p.brand, pv.variant_name, w.name as warehouse_name,
                        (ps.quantity - ps.reserved_quantity) as available_stock
                 FROM product_stocks ps
                 JOIN products p ON ps.product_id = p.id
                 LEFT JOIN product_variants pv ON ps.variant_id = pv.id
                 JOIN warehouses w ON ps.warehouse_id = w.id
                 ORDER BY p.name ASC LIMIT ? OFFSET ?",
                [$pagination['per_page'], $pagination['offset']]
            );

            Response::paginated($items, $total, $pagination['page'], $pagination['per_page']);
            return;
        }

        $pagination = $request->pagination(50);
        $result = $this->stockService->getWarehouseInventory($warehouseId, $pagination['offset'], $pagination['per_page']);
        Response::paginated($result['items'], $result['total'], $pagination['page'], $pagination['per_page']);
    }

    public function lowStock(Request $request): void
    {
        $warehouseId = $request->query('warehouse_id') ? (int) $request->query('warehouse_id') : null;
        $items = $this->stockService->getLowStock($warehouseId);
        Response::success($items);
    }

    public function adjust(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'product_id'   => 'required|integer',
            'warehouse_id' => 'required|integer',
            'quantity'     => 'required|integer|min:0',
        ]);
        $data = $validator->validateOrFail();

        $variantId = $request->input('variant_id') ? (int) $request->input('variant_id') : null;

        $this->stockService->adjustStock(
            $data['product_id'], $variantId, $data['warehouse_id'], $data['quantity']
        );

        // Log activity
        $this->logActivity('inventory.adjust', 'product_stock', $data['product_id'], null, $data);

        Response::success(null, 'Stok berhasil diupdate');
    }

    public function createMutation(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'product_id'        => 'required|integer',
            'from_warehouse_id' => 'required|integer',
            'to_warehouse_id'   => 'required|integer',
            'quantity'          => 'required|integer|min:1',
        ]);
        $data = $validator->validateOrFail();

        $db = Database::getInstance();
        $user = Auth::user($request);

        // Verify stock
        $available = $this->stockService->getAvailableStock(
            $data['product_id'],
            $request->input('variant_id') ? (int) $request->input('variant_id') : null,
            $data['from_warehouse_id']
        );

        if ($available < $data['quantity']) {
            Response::error("Stok tidak mencukupi. Tersedia: $available", 400);
            return;
        }

        $mutationCode = 'MUT-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

        $id = $db->insert('stock_mutations', [
            'mutation_code'      => $mutationCode,
            'product_id'         => $data['product_id'],
            'variant_id'         => $request->input('variant_id'),
            'from_warehouse_id'  => $data['from_warehouse_id'],
            'to_warehouse_id'    => $data['to_warehouse_id'],
            'quantity'           => $data['quantity'],
            'serial_numbers'     => $request->input('serial_numbers') ? json_encode($request->input('serial_numbers')) : null,
            'initiated_by'       => $user['id'],
            'notes'              => $request->input('notes'),
        ]);

        Response::created(['id' => $id, 'mutation_code' => $mutationCode], 'Mutasi stok berhasil dibuat');
    }

    public function receiveMutation(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = Database::getInstance();
        $user = Auth::user($request);

        $mutation = $db->fetch("SELECT * FROM stock_mutations WHERE id = ? AND status = 'pending'", [$id]);
        if (!$mutation) {
            Response::notFound('Mutasi tidak ditemukan atau sudah diproses');
            return;
        }

        $db->transaction(function (Database $db) use ($mutation, $user) {
            // Deduct from source warehouse
            $this->stockService->adjustStock(
                $mutation['product_id'], $mutation['variant_id'],
                $mutation['from_warehouse_id'],
                $this->stockService->getAvailableStock($mutation['product_id'], $mutation['variant_id'], $mutation['from_warehouse_id']) - $mutation['quantity']
            );

            // Add to destination warehouse
            $currentDest = $this->stockService->getAvailableStock($mutation['product_id'], $mutation['variant_id'], $mutation['to_warehouse_id']);
            $this->stockService->adjustStock(
                $mutation['product_id'], $mutation['variant_id'],
                $mutation['to_warehouse_id'],
                $currentDest + $mutation['quantity']
            );

            // Update serial numbers warehouse if tracked
            if ($mutation['serial_numbers']) {
                $snIds = json_decode($mutation['serial_numbers'], true);
                if ($snIds) {
                    foreach ($snIds as $snId) {
                        $db->update('product_serial_numbers', [
                            'warehouse_id' => $mutation['to_warehouse_id'],
                        ], ['id' => $snId]);
                    }
                }
            }

            // Mark mutation as received
            $db->update('stock_mutations', [
                'status'       => 'received',
                'received_by'  => $user['id'],
                'completed_at' => date('Y-m-d H:i:s'),
            ], ['id' => $mutation['id']]);
        });

        Response::success(null, 'Mutasi stok berhasil diterima');
    }

    private function logActivity(string $action, string $entityType, int $entityId, $oldValue, $newValue): void
    {
        try {
            $db = Database::getInstance();
            $user = Auth::user();
            $db->insert('activity_logs', [
                'admin_user_id' => $user['id'] ?? null,
                'action'        => $action,
                'entity_type'   => $entityType,
                'entity_id'     => $entityId,
                'old_value'     => $oldValue ? json_encode($oldValue) : null,
                'new_value'     => $newValue ? json_encode($newValue) : null,
                'ip_address'    => $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (\Throwable $e) {
            // Don't fail on logging errors
        }
    }
}
