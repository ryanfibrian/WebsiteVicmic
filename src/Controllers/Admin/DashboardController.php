<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Database};
use Vicmic\Models\Order;
use Vicmic\Services\StockService;

class DashboardController
{
    public function index(Request $request): void
    {
        $this->stats($request);
    }

    public function stats(Request $request): void
    {
        $db = Database::getInstance();
        $orderModel = new Order();
        $stockService = new StockService();

        $todayStats = $orderModel->getRevenueStats('today');
        $monthStats = $orderModel->getRevenueStats('month');

        $totalProducts = (int) $db->fetchColumn("SELECT COUNT(*) FROM products WHERE is_published = 1");
        $totalOrders = (int) $db->fetchColumn("SELECT COUNT(*) FROM orders");
        $lowStockItems = $stockService->getLowStock();
        $recentOrders = $orderModel->getRecent(10);

        // Pending actions
        $pendingPayments = (int) $db->fetchColumn("SELECT COUNT(*) FROM orders WHERE order_status = 'pending_payment'");
        $pendingPacking = (int) $db->fetchColumn("SELECT COUNT(*) FROM orders WHERE order_status = 'processing_packing'");
        $pendingShipment = (int) $db->fetchColumn("SELECT COUNT(*) FROM orders WHERE order_status = 'paid'");

        Response::success([
            'today' => [
                'revenue'     => (float) $todayStats['revenue'],
                'orders'      => (int) $todayStats['total_orders'],
            ],
            'month' => [
                'revenue'     => (float) $monthStats['revenue'],
                'orders'      => (int) $monthStats['total_orders'],
            ],
            'overview' => [
                'total_products'  => $totalProducts,
                'total_orders'    => $totalOrders,
                'low_stock_count' => count($lowStockItems),
            ],
            'pending_actions' => [
                'pending_payments' => $pendingPayments,
                'pending_packing'  => $pendingPacking,
                'pending_shipment' => $pendingShipment,
            ],
            'low_stock_items' => array_slice($lowStockItems, 0, 5),
            'recent_orders'   => $recentOrders,
        ]);
    }
}
