/**
 * Vicmic App Bootstrap
 * Initializes the SPA router and global event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Router
    router.init();
    
    // Service worker setup in index.php handles PWA install

    // Fix viewport height for mobile browsers
    const setVh = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setVh);
    setVh();
});
