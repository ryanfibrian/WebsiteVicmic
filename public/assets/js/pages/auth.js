/**
 * Customer Authentication Pages (Login, Register, Forgot Password, Reset Password)
 */

// Shared auth styles
const AUTH_STYLES = `
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
    .auth-form .form-control {
        width: 100%; padding: 12px 15px;
        border: 2px solid #e2e8f0; border-radius: 10px;
        font-size: 1rem; transition: all 0.3s;
        box-sizing: border-box;
    }
    .auth-form .form-control:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
        outline: none;
    }
    .auth-btn {
        width: 100%; padding: 14px; border-radius: 10px;
        font-size: 1.1rem; font-weight: 600; margin-top: 10px;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer; border: none;
        background: var(--primary, #16a34a); color: #fff;
    }
    .auth-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(22, 163, 74, 0.2);
    }
    .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .auth-footer { margin-top: 30px; color: var(--text-muted); font-size: 0.95rem; }
    .auth-footer a { color: var(--primary); font-weight: 600; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
    .auth-error {
        display: none; background: #fee2e2; color: #ef4444;
        padding: 12px; border-radius: 8px; margin-bottom: 20px;
        font-size: 0.9rem; border: 1px solid #fecaca;
    }
    .auth-success {
        display: none; background: #dcfce7; color: #16a34a;
        padding: 12px; border-radius: 8px; margin-bottom: 20px;
        font-size: 0.9rem; border: 1px solid #bbf7d0;
    }

    /* Password toggle */
    .password-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }
    .password-wrapper .form-control {
        padding-right: 48px;
    }
    .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        font-size: 1.2rem;
        color: #94a3b8;
        line-height: 1;
        transition: color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .password-toggle:hover { color: #475569; }
    .password-toggle svg { width: 20px; height: 20px; }

    @media (max-width: 500px) {
        .auth-form .form-row { grid-template-columns: 1fr; gap: 0; }
        .auth-card { padding: 30px 24px; }
    }
`;

// SVG Icons for eye toggle
const EYE_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/**
 * Toggle password visibility
 */
function togglePassword(inputId, btnElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btnElement.innerHTML = EYE_CLOSED;
        btnElement.title = 'Sembunyikan password';
    } else {
        input.type = 'password';
        btnElement.innerHTML = EYE_OPEN;
        btnElement.title = 'Tampilkan password';
    }
}

