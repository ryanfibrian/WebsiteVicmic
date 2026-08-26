/**
 * Header Component Logic
 * Handles scroll effects, mobile menu, and search interactions
 */
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('site-header');
    const searchInput = document.getElementById('header-search-input');
    const btnSearchMobile = document.getElementById('btn-search-mobile');
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Search functionality
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                router.navigate(`/products?q=${encodeURIComponent(query)}`);
            }
        }
    };

    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearch);
    }

    if (btnSearchMobile && searchInput) {
        btnSearchMobile.addEventListener('click', () => {
            searchInput.focus();
            // Scroll to top to ensure search bar is visible on mobile
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
