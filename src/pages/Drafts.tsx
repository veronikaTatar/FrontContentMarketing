// src/pages/Drafts.tsx
import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { taskDraftsApi } from '../api/taskDrafts';
import { tagsApi } from '../api/tags';
import type { Task, TaskDraft, Tag } from '../types';
import { parseBrief, parseFullBrief } from './Tasks/types';
import './Drafts.css';

interface ContentFormData {
    header: string;
    body: string;
    tags: string[];
    images: string[];
    imagePreviews: string[];
    comment: string;
}

const Drafts = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');

    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [existingDraft, setExistingDraft] = useState<TaskDraft | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftVersions, setDraftVersions] = useState<Map<number, TaskDraft>>(new Map());

    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [mandatoryTagsFromBrief, setMandatoryTagsFromBrief] = useState<string[]>([]);

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
        if (mandatoryTagsFromBrief.includes(tagName)) {
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

    const loadTasks = () => {
        setLoading(true);
        tasksApi.listMineSorted('createdAt', 'desc', 0, 100)
            .then(async (res) => {
                const progressTasks = res.data.content.filter(
                    (task: Task) => task.status === 'в процессе'
                );
                setTasks(progressTasks);

                const versionsMap = new Map<number, TaskDraft>();
                for (const task of progressTasks) {
                    try {
                        const draftsRes = await taskDraftsApi.listByTask(task.idTask, 0, 1);
                        if (draftsRes.data.content[0]) {
                            versionsMap.set(task.idTask, draftsRes.data.content[0]);
                        }
                    } catch {}
                }
                setDraftVersions(versionsMap);
                setError(null);
            })
            .catch((err) => {
                setTasks([]);
                setFilteredTasks([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить задачи');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        let result = [...tasks];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.title.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'title':
                    aVal = a.title;
                    bVal = b.title;
                    break;
                case 'priority':
                    aVal = a.priority;
                    bVal = b.priority;
                    break;
                case 'deadlineAt':
                    aVal = a.deadlineAt ? new Date(a.deadlineAt).getTime() : 0;
                    bVal = b.deadlineAt ? new Date(b.deadlineAt).getTime() : 0;
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

        setFilteredTasks(result);
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

    const openDraftModal = async (task: Task) => {
        setSelectedTask(task);

        const brief = parseFullBrief(task.brief);
        const mandatoryTags = brief.mandatoryTags || [];
        setMandatoryTagsFromBrief(mandatoryTags);

        try {
            const draftsRes = await taskDraftsApi.listByTask(task.idTask, 0, 10);
            const latestDraft = draftsRes.data.content[0];

            if (latestDraft) {
                setExistingDraft(latestDraft);
                const draftTags = latestDraft.tags || [];
                const allTags = [...new Set([...mandatoryTags, ...draftTags])];
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
                    tags: [...mandatoryTags],
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
                tags: [...mandatoryTags],
                images: [],
                imagePreviews: [],
                comment: ''
            });
        }

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedTask(null);
        setExistingDraft(null);
        setMandatoryTagsFromBrief([]);
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

    const validateForSubmit = (): string | null => {
        if (!contentForm.header.trim()) {
            return 'Заголовок не может быть пустым';
        }
        if (!contentForm.body.trim()) {
            return 'Текст не может быть пустым';
        }

        if (!selectedTask) return null;
        const brief = parseFullBrief(selectedTask.brief);
        const requiredCount = brief.requiredImagesCount || 1;

        if (contentForm.images.length < requiredCount) {
            return `Необходимо добавить ${requiredCount} изображений. Добавлено: ${contentForm.images.length}`;
        }

        if (mandatoryTagsFromBrief.length > 0) {
            const missingTags = mandatoryTagsFromBrief.filter(
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

            closeModal();
            loadTasks();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось сохранить черновик');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const validateImageUrls = (): string | null => {
        for (const url of contentForm.images) {
            if (url.length > 255) {
                return `URL слишком длинный (${url.length} символов). Максимум 255 символов.`;
            }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return `URL имеет неверный формат. URL должен начинаться с http:// или https://`;
            }
        }
        return null;
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

            closeModal();
            loadTasks();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось отправить на проверку');
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
                    <h1>Черновики</h1>
                    <p className="muted">Задачи в процессе выполнения</p>
                </div>
            </div>

            <div className="filters-panel">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
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
                        <table className="channels-table drafts-table">
                            <thead>
                            <tr>
                                <th className="col-title" onClick={() => handleSort('title')}>
                                    Название {getSortIcon('title')}
                                </th>
                                <th className="col-topic">Тематика</th>
                                <th className="col-goal">Цель</th>
                                <th className="col-priority" onClick={() => handleSort('priority')}>
                                    Приоритет {getSortIcon('priority')}
                                </th>
                                <th className="col-deadline" onClick={() => handleSort('deadlineAt')}>
                                    Срок {getSortIcon('deadlineAt')}
                                </th>
                                <th className="col-version">Версия</th>
                                <th className="col-updated">Обновлен</th>
                                <th className="col-actions">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredTasks.map((task) => {
                                const parsed = parseBrief(task.brief);
                                const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < new Date();
                                const latestDraft = draftVersions.get(task.idTask);

                                return (
                                    <tr key={task.idTask}>
                                        <td className="col-title">
                                            <div className="task-title">{task.title}</div>
                                        </td>
                                        <td className="col-topic">
                                            <span className="topic-badge">{parsed.topic}</span>
                                        </td>
                                        <td className="col-goal">
                                            <div className="task-goal">{parsed.goal}</div>
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
                                        <td className="col-version">
                                            <span className="version-badge">v{latestDraft?.version || 1}</span>
                                        </td>
                                        <td className="col-updated">
                                            <span className="date-text">{formatDate(latestDraft?.updatedAt || task.createdAt)}</span>
                                        </td>
                                        <td className="col-actions">
                                            <div className="actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => openDraftModal(task)}
                                                    title="Редактировать черновик"
                                                >
                                                    ✎
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 muted">
                                        {searchQuery ? 'Нет задач по вашему запросу' : 'Нет задач в процессе'}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-info" style={{ marginTop: '16px', display: 'block' }}>
                        Всего задач: {tasks.length} | Показано: {filteredTasks.length}
                    </div>
                </div>
            )}

            {/* Модальное окно для черновика */}
            {showModal && selectedTask && (() => {
                const brief = parseFullBrief(selectedTask.brief);
                return (
                    <div className="modal-backdrop" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Редактирование черновика</h3>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            <div className="modal-body">
                                {existingDraft && (
                                    <div className="version-info" style={{ marginBottom: '16px', padding: '8px 12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
                                        Версия черновика: {existingDraft.version}
                                        {existingDraft.comment && <span className="ms-2">| Комментарий: {existingDraft.comment}</span>}
                                    </div>
                                )}

                                <div className="brief-info">
                                    <div className="brief-header">📋 Бриф</div>
                                    <div className="brief-content">
                                        <div><strong>Тематика:</strong> {brief.topic}</div>
                                        <div><strong>Цель:</strong> {brief.goal}</div>
                                        <div><strong>Требуется изображений:</strong> {brief.requiredImagesCount}</div>
                                        {mandatoryTagsFromBrief.length > 0 && (
                                            <div className="mandatory-tags-info">
                                                <strong>Обязательные теги:</strong>
                                                {mandatoryTagsFromBrief.map(tag => (
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
                                            required
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
                                            required
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
                                                        style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
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
                                                            const isMandatory = mandatoryTagsFromBrief.includes(tag);
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
                                        {mandatoryTagsFromBrief.length > 0 && (
                                            <small className="muted" style={{ display: 'block', marginTop: '8px' }}>
                                                <span style={{ color: '#dc2626' }}>*</span> Обязательные теги из брифа (нельзя удалить)
                                            </small>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Изображения (URL)</label>
                                        <div className="url-input-group" style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder="https://example.com/image.jpg"
                                                id="draftImageUrlInput"
                                                onPaste={handlePasteUrl}
                                                style={{ flex: 1 }}
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
                                            <div className="image-preview-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                                                {contentForm.imagePreviews.map((preview, idx) => (
                                                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                        <img
                                                            src={preview}
                                                            alt={`preview-${idx}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
                                                            onClick={() => removeImage(idx)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <small className="muted" style={{ display: 'block', marginTop: '8px' }}>
                                            Добавлено: {contentForm.images.length} / {brief.requiredImagesCount} (требуется для отправки: {brief.requiredImagesCount})
                                        </small>
                                    </div>

                                    {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
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
                );
            })()}
        </div>
    );
};

export default Drafts;