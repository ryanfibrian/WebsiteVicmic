/**
 * Vicmic API Client — Fetch wrapper for backend API.
 */
const API = {
    baseUrl: '/api',

    async request(method, endpoint, data = null, options = {}) {
        const url = this.baseUrl + endpoint;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            ...options,
        };

        // Add auth token if available
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const text = await response.text();
            let json;
            
            try {
                json = JSON.parse(text);
            } catch (parseError) {
                console.error("API Response not JSON:", text);
                throw { 
                    status: response.status || 500, 
                    message: 'Error Server: ' + (text ? text.substring(0, 100).replace(/(<([^>]+)>)/gi, "") : "Empty response")
                };
            }

            if (!response.ok) {
                throw { status: response.status, ...json };
            }

            return json;
        } catch (error) {
            if (error.status) throw error;
            console.error("Network Fetch Error:", error);
            throw { success: false, message: 'Koneksi gagal: ' + (error.message || 'Unknown'), status: 0 };
        }
    },

    get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request('GET', url);
    },

    post(endpoint, data) { return this.request('POST', endpoint, data); },
    put(endpoint, data) { return this.request('PUT', endpoint, data); },
    delete(endpoint) { return this.request('DELETE', endpoint); },
    patch(endpoint, data) { return this.request('PATCH', endpoint, data); },

    // File upload
    async upload(endpoint, formData) {
        const url = this.baseUrl + endpoint;
        const config = {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' },
        };
        const token = localStorage.getItem('admin_token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, config);
        return response.json();
    },
};

// Format Rupiah
function formatRupiah(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// Show toast notification
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Debounce helper
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
