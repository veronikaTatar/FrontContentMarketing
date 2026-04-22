// src/hooks/useContentFilters.ts
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';


import type { FilterState } from '../strategies';  // ← type-only import для типа
import {
    buildQueryString,      // ← значение (функция)
    parseFiltersFromUrl    // ← значение (функция)
} from '../strategies';


const initialState: FilterState = {
    title: '',
    status: '',
    tags: [],
    idTask: null,
    dateRange: {},
    idUser: null,
};

export const useContentFilters = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Состояние фильтров
    const [filters, setFilters] = useState<FilterState>(() => {
        // Инициализация из URL при загрузке
        const params = new URLSearchParams(location.search);
        const parsed = parseFiltersFromUrl(params);
        return { ...initialState, ...parsed };
    });

    // Обновление одного фильтра
    const updateFilter = useCallback(<K extends keyof FilterState>(
        key: K,
        value: FilterState[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Сброс всех фильтров
    const resetFilters = useCallback(() => {
        setFilters(initialState);
    }, []);

    // Удаление конкретного фильтра
    const removeFilter = useCallback(<K extends keyof FilterState>(key: K) => {
        setFilters(prev => ({ ...prev, [key]: initialState[key] }));
    }, []);

    // Применение фильтров (обновление URL и выполнение запроса)
    const applyFilters = useCallback(() => {
        const queryString = buildQueryString(filters);
        navigate(`${location.pathname}${queryString}`, { replace: true });
    }, [filters, navigate, location.pathname]);

    // Автоматическое применение при изменении фильтров (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const queryString = buildQueryString(filters);
            const newUrl = `${location.pathname}${queryString}`;
            if (newUrl !== `${location.pathname}${location.search}`) {
                navigate(newUrl, { replace: true });
            }
        }, 500); // задержка 500ms

        return () => clearTimeout(timer);
    }, [filters, navigate, location]);

    // Проверка, активен ли какой-либо фильтр
    const hasActiveFilters = useCallback(() => {
        return Object.keys(filters).some(key => {
            const value = filters[key as keyof FilterState];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) {
                return Object.values(value).some(v => v !== undefined);
            }
            return value !== '' && value !== null && value !== undefined;
        });
    }, [filters]);

    // Получение текущей query строки для API запроса
    const getQueryString = useCallback(() => {
        return buildQueryString(filters);
    }, [filters]);

    return {
        filters,
        updateFilter,
        resetFilters,
        removeFilter,
        applyFilters,
        hasActiveFilters: hasActiveFilters(),
        getQueryString,
    };
};