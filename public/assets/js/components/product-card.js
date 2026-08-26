/**
 * Product Card Component Template
 * Generates HTML string for a product card
 */
const ProductCard = {
    render(product) {
        const image = product.images && product.images.length > 0 
            ? product.images[0] 
            : '/assets/img/placeholder.jpg';
        
        const isSale = product.sale_price && product.sale_price < product.base_price;
        const discountPercentage = isSale 
            ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100) 
            : 0;

        let stockLabel = '';
        if (product.total_stock > 5) {
            stockLabel = '<span class="stock-indicator stock-available">Stok Tersedia</span>';
        } else if (product.total_stock > 0) {
            stockLabel = `<span class="stock-indicator stock-low">Sisa ${product.total_stock} unit</span>`;
        } else {
            stockLabel = '<span class="stock-indicator stock-out">Stok Habis</span>';
        }

        return `
            <a href="/product/${product.slug}" class="card product-card" data-link>
                <div class="card-image">
                    <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/img/placeholder.jpg'">
                    ${isSale ? `<div class="card-badge badge-sale">-${discountPercentage}%</div>` : ''}
                    ${product.is_featured && !isSale ? `<div class="card-badge badge-new">Terlaris</div>` : ''}
                </div>
                <div class="card-body">
                    ${product.brand ? `<div class="card-brand">${product.brand}</div>` : ''}
                    <h3 class="card-title" title="${product.name}">${product.name}</h3>
                    
                    <div class="card-price">
                        <div class="price-current">${formatRupiah(product.effective_price)}</div>
                        ${isSale ? `<div class="price-original">${formatRupiah(product.base_price)}</div>` : ''}
                    </div>
                    ${stockLabel}
                </div>
            </a>
        `;
    },

    /**
     * Render multiple cards into a container
     */
    renderList(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = '<div class="text-center text-muted" style="grid-column: 1/-1; padding: 40px;">Belum ada produk</div>';
            return;
        }

        container.innerHTML = products.map(p => this.render(p)).join('');
    },

    /**
     * Render skeleton loading placeholders
     */
    renderSkeletons(count, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="card product-card" style="pointer-events: none;">
                    <div class="skeleton skeleton-image"></div>
                    <div class="card-body">
                        <div class="skeleton skeleton-text skeleton-text-sm"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 80%;"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = skeletons;
    }
};
