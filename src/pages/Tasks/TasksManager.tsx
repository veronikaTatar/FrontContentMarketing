// src/pages/Tasks/TasksManager.tsx
import { useEffect, useState, useMemo } from 'react';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import type { Task, UserOption } from '../../types';
import TaskModal from './TaskModal';
import { getStatusColor, getPriorityColor, parseBrief, topics } from './types';
import './TasksManager.css';

const TasksManager = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [error, setError] = useState<string | null>(null);
    const [authors, setAuthors] = useState<UserOption[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Поиск и фильтры
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPriority, setFilterPriority] = useState<string>('');
    const [filterDeadline, setFilterDeadline] = useState<string>('');
    const [filterTopic, setFilterTopic] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);



    const load = () => {
        setError(null);
        tasksApi.listMineSorted('createdAt', 'desc', 0, 100)
            .then((res) => {
                setTasks(res.data.content);
            })
            .catch((err) => {
                setTasks([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить задачи');
            });
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        usersApi.listAuthors().then((res) => setAuthors(res.data)).catch(() => setAuthors([]));
    }, []);

    // Фильтрация и сортировка через useMemo
    const filteredAndSortedTasks = useMemo(() => {
        let result = [...tasks];

        // Фильтрация
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(task =>
                task.title.toLowerCase().includes(query) ||
                task.assigneeName?.toLowerCase().includes(query) ||
                task.assigneeEmail?.toLowerCase().includes(query)
            );
        }

        if (filterStatus) {
            result = result.filter(task => task.status === filterStatus);
        }

        if (filterPriority) {
            result = result.filter(task => task.priority === parseInt(filterPriority));
        }

        if (filterTopic) {
            result = result.filter(task => {
                const parsed = parseBrief(task.brief);
                return parsed.topic === filterTopic;
            });
        }

        if (filterDeadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekLater = new Date(today);
            weekLater.setDate(today.getDate() + 7);
            const monthLater = new Date(today);
            monthLater.setDate(today.getDate() + 30);

            result = result.filter(task => {
                if (!task.deadlineAt) return filterDeadline === 'none';
                const deadline = new Date(task.deadlineAt);

                switch (filterDeadline) {
                    case 'overdue': return deadline < today;
                    case 'today': return deadline.toDateString() === today.toDateString();
                    case 'week': return deadline >= today && deadline <= weekLater;
                    case 'month': return deadline >= today && deadline <= monthLater;
                    case 'none': return !task.deadlineAt;
                    default: return true;
                }
            });
        }

        // Сортировка
        result.sort((a, b) => {
            let aVal: any = a[sortBy as keyof Task];
            let bVal: any = b[sortBy as keyof Task];

            // Специальная обработка для разных полей
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
                case 'createdAt':
                    aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    break;
                case 'deadlineAt':
                    aVal = a.deadlineAt ? new Date(a.deadlineAt).getTime() : 0;
                    bVal = b.deadlineAt ? new Date(b.deadlineAt).getTime() : 0;
                    break;
                case 'status':
                    aVal = a.status?.toLowerCase() || '';
                    bVal = b.status?.toLowerCase() || '';
                    break;
                default:
                    if (typeof aVal === 'string') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                    }
            }

            if (sortDir === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return result;
    }, [tasks, searchQuery, filterStatus, filterPriority, filterDeadline, filterTopic, sortBy, sortDir]);

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

    const handleCreateTask = () => {
        setEditingTask(null);
        setShowModal(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowModal(true);
    };

    const handleTaskSaved = async () => {
        setShowModal(false);
        if (editingTask) {
            try {
                await tasksApi.update(editingTask.idTask, { status: 'в процессе' });
            } catch (err) {
                console.error('Не удалось обновить статус задачи:', err);
            }
        }
        load();
    };

    const handleDeleteTask = async (id: number) => {
        if (window.confirm('Вы уверены, что хотите ПОЛНОСТЬЮ удалить эту задачу из системы?')) {
            try {
                await tasksApi.hardDelete(id);  // или tasksApi.delete(id)
                load();
            } catch (err: any) {
                alert(err?.response?.data?.message || 'Не удалось удалить задачу');
            }
        }
    };

    const formatDateShort = (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusText = (status: string): string => {
        return status;
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

    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDeadline('');
        setFilterTopic('');
    };

    const hasActiveFilters = searchQuery || filterStatus || filterPriority || filterDeadline || filterTopic;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Управление задачами</h1>
                    <p className="muted">Создание и управление задачами авторов</p>
                </div>
                <button className="btn primary" onClick={handleCreateTask}>
                    + Создать задачу
                </button>
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
                    <button
                        className={`btn-filter ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '▼ Скрыть фильтры' : '▶ Фильтры'}
                    </button>
                    {hasActiveFilters && (
                        <button className="btn-reset" onClick={clearFilters}>
                            ✕ Сбросить
                        </button>
                    )}
                </div>
            </div>

            {/* Панель фильтров */}
            {showFilters && (
                <div className="filters-expanded">
                    <div className="filter-row">
                        <div className="filter-item">
                            <label>Статус</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="">Все статусы</option>
                                <option value="пустой">пустой</option>
                                <option value="в процессе">в процессе</option>
                                <option value="на проверке">на проверке</option>
                                <option value="отклонен">отклонен</option>
                                <option value="одобрен">одобрен</option>
                                <option value="удален">отказ</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Приоритет</label>
                            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                                <option value="">Все</option>
                                <option value="1">1 - Низкий</option>
                                <option value="2">2 - Ниже среднего</option>
                                <option value="3">3 - Средний</option>
                                <option value="4">4 - Выше среднего</option>
                                <option value="5">5 - Высокий</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Срок</label>
                            <select value={filterDeadline} onChange={(e) => setFilterDeadline(e.target.value)}>
                                <option value="">Все</option>
                                <option value="overdue">Просроченные</option>
                                <option value="today">Сегодня</option>
                                <option value="week">Ближайшие 7 дней</option>
                                <option value="month">Ближайший месяц</option>
                                <option value="none">Без срока</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>Тематика</label>
                            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
                                <option value="">Все</option>
                                {topics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                    </div>
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
                            <th className="col-title sortable" onClick={() => handleSort('title')}>
                                Название {getSortIcon('title')}
                            </th>
                            <th className="col-topic">Тематика</th>
                            <th className="col-goal">Цель</th>
                            <th className="col-author sortable" onClick={() => handleSort('assigneeName')}>
                                Автор {getSortIcon('assigneeName')}
                            </th>
                            <th className="col-priority sortable" onClick={() => handleSort('priority')}>
                                Приоритет {getSortIcon('priority')}
                            </th>
                            <th className="col-created sortable" onClick={() => handleSort('createdAt')}>
                                Создана {getSortIcon('createdAt')}
                            </th>
                            <th className="col-deadline sortable" onClick={() => handleSort('deadlineAt')}>
                                Срок {getSortIcon('deadlineAt')}
                            </th>
                            <th className="col-status sortable" onClick={() => handleSort('status')}>
                                Статус {getSortIcon('status')}
                            </th>
                            <th className="col-actions">Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredAndSortedTasks.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-4 muted">
                                    {hasActiveFilters ? 'Нет задач по выбранным фильтрам' : 'Нет задач'}
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedTasks.map((task) => {
                                const parsed = parseBrief(task.brief);
                                const isOverdue = task.deadlineAt && new Date(task.deadlineAt) < new Date();
                                const canDelete = task.status !== 'одобрен' && task.status !== 'опубликован';
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
                                        <td className="col-created">
                                            <span className="date-text">{formatDateShort(task.createdAt)}</span>
                                        </td>
                                        <td className="col-deadline">
                                                <span className={isOverdue ? 'deadline-overdue' : 'deadline-normal'}>
                                                    {isOverdue && '⚠ '}{formatDateShort(task.deadlineAt)}
                                                </span>
                                        </td>
                                        <td className="col-status">
                                                <span className={`status-badge status-${task.status}`}>
                                                    {getStatusText(task.status)}
                                                </span>
                                        </td>


                                        <td className="col-actions">
                                            <div className="actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEditTask(task)}
                                                    title="Редактировать"
                                                >
                                                    ✎
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => handleDeleteTask(task.idTask)}
                                                        title="Удалить"
                                                    >
                                                        🗑
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
                    Всего задач: {tasks.length} | Показано: {filteredAndSortedTasks.length}
                </div>
            </div>

            <TaskModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleTaskSaved}
                task={editingTask}
                authors={authors}
            />
        </div>
    );
};

export default TasksManager;