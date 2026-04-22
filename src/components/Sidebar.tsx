
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { getMenuByRole } from '../config/menuConfig';


import logo1 from '../assets/logo1.png';
import logo2 from '../assets/logo2.png';
import logo3 from '../assets/logo3.png';

const logosMap: Record<string, string> = {
    'logo1.png': logo1,
    'logo2.png': logo2,
    'logo3.png': logo3,
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link';

const Sidebar = () => {
    const { user, footerSettings } = useSelector((state: RootState) => state.auth);
    const menuItems = getMenuByRole(user?.role || null);


    const logoFilename = footerSettings?.logoFilename || 'logo1.png';
    const logoSrc = logosMap[logoFilename] || logo1;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src={logoSrc} alt="Logo" className="sidebar-logo" />
                <h2 className="sidebar-title">Content<span>Marketing</span></h2>
            </div>

            <div className="nav-group">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={linkClass}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;