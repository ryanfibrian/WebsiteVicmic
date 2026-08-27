<?php
/**
 * Vicmic E-Commerce Platform — API Router Entry Point
 * 
 * All /api/* requests are routed here by .htaccess.
 * Registers routes and dispatches to controllers.
 */

// Auto-detect deployment structure (cPanel vs Local)
if (file_exists(dirname(__DIR__) . '/vendor/autoload.php')) {
    define('VICMIC_ROOT', dirname(__DIR__));
} else {
    define('VICMIC_ROOT', dirname(__DIR__, 2) . '/vicmic_core');
}

// Composer autoloader
require_once VICMIC_ROOT . '/vendor/autoload.php';

// Load config
require_once VICMIC_ROOT . '/config/app.php';

// Error handling
if (config('APP_DEBUG')) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// Set timezone
date_default_timezone_set(config('APP_TIMEZONE', 'Asia/Jakarta'));

use Vicmic\Core\{Router, Request, Response};
use Vicmic\Middleware\{AuthMiddleware, CorsMiddleware};

// Controllers — Storefront
use Vicmic\Controllers\ProductController;
use Vicmic\Controllers\CartController;
use Vicmic\Controllers\CheckoutController;
use Vicmic\Controllers\OrderController;
use Vicmic\Controllers\ShippingController;
use Vicmic\Controllers\WarrantyController;
use Vicmic\Controllers\CustomerAuthController;
use Vicmic\Controllers\CustomerProfileController;

// Controllers — Admin
use Vicmic\Controllers\Admin\AuthController;
use Vicmic\Controllers\Admin\DashboardController;
use Vicmic\Controllers\Admin\ProductAdminController;
use Vicmic\Controllers\Admin\OrderAdminController;
use Vicmic\Controllers\Admin\InventoryController;
use Vicmic\Controllers\Admin\SerialNumberController;
use Vicmic\Controllers\Admin\WarehouseController;
use Vicmic\Controllers\Admin\MediaStudioController;
use Vicmic\Controllers\Admin\SearchController;
use Vicmic\Controllers\Admin\SettingsController;
use Vicmic\Controllers\Admin\AdminUserController;
use Vicmic\Controllers\Admin\CustomerAdminController;

// Create router and request
$router = new Router();
$request = new Request();

// Apply CORS globally
(new CorsMiddleware())->handle($request);

// ============================================================
// PUBLIC STOREFRONT API ROUTES
// ============================================================

$router->group('/api', function (Router $r) {

    // Products
    $r->get('/products', [ProductController::class, 'index']);
    $r->get('/products/featured', [ProductController::class, 'featured']);
    $r->get('/products/search', [ProductController::class, 'search']);
    $r->get('/products/:slug', [ProductController::class, 'show']);
    $r->get('/products/:slug/stock', [ProductController::class, 'stockInfo']);

    // Categories
    $r->get('/categories', [ProductController::class, 'categories']);

    // Cart (session-based)
    $r->get('/cart', [CartController::class, 'show']);
    $r->post('/cart/add', [CartController::class, 'add']);
    $r->put('/cart/update', [CartController::class, 'update']);
    $r->delete('/cart/remove/:id', [CartController::class, 'remove']);
    $r->delete('/cart/clear', [CartController::class, 'clear']);

    // Checkout
    $r->post('/checkout', [CheckoutController::class, 'process']);
    $r->get('/checkout/shipping-rates', [ShippingController::class, 'calculateRates']);

    // Shipping
    $r->get('/shipping/provinces', [ShippingController::class, 'provinces']);
    $r->get('/shipping/cities/:province_id', [ShippingController::class, 'cities']);

    // Orders (public - lookup by order number + email)
    $r->get('/orders/track/:order_number', [OrderController::class, 'track']);

    // Warranty check
    $r->get('/warranty/check/:serial_number', [WarrantyController::class, 'check']);

    // Settings (public subset)
    $r->get('/settings/public', [SettingsController::class, 'publicSettings']);

    // Customer Auth
    $r->post('/auth/register', [CustomerAuthController::class, 'register']);
    $r->post('/auth/login', [CustomerAuthController::class, 'login']);
    $r->post('/auth/logout', [CustomerAuthController::class, 'logout']);
    $r->get('/auth/me', [CustomerAuthController::class, 'me']);
    $r->post('/auth/forgot-password', [CustomerAuthController::class, 'forgotPassword']);
    $r->post('/auth/reset-password', [CustomerAuthController::class, 'resetPassword']);

    // Customer Profile & Data
    $r->put('/auth/profile', [CustomerProfileController::class, 'updateProfile']);
    $r->get('/customer/addresses', [CustomerProfileController::class, 'getAddresses']);
    $r->post('/customer/addresses', [CustomerProfileController::class, 'addAddress']);
    $r->put('/customer/addresses/:id', [CustomerProfileController::class, 'updateAddress']);
    $r->delete('/customer/addresses/:id', [CustomerProfileController::class, 'deleteAddress']);
    $r->get('/customer/orders', [CustomerProfileController::class, 'getOrders']);
});

// ============================================================
// ADMIN API ROUTES (Protected)
// ============================================================

