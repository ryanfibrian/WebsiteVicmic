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
        
        // Verify token with API
        API.get('/admin/auth/me')
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
        document.body.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; height:100vh; background:var(--bg-secondary);">
                <div class="card" style="padding: 40px; width: 100%; max-width: 400px; text-align: center;">
                    <h2 style="margin-bottom: 24px; color: var(--primary-700);">Login Admin</h2>
                    <form id="admin-login-form" onsubmit="event.preventDefault(); AdminApp.doLogin();">
                        <input type="text" id="login-id" class="form-control" placeholder="Username / Email" required style="width:100%; padding: 12px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 6px;">
                        <input type="password" id="login-pass" class="form-control" placeholder="Password" required style="width:100%; padding: 12px; margin-bottom: 24px; border: 1px solid #ccc; border-radius: 6px;">
                        <button type="submit" class="btn btn-primary" style="width:100%; padding: 12px; border-radius: 6px;">Masuk</button>
                    </form>
                    <p id="login-error" style="color: red; font-size: 0.875rem; margin-top: 16px; display: none;"></p>
                </div>
            </div>
        `;
    },

    async doLogin() {
        const identity = document.getElementById('login-id').value;
        const password = document.getElementById('login-pass').value;
        const errEl = document.getElementById('login-error');
        
        try {
            const res = await API.post('/admin/auth/login', { identity, password });
            localStorage.setItem('admin_token', res.data.token);
            window.location.href = '/admin/'; // Reload the page to reset the app shell
        } catch (e) {
            errEl.textContent = e.message || 'Login gagal';
            errEl.style.display = 'block';
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
        
        // Setup a 404 handler for admin specifically, or let the router handle it
        
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
