import api from './axios';
import type { NotificationItem } from '../types';

export const notificationsApi = {
    listUnread: () => api.get<NotificationItem[]>('/notifications/my'),
    markAllRead: () => api.patch('/notifications/my/read-all'),
};
