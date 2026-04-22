// src/api/taskDrafts.ts
import api from './axios';
import type { TaskDraft } from '../types';

export const taskDraftsApi = {
    create: (data: {
        title: string;
        body: string;
        idTask: number;
        status: string;
        tags: string[];
        imageUrls: string[];
    }) => api.post<TaskDraft>('/task-drafts', data),

    get: (id: number) => api.get<TaskDraft>(`/task-drafts/${id}`),

    listByTask: (idTask: number, page = 0, size = 10) =>
        api.get<{ content: TaskDraft[] }>(`/task-drafts`, { params: { idTask, page, size } }),

    // Список всех черновиков (для менеджера)
    list: (page = 0, size = 1000) =>
        api.get<{ content: TaskDraft[] }>('/task-drafts', {
            params: { page, size }
        }),

    listMy: (page = 0, size = 100) =>
        api.get<{ content: TaskDraft[] }>(`/task-drafts/my`, { params: { page, size } }),

    update: (
        id: number,
        data: {
            header: string;
            body: string;
            comment?: string;
            tags?: string[];
            imageUrls?: string[];
        }
    ) => api.put<TaskDraft>(`/task-drafts/${id}`, data),
    delete: (id: number) => api.delete(`/task-drafts/${id}`)
};
