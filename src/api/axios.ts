import axios from 'axios';

import type { LoginCredentials, RegisterData, AuthResponse } from '../types';

export interface FooterSettings {
    email: string;
    emailLink?: string;
    phone: string;
    phoneLink?: string;
    socialLinks: {
        telegram: { label: string; url: string };
        whatsapp: { label: string; url: string };
        discord: { label: string; url: string };
    };
    logoFilename: string;  // только имя файла
    copyrightText: string;
    copyrightLinkText: string;
    legalText: string;
}

export const authApi = {
    login: (credentials: LoginCredentials) =>
        api.post<AuthResponse>('/auth/login', credentials),

    register: (data: RegisterData) =>
        api.post<AuthResponse>('/auth/register', data),

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Получение настроек с бэка
    getFooterSettings: async (): Promise<{ data: FooterSettings }> => {
        const response = await api.get('/system-settings/footer');
        return { data: response.data };
    },

    // Обновление настроек на бэке
    updateFooterSettings: async (settings: FooterSettings): Promise<{ data: FooterSettings }> => {
        const response = await api.put('/system-settings/footer', settings);
        return { data: response.data };
    },
};


const api = axios.create({
    //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
    baseURL: '/api',  // ← ИЗМЕНИТЬ! Использует прокси Vite
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