// ============================================================
// LOGIN PAGE
// ============================================================
window.PageLogin = {
    async render() {
        const app = document.getElementById('app');
        
        if (window.currentUser) {
            router.navigate('/');
            return;
        }

        app.innerHTML = `
            <style>${AUTH_STYLES}</style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <h1 class="auth-title">Selamat Datang</h1>
                    <p class="auth-subtitle">Login untuk melihat status pesanan dan mulai berbelanja.</p>
                    
                    <div id="auth-error" class="auth-error"></div>
                    
                    <form class="auth-form" id="login-form">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="login-email" class="form-control" required placeholder="Masukkan email Anda" autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <div class="password-wrapper">
                                <input type="password" id="login-password" class="form-control" required placeholder="Masukkan password Anda" autocomplete="current-password">
                                <button type="button" class="password-toggle" onclick="togglePassword('login-password', this)" title="Tampilkan password">
                                    ${EYE_OPEN}
                                </button>
                            </div>
                        </div>
                        
                        <div style="text-align: right; margin-bottom: 20px;">
                            <a href="/forgot-password" data-link style="font-size: 0.85rem; color: var(--primary); text-decoration: none;">Lupa Password?</a>
                        </div>
                        
                        <button type="submit" class="auth-btn" id="login-btn">Masuk</button>
                    </form>
                    
                    <div class="auth-footer">
                        Belum punya akun? <a href="/register" data-link>Daftar sekarang</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            PageLogin.submit();
        });
        
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
                window.location.href = '/';
            } else {
                throw new Error(res.message);
            }
        } catch (e) {
            err.textContent = e.message || 'Login gagal. Silakan coba lagi.';
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Masuk';
        }
    }
};

// ============================================================
// REGISTER PAGE
// ============================================================
window.PageRegister = {
    async render() {
        const app = document.getElementById('app');
        
        if (window.currentUser) {
            router.navigate('/');
            return;
        }

        app.innerHTML = `
            <style>${AUTH_STYLES}</style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <h1 class="auth-title">Buat Akun</h1>
                    <p class="auth-subtitle">Daftar sekarang untuk kemudahan berbelanja di Vicmic.</p>
                    
                    <div id="auth-error" class="auth-error"></div>
                    
                    <form class="auth-form" id="register-form">
                        <div class="form-group">
                            <label class="form-label">Nama Lengkap *</label>
                            <input type="text" id="reg-name" class="form-control" required placeholder="Contoh: Budi Santoso" autocomplete="name">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Email *</label>
                                <input type="email" id="reg-email" class="form-control" required placeholder="budi@email.com" autocomplete="email">
                            </div>
                            <div class="form-group">
                                <label class="form-label">No. Handphone</label>
                                <input type="text" id="reg-phone" class="form-control" placeholder="08123456789" autocomplete="tel">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Password *</label>
                            <div class="password-wrapper">
                                <input type="password" id="reg-password" class="form-control" required placeholder="Minimal 6 karakter" minlength="6" autocomplete="new-password" value="">
                                <button type="button" class="password-toggle" onclick="togglePassword('reg-password', this)" title="Tampilkan password">
                                    ${EYE_OPEN}
                                </button>
                            </div>
                        </div>
                        
                        <button type="submit" class="auth-btn" id="reg-btn">Daftar Sekarang</button>
                    </form>
                    
                    <div class="auth-footer">
                        Sudah punya akun? <a href="/login" data-link>Masuk di sini</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            PageRegister.submit();
        });
        
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
                window.location.href = '/';
            } else {
                throw res;
            }
        } catch (e) {
            let msg = e.message || 'Pendaftaran gagal. Silakan coba lagi.';
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

// ============================================================
// FORGOT PASSWORD PAGE
// ============================================================
window.PageForgotPassword = {
    async render() {
        const app = document.getElementById('app');
        
        if (window.currentUser) {
            router.navigate('/');
            return;
        }

        app.innerHTML = `
            <style>${AUTH_STYLES}</style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <h1 class="auth-title">Lupa Password</h1>
                    <p class="auth-subtitle">Masukkan email yang terdaftar, kami akan mengirimkan link untuk reset password Anda.</p>
                    
                    <div id="auth-error" class="auth-error"></div>
                    <div id="auth-success" class="auth-success"></div>
                    
                    <form class="auth-form" id="forgot-form">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="forgot-email" class="form-control" required placeholder="Masukkan email terdaftar" autocomplete="email">
                        </div>
                        
                        <button type="submit" class="auth-btn" id="forgot-btn">Kirim Link Reset</button>
                    </form>
                    
                    <div class="auth-footer">
                        <a href="/login" data-link>← Kembali ke Login</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('forgot-form').addEventListener('submit', (e) => {
            e.preventDefault();
            PageForgotPassword.submit();
        });
        
        window.scrollTo(0,0);
    },
    
    async submit() {
        const email = document.getElementById('forgot-email').value;
        const btn = document.getElementById('forgot-btn');
        const err = document.getElementById('auth-error');
        const success = document.getElementById('auth-success');
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:20px; height:20px; border-color:white; border-bottom-color:transparent; margin:0 auto;"></div>';
        err.style.display = 'none';
        success.style.display = 'none';
        
        try {
            const res = await API.post('/auth/forgot-password', { email });
            success.textContent = res.message || 'Link reset password telah dikirim ke email Anda.';
            success.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Kirim Ulang';
        } catch (e) {
            err.textContent = e.message || 'Gagal mengirim email. Silakan coba lagi.';
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Kirim Link Reset';
        }
    }
};

// ============================================================
// RESET PASSWORD PAGE
// ============================================================
window.PageResetPassword = {
    async render(params) {
        const app = document.getElementById('app');
        const token = params?.query?.token || new URLSearchParams(window.location.search).get('token');

        if (!token) {
            app.innerHTML = `
                <style>${AUTH_STYLES}</style>
                <div class="auth-page">
                    <div class="auth-card animate-fade-up">
                        <h1 class="auth-title">Link Tidak Valid</h1>
                        <p class="auth-subtitle">Link reset password tidak valid atau sudah kadaluarsa.</p>
                        <div class="auth-footer">
                            <a href="/forgot-password" data-link>Minta Link Baru</a> &nbsp;|&nbsp;
                            <a href="/login" data-link>Login</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <style>${AUTH_STYLES}</style>
            
            <div class="auth-page">
                <div class="auth-card animate-fade-up">
                    <h1 class="auth-title">Reset Password</h1>
                    <p class="auth-subtitle">Masukkan password baru untuk akun Anda.</p>
                    
                    <div id="auth-error" class="auth-error"></div>
                    <div id="auth-success" class="auth-success"></div>
                    
                    <form class="auth-form" id="reset-form">
                        <input type="hidden" id="reset-token" value="${token}">
                        
                        <div class="form-group">
                            <label class="form-label">Password Baru</label>
                            <div class="password-wrapper">
                                <input type="password" id="reset-password" class="form-control" required placeholder="Minimal 6 karakter" minlength="6" autocomplete="new-password">
                                <button type="button" class="password-toggle" onclick="togglePassword('reset-password', this)" title="Tampilkan password">
                                    ${EYE_OPEN}
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Konfirmasi Password Baru</label>
                            <div class="password-wrapper">
                                <input type="password" id="reset-password-confirm" class="form-control" required placeholder="Ulangi password baru" minlength="6" autocomplete="new-password">
                                <button type="button" class="password-toggle" onclick="togglePassword('reset-password-confirm', this)" title="Tampilkan password">
                                    ${EYE_OPEN}
                                </button>
                            </div>
                        </div>
                        
                        <button type="submit" class="auth-btn" id="reset-btn">Simpan Password Baru</button>
                    </form>
                    
                    <div class="auth-footer">
                        <a href="/login" data-link>← Kembali ke Login</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('reset-form').addEventListener('submit', (e) => {
            e.preventDefault();
            PageResetPassword.submit();
        });
        
        window.scrollTo(0,0);
    },
    
    async submit() {
        const password = document.getElementById('reset-password').value;
        const confirm = document.getElementById('reset-password-confirm').value;
        const token = document.getElementById('reset-token').value;
        const btn = document.getElementById('reset-btn');
        const err = document.getElementById('auth-error');
        const success = document.getElementById('auth-success');
        
        // Client-side validation
        if (password !== confirm) {
            err.textContent = 'Password dan konfirmasi password tidak cocok.';
            err.style.display = 'block';
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:20px; height:20px; border-color:white; border-bottom-color:transparent; margin:0 auto;"></div>';
        err.style.display = 'none';
        success.style.display = 'none';
        
        try {
            const res = await API.post('/auth/reset-password', { token, password });
            success.innerHTML = (res.message || 'Password berhasil diubah!') + '<br><br><a href="/login" data-link style="color: var(--primary); font-weight: 600;">Login dengan password baru →</a>';
            success.style.display = 'block';
            document.getElementById('reset-form').style.display = 'none';
        } catch (e) {
            err.textContent = e.message || 'Gagal mereset password. Silakan coba lagi.';
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Simpan Password Baru';
        }
    }
};

// ============================================================
// Register Routes
// ============================================================
router.route('/login', PageLogin.render.bind(PageLogin));
router.route('/register', PageRegister.render.bind(PageRegister));
router.route('/forgot-password', PageForgotPassword.render.bind(PageForgotPassword));
router.route('/reset-password', PageResetPassword.render.bind(PageResetPassword));
