/**
 * Admin Panel - Main App Shell
 */
const AdminApp = {
    init() {
        this.checkAuth();
    },

    checkAuth() {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            this.showLogin();
            return;
        }
        
        // Verify token with API (fixed path: /admin/me, not /admin/auth/me)
        API.get('/admin/me')
            .then(res => {
                if (res.success) {
                    this.setupRouter();
                } else {
                    this.showLogin();
                }
            })
            .catch(() => this.showLogin());
    },

    showLogin() {
        document.body.style.margin = "0";
        document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
        document.body.style.background = "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
        
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; width: 100%; padding: 20px; box-sizing: border-box;">
                <div style="background: white; padding: 48px 40px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); width: 100%; max-width: 420px; text-align: center; border: 1px solid rgba(255,255,255,0.5);">
                    
                    <div style="margin-bottom: 36px;">
                        <h1 style="color: #15803d; font-size: 2.2rem; font-weight: 800; margin: 0; letter-spacing: -0.5px;">VICMIC</h1>
                        <p style="color: #64748b; margin-top: 8px; font-size: 0.95rem;">Sistem Manajemen Internal</p>
                    </div>
                    
                    <form id="admin-login-form" onsubmit="event.preventDefault(); AdminApp.doLogin();">
                        <div style="text-align: left; margin-bottom: 20px;">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 8px;">Username atau Email</label>
                            <input type="text" id="login-id" placeholder="Ketik username Anda" required 
                                style="width: 100%; box-sizing: border-box; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 1rem; outline: none; transition: all 0.2s;" 
                                onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 0 3px rgba(34, 197, 94, 0.1)'" 
                                onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                        </div>
                        
                        <div style="text-align: left; margin-bottom: 32px;">
                            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 8px;">Kata Sandi</label>
                            <div style="position: relative;">
                                <input type="password" id="login-pass" placeholder="••••••••" required 
                                    style="width: 100%; box-sizing: border-box; padding: 14px 16px; padding-right: 50px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 1rem; outline: none; transition: all 0.2s;" 
                                    onfocus="this.style.borderColor='#22c55e'; this.style.boxShadow='0 0 0 3px rgba(34, 197, 94, 0.1)'" 
                                    onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                                <button type="button" onclick="AdminApp.togglePassword()" id="toggle-pass-btn"
                                    style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px; font-size: 1.2rem; color: #94a3b8; line-height: 1;"
                                    title="Tampilkan/sembunyikan kata sandi">👁️</button>
                            </div>
                        </div>
                        
                        <button type="submit" id="login-submit-btn" style="width: 100%; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">Masuk ke Dashboard</button>
                    </form>
                    
                    <div id="login-error" style="color: #ef4444; background: #fef2f2; border-radius: 10px; padding: 12px; font-size: 0.875rem; margin-top: 20px; display: none; border: 1px solid #f87171;"></div>
                    
                </div>
            </div>
        `;
    },

    togglePassword() {
        const passInput = document.getElementById('login-pass');
        const toggleBtn = document.getElementById('toggle-pass-btn');
        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    },

    async doLogin() {
        const identity = document.getElementById('login-id').value;
        const password = document.getElementById('login-pass').value;
        const errEl = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit-btn');
        
        // Disable button while loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
        submitBtn.style.opacity = '0.7';
        errEl.style.display = 'none';
        
        try {
            // Fixed path: /admin/login, not /admin/auth/login
            const res = await API.post('/admin/login', { identity, password });
            localStorage.setItem('admin_token', res.data.token);
            window.location.href = '/admin/';
        } catch (e) {
            // Show detailed error message from server
            const msg = e.message || e.errors || 'Login gagal. Periksa koneksi dan coba lagi.';
            if (typeof msg === 'object') {
                errEl.textContent = Object.values(msg).flat().join(', ');
            } else {
                errEl.textContent = msg;
            }
            errEl.style.display = 'block';
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk ke Dashboard';
            submitBtn.style.opacity = '1';
        }
    },
    
    setupRouter() {
        // Override router app element because admin uses 'admin-app' instead of 'app'
        router.appElement = document.getElementById('admin-app');
        
        // Register routes using the global 'router' instance defined in assets/js/router.js
        const renderDashboard = () => this.loadPage('AdminDashboard');
        router.route('/admin', renderDashboard);
        router.route('/admin/', renderDashboard);
        
        router.route('/admin/products', () => this.loadPage('AdminProducts'));
        router.route('/admin/orders', () => this.loadPage('AdminOrders'));
        router.route('/admin/inventory', () => this.loadPage('AdminInventory'));
        router.route('/admin/serial-numbers', () => this.loadPage('AdminSerialNumbers'));
        router.route('/admin/warehouses', () => this.loadPage('AdminWarehouses'));
        
        this.highlightNav();
        
        // Update nav on navigation
        window.addEventListener('popstate', () => this.highlightNav());
        document.body.addEventListener('click', e => {
            if (e.target.matches('[data-link]')) {
                setTimeout(() => this.highlightNav(), 50);
            }
        });
        
        // Initialize the router
        router.init();
    },
    
    highlightNav() {
        const path = window.location.pathname;
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            if (el.getAttribute('href') === path) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    },
    
    async loadPage(pageName, params = {}) {
        const app = document.getElementById('admin-app');
        if (typeof window[pageName] === 'undefined') {
            app.innerHTML = `<div style="padding: 50px; text-align: center;">Komponen ${pageName} belum diimplementasi sepenuhnya.</div>`;
            return;
        }
        
        try {
            await window[pageName].render(params);
        } catch (error) {
            console.error(error);
            app.innerHTML = `<div style="padding: 50px; color: red;">Error memuat halaman. Lihat konsol.</div>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});
