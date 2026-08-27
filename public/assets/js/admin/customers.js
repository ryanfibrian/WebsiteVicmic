/**
 * Admin Customers Management
 */
window.AdminCustomers = {
    async render() {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div class="page-header">
                <h1>Daftar Pelanggan</h1>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onclick="AdminCustomers.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Pelanggan</th>
                                <th>Email</th>
                                <th>No. HP</th>
                                <th>Terdaftar Sejak</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="customers-table-body">
                            <tr><td colspan="6" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Customer Detail Modal -->
            <div id="customer-modal" class="modal-overlay" style="display: none;">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>Detail Pelanggan</h2>
                        <button class="modal-close" onclick="AdminCustomers.closeModal()">×</button>
                    </div>
                    <form id="customer-form" onsubmit="event.preventDefault(); AdminCustomers.saveCustomer();">
                        <div class="modal-body">
                            <input type="hidden" id="cust-id">
                            
                            <div class="form-group">
                                <label class="form-label">Nama Lengkap</label>
                                <input type="text" id="cust-name" class="form-control" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" id="cust-email" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">No. HP</label>
                                    <input type="text" id="cust-phone" class="form-control">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="cust-status" class="form-control">
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif (Banned)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Reset Password</label>
                                <input type="password" id="cust-password" class="form-control" placeholder="Biarkan kosong jika tidak diubah">
                            </div>
                            
                            <div id="cust-addresses" style="margin-top: 20px;">
                                <h3 style="font-size: 1rem; margin-bottom: 10px; border-bottom: 1px solid var(--border-dark); padding-bottom: 5px;">Alamat Tersimpan</h3>
                                <div id="addresses-list" style="max-height: 200px; overflow-y: auto;">
                                    <div class="loading-spinner"></div>
                                </div>
                            </div>

                            <div class="form-group" id="cust-error" style="color: var(--danger); display: none; padding: 10px; background: var(--danger-bg); border-radius: 6px; margin-top: 15px;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="AdminCustomers.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="cust-submit-btn">Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('customers-table-body');
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const res = await API.get('/admin/customers');
            if (!res.success) throw new Error(res.message);
            
            const customers = res.data;
            if (!customers || customers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Belum ada pelanggan terdaftar.</td></tr>`;
                return;
            }

            tbody.innerHTML = customers.map(c => `
                <tr>
                    <td style="font-weight: 500;">${c.name}</td>
                    <td>${c.email}</td>
                    <td>${c.phone || '-'}</td>
                    <td>${new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                    <td>${c.is_active ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>'}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-sm btn-outline" onclick='AdminCustomers.openModal(${c.id})'>Detail</button>
                            <button class="btn btn-sm btn-danger" onclick="AdminCustomers.deleteCustomer(${c.id})">Hapus</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    async openModal(id) {
        document.getElementById('customer-modal').style.display = 'flex';
        document.getElementById('cust-error').style.display = 'none';
        
        try {
            const res = await API.get(`/admin/customers/${id}`);
            if(!res.success) throw new Error(res.message);
            
            const c = res.data;
            document.getElementById('cust-id').value = c.id;
            document.getElementById('cust-name').value = c.name;
            document.getElementById('cust-email').value = c.email;
            document.getElementById('cust-phone').value = c.phone || '';
            document.getElementById('cust-status').value = c.is_active ? "1" : "0";
            
            const addrList = document.getElementById('addresses-list');
            if(c.addresses && c.addresses.length > 0) {
                addrList.innerHTML = c.addresses.map(a => `
                    <div style="padding: 10px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 10px;">
                        <div style="font-weight: 600; font-size: 0.9rem;">${a.label} ${a.is_default ? '<span class="badge badge-primary" style="font-size:0.6rem;">Utama</span>' : ''}</div>
                        <div style="font-size: 0.8rem; margin-top: 5px;">
                            ${a.recipient_name} (${a.phone})<br>
                            ${a.address}<br>
                            ${a.city_name}, ${a.province_name} ${a.postal_code || ''}
                        </div>
                    </div>
                `).join('');
            } else {
                addrList.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Belum ada alamat tersimpan.</div>';
            }
            
        } catch (e) {
            document.getElementById('cust-error').innerHTML = e.message;
            document.getElementById('cust-error').style.display = 'block';
        }
    },

    closeModal() {
        document.getElementById('customer-modal').style.display = 'none';
        document.getElementById('customer-form').reset();
    },

    async saveCustomer() {
        const id = document.getElementById('cust-id').value;
        const submitBtn = document.getElementById('cust-submit-btn');
        const errEl = document.getElementById('cust-error');
        
        const data = {
            name: document.getElementById('cust-name').value,
            email: document.getElementById('cust-email').value,
            phone: document.getElementById('cust-phone').value,
            is_active: document.getElementById('cust-status').value === "1" ? 1 : 0
        };
        
        const pwd = document.getElementById('cust-password').value;
        if (pwd) data.password = pwd;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            const res = await API.put(`/admin/customers/${id}`, data);
            if (res.success) {
                this.closeModal();
                this.loadData();
            } else {
                throw new Error(res.message || 'Gagal menyimpan');
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
            submitBtn.textContent = 'Simpan Perubahan';
        }
    },
    
    async deleteCustomer(id) {
        if (!confirm('Anda yakin ingin menghapus pelanggan ini? Seluruh data alamat juga akan ikut terhapus.')) return;
        try {
            const res = await API.delete(`/admin/customers/${id}`);
            if (res.success) {
                this.loadData();
            } else {
                alert(res.message || 'Gagal menghapus');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }
};
