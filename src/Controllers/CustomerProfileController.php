<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response, Validator, Database};

class CustomerProfileController
{
    private Database $db;
    private array $customer;

    public function __construct()
    {
        $this->db = Database::getInstance();
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        if (!isset($_SESSION['customer'])) {
            Response::error('Not authenticated', 401);
            exit; // Prevent further execution
        }
        $this->customer = $_SESSION['customer'];
    }

    /**
     * Update Profile Info & Password
     */
    public function updateProfile(Request $request): void
    {
        $rules = [
            'name'  => 'required|string|max:150',
            'phone' => 'string|max:50',
        ];

        // If password is provided, validate it
        $body = $request->all();
        if (!empty($body['password'])) {
            $rules['password'] = 'string|min:6';
        }

        $validator = Validator::make($body, $rules);
        $data = $validator->validateOrFail();

        $updateData = [
            'name'  => $data['name'],
            'phone' => $data['phone'] ?? null,
        ];

        if (!empty($data['password'])) {
            $updateData['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $this->db->update('customers', $updateData, ['id' => $this->customer['id']]);

        // Update session
        $_SESSION['customer']['name'] = $data['name'];

        Response::success(null, 'Profil berhasil diperbarui');
    }

    /**
     * Get all addresses for the logged in customer
     */
    public function getAddresses(Request $request): void
    {
        $addresses = $this->db->fetchAll(
            "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC",
            [$this->customer['id']]
        );
        Response::success($addresses);
    }

    /**
     * Add a new address
     */
    public function addAddress(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'label'          => 'required|string|max:50',
            'recipient_name' => 'required|string|max:150',
            'phone'          => 'required|string|max:50',
            'address'        => 'required|string',
            'city_id'        => 'required|numeric',
            'district_id'    => 'numeric',
            'is_default'     => 'boolean'
        ]);

        $data = $validator->validateOrFail();
        
        $data['customer_id'] = $this->customer['id'];
        $data['district_id'] = $data['district_id'] ?? 0;
        
        // Handle city/province names if we need them, simplified for now
        $data['city_name'] = $request->input('city_name', '');
        $data['province_name'] = $request->input('province_name', '');
        $data['postal_code'] = $request->input('postal_code', '');

        // If this is set as default, remove default from others
        if (!empty($data['is_default'])) {
            $this->db->query("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?", [$this->customer['id']]);
            $data['is_default'] = 1;
        } else {
            $data['is_default'] = 0;
        }

        $id = $this->db->insert('customer_addresses', $data);
        Response::created(['id' => $id], 'Alamat berhasil ditambahkan');
    }

    /**
     * Update an address
     */
    public function updateAddress(Request $request): void
    {
        $id = $request->param('id');
        
        // Check ownership
        $address = $this->db->fetch("SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?", [$id, $this->customer['id']]);
        if (!$address) {
            Response::error('Alamat tidak ditemukan', 404);
            return;
        }

        $validator = Validator::make($request->all(), [
            'label'          => 'required|string|max:50',
            'recipient_name' => 'required|string|max:150',
            'phone'          => 'required|string|max:50',
            'address'        => 'required|string',
            'city_id'        => 'required|numeric',
            'is_default'     => 'boolean'
        ]);

        $data = $validator->validateOrFail();
        
        if (!empty($data['is_default'])) {
            $this->db->query("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?", [$this->customer['id']]);
            $data['is_default'] = 1;
        } else {
            $data['is_default'] = 0;
        }

        $this->db->update('customer_addresses', $data, ['id' => $id]);
        Response::success(null, 'Alamat berhasil diubah');
    }

    /**
     * Delete an address
     */
    public function deleteAddress(Request $request): void
    {
        $id = $request->param('id');
        $deleted = $this->db->delete('customer_addresses', ['id' => $id, 'customer_id' => $this->customer['id']]);
        
        if ($deleted) {
            Response::success(null, 'Alamat berhasil dihapus');
        } else {
            Response::error('Alamat tidak ditemukan', 404);
        }
    }

    /**
     * Get order history
     */
    public function getOrders(Request $request): void
    {
        $statusFilter = $request->query('status'); // all, diproses, dikirim, selesai, batal
        
        $where = ["customer_email = ?"];
        $params = [$this->customer['email']];

        if ($statusFilter && $statusFilter !== 'all') {
            if ($statusFilter === 'diproses') {
                $where[] = "order_status IN ('pending_payment', 'paid', 'processing_packing')";
            } elseif ($statusFilter === 'dikirim') {
                $where[] = "order_status = 'shipped'";
            } elseif ($statusFilter === 'selesai') {
                $where[] = "order_status IN ('delivered', 'completed')";
            } elseif ($statusFilter === 'batal') {
                $where[] = "order_status IN ('cancelled', 'refunded')";
            }
        }

        $whereClause = implode(" AND ", $where);
        
        $orders = $this->db->fetchAll(
            "SELECT id, order_number, total_amount, order_status, created_at, tracking_number, courier_name, payment_status 
             FROM orders 
             WHERE $whereClause 
             ORDER BY created_at DESC",
            $params
        );

        // Fetch first item for each order to show in UI
        foreach ($orders as &$order) {
            $items = $this->db->fetchAll(
                "SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = ? LIMIT 2",
                [$order['id']]
            );
            $order['items'] = $items;
            
            $itemCount = $this->db->fetchColumn("SELECT COUNT(*) FROM order_items WHERE order_id = ?", [$order['id']]);
            $order['item_count'] = $itemCount;
        }

        Response::success($orders);
    }
}
