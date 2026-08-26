/**
 * Admin Products Page
 */
const AdminProducts = {
    async render() {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h1>Kelola Produk</h1>
                    <button class="btn btn-primary">+ Tambah Produk</button>
                </div>
                
                <div class="card">
                    <div style="margin-bottom: 16px; display: flex; gap: 10px;">
                        <input type="text" class="form-control" placeholder="Cari nama atau SKU..." style="max-width: 300px; border-color: var(--border-dark);">
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Nama Produk</th>
                                <th>Kategori</th>
                                <th>Harga Dasar</th>
                                <th>Stok Total</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="admin-products-table">
                            <tr><td colspan="6" style="text-align: center;">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        try {
            const data = await API.get('/admin/products');
            const tbody = document.getElementById('admin-products-table');
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(p => `
                    <tr>
                        <td>${p.sku}</td>
                        <td>${p.name}</td>
                        <td style="text-transform: capitalize;">${p.category}</td>
                        <td>Rp ${p.base_price.toLocaleString('id-ID')}</td>
                        <td>${p.stock}</td>
                        <td>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Belum ada produk</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            document.getElementById('admin-products-table').innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat produk.</td></tr>`;
        }
    }
};
