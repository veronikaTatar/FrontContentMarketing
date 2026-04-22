import { useEffect, useState } from 'react';
import { reportsApi } from '../api/reports';
import { tasksApi } from '../api/tasks';
import { contentApi } from '../api/content';
import { publicationsApi } from '../api/publications';
import type { PublicationReport, Task, Content, Publication } from '../types';

const taskStatusLabels: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершена',
    approved: 'Утверждена',
    rejected: 'Отклонена',
};

const getTaskStatusLabel = (status: string) => taskStatusLabels[status] || status;

const buildPrintWindow = (title: string, bodyHtml: string) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    .meta { color: #555; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; font-size: 12px; }
    th { background: #f6f6f6; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
    .label { color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
    .value { font-size: 18px; font-weight: 700; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
};

const Reports = () => {
    const [reports, setReports] = useState<PublicationReport[]>([]);
    const [approvedTasks, setApprovedTasks] = useState<Task[]>([]);
    const [dashboardTasks, setDashboardTasks] = useState<Task[]>([]);
    const [drafts, setDrafts] = useState<Content[]>([]);
    const [scheduled, setScheduled] = useState<Publication[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
        reportsApi.publications()
            .then((res) => setReports(res.data.content))
            .catch((err) => {
                setReports([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить отчёт');
            });

        tasksApi.listMine()
            .then((res) => {
                const tasks = res.data.content || [];
                setDashboardTasks(tasks);
            })
            .catch(() => {
                setDashboardTasks([]);
            });

        tasksApi.list()
            .then((res) => {
                const tasks = res.data.content || [];
                setApprovedTasks(tasks.filter((task) => task.status === 'approved'));
            })
            .catch(() => setApprovedTasks([]));

        contentApi.search('?status=draft')
            .then((res) => setDrafts(res.data.content || []))
            .catch(() => setDrafts([]));

        publicationsApi.list()
            .then((res) => {
                const items = res.data.content || [];
                setScheduled(items.filter((item) => item.status === 'scheduled'));
            })
            .catch(() => setScheduled([]));
    }, []);

    const exportDashboardPdf = () => {
        const activeTasks = dashboardTasks.filter((task) =>
            ['new', 'in_progress', 'review'].includes(task.status)
        ).length;
        const draftCount = drafts.length;
        const scheduledCount = scheduled.length;
        const totals = reports.reduce(
            (acc, r) => {
                acc.views += r.views;
                acc.engagement += r.likes + r.comments + r.reposts;
                return acc;
            },
            { views: 0, engagement: 0 }
        );
        const engagementRate = totals.views > 0
            ? `${Math.round((totals.engagement / totals.views) * 100)}%`
            : '0%';
        const body = `
            <h1>Дашборд — ключевые показатели</h1>
            <div class="meta">Сформировано: ${new Date().toLocaleString('ru-RU')}</div>
            <div class="stats">
                <div class="card"><div class="label">Активные задачи</div><div class="value">${activeTasks}</div></div>
                <div class="card"><div class="label">Черновики</div><div class="value">${draftCount}</div></div>
                <div class="card"><div class="label">Запланировано</div><div class="value">${scheduledCount}</div></div>
                <div class="card"><div class="label">Вовлечённость</div><div class="value">${engagementRate}</div></div>
            </div>
        `;
        buildPrintWindow('Дашборд — PDF', body);
    };

    const exportApprovedTasksPdf = () => {
        const rows = approvedTasks.map((task) => `
            <tr>
                <td>${task.title}</td>
                <td>${getTaskStatusLabel(task.status)}</td>
                <td>${task.priority}</td>
                <td>${task.complexity}</td>
                <td>${task.deadlineAt ? new Date(task.deadlineAt).toLocaleString('ru-RU') : '-'}</td>
            </tr>
        `).join('');

        const body = `
            <h1>Утверждённые задачи</h1>
            <div class="meta">Сформировано: ${new Date().toLocaleString('ru-RU')}</div>
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Статус</th>
                        <th>Приоритет</th>
                        <th>Сложность</th>
                        <th>Срок</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="5">Нет утверждённых задач</td></tr>'}
                </tbody>
            </table>
        `;
        buildPrintWindow('Утверждённые задачи — PDF', body);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Отчёт по публикациям</h1>
                    <p className="muted">Эффективность опубликованных постов.</p>
                </div>
                <div className="header-actions">
                    <button className="btn ghost" onClick={exportDashboardPdf}>Экспорт дашборда в PDF</button>
                    <button className="btn accent" onClick={exportApprovedTasksPdf}>Экспорт утверждённых задач в PDF</button>
                </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="panel">
                <div className="table">
                    <div className="table-row table-head">
                        <span>Контент</span>
                        <span>Канал</span>
                        <span>Опубликовано</span>
                        <span>Вовлечённость</span>
                    </div>
                    {reports.map((r) => (
                        <div key={r.idPublication} className="table-row">
                            <span>{r.contentTitle}</span>
                            <span>{r.channelName}</span>
                            <span>{r.publishedAt || '-'}</span>
                            <span>{r.likes + r.comments + r.reposts} / {r.views}</span>
                        </div>
                    ))}
                    {!reports.length && <div className="muted">Отчётов пока нет.</div>}
                </div>
            </div>
        </div>
    );
};

export default Reports;
