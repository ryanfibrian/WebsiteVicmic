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
            @session_start();
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

        try {
            $id = $this->db->insert('customers', $insertData);
        } catch (\Throwable $e) {
            // Handle duplicate email (race condition between unique check and insert)
            if (str_contains($e->getMessage(), 'Duplicate entry')) {
                Response::error('Email sudah terdaftar. Silakan gunakan email lain atau login.', 409);
                return;
            }
            // Re-throw other DB errors
            throw $e;
        }
        
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
        
        $customer = $this->db->fetch("SELECT id, name, email, password_hash, is_active FROM customers WHERE email = ?", [$data['email']]);
        
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

    public function forgotPassword(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);
        
        $data = $validator->validateOrFail();
        
        // Always respond success (don't reveal if email exists)
        $customer = $this->db->fetch("SELECT id, name, email FROM customers WHERE email = ? AND is_active = 1", [$data['email']]);
        
        if ($customer) {
            // Generate secure token
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
            
            // Invalidate old tokens for this email
            $this->db->query("UPDATE password_reset_tokens SET used = 1 WHERE email = ? AND used = 0", [$data['email']]);
            
            // Store new token
            $this->db->insert('password_reset_tokens', [
                'email' => $data['email'],
                'token' => $token,
                'expires_at' => $expiresAt
            ]);
            
            // Send email
            $resetUrl = config('APP_URL', 'https://vicmic.id') . '/reset-password?token=' . $token;
            $this->sendResetEmail($customer['email'], $customer['name'], $resetUrl);
        }
        
        // Always return success to prevent email enumeration
        Response::success(null, 'Jika email terdaftar, kami telah mengirimkan link reset password ke email Anda.');
    }

    public function resetPassword(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'token'    => 'required|string',
            'password' => 'required|string|min:6'
        ]);
        
        $data = $validator->validateOrFail();
        
        // Find valid token
        $resetToken = $this->db->fetch(
            "SELECT id, email, expires_at FROM password_reset_tokens WHERE token = ? AND used = 0",
            [$data['token']]
        );
        
        if (!$resetToken) {
            Response::error('Link reset password tidak valid atau sudah digunakan.', 400);
            return;
        }
        
        // Check expiry
        if (strtotime($resetToken['expires_at']) < time()) {
            Response::error('Link reset password sudah kadaluarsa. Silakan request ulang.', 400);
            return;
        }
        
        // Update password
        $newHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $this->db->update('customers', ['password_hash' => $newHash], ['email' => $resetToken['email']]);
        
        // Mark token as used
        $this->db->update('password_reset_tokens', ['used' => 1], ['id' => $resetToken['id']]);
        
        Response::success(null, 'Password berhasil diubah. Silakan login dengan password baru Anda.');
    }

    /**
     * Send password reset email using PHP mail() or SMTP
     */
    private function sendResetEmail(string $to, string $name, string $resetUrl): void
    {
        $subject = 'Reset Password — Vicmic Indonesia';
        
        $htmlBody = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0fdf4; margin: 0; padding: 40px 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #16a34a; margin: 0;">Vicmic Indonesia</h2>
        </div>
        <h3 style="color: #1e293b; margin-bottom: 10px;">Halo, {$name}!</h3>
        <p style="color: #64748b; line-height: 1.6;">
            Kami menerima permintaan untuk mengatur ulang password akun Anda. 
            Klik tombol di bawah untuk membuat password baru:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{$resetUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 1rem;">
                Reset Password
            </a>
        </div>
        <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5;">
            Link ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa meminta reset password, abaikan email ini.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">
            © 2026 CV Vicmic Indonesia. All rights reserved.
        </p>
    </div>
</body>
</html>
HTML;

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: Vicmic Indonesia <noreply@vicmic.id>',
            'Reply-To: info@vicmic.id',
            'X-Mailer: PHP/' . phpversion()
        ];

        @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    }
}
