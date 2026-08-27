/**
 * Admin Dashboard Page
 */
const AdminDashboard = {
    async render() {
        const app = document.getElementById('admin-app');
        
        app.innerHTML = `
            <div class="page-header">
                <h1>Dashboard Utama</h1>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onclick="AdminDashboard.loadData()">
                        🔄 Segarkan Data
                    </button>
                </div>
            </div>
            
            <div id="dashboard-content">
                <div class="loading-spinner"></div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        try {
            const res = await API.get('/admin/dashboard/stats');
            
            if (!res.success) throw new Error("Gagal mengambil data");
            
            const d = res.data;
            
            const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
            
            const formatStatus = (status) => {
                const map = {
                    'pending_payment': '<span class="badge badge-warning">Menunggu Pembayaran</span>',
                    'paid': '<span class="badge badge-info">Dibayar</span>',
                    'processing_packing': '<span class="badge badge-default">Sedang Dikemas</span>',
                    'shipped': '<span class="badge badge-success">Dikirim</span>',
                    'completed': '<span class="badge badge-success">Selesai</span>',
                    'cancelled': '<span class="badge badge-danger">Dibatalkan</span>'
                };
                return map[status] || `<span class="badge badge-default">${status}</span>`;
            };

            content.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-icon green">💰</div>
                        <div class="stat-info">
                            <h3>Pendapatan Bulan Ini</h3>
                            <div class="value">${formatMoney(d.month.revenue)}</div>
                            <div class="sub">Hari ini: ${formatMoney(d.today.revenue)}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon blue">📦</div>
                        <div class="stat-info">
                            <h3>Pesanan Baru (Bulan)</h3>
                            <div class="value">${d.month.orders} Pesanan</div>
                            <div class="sub">Total Keseluruhan: ${d.overview.total_orders}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon ${d.overview.low_stock_count > 0 ? 'red' : 'green'}">⚠️</div>
                        <div class="stat-info">
                            <h3>Peringatan Stok</h3>
                            <div class="value ${d.overview.low_stock_count > 0 ? 'text-danger' : ''}">${d.overview.low_stock_count} Produk</div>
                            <div class="sub">Membutuhkan restock segera</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon yellow">⏳</div>
                        <div class="stat-info">
                            <h3>Tindakan Tertunda</h3>
                            <div class="value">${d.pending_actions.pending_payments + d.pending_actions.pending_packing + d.pending_actions.pending_shipment}</div>
                            <div class="sub">${d.pending_actions.pending_packing} butuh packing, ${d.pending_actions.pending_shipment} butuh kirim</div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                    <div class="card" style="margin-bottom: 0;">
                        <div class="card-header">
                            <h2>Pesanan Terbaru</h2>
                            <button class="btn btn-sm btn-outline" onclick="router.navigate('/admin/orders')">Lihat Semua</button>
                        </div>
                        <div class="table-wrapper">
                            ${d.recent_orders && d.recent_orders.length > 0 ? `
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Tanggal</th>
                                        <th>Pelanggan</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${d.recent_orders.map(o => `
                                    <tr>
                                        <td style="font-weight: 600;">${o.order_number}</td>
                                        <td>${new Date(o.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</td>
                                        <td>${o.customer_name || 'Tamu'}</td>
                                        <td style="font-weight: 500;">${formatMoney(o.total_amount)}</td>
                                        <td>${formatStatus(o.order_status)}</td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ` : `<div class="empty-state"><p>Belum ada pesanan terbaru.</p></div>`}
                        </div>
                    </div>
                    
                    <div class="card" style="margin-bottom: 0;">
                        <div class="card-header">
                            <h2>Stok Menipis</h2>
                            <button class="btn btn-sm btn-outline" onclick="router.navigate('/admin/inventory')">Inventaris</button>
                        </div>
                        <div>
                            ${d.low_stock_items && d.low_stock_items.length > 0 ? `
                                <ul style="list-style: none;">
                                ${d.low_stock_items.map(item => `
                                    <li style="padding: 12px 0; border-bottom: 1px solid var(--border-dark); display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${item.sku}</div>
                                        </div>
                                        <div class="badge badge-danger">Sisa ${item.stock}</div>
                                    </li>
                                `).join('')}
                                </ul>
                            ` : `<div class="empty-state" style="padding: 30px;"><div class="empty-icon">👍</div><p>Semua stok produk aman.</p></div>`}
                        </div>
                    </div>
                </div>
            `;
            
        } catch (e) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Gagal Memuat Dashboard</h3>
                    <p>${e.message}</p>
                    <button class="btn btn-primary" onclick="AdminDashboard.loadData()">Coba Lagi</button>
                </div>
            `;
        }
    }
};
