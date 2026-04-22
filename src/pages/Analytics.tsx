import { useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../api/reports';
import type { PublicationReport } from '../types';

const Analytics = () => {
    const [stats, setStats] = useState({
        views: 0,
        likes: 0,
        reposts: 0,
        comments: 0,
        publications: 0,
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        reportsApi.publications()
            .then((res) => {
                const items: PublicationReport[] = res.data.content;
                const totals = items.reduce((acc, item) => {
                    acc.views += item.views || 0;
                    acc.likes += item.likes || 0;
                    acc.reposts += item.reposts || 0;
                    acc.comments += item.comments || 0;
                    return acc;
                }, { views: 0, likes: 0, reposts: 0, comments: 0 });
                setStats({
                    ...totals,
                    publications: items.length,
                });
                setError(null);
            })
            .catch((err) => {
                setError(err?.response?.data?.message || 'Не удалось загрузить аналитику');
                setStats({ views: 0, likes: 0, reposts: 0, comments: 0, publications: 0 });
            });
    }, []);

    const engagementRate = useMemo(() => {
        if (!stats.views) return null;
        const rate = ((stats.likes + stats.reposts + stats.comments) / stats.views) * 100;
        return Number(rate.toFixed(1));
    }, [stats]);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Аналитика</h1>
                    <p className="muted">Отслеживайте вовлечённость и охват.</p>
                </div>
                <button className="btn ghost">Синхронизировать метрики</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">Просмотры</span>
                    <strong>{stats.views.toLocaleString('ru-RU')}</strong>
                    <span className="stat-foot">По отчётам публикаций</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Лайки</span>
                    <strong>{stats.likes.toLocaleString('ru-RU')}</strong>
                    <span className="stat-foot">Всего</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Репосты</span>
                    <strong>{stats.reposts.toLocaleString('ru-RU')}</strong>
                    <span className="stat-foot">Всего</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Комментарии</span>
                    <strong>{stats.comments.toLocaleString('ru-RU')}</strong>
                    <span className="stat-foot">Всего</span>
                </div>
            </div>

            <div className="panel">
                <h3>Инсайты</h3>
                {error && <p className="error">{error}</p>}
                {!error && stats.publications === 0 && (
                    <p className="muted">Данных пока нет. Добавьте публикации и сформируйте отчёты.</p>
                )}
                {!error && stats.publications > 0 && (
                    <p className="muted">
                        Всего публикаций: {stats.publications}. Средняя вовлечённость: {engagementRate === null ? '—' : `${engagementRate}%`}.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Analytics;

