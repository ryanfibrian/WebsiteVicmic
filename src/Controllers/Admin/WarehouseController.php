<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Validator};
use Vicmic\Models\Warehouse;

class WarehouseController
{
    private Warehouse $model;

    public function __construct()
    {
        $this->model = new Warehouse();
    }

    public function index(Request $request): void
    {
        $activeOnly = $request->query('active_only', 'true') === 'true';
        Response::success($this->model->getAll($activeOnly));
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $wh = $this->model->getById($id);
        if (!$wh) {
            Response::notFound('Gudang tidak ditemukan');
            return;
        }
        Response::success($wh);
    }

    public function store(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:100',
            'code'        => 'required|string|max:20|unique:warehouses,code',
            'address'     => 'required|string',
            'city_id'     => 'required|integer',
            'district_id' => 'required|integer',
        ]);
        $data = $validator->validateOrFail();

        $optional = ['city_name', 'province_name', 'postal_code', 'latitude', 'longitude', 'phone'];
        foreach ($optional as $field) {
            $val = $request->input($field);
            if ($val !== null) $data[$field] = $val;
        }

        $id = $this->model->create($data);
        Response::created(['id' => $id], 'Gudang berhasil ditambahkan');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $wh = $this->model->getById($id);
        if (!$wh) {
            Response::notFound('Gudang tidak ditemukan');
            return;
        }

        $data = $request->all();
        unset($data['id'], $data['created_at']);
        
        $this->model->update($id, $data);
        Response::success(null, 'Gudang berhasil diupdate');
    }
}
