
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchFooterSettings, updateFooterSettings } from '../store/slices/authSlice';
import type { FooterSettings } from '../api/auth';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';
import './Settings.css';


import logo1 from '../assets/logo1.png';
import logo2 from '../assets/logo2.png';
import logo3 from '../assets/logo3.png';

// Список доступных логотипов с импортированными изображениями
const availableLogos = [
    { filename: 'logo1.png', label: 'Логотип 1', preview: logo1 },
    { filename: 'logo2.png', label: 'Логотип 2', preview: logo2 },
    { filename: 'logo3.png', label: 'Логотип 3', preview: logo3 },
];

interface ValidationErrors {
    email?: string;
    emailLink?: string;
    phone?: string;
    phoneLink?: string;
    telegramUrl?: string;
    whatsappUrl?: string;
    discordUrl?: string;
    copyrightText?: string;
    copyrightLinkText?: string;
    legalText?: string;
}

const Settings = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { footerSettings } = useSelector((state: RootState) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState('logo1.png');
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const [formData, setFormData] = useState<FooterSettings>({
        email: '',
        emailLink: '',
        phone: '',
        phoneLink: '',
        socialLinks: {
            telegram: { label: 'Telegram', url: '' },
            whatsapp: { label: 'WhatsApp', url: '' },
            discord: { label: 'Discord', url: '' }
        },
        logoFilename: 'logo1.png',
        copyrightText: '',
        copyrightLinkText: '',
        legalText: '',
    });

    useEffect(() => {
        dispatch(fetchFooterSettings());
    }, [dispatch]);

    useEffect(() => {
        if (footerSettings) {
            setFormData(footerSettings);
            setSelectedLogo(footerSettings.logoFilename || 'logo1.png');
        }
    }, [footerSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Автоматическое форматирование номера телефона при вводе
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData(prev => ({ ...prev, [name]: formattedPhone }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Очищаем ошибку при вводе
        if (validationErrors[name as keyof ValidationErrors]) {
            setValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Функция форматирования номера телефона
    const formatPhoneNumber = (value: string): string => {
        // Удаляем все нецифровые символы
        const digits = value.replace(/\D/g, '');

        if (digits.length === 0) return '';

        // Форматируем для белорусских номеров (+375 XX XXX XX XX)
        let formatted = '';

        if (digits.length <= 3) {
            formatted = `+${digits}`;
        } else if (digits.length <= 5) {
            formatted = `+${digits.slice(0, 3)} ${digits.slice(3)}`;
        } else if (digits.length <= 8) {
            formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
        } else if (digits.length <= 10) {
            formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
        } else {
            formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
        }

        return formatted.trim();
    };

    // Функция проверки номера телефона
    const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
        if (!phone) return { isValid: true }; // Необязательное поле

        // Удаляем все нецифровые символы для проверки
        const digits = phone.replace(/\D/g, '');

        // Проверяем количество цифр (должно быть 12 для белорусских номеров: 375 + 9 цифр)
        if (digits.length === 0) {
            return { isValid: false, error: 'Введите номер телефона' };
        }

        if (digits.length < 12) {
            return { isValid: false, error: 'Номер телефона слишком короткий (должно быть 12 цифр: 375XXXXXXXX)' };
        }

        if (digits.length > 12) {
            return { isValid: false, error: 'Номер телефона слишком длинный (максимум 12 цифр)' };
        }

        // Проверяем, что номер начинается с 375 (код Беларуси)
        if (!digits.startsWith('375')) {
            return { isValid: false, error: 'Номер должен начинаться с +375 (код Беларуси)' };
        }

        // Проверяем код оператора (должен быть 25, 29, 33, 44)
        const operatorCode = digits.substring(3, 5);
        const validCodes = ['25', '29', '33', '44'];
        if (!validCodes.includes(operatorCode)) {
            return { isValid: false, error: 'Неверный код оператора. Допустимые коды: 25, 29, 33, 44' };
        }

        return { isValid: true };
    };




    // Функция генерации tel: ссылки из номера телефона
    const generatePhoneLink = (phone: string): string => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 0) return '';
        return `tel:+${digits}`;
    };

    const handleSocialLinkChange = (platform: 'telegram' | 'whatsapp' | 'discord', field: 'label' | 'url', value: string) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: {
                    ...prev.socialLinks[platform],
                    [field]: value
                }
            }
        }));

        // Очищаем ошибку для этого поля
        const errorKey = `${platform}Url` as keyof ValidationErrors;
        if (field === 'url' && validationErrors[errorKey]) {
            setValidationErrors(prev => ({ ...prev, [errorKey]: undefined }));
        }
    };

    const handleLogoSelect = (filename: string) => {
        setSelectedLogo(filename);
        setFormData(prev => ({ ...prev, logoFilename: filename }));
    };

    // Автоматическая генерация phoneLink из phone
    const autoGeneratePhoneLink = () => {
        if (formData.phone && !formData.phoneLink) {
            const generatedLink = generatePhoneLink(formData.phone);
            if (generatedLink) {
                setFormData(prev => ({ ...prev, phoneLink: generatedLink }));
            }
        }
    };

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        // === ВАЛИДАЦИЯ EMAIL ===
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = 'Введите корректный email адрес (пример: user@example.com)';
            }
        }

        // === ВАЛИДАЦИЯ EMAIL LINK ===
        if (formData.emailLink) {
            if (!formData.emailLink.startsWith('mailto:')) {
                errors.emailLink = 'Ссылка email должна начинаться с mailto:';
            } else if (formData.emailLink.length < 8) {
                errors.emailLink = 'Введите email после mailto: (пример: mailto:info@example.com)';
            } else {
                const emailAfterMailto = formData.emailLink.substring(7);
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailAfterMailto)) {
                    errors.emailLink = 'Некорректный email после mailto:';
                }
            }
        }

        // === ВАЛИДАЦИЯ ТЕЛЕФОНА ===
        const phoneValidation = validatePhoneNumber(formData.phone);
        if (!phoneValidation.isValid) {
            errors.phone = phoneValidation.error;
        }

        // === ВАЛИДАЦИЯ PHONE LINK ===
        if (formData.phoneLink) {
            if (!formData.phoneLink.startsWith('tel:')) {
                errors.phoneLink = 'Ссылка телефона должна начинаться с tel:';
            } else if (formData.phoneLink.length < 6) {
                errors.phoneLink = 'Введите номер после tel: (пример: tel:+79991234567)';
            } else {
                const phoneAfterTel = formData.phoneLink.substring(4);
                const digits = phoneAfterTel.replace(/\D/g, '');
                if (digits.length < 10 || digits.length > 12) {
                    errors.phoneLink = 'Некорректный номер телефона (10-12 цифр)';
                }
            }
        }

        // === ВАЛИДАЦИЯ URL СОЦСЕТЕЙ ===
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

        if (formData.socialLinks.telegram.url) {
            if (!urlRegex.test(formData.socialLinks.telegram.url) &&
                !formData.socialLinks.telegram.url.includes('t.me') &&
                !formData.socialLinks.telegram.url.includes('telegram')) {
                errors.telegramUrl = 'Введите корректную ссылку на Telegram (пример: https://t.me/username)';
            }
        }

        if (formData.socialLinks.whatsapp.url) {
            if (!urlRegex.test(formData.socialLinks.whatsapp.url) &&
                !formData.socialLinks.whatsapp.url.includes('wa.me') &&
                !formData.socialLinks.whatsapp.url.includes('whatsapp')) {
                errors.whatsappUrl = 'Введите корректную ссылку на WhatsApp (пример: https://wa.me/79991234567)';
            }
        }

        if (formData.socialLinks.discord.url) {
            if (!urlRegex.test(formData.socialLinks.discord.url) &&
                !formData.socialLinks.discord.url.includes('discord')) {
                errors.discordUrl = 'Введите корректную ссылку на Discord (пример: https://discord.gg/invite)';
            }
        }

        // === ВАЛИДАЦИЯ ТЕКСТА КОПИРАЙТА ===
        if (formData.copyrightText && formData.copyrightText.length > 200) {
            errors.copyrightText = 'Текст копирайта не должен превышать 200 символов';
        }

        // === ВАЛИДАЦИЯ ТЕКСТА ССЫЛКИ ===
        if (formData.copyrightLinkText && formData.copyrightLinkText.length > 100) {
            errors.copyrightLinkText = 'Текст ссылки не должен превышать 100 символов';
        }

        // === ВАЛИДАЦИЯ ТЕКСТА ПРАВ ===
        if (formData.legalText && formData.legalText.length > 10000) {
            errors.legalText = 'Текст прав не должен превышать 10000 символов';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Автоматически генерируем phoneLink если его нет
        autoGeneratePhoneLink();

        if (!validateForm()) {
            const firstErrorField = document.querySelector('.error-input');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsLoading(true);
        setSaveSuccess(false);

        try {
            await dispatch(updateFooterSettings(formData)).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении настроек');
        } finally {
            setIsLoading(false);
        }
    };

    const resetToDefault = () => {
        if (footerSettings) {
            setFormData(footerSettings);
            setSelectedLogo(footerSettings.logoFilename || 'logo1.png');
            setValidationErrors({});
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>Настройки системы</h1>
                    <p className="settings-subtitle">Управление контактной информацией и настройками футера</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
                {/* Контакты */}
                <div className="settings-card">
                    <h3> Контактная информация</h3>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="info@example.com"
                                    className={validationErrors.email ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.email && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.email}</span>
                                </div>
                            )}
                            <div className="field-hint">Необязательное поле</div>
                        </div>
                        <div className="input-group">
                            <label>Ссылка Email (mailto:)</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="emailLink"
                                    value={formData.emailLink || ''}
                                    onChange={handleInputChange}
                                    placeholder="mailto:info@example.com"
                                    className={validationErrors.emailLink ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.emailLink && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.emailLink}</span>
                                </div>
                            )}
                            <div className="field-hint">Должно начинаться с mailto:</div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Телефон</label>
                            <div className="input-wrapper">
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+375 29 123 45 67"
                                    className={validationErrors.phone ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.phone && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.phone}</span>
                                </div>
                            )}
                            <div className="field-hint">
                                Формат: +375 XX XXX XX XX (только цифры, пробелы и знак +)
                            </div>
                        </div>
                        <div className="input-group">
                        <label>Ссылка телефона (tel:)</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="phoneLink"
                                    value={formData.phoneLink || ''}
                                    onChange={handleInputChange}
                                    placeholder="tel:+79991234567"
                                    className={validationErrors.phoneLink ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.phoneLink && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.phoneLink}</span>
                                </div>
                            )}
                            <div className="field-hint">
                                Должно начинаться с tel: (генерируется автоматически из поля Телефон)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Социальные сети */}
                <div className="settings-card">
                    <h3> Социальные сети</h3>
                    {(['telegram', 'whatsapp', 'discord'] as const).map((platform) => {
                        const errorKey = `${platform}Url` as keyof ValidationErrors;
                        const platformNames = {
                            telegram: 'Telegram',
                            whatsapp: 'WhatsApp',
                            discord: 'Discord'
                        };
                        const placeholders = {
                            telegram: 'https://t.me/username или https://t.me/chat',
                            whatsapp: 'https://wa.me/79991234567',
                            discord: 'https://discord.gg/invite'
                        };

                        return (
                            <div key={platform} className="social-row">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>{platformNames[platform]} - название</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                value={formData.socialLinks[platform]?.label || ''}
                                                onChange={(e) => handleSocialLinkChange(platform, 'label', e.target.value)}
                                                placeholder={platformNames[platform]}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>{platformNames[platform]} - URL</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="url"
                                                value={formData.socialLinks[platform]?.url || ''}
                                                onChange={(e) => handleSocialLinkChange(platform, 'url', e.target.value)}
                                                placeholder={placeholders[platform]}
                                                className={validationErrors[errorKey] ? 'error-input' : ''}
                                            />
                                        </div>
                                        {validationErrors[errorKey] && (
                                            <div className="field-error">
                                                <FiAlertCircle size={14} />
                                                <span>{validationErrors[errorKey]}</span>
                                            </div>
                                        )}
                                        <div className="field-hint">Необязательное поле</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Логотип - выбор из 3 иконок */}
                <div className="settings-card">
                    <h3> Выбор логотипа</h3>
                    <div className="logo-selector">
                        <p className="logo-hint">Выберите один из доступных логотипов:</p>
                        <div className="logo-options">
                            {availableLogos.map((logo) => (
                                <div
                                    key={logo.filename}
                                    className={`logo-option ${selectedLogo === logo.filename ? 'selected' : ''}`}
                                    onClick={() => handleLogoSelect(logo.filename)}
                                >
                                    <img
                                        src={logo.preview}
                                        alt={logo.label}
                                        className="logo-option-img"
                                    />
                                    <span className="logo-option-label">{logo.label}</span>
                                    {selectedLogo === logo.filename && (
                                        <div className="logo-check">✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Копирайт */}
                <div className="settings-card">
                    <h3> Копирайт и права</h3>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Текст копирайта</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="copyrightText"
                                    value={formData.copyrightText}
                                    onChange={handleInputChange}
                                    placeholder="Все права защищены"
                                    className={validationErrors.copyrightText ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.copyrightText && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.copyrightText}</span>
                                </div>
                            )}
                            <div className="field-hint">Максимум 200 символов</div>
                        </div>
                        <div className="input-group">
                            <label>Текст ссылки прав</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="copyrightLinkText"
                                    value={formData.copyrightLinkText}
                                    onChange={handleInputChange}
                                    placeholder="Пользовательское соглашение"
                                    className={validationErrors.copyrightLinkText ? 'error-input' : ''}
                                />
                            </div>
                            {validationErrors.copyrightLinkText && (
                                <div className="field-error">
                                    <FiAlertCircle size={14} />
                                    <span>{validationErrors.copyrightLinkText}</span>
                                </div>
                            )}
                            <div className="field-hint">Максимум 100 символов</div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Текст прав (для модального окна)</label>
                        <div className="input-wrapper">
                            <textarea
                                name="legalText"
                                value={formData.legalText || ''}
                                onChange={handleInputChange}
                                rows={8}
                                placeholder="Введите текст пользовательского соглашения..."
                                className={validationErrors.legalText ? 'error-input' : ''}
                            />
                        </div>
                        {validationErrors.legalText && (
                            <div className="field-error">
                                <FiAlertCircle size={14} />
                                <span>{validationErrors.legalText}</span>
                            </div>
                        )}
                        <div className="field-hint">Максимум 10000 символов</div>
                    </div>
                </div>

                {/* Кнопки действий */}
                <div className="settings-actions">
                    <button type="button" className="btn-secondary" onClick={resetToDefault}>
                        Сбросить
                    </button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                </div>

                {saveSuccess && (
                    <div className="save-success">
                        <FiCheck size={16} />
                        <span>Настройки успешно сохранены!</span>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Settings;