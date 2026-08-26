<?php
namespace Vicmic\Middleware;

use Vicmic\Core\Request;

/**
 * CorsMiddleware — Handles Cross-Origin Resource Sharing headers.
 */
class CorsMiddleware
{
    public function handle(Request $request): bool
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = ['*']; // In production, restrict to specific domains

        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        return true;
    }
}
