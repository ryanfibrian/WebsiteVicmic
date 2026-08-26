<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response};
use Vicmic\Models\SerialNumber;

class WarrantyController
{
    public function check(Request $request): void
    {
        $sn = $request->param('serial_number');
        
        if (empty($sn) || mb_strlen($sn) < 3) {
            Response::error('Masukkan serial number yang valid', 400);
            return;
        }

        $model = new SerialNumber();
        $result = $model->getBySerialNumber($sn);

        if (!$result) {
            Response::notFound('Serial number tidak ditemukan di sistem kami');
            return;
        }

        // Calculate warranty status
        $warrantyActive = false;
        $warrantyDaysLeft = 0;
        
        if ($result['warranty_expiry']) {
            $expiry = new \DateTime($result['warranty_expiry']);
            $now = new \DateTime();
            $warrantyActive = $expiry > $now;
            $warrantyDaysLeft = max(0, (int) $now->diff($expiry)->format('%r%a'));
        }

        Response::success([
            'serial_number'     => $result['serial_number'],
            'product_name'      => $result['product_name'],
            'brand'             => $result['brand'],
            'variant'           => $result['variant_name'],
            'status'            => $result['status'],
            'warranty_active'   => $warrantyActive,
            'warranty_expiry'   => $result['warranty_expiry'],
            'warranty_days_left'=> $warrantyDaysLeft,
            'warranty_months'   => $result['warranty_period_months'],
            'purchase_date'     => $result['sold_at'] ? date('Y-m-d', strtotime($result['sold_at'])) : null,
            'order_number'      => $result['order_number'],
        ]);
    }
}
