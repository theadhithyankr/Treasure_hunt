import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import PlayerLogin from './pages/PlayerLogin';
import CoordinatorLogin from './pages/CoordinatorLogin';
import PlayerDashboard from './pages/player/PlayerDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import SetupPage from './pages/SetupPage';

// Protected route wrapper
function ProtectedRoute({ children, role }: { children: React.ReactNode; role: 'player' | 'coordinator' }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (currentUser.role !== role) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/player/login" element={<PlayerLogin />} />
            <Route path="/coordinator/login" element={<CoordinatorLogin />} />

            <Route
                path="/player/dashboard"
                element={
                    <ProtectedRoute role="player">
                        <PlayerDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/coordinator/dashboard"
                element={
                    <ProtectedRoute role="coordinator">
                        <CoordinatorDashboard />
                    </ProtectedRoute>
                }
            />

            <Route path="/setup" element={<SetupPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
