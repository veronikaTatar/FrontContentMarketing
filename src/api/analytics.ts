
import api from './axios';
import type { PostAnalytics, TaskPerformance, GroupedPost } from '../types';

export const analyticsApi = {
    // Создать запись аналитики для поста
    create: (data: {
        idPost: number;
        actualKPI: {
            likesCount: number;
            viewsCount: number;
            repostsCount: number;
            commentsCount: number;
        };
        analyticsAt?: string;
        notes?: string;
    }) => api.post<PostAnalytics>('/post-analytics', data),

    // Получить аналитику по ID
    get: (id: number) => api.get<PostAnalytics>(`/post-analytics/${id}`),

    // Список аналитики для поста
    listByPost: (idPost: number, page = 0, size = 10) =>
        api.get<{ content: PostAnalytics[] }>('/post-analytics', {
            params: { idPost, page, size }
        }),

    // Эффективность по задаче (суммарная)
    getTaskPerformance: (taskId: number) =>
        api.get<TaskPerformance>(`/post-analytics/task/${taskId}/performance`),

    // получить сгруппированные опубликованные посты
    getPublishedPosts: () =>
        api.get<GroupedPost[]>('/post-analytics/published-posts'),

    // Удалить запись
    delete: (id: number) => api.delete(`/post-analytics/${id}`)
};