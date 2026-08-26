<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Auth, Validator, Database};

class AuthController
{
    public function login(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'identity' => 'required|string',
            'password' => 'required|string|min:6',
        ]);
        $data = $validator->validateOrFail();

        $user = Auth::attempt($data['identity'], $data['password']);

        if (!$user) {
            Response::error('Username/email atau password salah', 401);
            return;
        }

        $token = Auth::generateToken($user);

        Response::success([
            'user'  => $user,
            'token' => $token,
        ], 'Login berhasil');
    }

    public function logout(Request $request): void
    {
        Auth::logout();
        Response::success(null, 'Logout berhasil');
    }

    public function me(Request $request): void
    {
        $user = Auth::user($request);
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }
        Response::success($user);
    }

    public function listUsers(Request $request): void
    {
        $db = Database::getInstance();
        $users = $db->fetchAll(
            "SELECT id, username, email, full_name, role, assigned_warehouse_id, is_active, last_login_at, created_at
             FROM admin_users ORDER BY created_at DESC"
        );
        Response::success($users);
    }

    public function createUser(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'username'  => 'required|string|min:3|max:50|unique:admin_users,username',
            'email'     => 'required|email|unique:admin_users,email',
            'password'  => 'required|string|min:8',
            'full_name' => 'required|string|max:150',
            'role'      => 'required|in:super_admin,admin,warehouse_staff,finance,customer_service',
        ]);
        $data = $validator->validateOrFail();

        $db = Database::getInstance();
        $id = $db->insert('admin_users', [
            'username'      => $data['username'],
            'email'         => $data['email'],
            'password_hash' => Auth::hashPassword($data['password']),
            'full_name'     => $data['full_name'],
            'role'          => $data['role'],
            'assigned_warehouse_id' => $request->input('assigned_warehouse_id'),
        ]);

        Response::created(['id' => $id], 'User berhasil dibuat');
    }

    public function updateUser(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = Database::getInstance();

        $user = $db->fetch("SELECT * FROM admin_users WHERE id = ?", [$id]);
        if (!$user) {
            Response::notFound('User tidak ditemukan');
            return;
        }

        $data = [];
        if ($request->input('full_name')) $data['full_name'] = $request->input('full_name');
        if ($request->input('email')) $data['email'] = $request->input('email');
        if ($request->input('role')) $data['role'] = $request->input('role');
        if ($request->input('is_active') !== null) $data['is_active'] = (bool) $request->input('is_active');
        if ($request->input('assigned_warehouse_id')) $data['assigned_warehouse_id'] = (int) $request->input('assigned_warehouse_id');
        if ($request->input('password')) $data['password_hash'] = Auth::hashPassword($request->input('password'));

        if (!empty($data)) {
            $db->update('admin_users', $data, ['id' => $id]);
        }

        Response::success(null, 'User berhasil diupdate');
    }
}
