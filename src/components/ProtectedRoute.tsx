// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface Props {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
    const { user, token } = useSelector((state: RootState) => state.auth);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to="/dashboard" replace />;
        if (user.role === 'MANAGER') return <Navigate to="/dashboard" replace />;
        if (user.role === 'AUTHOR') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;