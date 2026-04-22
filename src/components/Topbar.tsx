
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import { logout } from '../store/slices/authSlice';

const Topbar = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Функция для перевода роли на русский
    const getRoleName = (role: string | undefined) => {
        switch(role) {
            case 'ADMIN': return 'Администратор';
            case 'MANAGER': return 'Менеджер';
            case 'AUTHOR': return 'Автор';
            default: return 'Пользователь';
        }
    };

    // Функция для заголовка в зависимости от роли
    const getPageTitle = () => {
        switch(user?.role) {
            case 'ADMIN': return 'Панель администратора';
            case 'MANAGER': return 'Панель менеджера';
            case 'AUTHOR': return 'Панель автора';
            default: return 'Центр управления контентом';
        }
    };

    return (
        <header className="topbar">
            <div className="topbar-title">{getPageTitle()}</div>
            <div className="topbar-actions">
                <div className="user-info">
                    <div className="user-details">
                        <div className="user-name">{user?.fullName || 'Пользователь'}</div>
                        <div className="user-role">{getRoleName(user?.role)}</div>
                    </div>
                </div>
                <button className="btn-ghost" onClick={handleLogout}>Выйти</button>
            </div>
        </header>
    );
};

export default Topbar;