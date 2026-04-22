// src/api/auth.ts
import api from './axios';
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
    logoFilename: string;
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

    getFooterSettings: async (): Promise<{ data: FooterSettings }> => {
        const response = await api.get('/system-settings/footer');
        return { data: response.data };
    },

    updateFooterSettings: async (settings: FooterSettings): Promise<{ data: FooterSettings }> => {
        const response = await api.put('/system-settings/footer', settings);
        return { data: response.data };
    },

    // Добавляем метод uploadLogo
    uploadLogo: async (file: File): Promise<{ data: { logoFilename: string } }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/system-settings/upload-logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { data: response.data };
    }
};