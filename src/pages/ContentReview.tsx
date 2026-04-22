// src/pages/ContentReview.tsx
import { useEffect, useState, useMemo } from 'react';
import { tasksApi } from '../api/tasks';
import { taskDraftsApi } from '../api/taskDrafts';
import { postsApi } from '../api/posts';
import { channelsApi } from '../api/channels';
import type { Task, TaskDraft, Channel } from '../types';
import { parseBrief } from './Tasks/types';
import './ContentReview.css';

// ==================== РАБОТА С МСК ВРЕМЕНЕМ ====================

// Получить текущую дату в МСК для datetime-local input
const getCurrentMskForInput = (): string => {
    const now = new Date();
    // Добавляем 3 часа для МСК
    const mskTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

    const year = mskTime.getFullYear();
    const month = String(mskTime.getMonth() + 1).padStart(2, '0');
    const day = String(mskTime.getDate()).padStart(2, '0');
    const hours = String(mskTime.getHours()).padStart(2, '0');
    const minutes = String(mskTime.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Конвертировать datetime-local значение (МСК) в ISO строку для отправки на сервер
// Конвертировать datetime-local значение (МСК) в ISO строку для отправки на сервер
const convertMskLocalToIso = (localDateTime: string): string => {
    if (!localDateTime) return '';

    // Парсим введенную дату как МСК
    const [datePart, timePart] = localDateTime.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    // НЕ ВЫЧИТАЕМ 3 ЧАСА - сохраняем как есть
    const localDate = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),  // ← НЕ вычитаем 3 часа
        parseInt(minutes)
    ));

    return localDate.toISOString();
};

// Проверить, что выбранная дата в будущем (по МСК)
const isFutureMskDate = (localDateTime: string): boolean => {
    if (!localDateTime) return true;

    const [datePart, timePart] = localDateTime.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    // Создаем дату в МСК из введенного значения
    const selectedMsk = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours) - 3,
        parseInt(minutes)
    ));

    // Текущая дата в МСК
    const now = new Date();
    const nowMsk = new Date(now.getTime() + (3 * 60 * 60 * 1000));

    selectedMsk.setMilliseconds(0);
    nowMsk.setMilliseconds(0);

    return selectedMsk > nowMsk;
};

// Форматировать дату из ISO в читаемый вид (МСК)
const formatMskDate = (isoString: string | null | undefined): string => {
    if (!isoString) return '—';

    const date = new Date(isoString);
    // Добавляем 3 часа для отображения в МСК
    const mskDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));

    return mskDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ==================== КОНЕЦ РАБОТЫ С МСК ====================

interface PostFormData {
    idChannels: number[];
    scheduledAt: string;
}

