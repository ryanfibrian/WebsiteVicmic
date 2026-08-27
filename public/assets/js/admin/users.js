/**
 * Admin Users Management
 */
window.AdminUsers = {
    async render() {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div class="page-header">
                <h1>Pengguna Sistem (Admin)</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="AdminUsers.openModal()">
                        + Tambah Admin
                    </button>
                    <button class="btn btn-outline" onclick="AdminUsers.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Lengkap</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr><td colspan="6" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- User Form Modal -->
            <div id="user-modal" class="modal-overlay" style="display: none;">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 id="modal-title">Tambah Admin</h2>
                        <button class="modal-close" onclick="AdminUsers.closeModal()">×</button>
                    </div>
                    <form id="user-form" onsubmit="event.preventDefault(); AdminUsers.saveUser();">
                        <div class="modal-body">
                            <input type="hidden" id="user-id">
                            
                            <div class="form-group">
                                <label class="form-label">Nama Lengkap *</label>
                                <input type="text" id="user-fullname" class="form-control" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Username *</label>
                                    <input type="text" id="user-username" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email *</label>
                                    <input type="email" id="user-email" class="form-control" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Role *</label>
                                <select id="user-role" class="form-control" required>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="warehouse_staff">Warehouse Staff</option>
                                    <option value="finance">Finance</option>
                                    <option value="customer_service">Customer Service</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Password <span id="pwd-hint"></span></label>
                                <input type="password" id="user-password" class="form-control" placeholder="Biarkan kosong jika tidak ingin mengubah">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="user-status" class="form-control">
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="user-error" style="color: var(--danger); display: none; padding: 10px; background: var(--danger-bg); border-radius: 6px;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="AdminUsers.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="user-submit-btn">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const res = await API.get('/admin/users');
            if (!res.success) throw new Error(res.message);
            
            const users = res.data;
            if (!users || users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Belum ada pengguna.</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td style="font-weight: 500;">${u.full_name}</td>
                    <td>@${u.username}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-info">${u.role.replace('_', ' ')}</span></td>
                    <td>${u.is_active ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>'}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-sm btn-outline" onclick='AdminUsers.openModal(${JSON.stringify(u).replace(/'/g, "&#39;")})'>Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="AdminUsers.deleteUser(${u.id})">Hapus</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openModal(user = null) {
        document.getElementById('user-error').style.display = 'none';
        const pwdInput = document.getElementById('user-password');
        
        if (user) {
            document.getElementById('modal-title').textContent = 'Edit Admin';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-fullname').value = user.full_name;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-status').value = user.is_active ? "1" : "0";
            
            pwdInput.required = false;
            document.getElementById('pwd-hint').textContent = '(Kosongkan jika tidak diubah)';
        } else {
            document.getElementById('modal-title').textContent = 'Tambah Admin';
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            
            pwdInput.required = true;
            document.getElementById('pwd-hint').textContent = '*';
        }
        
        document.getElementById('user-modal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('user-modal').style.display = 'none';
    },

    async saveUser() {
        const id = document.getElementById('user-id').value;
        const submitBtn = document.getElementById('user-submit-btn');
        const errEl = document.getElementById('user-error');
        
        const data = {
            full_name: document.getElementById('user-fullname').value,
            username: document.getElementById('user-username').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            is_active: document.getElementById('user-status').value === "1" ? 1 : 0
        };
        
        const pwd = document.getElementById('user-password').value;
        if (pwd) data.password = pwd;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            let res;
            if (id) {
                res = await API.put(`/admin/users/${id}`, data);
            } else {
                res = await API.post(`/admin/users`, data);
            }
            
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
            submitBtn.textContent = 'Simpan';
        }
    },
    
    async deleteUser(id) {
        if (!confirm('Anda yakin ingin menghapus akun ini?')) return;
        try {
            const res = await API.delete(`/admin/users/${id}`);
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
