import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import type { Role } from '../types';
import { FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';
import { usersApi } from '../api/users';
import heroArt from '../assets/content1.png';
import './Register.css';

const Register = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState({
        login: '',
        email: '',
        password: '',
        fullName: '',
        role: 'AUTHOR' as Role,
    });

    const [validationErrors, setValidationErrors] = useState<{
        fullName?: string;
        login?: string;
        email?: string;
        password?: string;
    }>({});

    // Состояния для проверки уникальности (только после отправки)
    const [loginStatus, setLoginStatus] = useState<'idle' | 'taken' | 'available'>('idle');
    const [emailStatus, setEmailStatus] = useState<'idle' | 'taken' | 'available'>('idle');

    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        hasNumber: false,
        hasLetter: false
    });

    // Обработка ошибок от сервера (после отправки формы)
    useEffect(() => {
        if (error) {
            if (error.includes('Login already exists')) {
                setLoginStatus('taken');
                setValidationErrors(prev => ({
                    ...prev,
                    login: 'Этот логин уже занят'
                }));
            }
            if (error.includes('Email already exists')) {
                setEmailStatus('taken');
                setValidationErrors(prev => ({
                    ...prev,
                    email: 'Этот email уже зарегистрирован'
                }));
            }
        }
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Очищаем ошибку поля при вводе
        if (validationErrors[name as keyof typeof validationErrors]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined,
            }));
        }

        // Сбрасываем статус уникальности при изменении логина/email
        if (name === 'login') {
            setLoginStatus('idle');
        }
        if (name === 'email') {
            setEmailStatus('idle');
        }

        // Проверка силы пароля
        if (name === 'password') {
            setPasswordStrength({
                length: value.length >= 6,
                hasNumber: /\d/.test(value),
                hasLetter: /[a-zA-Zа-яА-Я]/.test(value)
            });
        }
    };

    // Базовая валидация формы (без проверки уникальности)
    const validateBase = (): boolean => {
        const errors: {
            fullName?: string;
            login?: string;
            email?: string;
            password?: string;
        } = {};

        // === ВАЛИДАЦИЯ ФИО ===
        if (!formData.fullName.trim()) {
            errors.fullName = 'Введите ФИО';
        } else if (formData.fullName.trim().length < 2) {
            errors.fullName = 'ФИО должно содержать минимум 2 символа';
        } else if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(formData.fullName)) {
            errors.fullName = 'ФИО может содержать только буквы, пробелы и дефисы';
        } else if (/\d/.test(formData.fullName)) {
            errors.fullName = 'ФИО не должно содержать цифры';
        } else if (formData.fullName.trim().split(/\s+/).length < 2) {
            errors.fullName = 'Введите полное ФИО (минимум 2 слова)';
        }

        // === ВАЛИДАЦИЯ ЛОГИНА ===
        if (!formData.login.trim()) {
            errors.login = 'Введите логин';
        } else if (formData.login.trim().length < 3) {
            errors.login = 'Логин должен содержать минимум 3 символа';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.login)) {
            errors.login = 'Логин может содержать только буквы, цифры и underscore';
        }

        // === ВАЛИДАЦИЯ EMAIL ===
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Введите email';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Введите корректный email адрес';
        }

        // === ВАЛИДАЦИЯ ПАРОЛЯ ===
        if (!formData.password) {
            errors.password = 'Введите пароль';
        } else if (formData.password.length < 6) {
            errors.password = 'Пароль должен содержать минимум 6 символов';
        } else if (!passwordStrength.hasNumber || !passwordStrength.hasLetter) {
            errors.password = 'Пароль должен содержать буквы и цифры';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Сначала базовая валидация
        if (!validateBase()) {
            return;
        }

        // Проверка уникальности логина
        let loginExists = false;
        try {
            const loginResponse = await usersApi.checkLoginExists(formData.login);
            loginExists = loginResponse.data.exists;
            setLoginStatus(loginExists ? 'taken' : 'available');

            if (loginExists) {
                setValidationErrors(prev => ({
                    ...prev,
                    login: 'Этот логин уже занят'
                }));
            }
        } catch (err) {
            console.error('Ошибка проверки логина:', err);
        }

        // Проверка уникальности email
        let emailExists = false;
        try {
            const emailResponse = await usersApi.checkEmailExists(formData.email);
            emailExists = emailResponse.data.exists;
            setEmailStatus(emailExists ? 'taken' : 'available');

            if (emailExists) {
                setValidationErrors(prev => ({
                    ...prev,
                    email: 'Этот email уже зарегистрирован'
                }));
            }
        } catch (err) {
            console.error('Ошибка проверки email:', err);
        }

        // Если что-то занято — не отправляем
        if (loginExists || emailExists) {
            return;
        }

        // Всё проверено — отправляем форму
        const result = await dispatch(register(formData));
        if (register.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };

    const getPasswordStrengthColor = () => {
        const { length, hasNumber, hasLetter } = passwordStrength;
        const strength = [length, hasNumber, hasLetter].filter(Boolean).length;
        if (strength === 3) return '#16a34a';
        if (strength === 2) return '#f59e0b';
        return '#dc2626';
    };

    const getPasswordStrengthText = () => {
        const { length, hasNumber, hasLetter } = passwordStrength;
        const strength = [length, hasNumber, hasLetter].filter(Boolean).length;
        if (strength === 3) return 'Сильный';
        if (strength === 2) return 'Средний';
        return 'Слабый';
    };

    // Иконка статуса для поля (только после проверки)
    const renderStatusIcon = (status: 'idle' | 'taken' | 'available') => {
        switch (status) {
            case 'available':
                return <FiCheck className="status-icon" size={18} color="#16a34a" />;
            case 'taken':
                return <FiX className="status-icon" size={18} color="#dc2626" />;
            default:
                return null;
        }
    };

    return (
        <div className="register-container">
            {/* Левая панель - иллюстрация */}
            <div className="register-hero">
                <div className="hero-content">
                    <img
                        className="hero-image"
                        src={heroArt}
                        alt="Content marketing illustration"
                    />
                    <h2 className="hero-title">Content<span>Marketing</span></h2>
                    <p className="hero-description">
                        Присоединяйтесь к платформе
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

            {/* Правая панель - форма регистрации */}
            <div className="register-form-panel">
                <div className="register-brand">
                    <div className="brand-icon">✍️</div>
                    <div className="brand-text">
                        <h2>Content<span>Marketing</span></h2>
                        <p>Управление контентом</p>
                    </div>
                </div>

                <div className="register-welcome">
                    <h1>Создать аккаунт</h1>
                    <p className="welcome-text">Заполните форму, чтобы начать работу</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    {/* === ФИО === */}
                    <div className="input-group">
                        <label>ФИО</label>
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
                        <div className="field-hint">
                            Только буквы, пробелы и дефисы. Минимум 2 слова
                        </div>
                    </div>

                    {/* === ЛОГИН === */}
                    <div className="input-group">
                        <label>Логин</label>
                        <div className="input-with-icon">
                            <input
                                type="text"
                                name="login"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="ivanov_ivan"
                                className={validationErrors.login ? 'error-input' : ''}
                            />
                            {renderStatusIcon(loginStatus)}
                        </div>
                        {validationErrors.login && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.login}</span>
                            </div>
                        )}
                        {loginStatus === 'available' && (
                            <div className="field-success">
                                <FiCheck size={14} />
                                <span>Логин свободен</span>
                            </div>
                        )}
                    </div>

                    {/* === EMAIL === */}
                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-with-icon">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ivanov@example.com"
                                className={validationErrors.email ? 'error-input' : ''}
                            />
                            {renderStatusIcon(emailStatus)}
                        </div>
                        {validationErrors.email && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.email}</span>
                            </div>
                        )}
                        {emailStatus === 'available' && (
                            <div className="field-success">
                                <FiCheck size={14} />
                                <span>Email свободен</span>
                            </div>
                        )}
                    </div>

                    {/* === ПАРОЛЬ === */}
                    <div className="input-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={validationErrors.password ? 'error-input' : ''}
                        />
                        {formData.password && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${[passwordStrength.length, passwordStrength.hasNumber, passwordStrength.hasLetter].filter(Boolean).length * 33.33}%`,
                                            backgroundColor: getPasswordStrengthColor()
                                        }}
                                    />
                                </div>
                                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                                    {getPasswordStrengthText()} пароль
                                </span>
                            </div>
                        )}
                        {validationErrors.password && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.password}</span>
                            </div>
                        )}
                        <div className="password-hint">
                            <span className={passwordStrength.length ? 'valid' : ''}>
                                {passwordStrength.length ? '✓' : '○'} минимум 6 символов
                            </span>
                            <span className={passwordStrength.hasLetter ? 'valid' : ''}>
                                {passwordStrength.hasLetter ? '✓' : '○'} буквы
                            </span>
                            <span className={passwordStrength.hasNumber ? 'valid' : ''}>
                                {passwordStrength.hasNumber ? '✓' : '○'} цифры
                            </span>
                        </div>
                    </div>

                    {/* === РОЛЬ === */}
                    <div className="input-group">
                        <label>Роль</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="AUTHOR">Автор</option>
                            <option value="MANAGER">Менеджер</option>
                            <option value="ADMIN">Администратор</option>
                        </select>
                    </div>

                    {error && !error.includes('Login already exists') && !error.includes('Email already exists') && (
                        <div className="error-message error-auth">
                            <div className="error-icon">
                                <FiAlertCircle size={16} />
                            </div>
                            <div className="error-content">
                                <div className="error-title">Ошибка регистрации</div>
                                <div className="error-description">{error}</div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                    </button>
                </form>

                <div className="register-footer">
                    <span>Уже есть аккаунт?</span>
                    <Link to="/login">Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;