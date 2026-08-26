<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Validator};
use Vicmic\Models\SerialNumber;

class SerialNumberController
{
    private SerialNumber $model;

    public function __construct()
    {
        $this->model = new SerialNumber();
    }

    public function index(Request $request): void
    {
        $pagination = $request->pagination();
        $filters = [
            'status'       => $request->query('status'),
            'product_id'   => $request->query('product_id'),
            'warehouse_id' => $request->query('warehouse_id'),
            'search'       => $request->query('q'),
        ];

        $result = $this->model->getPaginated($filters, $pagination['offset'], $pagination['per_page']);
        Response::paginated($result['items'], $result['total'], $pagination['page'], $pagination['per_page']);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = \Vicmic\Core\Database::getInstance();
        
        $sn = $db->fetch(
            "SELECT sn.*, p.name as product_name, p.sku, pv.variant_name, w.name as warehouse_name, o.order_number
             FROM product_serial_numbers sn
             LEFT JOIN products p ON sn.product_id = p.id
             LEFT JOIN product_variants pv ON sn.variant_id = pv.id
             LEFT JOIN warehouses w ON sn.warehouse_id = w.id
             LEFT JOIN orders o ON sn.order_id = o.id
             WHERE sn.id = ?", [$id]
        );

        if (!$sn) {
            Response::notFound('Serial number tidak ditemukan');
            return;
        }

        Response::success($sn);
    }

    public function store(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'serial_number' => 'required|string|max:100|unique:product_serial_numbers,serial_number',
            'product_id'    => 'required|integer',
            'warehouse_id'  => 'required|integer',
        ]);
        $data = $validator->validateOrFail();
        $data['variant_id'] = $request->input('variant_id');
        $data['notes'] = $request->input('notes');

        $id = $this->model->register($data);
        Response::created(['id' => $id], 'Serial number berhasil didaftarkan');
    }

    public function bulkStore(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'serial_numbers' => 'required|array',
            'product_id'     => 'required|integer',
            'warehouse_id'   => 'required|integer',
        ]);
        $data = $validator->validateOrFail();

        $variantId = $request->input('variant_id') ? (int) $request->input('variant_id') : null;

        try {
            $count = $this->model->bulkRegister(
                $data['serial_numbers'], $data['product_id'], $variantId, $data['warehouse_id']
            );
            Response::created(['count' => $count], "$count serial number berhasil didaftarkan");
        } catch (\Throwable $e) {
            Response::error('Gagal mendaftarkan serial number: ' . $e->getMessage(), 400);
        }
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $status = $request->input('status');
        $notes = $request->input('notes');

        if ($status) {
            $this->model->updateStatus($id, $status, $notes);
        }

        Response::success(null, 'Serial number berhasil diupdate');
    }
}
