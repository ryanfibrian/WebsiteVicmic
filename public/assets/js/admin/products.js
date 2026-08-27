/**
 * Admin Products Page
 */
const AdminProducts = {
    async render() {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div class="page-header">
                <h1>Daftar Produk</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="AdminProducts.openModal()">
                        + Tambah Produk
                    </button>
                    <button class="btn btn-outline" onclick="AdminProducts.loadData()">
                        🔄 Segarkan
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="filter-bar">
                    <input type="text" id="filter-q" class="form-control" placeholder="Cari SKU atau nama..." onkeyup="if(event.key==='Enter') AdminProducts.loadData()">
                    <button class="btn btn-outline" onclick="AdminProducts.loadData()">Cari</button>
                </div>
                
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Nama Produk</th>
                                <th>Kategori</th>
                                <th>Harga Dasar</th>
                                <th>Stok Total</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="products-table-body">
                            <tr><td colspan="7" class="table-empty"><div class="loading-spinner"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Product Form Modal -->
            <div id="product-modal" class="modal-overlay" style="display: none;">
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 id="modal-title">Tambah Produk Baru</h2>
                        <button class="modal-close" onclick="AdminProducts.closeModal()">×</button>
                    </div>
                    <form id="product-form" onsubmit="event.preventDefault(); AdminProducts.saveProduct();">
                        <div class="modal-body">
                            <input type="hidden" id="prod-id">
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">SKU *</label>
                                    <input type="text" id="prod-sku" class="form-control" required placeholder="Ex: LPT-001">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Harga Dasar * (Rp)</label>
                                    <input type="number" id="prod-price" class="form-control" required min="0">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Nama Produk *</label>
                                <input type="text" id="prod-name" class="form-control" required placeholder="Nama lengkap produk">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Brand</label>
                                    <input type="text" id="prod-brand" class="form-control" placeholder="Ex: Lenovo, Asus">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Kategori ID</label>
                                    <input type="number" id="prod-cat" class="form-control" placeholder="ID Kategori (opsional)">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="prod-status" class="form-control">
                                    <option value="1">Diterbitkan (Published)</option>
                                    <option value="0">Disembunyikan (Draft)</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="prod-error" style="color: var(--danger); display: none; padding: 10px; background: var(--danger-bg); border-radius: 6px;"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="AdminProducts.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="prod-submit-btn">Simpan Produk</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('products-table-body');
        const q = document.getElementById('filter-q')?.value || '';
        
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="loading-spinner"></div></td></tr>`;
        
        try {
            const url = q ? `/admin/products?q=${encodeURIComponent(q)}` : '/admin/products';
            const res = await API.get(url);
            
            if (!res.success) throw new Error(res.message);
            
            const products = res.data;
            const formatMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
            
            if (!products || products.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><span>📦</span>Belum ada produk ditemukan.</td></tr>`;
                return;
            }

            tbody.innerHTML = products.map(p => `
                <tr>
                    <td style="font-family: monospace; font-weight: 600;">${p.sku}</td>
                    <td>
                        <div style="font-weight: 500;">${p.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${p.brand || '-'}</div>
                    </td>
                    <td>${p.category || '-'}</td>
                    <td style="font-weight: 500;">${formatMoney(p.base_price)}</td>
                    <td>
                        ${p.stock <= 5 ? `<span class="badge badge-danger">${p.stock}</span>` : `<span class="badge badge-default">${p.stock}</span>`}
                    </td>
                    <td>
                        ${p.is_published ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-warning">Draft</span>'}
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-sm btn-outline" onclick='AdminProducts.openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="AdminProducts.deleteProduct(${p.id})">Hapus</button>
                        </div>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openModal(product = null) {
        const errEl = document.getElementById('prod-error');
        errEl.style.display = 'none';
        errEl.textContent = '';
        
        if (product) {
            document.getElementById('modal-title').textContent = 'Edit Produk';
            document.getElementById('prod-id').value = product.id;
            document.getElementById('prod-sku').value = product.sku;
            document.getElementById('prod-name').value = product.name;
            document.getElementById('prod-price').value = product.base_price;
            document.getElementById('prod-brand').value = product.brand || '';
            document.getElementById('prod-cat').value = product.category_id || '';
            document.getElementById('prod-status').value = product.is_published ? "1" : "0";
            document.getElementById('prod-sku').readOnly = true; // SKU usually shouldn't change
        } else {
            document.getElementById('modal-title').textContent = 'Tambah Produk Baru';
            document.getElementById('product-form').reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('prod-sku').readOnly = false;
        }
        
        document.getElementById('product-modal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('product-modal').style.display = 'none';
    },

    async saveProduct() {
        const id = document.getElementById('prod-id').value;
        const submitBtn = document.getElementById('prod-submit-btn');
        const errEl = document.getElementById('prod-error');
        
        const data = {
            sku: document.getElementById('prod-sku').value,
            name: document.getElementById('prod-name').value,
            base_price: document.getElementById('prod-price').value,
            brand: document.getElementById('prod-brand').value,
            is_published: document.getElementById('prod-status').value === "1" ? 1 : 0
        };
        
        const catId = document.getElementById('prod-cat').value;
        if (catId) data.category_id = catId;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            let res;
            if (id) {
                // Delete SKU from data since it's readonly on update to prevent unique constraint errors if unchanged
                delete data.sku;
                res = await API.put(`/admin/products/${id}`, data);
            } else {
                res = await API.post(`/admin/products`, data);
            }
            
            if (res.success) {
                this.closeModal();
                this.loadData();
            } else {
                throw new Error(res.message || 'Gagal menyimpan produk');
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
            submitBtn.textContent = 'Simpan Produk';
        }
    },
    
    async deleteProduct(id) {
        if (!confirm('Anda yakin ingin menghapus produk ini? Semua data terkait (termasuk stok dan nomor seri) mungkin akan bermasalah jika dihapus.')) return;
        
        try {
            const res = await API.delete(`/admin/products/${id}`);
            if (res.success) {
                this.loadData();
            } else {
                alert(res.message || 'Gagal menghapus produk');
            }
        } catch (e) {
            alert('Error: ' + e.message + '\n\nCatatan: Anda mungkin memerlukan role super_admin untuk aksi ini.');
        }
    }
};
