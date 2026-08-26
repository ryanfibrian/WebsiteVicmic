/**
 * Order Tracking Page Component
 */
const OrderTrackingPage = {
    render(params) {
        const app = document.getElementById('app');
        const queryId = params.query.id || '';

        app.innerHTML = `
            <div class="container" style="padding-top: 40px; max-width: 600px;">
                <div class="text-center mb-3">
                    <h1 style="font-family: var(--font-heading);">Lacak Pesanan</h1>
                    <p class="text-muted mt-1">Masukkan nomor pesanan (Order ID) untuk melihat status</p>
                </div>
                
                <div class="card" style="padding: 24px;">
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="track-id" class="form-input" placeholder="Contoh: VIC-20260826-A1B2C" value="${queryId}">
                        <button id="btn-track" class="btn btn-primary">Lacak</button>
                    </div>
                    <div id="track-result" style="margin-top: 24px;"></div>
                </div>
            </div>
        `;

        document.getElementById('btn-track').addEventListener('click', () => {
            const id = document.getElementById('track-id').value.trim();
            if (id) {
                // Update URL silently
                window.history.replaceState(null, '', `/order-tracking?id=${id}`);
                this.trackOrder(id);
            }
        });

        if (queryId) {
            this.trackOrder(queryId);
        }
    },

    async trackOrder(orderNumber) {
        const resDiv = document.getElementById('track-result');
        resDiv.innerHTML = '<div class="text-center text-muted">Mencari pesanan...</div>';
        
        try {
            const res = await API.get(`/order/track/${orderNumber}`);
            const order = res.data;

            let statusBadge = '';
            let statusDesc = '';
            
            switch(order.order_status) {
                case 'pending_payment': 
                    statusBadge = '<span class="badge" style="background:var(--warning);padding:4px 10px;border-radius:10px;font-size:0.75rem;">Menunggu Pembayaran</span>';
                    statusDesc = 'Segera lakukan pembayaran sebelum batas waktu habis.';
                    break;
                case 'paid': 
                case 'processing_packing':
                    statusBadge = '<span class="badge" style="background:var(--info);color:white;padding:4px 10px;border-radius:10px;font-size:0.75rem;">Diproses</span>';
                    statusDesc = 'Pesanan sedang disiapkan dan dipacking oleh tim kami.';
                    break;
                case 'shipped': 
                    statusBadge = '<span class="badge" style="background:var(--primary-600);color:white;padding:4px 10px;border-radius:10px;font-size:0.75rem;">Dikirim</span>';
                    statusDesc = `Pesanan sedang dalam perjalanan dengan kurir ${order.courier_name}.`;
                    break;
                case 'completed': 
                    statusBadge = '<span class="badge" style="background:var(--success);color:white;padding:4px 10px;border-radius:10px;font-size:0.75rem;">Selesai</span>';
                    statusDesc = 'Pesanan telah diterima.';
                    break;
                case 'cancelled': 
                    statusBadge = '<span class="badge" style="background:var(--error);color:white;padding:4px 10px;border-radius:10px;font-size:0.75rem;">Dibatalkan</span>';
                    statusDesc = 'Pesanan dibatalkan atau pembayaran kadaluarsa.';
                    break;
            }

            resDiv.innerHTML = `
                <div style="border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow: hidden;">
                    <div style="background: var(--bg-secondary); padding: 16px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${order.order_number}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(order.created_at).toLocaleString('id-ID')}</div>
                        </div>
                        ${statusBadge}
                    </div>
                    <div style="padding: 16px;">
                        <p style="font-size: 0.875rem; margin-bottom: 16px;">${statusDesc}</p>
                        
                        ${order.tracking_number ? `
                            <div style="background: var(--primary-50); padding: 12px; border-radius: var(--radius-sm); border: 1px dashed var(--primary-300); margin-bottom: 16px;">
                                <div style="font-size: 0.75rem; color: var(--primary-700); font-weight: 600;">Nomor Resi (${order.courier_name} ${order.courier_service}):</div>
                                <div style="font-family: monospace; font-size: 1.125rem; font-weight: 700; margin-top: 4px;">${order.tracking_number}</div>
                            </div>
                        ` : ''}

                        <h4 style="font-size: 0.875rem; margin-bottom: 8px;">Produk</h4>
                        ${order.items.map(item => `
                            <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; padding: 4px 0; border-bottom: 1px dashed var(--border-light);">
                                <span>${item.quantity}x ${item.product_name} ${item.variant_name ? `(${item.variant_name})` : ''}</span>
                                <span>${formatRupiah(item.total_price)}</span>
                            </div>
                        `).join('')}
                        
                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 600; margin-top: 12px;">
                            <span>Total Tagihan</span>
                            <span style="color: var(--primary-700);">${formatRupiah(order.total_amount)}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            resDiv.innerHTML = '<p class="text-error text-center">Pesanan tidak ditemukan. Periksa kembali Order ID Anda.</p>';
        }
    }
};

router.route('/order-tracking', OrderTrackingPage.render.bind(OrderTrackingPage));

/**
 * Success Page (After Checkout)
 */
const OrderSuccessPage = {
    render(params) {
        const app = document.getElementById('app');
        const orderId = params.query.order_id || '';

        app.innerHTML = `
            <div class="container text-center" style="padding-top: 100px; max-width: 500px;">
                <div style="font-size: 4rem; margin-bottom: 16px;">🎉</div>
                <h1 style="font-family: var(--font-heading); margin-bottom: 12px;">Terima Kasih!</h1>
                <p class="text-muted mb-3">Pesanan Anda berhasil dibuat dan sedang menunggu konfirmasi pembayaran.</p>
                
                ${orderId ? `
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 24px;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Nomor Pesanan Anda:</div>
                        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--primary-700);">${orderId}</div>
                        <p style="font-size: 0.75rem; margin-top: 8px;">Simpan nomor ini untuk melacak status pesanan Anda.</p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <a href="/products" data-link class="btn btn-secondary">Belanja Lagi</a>
                    <a href="/order-tracking?id=${orderId}" data-link class="btn btn-primary">Lacak Pesanan</a>
                </div>
            </div>
        `;
    }
};

router.route('/order/success', OrderSuccessPage.render);
