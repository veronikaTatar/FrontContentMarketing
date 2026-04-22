// src/components/LegalModal.tsx
import { useEffect } from 'react';
import './LegalModal.css';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    legalText: string;
    title?: string;
}

const LegalModal = ({ isOpen, onClose, legalText, title = 'Пользовательское соглашение' }: LegalModalProps) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="legal-content">
                        {legalText.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LegalModal;