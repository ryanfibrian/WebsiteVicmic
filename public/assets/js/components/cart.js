/**
 * Shopping Cart State and UI Logic
 */
const Cart = {
    items: [],
    subtotal: 0,
    count: 0,
    
    // UI Elements
    elements: {
        drawer: null,
        overlay: null,
        badge: null,
        body: null,
        subtotal: null,
        btnOpen: null,
        btnClose: null,
    },

    init() {
        this.elements.drawer = document.getElementById('cart-drawer');
        this.elements.overlay = document.getElementById('cart-overlay');
        this.elements.badge = document.getElementById('cart-badge');
        this.elements.body = document.getElementById('cart-body');
        this.elements.subtotal = document.getElementById('cart-subtotal');
        this.elements.btnOpen = document.getElementById('btn-cart');
        this.elements.btnClose = document.getElementById('btn-close-cart');

        // Bind events
        if (this.elements.btnOpen) {
            this.elements.btnOpen.addEventListener('click', () => this.open());
        }
        if (this.elements.btnClose) {
            this.elements.btnClose.addEventListener('click', () => this.close());
        }
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => this.close());
        }

        // Event delegation for cart item buttons
        if (this.elements.body) {
            this.elements.body.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (id && action === 'increase') this.updateQuantity(id, 1);
                if (id && action === 'decrease') this.updateQuantity(id, -1);
                if (id && action === 'remove') this.remove(id);
            });
        }

        // Fetch initial cart data
        this.fetchCart();
    },

    async fetchCart() {
        try {
            const data = await API.get('/cart');
            this.updateState(data.data);
        } catch (e) {
            console.error('Failed to load cart', e);
        }
    },

    async add(productId, variantId = null, quantity = 1) {
        try {
            const data = await API.post('/cart/add', { 
                product_id: productId, 
                variant_id: variantId, 
                quantity 
            });
            this.updateState(data.data);
            showToast('Produk ditambahkan ke keranjang');
            this.open();
        } catch (e) {
            showToast(e.message || 'Gagal menambahkan ke keranjang', 'error');
        }
    },

    async updateQuantity(key, delta) {
        const item = this.items.find(i => i.key === key);
        if (!item) return;

        const newQty = item.quantity + delta;
        
        try {
            if (newQty <= 0) {
                await this.remove(key);
            } else {
                const parts = key.split('-');
                const data = await API.put('/cart/update', { 
                    product_id: parts[0], 
                    variant_id: parts[1] === '0' ? null : parts[1], 
                    quantity: newQty 
                });
                this.updateState(data.data);
            }
        } catch (e) {
            showToast('Gagal update keranjang', 'error');
        }
    },

    async remove(key) {
        try {
            const data = await API.delete(`/cart/remove/${key}`);
            this.updateState(data.data);
        } catch (e) {
            showToast('Gagal menghapus item', 'error');
        }
    },

    async clear() {
        try {
            const data = await API.delete('/cart/clear');
            this.updateState(data.data);
        } catch (e) {}
    },

    updateState(data) {
        if (!data) return;
        this.items = data.items || [];
        this.subtotal = data.subtotal || 0;
        this.count = data.count || 0;
        this.render();
    },

    render() {
        // Update badge
        if (this.elements.badge) {
            this.elements.badge.textContent = this.count;
            if (this.count > 0) {
                this.elements.badge.classList.remove('hidden');
            } else {
                this.elements.badge.classList.add('hidden');
            }
        }

        // Update subtotal
        if (this.elements.subtotal) {
            this.elements.subtotal.textContent = formatRupiah(this.subtotal);
        }

        // Render items
        if (this.elements.body) {
            if (this.items.length === 0) {
                this.elements.body.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);text-align:center;">
                        <span style="font-size:3rem;margin-bottom:16px;">🛒</span>
                        <p>Keranjang belanjamu kosong</p>
                        <button class="btn btn-primary mt-3" onclick="Cart.close();router.navigate('/products')">Mulai Belanja</button>
                    </div>
                `;
                return;
            }

            const html = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || '/assets/img/placeholder.jpg'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h4 class="cart-item-name" title="${item.name}">${item.name}</h4>
                        ${item.variant_name ? `<div class="text-xs text-muted mb-1">Varian: ${item.variant_name}</div>` : ''}
                        <div class="cart-item-price">${formatRupiah(item.unit_price)}</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" data-id="${item.key}" data-action="decrease">-</button>
                            <span style="font-size: 0.875rem; width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="qty-btn" data-id="${item.key}" data-action="increase">+</button>
                            <button class="qty-btn ml-auto" data-id="${item.key}" data-action="remove" style="border:none;color:var(--error);margin-left:auto;">🗑</button>
                        </div>
                    </div>
                </div>
            `).join('');

            this.elements.body.innerHTML = html;
        }
    },

    open() {
        if (this.elements.drawer) this.elements.drawer.classList.add('open');
        if (this.elements.overlay) this.elements.overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    },

    close() {
        if (this.elements.drawer) this.elements.drawer.classList.remove('open');
        if (this.elements.overlay) this.elements.overlay.classList.remove('open');
        document.body.style.overflow = '';
    }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
