/**
 * Admin Products Page (Redesigned)
 */
window.AdminProducts = {
    isFormOpen: false,
    currentProduct: null,

    async render() {
        const app = document.getElementById('admin-app');
        
        if (this.isFormOpen) {
            this.renderForm(app);
            return;
        }

        app.innerHTML = `
            <div class="page-header">
                <h1>Daftar Produk</h1>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onclick="AdminProducts.openForm()">
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
                                <th>Foto & Nama</th>
                                <th>Kategori</th>
                                <th>Harga</th>
                                <th>Stok</th>
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
        `;
        
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('products-table-body');
        if(!tbody) return;
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
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; background: var(--bg-dark); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                📷
                            </div>
                            <div>
                                <div style="font-weight: 500;">${p.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${p.brand || '-'}</div>
                            </div>
                        </div>
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
                            <button class="btn btn-sm btn-outline" onclick='AdminProducts.openForm(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="AdminProducts.deleteProduct(${p.id})">Hapus</button>
                        </div>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">Gagal memuat data: ${e.message}</td></tr>`;
        }
    },

    openForm(product = null) {
        this.isFormOpen = true;
        this.currentProduct = product;
        this.render();
    },

    closeForm() {
        this.isFormOpen = false;
        this.currentProduct = null;
        this.render();
    },

    renderForm(app) {
        const p = this.currentProduct || {};
        
        app.innerHTML = `
            <style>
                .pf-container { display: grid; grid-template-columns: 1fr 250px; gap: 20px; align-items: start; }
                .pf-main { display: flex; flex-direction: column; gap: 20px; }
                .pf-sidebar { position: sticky; top: 20px; }
                .pf-nav { list-style: none; padding: 0; margin: 0; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-dark); overflow: hidden; }
                .pf-nav li { padding: 12px 20px; border-bottom: 1px solid var(--border-dark); font-weight: 500; cursor: pointer; transition: all 0.2s; }
                .pf-nav li:hover { background: var(--bg-dark); }
                .pf-nav li.active { border-left: 3px solid var(--primary); background: var(--bg-dark); }
                .pf-nav li:last-child { border-bottom: none; }
                .pf-section { scroll-margin-top: 80px; }
                
                .pf-img-upload { border: 2px dashed var(--border-dark); border-radius: 8px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.2s; }
                .pf-img-upload:hover { border-color: var(--primary); background: rgba(22, 163, 74, 0.05); }
                
                .pf-form-row { display: grid; grid-template-columns: 200px 1fr; gap: 20px; margin-bottom: 20px; align-items: start; }
                .pf-form-row .pf-label { font-weight: 600; padding-top: 8px; }
                .pf-form-row .pf-desc { font-size: 0.75rem; color: var(--text-muted); font-weight: normal; display: block; margin-top: 4px; }
                
                .pf-radio-group { display: flex; gap: 15px; }
                .pf-radio { display: flex; align-items: center; gap: 5px; cursor: pointer; }
                
                .pf-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                
                .pf-footer { position: fixed; bottom: 0; left: 250px; right: 0; background: var(--card-bg); border-top: 1px solid var(--border-dark); padding: 15px 30px; display: flex; justify-content: space-between; z-index: 100; box-shadow: 0 -4px 10px rgba(0,0,0,0.1); }
                
                /* Helper for content spacing */
                .pb-100 { padding-bottom: 100px; }
            </style>

            <div class="page-header">
                <h1>${p.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h1>
                <button class="btn btn-outline" onclick="AdminProducts.closeForm()">Kembali</button>
            </div>

            <div id="pf-error" style="display:none; padding:15px; background:var(--danger-bg); color:var(--danger); border-radius:6px; margin-bottom:20px;"></div>

            <form id="complex-product-form" onsubmit="event.preventDefault(); AdminProducts.saveProduct();" class="pb-100">
                <input type="hidden" id="pf-id" value="${p.id || ''}">
                <div class="pf-container">
                    
                    <!-- Form Sections -->
                    <div class="pf-main">
                        
                        <!-- Informasi Dasar -->
                        <div class="card pf-section" id="sec-dasar">
                            <div class="card-header"><h2>Informasi Dasar</h2></div>
                            <div class="card-body">
                                <div class="pf-form-row">
                                    <div class="pf-label">Foto Produk <span class="badge badge-warning">Wajib</span></div>
                                    <div>
                                        <div class="pf-img-upload">
                                            <div style="font-size: 2rem; margin-bottom: 10px;">📸</div>
                                            <div style="color: var(--primary); font-weight: 600;">+ Tambah Foto</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Format gambar .jpg .jpeg .png dan ukuran minimum 300 x 300px. Maks 10 foto.</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Nama Produk <span class="badge badge-warning">Wajib</span><span class="pf-desc">Tips: Merek + Jenis + Keterangan</span></div>
                                    <div><input type="text" id="pf-name" class="form-control" required placeholder="Contoh: Laptop Lenovo Thinkpad T480s" value="${p.name || ''}"></div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Deskripsi Produk <span class="badge badge-warning">Wajib</span><span class="pf-desc">Pastikan deskripsi tidak memuat informasi pribadi.</span></div>
                                    <div><textarea id="pf-desc" class="form-control" required rows="6" placeholder="Masukkan detail produk...">${p.description || ''}</textarea></div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Kategori Produk <span class="badge badge-warning">Wajib</span></div>
                                    <div>
                                        <select id="pf-category" class="form-control" required>
                                            <option value="">Pilih Kategori</option>
                                            <!-- Assuming categories are populated dynamically, adding hardcoded for UI completeness -->
                                            <option value="1" ${p.category_id == 1 ? 'selected' : ''}>Laptop</option>
                                            <option value="2" ${p.category_id == 2 ? 'selected' : ''}>Desktop PC</option>
                                            <option value="4" ${p.category_id == 4 ? 'selected' : ''}>Monitor</option>
                                            <option value="5" ${p.category_id == 5 ? 'selected' : ''}>Aksesoris</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Informasi Penjualan -->
                        <div class="card pf-section" id="sec-penjualan">
                            <div class="card-header"><h2>Informasi Penjualan</h2></div>
                            <div class="card-body">
                                <div class="pf-form-row">
                                    <div class="pf-label">Harga Produk <span class="badge badge-warning">Wajib</span></div>
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-weight: 600;">Rp</span>
                                            <input type="number" id="pf-price" class="form-control" required min="0" placeholder="Masukkan harga produk" value="${p.base_price || ''}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Diskon Produk</div>
                                    <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px;">
                                        <div style="display: flex; align-items: center; gap: 5px;">
                                            <input type="number" id="pf-discount" class="form-control" min="0" max="100" placeholder="%" value="${p.discount_percentage || '0'}">
                                            <span>%</span>
                                        </div>
                                        <div><input type="text" class="form-control" readonly placeholder="Rp Harga setelah diskon" style="background: var(--bg-dark);"></div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">SKU <span class="badge badge-warning">Wajib</span></div>
                                    <div><input type="text" id="pf-sku" class="form-control" required placeholder="Masukkan SKU Produk" value="${p.sku || ''}" ${p.id ? 'readonly' : ''}></div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Kondisi Produk <span class="badge badge-warning">Wajib</span></div>
                                    <div class="pf-radio-group">
                                        <label class="pf-radio"><input type="radio" name="pf_condition" value="baru" ${!p.condition || p.condition === 'baru' ? 'checked' : ''}> Baru</label>
                                        <label class="pf-radio"><input type="radio" name="pf_condition" value="bekas" ${p.condition === 'bekas' ? 'checked' : ''}> Bekas</label>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Brand</div>
                                    <div><input type="text" id="pf-brand" class="form-control" placeholder="Cari Brand" value="${p.brand || ''}"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Informasi Pengiriman -->
                        <div class="card pf-section" id="sec-pengiriman">
                            <div class="card-header"><h2>Informasi Pengiriman</h2></div>
                            <div class="card-body">
                                <div class="pf-form-row">
                                    <div class="pf-label">Berat Produk <span class="badge badge-warning">Wajib</span><span class="pf-desc">Setelah dikemas</span></div>
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <input type="number" id="pf-weight" class="form-control" required min="1" placeholder="Berat Produk" value="${p.weight_grams || '2500'}">
                                            <span style="font-weight: 600;">Gram</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Ukuran Produk<span class="pf-desc">Panjang x Lebar x Tinggi (setelah dikemas)</span></div>
                                    <div class="pf-grid-3">
                                        <div style="display: flex; align-items: center; gap: 5px;"><input type="number" id="pf-length" class="form-control" placeholder="Panjang" value="${p.length_cm || ''}"> <span>cm</span></div>
                                        <div style="display: flex; align-items: center; gap: 5px;"><input type="number" id="pf-width" class="form-control" placeholder="Lebar" value="${p.width_cm || ''}"> <span>cm</span></div>
                                        <div style="display: flex; align-items: center; gap: 5px;"><input type="number" id="pf-height" class="form-control" placeholder="Tinggi" value="${p.height_cm || ''}"> <span>cm</span></div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Pre-Order</div>
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="pf-preorder" ${p.is_preorder ? 'checked' : ''} onchange="document.getElementById('pf-preorder-days').style.display = this.checked ? 'block' : 'none'">
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <div id="pf-preorder-days" style="display: ${p.is_preorder ? 'block' : 'none'};">
                                            <input type="number" id="pf-p-days" class="form-control" placeholder="Lama PO (Hari)" value="${p.preorder_days || ''}" style="width: 150px;">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="pf-form-row">
                                    <div class="pf-label">Asuransi Pengiriman</div>
                                    <div class="pf-radio-group">
                                        <label class="pf-radio"><input type="radio" name="pf_insurance" value="1" ${p.is_insurance_required ? 'checked' : ''}> Wajib</label>
                                        <label class="pf-radio"><input type="radio" name="pf_insurance" value="0" ${!p.is_insurance_required ? 'checked' : ''}> Opsional</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status Produk -->
                        <div class="card pf-section" id="sec-status">
                            <div class="card-header"><h2>Status Produk</h2></div>
                            <div class="card-body">
                                <div class="pf-form-row">
                                    <div class="pf-label">Status<span class="pf-desc">Aktifkan untuk menampilkan di toko</span></div>
                                    <div>
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="pf-status" ${!p.id || p.is_published ? 'checked' : ''}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <!-- Sidebar Navigation -->
                    <div class="pf-sidebar">
                        <ul class="pf-nav">
                            <li onclick="document.getElementById('sec-dasar').scrollIntoView({behavior: 'smooth'})">Informasi Dasar</li>
                            <li onclick="document.getElementById('sec-penjualan').scrollIntoView({behavior: 'smooth'})">Informasi Penjualan</li>
                            <li onclick="document.getElementById('sec-pengiriman').scrollIntoView({behavior: 'smooth'})">Informasi Pengiriman</li>
                            <li onclick="document.getElementById('sec-status').scrollIntoView({behavior: 'smooth'})">Status Produk</li>
                        </ul>
                    </div>
                </div>

                <!-- Footer Action Bar -->
                <div class="pf-footer">
                    <button type="button" class="btn btn-outline" onclick="AdminProducts.closeForm()">Batalkan</button>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn btn-primary" id="pf-submit-btn">Simpan</button>
                    </div>
                </div>
            </form>
        `;
    },

    async saveProduct() {
        const id = document.getElementById('pf-id').value;
        const submitBtn = document.getElementById('pf-submit-btn');
        const errEl = document.getElementById('pf-error');
        
        const data = {
            sku: document.getElementById('pf-sku').value,
            name: document.getElementById('pf-name').value,
            description: document.getElementById('pf-desc').value,
            category_id: document.getElementById('pf-category').value,
            base_price: document.getElementById('pf-price').value,
            discount_percentage: document.getElementById('pf-discount').value || 0,
            condition: document.querySelector('input[name="pf_condition"]:checked').value,
            brand: document.getElementById('pf-brand').value,
            weight_grams: document.getElementById('pf-weight').value,
            length_cm: document.getElementById('pf-length').value || null,
            width_cm: document.getElementById('pf-width').value || null,
            height_cm: document.getElementById('pf-height').value || null,
            is_preorder: document.getElementById('pf-preorder').checked ? 1 : 0,
            preorder_days: document.getElementById('pf-preorder').checked ? document.getElementById('pf-p-days').value : null,
            is_insurance_required: document.querySelector('input[name="pf_insurance"]:checked').value,
            is_published: document.getElementById('pf-status').checked ? 1 : 0
        };
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        errEl.style.display = 'none';
        
        try {
            let res;
            if (id) {
                delete data.sku; // Readonly on update
                res = await API.put(`/admin/products/${id}`, data);
            } else {
                res = await API.post(`/admin/products`, data);
            }
            
            if (res.success) {
                this.closeForm();
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
        }
    },
    
    async deleteProduct(id) {
        if (!confirm('Anda yakin ingin menghapus produk ini?')) return;
        
        try {
            const res = await API.delete(`/admin/products/${id}`);
            if (res.success) {
                this.loadData();
            } else {
                alert(res.message || 'Gagal menghapus produk');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }
};
