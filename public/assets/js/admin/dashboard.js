/**
 * Admin Dashboard Page
 */
const AdminDashboard = {
    async render() {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div>
                <h1 style="margin-bottom: 24px;">Dashboard</h1>
                
                <div class="stat-grid">
                    <div class="stat-card">
                        <h3>Total Pendapatan</h3>
                        <div class="value">Rp 125.000.000</div>
                    </div>
                    <div class="stat-card">
                        <h3>Pesanan Baru</h3>
                        <div class="value">12</div>
                    </div>
                    <div class="stat-card">
                        <h3>Produk Habis</h3>
                        <div class="value" style="color: #ef4444;">3</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Pelanggan</h3>
                        <div class="value">1,204</div>
                    </div>
                </div>

                <div class="card">
                    <h2 style="margin-bottom: 16px; font-size: 18px;">Pesanan Terbaru</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID Pesanan</th>
                                <th>Tanggal</th>
                                <th>Pelanggan</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>#ORD-2026-001</td>
                                <td>26 Ags 2026</td>
                                <td>Budi Santoso</td>
                                <td>Rp 15.000.000</td>
                                <td><span class="badge badge-warning">Menunggu Pembayaran</span></td>
                            </tr>
                            <tr>
                                <td>#ORD-2026-002</td>
                                <td>25 Ags 2026</td>
                                <td>Siti Aminah</td>
                                <td>Rp 8.500.000</td>
                                <td><span class="badge badge-success">Selesai</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};
