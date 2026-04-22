
import { useEffect, useState } from 'react';
import { postsApi } from '../api/posts';
import { tasksApi } from '../api/tasks';
import { taskDraftsApi } from '../api/taskDrafts';
import type { Post, Task, TaskDraft } from '../types';
import './Calendar.css';

interface CalendarPost {
    idPost: number;
    idDraftTask: number;
    title: string;
    scheduledAt: string;
    publishedAt: string | null;
    status: string;
    tags: string[];
    taskTitle: string;
}

const Calendar = () => {
    const [posts, setPosts] = useState<CalendarPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<CalendarPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Текущая дата (только 2026 год)
    const [currentDate, setCurrentDate] = useState(new Date(2026, new Date().getMonth(), 1));
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
    const [currentYear, setCurrentYear] = useState(2026);

    // Фильтры
    const [searchTitle, setSearchTitle] = useState('');
    const [searchTags, setSearchTags] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTask, setFilterTask] = useState<string>('all');
    const [tasks, setTasks] = useState<Task[]>([]);

    // Загрузка постов и задач
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Загружаем посты
            const postsRes = await postsApi.list(0, 1000);
            const allPosts = postsRes.data.content || [];

            // Загружаем задачи
            const tasksRes = await tasksApi.listMineSorted('createdAt', 'desc', 0, 1000);
            const allTasks = tasksRes.data.content || [];
            setTasks(allTasks);

            const draftsMap = new Map<number, TaskDraft>();
            // Загружаем черновики по idDraftTask из постов
            const draftIds = [...new Set(allPosts.map(p => p.idDraftTask))];
            for (const draftId of draftIds) {
                try {
                    const draftRes = await taskDraftsApi.get(draftId);  // ← нужен метод get(id)!
                    draftsMap.set(draftId, draftRes.data);
                } catch {}
            }

            // Группировка постов по idDraftTask + дата + время (убираем дубли по каналам)
            const postsMap = new Map<string, CalendarPost>();

            for (const post of allPosts) {
                if (post.status !== 'scheduled' && post.status !== 'published') continue;

                // Ключ для группировки
                const postDate = post.scheduledAt?.split('T')[0] || '';
                const postTime = post.scheduledAt?.split('T')[1]?.substring(0, 5) || '';
                const groupKey = `${post.idDraftTask}_${postDate}_${postTime}`;

                // Если уже есть такой пост - пропускаем (дубль по каналу)
                if (postsMap.has(groupKey)) continue;

                // Берём заголовок ТОЛЬКО из черновика
                const draft = draftsMap.get(post.idDraftTask);
                let title = draft?.header || 'Без названия';
                let tags: string[] = draft?.tags || [];
                let taskTitle = '';

                // Находим задачу
                const task = allTasks.find(t => t.idTask === post.idDraftTask);
                if (task) {
                    taskTitle = task.title;
                }

                // Если нет тегов из черновика, берем из брифа задачи
                if (tags.length === 0 && task?.brief) {
                    const tagsMatch = task.brief.match(/Теги:\s*([^|\n]+)/i);
                    if (tagsMatch && tagsMatch[1]) {
                        tags = tagsMatch[1].split(',').map(t => t.trim().toLowerCase());
                    }
                }

                postsMap.set(groupKey, {
                    idPost: post.idPost,
                    idDraftTask: post.idDraftTask,
                    title: title,
                    scheduledAt: post.scheduledAt,
                    publishedAt: post.publishedAt,
                    status: post.status,
                    tags: tags,
                    taskTitle: taskTitle
                });
            }

            const formattedPosts = Array.from(postsMap.values());
            setPosts(formattedPosts);
            setFilteredPosts(formattedPosts);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить публикации');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Применение фильтров
    useEffect(() => {
        let filtered = [...posts];

        if (searchTitle) {
            const query = searchTitle.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(query) ||
                post.taskTitle.toLowerCase().includes(query)
            );
        }

        if (searchTags) {
            const searchTerms = searchTags.toLowerCase().split(',').map(t => t.trim());
            filtered = filtered.filter(post =>
                    post.tags && post.tags.some(tag =>
                        searchTerms.some(term => tag.toLowerCase().includes(term))
                    )
            );
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(post => post.status === filterStatus);
        }

        if (filterTask !== 'all') {
            filtered = filtered.filter(post =>
                post.taskTitle?.toLowerCase().includes(filterTask.toLowerCase())
            );
        }

        setFilteredPosts(filtered);
    }, [posts, searchTitle, searchTags, filterStatus, filterTask]);

    const goPrevMonth = () => {
        if (currentMonth === 0) return;
        const newMonth = currentMonth - 1;
        setCurrentMonth(newMonth);
        setCurrentDate(new Date(currentYear, newMonth, 1));
    };

    const goNextMonth = () => {
        if (currentMonth === 11) return;
        const newMonth = currentMonth + 1;
        setCurrentMonth(newMonth);
        setCurrentDate(new Date(currentYear, newMonth, 1));
    };

    const getMonthName = (month: number) => {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return months[month];
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const getPostsForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayPosts = filteredPosts.filter(post => {
            const postDate = post.scheduledAt?.split('T')[0];
            return postDate === dateStr;
        });

        return dayPosts.sort((a, b) => {
            const timeA = a.scheduledAt?.split('T')[1] || '';
            const timeB = b.scheduledAt?.split('T')[1] || '';
            return timeA.localeCompare(timeB);
        });
    };

    const formatTime = (datetime: string) => {
        if (!datetime) return '';
        return datetime.split('T')[1]?.substring(0, 5) || '';
    };

    const isPublished = (post: CalendarPost) => {
        return post.status === 'published' || post.publishedAt;
    };

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const monthName = getMonthName(currentMonth);

    const clearFilters = () => {
        setSearchTitle('');
        setSearchTags('');
        setFilterStatus('all');
        setFilterTask('all');
    };

    const hasActiveFilters = searchTitle || searchTags || filterStatus !== 'all' || filterTask !== 'all';

    if (loading) {
        return <div className="calendar-page"><div className="loading-spinner">Загрузка...</div></div>;
    }

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <h1>Календарь публикаций</h1>
                <p className="subtitle">Планирование и отслеживание публикаций</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Панель фильтров */}
            <div className="filters-panel">
                <div className="filters-row">
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Поиск по названию..."
                            value={searchTitle}
                            onChange={(e) => setSearchTitle(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Поиск по тегам..."
                            value={searchTags}
                            onChange={(e) => setSearchTags(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Все статусы</option>
                            <option value="scheduled">Ожидает публикации</option>
                            <option value="published">Опубликовано</option>
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            ✕ Сбросить
                        </button>
                    )}
                </div>
                <div className="filters-stats">
                    Найдено: {filteredPosts.length} публикаций
                </div>
            </div>

            {/* Календарь */}
            <div className="calendar-container">
                <div className="calendar-nav">
                    <button className="nav-btn" onClick={goPrevMonth} disabled={currentMonth === 0}>◀</button>
                    <h2>{monthName} {currentYear}</h2>
                    <button className="nav-btn" onClick={goNextMonth} disabled={currentMonth === 11}>▶</button>
                </div>

                <div className="weekdays">
                    <div className="weekday">Пн</div>
                    <div className="weekday">Вт</div>
                    <div className="weekday">Ср</div>
                    <div className="weekday">Чт</div>
                    <div className="weekday">Пт</div>
                    <div className="weekday">Сб</div>
                    <div className="weekday">Вс</div>
                </div>

                <div className="calendar-grid">
                    {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="calendar-day empty"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const day = idx + 1;
                        const dayPosts = getPostsForDay(day);
                        const hasPosts = dayPosts.length > 0;

                        return (
                            <div key={day} className={`calendar-day ${hasPosts ? 'has-posts' : ''}`}>
                                <div className="day-number">{day}</div>
                                <div className="day-posts">
                                    {dayPosts.map((post) => (
                                        <div
                                            key={post.idPost}
                                            className={`post-card ${isPublished(post) ? 'published' : 'scheduled'}`}
                                            title={`${post.title}\nЗадача: ${post.taskTitle}\nТеги: ${post.tags.join(', ')}`}
                                        >
                                            <div className="post-time">{formatTime(post.scheduledAt)}</div>
                                            <div className="post-title">{post.title}</div>
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="post-tags">
                                                    {post.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="post-tag">#{tag}</span>
                                                    ))}
                                                    {post.tags.length > 2 && (
                                                        <span className="post-tag-more">+{post.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Легенда */}
            <div className="legend">
                <div className="legend-item">
                    <div className="legend-color published"></div>
                    <span>Опубликовано</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color scheduled"></div>
                    <span>Ожидает публикации</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;