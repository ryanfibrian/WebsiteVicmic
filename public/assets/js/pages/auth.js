/**
 * Customer Authentication Pages (Login & Register)
 */
window.PageLogin = {
    async render() {
        const app = document.getElementById('app');
        
        // If already logged in, redirect
        if (window.currentUser) {
            router.navigate('/');
            return;
        }

        app.innerHTML = `
            <style>
                .auth-page {
                    min-height: calc(100vh - 80px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    padding: 40px 20px;
                }
                .auth-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                    width: 100%;
                    max-width: 450px;
                    padding: 40px;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.5);
                }
                .auth-logo {
                    width: auto;
                    height: 50px;
                    margin-bottom: 30px;
                }
                .auth-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-dark);
                    margin-bottom: 10px;
                }
                .auth-subtitle {
                    color: var(--text-muted);
                    margin-bottom: 30px;
                }
                .auth-form {
                    text-align: left;
                }
                .auth-form .form-group {
                    margin-bottom: 20px;
                }
                .auth-form .form-label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-dark);
                    margin-bottom: 8px;
                    display: block;
                }
                .auth-form .form-control {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 1rem;
                    transition: all 0.3s;
                }
                .auth-form .form-control:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
                    outline: none;
                }
                .auth-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-top: 10px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .auth-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(22, 163, 74, 0.2);
                }
                .auth-footer {
                    margin-top: 30px;
                    color: var(--text-muted);
                    font-size: 0.95rem;
                }
                .auth-footer a {
                    color: var(--primary);
                    font-weight: 600;
                    text-decoration: none;
                }
                .auth-footer a:hover {
                    text-decoration: underline;
                }
                #auth-error {
                    display: none;
                    background: #fee2e2;
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    border: 1px solid #fecaca;
                }
            </style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <a href="/" data-link>
                        <img src="/assets/img/logo.png" alt="Vicmic" class="auth-logo">
                    </a>
                    <h1 class="auth-title">Selamat Datang</h1>
                    <p class="auth-subtitle">Login untuk melihat status pesanan dan mulai berbelanja.</p>
                    
                    <div id="auth-error"></div>
                    
                    <form class="auth-form" onsubmit="event.preventDefault(); PageLogin.submit();">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="login-email" class="form-control" required placeholder="Masukkan email Anda">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" id="login-password" class="form-control" required placeholder="Masukkan password Anda">
                        </div>
                        
                        <div style="text-align: right; margin-bottom: 20px;">
                            <a href="#" style="font-size: 0.85rem; color: var(--primary); text-decoration: none;">Lupa Password?</a>
                        </div>
                        
                        <button type="submit" class="btn btn-primary auth-btn" id="login-btn">Masuk</button>
                    </form>
                    
                    <div class="auth-footer">
                        Belum punya akun? <a href="/register" data-link>Daftar sekarang</a>
                    </div>
                </div>
            </div>
        `;
        window.scrollTo(0,0);
    },
    
    async submit() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        const err = document.getElementById('auth-error');
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:20px; height:20px; border-color:white; border-bottom-color:transparent; margin:0 auto;"></div>';
        err.style.display = 'none';
        
        try {
            const res = await API.post('/auth/login', { email, password });
            if (res.success) {
                // Refresh to trigger app.js auth check
                window.location.href = '/';
            } else {
                throw new Error(res.message);
            }
        } catch (e) {
            err.textContent = e.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Masuk';
        }
    }
};

window.PageRegister = {
    async render() {
        const app = document.getElementById('app');
        
        if (window.currentUser) {
            router.navigate('/');
            return;
        }

        app.innerHTML = `
            <style>
                /* Reusing auth styles from PageLogin */
                .auth-page {
                    min-height: calc(100vh - 80px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    padding: 40px 20px;
                }
                .auth-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                    width: 100%;
                    max-width: 500px;
                    padding: 40px;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.5);
                }
                .auth-logo { width: auto; height: 50px; margin-bottom: 30px; }
                .auth-title { font-size: 1.75rem; font-weight: 700; color: var(--text-dark); margin-bottom: 10px; }
                .auth-subtitle { color: var(--text-muted); margin-bottom: 30px; }
                .auth-form { text-align: left; }
                .auth-form .form-group { margin-bottom: 20px; }
                .auth-form .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .auth-form .form-label { font-weight: 600; font-size: 0.9rem; color: var(--text-dark); margin-bottom: 8px; display: block; }
                .auth-form .form-control { width: 100%; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 1rem; transition: all 0.3s; }
                .auth-form .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1); outline: none; }
                .auth-btn { width: 100%; padding: 14px; border-radius: 10px; font-size: 1.1rem; font-weight: 600; margin-top: 10px; transition: transform 0.2s, box-shadow 0.2s; }
                .auth-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(22, 163, 74, 0.2); }
                .auth-footer { margin-top: 30px; color: var(--text-muted); font-size: 0.95rem; }
                .auth-footer a { color: var(--primary); font-weight: 600; text-decoration: none; }
                .auth-footer a:hover { text-decoration: underline; }
                #auth-error { display: none; background: #fee2e2; color: #ef4444; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; border: 1px solid #fecaca; }
                
                @media (max-width: 500px) {
                    .auth-form .form-row { grid-template-columns: 1fr; gap: 0; }
                }
            </style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <a href="/" data-link>
                        <img src="/assets/img/logo.png" alt="Vicmic" class="auth-logo">
                    </a>
                    <h1 class="auth-title">Buat Akun</h1>
                    <p class="auth-subtitle">Daftar sekarang untuk kemudahan berbelanja di Vicmic.</p>
                    
                    <div id="auth-error"></div>
                    
                    <form class="auth-form" onsubmit="event.preventDefault(); PageRegister.submit();">
                        <div class="form-group">
                            <label class="form-label">Nama Lengkap *</label>
                            <input type="text" id="reg-name" class="form-control" required placeholder="Contoh: Budi Santoso">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Email *</label>
                                <input type="email" id="reg-email" class="form-control" required placeholder="budi@email.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">No. Handphone</label>
                                <input type="text" id="reg-phone" class="form-control" placeholder="08123456789">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Password *</label>
                            <input type="password" id="reg-password" class="form-control" required placeholder="Minimal 6 karakter" minlength="6">
                        </div>
                        
                        <button type="submit" class="btn btn-primary auth-btn" id="reg-btn">Daftar Sekarang</button>
                    </form>
                    
                    <div class="auth-footer">
                        Sudah punya akun? <a href="/login" data-link>Masuk di sini</a>
                    </div>
                </div>
            </div>
        `;
        window.scrollTo(0,0);
    },
    
    async submit() {
        const data = {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            password: document.getElementById('reg-password').value
        };
        
        const btn = document.getElementById('reg-btn');
        const err = document.getElementById('auth-error');
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:20px; height:20px; border-color:white; border-bottom-color:transparent; margin:0 auto;"></div>';
        err.style.display = 'none';
        
        try {
            const res = await API.post('/auth/register', data);
            if (res.success) {
                // Refresh to trigger app.js auth check
                window.location.href = '/';
            } else {
                throw new Error(res.message);
            }
        } catch (e) {
            let msg = e.message;
            if (e.errors && typeof e.errors === 'object') {
                msg = Object.values(e.errors).flat().join('<br>');
            }
            err.innerHTML = msg;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Daftar Sekarang';
        }
    }
};

// Register Routes
router.route('/login', PageLogin.render.bind(PageLogin));
router.route('/register', PageRegister.render.bind(PageRegister));
