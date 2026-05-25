import axios from 'axios';

const axiosInstance = axios.create({
    //This creates a CUSTOM Axios object.
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json', //It tells backend:"I am sending JSON data."
    },
    withCredentials: true
});

axiosInstance.interceptors.request.use((config)=>{
    // with the help of interceptor
    // Frontend → Interceptor runs → Token attached → Request sent
    const token =localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;