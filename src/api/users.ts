
import api from './axios';
import type { UserOption } from '../types';

export interface UserWithStatus {
    idUser: number;
    login: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
}

export interface UserUpdateData {
    login: string;
    email: string;
    fullName: string;
    role: string;
}

export interface UserCreateData {
    login: string;
    email: string;
    fullName: string;
    role: string;
    password: string;
}

export const usersApi = {
    listAuthors: () => api.get<UserOption[]>('/users/authors'),


    listAll: () => api.get<{ content: UserWithStatus[] }>('/users'),


    toggleBlock: (id: number, blocked: boolean) =>
        api.patch(`/users/${id}/block?blocked=${blocked}`),


    update: (id: number, data: UserUpdateData) =>
        api.put(`/users/${id}`, data),


    delete: (id: number) => api.delete(`/users/${id}`),


    create: (data: UserCreateData) =>
        api.post('/users', data),

    checkLoginExists: (login: string) =>
        api.get<{ exists: boolean }>(`/users/check-login?login=${encodeURIComponent(login)}`),

    checkEmailExists: (email: string) =>
        api.get<{ exists: boolean }>(`/users/check-email?email=${encodeURIComponent(email)}`),
};