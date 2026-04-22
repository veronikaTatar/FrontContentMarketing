import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardManager from './pages/DashboardManager';
import DashboardAuthor from './pages/DashboardAuthor';
import { TasksManager, TasksAuthor } from './pages/Tasks';
import Content from './pages/Content';
import Calendar from './pages/Calendar';
import Channels from './pages/Channels';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import KPI from './pages/KPI';
import Drafts from './pages/Drafts';
import Users from './pages/Users';
import Tags from './pages/Tags';
import Publications from './pages/Publications';
import Settings from './pages/Settings';
import ContentReview from './pages/ContentReview';
import OAuth2Callback from './pages/OAuth2Callback';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
    const { user } = useSelector((state: RootState) => state.auth);

    // Компонент-обёртка для ролевого дашборда
    const RoleBasedDashboard = () => {
        if (user?.role === 'ADMIN') return <DashboardAdmin />;
        if (user?.role === 'MANAGER') return <DashboardManager />;
        if (user?.role === 'AUTHOR') return <DashboardAuthor />;
        return <DashboardAuthor />; // fallback
    };

    return (
        <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />

            {/* Календарь для автора и менеджера */}
            <Route path="/calendar" element={
                <ProtectedRoute allowedRoles={['MANAGER', 'AUTHOR']}>
                    <Layout>
                        <Calendar />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Дашборд — автоматический выбор по роли */}
            <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'AUTHOR']}>
                    <Layout>
                        <RoleBasedDashboard />
                    </Layout>
                </ProtectedRoute>
            } />


            {/* ========== МАРШРУТЫ ДЛЯ АВТОРА ========== */}
            <Route path="/my-tasks" element={
                <ProtectedRoute allowedRoles={['AUTHOR']}>
                    <Layout>
                        <TasksAuthor />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/content" element={
                <ProtectedRoute allowedRoles={['AUTHOR', 'MANAGER']}>
                    <Layout>
                        <Content />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/drafts" element={
                <ProtectedRoute allowedRoles={['AUTHOR', 'MANAGER']}>
                    <Layout>
                        <Drafts />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/my-stats" element={
                <ProtectedRoute allowedRoles={['AUTHOR']}>
                    <Layout>
                        <Analytics />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* ========== МАРШРУТЫ ДЛЯ МЕНЕДЖЕРА ========== */}
            <Route path="/tasks" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <TasksManager />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/content-review" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <ContentReview />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/publications" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <Publications />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/tags" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <Tags />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <Analytics />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/kpi" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <KPI />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                    <Layout>
                        <Reports />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* ========== МАРШРУТЫ ДЛЯ АДМИНИСТРАТОРА ========== */}
            <Route path="/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                        <Users />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/channels" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                        <Channels />
                    </Layout>
                </ProtectedRoute>
            } />


            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Layout>
                        <Settings />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* FALLBACK: перенаправление на дашборд */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;