/**
 * Home Page SPA Component
 */
const HomePage = {
    async render() {
        const app = document.getElementById('app');
        
        // Initial HTML framework
        app.innerHTML = `
            <!-- Hero Section -->
            <section class="hero">
                <div class="container hero-content">
                    <span class="hero-tag">Distributor Resmi IT</span>
                    <h1>Tingkatkan Produktivitasmu dengan Hardware Terbaik</h1>
                    <p>Temukan berbagai macam laptop, PC, dan aksesoris original bergaransi resmi dengan harga terbaik dari distributor langsung.</p>
                    <a href="/products" data-link class="btn btn-primary btn-lg">Belanja Sekarang</a>
                </div>
            </section>

            <div class="container" style="padding-top: 40px;">
                <!-- Categories -->
                <section class="section pt-0">
                    <div class="section-header">
                        <h2 class="section-title">Kategori Pilihan</h2>
                    </div>
                    <div class="category-grid" id="home-categories">
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-image"></div>
                    </div>
                </section>

                <!-- Featured Products -->
                <section class="section">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Produk Terlaris</h2>
                            <p class="section-subtitle">Pilihan favorit pelanggan Vicmic</p>
                        </div>
                        <a href="/products?sort=popular" data-link class="btn btn-outline btn-sm">Lihat Semua</a>
                    </div>
                    <div class="product-grid" id="home-featured-products"></div>
                </section>
                
                <!-- Features Banner -->
                <section class="section" style="margin-top: 20px;">
                    <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 40px; text-align: center;">
                        <h2 class="section-title">Mengapa Belanja di Vicmic?</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-top: 32px;">
                            <div>
                                <div style="font-size: 2rem; margin-bottom: 12px;">🛡️</div>
                                <h4>Garansi Resmi</h4>
                                <p class="text-muted text-sm mt-1">Semua produk dijamin bergaransi resmi dari brand.</p>
                            </div>
                            <div>
                                <div style="font-size: 2rem; margin-bottom: 12px;">🚚</div>
                                <h4>Smart Routing</h4>
                                <p class="text-muted text-sm mt-1">Sistem mencari gudang terdekat untuk ongkir termurah.</p>
                            </div>
                            <div>
                                <div style="font-size: 2rem; margin-bottom: 12px;">💳</div>
                                <h4>Pembayaran Aman</h4>
                                <p class="text-muted text-sm mt-1">Transaksi dijamin aman oleh Midtrans (Gopay, VA, CC).</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;

        // Render Skeletons
        ProductCard.renderSkeletons(8, 'home-featured-products');

        // Fetch Data
        try {
            const [featuredRes, categoriesRes] = await Promise.all([
                API.get('/products/featured', { limit: 8 }),
                API.get('/products/categories')
            ]);

            // Render Featured Products
            ProductCard.renderList(featuredRes.data, 'home-featured-products');

            // Render Categories
            const catContainer = document.getElementById('home-categories');
            if (categoriesRes.data && categoriesRes.data.length > 0) {
                catContainer.innerHTML = categoriesRes.data.map(c => `
                    <a href="/products?category=${c.slug}" data-link class="category-card">
                        <span class="cat-icon">${this.getCategoryIcon(c.name)}</span>
                        <span class="cat-name">${c.name}</span>
                        <span class="cat-count">${c.product_count || 0} Produk</span>
                    </a>
                `).join('');
            } else {
                catContainer.innerHTML = '<p>Kategori belum tersedia</p>';
            }

        } catch (e) {
            console.error('Failed to load home data', e);
        }
    },

    getCategoryIcon(name) {
        const icons = {
            'laptop': '💻',
            'desktop': '🖥️',
            'monitor': '🖥️',
            'aksesoris': '🖱️',
            'komponen': '⚙️',
            'networking': '📡'
        };
        const key = Object.keys(icons).find(k => name.toLowerCase().includes(k));
        return key ? icons[key] : '📦';
    }
};

// Register Route
router.route('/', () => HomePage.render());
