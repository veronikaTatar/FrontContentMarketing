// src/pages/Tags.tsx
import { useEffect, useState } from 'react';
import { tagsApi } from '../api/tags';
import type { Tag } from '../types';
import './Tags.css';

const Tags = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTag, setNewTag] = useState({ name: '', category: 'general' });
    const [newCategory, setNewCategory] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);

    // Пагинация для категорий (по 7 на страницу)
    const [categoryPage, setCategoryPage] = useState(0);
    const categoriesPerPage = 7;

    // Пагинация для тегов (по 5 на страницу)
    const [tablePage, setTablePage] = useState(0);
    const tagsPerPage = 5;

    useEffect(() => {
        loadTags();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredTags(tags);
        } else {
            setFilteredTags(tags.filter(tag => tag.category === selectedCategory));
        }
        setTablePage(0);
    }, [selectedCategory, tags]);

    const loadTags = async () => {
        setLoading(true);
        try {
            const res = await tagsApi.list(0, 1000);
            setTags(res.data.content);
            const uniqueCategories = Array.from(
                new Set(res.data.content.map((tag: Tag) => tag.category))
            ).filter(Boolean) as string[];
            setCategories(uniqueCategories);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить теги');
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const validateTagName = (name: string): boolean => {
        return !/\s/.test(name);
    };

    const handleTagNameChange = (value: string) => {
        const nameWithoutSpaces = value.replace(/\s/g, '');
        setNewTag({...newTag, name: nameWithoutSpaces});
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.name.trim()) return;

        if (!validateTagName(newTag.name)) {
            setError('Название тега не должно содержать пробелы');
            return;
        }

        try {
            await tagsApi.create(newTag);
            setNewTag({ name: '', category: newTag.category });
            loadTags();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось создать тег');
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.trim()) return;
        const categoryWithoutSpaces = newCategory.replace(/\s/g, '');
        if (!categoryWithoutSpaces) return;
        if (!categories.includes(categoryWithoutSpaces)) {
            setCategories([...categories, categoryWithoutSpaces]);
            setNewTag({ ...newTag, category: categoryWithoutSpaces });
        }
        setNewCategory('');
        setShowCategoryInput(false);
    };

    const handleDeleteTag = async (id: number, tagName: string) => {
        if (!window.confirm(`Удалить тег #${tagName}?`)) return;
        try {
            await tagsApi.delete(id);
            loadTags();
        } catch (err: any) {
            if (err?.response?.status === 409) {
                setError('Нельзя удалить тег, так как он используется в черновиках');
            } else {
                setError(err?.response?.data?.message || 'Не удалось удалить тег');
            }
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            general: 'secondary', topic: 'primary', style: 'success',
            audience: 'info', format: 'warning',
        };
        return colors[category] || 'secondary';
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            general: 'Общие', topic: 'Тематика', style: 'Стиль',
            audience: 'Аудитория', format: 'Формат',
        };
        return labels[category] || category;
    };

    // Категории для отображения (все + пагинация по 7)
    const allCategories = ['all', ...categories];
    const totalCategoryPages = Math.ceil(allCategories.length / categoriesPerPage);
    const paginatedCategories = allCategories.slice(
        categoryPage * categoriesPerPage,
        (categoryPage + 1) * categoriesPerPage
    );

    // Теги для отображения (с пагинацией по 5)
    const totalTablePages = Math.ceil(filteredTags.length / tagsPerPage);
    const paginatedTags = filteredTags.slice(
        tablePage * tagsPerPage,
        (tablePage + 1) * tagsPerPage
    );

    // Сброс страницы тегов при смене категории
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setTablePage(0);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Управление тегами</h1>
                    <p className="muted">Создание и управление тегами для контента</p>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            <div className="tags-layout">
                {/* Левая колонка - Категории */}
                <div className="categories-column">
                    <div className="panel">
                        <div className="panel-header">
                            <h3>Категории</h3>
                        </div>
                        <div className="categories-list">
                            {paginatedCategories.map(category => {
                                const tagCount = category === 'all'
                                    ? tags.length
                                    : tags.filter(t => t.category === category).length;
                                return (
                                    <button
                                        key={category}
                                        className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange(category)}
                                    >
                                        <span className="category-name">
                                            {category === 'all' ? '📁 Все теги' : `📂 ${getCategoryLabel(category)}`}
                                        </span>
                                        <span className="category-count">{tagCount}</span>
                                    </button>
                                );
                            })}
                            {paginatedCategories.length === 0 && (
                                <div className="empty-categories">Нет категорий</div>
                            )}
                        </div>
                        {totalCategoryPages > 1 && (
                            <div className="category-pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCategoryPage(p => Math.max(0, p - 1))}
                                    disabled={categoryPage === 0}
                                >
                                    ←
                                </button>
                                <span className="pagination-info">
                                    {categoryPage + 1} / {totalCategoryPages}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCategoryPage(p => Math.min(totalCategoryPages - 1, p + 1))}
                                    disabled={categoryPage === totalCategoryPages - 1}
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Средняя колонка - Теги */}
                <div className="tags-column">
                    <div className="panel">
                        <div className="panel-header">
                            <h3>
                                {selectedCategory === 'all'
                                    ? 'Все теги'
                                    : `Теги: ${getCategoryLabel(selectedCategory)}`}
                            </h3>
                            <span className="total-count">Всего: {filteredTags.length}</span>
                        </div>

                        {loading && <div className="loading">Загрузка тегов...</div>}

                        {!loading && (
                            <>
                                <div className="table-wrapper">
                                    <table className="table">

                                        <tbody>
                                        {paginatedTags.map(tag => (
                                            <tr key={tag.idTag}>
                                                <td>
                                                    <span className="tag-name">#{tag.name}</span>
                                                </td>
                                                <td>
                                                        <span className={`badge badge-${getCategoryColor(tag.category)}`}>
                                                            {getCategoryLabel(tag.category)}
                                                        </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => handleDeleteTag(tag.idTag, tag.name)}
                                                        title="Удалить тег"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedTags.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="empty-message">
                                                    {selectedCategory === 'all'
                                                        ? 'Теги пока не созданы'
                                                        : `Нет тегов в категории "${getCategoryLabel(selectedCategory)}"`}
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                {totalTablePages > 1 && (
                                    <div className="tags-pagination">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setTablePage(p => Math.max(0, p - 1))}
                                            disabled={tablePage === 0}
                                        >
                                            ←
                                        </button>
                                        <span className="pagination-info">
                                            {tablePage + 1} / {totalTablePages}
                                        </span>
                                        <span className="pagination-range">
                                            {tablePage * tagsPerPage + 1}-{Math.min((tablePage + 1) * tagsPerPage, filteredTags.length)}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setTablePage(p => Math.min(totalTablePages - 1, p + 1))}
                                            disabled={tablePage === totalTablePages - 1}
                                        >
                                            →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Правая колонка - Форма создания тега */}
                <div className="create-column">
                    <div className="panel create-panel">
                        <h3>Создать новый тег</h3>
                        <form onSubmit={handleCreateTag}>
                            <div className="form-group">
                                <label htmlFor="tagName">Название тега</label>
                                <input
                                    id="tagName"
                                    type="text"
                                    className="form-control"
                                    placeholder="Например: Маркетинг_2024"
                                    value={newTag.name}
                                    onChange={e => handleTagNameChange(e.target.value)}
                                    required
                                />
                                <small className="form-hint">Без пробелов</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="tagCategory">Категория</label>
                                {!showCategoryInput ? (
                                    <div className="category-selector">
                                        <select
                                            id="tagCategory"
                                            className="form-control"
                                            value={newTag.category}
                                            onChange={e => setNewTag({...newTag, category: e.target.value})}
                                        >
                                            {categories.map(category => (
                                                <option key={category} value={category}>
                                                    {getCategoryLabel(category)}
                                                </option>
                                            ))}
                                            {categories.length === 0 && (
                                                <option value="общие">Общие</option>
                                            )}
                                        </select>
                                        <button type="button" className="btn-link" onClick={() => setShowCategoryInput(true)}>
                                            + Новая
                                        </button>
                                    </div>
                                ) : (
                                    <div className="category-input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Новая категория"
                                            value={newCategory}
                                            onChange={e => setNewCategory(e.target.value)}
                                            autoFocus
                                        />
                                        <button type="button" className="btn secondary small" onClick={handleCreateCategory}>
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-ghost small"
                                            onClick={() => {
                                                setShowCategoryInput(false);
                                                setNewCategory('');
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn primary full-width" disabled={!newTag.name.trim()}>
                                Создать тег
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tags;