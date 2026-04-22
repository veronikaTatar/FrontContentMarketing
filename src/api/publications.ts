// src/api/publications.ts
import api from './axios';
import type { Publication } from '../types';

export const publicationsApi = {
    list: (page = 0, size = 10) =>
        api.get<{ content: Publication[] }>('/publications', { params: { page, size } }),

    get: (id: number) =>
        api.get<Publication>(`/publications/${id}`),

    create: (data: any) =>
        api.post<Publication>('/publications', data),

    update: (id: number, data: any) =>
        api.put<Publication>(`/publications/${id}`, data),

    delete: (id: number) =>
        api.delete(`/publications/${id}`),

    calendar: (from: string, to: string) =>
        api.get<{ content: Publication[] }>('/publications/calendar', { params: { from, to } })
};