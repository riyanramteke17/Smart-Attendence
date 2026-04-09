import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import StudentScanner from './pages/student/Scanner';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

const ProtectedRoute = ({ children, role }) => {
    const { userData, loading, firestoreError } = useAuth();

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-950 font-bold text-lg">Verifying Permissions...</p>
            <p className="text-gray-400 mt-2">Connecting to your secure session...</p>
        </div>
    );

    if (firestoreError) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-red-50">
                <div className="bg-white p-8 rounded-3xl border border-red-100 max-w-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Security Block</h2>
                    <p className="text-gray-600 mb-6">{firestoreError}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary w-full">Try Again</button>
                </div>
            </div>
        );
    }

    if (!userData) {
        console.log("🔒 ProtectedRoute: No profile found. Redirecting to login...");
        return <Navigate to="/login" replace />;
    }

    const userRole = userData.role?.toLowerCase();
    const isAdmin = userData.isAdmin === true;

    if (role && userRole !== role.toLowerCase() && !isAdmin) {
        console.warn(`🚫 Access Denied! ${userRole} tried to access ${role} path.`);
        return <Navigate to="/" replace />;
    }

    return children;
};

const RootRedirect = () => {
    const { userData, loading, user, logout } = useAuth();

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-pulse mb-6">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold gradient-text animate-pulse">Initializing SmartQR...</h2>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    if (!userData) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Syncing Profile...</h2>
                <button onClick={() => logout()} className="mt-8 text-primary font-bold hover:underline">Stuck? Click to Logout</button>
            </div>
        );
    }

    const role = userData.role?.toLowerCase();
    console.log("🏠 RootRedirect: Navigating to role dashboard:", role);

    switch (role) {
        case 'admin': return <Navigate to="/admin" replace />;
        case 'teacher': return <Navigate to="/teacher" replace />;
        case 'student': return <Navigate to="/student" replace />;
        default: return <Navigate to="/login" replace />;
    }
};

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <AuthProvider>
                    <Toaster position="top-center" />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
                        <Route path="/student/scan" element={<ProtectedRoute role="student"><StudentScanner /></ProtectedRoute>} />
                        <Route path="/teacher/*" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
                        <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App;

