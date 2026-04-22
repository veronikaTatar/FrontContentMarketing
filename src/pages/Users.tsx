import { useEffect, useState, useMemo } from 'react';
import { usersApi } from '../api/users';
import type { UserWithStatus } from '../api/users';
import './Users.css';

const roleLabels: Record<string, string> = {
    ADMIN: 'Админ',
    MANAGER: 'Менеджер',
    AUTHOR: 'Автор',
};

const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3l4 4L7 21H3v-4L17 3z"></path>
        <path d="M15 5l4 4"></path>
    </svg>
);

const LockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const UnlockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const ChevronUpDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 3 18 9"></polyline>
        <polyline points="6 15 12 21 18 15"></polyline>
    </svg>
);

const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const Users = () => {
    const [users, setUsers] = useState<UserWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        login: '',
        email: '',
        fullName: '',
        role: 'AUTHOR',
        password: ''
    });
    const [editForm, setEditForm] = useState({
        login: '',
        email: '',
        fullName: '',
        role: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    const [sortField, setSortField] = useState<'fullName' | 'login' | 'email'>('fullName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


    const [success, setSuccess] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        login?: string;
        email?: string;
    }>({});
    const loadUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await usersApi.listAll();
            setUsers(response.data.content || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось загрузить список сотрудников');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        let filtered = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.fullName.toLowerCase().includes(term) ||
                user.login.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(user =>
                statusFilter === 'active' ? user.isActive : !user.isActive
            );
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [users, searchTerm, statusFilter, roleFilter, sortField, sortDirection]);

    const handleSort = (field: 'fullName' | 'login' | 'email') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: 'fullName' | 'login' | 'email') => {
        if (sortField !== field) return <ChevronUpDownIcon />;
        return sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;
    };

    const handleToggleBlock = async (id: number, currentStatus: boolean) => {
        try {
            await usersApi.toggleBlock(id, currentStatus);
            await loadUsers();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось изменить статус');
        }
    };

    const handleDelete = async (id: number, fullName: string) => {
        if (window.confirm(`Вы уверены, что хотите удалить пользователя "${fullName}"?`)) {
            try {
                await usersApi.delete(id);
                await loadUsers();
                setSuccess('Пользователь успешно удалён');
                setTimeout(() => setSuccess(null), 3000);
            } catch (err: any) {
                const errorMessage = err?.response?.data?.message || 'Не удалось удалить пользователя';
                setError(errorMessage);

                //  Если ошибка связана с зависимостями, показываем подсказку
                if (errorMessage.includes('назначенные задачи') || errorMessage.includes('черновики')) {
                    // Можно показать дополнительное уведомление
                    setTimeout(() => {
                        alert('💡 Совет: Вы можете заблокировать пользователя вместо удаления. Заблокированный пользователь не сможет войти в систему.');
                    }, 500);
                }
            }
        }
    };

    const openEditModal = (user: UserWithStatus) => {
        setEditingUser(user);
        setEditForm({
            login: user.login,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        });
    };

    const openCreateModal = () => {
        setIsCreating(true);
        setCreateForm({
            login: '',
            email: '',
            fullName: '',
            role: 'AUTHOR',
            password: ''
        });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCreateForm({
            ...createForm,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await usersApi.update(editingUser.idUser, {
                login: editForm.login,
                email: editForm.email,
                fullName: editForm.fullName,
                role: editForm.role
            });
            setEditingUser(null);
            await loadUsers();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось обновить данные пользователя');
        }
    };

    const handleCreateUser = async () => {
        if (!createForm.login || !createForm.email || !createForm.fullName || !createForm.password) {
            setError('Пожалуйста, заполните все поля');
            return;
        }
        try {
            // ✅ Используем правильный API метод
            await usersApi.create({
                login: createForm.login,
                email: createForm.email,
                fullName: createForm.fullName,
                role: createForm.role,
                password: createForm.password
            });
            setIsCreating(false);
            setCreateForm({
                login: '',
                email: '',
                fullName: '',
                role: 'AUTHOR',
                password: ''
            });
            await loadUsers();
            setSuccess('Пользователь успешно создан');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Не удалось создать пользователя';
            setError(errorMessage);


            if (errorMessage.includes('Login already exists')) {
                setValidationErrors(prev => ({ ...prev, login: 'Этот логин уже занят' }));
            }
            if (errorMessage.includes('Email already exists')) {
                setValidationErrors(prev => ({ ...prev, email: 'Этот email уже зарегистрирован' }));
            }
        }
    };

    const getStatusLabel = (isActive: boolean) => {
        return isActive ? 'Активен' : 'Заблокирован';
    };

    const getStatusClass = (isActive: boolean) => {
        return isActive ? 'status-active' : 'status-blocked';
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setRoleFilter('all');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Сотрудники</h1>
                    <p className="muted">Управление сотрудниками, ролями и доступом</p>
                </div>
                <button className="btn-primary" onClick={openCreateModal}>
                    <PlusIcon /> Добавить сотрудника
                </button>
            </div>

            <div className="filters-panel">
                <div className="search-box">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Поиск по ФИО, логину или email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Все статусы</option>
                        <option value="active">Активен</option>
                        <option value="blocked">Заблокирован</option>
                    </select>

                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="all">Все роли</option>
                        <option value="ADMIN">Администратор</option>
                        <option value="MANAGER">Менеджер</option>
                        <option value="AUTHOR">Автор</option>
                    </select>

                    {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
                        <button className="btn-reset" onClick={resetFilters}>
                            <CloseIcon /> Сбросить
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : (
                <div className="users-table-container">
                    <div className="table-info">
                        Найдено: {filteredUsers.length} из {users.length} сотрудников
                    </div>
                    <table className="users-table">
                        <thead>
                        <tr>
                            <th>Роль</th>
                            <th className="sortable" onClick={() => handleSort('fullName')}>
                                ФИО {getSortIcon('fullName')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('login')}>
                                Логин {getSortIcon('login')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('email')}>
                                Email {getSortIcon('email')}
                            </th>
                            <th>Доступ</th>
                            <th>Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="no-data">
                                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                                        ? 'Ничего не найдено. Попробуйте изменить параметры поиска.'
                                        : 'Нет данных о сотрудниках'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.idUser}>
                                    <td>
                        <span className="role-badge" data-role={user.role}>
                            {roleLabels[user.role] || user.role}
                        </span>
                                    </td>
                                    <td className="user-fullname">{user.fullName}</td>
                                    <td>{user.login}</td>
                                    <td>{user.email}</td>
                                    <td>
                        <span className={`status-badge ${getStatusClass(user.isActive)}`}>
                            {getStatusLabel(user.isActive)}
                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openEditModal(user)}
                                                title="Редактировать"
                                            >
                                                <EditIcon/>
                                            </button>
                                            <button
                                                className={`btn-icon ${user.isActive ? 'block' : 'unblock'}`}
                                                onClick={() => handleToggleBlock(user.idUser, user.isActive)}
                                                title={user.isActive ? 'Заблокировать' : 'Разблокировать'}
                                            >
                                                {user.isActive ? <LockIcon/> : <UnlockIcon/>}
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(user.idUser, user.fullName)}
                                                title="Удалить"
                                            >
                                                <TrashIcon/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Модальное окно создания сотрудника */}
            {isCreating && (
                <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Добавить сотрудника</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>Логин *</label>
                                <input
                                    type="text"
                                    name="login"
                                    value={createForm.login}
                                    onChange={handleCreateChange}
                                    placeholder="Введите логин"
                                    className={validationErrors.login ? 'error-input' : ''}
                                    required
                                />
                                {validationErrors.login && (
                                    <div className="field-error">{validationErrors.login}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={createForm.email}
                                    onChange={handleCreateChange}
                                    placeholder="example@mail.com"
                                    className={validationErrors.email ? 'error-input' : ''}
                                    required
                                />
                                {validationErrors.email && (
                                    <div className="field-error">{validationErrors.email}</div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>ФИО *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={createForm.fullName}
                                    onChange={handleCreateChange}
                                    placeholder="Иванов Иван Иванович"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Пароль *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={createForm.password}
                                    onChange={handleCreateChange}
                                    placeholder="Введите пароль"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Роль</label>
                                <select name="role" value={createForm.role} onChange={handleCreateChange}>
                                    <option value="AUTHOR">Автор</option>
                                    <option value="MANAGER">Менеджер</option>
                                    <option value="ADMIN">Администратор</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setIsCreating(false)}>
                                Отмена
                            </button>
                            <button className="btn-primary" onClick={handleCreateUser}>
                                Создать
                            </button>
                        </div>
                        <button className="modal-close" onClick={() => setIsCreating(false)}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования сотрудника */}
            {editingUser && (
                <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Редактирование сотрудника</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>Логин</label>
                                <input
                                    type="text"
                                    name="login"
                                    value={editForm.login}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>ФИО</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={editForm.fullName}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Роль</label>
                                <select name="role" value={editForm.role} onChange={handleEditChange}>
                                    <option value="AUTHOR">Автор</option>
                                    <option value="MANAGER">Менеджер</option>
                                    <option value="ADMIN">Администратор</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setEditingUser(null)}>
                                Отмена
                            </button>
                            <button className="btn-primary" onClick={handleSaveUser}>
                                Сохранить
                            </button>
                        </div>
                        <button className="modal-close" onClick={() => setEditingUser(null)}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;