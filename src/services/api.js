import axios from 'axios';

const API = axios.create({
    baseURL: 'https://eventexa-backend.onrender.com/api',
    headers:{
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
    try {
        return await API.get("/registerations/all");
    } catch (error) {
        if (error.response?.status !== 404) {
            throw error;
        }

        return API.get("/registrations/all");
    }
};

export const deleteAllRegistrations = async () => {
    try {
        return await API.delete("/registerations/all");
    } catch (error) {
        if (error.response?.status !== 404) {
            throw error;
        }

        return API.delete("/registrations/all");
    }
};

export default API;