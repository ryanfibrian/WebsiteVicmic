<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Validator, Database};

class AdminUserController
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index(Request $request): void
    {
        $users = $this->db->query("SELECT id, username, email, full_name, role, is_active, last_login_at FROM admin_users ORDER BY created_at DESC")->fetchAll();
        Response::success($users);
    }

    public function store(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'username'  => 'required|string|max:50|unique:admin_users,username',
            'email'     => 'required|email|unique:admin_users,email',
            'password'  => 'required|string|min:6',
            'full_name' => 'required|string|max:150',
            'role'      => 'required|in:super_admin,admin,warehouse_staff,finance,customer_service',
        ]);
        
        $data = $validator->validateOrFail();
        
        $insertData = [
            'username' => $data['username'],
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'role' => $data['role'],
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT)
        ];

        $id = $this->db->insert('admin_users', $insertData);
        Response::created(['id' => $id], 'Pengguna berhasil ditambahkan');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        
        $validator = Validator::make($request->all(), [
            'username'  => 'required|string|max:50',
            'email'     => 'required|email',
            'full_name' => 'required|string|max:150',
            'role'      => 'required|in:super_admin,admin,warehouse_staff,finance,customer_service',
            'is_active' => 'boolean'
        ]);
        
        $data = $validator->validateOrFail();
        
        // Ensure unique username/email excluding this ID (simplified check)
        $existing = $this->db->fetch("SELECT id FROM admin_users WHERE (username = ? OR email = ?) AND id != ?", [$data['username'], $data['email'], $id]);
        if ($existing) {
            Response::error('Username atau Email sudah digunakan oleh pengguna lain', 400);
            return;
        }

        $updateData = [
            'username' => $data['username'],
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'role' => $data['role'],
            'is_active' => $request->input('is_active') ? 1 : 0
        ];

        // Only update password if provided
        if ($request->input('password')) {
            $updateData['password_hash'] = password_hash($request->input('password'), PASSWORD_DEFAULT);
        }

        $this->db->update('admin_users', $updateData, ['id' => $id]);
        Response::success(null, 'Pengguna berhasil diperbarui');
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');
        
        // Prevent deleting oneself (assuming session id is available, simplified for now)
        if (isset($_SESSION['admin_user_id']) && $_SESSION['admin_user_id'] == $id) {
            Response::error('Tidak dapat menghapus akun yang sedang login', 400);
            return;
        }
        
        $this->db->delete('admin_users', ['id' => $id]);
        Response::success(null, 'Pengguna berhasil dihapus');
    }
}
