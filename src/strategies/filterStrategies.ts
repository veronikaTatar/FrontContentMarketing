






// ============ Фабрика стратегий ============
import {TitleFilter} from "./TitleFilter.ts";
import {StatusFilter} from "./StatusFilter.ts";
import {TagsFilter} from "./TagsFilter.ts";
import {TaskIdFilter} from "./TaskIdFilter.ts";
import {DateRangeFilter} from "./DateRangeFilter.ts";

export const filterStrategies = {
    title: new TitleFilter(),
    status: new StatusFilter(),
    tags: new TagsFilter(),
    idTask: new TaskIdFilter(),
    dateRange: new DateRangeFilter(),
} as const;

// Тип для ключей фильтров
export type FilterKey = keyof typeof filterStrategies;

// Тип для состояния фильтров
export type FilterState = {
    title: string;
    status: string;
    tags: string[];
    idTask: number | null;
    dateRange: { from?: Date; to?: Date };
    idUser: number | null;
};

// ============ Построитель запросов (использует стратегии) ============
// Исправлено: "Билдер" → "Построитель"
export const buildQueryString = (filters: Partial<FilterState>): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        const strategy = filterStrategies[key as FilterKey];

        // Проверяем, что стратегия существует и значение не пустое
        if (strategy && value !== undefined && value !== null && value !== '') {
            // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: проверяем наличие метода validate через 'in' или 'validate' in strategy
            if ('validate' in strategy && strategy.validate) {
                // Вызываем validate только если он существует
                if (!strategy.validate(value as never)) {
                    console.warn(`Invalid filter value for ${key}:`, value);
                    return;
                }
            }
            strategy.apply(params, value as never);
        }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

// ============ Вспомогательная функция для разбора фильтров из URL ============
// Исправлено: "нарична" → "разбора"
export const parseFiltersFromUrl = (searchParams: URLSearchParams): Partial<FilterState> => {
    const filters: Partial<FilterState> = {};

    const title = searchParams.get('title');
    if (title) filters.title = title;

    const status = searchParams.get('status');
    if (status) filters.status = status;

    const tags = searchParams.getAll('tags');
    if (tags.length > 0) filters.tags = tags;

    const idTask = searchParams.get('idTask');
    if (idTask) filters.idTask = parseInt(idTask, 10);

    const idUser = searchParams.get('idUser');
    if (idUser) filters.idUser = parseInt(idUser, 10);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from || to) {
        filters.dateRange = {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        };
    }

    return filters;
};