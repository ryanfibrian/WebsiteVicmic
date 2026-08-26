<?php
namespace Vicmic\Services;

use Vicmic\Core\Database;
use Vicmic\Models\SerialNumber;

class SerialNumberService
{
    private Database $db;
    private SerialNumber $model;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->model = new SerialNumber();
    }

    /**
     * Check if a serial number is valid for warranty claim
     */
    public function checkWarranty(string $serialNumber): ?array
    {
        $sn = $this->model->getBySerialNumber($serialNumber);
        
        if (!$sn) {
            return null; // Not found
        }

        // Must be sold
        if ($sn['status'] !== 'sold' || !$sn['order_item_id']) {
            return [
                'status' => 'invalid',
                'message' => 'Serial number belum terdaftar sebagai produk terjual.',
            ];
        }

        // Get order details to check warranty period
        $order = $this->db->fetch(
            "SELECT o.paid_at, o.order_status, oi.product_id, p.name as product_name
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE oi.id = ?",
            [$sn['order_item_id']]
        );

        if (!$order || !$order['paid_at']) {
            return [
                'status' => 'invalid',
                'message' => 'Data pesanan tidak ditemukan atau belum dibayar.',
            ];
        }

        $purchaseDate = new \DateTime($order['paid_at']);
        // Assuming 1 year warranty
        $warrantyExpiry = clone $purchaseDate;
        $warrantyExpiry->modify('+1 year');
        $now = new \DateTime();

        $isActive = $now <= $warrantyExpiry;

        return [
            'status' => $isActive ? 'active' : 'expired',
            'product_name' => $order['product_name'],
            'serial_number' => $sn['serial_number'],
            'purchase_date' => $purchaseDate->format('Y-m-d'),
            'expiry_date' => $warrantyExpiry->format('Y-m-d'),
            'message' => $isActive ? 'Garansi masih aktif.' : 'Garansi sudah habis.',
        ];
    }
}
