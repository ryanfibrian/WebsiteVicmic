<?php
namespace Vicmic\Core;

/**
 * Auth — Authentication & Authorization for Admin Panel.
 * 
 * Supports:
 * - Session-based auth with CSRF protection
 * - JWT token generation/validation for API
 * - Role-based access control (RBAC)
 * - Password hashing with Argon2ID
 */
class Auth
{
    private static ?array $currentUser = null;

    /**
     * Admin roles hierarchy (higher index = more permissions)
     */
    private const ROLE_HIERARCHY = [
        'customer_service' => 1,
        'warehouse_staff'  => 2,
        'finance'          => 3,
        'admin'            => 4,
        'super_admin'      => 5,
    ];

    /**
     * Hash a password using Argon2ID (or bcrypt fallback)
     */
    public static function hashPassword(string $password): string
    {
        if (defined('PASSWORD_ARGON2ID')) {
            return password_hash($password, PASSWORD_ARGON2ID);
        }
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify a password against a hash
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Attempt login with username/email and password
     * Returns user data on success, null on failure
     */
    public static function attempt(string $identity, string $password): ?array
    {
        $db = Database::getInstance();

        $user = $db->fetch(
            'SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = 1',
            [$identity, $identity]
        );

        if (!$user || !self::verifyPassword($password, $user['password_hash'])) {
            return null;
        }

        // Update last login
        $db->update('admin_users', ['last_login_at' => date('Y-m-d H:i:s')], ['id' => $user['id']]);

        // Remove sensitive fields
        unset($user['password_hash']);

        // Store in session
        self::createSession($user);

        return $user;
    }

    /**
     * Create authenticated session
     */
    private static function createSession(array $user): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['admin_user'] = [
            'id'       => $user['id'],
            'username' => $user['username'],
            'email'    => $user['email'],
            'full_name'=> $user['full_name'],
            'role'     => $user['role'],
            'warehouse_id' => $user['assigned_warehouse_id'] ?? null,
        ];

        // Regenerate session ID for security
        session_regenerate_id(true);

        // Generate CSRF token
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    /**
     * Generate a JWT token for API authentication
     */
    public static function generateToken(array $user): string
    {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256',
        ]));

        $payload = self::base64UrlEncode(json_encode([
            'sub'  => $user['id'],
            'name' => $user['full_name'],
            'role' => $user['role'],
            'wh'   => $user['assigned_warehouse_id'] ?? null,
            'iat'  => time(),
            'exp'  => time() + (int) config('SESSION_LIFETIME', 7200),
        ]));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", config('JWT_SECRET'), true)
        );

        return "$header.$payload.$signature";
    }

    /**
     * Validate and decode a JWT token
     */
    public static function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        // Verify signature
        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", config('JWT_SECRET'), true)
        );

        if (!hash_equals($expectedSig, $signature)) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!$decoded) {
            return null;
        }

        // Check expiration
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return null;
        }

        return $decoded;
    }

    /**
     * Get the currently authenticated user
     * Checks session first, then JWT token
     */
    public static function user(?Request $request = null): ?array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        // Check session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION['admin_user'])) {
            self::$currentUser = $_SESSION['admin_user'];
            return self::$currentUser;
        }

        // Check JWT token
        if ($request) {
            $token = $request->bearerToken();
            if ($token) {
                $decoded = self::validateToken($token);
                if ($decoded) {
                    self::$currentUser = [
                        'id'       => $decoded['sub'],
                        'full_name'=> $decoded['name'],
                        'role'     => $decoded['role'],
                        'warehouse_id' => $decoded['wh'] ?? null,
                    ];
                    return self::$currentUser;
                }
            }
        }

        return null;
    }

    /**
     * Check if user is authenticated
     */
    public static function check(?Request $request = null): bool
    {
        return self::user($request) !== null;
    }

    /**
     * Check if user has a specific role or higher
     */
    public static function hasRole(string $requiredRole, ?Request $request = null): bool
    {
        $user = self::user($request);
        if (!$user) return false;

        $userLevel = self::ROLE_HIERARCHY[$user['role']] ?? 0;
        $requiredLevel = self::ROLE_HIERARCHY[$requiredRole] ?? 999;

        return $userLevel >= $requiredLevel;
    }

    /**
     * Check if user has any of the specified roles
     */
    public static function hasAnyRole(array $roles, ?Request $request = null): bool
    {
        $user = self::user($request);
        if (!$user) return false;

        return in_array($user['role'], $roles, true);
    }

    /**
     * Get the CSRF token
     */
    public static function csrfToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Validate CSRF token from request
     */
    public static function validateCsrf(Request $request): bool
    {
        $token = $request->header('X-CSRF-Token') ?? $request->input('_csrf_token');
        return $token && hash_equals(self::csrfToken(), $token);
    }

    /**
     * Logout — destroy session
     */
    public static function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        self::$currentUser = null;
        $_SESSION = [];
        
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }

        session_destroy();
    }

    /**
     * Base64 URL-safe encode
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode
     */
    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
