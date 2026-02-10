import React, { useState, useEffect } from 'react';
import {
    Scan,
    Clock,
    Calendar as CalendarIcon,
    CheckCircle2,
    TrendingUp,
    History,
    BookOpen
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
    orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

const StudentDashboard = () => {
    console.log("StudentDashboard Mounting. UserData:", useAuth()?.userData?.email);
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!userData) {
        console.warn("StudentDashboard: No userData yet!");
        return (
            <div className="h-screen flex items-center justify-center bg-white p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold text-lg">Waiting for Profile Sync...</p>
                </div>
            </div>
        );
    }

    // Fetch real attendance history
    useEffect(() => {
        if (!userData?.uid) return;

        const q = query(
            collection(db, 'attendance'),
            where('studentId', '==', userData.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistory(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [userData?.uid]);

    // Calculate real stats
    const presentCount = history.filter(h => h.status === 'Present').length;
    const lateCount = history.filter(h => h.status === 'Late').length;
    const absentCount = history.filter(h => h.status === 'Absent').length;
    const totalCount = history.length || 1; // Prevent div by 0

    const overallStats = [
        { name: 'Present', value: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0, color: '#3B82F6' },
        { name: 'Late', value: totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0, color: '#F59E0B' },
        { name: 'Absent', value: totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0, color: '#EF4444' },
    ];

    const attendanceTrend = [
        { date: 'Mon', attendance: 100 },
        { date: 'Tue', attendance: 80 },
        { date: 'Wed', attendance: presentCount > 0 ? 100 : 0 },
        { date: 'Thu', attendance: 0 },
        { date: 'Fri', attendance: 0 },
    ];

    return (
        <DashboardLayout role="student">
            <div className="flex flex-col gap-8">
                {/* Header with Scan Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Hello, {userData?.name || 'Student'}!</h1>
                        <p className="text-gray-500 mt-1">Keep track of your attendance and performance.</p>
                    </div>
                    <Button
                        className="h-16 px-8 text-xl shadow-xl shadow-primary/20 animate-bounce-slow"
                        onClick={() => navigate('/student/scan')}
                    >
                        <Scan className="w-6 h-6" />
                        Scan QR Code
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Stats */}
                    <Card className="lg:col-span-1 flex flex-col items-center justify-center py-10">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={overallStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {overallStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">85%</span>
                                <span className="text-xs text-gray-400 font-medium">Overall</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 w-full mt-6">
                            {overallStats.map((s) => (
                                <div key={s.name} className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: s.color }}></div>
                                    <span className="text-xs text-gray-500 font-medium">{s.name}</span>
                                    <span className="text-sm font-bold text-gray-800">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Attendance Trend */}
                    <Card className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Weekly Attendance Trend
                        </h3>
                        <div className="h-[250px] w-full">
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
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* History Table */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Recent Attendance
                        </h3>
                        <button className="text-primary text-sm font-semibold hover:underline">Download PDF</button>
                    </div>
                    <div className="overflow-x-auto">
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
                                            {row.date ? (
                                                isNaN(new Date(row.date).getTime()) ? row.date : format(new Date(row.date), 'MMM dd, yyyy')
                                            ) : 'No date'}
                                        </td>
                                        <td className="py-4 text-gray-500 text-sm">{row.time}</td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                row.status === 'Present' && "bg-green-100 text-green-600",
                                                row.status === 'Late' && "bg-amber-100 text-amber-600",
                                                row.status === 'Absent' && "bg-red-100 text-red-600",
                                            )}>
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
