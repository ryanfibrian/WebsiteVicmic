<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Validator, Database};

class CustomerAdminController
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index(Request $request): void
    {
        $customers = $this->db->query("SELECT id, name, email, phone, is_active, last_login_at, created_at FROM customers ORDER BY created_at DESC")->fetchAll();
        Response::success($customers);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $customer = $this->db->fetchRow("SELECT id, name, email, phone, is_active, last_login_at, created_at FROM customers WHERE id = ?", [$id]);
        
        if (!$customer) {
            Response::notFound('Pelanggan tidak ditemukan');
            return;
        }
        
        $addresses = $this->db->fetchAll("SELECT * FROM customer_addresses WHERE customer_id = ?", [$id]);
        $customer['addresses'] = $addresses;

        Response::success($customer);
    }

    public function store(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:150',
            'email'     => 'required|email|unique:customers,email',
            'phone'     => 'string|max:50',
            'password'  => 'required|string|min:6'
        ]);
        
        $data = $validator->validateOrFail();
        
        $insertData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT)
        ];

        $id = $this->db->insert('customers', $insertData);
        Response::created(['id' => $id], 'Pelanggan berhasil ditambahkan');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:150',
            'email'     => 'required|email',
            'phone'     => 'string|max:50',
            'is_active' => 'boolean'
        ]);
        
        $data = $validator->validateOrFail();
        
        $existing = $this->db->fetchRow("SELECT id FROM customers WHERE email = ? AND id != ?", [$data['email'], $id]);
        if ($existing) {
            Response::error('Email sudah digunakan oleh pelanggan lain', 400);
            return;
        }

        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'is_active' => $request->input('is_active') ? 1 : 0
        ];

        if ($request->input('password')) {
            $updateData['password_hash'] = password_hash($request->input('password'), PASSWORD_DEFAULT);
        }

        $this->db->update('customers', $updateData, ['id' => $id]);
        Response::success(null, 'Data pelanggan berhasil diperbarui');
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');
        $this->db->delete('customers', ['id' => $id]);
        Response::success(null, 'Pelanggan berhasil dihapus');
    }
}
