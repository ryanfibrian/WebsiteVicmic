<?php
namespace Vicmic\Middleware;

use Vicmic\Core\{Auth, Request, Response};

/**
 * AuthMiddleware — Protects admin API routes.
 * 
 * Checks session or JWT token authentication.
 * Optionally enforces minimum role level.
 */
class AuthMiddleware
{
    private ?string $requiredRole;

    public function __construct(?string $requiredRole = null)
    {
        $this->requiredRole = $requiredRole;
    }

    /**
     * Handle the middleware check
     * Returns false to halt request, true to continue
     */
    public function handle(Request $request): bool
    {
        if (!Auth::check($request)) {
            Response::unauthorized('Silakan login terlebih dahulu');
            return false;
        }

        if ($this->requiredRole && !Auth::hasRole($this->requiredRole, $request)) {
            Response::forbidden('Anda tidak memiliki akses untuk fitur ini');
            return false;
        }

        return true;
    }

    /**
     * Static factory: require any authenticated user
     */
    public static function auth(): callable
    {
        return function (Request $request): bool {
            return (new self())->handle($request);
        };
    }

    /**
     * Static factory: require specific role or higher
     */
    public static function role(string $role): callable
    {
        return function (Request $request) use ($role): bool {
            return (new self($role))->handle($request);
        };
    }

    /**
     * Static factory: require any of specified roles
     */
    public static function anyRole(array $roles): callable
    {
        return function (Request $request) use ($roles): bool {
            if (!Auth::check($request)) {
                Response::unauthorized('Silakan login terlebih dahulu');
                return false;
            }
            if (!Auth::hasAnyRole($roles, $request)) {
                Response::forbidden('Anda tidak memiliki akses untuk fitur ini');
                return false;
            }
            return true;
        };
    }
}
