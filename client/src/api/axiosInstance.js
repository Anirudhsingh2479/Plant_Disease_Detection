import axios from 'axios';

const axiosInstance = axios.create({
    //This creates a CUSTOM Axios object.
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json', //It tells backend:"I am sending JSON data."
    },
    withCredentials: true
});

// Cookies are sent automatically with every request because withCredentials: true is set above.

export default axiosInstance;