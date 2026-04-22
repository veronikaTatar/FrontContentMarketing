import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';

interface Props {
    children?: ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <div className="app-shell">
            <div className="app-main">
                <Topbar />
                <div className="app-content">
                    {children}
                </div>
                <Footer />
            </div>
            <Sidebar />
        </div>
    );
};

export default Layout;