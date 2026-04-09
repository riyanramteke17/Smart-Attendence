import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    BarChart3,
    QrCode,
    FileText,
    User,
    Menu,
    X
} from 'lucide-react';
import { cn } from '../utils/utils';

const menuItems = {
    teacher: [
        { path: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/teacher/classes', icon: QrCode, label: 'Classes' },
        { path: '/teacher/reports', icon: FileText, label: 'Reports' },
        { path: '/teacher/students', icon: Users, label: 'Students' },
    ],
    student: [
        { path: '/student', icon: LayoutDashboard, label: 'Home' },
        { path: '/student/scan', icon: QrCode, label: 'Scan QR' },
        { path: '/student/history', icon: FileText, label: 'History' },
    ],
    admin: [
        { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    ]
};

/* ── Desktop Sidebar ─────────────────────────────────── */
const Sidebar = ({ role }) => {
    const { logout, userData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const currentMenu = menuItems[role?.toLowerCase()] || [];

    return (
        <aside className="hidden md:flex w-64 h-full flex-col bg-white/80 backdrop-blur-xl border-r border-gray-100 p-6 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <QrCode className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-black gradient-text">SmartQR</span>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-1">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path.split('/').length === 2}
                        className={({ isActive }) => cn(
                            'flex items-center gap-3 p-3 rounded-xl transition-all group font-medium',
                            isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-gray-500 hover:bg-primary/5 hover:text-primary'
                        )}
                    >
                        <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Card */}
            <div className="mt-auto space-y-3">
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                        <User className="text-primary w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{userData?.name || 'User'}</p>
                        <p className="text-xs text-gray-400 capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

/* ── Mobile Top Header ───────────────────────────────── */
const MobileHeader = ({ role }) => {
    const { logout, userData } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const currentMenu = menuItems[role?.toLowerCase()] || [];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow">
                        <QrCode className="text-white w-4 h-4" />
                    </div>
                    <span className="text-lg font-black gradient-text">SmartQR</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="text-primary w-4 h-4" />
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
                    >
                        {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* Slide-down mobile menu */}
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-20 top-14">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
                    <div className="relative bg-white rounded-b-3xl shadow-2xl p-5 space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">{userData?.name} · {role}</p>
                        {currentMenu.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path.split('/').length === 2}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) => cn(
                                    'flex items-center gap-3 p-3 rounded-xl transition-all font-medium',
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-gray-600 hover:bg-gray-50'
                                )}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all font-medium mt-2"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

/* ── Mobile Bottom Nav ───────────────────────────────── */
const BottomNav = ({ role }) => {
    const currentMenu = menuItems[role?.toLowerCase()] || [];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-2 pb-safe">
            <div className="flex items-center justify-around">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path.split('/').length === 2}
                        className={({ isActive }) => cn(
                            'flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-all min-w-0 flex-1',
                            isActive ? 'text-primary' : 'text-gray-400'
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={cn(
                                    'p-1.5 rounded-xl transition-all',
                                    isActive ? 'bg-primary/10' : ''
                                )}>
                                    <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                                </div>
                                <span className="text-[10px] font-bold truncate">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

/* ── Main Layout Export ──────────────────────────────── */
export const DashboardLayout = ({ children, role }) => {
    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar role={role} />

            {/* Right Side */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <MobileHeader role={role} />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative">
                    {/* Background blobs */}
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Nav */}
                <BottomNav role={role} />
            </div>
        </div>
    );
};
