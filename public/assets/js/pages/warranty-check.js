/**
 * Warranty Check Page Component
 */
const WarrantyCheckPage = {
    render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="container" style="padding-top: 40px; max-width: 600px;">
                <div class="text-center mb-3">
                    <h1 style="font-family: var(--font-heading);">Cek Garansi Resmi</h1>
                    <p class="text-muted mt-1">Masukkan Serial Number (SN) yang tertera pada produk atau box kemasan.</p>
                </div>
                
                <div class="card" style="padding: 24px; text-align: center;">
                    <div style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto;">
                        <input type="text" id="warranty-sn" class="form-input" placeholder="Masukkan Serial Number">
                        <button id="btn-check-warranty" class="btn btn-primary">Cek</button>
                    </div>
                    <div id="warranty-result" style="margin-top: 32px; text-align: left;"></div>
                </div>
            </div>
        `;

        document.getElementById('btn-check-warranty').addEventListener('click', () => {
            const sn = document.getElementById('warranty-sn').value.trim();
            if (sn) this.checkWarranty(sn);
        });
    },

    async checkWarranty(sn) {
        const resDiv = document.getElementById('warranty-result');
        resDiv.innerHTML = '<div class="text-center text-muted">Memeriksa database...</div>';
        
        try {
            const res = await API.get(`/warranty/check/${sn}`);
            const data = res.data;

            const icon = data.warranty_active ? '✅' : '❌';
            const color = data.warranty_active ? 'var(--success)' : 'var(--error)';
            const statusText = data.warranty_active ? 'Garansi Aktif' : 'Garansi Habis';

            resDiv.innerHTML = `
                <div style="border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 3rem; margin-bottom: 8px;">${icon}</div>
                        <h2 style="color: ${color}; font-family: var(--font-heading);">${statusText}</h2>
                        ${data.warranty_active ? `<p class="text-muted text-sm">Sisa waktu garansi: ${data.warranty_days_left} hari</p>` : ''}
                    </div>

                    <div style="display: grid; gap: 12px; font-size: 0.875rem;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;">
                            <span class="text-muted">Serial Number</span>
                            <span style="font-weight: 600;">${data.serial_number}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;">
                            <span class="text-muted">Produk</span>
                            <span style="font-weight: 600; text-align: right;">${data.product_name} ${data.variant ? `(${data.variant})` : ''}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;">
                            <span class="text-muted">Masa Garansi</span>
                            <span style="font-weight: 600;">${data.warranty_months} Bulan</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;">
                            <span class="text-muted">Tanggal Pembelian</span>
                            <span style="font-weight: 600;">${data.purchase_date || '-'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span class="text-muted">Berlaku Sampai</span>
                            <span style="font-weight: 600;">${data.warranty_expiry ? new Date(data.warranty_expiry).toLocaleDateString('id-ID') : '-'}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            resDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; margin-bottom: 8px;">⚠️</div>
                    <p class="text-error" style="font-weight: 600;">Serial Number Tidak Ditemukan</p>
                    <p class="text-sm text-muted mt-1">Pastikan Anda memasukkan SN yang benar sesuai pada produk fisik, atau produk ini mungkin bukan garansi resmi Vicmic.</p>
                </div>
            `;
        }
    }
};

router.route('/warranty-check', WarrantyCheckPage.render.bind(WarrantyCheckPage));
