/**
 * Admin Orders Page
 */
window.AdminOrders = {
    async render() {
        const app = document.getElementById('admin-app');
        
        app.innerHTML = `
            <div class="page-header">
                <h1>Daftar Pesanan</h1>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onclick="AdminOrders.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select id="filter-status" class="form-control" onchange="AdminOrders.loadData()">
                        <option value="">Semua Status</option>
                        <option value="pending_payment">Menunggu Pembayaran</option>
                        <option value="paid">Dibayar</option>
                        <option value="processing_packing">Sedang Dikemas</option>
                        <option value="shipped">Dikirim</option>
                        <option value="completed">Selesai</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Tanggal</th>
                                <th>Pelanggan</th>
                                <th>Total Pembayaran</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body">
                            <tr><td colspan="6" class="table-empty">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Status Update Modal -->
            <div id="status-modal" class="modal-overlay" style="display: none;">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Update Status Pesanan</h2>
                        <button class="modal-close" onclick="AdminOrders.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="modal-order-id">
                        <div class="form-group">
                            <label class="form-label">Status Baru</label>
                            <select id="modal-status-select" class="form-control">
                                <option value="pending_payment">Menunggu Pembayaran</option>
                                <option value="paid">Dibayar</option>
                                <option value="processing_packing">Sedang Dikemas</option>
                                <option value="shipped">Dikirim</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AdminOrders.closeModal()">Batal</button>
                        <button class="btn btn-primary" onclick="AdminOrders.saveStatus()">Simpan Perubahan</button>
                    </div>
                </div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('orders-table-body');
        const filterStatus = document.getElementById('filter-status')?.value || '';
        
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const url = filterStatus ? `/admin/orders?status=${filterStatus}` : '/admin/orders';
            const res = await API.get(url);
            
            if (!res.success) throw new Error(res.message);
            
            const orders = res.data;
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

            if (!orders || orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><span>📦</span>Belum ada pesanan ditemukan.</td></tr>`;
                return;
            }

            tbody.innerHTML = orders.map(o => `
                <tr>
                    <td style="font-weight: 600;">${o.order_number}</td>
                    <td>${new Date(o.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</td>
                    <td>${o.customer_name || 'Tamu'}</td>
                    <td style="font-weight: 500;">${formatMoney(o.total_amount)}</td>
                    <td>${formatStatus(o.order_status)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="AdminOrders.openModal(${o.id}, '${o.order_status}')">
                            Edit Status
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openModal(id, currentStatus) {
        document.getElementById('modal-order-id').value = id;
        document.getElementById('modal-status-select').value = currentStatus;
        document.getElementById('status-modal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('status-modal').style.display = 'none';
    },

    async saveStatus() {
        const id = document.getElementById('modal-order-id').value;
        const status = document.getElementById('modal-status-select').value;
        
        try {
            const res = await API.put(`/admin/orders/${id}/status`, { status });
            if (res.success) {
                alert('Status berhasil diupdate');
                this.closeModal();
                this.loadData();
            } else {
                alert(res.message || 'Gagal update status');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }
};
