// src/pages/Tasks/TasksAuthor.tsx
import { useEffect, useState } from 'react';
import { tasksApi } from '../../api/tasks';
import { taskDraftsApi } from '../../api/taskDrafts';
import { notificationsApi } from '../../api/notifications';
import type {Task, TaskDraft, NotificationItem, Tag} from '../../types';
import { tagsApi } from '../../api/tags';

import {
    getStatusColor, getPriorityColor,
    parseBrief
} from './types';
import './TasksAuthor.css';

interface ContentFormData {
    header: string;
    body: string;
    tags: string[];
    images: string[];
    imagePreviews: string[];
    comment: string;
}

interface BriefInfo {
    topic: string;
    goal: string;
    kpi: string[];
    requiredImagesCount: number;
    description: string;
    targetAudience: string;
    style: string;
    language: string;
    mediaFormat: string;
    mandatoryTags: string[];
    additionalRequirements: string;
}

const BanIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
);

const EditIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3l4 4-7 7H10v-4l7-7z" />
        <path d="M4 20l4-4" />
    </svg>
);

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const MAX_URL_LENGTH = 200;

const TasksAuthor = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sortBy, setSortBy] = useState('priority');
    const [sortDir, setSortDir] = useState('asc');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [existingDraft, setExistingDraft] = useState<TaskDraft | null>(null);
    const [briefInfo, setBriefInfo] = useState<BriefInfo | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);

    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    const [contentForm, setContentForm] = useState<ContentFormData>({
        header: '',
        body: '',
        tags: [],
        images: [],
        imagePreviews: [],
        comment: ''
    });

    useEffect(() => {
        const loadTags = async () => {
            try {
                const res = await tagsApi.list(0, 100);
                setAvailableTags(res.data.content);
            } catch (err) {
                console.error('Failed to load tags:', err);
            }
        };
        loadTags();
    }, []);

    useEffect(() => {
        if (tagSearchTerm.trim()) {
            const filtered = availableTags.filter(tag =>
                tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags([]);
        }
    }, [tagSearchTerm, availableTags]);

    const addTag = (tagName: string) => {
        if (!contentForm.tags.includes(tagName)) {
            setContentForm(prev => ({
                ...prev,
                tags: [...prev.tags, tagName]
            }));
        }
        setTagSearchTerm('');
        setShowTagDropdown(false);
    };

    const removeTag = (tagName: string) => {
        if (briefInfo?.mandatoryTags.includes(tagName)) {
            setError(`Тег #${tagName} является обязательным и не может быть удален`);
            setTimeout(() => setError(null), 3000);
            return;
        }
        setContentForm(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagName)
        }));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagSearchTerm.trim()) {
            e.preventDefault();
            const existingTag = availableTags.find(
                t => t.name.toLowerCase() === tagSearchTerm.toLowerCase()
            );
            if (existingTag) {
                addTag(existingTag.name);
            } else {
                addTag(tagSearchTerm.trim());
            }
        }
    };

    const load = () => {
        setError(null);
        tasksApi.listMineSorted(sortBy, sortDir)
            .then((res) => setTasks(res.data.content))
            .catch((err) => {
                setTasks([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить задачи');
            });
    };

    useEffect(() => { load(); }, [sortBy, sortDir]);

    useEffect(() => {
        notificationsApi.listUnread()
            .then((res) => setNotifications(res.data))
            .catch(() => setNotifications([]));
    }, []);

    const markNotificationRead = async (id: number) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(prev => prev.filter(n => n.idNotification !== id));
        } catch { }
    };

    const handleRejectTask = async (task: Task) => {
        if (!window.confirm('Вы уверены, что хотите отказаться от этой задачи?')) {
            return;
        }
        try {
            await tasksApi.softDelete(task.idTask);  // Используем softDelete
            load();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Не удалось отказаться от задачи');
        }
    };
    const addImageUrl = (url: string) => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        if (trimmedUrl.length > 255) {
            setError(`URL слишком длинный (${trimmedUrl.length} символов). Максимум 255 символов.`);
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
            setError(`Неверный формат. URL должен начинаться с http:// или https://`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        setContentForm(prev => ({
            ...prev,
            images: [...prev.images, trimmedUrl],
            imagePreviews: [...prev.imagePreviews, trimmedUrl]
        }));
    };

    const removeImage = (index: number) => {
        setContentForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    const handlePasteUrl = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = event.clipboardData.getData('text');
        if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
            event.preventDefault();
            addImageUrl(pastedText);
        }
    };

    const parseFullBrief = (brief: string): BriefInfo => {
        const topicMatch = brief?.match(/Тематика:\s*([^|\n]+)/i);
        const goalMatch = brief?.match(/Цель:\s*([^|\n]+)/i);
        const audienceMatch = brief?.match(/Аудитория:\s*([^|\n]+)/i);
        const toneMatch = brief?.match(/Тон:\s*([^|\n]+)/i);
        const languageMatch = brief?.match(/Язык:\s*([^|\n]+)/i);
        const mediaMatch = brief?.match(/Медиа:\s*([^|,\n]+)/i);
        const imagesCountMatch = brief?.match(/кол-во:\s*(\d+)/i);

        let thesesMatch = brief?.match(/Теги:\s*([^|\n]+)/i);
        if (!thesesMatch) {
            thesesMatch = brief?.match(/тезисы:\s*([^|\n]+)/i);
        }

        const mandatoryTags: string[] = [];
        if (thesesMatch && thesesMatch[1]) {
            const tags = thesesMatch[1].split(',').map(t => t.trim().toLowerCase());
            mandatoryTags.push(...tags);
        }

        return {
            topic: topicMatch ? topicMatch[1].trim() : 'Не указано',
            goal: goalMatch ? goalMatch[1].trim() : 'Не указано',
            targetAudience: audienceMatch ? audienceMatch[1].trim() : 'Не указано',
            style: toneMatch ? toneMatch[1].trim() : 'Не указан',
            language: languageMatch ? languageMatch[1].trim() : 'Русский',
            mediaFormat: mediaMatch ? mediaMatch[1].trim() : 'JPG/PNG',
            requiredImagesCount: imagesCountMatch ? parseInt(imagesCountMatch[1]) : 1,
            mandatoryTags: mandatoryTags,
            kpi: [],
            description: '',
            additionalRequirements: 'Нет'
        };
    };

    const openDraftModal = async (task: Task) => {
        const brief = parseFullBrief(task.brief);
        setSelectedTask(task);
        setBriefInfo(brief);

        try {
            const draftsRes = await taskDraftsApi.listByTask(task.idTask, 0, 1);
            const latestDraft = draftsRes.data.content[0];

            if (latestDraft) {
                setExistingDraft(latestDraft);
                const draftTags = latestDraft.tags || [];
                const allTags = [...new Set([...brief.mandatoryTags, ...draftTags])];
                setContentForm({
                    header: latestDraft.header || task.title,
                    body: latestDraft.body || '',
                    tags: allTags,
                    images: latestDraft.imageUrls || [],
                    imagePreviews: latestDraft.imageUrls || [],
                    comment: latestDraft.comment || ''
                });
            } else {
                setExistingDraft(null);
                setContentForm({
                    header: task.title,
                    body: '',
                    tags: [...brief.mandatoryTags],
                    images: [],
                    imagePreviews: [],
                    comment: ''
                });
            }
        } catch {
            setExistingDraft(null);
            setContentForm({
                header: task.title,
                body: '',
                tags: [...brief.mandatoryTags],
                images: [],
                imagePreviews: [],
                comment: ''
            });
        }

        setShowDraftModal(true);
    };

    const closeDraftModal = () => {
        setShowDraftModal(false);
        setSelectedTask(null);
        setBriefInfo(null);
        setExistingDraft(null);
        setTagSearchTerm('');
        setShowTagDropdown(false);
        setError(null);
        setContentForm({
            header: '',
            body: '',
            tags: [],
            images: [],
            imagePreviews: [],
            comment: ''
        });
    };

    const onContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContentForm({ ...contentForm, [e.target.name]: e.target.value });
    };

    const validateImageUrls = (): string | null => {
        for (const url of contentForm.images) {
            if (url.length > 255) {
                return `URL "${url.substring(0, 50)}..." слишком длинный (${url.length} символов).`;
            }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return `URL "${url.substring(0, 50)}..." имеет неверный формат.`;
            }
        }
        return null;
    };

    const validateForSubmit = (): string | null => {
        if (!contentForm.header.trim()) {
            return 'Заголовок не может быть пустым';
        }
        if (!contentForm.body.trim()) {
            return 'Текст не может быть пустым';
        }

        const requiredCount = briefInfo?.requiredImagesCount || 1;
        if (contentForm.images.length < requiredCount) {
            return `Необходимо добавить ${requiredCount} изображений. Добавлено: ${contentForm.images.length}`;
        }

        if (briefInfo?.mandatoryTags.length) {
            const missingTags = briefInfo.mandatoryTags.filter(
                tag => !contentForm.tags.includes(tag)
            );
            if (missingTags.length > 0) {
                return `Обязательные теги не выбраны: ${missingTags.map(t => `#${t}`).join(', ')}`;
            }
        }

        return null;
    };

    const saveDraft = async () => {
        if (!selectedTask) return;
        setIsSavingDraft(true);
        setError(null);

        try {
            await taskDraftsApi.create({
                header: contentForm.header || selectedTask.title,
                body: contentForm.body || '',
                idTask: selectedTask.idTask,
                comment: contentForm.comment,
                tags: contentForm.tags,
                imageUrls: contentForm.images
            });

            if (selectedTask.status === 'пустой') {
                await tasksApi.update(selectedTask.idTask, {
                    status: 'в процессе'
                });
            }

            closeDraftModal();
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось сохранить черновик');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const submitForReview = async () => {
        if (!selectedTask) return;

        const validationError = validateForSubmit();
        if (validationError) {
            setError(validationError);
            return;
        }

        const urlError = validateImageUrls();
        if (urlError) {
            setError(urlError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await taskDraftsApi.create({
                header: contentForm.header,
                body: contentForm.body,
                idTask: selectedTask.idTask,
                comment: contentForm.comment,
                tags: contentForm.tags,
                imageUrls: contentForm.images
            });

            await tasksApi.update(selectedTask.idTask, {
                status: 'на проверке'
            });

            closeDraftModal();
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось отправить контент на проверку');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOverdue = (deadlineAt: string | null) => {
        if (!deadlineAt) return false;
        return new Date(deadlineAt) < new Date();
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    const activeTasks = tasks.filter(t => t.status !== 'удален');

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Мои задачи</h1>
                    <p className="muted">Задачи, назначенные на вас</p>
                </div>
                <div className="sort-controls">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="priority">Приоритет</option>
                        <option value="createdAt">Дата создания</option>
                        <option value="deadlineAt">Срок</option>
                    </select>
                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                        <option value="asc">По возрастанию</option>
                        <option value="desc">По убыванию</option>
                    </select>
                </div>
            </div>

            {notifications.length > 0 && (
                <div className="notifications-panel">
                    {notifications.map((item) => (
                        <div key={item.idNotification} className="notification-item">
                            <div className="notification-content">
                                <span>{item.message}</span>
                                <small>{new Date(item.createdAt).toLocaleString('ru-RU')}</small>
                            </div>
                            <button onClick={() => markNotificationRead(item.idNotification)}>
                                <CloseIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="alert-banner alert-error">
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            <div className="panel">
                <div className="table-wrapper">
                    <table className="channels-table tasks-table">
                        <thead>
                        <tr>
                            <th className="col-title">Название</th>
                            <th className="col-topic">Тематика</th>
                            <th className="col-deadline">Срок</th>
                            <th className="col-priority">Приоритет</th>
                            <th className="col-status">Статус</th>
                            <th className="col-actions">Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {activeTasks.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-4 muted">
                                    Нет активных задач
                                </td>
                            </tr>
                        ) : (
                            activeTasks.map((task) => {
                                const parsed = parseBrief(task.brief);
                                const overdue = isOverdue(task.deadlineAt);
                                const formattedDeadline = formatDate(task.deadlineAt);
                                const canWork = task.status === 'пустой' || task.status === 'в процессе' || task.status === 'отклонен';

                                return (
                                    <tr key={task.idTask}>
                                        <td className="col-title">
                                            <div className="task-title">{task.title}</div>
                                        </td>
                                        <td className="col-topic">
                                            <span className="topic-badge">{parsed.topic || '—'}</span>
                                        </td>
                                        <td className="col-deadline">
                                                <span className={overdue ? 'deadline-overdue' : 'deadline-normal'}>
                                                    {overdue && '⚠ '}{formattedDeadline}
                                                </span>
                                        </td>
                                        <td className="col-priority">
                                                <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                        </td>
                                        <td className="col-status">
                                                <span className={`status-badge status-${task.status}`}>
                                                    {task.status}
                                                </span>
                                        </td>
                                        <td className="col-actions">
                                            <div className="actions">
                                                {canWork && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => openDraftModal(task)}
                                                        title="Редактировать черновик"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                )}
                                                {(task.status === 'пустой' || task.status === 'в процессе') && (
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => handleRejectTask(task)}
                                                        title="Отказаться от задачи"
                                                    >
                                                        <BanIcon />
                                                    </button>
                                                )}
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
                    Всего задач: {activeTasks.length}
                </div>
            </div>

            {/* Модальное окно для черновика */}
            {showDraftModal && selectedTask && briefInfo && (
                <div className="modal-backdrop" onClick={closeDraftModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedTask.title}</h3>
                            <button className="modal-close" onClick={closeDraftModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            {existingDraft && (
                                <div className="version-info">
                                    Версия черновика: {existingDraft.version}
                                    {existingDraft.comment && <span> | Комментарий: {existingDraft.comment}</span>}
                                </div>
                            )}

                            <div className="brief-info">
                                <div className="brief-header">📋 Бриф</div>
                                <div className="brief-content">
                                    <div><strong>Тематика:</strong> {briefInfo.topic}</div>
                                    <div><strong>Цель:</strong> {briefInfo.goal}</div>
                                    <div><strong>Требуется изображений:</strong> {briefInfo.requiredImagesCount}</div>
                                    {briefInfo.mandatoryTags.length > 0 && (
                                        <div className="mandatory-tags-info">
                                            <strong>Обязательные теги:</strong>
                                            {briefInfo.mandatoryTags.map(tag => (
                                                <span key={tag} className="mandatory-tag-badge">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <label>Заголовок</label>
                                    <input
                                        type="text"
                                        name="header"
                                        value={contentForm.header}
                                        onChange={onContentChange}
                                        placeholder="Введите заголовок..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Текст</label>
                                    <textarea
                                        name="body"
                                        rows={8}
                                        value={contentForm.body}
                                        onChange={onContentChange}
                                        placeholder="Введите текст..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Комментарий к версии</label>
                                    <input
                                        type="text"
                                        name="comment"
                                        value={contentForm.comment}
                                        onChange={onContentChange}
                                        placeholder="Опишите изменения в этой версии"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Теги</label>
                                    <div className="tags-input-container">
                                        <div className="tags-search-wrapper">
                                            <div className="tags-search-input-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Поиск или ввод тега..."
                                                    value={tagSearchTerm}
                                                    onChange={e => setTagSearchTerm(e.target.value)}
                                                    onKeyDown={handleTagKeyDown}
                                                    onFocus={() => setShowTagDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => {
                                                        if (tagSearchTerm.trim()) {
                                                            addTag(tagSearchTerm.trim());
                                                        }
                                                    }}
                                                >
                                                    + Добавить
                                                </button>
                                            </div>

                                            {showTagDropdown && filteredTags.length > 0 && (
                                                <div className="tags-dropdown">
                                                    {filteredTags.map(tag => (
                                                        <div
                                                            key={tag.idTag}
                                                            className="tag-dropdown-item"
                                                            onClick={() => addTag(tag.name)}
                                                        >
                                                            <span className="tag-name">#{tag.name}</span>
                                                            <span className="tag-category">{tag.category}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {contentForm.tags.length > 0 && (
                                            <div className="selected-tags-container">
                                                <label className="selected-tags-label">Выбранные теги:</label>
                                                <div className="selected-tags-list">
                                                    {contentForm.tags.map(tag => {
                                                        const isMandatory = briefInfo?.mandatoryTags.includes(tag);
                                                        return (
                                                            <span key={tag} className={`selected-tag ${isMandatory ? 'mandatory' : ''}`}>
                                                                #{tag}
                                                                {!isMandatory && (
                                                                    <button
                                                                        type="button"
                                                                        className="remove-tag-btn"
                                                                        onClick={() => removeTag(tag)}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                                {isMandatory && <span className="mandatory-star">*</span>}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Изображения (URL)</label>
                                    <div className="url-input-group">
                                        <input
                                            type="text"
                                            placeholder="https://example.com/image.jpg"
                                            id="draftImageUrlInput"
                                            onPaste={handlePasteUrl}
                                        />
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => {
                                                const input = document.getElementById('draftImageUrlInput') as HTMLInputElement;
                                                if (input.value) {
                                                    addImageUrl(input.value);
                                                    input.value = '';
                                                }
                                            }}
                                        >
                                            Добавить
                                        </button>
                                    </div>

                                    {contentForm.imagePreviews.length > 0 && (
                                        <div className="image-preview-grid">
                                            {contentForm.imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="image-preview-item">
                                                    <img
                                                        src={preview}
                                                        alt={`preview-${idx}`}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error';
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-remove-image"
                                                        onClick={() => removeImage(idx)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <small className="muted">
                                        Добавлено: {contentForm.images.length} / {briefInfo.requiredImagesCount} (требуется для отправки)
                                    </small>
                                </div>

                                {error && <div className="error-message">{error}</div>}
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn secondary"
                                onClick={saveDraft}
                                disabled={isSavingDraft}
                            >
                                {isSavingDraft ? 'Сохранение...' : 'Сохранить черновик'}
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={submitForReview}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksAuthor;

// Добавить функцию getPriorityClass
const getPriorityClass = (priority: number): string => {
    if (priority <= 1) return 'priority-low';
    if (priority <= 3) return 'priority-medium';
    return 'priority-high';
};