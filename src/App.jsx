import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
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
            <p className="text-gray-950 font-bold text-lg">Verifying Dashboard Permissions...</p>
            <p className="text-gray-400 mt-2">Connecting to secure database session...</p>
        </div>
    );

    if (firestoreError) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center bg-red-50">
                <div className="bg-white p-8 rounded-3xl border border-red-100 max-w-xl shadow-xl text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Security Block</h2>
                    <p className="text-gray-600 mb-6 text-center">{firestoreError}</p>

                    <div className="bg-gray-900 rounded-2xl p-6 mb-8 text-left overflow-x-auto mx-auto">
                        <p className="text-emerald-400 font-mono text-sm mb-4 tracking-tighter">// Update your Firestore Rules:</p>
                        <pre className="text-white font-mono text-[10px] leading-tight">
                            {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isTeacher == true || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`}
                        </pre>
                    </div>

                    <button onClick={() => window.location.reload()} className="btn-primary w-full">Try Again</button>
                </div>
            </div>
        );
    }

    if (!userData) {
        console.log("No userData found. Redirecting to login...");
        return <Navigate to="/login" replace />;
    }

    const userRole = userData.role?.toLowerCase();
    const isAdmin = userData.isAdmin === true || userRole === 'admin';
    console.log(`ProtectedRoute: Checking role. Required: ${role}, User has: ${userRole}, isAdmin: ${isAdmin}`);

    if (role && userRole !== role.toLowerCase() && !isAdmin) {
        console.warn(`Access Denied! ${userRole} tried to access ${role} path.`);
        return <Navigate to="/" replace />;
    }

    return children;
};

const RootRedirect = () => {
    const { userData, loading, firestoreError, logout, user } = useAuth();

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-pulse mb-6">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold gradient-text animate-pulse">Initializing SmartQR...</h2>
        </div>
    );

    if (firestoreError) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-gray-50">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-2xl w-full text-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-2xl">🔐</div>
                    <h2 className="text-3xl font-black text-gray-800 mb-4">Database Locked</h2>
                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        Firebase rules are blocking access. Please update them in the console.
                    </p>
                    <div className="bg-gray-900 rounded-2xl p-6 mb-8 text-left overflow-x-auto max-w-lg mx-auto">
                        <p className="text-emerald-400 font-mono text-sm mb-4 tracking-tighter">// Proper Rules for Firestore:</p>
                        <pre className="text-white font-mono text-[10px] leading-tight">
                            {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isTeacher == true || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`}
                        </pre>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => window.location.reload()} className="btn-primary px-8">Refresh App</button>
                        <button onClick={() => logout()} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Logout</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!userData) {
        if (user) return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-gray-800">Initializing Profile...</h2>
                <button onClick={() => logout()} className="mt-8 text-primary font-bold hover:underline">Stuck? Click to Logout</button>
            </div>
        );
        return <Navigate to="/login" replace />;
    }

    const role = userData.role?.toLowerCase();
    console.log("RootRedirect: Redirecting based on role:", role);

    // Role-based redirection
    switch (role) {
        case 'admin': return <Navigate to="/admin" replace />;
        case 'teacher': return <Navigate to="/teacher" replace />;
        case 'student': return <Navigate to="/student" replace />;
        default:
            console.error("RootRedirect: Unknown role:", role);
            return <Navigate to="/login" replace />;
    }
};

function App() {
    console.warn("APP COMPONENT RENDERING");
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
