/**
 * Admin Serial Numbers Page
 */
const AdminSerialNumbers = {
    async render() {
        const app = document.getElementById('admin-app');
        
        app.innerHTML = `
            <div class="page-header">
                <h1>Serial Numbers</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="AdminSerialNumbers.openModal()">
                        + Tambah SN
                    </button>
                    <button class="btn btn-outline" onclick="AdminSerialNumbers.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <input type="text" id="filter-q" class="form-control" placeholder="Cari Serial Number..." onkeyup="if(event.key==='Enter') AdminSerialNumbers.loadData()">
                    <select id="filter-status" class="form-control" onchange="AdminSerialNumbers.loadData()">
                        <option value="">Semua Status</option>
                        <option value="available">Tersedia</option>
                        <option value="reserved">Di-reserve</option>
                        <option value="sold">Terjual</option>
                        <option value="rma">RMA / Rusak</option>
                    </select>
                    <button class="btn btn-outline" onclick="AdminSerialNumbers.loadData()">Cari</button>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Serial Number</th>
                                <th>Produk</th>
                                <th>Gudang</th>
                                <th>Status</th>
                                <th>Terdaftar Pada</th>
                            </tr>
                        </thead>
                        <tbody id="sn-table-body">
                            <tr><td colspan="5" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add SN Modal -->
            <div id="sn-modal" class="modal-overlay" style="display: none;">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Daftarkan Serial Number Baru</h2>
                        <button class="modal-close" onclick="AdminSerialNumbers.closeModal()">×</button>
                    </div>
                    <form id="sn-form" onsubmit="event.preventDefault(); AdminSerialNumbers.saveSN();">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Serial Numbers (Pisahkan dengan koma atau enter)</label>
                                <textarea id="sn-input" class="form-control" required placeholder="SN001, SN002, SN003..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">ID Produk *</label>
                                    <input type="number" id="sn-product-id" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">ID Gudang *</label>
                                    <input type="number" id="sn-warehouse-id" class="form-control" required value="1">
                                </div>
                            </div>
                            <div class="form-group" id="sn-error" style="color: var(--danger); display: none; padding: 10px; background: var(--danger-bg); border-radius: 6px;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="AdminSerialNumbers.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="sn-submit-btn">Simpan Data</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('sn-table-body');
        const q = document.getElementById('filter-q')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';
        
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            let url = '/admin/serial-numbers?';
            if (q) url += `q=${encodeURIComponent(q)}&`;
            if (status) url += `status=${status}&`;
            
            const res = await API.get(url);
            if (!res.success) throw new Error(res.message);
            
            const items = res.data;
            
            const formatStatus = (s) => {
                const map = {
                    'available': '<span class="badge badge-success">Tersedia</span>',
                    'reserved': '<span class="badge badge-warning">Di-reserve</span>',
                    'sold': '<span class="badge badge-info">Terjual</span>',
                    'rma': '<span class="badge badge-danger">RMA</span>'
                };
                return map[s] || `<span class="badge badge-default">${s}</span>`;
            };

            if (!items || items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><span>🏷️</span>Belum ada data Serial Number.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.map(item => `
                <tr>
                    <td style="font-family: monospace; font-weight: 600;">${item.serial_number}</td>
                    <td>
                        <div style="font-weight: 500;">${item.product_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${item.sku}</div>
                    </td>
                    <td><span class="badge badge-default">${item.warehouse_name || 'Gudang Utama'}</span></td>
                    <td>${formatStatus(item.status)}</td>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">
                        ${new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openModal() {
        const errEl = document.getElementById('sn-error');
        errEl.style.display = 'none';
        document.getElementById('sn-form').reset();
        document.getElementById('sn-modal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('sn-modal').style.display = 'none';
    },

    async saveSN() {
        const submitBtn = document.getElementById('sn-submit-btn');
        const errEl = document.getElementById('sn-error');
        
        const rawSN = document.getElementById('sn-input').value;
        const productId = document.getElementById('sn-product-id').value;
        const warehouseId = document.getElementById('sn-warehouse-id').value;
        
        // Parse comma or newline separated SNs
        const snList = rawSN.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (snList.length === 0) {
            errEl.textContent = 'Masukkan setidaknya satu Serial Number';
            errEl.style.display = 'block';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            const res = await API.post(`/admin/serial-numbers/bulk`, {
                serial_numbers: snList,
                product_id: parseInt(productId),
                warehouse_id: parseInt(warehouseId)
            });
            
            if (res.success) {
                alert(`Berhasil mendaftarkan ${res.data.count} Serial Number`);
                this.closeModal();
                this.loadData();
            } else {
                throw new Error(res.message || 'Gagal mendaftarkan SN');
            }
        } catch (e) {
            let msg = e.message;
            if (e.errors && typeof e.errors === 'object') {
                msg = Object.values(e.errors).flat().join('<br>');
            }
            errEl.innerHTML = msg;
            errEl.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Data';
        }
    }
};
