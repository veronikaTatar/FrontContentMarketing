
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchFooterSettings } from '../store/slices/authSlice';
import LegalModal from './LegalModal';
import './Footer.css';


import logo1 from '../assets/logo1.png';
import logo2 from '../assets/logo2.png';
import logo3 from '../assets/logo3.png';

const logosMap: Record<string, string> = {
    'logo1.png': logo1,
    'logo2.png': logo2,
    'logo3.png': logo3,
};

const Footer = () => {
    const dispatch = useDispatch<AppDispatch>();
    const currentYear = new Date().getFullYear();
    const { footerSettings } = useSelector((state: RootState) => state.auth);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchFooterSettings());
    }, [dispatch]);

    const defaultSettings = {
        email: 'info@contentmarketing.ru',
        emailLink: 'mailto:info@contentmarketing.ru',
        phone: '+375 (29) 35-78-123',
        phoneLink: 'tel:+375293578123',
        socialLinks: {
            telegram: { label: 'Telegram', url: 'https://t.me/contentmarketing' },
            whatsapp: { label: 'WhatsApp', url: 'https://wa.me/375293578123' },
            discord: { label: 'Discord', url: 'https://discord.gg/contentmarketing' }
        },
        logoFilename: 'logo1.png',
        copyrightText: 'Все права защищены',
        copyrightLinkText: 'Пользовательское соглашение',
        legalText: 'Настоящий документ... (текст прав)',
    };

    const settings = footerSettings ? {
        email: footerSettings.email || defaultSettings.email,
        emailLink: footerSettings.emailLink || defaultSettings.emailLink,
        phone: footerSettings.phone || defaultSettings.phone,
        phoneLink: footerSettings.phoneLink || defaultSettings.phoneLink,
        socialLinks: {
            telegram: footerSettings.socialLinks?.telegram || defaultSettings.socialLinks.telegram,
            whatsapp: footerSettings.socialLinks?.whatsapp || defaultSettings.socialLinks.whatsapp,
            discord: footerSettings.socialLinks?.discord || defaultSettings.socialLinks.discord,
        },
        logoFilename: footerSettings.logoFilename || defaultSettings.logoFilename,
        copyrightText: footerSettings.copyrightText || defaultSettings.copyrightText,
        copyrightLinkText: footerSettings.copyrightLinkText || defaultSettings.copyrightLinkText,
        legalText: footerSettings.legalText || defaultSettings.legalText,
    } : defaultSettings;

    // Получаем правильный логотип из маппинга
    const logoSrc = logosMap[settings.logoFilename] || logo1;

    return (
        <>
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <img
                            src={logoSrc}
                            alt="Logo"
                            className="footer-logo"
                        />
                        <span className="company-name">
                            Content<span className="highlight">Marketing</span>
                        </span>
                    </div>

                    <div className="footer-contacts">
                        <a href={settings.emailLink} className="footer-link">
                            📧 {settings.email}
                        </a>
                        <a href={settings.phoneLink} className="footer-link">
                            📞 {settings.phone}
                        </a>
                    </div>

                    <div className="footer-social">
                        <a href={settings.socialLinks.telegram.url} target="_blank" rel="noopener noreferrer">
                            {settings.socialLinks.telegram.label}
                        </a>
                        <a href={settings.socialLinks.whatsapp.url} target="_blank" rel="noopener noreferrer">
                            {settings.socialLinks.whatsapp.label}
                        </a>
                        <a href={settings.socialLinks.discord.url} target="_blank" rel="noopener noreferrer">
                            {settings.socialLinks.discord.label}
                        </a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>
                        © {currentYear} {settings.copyrightText}
                        <button
                            className="copyright-link"
                            onClick={() => setIsLegalModalOpen(true)}
                        >
                            {settings.copyrightLinkText}
                        </button>
                    </p>
                </div>
            </footer>

            <LegalModal
                isOpen={isLegalModalOpen}
                onClose={() => setIsLegalModalOpen(false)}
                legalText={settings.legalText}
                title={settings.copyrightLinkText}
            />
        </>
    );
};

export default Footer;