$router->group('/api/admin', function (Router $r) {

    // Auth (no middleware)
    $r->post('/login', [AuthController::class, 'login']);
    $r->post('/logout', [AuthController::class, 'logout'], [AuthMiddleware::auth()]);
    $r->get('/me', [AuthController::class, 'me'], [AuthMiddleware::auth()]);

    // Dashboard
    $r->get('/dashboard', [DashboardController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/dashboard/stats', [DashboardController::class, 'stats'], [AuthMiddleware::auth()]);

    // Product Management
    $r->get('/products', [ProductAdminController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/products/:id', [ProductAdminController::class, 'show'], [AuthMiddleware::auth()]);
    $r->post('/products', [ProductAdminController::class, 'store'], [AuthMiddleware::role('admin')]);
    $r->put('/products/:id', [ProductAdminController::class, 'update'], [AuthMiddleware::role('admin')]);
    $r->delete('/products/:id', [ProductAdminController::class, 'destroy'], [AuthMiddleware::role('super_admin')]);

    // Variants
    $r->post('/products/:id/variants', [ProductAdminController::class, 'addVariant'], [AuthMiddleware::role('admin')]);
    $r->put('/variants/:id', [ProductAdminController::class, 'updateVariant'], [AuthMiddleware::role('admin')]);
    $r->delete('/variants/:id', [ProductAdminController::class, 'deleteVariant'], [AuthMiddleware::role('admin')]);

    // Order Management
    $r->get('/orders', [OrderAdminController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/orders/:id', [OrderAdminController::class, 'show'], [AuthMiddleware::auth()]);
    $r->put('/orders/:id/status', [OrderAdminController::class, 'updateStatus'], [AuthMiddleware::role('admin')]);
    $r->put('/orders/:id/tracking', [OrderAdminController::class, 'updateTracking'], [AuthMiddleware::role('warehouse_staff')]);
    $r->put('/orders/:id/assign-sn', [OrderAdminController::class, 'assignSerialNumbers'], [AuthMiddleware::role('warehouse_staff')]);

    // Inventory
    $r->get('/inventory', [InventoryController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/inventory/low-stock', [InventoryController::class, 'lowStock'], [AuthMiddleware::auth()]);
    $r->post('/inventory/adjust', [InventoryController::class, 'adjust'], [AuthMiddleware::role('warehouse_staff')]);
    $r->post('/inventory/mutation', [InventoryController::class, 'createMutation'], [AuthMiddleware::role('admin')]);
    $r->put('/inventory/mutation/:id/receive', [InventoryController::class, 'receiveMutation'], [AuthMiddleware::role('warehouse_staff')]);

    // Serial Numbers
    $r->get('/serial-numbers', [SerialNumberController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/serial-numbers/:id', [SerialNumberController::class, 'show'], [AuthMiddleware::auth()]);
    $r->post('/serial-numbers', [SerialNumberController::class, 'store'], [AuthMiddleware::role('warehouse_staff')]);
    $r->post('/serial-numbers/bulk', [SerialNumberController::class, 'bulkStore'], [AuthMiddleware::role('warehouse_staff')]);
    $r->put('/serial-numbers/:id', [SerialNumberController::class, 'update'], [AuthMiddleware::role('warehouse_staff')]);

    // Warehouses
    $r->get('/warehouses', [WarehouseController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/warehouses/:id', [WarehouseController::class, 'show'], [AuthMiddleware::auth()]);
    $r->post('/warehouses', [WarehouseController::class, 'store'], [AuthMiddleware::role('super_admin')]);
    $r->put('/warehouses/:id', [WarehouseController::class, 'update'], [AuthMiddleware::role('super_admin')]);

    // Media Studio
    $r->get('/media', [MediaStudioController::class, 'index'], [AuthMiddleware::auth()]);
    $r->post('/media/upload', [MediaStudioController::class, 'upload'], [AuthMiddleware::auth()]);
    $r->delete('/media/:id', [MediaStudioController::class, 'destroy'], [AuthMiddleware::role('admin')]);

    // Global Search
    $r->get('/search', [SearchController::class, 'search'], [AuthMiddleware::auth()]);

    // Settings
    $r->get('/settings', [SettingsController::class, 'index'], [AuthMiddleware::role('super_admin')]);
    $r->put('/settings', [SettingsController::class, 'update'], [AuthMiddleware::role('super_admin')]);

    // Admin Users Management
    $r->get('/users', [AdminUserController::class, 'index'], [AuthMiddleware::role('super_admin')]);
    $r->post('/users', [AdminUserController::class, 'store'], [AuthMiddleware::role('super_admin')]);
    $r->put('/users/:id', [AdminUserController::class, 'update'], [AuthMiddleware::role('super_admin')]);
    $r->delete('/users/:id', [AdminUserController::class, 'destroy'], [AuthMiddleware::role('super_admin')]);

    // Customer Management
    $r->get('/customers', [CustomerAdminController::class, 'index'], [AuthMiddleware::auth()]);
    $r->get('/customers/:id', [CustomerAdminController::class, 'show'], [AuthMiddleware::auth()]);
    $r->post('/customers', [CustomerAdminController::class, 'store'], [AuthMiddleware::role('admin')]);
    $r->put('/customers/:id', [CustomerAdminController::class, 'update'], [AuthMiddleware::role('admin')]);
    $r->delete('/customers/:id', [CustomerAdminController::class, 'destroy'], [AuthMiddleware::role('admin')]);
});

// ============================================================
// DISPATCH
// ============================================================

try {
    $router->dispatch($request);
} catch (\Throwable $e) {
    if (config('APP_DEBUG')) {
        Response::error($e->getMessage(), 500, [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);
    } else {
        Response::serverError('Terjadi kesalahan. Silakan coba lagi.');
    }
}
