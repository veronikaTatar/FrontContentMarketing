// src/config/menuConfig.ts
export interface MenuItem {
    path: string;
    label: string;
    roles: string[];
}

export const menuConfig: MenuItem[] = [
    // ========== ДАШБОРДЫ (КАЖДОЙ РОЛИ СВОЙ) ==========
    { path: '/dashboard', label: 'Дашборд', roles: ['ADMIN', 'MANAGER', 'AUTHOR'] },

    // ========== КАЛЕНДАРЬ ДЛЯ АВТОРА И МЕНЕДЖЕРА ==========
    { path: '/calendar', label: 'Календарь', roles: ['MANAGER', 'AUTHOR'] },

    // ========== ТОЛЬКО ДЛЯ АВТОРА ==========
    { path: '/my-tasks', label: 'Мои задачи', roles: ['AUTHOR'] },
    { path: '/drafts', label: 'Черновики', roles: ['AUTHOR'] },

    // ========== ТОЛЬКО ДЛЯ МЕНЕДЖЕРА ==========
    { path: '/tasks', label: 'Управление задачами', roles: ['MANAGER'] },
    { path: '/content-review', label: 'Проверка задач', roles: ['MANAGER'] },
    { path: '/publications', label: 'Публикации', roles: ['MANAGER'] },
    { path: '/tags', label: 'Теги', roles: ['MANAGER'] },

    // ========== ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА ==========
    { path: '/users', label: 'Сотрудники', roles: ['ADMIN'] },
    { path: '/channels', label: 'Каналы публикаций', roles: ['ADMIN'] },
    { path: '/settings', label: 'Настройки системы', roles: ['ADMIN'] },
];

export const getMenuByRole = (userRole: string | null): MenuItem[] => {
    if (!userRole) return [];
    return menuConfig.filter(item => item.roles.includes(userRole));
};