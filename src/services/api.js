import axios from 'axios';

//axios instance with URL pointing to backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',//points to express server
});

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