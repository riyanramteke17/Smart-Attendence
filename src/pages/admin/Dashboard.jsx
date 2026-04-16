import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
    Users,
    UserCheck,
    Activity,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    ShieldAlert,
    BarChart3,
    QrCode
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, Button } from '../../components/UI';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../../utils/utils';
import {
    collection,
    onSnapshot,
    query,
    where,
    updateDoc,
    doc,
    setDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { addDoc } from 'firebase/firestore';

// ─── Sub Pages ───────────────────────────────────────────────

const AdminHome = () => {
    const [stats, setStats] = useState([
        { label: 'Total Users', value: '0', icon: Users, color: 'blue', key: 'total' },
        { label: 'Students', value: '0', icon: UserCheck, color: 'green', key: 'students' },
        { label: 'Teachers', value: '0', icon: Activity, color: 'purple', key: 'teachers' },
        { label: 'Admins', value: '0', icon: ShieldAlert, color: 'emerald', key: 'admins' },
    ]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                id: userId, uid: userId, role: newRole,
                isAdmin: newRole === 'admin', isTeacher: newRole === 'teacher', isStudent: newRole === 'student'
            });
            toast.success(`Role updated to ${newRole}`);
        } catch (error) {
            toast.error("Failed to update role. Check Firestore rules.");
        }
    };

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            // ✅ Use 'userDoc' to avoid shadowing the firebase `doc` function
            const usersList = snapshot.docs.map(userDoc => ({ uid: userDoc.id, ...userDoc.data() }));

            let repairedAny = false;
            usersList.forEach(u => {
                if (repairedAny) return;
                const currentRole = String(u.role || 'student').toLowerCase();
                const isOutOfSync = u.isAdmin !== (currentRole === 'admin') || u.isTeacher !== (currentRole === 'teacher') || u.isStudent !== (currentRole === 'student') || !u.id || !u.uid;
                if (isOutOfSync) {
                    repairedAny = true;
                    // ✅ `doc` here correctly refers to the firebase function
                    setDoc(doc(db, 'users', u.uid), { id: u.uid, uid: u.uid, role: currentRole, isAdmin: currentRole === 'admin', isTeacher: currentRole === 'teacher', isStudent: currentRole === 'student' }, { merge: true }).catch(() => {});
                }
            });

            const counts = {
                total: usersList.length,
                students: usersList.filter(u => u.isAdmin !== true && u.isTeacher !== true).length,
                teachers: usersList.filter(u => u.isTeacher === true).length,
                admins: usersList.filter(u => u.isAdmin === true).length,
            };
            setStats(prev => prev.map(s => ({ ...s, value: String(counts[s.key] || 0) })));
            setRecentUsers(usersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
            setLoading(false);
        }, (err) => {
            toast.error(`Database Error: ${err.message}`);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const totalUsersCount = parseInt(stats.find(s => s.key === 'total')?.value || '1');
    const userGroups = [
        { name: 'Students', count: stats.find(s => s.key === 'students')?.value || 0, color: '#3B82F6', percentage: Math.round(((stats.find(s => s.key === 'students')?.value || 0) / totalUsersCount) * 100) },
        { name: 'Teachers', count: stats.find(s => s.key === 'teachers')?.value || 0, color: '#8B5CF6', percentage: Math.round(((stats.find(s => s.key === 'teachers')?.value || 0) / totalUsersCount) * 100) },
        { name: 'Admins', count: stats.find(s => s.key === 'admins')?.value || 0, color: '#A855F7', percentage: Math.round(((stats.find(s => s.key === 'admins')?.value || 0) / totalUsersCount) * 100) },
    ];

    const activityData = [
        { time: '08:00', active: 200 }, { time: '09:00', active: 850 }, { time: '10:00', active: 780 },
        { time: '11:00', active: 920 }, { time: '12:00', active: 600 }, { time: '13:00', active: 300 }, { time: '14:00', active: 550 },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Overview</h1>
                    <p className="text-gray-500 mt-1">System status and user management control panel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search anything..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64" />
                    </div>
                    <Button variant="outline"><Filter className="w-4 h-4" />Filters</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="group hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2.5 rounded-xl",
                                stat.color === 'blue' && "bg-blue-50 text-blue-500",
                                stat.color === 'green' && "bg-green-50 text-green-500",
                                stat.color === 'purple' && "bg-purple-50 text-purple-500",
                                stat.color === 'emerald' && "bg-emerald-50 text-emerald-500",
                            )}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Real-time System Activity</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="active" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-6">User Distribution</h3>
                    <div className="space-y-6">
                        {userGroups.map((group) => (
                            <div key={group.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-gray-700">{group.name}</span>
                                    <span className="text-gray-400">{group.count} users</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${group.percentage}%` }} transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full rounded-full" style={{ backgroundColor: group.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3 mb-2"><Mail className="text-primary w-5 h-5" /><span className="text-sm font-bold text-primary">System Notice</span></div>
                        <p className="text-xs text-gray-500 leading-relaxed">All system logs will be backed up automatically every Sunday at 12:00 AM UTC.</p>
                    </div>
                </Card>
            </div>

            {/* User Table */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Recent User Registrations</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-100">
                            <th className="pb-4 font-semibold text-gray-500 text-sm">User</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Role</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Email</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Date Joined</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentUsers.map((user, i) => (
                                <tr key={user.uid || i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">{user.name?.charAt(0) || 'U'}</div>
                                            <span className="font-bold text-gray-700">{user.name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <select value={user.role || 'student'} onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                            className={cn("bg-transparent border-none outline-none text-xs font-bold capitalize cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1",
                                                user.role === 'admin' && "text-purple-600",
                                                user.role === 'teacher' && "text-blue-600",
                                                user.role === 'student' && "text-green-600",
                                            )}>
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-4 text-sm text-gray-500">
                                        <div>{user.email}</div>
                                        <div className="flex gap-2 mt-1 text-[10px] font-mono">
                                            <span className={user.isAdmin ? "text-purple-600" : "text-gray-300"}>isAdmin:{String(!!user.isAdmin)}</span>
                                            <span className={user.isTeacher ? "text-blue-600" : "text-gray-300"}>isTeacher:{String(!!user.isTeacher)}</span>
                                            <span className={user.isStudent ? "text-green-600" : "text-gray-300"}>isStudent:{String(!!user.isStudent)}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-gray-500">{user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'No date'}</td>
                                </tr>
                            ))}
                            {recentUsers.length === 0 && (<tr><td colSpan="4" className="py-8 text-center text-gray-400">No users found</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole, isAdmin: newRole === 'admin', isTeacher: newRole === 'teacher', isStudent: newRole === 'student'
            });
            toast.success(`Role updated to ${newRole}`);
        } catch {
            toast.error("Failed to update role.");
        }
    };

    useEffect(() => {
        return onSnapshot(collection(db, 'users'), snap => {
            const usersList = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setUsers(usersList);
        });
    }, []);

    const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search users..."
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64" />
                </div>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-100">
                            <th className="pb-4 font-semibold text-gray-500 text-sm">User</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Email</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Role</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Joined</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((user, i) => (
                                <tr key={user.uid || i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">{user.name?.charAt(0) || 'U'}</div>
                                            <span className="font-bold text-gray-700">{user.name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-gray-500">{user.email}</td>
                                    <td className="py-4">
                                        <select value={user.role || 'student'} onChange={e => handleRoleChange(user.uid, e.target.value)}
                                            className={cn("bg-transparent border border-gray-200 rounded-lg outline-none text-xs font-bold capitalize cursor-pointer px-2 py-1.5",
                                                user.role === 'admin' && "text-purple-600 border-purple-200 bg-purple-50",
                                                user.role === 'teacher' && "text-blue-600 border-blue-200 bg-blue-50",
                                                user.role === 'student' && "text-green-600 border-green-200 bg-green-50",
                                            )}>
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="py-4 text-sm text-gray-500">{user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '—'}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (<tr><td colSpan="4" className="py-8 text-center text-gray-400">No users found</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const AdminAnalytics = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [userStats, setUserStats] = useState({ total: 0, students: 0, teachers: 0, admins: 0 });

    useEffect(() => {
        const unsub1 = onSnapshot(collection(db, 'users'), snap => {
            const users = snap.docs.map(d => d.data());
            setUserStats({
                total: users.length,
                students: users.filter(u => u.isStudent).length,
                teachers: users.filter(u => u.isTeacher).length,
                admins: users.filter(u => u.isAdmin).length,
            });
        });
        const unsub2 = onSnapshot(collection(db, 'attendance'), snap => {
            setAttendanceData(snap.docs.map(d => d.data()));
        });
        return () => { unsub1(); unsub2(); };
    }, []);

    const chartData = [
        { name: 'Students', value: userStats.students, fill: '#3B82F6' },
        { name: 'Teachers', value: userStats.teachers, fill: '#8B5CF6' },
        { name: 'Admins', value: userStats.admins, fill: '#A855F7' },
    ];

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col items-center py-8">
                    <p className="text-4xl font-black text-primary">{userStats.total}</p>
                    <p className="text-gray-500 mt-2 font-medium">Total Users</p>
                </Card>
                <Card className="flex flex-col items-center py-8">
                    <p className="text-4xl font-black text-blue-500">{userStats.students}</p>
                    <p className="text-gray-500 mt-2 font-medium">Students</p>
                </Card>
                <Card className="flex flex-col items-center py-8">
                    <p className="text-4xl font-black text-purple-500">{userStats.teachers}</p>
                    <p className="text-gray-500 mt-2 font-medium">Teachers</p>
                </Card>
            </div>
            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-6">User Role Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <rect key={index} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Total Attendance Records</h3>
                <p className="text-5xl font-black text-green-500">{attendanceData.length}</p>
                <p className="text-gray-400 mt-2 text-sm">scans recorded across all sessions</p>
            </Card>
        </div>
    );
};

const AdminDailyQR = () => {
    const [dailySession, setDailySession] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'classes'), where('status', '==', 'active'), where('isDailyQR', '==', true));
        const unsub = onSnapshot(q, snap => {
            if (!snap.empty) {
                const session = snap.docs[0];
                setDailySession({ id: session.id, ...session.data() });
            } else {
                setDailySession(null);
            }
        });
        return unsub;
    }, []);

    const generateQR = async () => {
        try {
            const sessionData = {
                subject: 'Daily Campus Session',
                isDailyQR: true,
                date: format(new Date(), 'yyyy-MM-dd'),
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            const docRef = await addDoc(collection(db, 'classes'), sessionData);
            setDailySession({ id: docRef.id, ...sessionData });
            toast.success("Generated today's QR code!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate QR: " + e.message);
        }
    };

    const disableQR = async () => {
        if (!dailySession) return;
        try {
            await updateDoc(doc(db, 'classes', dailySession.id), { status: 'expired' });
            toast.success("QR Code disabled.");
        } catch(e) {
            toast.error("Failed to disable QR");
        }
    };

    const isExpiredTime = new Date().getHours() >= 18;

    return (
        <div className="flex flex-col gap-8 items-center">
            <div className="w-full">
                <h1 className="text-3xl font-bold text-gray-800">Daily Campus QR</h1>
                <p className="text-gray-500 mt-1">Generate a single QR for daily IN/OUT attendance.</p>
            </div>
            
            <Card className="max-w-md w-full flex flex-col items-center py-10">
                {!dailySession ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <QrCode className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-center">No active session for today. Users will not be able to mark IN/OUT.</p>
                        <Button onClick={generateQR} className="w-full">Generate Today's QR</Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 w-full">
                        <div className="flex w-full justify-between items-center mb-2 px-4">
                            <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
                            <span className="text-sm font-medium text-gray-500">{dailySession.date}</span>
                        </div>
                        
                        <div className="bg-white p-6 rounded-3xl shadow-inner border border-gray-100">
                            <QRCode value={`admin_qr:${dailySession.id}`} size={256} />
                        </div>
                        
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-800">Scan to mark IN / OUT</h3>
                            <p className="text-sm text-gray-400 mt-2">QR code will automatically stop working at 06:00 PM.</p>
                            {isExpiredTime && <p className="text-sm text-red-500 font-bold mt-1">It is past 6:00 PM. Scans will be rejected.</p>}
                        </div>
                        
                        <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={disableQR}>
                            Deactivate QR Now
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

const AdminDailyLogs = () => {
    const [logs, setLogs] = useState([]);
    
    useEffect(() => {
        // Find only attendance docs that belong to our Daily Campus Sessions
        const q = query(collection(db, 'attendance'), where('isDailyQR', '==', true));
        const unsub = onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}))
                .sort((a,b) => {
                    const timeA = new Date((a.date || '') + ' ' + (a.inTime || a.time || ''));
                    const timeB = new Date((b.date || '') + ' ' + (b.inTime || b.time || ''));
                    return timeB - timeA;
                });
            setLogs(data);
        });
        return unsub;
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold text-gray-800">Daily Campus Logs</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-100">
                            <th className="pb-4 font-semibold text-gray-500 text-sm">User</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Role</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm">Date</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm text-center">IN Time</th>
                            <th className="pb-4 font-semibold text-gray-500 text-sm text-center">OUT Time</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">{log.studentName?.charAt(0) || log.userName?.charAt(0) || 'U'}</div>
                                            <span className="font-bold text-gray-700">{log.studentName || log.userName || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase px-2 py-1 rounded-full">{log.role || 'student'}</span>
                                    </td>
                                    <td className="py-4 text-sm font-medium text-gray-600">{log.date}</td>
                                    <td className="py-4 text-sm text-center">
                                        <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg">{log.inTime || log.time || '—'}</span>
                                    </td>
                                    <td className="py-4 text-sm text-center">
                                        {log.outTime ? (
                                            <span className="bg-purple-50 text-purple-600 font-bold px-3 py-1 rounded-lg">{log.outTime}</span>
                                        ) : (
                                            <span className="text-gray-400 font-medium">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (<tr><td colSpan="5" className="py-8 text-center text-gray-400">No logs found</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// ─── Main Export ─────────────────────────────────────────────

const AdminDashboard = () => {
    return (
        <DashboardLayout role="admin">
            <Routes>
                <Route index element={<AdminHome />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="daily-qr" element={<AdminDailyQR />} />
                <Route path="daily-logs" element={<AdminDailyLogs />} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminDashboard;
