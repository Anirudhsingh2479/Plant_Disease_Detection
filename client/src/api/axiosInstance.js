import axios from 'axios';

const axiosInstance = axios.create({
    //This creates a CUSTOM Axios object.
    baseURL: import.meta.env.VITE_API_BASE_URL,
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

    return config;
});

// Cookies are sent automatically with every request because withCredentials: true is set above.

export default axiosInstance;
