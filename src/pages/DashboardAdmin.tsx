// src/pages/DashboardAdmin.tsx
import { useEffect, useState } from 'react';
import { usersApi } from '../api/users';
import { tasksApi } from '../api/tasks';
import { channelsApi } from '../api/channels';
import type { UserWithStatus } from '../api/users';
import type { Task, Channel } from '../types';
import './DashboardAdmin.css';

// SVG иконки
const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09"/>
    </svg>
);

const DiscordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
    </svg>
);

const DashboardAdmin = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userStats, setUserStats] = useState({
        admin: 0,
        manager: 0,
        author: 0,
        total: 0
    });

    const [taskStats, setTaskStats] = useState({
        approved: 0,
        inProgress: 0,
        rejected: 0,
        total: 0
    });

    const [channels, setChannels] = useState<Channel[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Загружаем пользователей
            const usersRes = await usersApi.listAll();
            const users = usersRes.data.content || [];

            setUserStats({
                admin: users.filter((u: UserWithStatus) => u.role === 'ADMIN').length,
                manager: users.filter((u: UserWithStatus) => u.role === 'MANAGER').length,
                author: users.filter((u: UserWithStatus) => u.role === 'AUTHOR').length,
                total: users.length
            });

            // 2. Загружаем задачи через обычный list (не listMineSorted)
            const tasksRes = await tasksApi.list(0, 1000);
            const tasks = tasksRes.data.content || [];

            console.log('Загружено задач:', tasks.length);
            console.log('Статусы задач:', tasks.map(t => t.status));

            setTaskStats({
                approved: tasks.filter((t: Task) => t.status === 'одобрен').length,
                inProgress: tasks.filter((t: Task) => t.status === 'в процессе').length,
                rejected: tasks.filter((t: Task) => t.status === 'отклонен').length,
                total: tasks.length
            });

            // 3. Загружаем каналы
            const channelsRes = await channelsApi.list();
            const activeChannels = (channelsRes.data.content || []).filter(
                (ch: Channel) => ch.isActive
            );
            setChannels(activeChannels);

        } catch (err: any) {
            console.error('Ошибка загрузки:', err);
            setError(err?.response?.data?.message || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const getPercent = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    if (loading) {
        return (
            <div className="dashboard-admin">
                <div className="loading-spinner">Загрузка данных...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-admin">
            <div className="dashboard-header">
                <h1>Панель администратора</h1>
                <p className="subtitle">Общая статистика системы</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Блок пользователей - компактный */}
            <div className="stats-section compact">
                <h2>Пользователи</h2>
                <div className="users-row">
                    <div className="user-chip admin">
            <span className="user-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#64748b" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path d="M4.5 0A2.5 2.5 0 0 0 2 2.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2.5A2.5 2.5 0 0 0 11.5 0zM3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v10.795a4.2 4.2 0 0 0-.776-.492C11.392 12.387 10.063 12 8 12s-3.392.387-4.224.803a4.2 4.2 0 0 0-.776.492z"/>
                </svg>
            </span>
                        <span className="user-count">{userStats.admin}</span>
                        <span className="user-label">Админы</span>
                    </div>
                    <div className="user-chip manager">
            <span className="user-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#64748b" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                </svg>
            </span>
                        <span className="user-count">{userStats.manager}</span>
                        <span className="user-label">Менеджеры</span>
                    </div>
                    <div className="user-chip author">
            <span className="user-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#64748b" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                </svg>
            </span>
                        <span className="user-count">{userStats.author}</span>
                        <span className="user-label">Авторы</span>
                    </div>
                    <div className="user-chip total">
            <span className="user-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#64748b" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                </svg>
            </span>
                        <span className="user-count">{userStats.total}</span>
                        <span className="user-label">Всего</span>
                    </div>
                </div>
            </div>

            {/* Круговая диаграмма распределения задач */}
            <div className="stats-section">
                <h2>Распределение задач</h2>
                <div className="chart-container">
                    {/* Круговая диаграмма через CSS conic-gradient */}
                    <div
                        className="donut-chart"
                        style={{
                            background: `conic-gradient(
                                #10b981 0deg ${getPercent(taskStats.approved, taskStats.total) * 3.6}deg,
                                #f59e0b ${getPercent(taskStats.approved, taskStats.total) * 3.6}deg ${(getPercent(taskStats.approved, taskStats.total) + getPercent(taskStats.inProgress, taskStats.total)) * 3.6}deg,
                                #ef4444 ${(getPercent(taskStats.approved, taskStats.total) + getPercent(taskStats.inProgress, taskStats.total)) * 3.6}deg 360deg
                            )`
                        }}
                    >
                        <div className="donut-inner">
                            <span className="donut-total">{taskStats.total}</span>
                            <span className="donut-label">всего задач</span>
                        </div>
                    </div>

                    <div className="chart-legend">
                        <div className="legend-item success">
                            <span className="legend-dot"></span>
                            <span>Одобрено</span>
                            <strong>{taskStats.approved}</strong>
                        </div>
                        <div className="legend-item warning">
                            <span className="legend-dot"></span>
                            <span>В процессе</span>
                            <strong>{taskStats.inProgress}</strong>
                        </div>
                        <div className="legend-item danger">
                            <span className="legend-dot"></span>
                            <span>Отклонено</span>
                            <strong>{taskStats.rejected}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Блок каналов - компактный */}
            <div className="stats-section compact">
                <h2>Каналы</h2>
                <div className="channels-row">
                    {channels.length === 0 ? (
                        <div className="empty-channels">Нет активных каналов</div>
                    ) : (
                        channels.map((channel) => (
                            <div key={channel.idChannel} className="channel-chip">
                                <span className="channel-icon">
                                    {channel.platform === 'telegram' ? <TelegramIcon /> : <DiscordIcon />}
                                </span>
                                <span className="channel-name">{channel.name}</span>
                                <span className="channel-status active">Активен</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;