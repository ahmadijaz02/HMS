import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token);
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Setting Authorization header:', config.headers['Authorization']);
        }

        // Log the full request details
        console.log('Request details:', {
            url: config.url,
            fullUrl: baseURL + config.url,
            method: config.method,
            headers: config.headers,
            data: config.data
        });
        
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Log the full error details for debugging
        console.error('Response error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
        });

        // Only redirect to login for 401 errors that are not from the auth endpoints
        if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
            console.log('Unauthorized access, redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
        }

        // Don't redirect for 403 errors, just let the component handle it
        return Promise.reject(error);
    }
);

export default axiosInstance; 