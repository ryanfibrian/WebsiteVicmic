/**
 * Customer Profile Page
 */

window.PageProfile = {
    state: {
        activeTab: 'info',
        addresses: [],
        orders: [],
        orderFilter: 'all'
    },

    async render() {
        const app = document.getElementById('app');
        
        if (!window.currentUser) {
            router.navigate('/login');
            return;
        }

        const user = window.currentUser;

        app.innerHTML = `
            <style>
                .profile-page {
                    min-height: calc(100vh - 80px);
                    background: #f8fafc;
                    padding: 40px 20px;
                }
                .profile-container {
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    max-width: 900px;
                    margin: 0 auto;
                    overflow: hidden;
                }
                .profile-header {
                    background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
                    color: white;
                    padding: 40px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: white;
                    color: #16a34a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .profile-tabs {
                    display: flex;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                .profile-tab {
                    padding: 15px 30px;
                    cursor: pointer;
                    font-weight: 600;
                    color: #64748b;
                    border-bottom: 3px solid transparent;
                    transition: all 0.2s;
                }
                .profile-tab:hover {
                    color: #16a34a;
                }
                .profile-tab.active {
                    color: #16a34a;
                    border-bottom-color: #16a34a;
                    background: #fff;
                }
                .profile-content {
                    padding: 40px;
                    min-height: 400px;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #475569;
                }
                .form-control {
                    width: 100%;
                    padding: 12px 15px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 1rem;
                }
                .btn-logout {
                    padding: 12px 24px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                /* Address Card */
                .address-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    position: relative;
                }
                .address-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #16a34a;
                    color: white;
                    font-size: 0.75rem;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-weight: bold;
                }
                
                /* Order Card */
                .order-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .status-pending_payment { background: #fef08a; color: #854d0e; }
                .status-paid { background: #bbf7d0; color: #166534; }
                .status-processing_packing { background: #bfdbfe; color: #1e3a8a; }
                .status-shipped { background: #ddd6fe; color: #4c1d95; }
                .status-delivered { background: #86efac; color: #14532d; }
                .status-completed { background: #86efac; color: #14532d; }
                .status-cancelled { background: #fecaca; color: #991b1b; }
                
                .filter-btn {
                    padding: 6px 15px;
                    border: 1px solid #cbd5e1;
                    border-radius: 20px;
                    background: white;
                    cursor: pointer;
                    margin-right: 10px;
                    margin-bottom: 10px;
                }
                .filter-btn.active {
                    background: #16a34a;
                    color: white;
                    border-color: #16a34a;
                }

                @media (max-width: 600px) {
                    .profile-content { padding: 20px; }
                    .profile-tabs { overflow-x: auto; }
                    .profile-tab { padding: 12px 20px; white-space: nowrap; }
                }
            </style>
            
            <div class="profile-page animate-fade-up">
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.8rem;">${user.name}</h1>
                            <p style="margin: 5px 0 0; opacity: 0.9;">${user.email}</p>
                        </div>
                    </div>
                    
                    <div class="profile-tabs">
                        <div class="profile-tab ${this.state.activeTab === 'info' ? 'active' : ''}" onclick="PageProfile.switchTab('info')">Informasi Akun</div>
                        <div class="profile-tab ${this.state.activeTab === 'address' ? 'active' : ''}" onclick="PageProfile.switchTab('address')">Buku Alamat</div>
                        <div class="profile-tab ${this.state.activeTab === 'orders' ? 'active' : ''}" onclick="PageProfile.switchTab('orders')">Pesanan Saya</div>
                    </div>
                    
                    <div class="profile-content" id="tab-content">
                        <!-- Content injected here -->
                    </div>
                </div>
            </div>
        `;
        
        window.scrollTo(0,0);
        this.renderActiveTab();
    },
    
    switchTab(tab) {
        this.state.activeTab = tab;
        // Update tab classes
        document.querySelectorAll('.profile-tab').forEach(el => {
            if (el.textContent.toLowerCase().includes(tab === 'info' ? 'akun' : tab === 'address' ? 'alamat' : 'pesanan')) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
        this.renderActiveTab();
    },

    renderActiveTab() {
        const content = document.getElementById('tab-content');
        if (this.state.activeTab === 'info') {
            this.renderTabInfo(content);
        } else if (this.state.activeTab === 'address') {
            this.renderTabAddress(content);
        } else if (this.state.activeTab === 'orders') {
            this.renderTabOrders(content);
        }
    },

    renderTabInfo(container) {
        const user = window.currentUser;
        container.innerHTML = `
            <h2 style="margin-bottom: 25px;">Ubah Profil</h2>
            <form id="form-profile" onsubmit="PageProfile.updateProfile(event)">
                <div class="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" id="prof-name" class="form-control" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label>Nomor Handphone</label>
                    <input type="tel" id="prof-phone" class="form-control" value="${user.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email (Tidak dapat diubah)</label>
                    <input type="email" class="form-control" value="${user.email}" disabled style="background:#f1f5f9;">
                </div>
                
                <h3 style="margin: 30px 0 15px;">Ubah Password</h3>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 20px;">Biarkan kosong jika tidak ingin mengubah password.</p>
                <div class="form-group">
                    <label>Password Baru</label>
                    <input type="password" id="prof-pass" class="form-control" placeholder="Minimal 6 karakter">
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <button type="submit" class="btn btn-primary" id="btn-save-profile" style="padding: 12px 30px;">Simpan Perubahan</button>
                    <button type="button" onclick="PageProfile.logout()" class="btn-logout">Keluar Akun</button>
                </div>
            </form>
        `;
    },

    async updateProfile(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';

        try {
            const res = await API.put('/auth/profile', {
                name: document.getElementById('prof-name').value,
                phone: document.getElementById('prof-phone').value,
                password: document.getElementById('prof-pass').value
            });
            
            if (res.success) {
                alert('Profil berhasil diperbarui!');
                // Update local memory so it reflects across
                window.currentUser.name = document.getElementById('prof-name').value;
                window.currentUser.phone = document.getElementById('prof-phone').value;
                document.getElementById('prof-pass').value = '';
                // re-render header
                this.render(); 
            }
        } catch (err) {
            alert(err.message || 'Gagal menyimpan profil');
        } finally {
            if(btn) {
                btn.disabled = false;
                btn.textContent = oldText;
            }
        }
    },

    async renderTabAddress(container) {
        container.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Buku Alamat</h2>
                <button class="btn btn-primary" onclick="PageProfile.showAddressForm()">+ Tambah Alamat</button>
            </div>
            <div id="address-list">Loading...</div>
            <div id="address-form-container" style="display:none; margin-top: 20px; padding: 20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;"></div>
        `;

        try {
            const res = await API.get('/customer/addresses');
            this.state.addresses = res.data || [];
            this.drawAddressList();
        } catch (e) {
            document.getElementById('address-list').innerHTML = `<p style="color:red;">Gagal memuat alamat</p>`;
        }
    },

    drawAddressList() {
        const list = document.getElementById('address-list');
        if (!this.state.addresses.length) {
            list.innerHTML = `<p style="color:#64748b; text-align:center; padding: 40px 0;">Belum ada alamat tersimpan.</p>`;
            return;
        }

        list.innerHTML = this.state.addresses.map(a => `
            <div class="address-card">
                ${a.is_default ? `<span class="address-badge">Utama</span>` : ''}
                <h4 style="margin: 0 0 10px;">${a.label}</h4>
                <p style="margin: 0 0 5px; font-weight:600;">${a.recipient_name} - ${a.phone}</p>
                <p style="margin: 0; color:#475569; line-height:1.5;">${a.address}</p>
                <div style="margin-top: 15px; display:flex; gap: 10px;">
                    <button class="btn btn-outline btn-sm" onclick="PageProfile.showAddressForm(${a.id})">Edit</button>
                    <button class="btn btn-outline btn-sm" style="color:red; border-color:red;" onclick="PageProfile.deleteAddress(${a.id})">Hapus</button>
                </div>
            </div>
        `).join('');
    },

    showAddressForm(id = null) {
        const container = document.getElementById('address-form-container');
        let address = id ? this.state.addresses.find(a => a.id === id) : null;
        
        container.innerHTML = `
            <h3>${address ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
            <form onsubmit="PageProfile.saveAddress(event, ${id})">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label>Label Alamat (ex: Rumah)</label>
                        <input type="text" id="addr-label" class="form-control" value="${address ? address.label : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nama Penerima</label>
                        <input type="text" id="addr-name" class="form-control" value="${address ? address.recipient_name : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nomor HP</label>
                    <input type="tel" id="addr-phone" class="form-control" value="${address ? address.phone : ''}" required>
                </div>
                <div class="form-group">
                    <label>Alamat Lengkap</label>
                    <textarea id="addr-full" class="form-control" rows="3" required>${address ? address.address : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>ID Kota (Sementara dummy, diisi angka)</label>
                    <input type="number" id="addr-city" class="form-control" value="${address ? address.city_id : '1'}" required>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap: 10px; cursor:pointer;">
                        <input type="checkbox" id="addr-default" ${address && address.is_default ? 'checked' : ''}>
                        Jadikan Alamat Utama
                    </label>
                </div>
                <div style="display:flex; gap: 10px; margin-top:20px;">
                    <button type="submit" class="btn btn-primary">Simpan</button>
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('address-form-container').style.display='none'">Batal</button>
                </div>
            </form>
        `;
        container.style.display = 'block';
    },

    async saveAddress(e, id) {
        e.preventDefault();
        const data = {
            label: document.getElementById('addr-label').value,
            recipient_name: document.getElementById('addr-name').value,
            phone: document.getElementById('addr-phone').value,
            address: document.getElementById('addr-full').value,
            city_id: document.getElementById('addr-city').value,
            is_default: document.getElementById('addr-default').checked ? 1 : 0
        };

        try {
            if (id) {
                await API.put(`/customer/addresses/${id}`, data);
            } else {
                await API.post('/customer/addresses', data);
            }
            alert('Alamat tersimpan!');
            this.renderTabAddress(document.getElementById('tab-content')); // refresh
        } catch (err) {
            alert(err.message || 'Gagal menyimpan alamat');
        }
    },

    async deleteAddress(id) {
        if(!confirm('Hapus alamat ini?')) return;
        try {
            await API.delete(`/customer/addresses/${id}`);
            this.renderTabAddress(document.getElementById('tab-content'));
        } catch (err) {
            alert(err.message || 'Gagal menghapus');
        }
    },

    async renderTabOrders(container) {
        container.innerHTML = `
            <h2 style="margin-bottom: 20px;">Riwayat Pesanan</h2>
            <div style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
                <button class="filter-btn ${this.state.orderFilter === 'all' ? 'active' : ''}" onclick="PageProfile.filterOrders('all')">Semua</button>
                <button class="filter-btn ${this.state.orderFilter === 'diproses' ? 'active' : ''}" onclick="PageProfile.filterOrders('diproses')">Diproses</button>
                <button class="filter-btn ${this.state.orderFilter === 'dikirim' ? 'active' : ''}" onclick="PageProfile.filterOrders('dikirim')">Dikirim</button>
                <button class="filter-btn ${this.state.orderFilter === 'selesai' ? 'active' : ''}" onclick="PageProfile.filterOrders('selesai')">Selesai</button>
                <button class="filter-btn ${this.state.orderFilter === 'batal' ? 'active' : ''}" onclick="PageProfile.filterOrders('batal')">Batal</button>
            </div>
            <div id="orders-list">Loading...</div>
        `;

        try {
            const res = await API.get('/customer/orders', { status: this.state.orderFilter });
            this.state.orders = res.data || [];
            this.drawOrdersList();
        } catch (e) {
            document.getElementById('orders-list').innerHTML = `<p style="color:red;">Gagal memuat pesanan</p>`;
        }
    },

    filterOrders(status) {
        this.state.orderFilter = status;
        this.renderTabOrders(document.getElementById('tab-content'));
    },

    drawOrdersList() {
        const list = document.getElementById('orders-list');
        if (!this.state.orders.length) {
            list.innerHTML = `<div style="text-align:center; padding: 40px; background:#fff; border-radius:12px; border:1px dashed #cbd5e1;">
                <p style="color:#64748b;">Belum ada pesanan.</p>
                <a href="/products" data-link class="btn btn-primary mt-2">Mulai Belanja</a>
            </div>`;
            return;
        }

        const formatStatus = (s) => {
            const map = {
                'pending_payment': 'Menunggu Pembayaran',
                'paid': 'Dibayar',
                'processing_packing': 'Sedang Diproses',
                'shipped': 'Dikirim',
                'delivered': 'Terkirim',
                'completed': 'Selesai',
                'cancelled': 'Dibatalkan',
                'refunded': 'Di-refund'
            };
            return map[s] || s;
        };

        list.innerHTML = this.state.orders.map(o => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <strong>${o.order_number}</strong><br>
                        <span style="font-size:0.85rem; color:#64748b;">${new Date(o.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div>
                        <span class="status-badge status-${o.order_status}">${formatStatus(o.order_status)}</span>
                    </div>
                </div>
                <div>
                    ${o.items.map(i => `
                        <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size:0.95rem;">
                            <span>${i.quantity}x ${i.product_name}</span>
                            <span>${formatRupiah(i.unit_price)}</span>
                        </div>
                    `).join('')}
                    ${o.item_count > 2 ? `<div style="color:#16a34a; font-size:0.85rem;">+ ${o.item_count - 2} produk lainnya</div>` : ''}
                </div>
                <div style="border-top: 1px dashed #e2e8f0; margin-top:15px; padding-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-size:0.85rem; color:#64748b;">Total Belanja</span><br>
                        <strong>${formatRupiah(o.total_amount)}</strong>
                    </div>
                    ${o.tracking_number ? `
                        <div style="text-align:right;">
                            <span style="font-size:0.85rem; color:#64748b;">Resi: ${o.courier_name}</span><br>
                            <strong>${o.tracking_number}</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },
    
    async logout() {
        if(confirm('Apakah Anda yakin ingin keluar dari akun Anda?')) {
            const btn = document.querySelector('.btn-logout');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = 'Keluar...';
            }
            
            try {
                await API.post('/auth/logout');
                window.location.href = '/';
            } catch (e) {
                alert('Gagal logout: ' + (e.message || 'Silakan coba lagi.'));
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Keluar Akun';
                }
            }
        }
    }
};

// Register Route
router.route('/profile', PageProfile.render.bind(PageProfile));
