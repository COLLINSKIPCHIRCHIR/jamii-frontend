import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
    throw new Error(
        '[Axios] ⚠️ VITE_API_URL is missing. Check your .env files.'
    )
}

//axios instance with URL pointing to backend
const api = axios.create({
    baseURL, //points to express server
    withCredentials: true
});

console.log('[Axios] baseURL =', api.defaults.baseURL);

console.log('[Axios] VITE_API_URL =', baseURL);


api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Interceptor: Token retrieved:', token);
    } 

    //only force JSON if body is Not formData
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
}, 
(error) => {
    console.error('Interceptor error:', error);
    return Promise.reject(error);
}

);

export default api;