import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    BarChart3,
    QrCode,
    FileText,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/utils';

const Sidebar = ({ role }) => {
    const { logout, userData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = {
        teacher: [
            { path: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/teacher/classes', icon: QrCode, label: 'My Classes' },
            { path: '/teacher/reports', icon: FileText, label: 'Reports' },
            { path: '/teacher/students', icon: Users, label: 'Students' },
        ],
        student: [
            { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/student/scan', icon: QrCode, label: 'Scan QR' },
            { path: '/student/history', icon: FileText, label: 'History' },
        ],
        admin: [
            { path: '/admin', icon: LayoutDashboard, label: 'Overview' },
            { path: '/admin/users', icon: Users, label: 'User Management' },
            { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        ]
    };

    const normalizedRole = role?.toLowerCase();
    const currentMenu = menuItems[normalizedRole] || [];

    return (
        <div className="w-64 h-full flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <QrCode className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold gradient-text">SmartQR</span>
            </div>

            <nav className="flex-1 space-y-2">
                {currentMenu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-all group",
                            isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-gray-500 hover:bg-primary/5 hover:text-primary"
                        )}
                    >
                        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <User className="text-primary w-6 h-6" />
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
        </div>
    );
};

export const DashboardLayout = ({ children, role }) => {
    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar role={role} />
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="relative z-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
