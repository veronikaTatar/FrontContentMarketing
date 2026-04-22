// src/pages/DashboardAuthor.tsx
import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { taskDraftsApi } from '../api/taskDrafts';
import { notificationsApi } from '../api/notifications';
import type { Task, TaskDraft, NotificationItem } from '../types';
import './DashboardAuthor.css';

// SVG иконки (серые)
const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#64748b" viewBox="0 0 16 16">
        <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2z"/>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#64748b" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#64748b" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#64748b" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#64748b" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#64748b" viewBox="0 0 16 16">
        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>
    </svg>
);

const DashboardAuthor = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [drafts, setDrafts] = useState<TaskDraft[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const tasksRes = await tasksApi.listMineSorted('createdAt', 'desc', 0, 100);
            setTasks(tasksRes.data.content || []);

            const draftsRes = await taskDraftsApi.listMy(0, 100);
            setDrafts(draftsRes.data.content || []);

            const notifRes = await notificationsApi.listUnread();
            setNotifications(notifRes.data || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const taskStats = {
        empty: tasks.filter(t => t.status === 'пустой').length,
        inProgress: tasks.filter(t => t.status === 'в процессе').length,
        review: tasks.filter(t => t.status === 'на проверке').length,
        rejected: tasks.filter(t => t.status === 'отклонен').length,
        approved: tasks.filter(t => t.status === 'одобрен').length,
        total: tasks.length
    };

    if (loading) {
        return <div className="dashboard-author"><div className="loading-spinner">Загрузка...</div></div>;
    }

    return (
        <div className="dashboard-author">
            <div className="dashboard-header">
                <h1>Панель статистики</h1>
                <p className="subtitle">Добро пожаловать! Вот сводка по вашим задачам</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="stats-section">
                <h2>Прогресс по задачам</h2>
                <div className="stats-cards">
                    <div className="stat-card">
                        <div className="stat-icon"><FileIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{taskStats.empty}</span>
                            <span className="stat-label">Новых</span>
                        </div>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-icon"><RefreshIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{taskStats.inProgress}</span>
                            <span className="stat-label">В процессе</span>
                        </div>
                    </div>
                    <div className="stat-card info">
                        <div className="stat-icon"><SearchIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{taskStats.review}</span>
                            <span className="stat-label">На проверке</span>
                        </div>
                    </div>
                    <div className="stat-card danger">
                        <div className="stat-icon"><XIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{taskStats.rejected}</span>
                            <span className="stat-label">Отклонено</span>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon"><CheckIcon /></div>
                        <div className="stat-info">
                            <span className="stat-value">{taskStats.approved}</span>
                            <span className="stat-label">Одобрено</span>
                        </div>
                    </div>
                </div>
            </div>

            {notifications.length > 0 && (
                <div className="stats-section">
                    <h2>Уведомления</h2>
                    <div className="notifications-list">
                        {notifications.slice(0, 5).map((n) => (
                            <div key={n.idNotification} className="notification-item">
                                <span className="notification-message">{n.message}</span>
                                <small className="notification-date">
                                    {new Date(n.createdAt).toLocaleDateString('ru-RU')}
                                </small>
                            </div>
                        ))}
                    </div>
                </div>
            )}


        </div>
    );
};

export default DashboardAuthor;