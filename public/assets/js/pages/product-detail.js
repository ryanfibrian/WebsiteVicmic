/**
 * Product Detail Page SPA Component
 */
const ProductDetailPage = {
    async render(params) {
        const app = document.getElementById('app');
        const slug = params.slug;

        app.innerHTML = `
            <div class="container" style="padding-top: 20px;">
                <!-- Skeleton Loader -->
                <div id="product-skeleton" style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                    <div class="skeleton" style="aspect-ratio: 1; border-radius: var(--radius-lg);"></div>
                    <div>
                        <div class="skeleton skeleton-text" style="height: 30px; margin-bottom: 16px;"></div>
                        <div class="skeleton skeleton-text" style="height: 40px; width: 60%; margin-bottom: 24px;"></div>
                        <div class="skeleton skeleton-text" style="height: 100px;"></div>
                    </div>
                </div>

                <!-- Product Content -->
                <div id="product-content" style="display: none;"></div>
                
                <!-- Related Products -->
                <section class="section">
                    <div class="section-header">
                        <h2 class="section-title">Mungkin Anda Suka</h2>
                    </div>
                    <div class="product-grid" id="related-products"></div>
                </section>
            </div>
        `;

        try {
            const res = await API.get(`/products/${slug}`);
            this.renderProduct(res.data);
            
            if (res.data && res.data.category_slug) {
                localStorage.setItem('vicmic_preferred_category', res.data.category_slug);
            }
            
            // Load related products (featured as fallback for now)
            const preferredCategory = localStorage.getItem('vicmic_preferred_category') || '';
            const relatedRes = await API.get('/products/featured', { limit: 4, preferred_category: preferredCategory });
            ProductCard.renderList(relatedRes.data, 'related-products');
        } catch (e) {
            document.getElementById('product-skeleton').style.display = 'none';
            document.getElementById('product-content').innerHTML = `
                <div class="text-center" style="padding: 100px 0;">
                    <h2 class="text-error mb-2">Produk Tidak Ditemukan</h2>
                    <p class="text-muted">Maaf, produk yang Anda cari tidak ada atau sudah dihapus.</p>
                    <a href="/products" data-link class="btn btn-primary mt-3">Kembali ke Katalog</a>
                </div>
            `;
            document.getElementById('product-content').style.display = 'block';
        }
    },

    renderProduct(product) {
        document.getElementById('product-skeleton').style.display = 'none';
        
        const isSale = product.sale_price && product.sale_price < product.base_price;
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '/assets/img/placeholder.jpg';
        
        const html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; margin-bottom: 40px;">
                <!-- Gallery -->
                <div class="product-gallery">
                    <div style="border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border-light); aspect-ratio: 1;">
                        <img id="main-image" src="${mainImage}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    ${product.images && product.images.length > 1 ? `
                        <div style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto; padding-bottom: 10px;">
                            ${product.images.map((img, idx) => `
                                <div class="gallery-thumb" style="width: 70px; height: 70px; border-radius: var(--radius-md); border: 2px solid ${idx===0 ? 'var(--primary-500)' : 'transparent'}; cursor: pointer; overflow: hidden; background: var(--bg-secondary); flex-shrink: 0;" onclick="ProductDetailPage.setMainImage(this, '${img}')">
                                    <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Info -->
                <div class="product-info">
                    ${product.brand ? `<div class="card-brand" style="font-size: 0.875rem; margin-bottom: 8px;">${product.brand}</div>` : ''}
                    <h1 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700; line-height: 1.3; margin-bottom: 16px;">${product.name}</h1>
                    
                    <div style="margin-bottom: 24px; display: flex; align-items: baseline; gap: 12px;">
                        <span style="font-family: var(--font-heading); font-size: 2rem; font-weight: 700; color: var(--primary-700);">${formatRupiah(product.sale_price || product.base_price)}</span>
                        ${isSale ? `<span style="text-decoration: line-through; color: var(--text-muted);">${formatRupiah(product.base_price)}</span>` : ''}
                    </div>

                    <!-- Variants (if any) -->
                    ${product.variants && product.variants.length > 0 ? `
                        <div style="margin-bottom: 24px;">
                            <label class="form-label">Pilih Varian:</label>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${product.variants.map((v, i) => `
                                    <button class="variant-btn ${i===0 ? 'active' : ''}" 
                                            data-id="${v.id}" 
                                            data-price="${v.price_adjustment}"
                                            style="padding: 8px 16px; border: 1.5px solid ${i===0 ? 'var(--primary-500)' : 'var(--border-color)'}; border-radius: var(--radius-md); background: ${i===0 ? 'var(--primary-50)' : 'transparent'}; font-size: 0.875rem; font-weight: 500;">
                                        ${v.variant_name} ${v.price_adjustment > 0 ? `(+${formatRupiah(v.price_adjustment)})` : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Stock Info -->
                    <div style="margin-bottom: 24px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 0.875rem;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${product.total_stock > 0 
                                ? `<span style="color: var(--success);">●</span> Stok Tersedia` 
                                : `<span style="color: var(--error);">●</span> Stok Habis`}
                        </div>
                        ${product.warranty_period_months ? `
                            <div style="margin-top: 8px; color: var(--text-secondary);">
                                🛡️ Garansi Resmi ${product.warranty_period_months} Bulan
                            </div>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; gap: 12px; margin-bottom: 32px;">
                        <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; width: 120px; background: var(--bg-primary);">
                            <button id="pd-qty-dec" style="flex: 1; height: 42px; font-size: 1.25rem;">-</button>
                            <input type="number" id="pd-qty" value="1" min="1" max="${product.total_stock}" style="width: 40px; text-align: center; border: none; font-weight: 600;">
                            <button id="pd-qty-inc" style="flex: 1; height: 42px; font-size: 1.25rem;">+</button>
                        </div>
                        <button id="btn-add-to-cart" class="btn btn-primary" style="flex: 1;" ${product.total_stock <= 0 ? 'disabled' : ''}>
                            + Keranjang
                        </button>
                    </div>

                    <!-- Quick Specs -->
                    ${this.renderQuickSpecs(product)}

                </div>
            </div>
            
            <!-- Full Description -->
            <div style="margin-bottom: 60px;">
                <h3 style="font-family: var(--font-heading); margin-bottom: 16px; border-bottom: 2px solid var(--primary-100); padding-bottom: 8px; display: inline-block;">Deskripsi Produk</h3>
                <div style="line-height: 1.8; color: var(--text-secondary);">
                    ${product.description ? product.description.replace(/\n/g, '<br>') : 'Belum ada deskripsi.'}
                </div>
            </div>
        `;

        const contentDiv = document.getElementById('product-content');
        contentDiv.innerHTML = html;
        contentDiv.style.display = 'block';

        // Bind Actions
        this.bindActions(product);
    },

    renderQuickSpecs(product) {
        let specsHTML = '';
        const specs = [
            { label: 'SKU', value: product.sku },
            { label: 'Prosesor', value: product.processor },
            { label: 'RAM', value: product.ram_capacity },
            { label: 'Storage', value: product.storage_type },
            { label: 'GPU', value: product.gpu },
            { label: 'Layar', value: product.display_specs },
            { label: 'OS', value: product.os },
            { label: 'Berat', value: product.weight_grams ? `${product.weight_grams/1000} kg` : null },
        ];

        specs.forEach(s => {
            if (s.value) {
                specsHTML += `
                    <div style="display: flex; padding: 8px 0; border-bottom: 1px dashed var(--border-light); font-size: 0.8125rem;">
                        <span style="width: 100px; color: var(--text-muted);">${s.label}</span>
                        <span style="flex: 1; font-weight: 500;">${s.value}</span>
                    </div>
                `;
            }
        });

        if (!specsHTML) return '';

        return `
            <div style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px;">
                <h4 style="font-size: 0.875rem; margin-bottom: 12px;">Spesifikasi Singkat</h4>
                ${specsHTML}
            </div>
        `;
    },

    setMainImage(thumbEl, src) {
        document.getElementById('main-image').src = src;
        // Update active thumb style
        document.querySelectorAll('.gallery-thumb').forEach(el => {
            el.style.borderColor = 'transparent';
        });
        thumbEl.style.borderColor = 'var(--primary-500)';
    },

    bindActions(product) {
        // Variant Selection
        let selectedVariantId = product.variants && product.variants.length > 0 ? product.variants[0].id : null;
        
        document.querySelectorAll('.variant-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.variant-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = 'var(--border-color)';
                    b.style.background = 'transparent';
                });
                
                const target = e.currentTarget;
                target.classList.add('active');
                target.style.borderColor = 'var(--primary-500)';
                target.style.background = 'var(--primary-50)';
                
                selectedVariantId = target.dataset.id;
            });
        });

        // Qty Controls
        const qtyInput = document.getElementById('pd-qty');
        document.getElementById('pd-qty-dec').addEventListener('click', () => {
            if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
        });
        document.getElementById('pd-qty-inc').addEventListener('click', () => {
            if (parseInt(qtyInput.value) < product.total_stock) qtyInput.value = parseInt(qtyInput.value) + 1;
        });

        // Add to Cart
        document.getElementById('btn-add-to-cart').addEventListener('click', () => {
            const qty = parseInt(qtyInput.value);
            Cart.add(product.id, selectedVariantId, qty);
        });
    }
};

router.route('/product/:slug', ProductDetailPage.render.bind(ProductDetailPage));
