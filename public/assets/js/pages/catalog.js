/**
 * Catalog Page SPA Component (Product Listing / Search)
 */
const CatalogPage = {
    async render(params) {
        const app = document.getElementById('app');
        const query = params.query || {};
        
        const q = query.q || '';
        const category = query.category || '';
        const sort = query.sort || 'newest';

        const pageTitle = q 
            ? `Hasil pencarian: "${q}"`
            : category 
                ? `Kategori: ${category.replace(/-/g, ' ')}`
                : 'Semua Produk';

        app.innerHTML = `
            <div class="container">
                <div class="section-header" style="margin-bottom: 16px;">
                    <h1 class="section-title" style="text-transform: capitalize;">${pageTitle}</h1>
                </div>

                <!-- Filters & Sort -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; gap: 8px; flex: 1; min-width: 250px;">
                        <input type="text" id="catalog-search" class="form-input" placeholder="Cari produk..." value="${q}" style="max-width: 300px;">
                        <button id="btn-apply-search" class="btn btn-secondary">Cari</button>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="text-sm font-weight-600">Urutkan:</span>
                        <select id="catalog-sort" class="form-select" style="width: 200px;">
                            <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Terbaru</option>
                            <option value="popular" ${sort === 'popular' ? 'selected' : ''}>Terpopuler</option>
                            <option value="price_low" ${sort === 'price_low' ? 'selected' : ''}>Harga: Rendah ke Tinggi</option>
                            <option value="price_high" ${sort === 'price_high' ? 'selected' : ''}>Harga: Tinggi ke Rendah</option>
                        </select>
                    </div>
                </div>

                <!-- Products Grid -->
                <div class="product-grid" id="catalog-products"></div>
                
                <!-- Pagination -->
                <div id="catalog-pagination" style="display: flex; justify-content: center; gap: 8px; margin-top: 40px; margin-bottom: 40px;"></div>
            </div>
        `;

        // Bind events
        document.getElementById('btn-apply-search').addEventListener('click', () => {
            this.updateURL();
        });
        
        document.getElementById('catalog-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.updateURL();
        });

        document.getElementById('catalog-sort').addEventListener('change', () => {
            this.updateURL();
        });

        // Load data
        this.loadProducts(query);
    },

    updateURL() {
        const q = document.getElementById('catalog-search').value;
        const sort = document.getElementById('catalog-sort').value;
        
        // Preserve category if exists in current URL
        const currentParams = new URLSearchParams(window.location.search);
        const cat = currentParams.get('category');
        
        const newParams = new URLSearchParams();
        if (q) newParams.set('q', q);
        if (cat) newParams.set('category', cat);
        if (sort !== 'newest') newParams.set('sort', sort);
        
        const qs = newParams.toString();
        router.navigate(`/products${qs ? '?' + qs : ''}`);
    },

    async loadProducts(queryParams) {
        ProductCard.renderSkeletons(12, 'catalog-products');
        
        try {
            const res = await API.get('/products', queryParams);
            
            // Render Products
            ProductCard.renderList(res.data, 'catalog-products');
            
            // Render Pagination (Simple implementation for now)
            const meta = res.meta;
            const paginationEl = document.getElementById('catalog-pagination');
            
            if (meta && meta.last_page > 1) {
                let btns = '';
                // Prev
                if (meta.current_page > 1) {
                    btns += `<button class="btn btn-secondary btn-sm" onclick="CatalogPage.goToPage(${meta.current_page - 1})">← Prev</button>`;
                }
                
                btns += `<span style="padding: 6px 12px; border-radius: var(--radius-sm); background: var(--bg-secondary); font-size: 0.8125rem;">Halaman ${meta.current_page} dari ${meta.last_page}</span>`;
                
                // Next
                if (meta.current_page < meta.last_page) {
                    btns += `<button class="btn btn-secondary btn-sm" onclick="CatalogPage.goToPage(${meta.current_page + 1})">Next →</button>`;
                }
                
                paginationEl.innerHTML = btns;
            } else {
                paginationEl.innerHTML = '';
            }

        } catch (e) {
            document.getElementById('catalog-products').innerHTML = `<p class="text-error">Gagal memuat produk: ${e.message}</p>`;
        }
    },

    goToPage(page) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        router.navigate(`/products?${params.toString()}`);
    }
};

router.route('/products', CatalogPage.render.bind(CatalogPage));
