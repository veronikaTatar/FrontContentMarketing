// src/components/Analytics/KPIInputForm.tsx
import { useState } from 'react';
import './KPIInputForm.css';

interface KPIInputFormProps {
    postId: number;
    postTitle: string;
    channelName: string;
    platform: string;
    desiredKPI?: {
        targetLikes: number;
        targetViews: number;
        targetReposts: number;
        targetComments: number;
    };
    onSubmit: (data: {
        likes: number;
        views: number;
        reposts: number;
        comments: number;
        notes: string;
    }) => Promise<void>;
    onCancel: () => void;
}

const KPIInputForm = ({
                          postId,
                          postTitle,
                          channelName,
                          platform,
                          desiredKPI,
                          onSubmit,
                          onCancel
                      }: KPIInputFormProps) => {
    const [formData, setFormData] = useState({
        likes: 0,
        views: 0,
        reposts: 0,
        comments: 0,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setSubmitting(false);
        }
    };

    // Рассчет процентов относительно целевых KPI
    const getPercent = (actual: number, target: number) => {
        if (target === 0) return actual > 0 ? 100 : 0;
        return Math.min(100, Math.round((actual / target) * 100));
    };

    return (
        <div className="kpi-form-overlay">
            <div className="kpi-form-modal">
                <div className="kpi-form-header">
                    <h3>Ввод фактических показателей</h3>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>

                <div className="kpi-form-body">
                    <div className="post-info">
                        <div className="info-row">
                            <span className="label">Пост:</span>
                            <span className="value">{postTitle}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Канал:</span>
                            <span className="value">{channelName} ({platform})</span>
                        </div>
                    </div>

                    {desiredKPI && (
                        <div className="target-kpi">
                            <div className="target-title">🎯 Целевые показатели:</div>
                            <div className="target-grid">
                                <div>Лайки: {desiredKPI.targetLikes}</div>
                                <div>Просмотры: {desiredKPI.targetViews}</div>
                                <div>Репосты: {desiredKPI.targetReposts}</div>
                                <div>Комментарии: {desiredKPI.targetComments}</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="kpi-inputs-grid">
                            <div className="input-group">
                                <label>👍 Лайки</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.likes}
                                    onChange={(e) => setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })}
                                    required
                                />
                                {desiredKPI && (
                                    <span className="percent-hint">
                                        {getPercent(formData.likes, desiredKPI.targetLikes)}% от цели
                                    </span>
                                )}
                            </div>

                            <div className="input-group">
                                <label>👁️ Просмотры</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.views}
                                    onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                                    required
                                />
                                {desiredKPI && (
                                    <span className="percent-hint">
                                        {getPercent(formData.views, desiredKPI.targetViews)}% от цели
                                    </span>
                                )}
                            </div>

                            <div className="input-group">
                                <label>🔄 Репосты</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.reposts}
                                    onChange={(e) => setFormData({ ...formData, reposts: parseInt(e.target.value) || 0 })}
                                    required
                                />
                                {desiredKPI && (
                                    <span className="percent-hint">
                                        {getPercent(formData.reposts, desiredKPI.targetReposts)}% от цели
                                    </span>
                                )}
                            </div>

                            <div className="input-group">
                                <label>💬 Комментарии</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })}
                                    required
                                />
                                {desiredKPI && (
                                    <span className="percent-hint">
                                        {getPercent(formData.comments, desiredKPI.targetComments)}% от цели
                                    </span>
                                )}
                            </div>
                        </div>



                        <div className="kpi-form-actions">
                            <button type="button" className="btn-cancel" onClick={onCancel}>
                                Отмена
                            </button>
                            <button type="submit" className="btn-submit" disabled={submitting}>
                                {submitting ? 'Сохранение...' : 'Сохранить аналитику'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default KPIInputForm;