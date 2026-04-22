// src/pages/DashboardManager.tsx
import React, { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { analyticsApi } from '../api/analytics';
import { channelsApi } from '../api/channels';
import type { Task, GroupedPost, TaskPerformance, Channel } from '../types';
import KPIInputForm from '../components/Analytics/KPIInputForm';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import './DashboardManager.css';

// Тип для нагрузки сотрудника
interface EmployeeLoad {
    userId: number;
    userName: string;
    userEmail: string;
    emptyTasks: number;
    inProgressTasks: number;
    totalActiveTasks: number;
    nearestDeadline: string | null;
    nearestDeadlineDate: Date | null;
}

const DashboardManager: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [taskStats, setTaskStats] = useState({
        empty: 0, inProgress: 0, review: 0, rejected: 0, approved: 0, total: 0
    });

    const [taskPerformance, setTaskPerformance] = useState<TaskPerformance | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [groupedPosts, setGroupedPosts] = useState<GroupedPost[]>([]);

    // 🔥 Состояние для нагрузки сотрудников
    const [employees, setEmployees] = useState<EmployeeLoad[]>([]);

    // 🔥 Состояние для каналов
    const [channels, setChannels] = useState<Channel[]>([]);
    const [editingChannelId, setEditingChannelId] = useState<number | null>(null);
    const [subscribersInput, setSubscribersInput] = useState<string>('');

    // Форма ввода KPI
    const [showKPIForm, setShowKPIForm] = useState<boolean>(false);
    const [selectedPostForKPI, setSelectedPostForKPI] = useState<{
        postId: number;
        header: string;
        channelName: string;
        platform: string;
        desiredKPI?: any;
    } | null>(null);

    // Загрузка каналов
    const loadChannels = async () => {
        try {
            const response = await channelsApi.list();
            setChannels(response.data.content || []);
        } catch (err) {
            console.error('Failed to load channels:', err);
        }
    };

    // 🔥 Форматирование даты
    const formatDate = (date: Date | string | null): string => {
        if (!date) return '—';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // 🔥 Форматирование имени сотрудника
    const formatEmployeeName = (fullName: string): string => {
        if (!fullName || fullName === '—') return fullName;
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]} ${parts[1].charAt(0)}.`;
        if (parts.length >= 3) return `${parts[0]} ${parts[1].charAt(0)}. ${parts[2].charAt(0)}.`;
        return fullName;
    };

    // 🔥 Определение класса для дедлайна
    const getDeadlineClass = (deadline: string | null): string => {
        if (!deadline) return '';
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) return 'deadline-overdue';
        if (diffDays <= 2) return 'deadline-urgent';
        if (diffDays <= 5) return 'deadline-soon';
        return '';
    };

    // 🔥 Выгрузка отчета в Excel
    const downloadEmployeeLoadReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/reports/employee-load', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Ошибка генерации отчета');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nagruzka_sotrudnikov_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('Не удалось скачать отчет: ' + err);
        }
    };

    // 🔥 Получение общего количества подписчиков для выбранной задачи
    const getTotalSubscribersForTask = (taskId: number): number => {
        const taskChannels = new Set<number>();
        groupedPosts.forEach(post => {
            post.channels.forEach(channel => {
                taskChannels.add(channel.channelId);
            });
        });

        let totalSubs = 0;
        taskChannels.forEach(channelId => {
            const channel = channels.find(c => c.idChannel === channelId);
            if (channel) {
                totalSubs += channel.subscribersCount || 0;
            }
        });

        console.log(`📊 Total subscribers for task ${taskId}: ${totalSubs}`);
        return totalSubs;
    };

    const updateSubscribersCount = async (channelId: number, count: number) => {
        try {
            await channelsApi.updateSubscribers(channelId, count);
            await loadChannels();
            setEditingChannelId(null);
            setSubscribersInput('');
        } catch (err: any) {
            console.error('Failed to update subscribers count:', err);
            alert('Ошибка при обновлении количества подписчиков');
        }
    };

    // Загрузка опубликованных постов с аналитикой
    const loadPublishedPosts = async () => {
        try {
            const response = await analyticsApi.getPublishedPosts();
            setGroupedPosts(response.data);
        } catch (err) {
            console.error('Failed to load published posts:', err);
        }
    };

    // Загрузка статистики по задачам и нагрузке сотрудников
    const loadDashboardData = async () => {
        try {
            const tasksRes = await tasksApi.listMineSorted('createdAt', 'desc', 0, 1000);
            const tasks = tasksRes.data.content || [];

            setTaskStats({
                empty: tasks.filter((t: Task) => t.status === 'пустой').length,
                inProgress: tasks.filter((t: Task) => t.status === 'в процессе').length,
                review: tasks.filter((t: Task) => t.status === 'на проверке').length,
                rejected: tasks.filter((t: Task) => t.status === 'отклонен').length,
                approved: tasks.filter((t: Task) => t.status === 'одобрен').length,
                total: tasks.length
            });

            setAvailableTasks(tasks);

            // 🔥 Группировка по сотрудникам для диаграммы нагрузки
            const employeeMap = new Map<number, EmployeeLoad>();

            tasks.forEach((task: Task) => {
                const userId = task.idUser;
                if (!userId) return;

                if (!employeeMap.has(userId)) {
                    employeeMap.set(userId, {
                        userId: userId,
                        userName: task.assigneeName || `Пользователь ${userId}`,
                        userEmail: task.assigneeEmail || '',
                        emptyTasks: 0,
                        inProgressTasks: 0,
                        totalActiveTasks: 0,
                        nearestDeadline: null,
                        nearestDeadlineDate: null
                    });
                }

                const employee = employeeMap.get(userId)!;

                if (task.status === 'пустой') {
                    employee.emptyTasks++;
                    employee.totalActiveTasks++;
                } else if (task.status === 'в процессе') {
                    employee.inProgressTasks++;
                    employee.totalActiveTasks++;
                }

                if ((task.status === 'пустой' || task.status === 'в процессе') && task.deadlineAt) {
                    const deadlineDate = new Date(task.deadlineAt);
                    if (!employee.nearestDeadlineDate || deadlineDate < employee.nearestDeadlineDate) {
                        employee.nearestDeadlineDate = deadlineDate;
                        employee.nearestDeadline = formatDate(deadlineDate);
                    }
                }
            });

            const employeesList = Array.from(employeeMap.values())
                .filter(emp => emp.totalActiveTasks > 0)
                .sort((a, b) => b.totalActiveTasks - a.totalActiveTasks);

            setEmployees(employeesList);

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить данные');
        }
    };

    // Загрузка эффективности по задаче
    const loadTaskPerformance = async (taskId: number) => {
        if (!taskId) return;

        try {
            setError(null);
            const response = await analyticsApi.getTaskPerformance(taskId);

            console.log('TaskPerformance response:', response.data);

            if (response.data) {
                const data = response.data;

                const taskPerf: TaskPerformance = {
                    taskId: data.taskId,
                    totalActual: data.totalActual || {
                        targetLikes: 0, targetViews: 0, targetReposts: 0, targetComments: 0
                    },
                    desiredKPI: data.desiredKPI || {
                        targetLikes: 0, targetViews: 0, targetReposts: 0, targetComments: 0
                    },
                    achievement: data.achievement || {
                        likesPercent: 0, viewsPercent: 0, repostsPercent: 0,
                        commentsPercent: 0, overallPercent: 0
                    },
                    postsCount: data.postsCount || 0
                };

                setTaskPerformance(taskPerf);
                setSelectedTaskId(taskId);
            } else {
                setTaskPerformance(null);
            }
        } catch (err: any) {
            console.error('Failed to load task performance:', err);
            setError(err?.response?.data?.message || 'Не удалось загрузить данные');
            setTaskPerformance(null);
        }
    };

    // Сохранение аналитики
    const handleSaveAnalytics = async (data: {
        likes: number;
        views: number;
        reposts: number;
        comments: number;
        notes: string;
    }) => {
        if (!selectedPostForKPI) return;

        try {
            await analyticsApi.create({
                idPost: selectedPostForKPI.postId,
                actualKPI: {
                    likesCount: data.likes,
                    viewsCount: data.views,
                    repostsCount: data.reposts,
                    commentsCount: data.comments
                },
                notes: data.notes,
                analyticsAt: new Date().toISOString()
            });

            setShowKPIForm(false);
            setSelectedPostForKPI(null);

            await loadPublishedPosts();
            if (selectedTaskId) {
                await loadTaskPerformance(selectedTaskId);
            }
        } catch (err) {
            console.error('Failed to save analytics:', err);
            alert('Ошибка при сохранении аналитики');
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadDashboardData();
            await loadPublishedPosts();
            await loadChannels();
            setLoading(false);
        };
        init();
    }, []);

    // Получение общего количества подписчиков для поста
    const getTotalSubscribers = (group: GroupedPost): number => {
        return group.channels.reduce((sum, ch) => {
            return sum + (ch.subscribersCount || 0);
        }, 0);
    };

    // Максимальное количество задач для шкалы
    const maxTasks = employees.length > 0 ? Math.max(...employees.map(e => e.totalActiveTasks), 5) : 5;

    if (loading) {
        return (
            <div className="dashboard-manager">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-manager">
            <div className="dashboard-header">
                <h1>Дашборд контента</h1>
                <p className="subtitle">Анализ эффективности контента и нагрузки сотрудников</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* 🔥 СЕКЦИЯ УПРАВЛЕНИЯ ПОДПИСЧИКАМИ КАНАЛОВ */}
            <div className="stats-section">
                <div className="section-header">
                    <h2> Каналы и подписчики</h2>
                    <span className="channels-count">{channels.filter(c => c.isActive).length} активных</span>
                </div>
                <div className="channels-subscribers-grid">
                    {channels.filter(c => c.isActive).map(channel => (
                        <div key={channel.idChannel} className="channel-subscriber-card">
                            <div className="channel-info">
                                <span className={`platform-icon ${channel.platform}`}>
                                    {channel.platform === 'telegram' ? '📱' : '🎮'}
                                </span>
                                <span className="channel-name" title={channel.name}>{channel.name}</span>
                            </div>

                            {editingChannelId === channel.idChannel ? (
                                <div className="subscriber-edit">
                                    <input
                                        type="number"
                                        min="0"
                                        value={subscribersInput}
                                        onChange={(e) => setSubscribersInput(e.target.value)}
                                        placeholder="Кол-во"
                                        autoFocus
                                    />
                                    <button
                                        className="btn-save"
                                        onClick={() => updateSubscribersCount(channel.idChannel, parseInt(subscribersInput) || 0)}
                                        title="Сохранить"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className="btn-cancel"
                                        onClick={() => {
                                            setEditingChannelId(null);
                                            setSubscribersInput('');
                                        }}
                                        title="Отмена"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="subscriber-display">
                                    <div>
                                        <span className="subscriber-count">
                                            {channel.subscribersCount?.toLocaleString() || '0'}
                                        </span>
                                        <span className="subscriber-label">подписчиков</span>
                                    </div>
                                    <button
                                        className="btn-edit"
                                        onClick={() => {
                                            setEditingChannelId(channel.idChannel);
                                            setSubscribersInput((channel.subscribersCount || 0).toString());
                                        }}
                                        title="Редактировать"
                                    >
                                        ✎
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* Таблица опубликованных постов */}
            <div className="stats-section">
                <div className="section-header-with-button">
                    <h2> Ввод фактических показателей</h2>
                </div>
                {groupedPosts.length === 0 ? (
                    <div className="empty-state">Нет опубликованных постов</div>
                ) : (
                    <div className="posts-table-container">
                        <table className="table-compact">
                            <thead>
                            <tr>
                                <th>Название</th>
                                <th>Каналы</th>
                                <th>Подписчики</th>
                                <th>Фактические KPI</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {groupedPosts.map((group) => {
                                const kpi = group.totalActualKPI;
                                const firstChannel = group.channels[0];
                                const totalSubs = getTotalSubscribers(group);

                                return (
                                    <tr key={group.draftId}>
                                        <td className="post-title-cell">
                                            <div className="post-title" title={group.header}>
                                                {group.header}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="channels-list">
                                                {group.channels.map((ch, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="platform-badge"
                                                        data-platform={ch.platform}
                                                    >
                                                        {ch.platform === 'telegram' ? '📱' : '🎮'} {ch.channelName}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="subscribers-summary">
                                                <span className="total-subs">{totalSubs.toLocaleString()}</span>
                                                <span className="subs-label">подписчиков</span>
                                            </div>
                                        </td>
                                        <td>
                                            {group.hasAnalytics ? (
                                                <div className="kpi-values">
                                                    <span className="kpi-badge" title="Лайки">👍 {kpi.likesCount}</span>
                                                    <span className="kpi-badge" title="Просмотры">👁️ {kpi.viewsCount}</span>
                                                    <span className="kpi-badge" title="Репосты">🔄 {kpi.repostsCount}</span>
                                                    <span className="kpi-badge" title="Комментарии">💬 {kpi.commentsCount}</span>
                                                </div>
                                            ) : (
                                                <span className="no-data">Нет данных</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-add-analytics"
                                                onClick={() => {
                                                    setSelectedPostForKPI({
                                                        postId: firstChannel.postId,
                                                        header: group.header,
                                                        channelName: firstChannel.channelName,
                                                        platform: firstChannel.platform
                                                    });
                                                    setShowKPIForm(true);
                                                }}
                                            >
                                                {group.hasAnalytics ? '✏️ Обновить' : '+ Ввести KPI'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Анализ эффективности */}
            <div className="stats-section">
                <div className="section-header-with-button">
                    <h2> Анализ эффективности контента</h2>
                    <select
                        className="task-selector"
                        onChange={(e) => {
                            const taskId = e.target.value ? Number(e.target.value) : null;
                            if (taskId) {
                                loadTaskPerformance(taskId);
                            } else {
                                setSelectedTaskId(null);
                                setTaskPerformance(null);
                            }
                        }}
                        value={selectedTaskId || ''}
                    >
                        <option value="">Выберите задачу</option>
                        {availableTasks.map(task => (
                            <option key={task.idTask} value={task.idTask}>
                                #{task.idTask} - {task.title}
                            </option>
                        ))}
                    </select>
                </div>

                {taskPerformance ? (
                    <PerformanceChart
                        actualKPI={taskPerformance.totalActual}
                        desiredKPI={taskPerformance.desiredKPI}
                        title={`Задача #${taskPerformance.taskId} (${taskPerformance.postsCount} постов)`}
                        totalSubscribers={selectedTaskId ? getTotalSubscribersForTask(selectedTaskId) : 0}
                    />
                ) : (
                    <div className="empty-state">
                        {selectedTaskId ? 'Загрузка данных...' : 'Выберите задачу для просмотра эффективности'}
                    </div>
                )}
            </div>



            {/* 🔥 ГОРИЗОНТАЛЬНАЯ ДИАГРАММА НАГРУЗКИ СОТРУДНИКОВ */}
            <div className="stats-section">
                <div className="section-header-with-button">
                    <h2> Нагрузка сотрудников</h2>
                    <button
                        className="btn-report-small"
                        onClick={downloadEmployeeLoadReport}
                        title="Скачать отчет в Excel"
                    >
                        Выгрузить Excel
                    </button>
                </div>
                {employees.length === 0 ? (
                    <div className="empty-state">Нет активных задач у сотрудников</div>
                ) : (
                    <div className="horizontal-bar-chart">
                        {employees.map((emp) => {
                            const emptyPercent = (emp.emptyTasks / maxTasks) * 100;
                            const progressPercent = (emp.inProgressTasks / maxTasks) * 100;

                            return (
                                <div key={emp.userId} className="bar-row">
                                    <div className="bar-label">
                                        <span className="employee-name">
                                            {formatEmployeeName(emp.userName)}
                                        </span>
                                        <div className="deadline-info">
                                            <span className="deadline-label">Ближайший дедлайн:</span>
                                            <span className={`deadline-value ${getDeadlineClass(emp.nearestDeadline)}`}>
                                                {emp.nearestDeadline || '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bar-container">
                                        <div className="bar-stack">
                                            <div
                                                className="bar-segment bar-empty"
                                                style={{ width: `${emptyPercent}%` }}
                                                title={`Новых задач: ${emp.emptyTasks}`}
                                            >
                                                {emp.emptyTasks > 0 && <span className="bar-label-text">{emp.emptyTasks}</span>}
                                            </div>
                                            <div
                                                className="bar-segment bar-progress"
                                                style={{ width: `${progressPercent}%` }}
                                                title={`В процессе: ${emp.inProgressTasks}`}
                                            >
                                                {emp.inProgressTasks > 0 && <span className="bar-label-text">{emp.inProgressTasks}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Модальное окно для ввода KPI */}
            {showKPIForm && selectedPostForKPI && (
                <KPIInputForm
                    postId={selectedPostForKPI.postId}
                    postTitle={selectedPostForKPI.header}
                    channelName={selectedPostForKPI.channelName}
                    platform={selectedPostForKPI.platform}
                    onSubmit={handleSaveAnalytics}
                    onCancel={() => {
                        setShowKPIForm(false);
                        setSelectedPostForKPI(null);
                    }}
                />
            )}
        </div>
    );
};

export default DashboardManager;