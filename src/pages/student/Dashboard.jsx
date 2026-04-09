import React, { useState, useEffect } from 'react';
import {
    Scan,
    Clock,
    CheckCircle2,
    TrendingUp,
    History,
    BookOpen,
    XCircle
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Button, Card } from '../../components/UI';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../../utils/utils';

import { useAuth } from '../../context/AuthContext';
import {
    collection,
    onSnapshot,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!userData) {
        return (
            <div className="h-screen flex items-center justify-center bg-white p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-bold text-lg">Syncing Profile...</p>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!userData?.uid) return;
        const q = query(collection(db, 'attendance'), where('studentId', '==', userData.uid));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(data);
            setLoading(false);
        });
    }, [userData?.uid]);

    // Stats
    const totalCount = history.length || 1;
    const presentCount = history.filter(h => h.status === 'Present').length;
    const lateCount = history.filter(h => h.status === 'Late').length;
    const absentCount = history.filter(h => h.status === 'Absent').length;

    const overallStats = [
        { name: 'Present', value: Math.round((presentCount / totalCount) * 100), color: '#3B82F6' },
        { name: 'Late', value: Math.round((lateCount / totalCount) * 100), color: '#F59E0B' },
        { name: 'Absent', value: Math.round((absentCount / totalCount) * 100), color: '#EF4444' },
    ];

    const attendanceTrend = [
        { date: 'Mon', attendance: 100 },
        { date: 'Tue', attendance: 80 },
        { date: 'Wed', attendance: presentCount > 0 ? 100 : 0 },
        { date: 'Thu', attendance: 0 },
        { date: 'Fri', attendance: 0 },
    ];

    const statusStyles = {
        Present: 'bg-green-100 text-green-600',
        Late: 'bg-amber-100 text-amber-600',
        Absent: 'bg-red-100 text-red-600',
    };

    return (
        <DashboardLayout role="student">
            <div className="flex flex-col gap-6 sm:gap-8">

                {/* ── Header ──────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Hello, {userData?.name?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Track your attendance and performance.</p>
                    </div>
                    <Button
                        className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg shadow-xl shadow-primary/20 w-full sm:w-auto"
                        onClick={() => navigate('/student/scan')}
                    >
                        <Scan className="w-5 h-5" />
                        Scan QR Code
                    </Button>
                </div>

                {/* ── Quick Stats Row (mobile) ─────────────── */}
                <div className="grid grid-cols-3 gap-3 sm:hidden">
                    <div className="bg-blue-50 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-blue-600">{presentCount}</p>
                        <p className="text-xs text-blue-400 font-medium mt-0.5">Present</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-amber-600">{lateCount}</p>
                        <p className="text-xs text-amber-400 font-medium mt-0.5">Late</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-red-600">{absentCount}</p>
                        <p className="text-xs text-red-400 font-medium mt-0.5">Absent</p>
                    </div>
                </div>

                {/* ── Charts (hidden on mobile quick stats replace them) ── */}
                <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Pie Chart */}
                    <Card className="lg:col-span-1 flex flex-col items-center justify-center py-6">
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={overallStats} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                                        {overallStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">{overallStats[0].value}%</span>
                                <span className="text-xs text-gray-400 font-medium">Overall</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 w-full mt-4">
                            {overallStats.map((s) => (
                                <div key={s.name} className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: s.color }} />
                                    <span className="text-xs text-gray-500 font-medium">{s.name}</span>
                                    <span className="text-sm font-bold text-gray-800">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Trend Chart */}
                    <Card className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Weekly Attendance Trend
                        </h3>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={attendanceTrend}>
                                    <defs>
                                        <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* ── Attendance History ───────────────────── */}
                <Card>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                            <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Recent Attendance
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">{history.length} records</span>
                    </div>

                    {history.length === 0 && !loading && (
                        <div className="py-12 text-center text-gray-400">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-sm">No attendance records yet.</p>
                            <p className="text-xs mt-1">Scan a QR code to mark attendance.</p>
                        </div>
                    )}

                    {/* === MOBILE: Card List === */}
                    <div className="sm:hidden space-y-3">
                        {history.map((row, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{row.subject || '—'}</p>
                                        <p className="text-xs text-gray-400">{row.date || '—'} · {row.time || '—'}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-2',
                                    statusStyles[row.status] || 'bg-gray-100 text-gray-500'
                                )}>
                                    {row.status || '—'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* === DESKTOP: Table === */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Subject</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Date</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Time</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((row, i) => (
                                    <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-700">{row.subject}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-500 text-sm">
                                            {row.date ? (isNaN(new Date(row.date).getTime()) ? row.date : format(new Date(row.date), 'MMM dd, yyyy')) : '—'}
                                        </td>
                                        <td className="py-4 text-gray-500 text-sm">{row.time}</td>
                                        <td className="py-4">
                                            <span className={cn('px-3 py-1 rounded-full text-xs font-bold', statusStyles[row.status] || 'bg-gray-100 text-gray-500')}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
