// Publications.tsx
import { useEffect, useState, useMemo } from 'react';
import { tasksApi } from '../api/tasks';
import { channelsApi } from '../api/channels';
import { postsApi } from '../api/posts';
import { taskDraftsApi } from '../api/taskDrafts';
import type { Task, Channel, Post, TaskDraft } from '../types';
import './Publications.css';

interface PublicationWithDetails {
    post: Post;
    task?: Task;
    draft?: TaskDraft;
    channel?: Channel;
}

interface GroupedPublication {
    task: Task;
    posts: PublicationWithDetails[];
}

// Иконки
const TelegramIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.665 3.717L2.947 10.5c-1.18.472-1.175 1.128-.216 1.42l4.553 1.42 10.666-6.73c.487-.296.933-.136.567.18l-8.6 7.767-.032 4.102c.45 0 .648-.2.9-.447l2.16-2.1 4.494 3.32c.828.457 1.422.22 1.627-.764l2.946-13.86c.302-1.21-.46-1.76-1.248-1.406z" fill="#26A5E4"/>
    </svg>
);

const DiscordIcon = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" fill="#5865F2"/>
    </svg>
);

// ==================== РАБОТА С МСК ВРЕМЕНЕМ ====================

// Форматировать дату из БД (которая уже в МСК) в читаемый вид
const formatMskDate = (dateFromDb: string | null | undefined): string => {
    if (!dateFromDb) return 'Не задана';

    // Дата в БД уже в МСК, парсим как локальную строку
    const date = new Date(dateFromDb);

    // Проверяем, что дата корректна
    if (isNaN(date.getTime())) {
        return dateFromDb;
    }

    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ==================== КОНЕЦ РАБОТЫ С МСК ====================

const Publications = () => {
    const [publications, setPublications] = useState<PublicationWithDetails[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Поиск и фильтры
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    // Группируем посты по idTask
    const groupedPublications = publications.reduce((acc, pub) => {
        const taskId = pub.task?.idTask;
        if (!taskId) return acc;

        if (!acc[taskId]) {
            acc[taskId] = {
                task: pub.task!,
                posts: []
            };
        }
        acc[taskId].posts.push(pub);
        return acc;
    }, {} as Record<number, GroupedPublication>);

    // Определение статуса группы
    const getGroupStatus = (group: GroupedPublication): string => {
        const allPublished = group.posts.every(p => p.post.status === 'published');
        const somePublished = group.posts.some(p => p.post.status === 'published');

        if (allPublished) return 'published';
        if (somePublished) return 'partial';
        return 'scheduled';
    };

    // Фильтрация и поиск
    const filteredGroups = useMemo(() => {
        let result = Object.values(groupedPublications);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(group =>
                group.task.title.toLowerCase().includes(query) ||
                group.task.assigneeName?.toLowerCase().includes(query)
            );
        }

        if (filterStatus !== 'all') {
            result = result.filter(group => getGroupStatus(group) === filterStatus);
        }

        return result;
    }, [groupedPublications, searchQuery, filterStatus]);

    // Пагинированные данные
    const paginatedGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredGroups, currentPage]);

    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

    // Сброс страницы при изменении фильтров
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const channelsRes = await channelsApi.list();
            const activeChannels = channelsRes.data.content.filter(
                (ch: Channel) => ch.isActive && (ch.platform === 'telegram' || ch.platform === 'discord')
            );
            setChannels(activeChannels);

            const postsRes = await postsApi.list(0, 100);
            const posts = postsRes.data.content;

            const publicationsWithDetails = await Promise.all(
                posts.map(async (post: Post) => {
                    try {
                        const draftRes = await taskDraftsApi.get(post.idDraftTask);
                        const draft = draftRes.data;

                        const taskRes = await tasksApi.get(draft.idTask);
                        const task = taskRes.data;

                        const channel = activeChannels.find(
                            (ch: Channel) => ch.idChannel === post.idChannel
                        );

                        return { post, draft, task, channel };
                    } catch (err) {
                        console.error(`Failed to load details for post ${post.idPost}`, err);
                        return null;
                    }
                })
            );

            const validPublications = publicationsWithDetails.filter(
                (pub): pub is PublicationWithDetails =>
                    pub !== null && pub.task?.status === 'одобрен'
            );

            setPublications(validPublications);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить публикации');
            setPublications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAll = async (group: GroupedPublication) => {
        if (getGroupStatus(group) === 'published') return;

        if (!window.confirm(`Отменить ВСЕ публикации для "${group.task.title}"? Задача вернется в статус "На проверке".`)) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            for (const pub of group.posts) {
                await postsApi.delete(pub.post.idPost);
            }
            await tasksApi.update(group.task.idTask, { status: 'на проверке' });

            loadData();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось отменить публикации');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublishNow = async (post: PublicationWithDetails) => {
        const platformName = post.channel?.platform === 'telegram' ? 'Telegram' : 'Discord';

        if (!window.confirm(`Опубликовать пост в ${platformName} сейчас?`)) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const accessToken = localStorage.getItem('token');
            const message = `${post.draft?.header}\n\n${post.draft?.body}`;
            const imageUrls = post.draft?.imageUrls || [];
            const tags = post.draft?.tags || [];

            const endpoint = post.channel?.platform === 'telegram'
                ? `/api/channels/${post.post.idChannel}/publish`
                : `/api/channels/${post.post.idChannel}/publish-discord`;

            const response = await fetch(`http://localhost:8081${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, imageUrls, tags })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка публикации');
            }

            await postsApi.update(post.post.idPost, {
                status: 'published',
                publishedAt: new Date().toISOString()
            });

            loadData();
            alert(`✅ Пост успешно опубликован в ${platformName}!`);
        } catch (err: any) {
            setError(err.message || 'Не удалось опубликовать пост');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusText = (post: Post) => {
        if (post.status === 'published') return 'Опубликовано';
        if (post.status === 'failed') return 'Ошибка';
        if (!post.scheduledAt) return 'Не запланирована';

        // Сравниваем дату из БД (уже МСК) с текущим временем
        const scheduledDate = new Date(post.scheduledAt);
        const now = new Date();

        if (scheduledDate.getTime() > now.getTime()) return 'Запланирована';
        return 'Ожидает';
    };

    const getStatusClass = (post: Post) => {
        if (post.status === 'published') return 'status-published';
        if (post.status === 'failed') return 'status-failed';
        if (!post.scheduledAt) return 'status-none';

        const scheduledDate = new Date(post.scheduledAt);
        const now = new Date();

        if (scheduledDate.getTime() > now.getTime()) return 'status-scheduled';
        return 'status-pending';
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
    };

    const hasActiveFilters = searchQuery !== '' || filterStatus !== 'all';

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Публикации</h1>
                    <p className="muted">Управление запланированными и опубликованными постами</p>
                </div>
            </div>

            {/* Поиск и фильтры */}
            <div className="filters-panel">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Поиск по названию или автору..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="status-filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Все статусы</option>
                        <option value="published">Опубликовано</option>
                        <option value="partial">Частично</option>
                        <option value="scheduled">Запланировано</option>
                    </select>
                    {hasActiveFilters && (
                        <button className="btn-reset" onClick={clearFilters}>
                            ✕ Сбросить
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            <div className="panel">
                {loading && <div className="loading">Загрузка публикаций...</div>}

                {!loading && (
                    <>
                        <div className="table-wrapper">
                            <table className="table publications-table">
                                <thead>
                                <tr>
                                    <th style={{ width: '20%' }}>Пост</th>
                                    <th style={{ width: '15%' }}>Автор</th>
                                    <th style={{ width: '40%' }}>Каналы</th>
                                    <th style={{ width: '15%' }}>Дата публикации (МСК)</th>
                                    <th style={{ width: '10%' }}>Действия</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-message">
                                            {hasActiveFilters ? 'Нет публикаций по выбранным фильтрам' : 'Нет запланированных публикаций'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedGroups.map((group) => {
                                        const firstPost = group.posts[0];
                                        const hasMultipleChannels = group.posts.length > 1;
                                        const groupStatus = getGroupStatus(group);
                                        const isPublished = groupStatus === 'published';

                                        return (
                                            <tr key={group.task.idTask} className={hasMultipleChannels ? 'grouped-row' : ''}>
                                                <td className="post-cell">
                                                    <div className="post-title">{group.task.title}</div>
                                                    {hasMultipleChannels && (
                                                        <div className="channels-count">
                                                            {group.posts.length} канала
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="author-cell">
                                                    <div className="author-name">{group.task.assigneeName || 'Неизвестно'}</div>
                                                    <div className="author-email">{group.task.assigneeEmail}</div>
                                                </td>
                                                <td className="channels-cell">
                                                    <div className="channels-list">
                                                        {group.posts.map((pub) => (
                                                            <div key={pub.post.idPost} className="channel-row">
                                                                <div className="channel-info">
                                                                        <span className="platform-icon">
                                                                            {pub.channel?.platform === 'telegram' ? <TelegramIcon /> : <DiscordIcon />}
                                                                        </span>
                                                                    <span className="channel-name">
                                                                            {pub.channel?.name || '—'}
                                                                        </span>
                                                                </div>
                                                                <div className="channel-status">
                                                                        <span className={`status-badge ${getStatusClass(pub.post)}`}>
                                                                            {getStatusText(pub.post)}
                                                                        </span>
                                                                </div>
                                                                <div className="channel-actions">
                                                                    {/* Только кнопка "Опубликовать сейчас" для постов с истекшим временем */}
                                                                    {pub.post.scheduledAt && pub.post.status !== 'published' && (() => {
                                                                        const scheduledDate = new Date(pub.post.scheduledAt);
                                                                        const now = new Date();
                                                                        return scheduledDate <= now;
                                                                    })() && (
                                                                        <button
                                                                            className="btn-text-small publish"
                                                                            onClick={() => handlePublishNow(pub)}
                                                                            title="Опубликовать сейчас"
                                                                        >
                                                                            ▶
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="date-cell">
                                                    <div className="publish-date">
                                                        {formatMskDate(firstPost.post.scheduledAt)}
                                                    </div>
                                                </td>
                                                <td className="actions-cell">
                                                    {!isPublished && (
                                                        <button
                                                            className="btn-cancel"
                                                            onClick={() => handleCancelAll(group)}
                                                            title="Отменить публикацию"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Пагинация */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ← Назад
                                </button>
                                <span className="pagination-info">
                                    Страница {currentPage} из {totalPages}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Вперед →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Publications;