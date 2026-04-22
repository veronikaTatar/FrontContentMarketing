import { useEffect, useState } from 'react';
import { channelsApi } from '../api/channels';
import type { Channel } from '../types';
import './Channels.css';

const Channels = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [verifyingChannel, setVerifyingChannel] = useState<number | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<Record<number, { connected: boolean; message: string }>>({});

    const [form, setForm] = useState({
        name: '',
        platform: 'telegram',
        isActive: true,
        externalId: '',
        accessToken: ''
    });

    const handleVerifyConnection = async (channel: Channel) => {
        setVerifyingChannel(channel.idChannel);
        setError(null);
        setSuccess(null);

        try {
            const response = await channelsApi.verifyConnection(channel.idChannel);
            const { connected, message } = response.data;

            setConnectionStatus(prev => ({
                ...prev,
                [channel.idChannel]: { connected, message }
            }));

            if (connected) {
                setSuccess('Подключение активно');
            } else {
                setError(message || 'Проблема с подключением');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Не удалось проверить подключение';
            setError(errorMessage);
            setConnectionStatus(prev => ({
                ...prev,
                [channel.idChannel]: { connected: false, message: errorMessage }
            }));
        } finally {
            setVerifyingChannel(null);
            setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
        }
    };

    const load = () => {
        setError(null);
        setSuccess(null);
        channelsApi.list()
            .then((res) => setChannels(res.data.content))
            .catch((err) => {
                setChannels([]);
                setError(err?.response?.data?.message || 'Не удалось загрузить каналы');
                setTimeout(() => setError(null), 5000);
            });
    };

    useEffect(() => {
        load();
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.name === 'isActive'
            ? (e.target as HTMLSelectElement).value === 'true'
            : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await channelsApi.create(form);
            const newChannel = response.data;

            setForm({ name: '', platform: 'telegram', isActive: true, externalId: '', accessToken: '' });
            setSuccess('Канал создан!');

            await handleVerifyConnection(newChannel);
            load();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось создать канал');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (channel: Channel) => {
        setEditingChannel(channel);
        setForm({
            name: channel.name,
            platform: channel.platform,
            isActive: channel.isActive,
            externalId: channel.externalId || '',
            accessToken: channel.accessToken || ''
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChannel) return;



        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await channelsApi.update(editingChannel.idChannel, form);
            setEditingChannel(null);
            setForm({ name: '', platform: 'telegram', isActive: true, externalId: '', accessToken: '' });
            setSuccess('Канал обновлён!');
            load();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Не удалось обновить канал');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (channel: Channel) => {
        if (!window.confirm(`Удалить канал "${channel.name}"?`)) return;

        setError(null);
        setSuccess(null);

        try {
            await channelsApi.remove(channel.idChannel);
            setSuccess('Канал удалён');
            load();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err?.response?.data?.message || 'Не удалось удалить канал');
        }
    };

    const cancelEdit = () => {
        setEditingChannel(null);
        setForm({ name: '', platform: 'telegram', isActive: true, externalId: '', accessToken: '' });
    };

    const getPlaceholder = (platform: string) => {
        if (platform === 'telegram') {
            return '@FlowerForMeContent';
        }
        return '1493246920364130319';
    };

    const getHelperText = (platform: string) => {
        if (platform === 'telegram') {
            return 'Для Telegram: @username канала';
        }
        return 'Для Discord: ID канала (включите Режим разработчика в Discord)';
    };

    const getTokenHelper = (platform: string) => {
        if (platform === 'telegram') {
            return 'Токен от @BotFather';
        }
        return 'Токен из Discord Developer Portal -> Bot';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Каналы</h1>
                    <p className="muted">Управление каналами Telegram и Discord</p>
                </div>
            </div>

            {error && (
                <div className="alert-banner alert-error">
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {success && (
                <div className="alert-banner alert-success">
                    <span>{success}</span>
                    <button className="alert-close" onClick={() => setSuccess(null)}>✕</button>
                </div>
            )}

            {/* Форма создания/редактирования */}
            <div className="panel">
                <h3>{editingChannel ? 'Редактировать канал' : 'Добавить новый канал'}</h3>

                <form className="form-grid" onSubmit={editingChannel ? handleUpdate : handleCreate}>
                    <div className="form-group">
                        <label>Название канала</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            placeholder="Мой канал"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Платформа</label>
                        <select name="platform" value={form.platform} onChange={onChange} required>
                            <option value="telegram">Telegram</option>
                            <option value="discord">Discord</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>ID канала</label>
                        <input
                            name="externalId"
                            value={form.externalId}
                            onChange={onChange}
                            placeholder={getPlaceholder(form.platform)}
                            required
                        />
                        <small className="muted">{getHelperText(form.platform)}</small>
                    </div>

                    <div className="form-group">
                        <label>Токен бота</label>
                        <input
                            name="accessToken"
                            value={form.accessToken}
                            onChange={onChange}
                            placeholder={form.platform === 'telegram'
                                ? '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'
                                : 'MTQ5MzM5NTI2NDkwMjI3MTExNg.GMe_RB...'}
                            required
                        />
                        <small className="muted">{getTokenHelper(form.platform)}</small>
                    </div>

                    <div className="form-group">
                        <label>Статус</label>
                        <select name="isActive" value={String(form.isActive)} onChange={onChange}>
                            <option value="true">Активен</option>
                            <option value="false">Пауза</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button className="btn primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Сохранение...' : (editingChannel ? 'Сохранить' : 'Добавить')}
                        </button>
                        {editingChannel && (
                            <button className="btn secondary" type="button" onClick={cancelEdit}>
                                Отмена
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Таблица каналов */}
            <div className="panel">
                <h3>Список каналов</h3>

                {channels.length === 0 ? (
                    <div className="muted text-center py-4">Нет добавленных каналов</div>
                ) : (
                    <table className="channels-table">
                        <thead>
                        <tr>
                            <th className="col-name">Название</th>
                            <th className="col-platform">Платформа</th>
                            <th className="col-id">ID</th>
                            <th className="col-status">Статус</th>
                            <th className="col-connection">Подключение</th>
                            <th className="col-actions">Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {channels.map((ch) => (
                            <tr key={ch.idChannel}>
                                <td className="col-name">
                                    <div className="channel-name">{ch.name}</div>
                                </td>
                                <td className="col-platform">
                                    <span className="platform-badge">{ch.platform}</span>
                                </td>
                                <td className="col-id">
                                    <span className="muted">{ch.externalId || '—'}</span>
                                </td>
                                <td className="col-status">
                                    <span className={`badge ${ch.isActive ? 'badge-active' : 'badge-paused'}`}>
                                        {ch.isActive ? 'Активен' : 'Пауза'}
                                    </span>
                                </td>
                                <td className="col-connection">
                                    {connectionStatus[ch.idChannel] ? (
                                        <span className={`badge ${connectionStatus[ch.idChannel].connected ? 'badge-success' : 'badge-error'}`}>
                                            {connectionStatus[ch.idChannel].connected ? '✓ Подключен' : '✕ Ошибка'}
                                        </span>
                                    ) : (
                                        <span className="badge badge-neutral">Не проверен</span>
                                    )}
                                </td>
                                <td className="col-actions">
                                    <div className="actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleVerifyConnection(ch)}
                                            disabled={verifyingChannel === ch.idChannel}
                                            title="Проверить подключение"
                                        >
                                            {verifyingChannel === ch.idChannel ? '⏳' : '🔌'}
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEdit(ch)}
                                            title="Редактировать"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            className="btn-icon danger"
                                            onClick={() => handleDelete(ch)}
                                            title="Удалить"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Инструкция */}
            <div className="panel info-panel">
                <h4>Как настроить каналы</h4>

                <div className="info-section">
                    <h5>Telegram</h5>
                    <ol>
                        <li>Создайте канал в Telegram</li>
                        <li>Создайте бота через @BotFather и получите токен</li>
                        <li>Добавьте бота в канал как администратора</li>
                        <li>Введите @username канала и токен бота в форму выше</li>
                    </ol>
                </div>

                <div className="info-section">
                    <h5>Discord</h5>
                    <ol>
                        <li>Создайте сервер и канал в Discord</li>
                        <li>Создайте бота в Discord Developer Portal</li>
                        <li>Скопируйте токен бота (вкладка Bot - Reset Token)</li>
                        <li>Пригласите бота на сервер (OAuth2 - URL Generator)</li>
                        <li>Включите Режим разработчика и скопируйте ID канала</li>
                        <li>Введите ID канала и токен бота в форму выше</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Channels;