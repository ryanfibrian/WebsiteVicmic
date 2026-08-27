<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response, Validator, Database};

class CustomerAuthController
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function register(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:150',
            'email'     => 'required|email|unique:customers,email',
            'password'  => 'required|string|min:6',
            'phone'     => 'string|max:50',
        ]);
        
        $data = $validator->validateOrFail();
        
        $insertData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'is_active' => 1
        ];

        $id = $this->db->insert('customers', $insertData);
        
        // Auto login after registration
        $_SESSION['customer'] = [
            'id' => $id,
            'name' => $data['name'],
            'email' => $data['email']
        ];
        
        session_regenerate_id(true);
        
        Response::created([
            'id' => $id,
            'name' => $data['name']
        ], 'Pendaftaran berhasil!');
    }

    public function login(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string'
        ]);
        
        $data = $validator->validateOrFail();
        
        $customer = $this->db->fetchRow("SELECT id, name, email, password_hash, is_active FROM customers WHERE email = ?", [$data['email']]);
        
        if (!$customer || !password_verify($data['password'], $customer['password_hash'])) {
            Response::error('Email atau password salah', 401);
            return;
        }
        
        if (!$customer['is_active']) {
            Response::error('Akun Anda dinonaktifkan. Silakan hubungi admin.', 403);
            return;
        }

        // Update last login
        $this->db->update('customers', ['last_login_at' => date('Y-m-d H:i:s')], ['id' => $customer['id']]);

        // Login session
        $_SESSION['customer'] = [
            'id' => $customer['id'],
            'name' => $customer['name'],
            'email' => $customer['email']
        ];
        
        session_regenerate_id(true);

        Response::success([
            'id' => $customer['id'],
            'name' => $customer['name']
        ], 'Login berhasil');
    }

    public function logout(Request $request): void
    {
        if (isset($_SESSION['customer'])) {
            unset($_SESSION['customer']);
        }
        Response::success(null, 'Logout berhasil');
    }

    public function me(Request $request): void
    {
        if (!isset($_SESSION['customer'])) {
            Response::error('Not authenticated', 401);
            return;
        }
        
        Response::success($_SESSION['customer']);
    }
}
