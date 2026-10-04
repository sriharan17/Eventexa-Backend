import axios from 'axios';

const API = axios.create({
    baseURL: 'https://eventexa-backend.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('studentToken') || localStorage.getItem('adminToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const getAllRegistrations = async () => {
    return API.get('/registerations/all');
};

export const deleteAllRegistrations = async () => {
    return API.delete('/registerations/all');
};

export default API;
