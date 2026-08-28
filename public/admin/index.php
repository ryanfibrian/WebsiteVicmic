<?php
/**
 * Vicmic Admin Panel — App Shell
 */
session_start();
// Simple auth check for admin panel (assuming auth sets $_SESSION['admin'])
// For now, we'll just allow it to load the UI for development.

// Helper to bypass browser cache
$v = time();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vicmic Admin Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/admin.css?v=<?= $v ?>">
    <script src="https://unpkg.com/feather-icons"></script>
</head>
<body>
    <aside class="sidebar">
        <div class="sidebar-header" style="padding: 20px;">
            <img src="/assets/img/logo.png" alt="Vicmic Logo" style="width: 100%; height: auto; max-height: 40px; object-fit: contain;">
        </div>
        <nav class="sidebar-nav">
            <a href="/admin/" data-link class="nav-item active">
                <i data-feather="grid" class="nav-icon"></i> Dashboard
            </a>
            <a href="/admin/orders" data-link class="nav-item">
                <i data-feather="shopping-bag" class="nav-icon"></i> Pesanan
            </a>
            <a href="/admin/products" data-link class="nav-item">
                <i data-feather="box" class="nav-icon"></i> Produk
            </a>
            <a href="/admin/inventory" data-link class="nav-item">
                <i data-feather="layers" class="nav-icon"></i> Inventory
            </a>
            <a href="/admin/serial-numbers" data-link class="nav-item">
                <i data-feather="hash" class="nav-icon"></i> Serial Numbers
            </a>
            <a href="/admin/warehouses" data-link class="nav-item">
                <i data-feather="home" class="nav-icon"></i> Warehouses
            </a>
            
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin: 20px 20px 10px; font-weight: 600;">Pengguna</div>
            
            <a href="/admin/customers" data-link class="nav-item">
                <i data-feather="users" class="nav-icon"></i> Pelanggan
            </a>
            <a href="/admin/users" data-link class="nav-item">
                <i data-feather="shield" class="nav-icon"></i> Admin
            </a>
        </nav>
    </aside>
    
    <main class="main-content">
        <header class="topbar">
            <div class="topbar-search">
                <input type="text" class="form-control" placeholder="Cari..." style="width: 300px; background: rgba(0,0,0,0.05); border: 1px solid var(--border-dark);">
            </div>
            <div class="topbar-user" style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: 500;" id="admin-user-name">Admin User</span>
                <div id="admin-user-avatar" style="width: 35px; height: 35px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff;">A</div>
                <button onclick="adminLogout()" class="btn btn-danger btn-sm" style="padding: 5px 10px; font-size: 0.8rem; margin-left: 10px;">Logout</button>
            </div>
        </header>

        <script>
            function adminLogout() {
                if (confirm('Yakin ingin keluar?')) {
                    API.post('/admin/auth/logout').then(() => {
                        window.location.href = '/admin/login';
                    }).catch(() => {
                        window.location.href = '/admin/login';
                    });
                }
            }
            
            // Try to load current user name
            document.addEventListener('DOMContentLoaded', () => {
                feather.replace(); // Initialize feather icons
                
                API.get('/admin/me').then(res => {
                    if (res.success && res.data) {
                        document.getElementById('admin-user-name').textContent = res.data.full_name || res.data.username;
                        document.getElementById('admin-user-avatar').textContent = (res.data.full_name || res.data.username).charAt(0).toUpperCase();
                    }
                }).catch(() => {
                    // Do not redirect here, let AdminApp handle the login UI.
                });
            });
        </script>
        
        <div class="page-content" id="admin-app">
            <!-- Admin SPA content will be injected here -->
            <div style="text-align: center; padding: 50px;">
                Memuat Dashboard...
            </div>
        </div>
    </main>

    <script src="/assets/js/api-client.js?v=<?= $v ?>"></script>
    <script src="/assets/js/router.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/dashboard.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/products.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/orders.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/inventory.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/serial-numbers.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/warehouses.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/users.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/customers.js?v=<?= $v ?>"></script>
    <script src="/assets/js/admin/app.js?v=<?= $v ?>"></script>
    <script>
        // Re-initialize icons when SPA navigates
        const observer = new MutationObserver(() => {
            if(window.feather) feather.replace();
        });
        observer.observe(document.getElementById('admin-app'), { childList: true, subtree: true });
    </script>
</body>
</html>
