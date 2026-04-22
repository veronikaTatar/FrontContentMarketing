import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';
import { FiAlertCircle, FiWifiOff, FiGithub } from 'react-icons/fi';
import heroArt from '../assets/content1.png';
import './Login.css';

const Login = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState({ loginOrEmail: '', password: '' });
    const [validationErrors, setValidationErrors] = useState<{ loginOrEmail?: string; password?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (validationErrors[e.target.name as keyof typeof validationErrors]) {
            setValidationErrors({
                ...validationErrors,
                [e.target.name]: undefined,
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: { loginOrEmail?: string; password?: string } = {};

        if (!formData.loginOrEmail.trim()) {
            errors.loginOrEmail = 'Введите логин или email';
        }

        if (!formData.password) {
            errors.password = 'Введите пароль';
        } else if (formData.password.length < 6) {
            errors.password = 'Пароль должен содержать минимум 6 символов';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getErrorMessage = (errorMsg: string | null): { title: string; description: string } => {
        if (!errorMsg) return { title: '', description: '' };

        if (errorMsg.includes('Invalid password') || errorMsg.includes('Invalid credentials')) {
            return { title: 'Неверный пароль', description: 'Проверьте правильность введённого пароля' };
        }
        if (errorMsg.includes('User not found')) {
            return { title: 'Пользователь не найден', description: 'Пользователь с таким логином или email не зарегистрирован' };
        }
        if (errorMsg.includes('User is blocked')) {
            return { title: 'Доступ заблокирован', description: 'Ваш аккаунт заблокирован. Обратитесь к администратору' };
        }
        if (errorMsg.includes('Network Error') || errorMsg.includes('Failed to fetch')) {
            return { title: 'Ошибка сети', description: 'Не удалось подключиться к серверу. Проверьте интернет-соединение' };
        }
        if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
            return { title: 'Превышено время ожидания', description: 'Сервер не отвечает. Попробуйте позже' };
        }
        if (errorMsg.includes('500')) {
            return { title: 'Ошибка сервера', description: 'На сервере произошла ошибка. Попробуйте позже' };
        }
        if (errorMsg.includes('403')) {
            return { title: 'Доступ запрещён', description: 'У вас нет прав для входа в систему' };
        }

        return { title: 'Ошибка входа', description: errorMsg };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = formData.loginOrEmail.includes('@')
            ? { email: formData.loginOrEmail, password: formData.password }
            : { login: formData.loginOrEmail, password: formData.password };

        const result = await dispatch(login(payload));
        if (login.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };




    const handleGitHubLogin = () => {
        // Просто переходим на OAuth2 эндпоинт Spring Security
        window.location.href = 'http://localhost:8081/oauth2/authorization/github';
    };

    const errorInfo = getErrorMessage(error);

    return (
        <div className="login-container">
            {/* Левая панель - иллюстрация */}
            <div className="login-hero">
                <div className="hero-content">
                    <img
                        className="hero-image"
                        src={heroArt}
                        alt="Content marketing illustration"
                    />
                    <h2 className="hero-title">Content<span>Marketing</span></h2>
                    <p className="hero-description">
                        Планируйте. Создавайте. Анализируйте.
                    </p>
                    <div className="feature-list">
                        <div className="feature"><span>✓</span> Управление контентом</div>
                        <div className="feature"><span>✓</span> Календарь публикаций</div>
                        <div className="feature"><span>✓</span> Аналитика и KPI</div>
                    </div>
                </div>
            </div>

            {/* Правая панель - форма входа */}
            <div className="login-form-panel">
                <div className="login-brand">
                    <div className="brand-icon">✍️</div>
                    <div className="brand-text">
                        <h2>Content<span>Marketing</span></h2>
                        <p>Управление контентом</p>
                    </div>
                </div>

                <div className="login-welcome">
                    <h1>Добро пожаловать!</h1>
                    <p className="welcome-text">Войдите в систему, чтобы управлять контентом, задачами и аналитикой</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Логин или Email</label>
                        <input
                            type="text"
                            name="loginOrEmail"
                            value={formData.loginOrEmail}
                            onChange={handleChange}
                            placeholder="Введите логин или email"
                            className={validationErrors.loginOrEmail ? 'error-input' : ''}
                        />
                        {validationErrors.loginOrEmail && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.loginOrEmail}</span>
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Введите пароль"
                            className={validationErrors.password ? 'error-input' : ''}
                        />
                        {validationErrors.password && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.password}</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className={`error-message ${errorInfo.title === 'Ошибка сети' ? 'error-network' : 'error-auth'}`}>
                            <div className="error-icon">
                                {errorInfo.title === 'Ошибка сети' ? <FiWifiOff size={16} /> : <FiAlertCircle size={16} />}
                            </div>
                            <div className="error-content">
                                <div className="error-title">{errorInfo.title}</div>
                                <div className="error-description">{errorInfo.description}</div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div className="login-divider">
                    <span>или продолжить с</span>
                </div>

                <div className="oauth-buttons">

                    <button onClick={handleGitHubLogin} className="oauth-btn github-btn">
                        <FiGithub size={20} />
                        Войти через GitHub
                    </button>
                </div>

                <div className="login-footer">
                    <span>Нет аккаунта?</span>
                    <Link to="/register">Создать аккаунт</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;