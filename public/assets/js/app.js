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
                        <a href="#" class="header-action-btn" title="Akun Saya" style="text-decoration:none; display:flex; align-items:center; gap:5px;" onclick="event.preventDefault(); API.post('/auth/logout').then(() => window.location.reload())">
                            👤<span style="font-size: 0.8rem; font-weight:600; display:none;" class="hide-mobile">${window.currentUser.name.split(' ')[0]} (Logout)</span>
                        </a>
                    `);
                } else {
                    headerActions.insertAdjacentHTML('afterbegin', `
                        <a href="/login" data-link class="header-action-btn" title="Login" style="text-decoration:none;">
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