const ContentReview = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');

    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedDraft, setSelectedDraft] = useState<TaskDraft | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPostForm, setShowPostForm] = useState(false);

    const [postForm, setPostForm] = useState<PostFormData>({
        idChannels: [],
        scheduledAt: ''
    });

    const loadTasks = () => {
        setLoading(true);
        tasksApi.listMineSorted('createdAt', 'desc', 0, 100)
            .then(async (res) => {
                const reviewTasks = res.data.content.filter(
                    (task: Task) => task.status === 'на проверке'
                );
                setTasks(reviewTasks);
                setError(null);
            })
            .catch((err) => {
                setTasks([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить задачи');
            })
            .finally(() => setLoading(false));
    };

    const loadChannels = () => {
        channelsApi.list()
            .then((res) => setChannels(res.data.content.filter((c: Channel) => c.isActive)))
            .catch(() => setChannels([]));
    };

    useEffect(() => {
        loadTasks();
        loadChannels();
    }, []);

    // Фильтрация и сортировка через useMemo
    const filteredAndSortedTasks = useMemo(() => {
        let result = [...tasks];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.assigneeName?.toLowerCase().includes(query)
            );
        }

        // Сортировка
        result.sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortBy) {
                case 'title':
                    aVal = a.title?.toLowerCase() || '';
                    bVal = b.title?.toLowerCase() || '';
                    break;
                case 'assigneeName':
                    aVal = a.assigneeName?.toLowerCase() || '';
                    bVal = b.assigneeName?.toLowerCase() || '';
                    break;
                case 'priority':
                    aVal = a.priority || 0;
                    bVal = b.priority || 0;
                    break;
                case 'deadlineAt':
                    aVal = a.deadlineAt ? new Date(a.deadlineAt).getTime() : 0;
                    bVal = b.deadlineAt ? new Date(b.deadlineAt).getTime() : 0;
                    break;
                case 'createdAt':
                    aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    break;
                default:
                    aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            }

            if (sortDir === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return result;
    }, [tasks, searchQuery, sortBy, sortDir]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
    };

    const getSortIcon = (field: string) => {
        if (sortBy !== field) return '↕';
        return sortDir === 'asc' ? '↑' : '↓';
    };

    const openReviewModal = async (task: Task) => {
        setSelectedTask(task);
        setRejectComment('');
        setShowPostForm(false);
        setPostForm({ idChannels: [], scheduledAt: '' });

        try {
            const draftsRes = await taskDraftsApi.listByTask(task.idTask, 0, 1);
            setSelectedDraft(draftsRes.data.content[0] || null);
        } catch {
            setSelectedDraft(null);
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedTask(null);
        setSelectedDraft(null);
        setRejectComment('');
        setShowPostForm(false);
        setPostForm({ idChannels: [], scheduledAt: '' });
        setError(null);
    };

    const handleReject = async () => {
        if (!selectedTask || !selectedDraft) return;
        if (!rejectComment.trim()) {
            setError('Комментарий обязателен при отклонении');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await taskDraftsApi.create({
                header: selectedDraft.header,
                body: selectedDraft.body,
                comment: `ОТКЛОНЕНО МЕНЕДЖЕРОМ: ${rejectComment}`,
                idTask: selectedTask.idTask,
                tags: selectedDraft.tags,
                imageUrls: selectedDraft.imageUrls
            });

            await tasksApi.update(selectedTask.idTask, { status: 'отклонен' });

            closeModal();
            loadTasks();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось отклонить задачу');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveAndSchedule = async () => {
        if (!selectedTask || !selectedDraft) return;

        if (!postForm.idChannels || postForm.idChannels.length === 0) {
            setError('Выберите хотя бы один канал для публикации');
            return;
        }

        // Валидация даты в МСК
        if (postForm.scheduledAt) {
            if (!isFutureMskDate(postForm.scheduledAt)) {
                setError('Дата публикации должна быть позже текущей даты и времени (МСК)');
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Конвертируем datetime-local значение в ISO для отправки на сервер
            const isoDate = postForm.scheduledAt
                ? convertMskLocalToIso(postForm.scheduledAt)
                : null;

            for (const channelId of postForm.idChannels) {
                await postsApi.create({
                    idDraftTask: selectedDraft.idTaskDraft,
                    idChannel: channelId,
                    scheduledAt: isoDate
                });
            }

            await tasksApi.update(selectedTask.idTask, { status: 'одобрен' });

            closeModal();
            loadTasks();
        } catch (err: any) {
            console.error('Publication error:', err);
            setError(err.message || 'Не удалось запланировать пост');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPriorityLabel = (priority: number) => {
        switch(priority) {
            case 1: return 'Низкий';
            case 2: return 'Ниже среднего';
            case 3: return 'Средний';
            case 4: return 'Выше среднего';
            case 5: return 'Высокий';
            default: return priority.toString();
        }
    };

    const getPriorityClass = (priority: number): string => {
        if (priority <= 1) return 'priority-low';
        if (priority <= 3) return 'priority-medium';
        return 'priority-high';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Проверка контента</h1>
                    <p className="muted">Задачи, ожидающие проверки</p>
                </div>
            </div>

            <div className="filters-panel">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Поиск по названию или автору..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="alert-banner alert-error">
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {loading && <div className="loading">Загрузка...</div>}

            {!loading && !error && (
                <div className="panel">
                    <div className="table-wrapper">
                        <table className="channels-table review-table">
                            <thead>
                            <tr>
                                <th className="col-title sortable" onClick={() => handleSort('title')}>
                                    Название {getSortIcon('title')}
                                </th>
                                <th className="col-topic">Тематика</th>
                                <th className="col-author sortable" onClick={() => handleSort('assigneeName')}>
                                    Автор {getSortIcon('assigneeName')}
                                </th>
                                <th className="col-priority sortable" onClick={() => handleSort('priority')}>
                                    Приоритет {getSortIcon('priority')}
                                </th>
                                <th className="col-deadline sortable" onClick={() => handleSort('deadlineAt')}>
                                    Срок {getSortIcon('deadlineAt')}
                                </th>
                                <th className="col-actions">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAndSortedTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 muted">
                                        {searchQuery ? 'Нет задач по вашему запросу' : 'Нет задач на проверке'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedTasks.map((task) => {
                                    const parsed = parseBrief(task.brief);
                                    const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < new Date();

                                    return (
                                        <tr key={task.idTask}>
                                            <td className="col-title">
                                                <div className="task-title">{task.title}</div>
                                            </td>
                                            <td className="col-topic">
                                                <span className="topic-badge">{parsed.topic}</span>
                                            </td>
                                            <td className="col-author">
                                                <div className="author-name">{task.assigneeName || '—'}</div>
                                                {task.assigneeEmail && (
                                                    <div className="author-email">{task.assigneeEmail}</div>
                                                )}
                                            </td>
                                            <td className="col-priority">
                                                <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </td>
                                            <td className="col-deadline">
                                                <span className={isOverdue ? 'deadline-overdue' : 'deadline-normal'}>
                                                    {isOverdue && '⚠ '}{formatDate(task.deadlineAt)}
                                                </span>
                                            </td>
                                            <td className="col-actions">
                                                <div className="actions">
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => openReviewModal(task)}
                                                        title="Проверить"
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-info">
                        Всего задач: {tasks.length} | Показано: {filteredAndSortedTasks.length}
                    </div>
                </div>
            )}

            {/* Модальное окно проверки */}
            {showModal && selectedTask && selectedDraft && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Проверка: {selectedTask.title}</h3>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="task-info">
                                <div className="info-row">
                                    <span className="label">Автор:</span>
                                    <span className="value">{selectedTask.assigneeName} ({selectedTask.assigneeEmail})</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Приоритет:</span>
                                    <span className="value">{getPriorityLabel(selectedTask.priority)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Срок:</span>
                                    <span className="value">{formatDate(selectedTask.deadlineAt)}</span>
                                </div>
                            </div>

                            <div className="draft-content">
                                <h4 className="draft-header">{selectedDraft.header}</h4>
                                <div className="draft-body">
                                    {selectedDraft.body.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                {selectedDraft.tags && selectedDraft.tags.length > 0 && (
                                    <div className="draft-tags">
                                        <strong>Теги:</strong>
                                        {selectedDraft.tags.map(tag => (
                                            <span key={tag} className="tag-badge">#{tag}</span>
                                        ))}
                                    </div>
                                )}

                                {selectedDraft.imageUrls && selectedDraft.imageUrls.length > 0 && (
                                    <div className="draft-images">
                                        <strong>Изображения:</strong>
                                        <div className="image-gallery">
                                            {selectedDraft.imageUrls.map((url, idx) => (
                                                <img
                                                    key={idx}
                                                    src={url}
                                                    alt={`image-${idx}`}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Комментарий при отклонении <span className="required-mark">*</span></label>
                                <textarea
                                    rows={3}
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder="Укажите причину отклонения..."
                                />
                            </div>

                            {showPostForm && (
                                <div className="post-form-section">
                                    <h4>Параметры публикации</h4>
                                    <div className="form-group">
                                        <label>Каналы <span className="required-mark">*</span> (можно выбрать несколько)</label>
                                        <select
                                            multiple
                                            value={postForm.idChannels.map(String)}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
                                                setPostForm({...postForm, idChannels: selected});
                                            }}
                                            className="channel-select"
                                        >
                                            {channels.map(channel => (
                                                <option key={channel.idChannel} value={channel.idChannel}>
                                                    {channel.platform === 'telegram' ? '📱' : '💬'} {channel.name}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="muted">Удерживайте Ctrl (Cmd на Mac) для выбора нескольких каналов</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Дата и время публикации (МСК)</label>
                                        <input
                                            type="datetime-local"
                                            value={postForm.scheduledAt}
                                            onChange={(e) => setPostForm({...postForm, scheduledAt: e.target.value})}
                                            min={getCurrentMskForInput()}
                                        />
                                        <small className="muted">Оставьте пустым для немедленной публикации</small>
                                    </div>
                                </div>
                            )}

                            {error && <div className="error-message">{error}</div>}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn secondary" onClick={closeModal}>
                                Отмена
                            </button>
                            <button type="button" className="btn danger" onClick={handleReject} disabled={isSubmitting}>
                                Отклонить
                            </button>
                            {!showPostForm ? (
                                <button type="button" className="btn primary" onClick={() => setShowPostForm(true)}>
                                    Одобрить и запланировать
                                </button>
                            ) : (
                                <button type="button" className="btn success" onClick={handleApproveAndSchedule} disabled={isSubmitting}>
                                    {isSubmitting ? 'Сохранение...' : 'Опубликовать'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentReview;