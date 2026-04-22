
import api from './axios';
import type { Tag, PageResponse } from '../types';

export const tagsApi = {
    list: (page = 0, size = 100) =>
        api.get<PageResponse<Tag>>('/tags', { params: { page, size } }),

    get: (id: number) =>
        api.get<Tag>(`/tags/${id}`),

    create: (data: { name: string; category: string }) =>
        api.post<Tag>('/tags', data),

    update: (id: number, data: { name?: string; category?: string }) =>
        api.put<Tag>(`/tags/${id}`, data),

    delete: (id: number) =>
        api.delete(`/tags/${id}`),

    listCategories: () =>
        api.get<string[]>('/tags/categories')
};