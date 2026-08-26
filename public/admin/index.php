<?php
/**
 * Vicmic Admin Panel — App Shell
 */
session_start();
// Simple auth check for admin panel (assuming auth sets $_SESSION['admin'])
// For now, we'll just allow it to load the UI for development.
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vicmic Admin Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
    <aside class="sidebar">
        <div class="sidebar-header">
            VICMIC Admin
        </div>
        <nav class="sidebar-nav">
            <a href="/admin/" data-link class="nav-item active">
                <span class="nav-icon">📊</span> Dashboard
            </a>
            <a href="/admin/orders" data-link class="nav-item">
                <span class="nav-icon">📦</span> Pesanan
            </a>
            <a href="/admin/products" data-link class="nav-item">
                <span class="nav-icon">💻</span> Produk
            </a>
            <a href="/admin/inventory" data-link class="nav-item">
                <span class="nav-icon">🏢</span> Inventory
            </a>
            <a href="/admin/serial-numbers" data-link class="nav-item">
                <span class="nav-icon">🏷️</span> Serial Numbers
            </a>
            <a href="/admin/warehouses" data-link class="nav-item">
                <span class="nav-icon">🏭</span> Warehouses
            </a>
        </nav>
    </aside>
    
    <main class="main-content">
        <header class="topbar">
            <div class="topbar-search">
                <input type="text" class="form-control" placeholder="Cari..." style="width: 300px; background: rgba(0,0,0,0.2); border: none;">
            </div>
            <div class="topbar-user" style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: 500;">Admin User</span>
                <div style="width: 35px; height: 35px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">A</div>
            </div>
        </header>
        
        <div class="page-content" id="admin-app">
            <!-- Admin SPA content will be injected here -->
            <div style="text-align: center; padding: 50px;">
                Memuat Dashboard...
            </div>
        </div>
    </main>

    <script src="/assets/js/api-client.js?v=2"></script>
    <script src="/assets/js/router.js?v=2"></script>
    <script src="/assets/js/admin/dashboard.js?v=2"></script>
    <script src="/assets/js/admin/products.js?v=2"></script>
    <script src="/assets/js/admin/orders.js?v=2"></script>
    <script src="/assets/js/admin/inventory.js?v=2"></script>
    <script src="/assets/js/admin/serial-numbers.js?v=2"></script>
    <script src="/assets/js/admin/app.js?v=2"></script>
</body>
</html>
