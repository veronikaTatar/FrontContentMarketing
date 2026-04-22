import api from './axios';
import type { Content, PageResponse } from '../types';

export const contentApi = {
    search: (params: string) => api.get<PageResponse<Content>>(`/contents/search${params}`),
    create: (payload: Partial<Content>) => api.post<Content>('/contents', payload),
    update: (id: number, payload: Partial<Content>) => api.put<Content>(`/contents/${id}`, payload),
    approve: (id: number) => api.patch<Content>(`/contents/${id}/approve`),
    reject: (id: number) => api.patch<Content>(`/contents/${id}/reject`),
};
