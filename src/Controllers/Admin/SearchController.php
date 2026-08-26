<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Database};

class SearchController
{
    public function search(Request $request): void
    {
        $q = $request->query('q', '');
        if (mb_strlen($q) < 2) {
            Response::success(['results' => []]);
            return;
        }

        $db = Database::getInstance();
        $results = [];
        $search = '%' . $q . '%';

        // Search orders
        $orders = $db->fetchAll(
            "SELECT 'order' as type, id, order_number as title, 
                    CONCAT(customer_name, ' - ', order_status) as subtitle,
                    created_at
             FROM orders 
             WHERE order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? 
                   OR customer_phone LIKE ? OR tracking_number LIKE ?
             LIMIT 10",
            [$search, $search, $search, $search, $search]
        );
        $results = array_merge($results, $orders);

        // Search serial numbers
        $serialNumbers = $db->fetchAll(
            "SELECT 'serial_number' as type, sn.id, sn.serial_number as title,
                    CONCAT(p.name, ' - ', sn.status) as subtitle,
                    sn.created_at
             FROM product_serial_numbers sn
             LEFT JOIN products p ON sn.product_id = p.id
             WHERE sn.serial_number LIKE ?
             LIMIT 10",
            [$search]
        );
        $results = array_merge($results, $serialNumbers);

        // Search products
        $products = $db->fetchAll(
            "SELECT 'product' as type, id, name as title, 
                    CONCAT(sku, ' - ', brand) as subtitle,
                    created_at
             FROM products 
             WHERE name LIKE ? OR sku LIKE ? OR brand LIKE ?
             LIMIT 10",
            [$search, $search, $search]
        );
        $results = array_merge($results, $products);

        Response::success(['results' => $results, 'query' => $q]);
    }
}
