import axios from 'axios';

const axiosInstance = axios.create({
    //This creates a CUSTOM Axios object.
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json', //It tells backend:"I am sending JSON data."
    },
    withCredentials: true
});

axiosInstance.interceptors.request.use((config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
    }

    try {
        const persistedAuth = localStorage.getItem('authState');
        if (persistedAuth) {
            const parsedAuth = JSON.parse(persistedAuth);
            const token = parsedAuth?.token;
            if (token) {
                config.headers = config.headers || {};
                if (!config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
    } catch {
        // Ignore malformed localStorage payloads and proceed without Bearer token.
    }

    return config;
});

// Cookies are sent automatically with every request because withCredentials: true is set above.

export default axiosInstance;