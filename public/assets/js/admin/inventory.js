/**
 * Admin Inventory Page
 */
window.AdminInventory = {
    async render() {
        const app = document.getElementById('admin-app');
        
        app.innerHTML = `
            <div class="page-header">
                <h1>Manajemen Inventaris</h1>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onclick="AdminInventory.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select id="filter-warehouse" class="form-control" onchange="AdminInventory.loadData()">
                        <option value="">Semua Gudang</option>
                        <!-- Options will be populated dynamically -->
                    </select>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Produk</th>
                                <th>Varian</th>
                                <th>Gudang</th>
                                <th>Total Stok</th>
                                <th>Stok Tersedia</th>
                                <th>Di-reserve</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <tr><td colspan="7" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await this.loadWarehouses();
        await this.loadData();
    },

    async loadWarehouses() {
        try {
            const res = await API.get('/admin/warehouses');
            if (res.success && res.data) {
                const select = document.getElementById('filter-warehouse');
                const html = res.data.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
                select.innerHTML = '<option value="">Semua Gudang</option>' + html;
            }
        } catch (e) {
            console.error('Failed to load warehouses', e);
        }
    },

    async loadData() {
        const tbody = document.getElementById('inventory-table-body');
        const warehouseId = document.getElementById('filter-warehouse')?.value || '';
        
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const url = warehouseId ? `/admin/inventory?warehouse_id=${warehouseId}` : '/admin/inventory';
            const res = await API.get(url);
            
            if (!res.success) throw new Error(res.message);
            
            const items = res.data;
            
            if (!items || items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><span>📦</span>Belum ada data stok.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.map(item => `
                <tr>
                    <td style="font-family: monospace; font-weight: 600;">${item.sku || '-'}</td>
                    <td style="font-weight: 500;">${item.product_name}</td>
                    <td>${item.variant_name || '<span style="color: var(--text-muted);">-</span>'}</td>
                    <td><span class="badge badge-default">${item.warehouse_name || 'Gudang Utama'}</span></td>
                    <td style="font-weight: 600;">${item.quantity}</td>
                    <td>
                        ${item.available_stock <= 5 
                            ? `<span class="badge badge-danger">${item.available_stock}</span>` 
                            : `<span style="color: var(--success); font-weight: 600;">${item.available_stock}</span>`}
                    </td>
                    <td><span style="color: var(--text-muted);">${item.reserved_quantity || 0}</span></td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    }
};
