import { useState, useEffect } from 'react';
import { tasksApi } from '../../api/tasks';
import { tagsApi } from '../../api/tags';
import type { Task, UserOption, Tag } from '../../types';
import {
    topics, initialBrief, initialKpi, formatBrief,
    parseBriefToForm, type BriefData, type KpiData
} from './types';
import './TaskModal.css';

interface TaskModalProps {
    show: boolean;
    onHide: () => void;
    onSave: () => void;
    task: Task | null;
    authors: UserOption[];
}

// Функция для получения текущего времени по МСК
const getCurrentMskTime = (): string => {
    const now = new Date();
    // Получаем смещение для МСК (UTC+3)
    const mskTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return mskTime.toISOString().slice(0, 16);
};

// Функция для проверки, является ли дата и время прошедшими по МСК
const isPastDateTime = (dateTimeStr: string): boolean => {
    if (!dateTimeStr) return false;

    const selectedDate = new Date(dateTimeStr);
    const now = new Date();
    // Переводим текущее время в МСК для корректного сравнения
    const nowMsk = new Date(now.getTime() + (3 * 60 * 60 * 1000));

    return selectedDate < nowMsk;
};

const TaskModal = ({ show, onHide, onSave, task, authors }: TaskModalProps) => {
    const [form, setForm] = useState({
        title: '',
        priority: 1,
        deadlineAt: '',
        idUser: ''
    });
    const [brief, setBrief] = useState<BriefData>(initialBrief);
    const [kpi, setKpi] = useState<KpiData>(initialKpi);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deadlineError, setDeadlineError] = useState<string | null>(null);

    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    // Минимальная дата для поля datetime-local (текущее время по МСК)
    const [minDateTime, setMinDateTime] = useState<string>('');

    useEffect(() => {
        // Устанавливаем минимальную дату при монтировании и каждую минуту обновляем
        const updateMinDateTime = () => {
            setMinDateTime(getCurrentMskTime());
        };

        updateMinDateTime();
        const interval = setInterval(updateMinDateTime, 60000); // Обновляем каждую минуту

        return () => clearInterval(interval);
    }, []);

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
        if (!selectedTags.includes(tagName)) {
            setSelectedTags([...selectedTags, tagName]);
        }
        setTagSearchTerm('');
        setShowTagDropdown(false);
    };

    const removeTag = (tagName: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tagName));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagSearchTerm.trim()) {
            e.preventDefault();
            const existingTag = availableTags.find(
                t => t.name.toLowerCase() === tagSearchTerm.toLowerCase()
            );
            if (existingTag) {
                addTag(existingTag.name);
            }
        }
    };

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || '',
                priority: task.priority || 1,
                deadlineAt: task.deadlineAt ? task.deadlineAt.slice(0, 16) : '',
                idUser: String(task.idUser || '')
            });

            if (task.brief) {
                const parsed = parseBriefToForm(task.brief);
                setBrief(parsed.brief);

                const tagsMatch = task.brief.match(/(?:Теги|Тезисы):\s*([^|\n]+)/i);
                if (tagsMatch && tagsMatch[1]) {
                    const existingTags = tagsMatch[1].split(',').map(t => t.trim());
                    setSelectedTags(existingTags);
                } else {
                    setSelectedTags([]);
                }
            } else {
                setBrief(initialBrief);
                setSelectedTags([]);
            }

            setKpi({
                targetLikes: task.targetLikes || 0,
                targetViews: task.targetViews || 0,
                targetReposts: task.targetReposts || 0,
                targetComments: task.targetComments || 0
            });

        } else {
            setForm({ title: '', priority: 1, deadlineAt: '', idUser: '' });
            setBrief(initialBrief);
            setKpi(initialKpi);
            setSelectedTags([]);
        }
    }, [task]);

    const onBriefChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        setBrief(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onKpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
        setKpi(prev => ({
            ...prev,
            [e.target.name]: isNaN(value) ? 0 : value
        }));
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Валидация даты
        if (name === 'deadlineAt') {
            if (value && isPastDateTime(value)) {
                setDeadlineError('Дата и время не могут быть раньше текущего момента (МСК)');
            } else {
                setDeadlineError(null);
            }
        }

        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Проверяем дату перед отправкой
        if (form.deadlineAt && isPastDateTime(form.deadlineAt)) {
            setDeadlineError('Дата и время не могут быть раньше текущего момента (МСК)');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const briefWithTags = {
            ...brief,
            keyTheses: selectedTags.join(', ')
        };

        const briefString = formatBrief(briefWithTags, {
            targetLikes: 0,
            targetViews: 0,
            targetReposts: 0,
            targetComments: 0
        });

        try {
            const data = {
                title: form.title,
                brief: briefString,
                priority: Number(form.priority),
                deadlineAt: form.deadlineAt || null,
                idUser: Number(form.idUser),
                targetLikes: kpi.targetLikes ?? 0,
                targetViews: kpi.targetViews ?? 0,
                targetReposts: kpi.targetReposts ?? 0,
                targetComments: kpi.targetComments ?? 0
            };
            if (task) {
                await tasksApi.update(task.idTask, data);
            } else {
                await tasksApi.create(data);
            }

            onSave();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось сохранить задачу');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    const hasMediaType = brief.mediaType && brief.mediaType !== '';

    return (
        <div className="task-modal-overlay" onClick={onHide}>
            <div className="task-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="task-modal-header">
                    <h2>{task ? 'Редактировать задачу' : 'Создать задачу'}</h2>
                    <button className="task-modal-close" onClick={onHide}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="task-modal-form">
                    <div className="task-modal-body">
                        {/* Основная информация */}
                        <div className="form-section">
                            <div className="form-row-4">
                                <div className="form-group">
                                    <label>Название задачи</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={form.title}
                                        onChange={onChange}
                                        required
                                        placeholder="Введите название..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Автор (исполнитель)</label>
                                    <select
                                        name="idUser"
                                        value={form.idUser}
                                        onChange={onChange}
                                        required
                                    >
                                        <option value="">Выберите автора</option>
                                        {authors.map((author) => (
                                            <option key={author.idUser} value={author.idUser}>
                                                {author.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Приоритет (1-5)</label>
                                    <input
                                        type="number"
                                        name="priority"
                                        min={1}
                                        max={5}
                                        value={form.priority}
                                        onChange={onChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Срок выполнения (МСК)</label>
                                    <input
                                        type="datetime-local"
                                        name="deadlineAt"
                                        value={form.deadlineAt}
                                        onChange={onChange}
                                        min={minDateTime}
                                        step="60"
                                    />
                                    {deadlineError && (
                                        <div className="field-error">{deadlineError}</div>
                                    )}
                                    <small className="field-hint">
                                        Минимальная дата: {minDateTime.replace('T', ' ')} (МСК)
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Бриф - ДВЕ КОЛОНКИ */}
                        <div className="form-section">
                            <h3>📋 Бриф на публикацию</h3>

                            <div className="two-columns-grid">
                                {/* ЛЕВАЯ КОЛОНКА */}
                                <div className="left-column">
                                    <div className="form-group">
                                        <label>Тематика</label>
                                        <select name="topic" value={brief.topic} onChange={onBriefChange}>
                                            <option value="">— Выберите —</option>
                                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {brief.topic === 'Другое' && (
                                            <input
                                                type="text"
                                                name="topicOther"
                                                value={brief.topicOther}
                                                onChange={onBriefChange}
                                                placeholder="Укажите тематику"
                                                className="mt-1"
                                            />
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Цель публикации</label>
                                        <select name="goal" value={brief.goal} onChange={onBriefChange}>
                                            <option value="">— Выберите —</option>
                                            <option value="информирование">Информирование</option>
                                            <option value="привлечение трафика">Привлечение трафика</option>
                                            <option value="повышение вовлеченности">Повышение вовлеченности</option>
                                            <option value="продажи/лиды">Продажи / Лиды</option>
                                            <option value="other">Другое</option>
                                        </select>
                                        {brief.goal === 'other' && (
                                            <input
                                                type="text"
                                                name="goalOther"
                                                value={brief.goalOther}
                                                onChange={onBriefChange}
                                                placeholder="Укажите цель"
                                                className="mt-1"
                                            />
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Аудитория</label>
                                        <select name="audience" value={brief.audience} onChange={onBriefChange}>
                                            <option value="">— Выберите —</option>
                                            <option value="новички">Новички</option>
                                            <option value="студенты">Студенты</option>
                                            <option value="предприниматели">Предприниматели</option>
                                            <option value="дети">Дети</option>
                                            <option value="пенсионеры">Пенсионеры</option>
                                            <option value="other">Другое</option>
                                        </select>
                                        {brief.audience === 'other' && (
                                            <input
                                                type="text"
                                                name="audienceOther"
                                                value={brief.audienceOther}
                                                onChange={onBriefChange}
                                                placeholder="Укажите аудиторию"
                                                className="mt-1"
                                            />
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Тон коммуникации</label>
                                        <select name="tone" value={brief.tone} onChange={onBriefChange}>
                                            <option value="">— Выберите —</option>
                                            <option value="дружелюбный">Дружелюбный</option>
                                            <option value="деловой">Деловой</option>
                                            <option value="экспертный">Экспертный</option>
                                            <option value="мотивирующий">Мотивирующий</option>
                                            <option value="other">Другое</option>
                                        </select>
                                        {brief.tone === 'other' && (
                                            <input
                                                type="text"
                                                name="toneOther"
                                                value={brief.toneOther}
                                                onChange={onBriefChange}
                                                placeholder="Укажите тон"
                                                className="mt-1"
                                            />
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Тип медиа</label>
                                        <select name="mediaType" value={brief.mediaType} onChange={onBriefChange}>
                                            <option value="">— Не требуется —</option>
                                            <option value="JPG/PNG">JPG/PNG</option>
                                            <option value="MP4">MP4</option>
                                            <option value="GIF">GIF</option>
                                        </select>
                                    </div>

                                    {hasMediaType && (
                                        <div className="form-group">
                                            <label>Количество медиа</label>
                                            <input
                                                type="number"
                                                name="mediaCount"
                                                value={brief.mediaCount}
                                                onChange={onBriefChange}
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ПРАВАЯ КОЛОНКА */}
                                <div className="right-column">
                                    <div className="form-group">
                                        <label>Язык</label>
                                        <select name="language" value={brief.language} onChange={onBriefChange}>
                                            <option value="">— Выберите —</option>
                                            <option value="русский">Русский</option>
                                            <option value="белорусский">Белорусский</option>
                                            <option value="английский">Английский</option>
                                            <option value="mixed">Смешанный</option>
                                        </select>
                                        {brief.language === 'mixed' && (
                                            <input
                                                type="text"
                                                name="languageMixed"
                                                value={brief.languageMixed}
                                                onChange={onBriefChange}
                                                placeholder="Какие языки?"
                                                className="mt-1"
                                            />
                                        )}
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
                                                        className="btn-add-tag"
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

                                            {selectedTags.length > 0 && (
                                                <div className="selected-tags-container">
                                                    <label className="selected-tags-label">Выбранные теги:</label>
                                                    <div className="selected-tags-list">
                                                        {selectedTags.map(tag => (
                                                            <span key={tag} className="selected-tag">
                                                                #{tag}
                                                                <button
                                                                    type="button"
                                                                    className="remove-tag-btn"
                                                                    onClick={() => removeTag(tag)}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* KPI */}
                        <div className="form-section">
                            <h3>🎯 KPI</h3>
                            <div className="form-row-4">
                                <div className="form-group">
                                    <label>Лайки</label>
                                    <input
                                        type="number"
                                        name="targetLikes"
                                        value={kpi.targetLikes}
                                        onChange={onKpiChange}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Просмотры</label>
                                    <input
                                        type="number"
                                        name="targetViews"
                                        value={kpi.targetViews}
                                        onChange={onKpiChange}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Репосты</label>
                                    <input
                                        type="number"
                                        name="targetReposts"
                                        value={kpi.targetReposts}
                                        onChange={onKpiChange}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Комментарии</label>
                                    <input
                                        type="number"
                                        name="targetComments"
                                        value={kpi.targetComments}
                                        onChange={onKpiChange}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {(error || deadlineError) && (
                            <div className="error-message">
                                {error || deadlineError}
                            </div>
                        )}
                    </div>

                    <div className="task-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onHide}>
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmitting || !!deadlineError}
                        >
                            {isSubmitting ? 'Сохранение...' : (task ? 'Сохранить' : 'Создать')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;