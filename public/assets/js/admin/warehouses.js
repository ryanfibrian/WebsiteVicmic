/**
 * Admin Warehouses Page
 */
window.AdminWarehouses = {
    async render() {
        const app = document.getElementById('admin-app');
        
        app.innerHTML = `
            <div class="page-header">
                <h1>Gudang (Warehouses)</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="AdminWarehouses.openModal()">
                        + Tambah Gudang
                    </button>
                    <button class="btn btn-outline" onclick="AdminWarehouses.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Gudang</th>
                                <th>Kota/Provinsi</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="wh-table-body">
                            <tr><td colspan="5" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Warehouse Modal -->
            <div id="wh-modal" class="modal-overlay" style="display: none;">
                <div class="modal">
                    <div class="modal-header">
                        <h2 id="wh-modal-title">Tambah Gudang Baru</h2>
                        <button class="modal-close" onclick="AdminWarehouses.closeModal()">×</button>
                    </div>
                    <form id="wh-form" onsubmit="event.preventDefault(); AdminWarehouses.saveWarehouse();">
                        <div class="modal-body">
                            <input type="hidden" id="wh-id">
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Kode Gudang *</label>
                                    <input type="text" id="wh-code" class="form-control" required placeholder="Ex: WH-JKT-1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Nama Gudang *</label>
                                    <input type="text" id="wh-name" class="form-control" required placeholder="Gudang Jakarta Pusat">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Alamat Lengkap *</label>
                                <textarea id="wh-address" class="form-control" required></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">ID Kota (RajaOngkir) *</label>
                                    <input type="number" id="wh-city-id" class="form-control" required value="153">
                                    <div class="form-hint">153 = Jakarta Selatan</div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">ID Kecamatan *</label>
                                    <input type="number" id="wh-district-id" class="form-control" required value="2149">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="wh-status" class="form-control">
                                    <option value="1">Aktif</option>
                                    <option value="0">Tidak Aktif</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="wh-error" style="color: var(--danger); display: none; padding: 10px; background: var(--danger-bg); border-radius: 6px;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="AdminWarehouses.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="wh-submit-btn">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('wh-table-body');
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const res = await API.get('/admin/warehouses?active_only=false');
            if (!res.success) throw new Error(res.message);
            
            const items = res.data;
            if (!items || items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><span>🏭</span>Belum ada data gudang.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.map(w => `
                <tr>
                    <td style="font-weight: 600;">${w.code}</td>
                    <td style="font-weight: 500;">${w.name}</td>
                    <td>${w.city_name || '-'} / ${w.province_name || '-'}</td>
                    <td>
                        ${w.is_active ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Tidak Aktif</span>'}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick='AdminWarehouses.openModal(${JSON.stringify(w).replace(/'/g, "&#39;")})'>Edit</button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openModal(warehouse = null) {
        const errEl = document.getElementById('wh-error');
        errEl.style.display = 'none';
        errEl.textContent = '';
        
        if (warehouse) {
            document.getElementById('wh-modal-title').textContent = 'Edit Gudang';
            document.getElementById('wh-id').value = warehouse.id;
            document.getElementById('wh-code').value = warehouse.code;
            document.getElementById('wh-name').value = warehouse.name;
            document.getElementById('wh-address').value = warehouse.address;
            document.getElementById('wh-city-id').value = warehouse.city_id;
            document.getElementById('wh-district-id').value = warehouse.district_id;
            document.getElementById('wh-status').value = warehouse.is_active ? "1" : "0";
            document.getElementById('wh-code').readOnly = true;
        } else {
            document.getElementById('wh-modal-title').textContent = 'Tambah Gudang Baru';
            document.getElementById('wh-form').reset();
            document.getElementById('wh-id').value = '';
            document.getElementById('wh-code').readOnly = false;
        }
        
        document.getElementById('wh-modal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('wh-modal').style.display = 'none';
    },

    async saveWarehouse() {
        const id = document.getElementById('wh-id').value;
        const submitBtn = document.getElementById('wh-submit-btn');
        const errEl = document.getElementById('wh-error');
        
        const data = {
            code: document.getElementById('wh-code').value,
            name: document.getElementById('wh-name').value,
            address: document.getElementById('wh-address').value,
            city_id: document.getElementById('wh-city-id').value,
            district_id: document.getElementById('wh-district-id').value,
            is_active: document.getElementById('wh-status').value === "1" ? 1 : 0
        };
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            let res;
            if (id) {
                delete data.code; // code is readonly on update
                res = await API.put(`/admin/warehouses/${id}`, data);
            } else {
                res = await API.post(`/admin/warehouses`, data);
            }
            
            if (res.success) {
                this.closeModal();
                this.loadData();
            } else {
                throw new Error(res.message || 'Gagal menyimpan data');
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
            submitBtn.textContent = 'Simpan';
        }
    }
};
