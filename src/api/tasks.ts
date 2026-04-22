// src/api/tasks.ts
import api from './axios';
import type { Task } from '../types';

export const tasksApi = {
    listMineSorted: (by: string, dir: string, page = 0, size = 10) =>
        api.get<{ content: Task[] }>(`/tasks/my/sorted`, { params: { by, dir, page, size } }),


    softDelete: (id: number) =>
        api.delete(`/tasks/${id}/soft`),

    hardDelete: (id: number) =>
        api.delete(`/tasks/${id}/hard`),

    get: (id: number) =>
        api.get<Task>(`/tasks/${id}`),

    update: (id: number, data: Partial<Task>) =>
        api.put<Task>(`/tasks/${id}`, data),

    create: (data: any) =>
        api.post<Task>(`/tasks`, data),

    delete: (id: number) =>
        api.delete(`/tasks/${id}`),

    list: (page = 0, size = 10) =>
        api.get<{ content: Task[] }>('/tasks', { params: { page, size } })


};