// src/api/posts.ts
import api from './axios';
import type { Post } from '../types';

export const postsApi = {
    create: (data: {
        idDraftTask: number;
        idChannel: number;
        scheduledAt?: string | null;
    }) => api.post<Post>('/posts', data),

    update: (id: number, data: {
        scheduledAt?: string | null;
        idChannel?: number;
        status?: string;
        publishedAt?: string;
    }) => api.patch<Post>(`/posts/${id}`, data),

    get: (id: number) => api.get<Post>(`/posts/${id}`),

    list: (page = 0, size = 10) =>
        api.get<{ content: Post[] }>('/posts', { params: { page, size } }),

    publish: (id: number) => api.patch<Post>(`/posts/${id}/publish`),

    delete: (id: number) => api.delete(`/posts/${id}`)
};