/**
 * Vicmic SPA Router — History API based client-side routing.
 */
class VicmicRouter {
    constructor() {
        this.routes = [];
        this.currentPage = null;
        this.appElement = document.getElementById('app');
    }

    /**
     * Register a route
     * @param {string} path - URL pattern (e.g., /products/:slug)
     * @param {Function} handler - Page render function(params)
     */
    route(path, handler) {
        const pattern = path
            .replace(/:\w+/g, '([^/]+)')   // :param → capture group
            .replace(/\*/g, '.*');          // wildcard
        
        const paramNames = (path.match(/:(\w+)/g) || []).map(p => p.slice(1));

        this.routes.push({
            path,
            pattern: new RegExp(`^${pattern}$`),
            paramNames,
            handler,
        });
    }

    /**
     * Navigate to a path
     */
    navigate(path, pushState = true) {
        if (pushState) {
            history.pushState(null, '', path);
        }
        this.resolve(path);
    }

    /**
     * Resolve current URL to a route handler
     */
    resolve(url = window.location.pathname) {
        // Remove trailing slash (except root)
        if (url !== '/' && url.endsWith('/')) {
            url = url.slice(0, -1);
        }

        // Parse query params
        const queryString = window.location.search;
        const queryParams = Object.fromEntries(new URLSearchParams(queryString));

        for (const route of this.routes) {
            const match = url.match(route.pattern);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });

                // Page transition
                this.transition(() => {
                    route.handler({ ...params, query: queryParams });
                });
                return;
            }
        }

        // 404 fallback
        this.transition(() => this.show404());
    }

    /**
     * Animate page transition
     */
    transition(renderFn) {
        this.appElement.classList.add('page-enter');
        
        renderFn();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Trigger enter animation
        requestAnimationFrame(() => {
            this.appElement.classList.remove('page-enter');
            this.appElement.classList.add('page-enter-active');
            setTimeout(() => {
                this.appElement.classList.remove('page-enter-active');
            }, 300);
        });
    }

    /**
     * Show 404 page
     */
    show404() {
        this.appElement.innerHTML = `
            <div class="container" style="padding-top: 100px; text-align: center;">
                <h1 style="font-family: var(--font-heading); font-size: 4rem; color: var(--primary-600); margin-bottom: 16px;">404</h1>
                <p style="font-size: 1.125rem; color: var(--text-secondary); margin-bottom: 24px;">
                    Halaman tidak ditemukan
                </p>
                <a href="/" data-link class="btn btn-primary">Kembali ke Beranda</a>
            </div>
        `;
    }

    /**
     * Initialize router — listen for navigation events
     */
    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.resolve();
        });

        // Handle data-link clicks (SPA navigation)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== window.location.pathname) {
                    this.navigate(href);
                }
            }
        });

        // Initial route
        this.resolve();
    }
}

// Global router instance
const router = new VicmicRouter();
