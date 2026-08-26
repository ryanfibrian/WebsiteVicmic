<?php
/**
 * Vicmic Storefront — PWA App Shell
 * This is the only HTML page served for all storefront routes.
 * The SPA router handles client-side navigation.
 */
define('VICMIC_ROOT', dirname(__DIR__));
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#16a34a">
    <meta name="description" content="Vicmic Indonesia — Toko laptop dan IT hardware terpercaya. Garansi resmi, harga terbaik, pengiriman ke seluruh Indonesia.">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Vicmic Indonesia">

    <title>Vicmic Indonesia — Laptop & IT Hardware Terpercaya</title>

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link rel="apple-touch-icon" href="/assets/img/icon-192.png">

    <!-- Preconnect to Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Stylesheet -->
    <link rel="stylesheet" href="/assets/css/storefront.css">

    <!-- Open Graph -->
    <meta property="og:title" content="Vicmic Indonesia — Laptop & IT Hardware Terpercaya">
    <meta property="og:description" content="Toko laptop dan IT hardware terpercaya. Garansi resmi, harga terbaik.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://vicmic.id">
    <meta property="og:image" content="/assets/img/og-image.jpg">
</head>
<body>
    <!-- Header -->
    <header class="site-header" id="site-header">
        <div class="header-inner">
            <a href="/" class="header-logo" data-link>
                <span class="logo-text">VICMIC</span>
            </a>

            <div class="header-search">
                <span class="search-icon">🔍</span>
                <input type="text" id="header-search-input" placeholder="Cari laptop, aksesoris..." autocomplete="off">
            </div>

            <div class="header-actions">
                <button class="header-action-btn" id="btn-search-mobile" title="Cari">🔍</button>
                <button class="header-action-btn" id="btn-cart" title="Keranjang">
                    🛒
                    <span class="cart-badge hidden" id="cart-badge">0</span>
                </button>
                <button class="mobile-menu-btn header-action-btn" id="btn-mobile-menu" title="Menu">☰</button>
            </div>
        </div>
    </header>

    <!-- Toast Container -->
    <div class="toast-container" id="toast-container"></div>

    <!-- Cart Drawer -->
    <div class="cart-overlay" id="cart-overlay"></div>
    <aside class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer-header">
            <h3>🛒 Keranjang Belanja</h3>
            <button class="header-action-btn" id="btn-close-cart">✕</button>
        </div>
        <div class="cart-drawer-body" id="cart-body">
            <p class="text-muted text-center mt-3">Keranjang masih kosong</p>
        </div>
        <div class="cart-drawer-footer" id="cart-footer">
            <div class="cart-total">
                <span class="cart-total-label">Subtotal</span>
                <span class="cart-total-value" id="cart-subtotal">Rp 0</span>
            </div>
            <a href="/checkout" data-link class="btn btn-primary btn-full" id="btn-checkout">Checkout</a>
        </div>
    </aside>

    <!-- Main Content Area (SPA renders here) -->
    <main id="app" class="page-content">
        <!-- SPA page content injected here -->
        <div class="container" style="padding-top: 120px; text-align: center;">
            <div class="skeleton skeleton-text" style="max-width: 300px; margin: 0 auto 12px;"></div>
            <div class="skeleton skeleton-text skeleton-text-sm" style="max-width: 200px; margin: 0 auto;"></div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="site-footer" id="site-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <div class="footer-logo">VICMIC Indonesia</div>
                    <p>Mitra resmi ASUS, Acer, HP, Lenovo, MSI & Apple. Melayani penjualan retail & wholesale laptop dan hardware IT sejak 2010.</p>
                </div>
                <div class="footer-col">
                    <h4>Produk</h4>
                    <ul>
                        <li><a href="/products?category=laptop" data-link>Laptop</a></li>
                        <li><a href="/products?category=desktop-pc" data-link>Desktop PC</a></li>
                        <li><a href="/products?category=monitor" data-link>Monitor</a></li>
                        <li><a href="/products?category=aksesoris" data-link>Aksesoris</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Layanan</h4>
                    <ul>
                        <li><a href="/warranty-check" data-link>Cek Garansi</a></li>
                        <li><a href="/order-tracking" data-link>Lacak Pesanan</a></li>
                        <li><a href="https://wa.me/6281XXXXXXXXX" target="_blank">WhatsApp</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Lokasi</h4>
                    <ul>
                        <li><a href="#">Harco Mangga Dua, Jakarta</a></li>
                        <li><a href="#">Gading Serpong, Tangerang</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <span>© 2026 CV Vicmic Indonesia. All rights reserved.</span>
                <span>Powered by vicmic.id</span>
            </div>
        </div>
    </footer>

    <!-- SPA Scripts -->
    <script src="/assets/js/api-client.js"></script>
    <script src="/assets/js/router.js"></script>
    <script src="/assets/js/components/header.js"></script>
    <script src="/assets/js/components/product-card.js"></script>
    <script src="/assets/js/components/cart.js"></script>
    <script src="/assets/js/pages/home.js"></script>
    <script src="/assets/js/pages/catalog.js"></script>
    <script src="/assets/js/pages/product-detail.js"></script>
    <script src="/assets/js/pages/checkout.js"></script>
    <script src="/assets/js/pages/order-tracking.js"></script>
    <script src="/assets/js/pages/warranty-check.js"></script>
    <script src="/assets/js/app.js"></script>

    <!-- Register Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registered:', reg.scope))
                    .catch(err => console.log('SW registration failed:', err));
            });
        }
    </script>
</body>
</html>
