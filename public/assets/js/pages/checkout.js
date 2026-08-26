/**
 * Checkout Page SPA Component
 */
const CheckoutPage = {
    async render() {
        const app = document.getElementById('app');
        
        // Ensure cart is loaded before rendering fully
        if (Cart.items.length === 0) {
            await Cart.fetchCart();
        }

        if (Cart.items.length === 0) {
            app.innerHTML = `
                <div class="container text-center" style="padding-top: 100px;">
                    <h2>Keranjang masih kosong</h2>
                    <a href="/products" data-link class="btn btn-primary mt-3">Mulai Belanja</a>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="container" style="padding-top: 20px;">
                <h1 style="font-family: var(--font-heading); margin-bottom: 24px;">Checkout</h1>
                
                <div style="display: grid; grid-template-columns: 1fr 380px; gap: 32px;" id="checkout-grid">
                    <!-- Left: Form -->
                    <div>
                        <div class="card" style="padding: 24px; margin-bottom: 24px;">
                            <h3 class="mb-3">Informasi Pengiriman</h3>
                            
                            <div class="form-group">
                                <label class="form-label">Nama Lengkap</label>
                                <input type="text" id="chk-name" class="form-input" required>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" id="chk-email" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">No. WhatsApp</label>
                                    <input type="tel" id="chk-phone" class="form-input" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Provinsi</label>
                                <select id="chk-province" class="form-select" required>
                                    <option value="">Pilih Provinsi</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Kota/Kabupaten</label>
                                <select id="chk-city" class="form-select" disabled required>
                                    <option value="">Pilih Kota</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Alamat Lengkap</label>
                                <textarea id="chk-address" class="form-textarea form-input" placeholder="Nama jalan, gedung, no. rumah, RT/RW..." required></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Kode Pos</label>
                                <input type="text" id="chk-postal" class="form-input" required>
                            </div>
                        </div>

                        <div class="card" style="padding: 24px; margin-bottom: 24px;">
                            <h3 class="mb-3">Metode Pengiriman</h3>
                            <div id="shipping-options-container">
                                <p class="text-muted text-sm">Pilih kota tujuan terlebih dahulu untuk melihat opsi pengiriman.</p>
                            </div>
                        </div>

                        <div class="card" style="padding: 24px;">
                            <h3 class="mb-3">Pembayaran</h3>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 12px; padding: 16px; border: 1.5px solid var(--primary-400); border-radius: var(--radius-md); background: var(--primary-50); cursor: pointer;">
                                    <input type="radio" name="payment_method" value="midtrans" checked>
                                    <div>
                                        <div style="font-weight: 600;">Otomatis (Midtrans)</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Gopay, Virtual Account, Kartu Kredit, QRIS</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right: Summary -->
                    <div>
                        <div class="card" style="padding: 24px; position: sticky; top: 100px;">
                            <h3 class="mb-3">Ringkasan Pesanan</h3>
                            
                            <div style="margin-bottom: 20px; max-height: 300px; overflow-y: auto; padding-right: 8px;">
                                ${Cart.items.map(item => `
                                    <div style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 0.8125rem;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600;">${item.name}</div>
                                            ${item.variant_name ? `<div class="text-muted text-xs">Varian: ${item.variant_name}</div>` : ''}
                                            <div class="text-muted text-xs">${item.quantity} x ${formatRupiah(item.unit_price)}</div>
                                        </div>
                                        <div style="font-weight: 600;">${formatRupiah(item.line_total)}</div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div style="border-top: 1px dashed var(--border-color); padding-top: 16px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.875rem;">
                                    <span>Subtotal</span>
                                    <span>${formatRupiah(Cart.subtotal)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.875rem;">
                                    <span>Ongkos Kirim</span>
                                    <span id="summary-shipping">Rp 0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px;">
                                    <span style="font-weight: 600;">Total</span>
                                    <span id="summary-total" style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--primary-700);">${formatRupiah(Cart.subtotal)}</span>
                                </div>
                            </div>
                            
                            <button id="btn-process-checkout" class="btn btn-primary btn-full mt-3 btn-lg">Bayar Sekarang</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Responsive grid
        if (window.innerWidth < 768) {
            document.getElementById('checkout-grid').style.gridTemplateColumns = '1fr';
        }

        this.initShippingForms();
        this.bindEvents();
    },

    async initShippingForms() {
        try {
            const res = await API.get('/shipping/provinces');
            const provSelect = document.getElementById('chk-province');
            
            res.data.forEach(p => {
                provSelect.add(new Option(p.name, p.id));
            });

            provSelect.addEventListener('change', async (e) => {
                const provId = e.target.value;
                const citySelect = document.getElementById('chk-city');
                
                citySelect.innerHTML = '<option value="">Pilih Kota</option>';
                citySelect.disabled = true;
                
                if (provId) {
                    const citiesRes = await API.get(`/shipping/cities/${provId}`);
                    citiesRes.data.forEach(c => {
                        citySelect.add(new Option(`${c.type} ${c.name}`, c.id));
                    });
                    citySelect.disabled = false;
                }
            });

            document.getElementById('chk-city').addEventListener('change', (e) => {
                const cityId = e.target.value;
                if (cityId) {
                    this.loadShippingRates(cityId);
                }
            });
        } catch (e) {
            showToast('Gagal memuat data lokasi', 'error');
        }
    },

    async loadShippingRates(cityId) {
        const container = document.getElementById('shipping-options-container');
        container.innerHTML = '<div class="text-center"><span class="text-muted">Menghitung ongkir dari gudang terdekat...</span></div>';
        
        // Calculate total weight
        const totalWeight = Cart.items.reduce((sum, item) => sum + ((item.weight_grams || 2500) * item.quantity), 0);

        try {
            const res = await API.get('/shipping/rates', { destination: cityId, weight: totalWeight });
            const rates = res.data.rates;
            
            if (rates.length === 0) {
                container.innerHTML = '<p class="text-error">Tidak ada layanan kurir tersedia untuk lokasi ini.</p>';
                return;
            }

            // Render radio buttons for rates
            container.innerHTML = rates.map((r, i) => `
                <label style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 8px; cursor: pointer;" class="shipping-option">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="shipping_rate" value="${i}" ${i === 0 ? 'checked' : ''} 
                               data-cost="${r.cost}" 
                               data-courier="${r.courier_code}" 
                               data-service="${r.service}">
                        <div>
                            <div style="font-weight: 600; font-size: 0.875rem;">${r.courier_name} - ${r.service}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Estimasi: ${r.etd} hari</div>
                        </div>
                    </div>
                    <div style="font-weight: 600; color: var(--primary-700);">${formatRupiah(r.cost)}</div>
                </label>
            `).join('');

            // Bind change event to update summary
            const updateSummary = () => {
                const selected = document.querySelector('input[name="shipping_rate"]:checked');
                if (selected) {
                    const cost = parseInt(selected.dataset.cost);
                    document.getElementById('summary-shipping').textContent = formatRupiah(cost);
                    document.getElementById('summary-total').textContent = formatRupiah(Cart.subtotal + cost);
                }
            };
            
            document.querySelectorAll('input[name="shipping_rate"]').forEach(el => {
                el.addEventListener('change', updateSummary);
            });
            
            updateSummary(); // trigger initial

        } catch (e) {
            container.innerHTML = '<p class="text-error">Gagal menghitung ongkir. Pastikan kota tujuan valid.</p>';
        }
    },

    bindEvents() {
        const btnSubmit = document.getElementById('btn-process-checkout');
        
        btnSubmit.addEventListener('click', async () => {
            // Validation
            const name = document.getElementById('chk-name').value;
            const email = document.getElementById('chk-email').value;
            const phone = document.getElementById('chk-phone').value;
            const address = document.getElementById('chk-address').value;
            const provSel = document.getElementById('chk-province');
            const citySel = document.getElementById('chk-city');
            const postal = document.getElementById('chk-postal').value;
            const selectedRate = document.querySelector('input[name="shipping_rate"]:checked');

            if (!name || !email || !phone || !address || !citySel.value || !selectedRate) {
                showToast('Mohon lengkapi semua data pengiriman dan pilih kurir', 'warning');
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Memproses...';

            const payload = {
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                shipping_address: address,
                shipping_city_id: citySel.value,
                shipping_city_name: citySel.options[citySel.selectedIndex].text,
                shipping_province: provSel.options[provSel.selectedIndex].text,
                shipping_postal_code: postal,
                courier_code: selectedRate.dataset.courier,
                courier_service: selectedRate.dataset.service,
                shipping_cost: parseInt(selectedRate.dataset.cost),
                payment_gateway: document.querySelector('input[name="payment_method"]:checked').value
            };

            try {
                const res = await API.post('/checkout/process', payload);
                
                // Clear UI cart
                Cart.updateState({items:[], subtotal:0, count:0});

                if (res.data.snap_token) {
                    // Trigger Midtrans Snap
                    this.payWithSnap(res.data.snap_token, res.data.snap_js_url, res.data.client_key, res.data.order_number);
                } else {
                    router.navigate(`/order/success?order_id=${res.data.order_number}`);
                }

            } catch (e) {
                showToast(e.message || 'Gagal memproses pesanan', 'error');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Bayar Sekarang';
            }
        });
    },

    payWithSnap(token, scriptUrl, clientKey, orderNumber) {
        // Dynamically load snap.js if not loaded
        if (typeof snap === 'undefined') {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.setAttribute('data-client-key', clientKey);
            document.head.appendChild(script);
            
            script.onload = () => {
                this.triggerSnap(token, orderNumber);
            };
        } else {
            this.triggerSnap(token, orderNumber);
        }
    },

    triggerSnap(token, orderNumber) {
        snap.pay(token, {
            onSuccess: function(result){
                router.navigate(`/order/success?order_id=${orderNumber}`);
            },
            onPending: function(result){
                router.navigate(`/order/success?order_id=${orderNumber}`);
            },
            onError: function(result){
                showToast('Pembayaran gagal atau dibatalkan', 'error');
                router.navigate(`/order-tracking?id=${orderNumber}`);
            },
            onClose: function(){
                router.navigate(`/order-tracking?id=${orderNumber}`);
            }
        });
    }
};

router.route('/checkout', CheckoutPage.render.bind(CheckoutPage));
