<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Auth};
use Vicmic\Models\{Order, SerialNumber};
use Vicmic\Services\StockService;

class OrderAdminController
{
    private Order $model;

    public function __construct()
    {
        $this->model = new Order();
    }

    public function index(Request $request): void
    {
        $pagination = $request->pagination();
        $filters = [
            'status'         => $request->query('status'),
            'payment_status' => $request->query('payment_status'),
            'warehouse_id'   => $request->query('warehouse_id'),
            'date_from'      => $request->query('date_from'),
            'date_to'        => $request->query('date_to'),
        ];

        $result = $this->model->getPaginated($filters, $pagination['offset'], $pagination['per_page']);
        Response::paginated($result['items'], $result['total'], $pagination['page'], $pagination['per_page']);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $order = $this->model->getById($id);

        if (!$order) {
            Response::notFound('Pesanan tidak ditemukan');
            return;
        }

        Response::success($order);
    }

    public function updateStatus(Request $request): void
    {
        $id = (int) $request->param('id');
        $status = $request->input('status');

        $validStatuses = ['pending_payment', 'paid', 'processing_packing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            Response::error('Status tidak valid', 400);
            return;
        }

        // Handle cancellation — release reserved stock
        if ($status === 'cancelled') {
            $order = $this->model->getById($id);
            if ($order && in_array($order['order_status'], ['pending_payment', 'paid'])) {
                $stockService = new StockService();
                foreach ($order['items'] as $item) {
                    $stockService->releaseStock(
                        $item['product_id'],
                        $item['variant_id'],
                        $order['fulfillment_warehouse_id'],
                        $item['quantity']
                    );
                }
                // Release serial numbers
                $snModel = new SerialNumber();
                $snModel->release($id);
            }
        }

        $this->model->updateStatus($id, $status);
        Response::success(null, 'Status pesanan diupdate ke: ' . $status);
    }

    public function updateTracking(Request $request): void
    {
        $id = (int) $request->param('id');
        $trackingNumber = $request->input('tracking_number');
        $courierName = $request->input('courier_name');
        $courierService = $request->input('courier_service');

        if (empty($trackingNumber)) {
            Response::error('Nomor resi wajib diisi', 400);
            return;
        }

        $this->model->updateTracking($id, $trackingNumber, $courierName, $courierService);
        Response::success(null, 'Nomor resi berhasil diupdate');
    }

    public function assignSerialNumbers(Request $request): void
    {
        $orderId = (int) $request->param('id');
        $assignments = $request->input('assignments'); // [{order_item_id, serial_numbers: ['SN1', 'SN2']}]

        if (empty($assignments)) {
            Response::error('Data serial number wajib diisi', 400);
            return;
        }

        $db = \Vicmic\Core\Database::getInstance();
        $snModel = new SerialNumber();

        $db->beginTransaction();
        try {
            foreach ($assignments as $assignment) {
                $orderItemId = $assignment['order_item_id'];
                $serialNumbers = $assignment['serial_numbers'];

                foreach ($serialNumbers as $snString) {
                    $sn = $snModel->getBySerialNumber(trim($snString));
                    if (!$sn) {
                        throw new \RuntimeException("Serial number '$snString' tidak ditemukan");
                    }
                    if ($sn['status'] !== 'available') {
                        throw new \RuntimeException("Serial number '$snString' tidak tersedia (status: {$sn['status']})");
                    }

                    $snModel->reserve($sn['id'], $orderId, $orderItemId);
                }

                // Update order_items.assigned_serial_numbers
                $db->update('order_items', [
                    'assigned_serial_numbers' => json_encode($serialNumbers),
                ], ['id' => $orderItemId]);
            }

            $db->commit();
            Response::success(null, 'Serial number berhasil di-assign');
        } catch (\Throwable $e) {
            $db->rollback();
            Response::error($e->getMessage(), 400);
        }
    }
}
