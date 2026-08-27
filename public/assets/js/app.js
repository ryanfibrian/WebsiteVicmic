/**
 * Vicmic App Bootstrap
 * Initializes the SPA router and global event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication state
    window.currentUser = null;
    API.get('/auth/me')
        .then(res => {
            if (res.success && res.data) {
                window.currentUser = res.data;
            }
        })
        .catch(e => console.log('Not logged in'))
        .finally(() => {
            // Update Header User Icon
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                if (window.currentUser) {
                    headerActions.insertAdjacentHTML('afterbegin', `
                        <div class="user-welcome hide-mobile" style="display:flex; align-items:center; gap:15px; margin-right: 10px;">
                            <div style="text-align: right; line-height: 1.2;">
                                <div style="font-weight: 600; font-size: 0.9rem; color: var(--primary-600, #16a34a);">Welcome, ${window.currentUser.name}</div>
                                <div id="live-clock" style="font-size: 0.75rem; color: #64748b;"></div>
                            </div>
                        </div>
                        <a href="/profile" data-link class="btn hide-mobile" style="padding: 8px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; font-size: 0.9rem;">
                            Profil Saya
                        </a>
                        <a href="/profile" data-link class="header-action-btn show-mobile" title="Profil Saya" style="text-decoration:none; display:none;">
                            👤
                        </a>
                    `);
                    
                    // Show icon on mobile, hide button
                    const style = document.createElement('style');
                    style.innerHTML = '@media (max-width: 500px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } } @media (min-width: 501px) { .show-mobile { display: none !important; } }';
                    document.head.appendChild(style);
                    
                    // Start live clock
                    const clockEl = document.getElementById('live-clock');
                    if (clockEl) {
                        const updateClock = () => {
                            const now = new Date();
                            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                            const dateStr = now.toLocaleDateString('id-ID', options);
                            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            clockEl.textContent = dateStr + ' ' + timeStr;
                        };
                        updateClock();
                        setInterval(updateClock, 1000);
                    }
                } else {
                    headerActions.insertAdjacentHTML('afterbegin', `
                        <a href="/login" data-link class="btn hide-mobile" style="padding: 8px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; background: var(--primary-600, #16a34a); color: white; border: none; font-size: 0.9rem;">
                            Login / Register
                        </a>
                        <a href="/login" data-link class="header-action-btn show-mobile" title="Login" style="text-decoration:none; display:none;">
                            👤
                        </a>
                    `);
                }
            }
            // Initialize Router after auth check
            router.init();
        });

    
    // Service worker setup in index.php handles PWA install

    // Fix viewport height for mobile browsers
    const setVh = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setVh);
    setVh();
});
