/**
 * Customer Profile Page
 */

window.PageProfile = {
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
                .profile-card {
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
                }
                .profile-info h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 5px 0;
                }
                .profile-info p {
                    color: #64748b;
                    margin: 0;
                    font-size: 0.95rem;
                }
                .profile-details {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                .detail-item {
                    background: #f1f5f9;
                    padding: 20px;
                    border-radius: 12px;
                }
                .detail-label {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 5px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .detail-value {
                    font-size: 1.1rem;
                    color: #0f172a;
                    font-weight: 500;
                }
                .profile-actions {
                    margin-top: 40px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 30px;
                }
                .btn-logout {
                    width: 100%;
                    padding: 14px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-logout:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);
                }
                
                @media (max-width: 500px) {
                    .profile-card { padding: 30px 20px; }
                    .profile-avatar { width: 60px; height: 60px; font-size: 2rem; }
                }
            </style>
            
            <div class="profile-page animate-fade-up">
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            \${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="profile-info">
                            <h1>\${user.name}</h1>
                            <p>Customer Vicmic</p>
                        </div>
                    </div>
                    
                    <div class="profile-details">
                        <div class="detail-item">
                            <div class="detail-label">Email Address</div>
                            <div class="detail-value">\${user.email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Nomor Handphone</div>
                            <div class="detail-value">\${user.phone || '-'}</div>
                        </div>
                    </div>
                    
                    <div class="profile-actions">
                        <button onclick="PageProfile.logout()" class="btn-logout">
                            Keluar (Logout)
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        window.scrollTo(0,0);
    },
    
    async logout() {
        if(confirm('Apakah Anda yakin ingin keluar dari akun Anda?')) {
            const btn = document.querySelector('.btn-logout');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<div class="loading-spinner" style="width:20px; height:20px; border-color:white; border-bottom-color:transparent; margin:0 auto;"></div>';
            }
            
            try {
                await API.post('/auth/logout');
                window.location.href = '/';
            } catch (e) {
                alert('Gagal logout: ' + (e.message || 'Silakan coba lagi.'));
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Keluar (Logout)';
                }
            }
        }
    }
};

// Register Route
router.route('/profile', PageProfile.render.bind(PageProfile));
