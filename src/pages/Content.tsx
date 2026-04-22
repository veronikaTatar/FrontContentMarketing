// src/pages/Content.tsx
import { useEffect, useState } from 'react';
import { contentApi } from '../api/content';
import { useContentFilters } from '../hooks/useContentFilters';
import type { Content } from '../types';

const statusLabels: Record<string, string> = {
    'в процессе': 'В процессе',
    'на проверке': 'На проверке',
    'одобрен': 'Одобрен',
    'отклонен': 'Отклонён',
};

const getStatusLabel = (status: string) => statusLabels[status] || status;

const tagOptions = [
    'Контент', 'SMM', 'Реклама', 'Продажи', 'Таргет',
    'Фриланс', 'Сайты', 'SEO', 'Маркетинг', 'Релиз',
];

const ContentPage = () => {
    const [items, setItems] = useState<Content[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    //  Используем хук со стратегиями фильтрации
    const { filters, updateFilter, resetFilters, hasActiveFilters, getQueryString } = useContentFilters();

    const [form, setForm] = useState({
        title: '',
        body: '',
        status: 'в процессе',
        idTask: '',
        tags: '',
    });

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isManager = user?.role === 'MANAGER';

    // Функция поиска с использованием стратегий
    const search = () => {
        const queryString = getQueryString(); // ← вместо ручного построения!
        setError(null);

        contentApi.search(queryString)
            .then((res) => {
                setItems(res.data.content);
                setError(null);
            })
            .catch((err) => {
                setItems([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить контент');
            });
    };

    // Автоматический поиск при изменении фильтров
    useEffect(() => {
        search();
    }, [getQueryString]); // будет вызываться при каждом изменении фильтров

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await contentApi.create({
                title: form.title,
                body: form.body,
                status: form.status,
                idTask: form.idTask ? Number(form.idTask) : null,
                tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            });
            setForm({ title: '', body: '', status: 'в процессе', idTask: '', tags: '' });
            search();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось создать контент');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await contentApi.approve(id);
            search();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось утвердить контент');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await contentApi.reject(id);
            search();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось отклонить контент');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Библиотека контента</h1>
                    <p className="muted">Поиск по названию, статусу или тегам.</p>
                </div>
            </div>

            <div className="panel form-grid">
                <form className="form-grid" onSubmit={handleCreate}>
                    {/* ... форма создания контента (без изменений) ... */}
                    <label>
                        Название
                        <input name="title" value={form.title} onChange={onChange} required />
                    </label>
                    <label>
                        Статус
                        <select name="status" value={form.status} onChange={onChange}>
                            <option value="в процессе">Черновик</option>
                            <option value="на проверке">На проверке</option>
                            <option value="одобрен">Одобрен</option>
                            <option value="отклонен">Отклонён</option>
                        </select>
                    </label>
                    <label>
                        ID задачи (необязательно)
                        <input name="idTask" value={form.idTask} onChange={onChange}/>
                    </label>
                    <label>
                    Теги (через запятую)
                        <input name="tags" value={form.tags} onChange={onChange} />
                    </label>
                    <label>
                        Текст
                        <textarea name="body" value={form.body} onChange={onChange} rows={4} />
                    </label>
                    <button className="btn primary inline form-action" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Создаём...' : 'Создать контент'}
                    </button>
                </form>
                {error && <div className="error">{error}</div>}
            </div>

            {/*  СЕКЦИЯ ФИЛЬТРОВ — использует стратегии */}
            <div className="filters">
                <input
                    value={filters.title}
                    onChange={(e) => updateFilter('title', e.target.value)}
                    placeholder="Название"
                />
                <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                >
                    <option value="">Все статусы</option>
                    <option value="в процессе">В процессе</option>
                    <option value="на проверке">На проверке</option>
                    <option value="одобрен">Одобрен</option>
                    <option value="отклонен">Отклонён</option>
                </select>
                <select
                    value={filters.tags[0] || ''}
                    onChange={(e) => updateFilter('tags', e.target.value ? [e.target.value] : [])}
                >
                    <option value="">Все теги</option>
                    {tagOptions.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>

                {/* Кнопка сброса фильтров */}
                {hasActiveFilters && (
                    <button className="btn ghost" onClick={resetFilters}>
                        Сбросить фильтры
                    </button>
                )}
            </div>

            <div className="panel">
                <div className="table">
                    <div className="table-row table-head">
                        <span>Название</span>
                        <span>Статус</span>
                        <span>Теги</span>
                        <span>Текст</span>
                        {isManager && <span>Действия</span>}
                    </div>
                    {items.map((item) => (
                        <div key={item.idContent}>
                            <div className="table-row">
                                <span>{item.title}</span>
                                <span className="badge">{getStatusLabel(item.status)}</span>
                                <span>{item.tags.join(', ')}</span>
                                <span>
                                    <button
                                        className="btn ghost"
                                        type="button"
                                        onClick={() => setExpandedId(expandedId === item.idContent ? null : item.idContent)}
                                    >
                                        {expandedId === item.idContent ? 'Скрыть' : 'Показать'}
                                    </button>
                                </span>
                                {isManager && (
                                    <span>
                                        {item.status === 'на проверке' ? (
                                            <div className="row-actions">
                                                <button className="btn accent" type="button" onClick={() => handleApprove(item.idContent)}>
                                                    Утвердить
                                                </button>
                                                <button className="btn ghost" type="button" onClick={() => handleReject(item.idContent)}>
                                                    Отклонить
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </span>
                                )}
                            </div>
                            {expandedId === item.idContent && (
                                <div className="table-row">
                                    <span className="muted" style={{ gridColumn: '1 / -1' }}>
                                        {item.body}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                    {!items.length && <div className="muted">Контент не найден.</div>}
                </div>
            </div>
        </div>
    );
};

export default ContentPage;