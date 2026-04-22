// src/components/Analytics/PerformanceChart.tsx
import type { KPI } from '../../types';
import './PerformanceChart.css';

interface PerformanceChartProps {
    actualKPI?: KPI | null;
    desiredKPI?: KPI | null;
    title?: string;
    totalSubscribers?: number;
}

const PerformanceChart = ({ actualKPI, desiredKPI, title, totalSubscribers }: PerformanceChartProps) => {
    console.log('PerformanceChart props:', { actualKPI, desiredKPI, title, totalSubscribers });

    if (!actualKPI || !desiredKPI) {
        console.log('PerformanceChart: missing data', { actualKPI, desiredKPI });
        return (
            <div className="performance-chart">
                {title && <div className="chart-title">{title}</div>}
                <div className="empty-state">
                    {!actualKPI && !desiredKPI
                        ? 'Нет данных о KPI'
                        : !actualKPI
                            ? 'Нет фактических показателей'
                            : 'Не заданы целевые показатели'}
                </div>
            </div>
        );
    }

    const calculatePercent = (actual: number, desired: number) => {
        if (desired === 0) return actual > 0 ? 100 : 0;
        return Math.min(200, Math.round((actual / desired) * 100));
    };

    const metrics = [
        {
            label: 'Лайки',
            actual: actualKPI.targetLikes ?? 0,
            desired: desiredKPI.targetLikes ?? 0,
            icon: '👍'
        },
        {
            label: 'Просмотры',
            actual: actualKPI.targetViews ?? 0,
            desired: desiredKPI.targetViews ?? 0,
            icon: '👁️'
        },
        {
            label: 'Репосты',
            actual: actualKPI.targetReposts ?? 0,
            desired: desiredKPI.targetReposts ?? 0,
            icon: '🔄'
        },
        {
            label: 'Комментарии',
            actual: actualKPI.targetComments ?? 0,
            desired: desiredKPI.targetComments ?? 0,
            icon: '💬'
        }
    ];

    const overallPercent = metrics.reduce((sum, m) => {
        return sum + calculatePercent(m.actual, m.desired);
    }, 0) / 4;

    const getPercentClass = (percent: number) => {
        if (percent >= 100) return 'excellent';
        if (percent >= 75) return 'good';
        if (percent >= 50) return 'average';
        return 'poor';
    };

    const hasDesiredGoals = metrics.some(m => m.desired > 0);

    // ТОП-5 ВАЖНЫХ МЕТРИК ВОВЛЕЧЕННОСТИ

    // 1. ER (Engagement Rate) - главная метрика вовлеченности
    const calculateER = (): number | null => {
        if (!totalSubscribers || totalSubscribers === 0) return null;
        const totalInteractions =
            (actualKPI.targetLikes ?? 0) +
            (actualKPI.targetReposts ?? 0) +
            (actualKPI.targetComments ?? 0);
        return (totalInteractions / totalSubscribers) * 100;
    };

    // 2. View Rate - охват аудитории
    const calculateViewRate = (): number | null => {
        if (!totalSubscribers || totalSubscribers === 0) return null;
        return ((actualKPI.targetViews ?? 0) / totalSubscribers) * 100;
    };

    // 3. ERR (Engagement by Reach) - вовлеченность от охвата
    const calculateERR = (): number | null => {
        const views = actualKPI.targetViews ?? 0;
        if (views === 0) return null;
        const totalInteractions =
            (actualKPI.targetLikes ?? 0) +
            (actualKPI.targetReposts ?? 0) +
            (actualKPI.targetComments ?? 0);
        return (totalInteractions / views) * 100;
    };

    // 4. Виральность - насколько пост вышел за пределы подписчиков
    const calculateVirality = (): number | null => {
        if (!totalSubscribers || totalSubscribers === 0) return null;
        return (actualKPI.targetViews ?? 0) / totalSubscribers;
    };

    // 5. Лайки к просмотрам - конверсия
    const calculateLikeToView = (): number | null => {
        const views = actualKPI.targetViews ?? 0;
        if (views === 0) return null;
        return ((actualKPI.targetLikes ?? 0) / views) * 100;
    };

    const er = calculateER();
    const viewRate = calculateViewRate();
    const err = calculateERR();
    const virality = calculateVirality();
    const likeToView = calculateLikeToView();

    // Функция для форматирования чисел
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (!hasDesiredGoals) {
        return (
            <div className="performance-chart">
                {title && <div className="chart-title">{title}</div>}
                <div className="empty-state">Для этой задачи не заданы целевые KPI</div>
            </div>
        );
    }

    return (
        <div className="performance-chart">
            {title && <div className="chart-title">{title}</div>}

            {/* Основные метрики достижения целей */}
            <div className="metrics-list">
                {metrics.map((metric) => {
                    const percent = calculatePercent(metric.actual, metric.desired);
                    const percentClass = getPercentClass(percent);

                    return (
                        <div key={metric.label} className="metric-row">
                            <div className="metric-label">
                                <span className="metric-icon">{metric.icon}</span>
                                <span>{metric.label}</span>
                                <span className="metric-values">
                                    {metric.actual.toLocaleString()} / {metric.desired.toLocaleString()}
                                </span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className={`progress-bar ${percentClass}`}
                                    style={{ width: `${Math.min(100, percent)}%` }}
                                >
                                    <span className="progress-percent">{percent}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="overall-performance">
                <div className="overall-label">Общая эффективность</div>
                <div className="overall-value">
                    <span className={`overall-percent ${getPercentClass(overallPercent)}`}>
                        {Math.round(overallPercent)}%
                    </span>
                </div>
            </div>

            {/*  ТОП-5 МЕТРИК ВОВЛЕЧЕННОСТИ - В ОДНУ СТРОКУ */}
            {totalSubscribers && totalSubscribers > 0 && (
                <div className="engagement-metrics">
                    <div className="engagement-title"> Ключевые метрики вовлеченности</div>

                    <div className="engagement-row">
                        {/* 1. ER - главная метрика */}
                        {er !== null && (
                            <div className="engagement-card highlight">
                                <div className="engagement-label">💫 ER</div>
                                <div className="engagement-value">{er.toFixed(2)}%</div>
                                <div className="engagement-hint">вовлеченность</div>
                            </div>
                        )}

                        {/* 2. ERR - вовлеченность по охвату */}
                        {err !== null && (
                            <div className="engagement-card">
                                <div className="engagement-label">📈 ERR</div>
                                <div className="engagement-value">{err.toFixed(2)}%</div>
                                <div className="engagement-hint">от охвата</div>
                            </div>
                        )}

                        {/* 3. Конверсия в лайки */}
                        {likeToView !== null && (
                            <div className="engagement-card">
                                <div className="engagement-label">👍 Лайки</div>
                                <div className="engagement-value">{likeToView.toFixed(2)}%</div>
                                <div className="engagement-hint">от просмотров</div>
                            </div>
                        )}

                        {/* 4. Охват */}
                        {viewRate !== null && (
                            <div className="engagement-card">
                                <div className="engagement-label">👁️ Охват</div>
                                <div className="engagement-value">{viewRate.toFixed(1)}%</div>
                                <div className="engagement-hint">
                                    {formatNumber(actualKPI.targetViews ?? 0)} просмотров
                                </div>
                            </div>
                        )}

                        {/* 5. Виральность */}
                        {virality !== null && (
                            <div className="engagement-card">
                                <div className="engagement-label">🚀 Виральность</div>
                                <div className="engagement-value">{virality.toFixed(2)}x</div>
                                <div className="engagement-hint">
                                    {virality > 1 ? ' Выше базы' : ' В пределах базы'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceChart;