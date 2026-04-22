import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';
import type { Role } from '../types';
import { FiAlertCircle } from 'react-icons/fi';
import heroArt from '../assets/content1.png';
import './OAuth2Callback.css';

const OAuth2Callback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch<AppDispatch>();

    const [showSetup, setShowSetup] = useState(false);
    const [oauthData, setOauthData] = useState<{
        accessToken: string;
        refreshToken: string;
        email: string;
        login: string;
        tempUser: any;
    } | null>(null);

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const role = searchParams.get('role') as Role;
        const fullName = searchParams.get('fullName');
        const email = searchParams.get('email');
        const isNewUser = searchParams.get('isNewUser') === 'true';  // ← ЧИТАЕМ ФЛАГ

        if (!accessToken || !refreshToken || !email) {
            navigate('/login?error=oauth_failed', { replace: true });
            return;
        }

        // Показываем форму ТОЛЬКО если:
        // 1. Это новый пользователь (isNewUser = true)
        // 2. И данные неполные
        const needsSetup = isNewUser && (!fullName || fullName === email);

        if (needsSetup) {
            // Показываем форму донастройки...
        } else {
            // Существующий пользователь — сразу в систему
            completeAuth(accessToken, refreshToken, { role, fullName, email });
        }
    }, [searchParams]);

    const completeAuth = (token: string, refresh: string, user: any) => {
        dispatch(setCredentials({
            token,
            refreshToken: refresh,
            user
        }));
        navigate('/dashboard', { replace: true });
    };

    if (showSetup && oauthData) {
        return <ProfileSetupForm
            oauthData={oauthData}
            onComplete={completeAuth}
            onCancel={() => navigate('/login')}
        />;
    }

    return (
        <div className="oauth-callback-container">
            <div className="oauth-spinner"></div>
            <p>Завершение авторизации...</p>
        </div>
    );
};

const ProfileSetupForm = ({ oauthData, onComplete, onCancel }: any) => {
    const [formData, setFormData] = useState({
        fullName: oauthData.tempUser.fullName || '',
        login: oauthData.login,
        role: 'AUTHOR' as Role
    });

    const [validationErrors, setValidationErrors] = useState<{
        fullName?: string;
        login?: string;
    }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (validationErrors[name as keyof typeof validationErrors]) {
            setValidationErrors({
                ...validationErrors,
                [name]: undefined,
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: { fullName?: string; login?: string } = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Введите ФИО';
        } else if (formData.fullName.trim().length < 2) {
            errors.fullName = 'ФИО должно содержать минимум 2 символа';
        }

        if (!formData.login.trim()) {
            errors.login = 'Введите логин';
        } else if (formData.login.trim().length < 3) {
            errors.login = 'Логин должен содержать минимум 3 символа';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.login)) {
            errors.login = 'Логин может содержать только буквы, цифры и underscore';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onComplete(oauthData.accessToken, oauthData.refreshToken, {
            email: oauthData.email,
            fullName: formData.fullName,
            role: formData.role
        });
    };

    return (
        <div className="oauth-setup-container">
            {/* Левая панель - иллюстрация */}
            <div className="oauth-setup-hero">
                <div className="hero-content">
                    <img
                        className="hero-image"
                        src={heroArt}
                        alt="Content marketing illustration"
                    />
                    <h2 className="hero-title">Content<span>Marketing</span></h2>
                    <p className="hero-description">
                        Добро пожаловать на платформу
                    </p>
                    <div className="feature-list">
                        <div className="feature">
                            <span>✓</span> Управление контентом
                        </div>
                        <div className="feature">
                            <span>✓</span> Календарь публикаций
                        </div>
                        <div className="feature">
                            <span>✓</span> Аналитика и KPI
                        </div>
                    </div>
                </div>
            </div>

            {/* Правая панель - форма донастройки */}
            <div className="oauth-setup-form-panel">
                <div className="oauth-setup-brand">
                    <div className="brand-icon">👋</div>
                    <div className="brand-text">
                        <h2>Content<span>Marketing</span></h2>
                        <p>Завершение регистрации</p>
                    </div>
                </div>

                <div className="oauth-setup-welcome">
                    <h1>Добро пожаловать!</h1>
                    <p className="welcome-text">Заполните недостающие данные для завершения регистрации</p>
                </div>

                <form onSubmit={handleSubmit} className="oauth-setup-form">
                    <div className="input-group">
                        <label>Email (из GitHub)</label>
                        <input
                            type="email"
                            value={oauthData.email}
                            disabled
                            className="email-disabled"
                        />
                    </div>

                    <div className="input-group">
                        <label>Логин *</label>
                        <input
                            type="text"
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            placeholder="ivanov_ivan"
                            className={validationErrors.login ? 'error-input' : ''}
                        />
                        {validationErrors.login && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.login}</span>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label>ФИО *</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Иванов Иван Иванович"
                            className={validationErrors.fullName ? 'error-input' : ''}
                        />
                        {validationErrors.fullName && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.fullName}</span>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Роль</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="AUTHOR">Автор</option>
                            <option value="MANAGER">Менеджер</option>
                            <option value="ADMIN">Администратор</option>
                        </select>
                    </div>

                    <button type="submit" className="oauth-setup-btn">
                        Продолжить
                    </button>

                    <button type="button" onClick={onCancel} className="oauth-setup-btn-secondary">
                        Отмена
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OAuth2Callback;