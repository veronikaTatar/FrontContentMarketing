// users.ts
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

    // Получить всех пользователей (для админа)
    listAll: () => api.get<{ content: UserWithStatus[] }>('/users'),

    // Заблокировать/разблокировать пользователя
    toggleBlock: (id: number, blocked: boolean) =>
        api.patch(`/users/${id}/block?blocked=${blocked}`),

    // Обновить данные пользователя
    update: (id: number, data: UserUpdateData) =>
        api.put(`/users/${id}`, data),

    // Удалить пользователя
    delete: (id: number) => api.delete(`/users/${id}`),

    // ✅ ДОБАВИТЬ: Создать пользователя (для админа)
    create: (data: UserCreateData) =>
        api.post('/users', data),

    checkLoginExists: (login: string) =>
        api.get<{ exists: boolean }>(`/users/check-login?login=${encodeURIComponent(login)}`),

    checkEmailExists: (email: string) =>
        api.get<{ exists: boolean }>(`/users/check-email?email=${encodeURIComponent(email)}`),
};