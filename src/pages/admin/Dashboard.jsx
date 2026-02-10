import React, { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    Activity,
    MapPin,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    ShieldAlert
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, Button, Input } from '../../components/UI';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    setDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
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
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                id: userId,
                uid: userId,
                role: newRole,
                isAdmin: newRole === 'admin',
                isTeacher: newRole === 'teacher',
                isStudent: newRole === 'student'
            });
            toast.success(`Role updated to ${newRole}`);
            console.log(`Role updated for ${userId} to ${newRole}`);
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role. Check Firestore rules.");
        }
    };

    useEffect(() => {
        console.log("🛠️ AdminDashboard: Starting user list listener...");
        setLoading(true);

        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));

            console.log(`📊 AdminDashboard Update: Fetched ${usersList.length} users.`);

            // ⚡ CONTROLLED REPAIR: Only repair if needed, and don't flood the DB
            let repairedAny = false;
            usersList.forEach(u => {
                if (repairedAny) return; // Only process one repair per snapshot to avoid congestion

                const currentRole = String(u.role || 'student').toLowerCase();
                const expectedIsAdmin = currentRole === 'admin';
                const expectedIsTeacher = currentRole === 'teacher';
                const expectedIsStudent = currentRole === 'student';

                const isOutOfSync =
                    u.isAdmin !== expectedIsAdmin ||
                    u.isTeacher !== expectedIsTeacher ||
                    u.isStudent !== expectedIsStudent ||
                    !u.id || !u.uid || u.role !== currentRole;

                if (isOutOfSync) {
                    repairedAny = true;
                    console.log(`🛠️ Repairing user: ${u.email}`);
                    setDoc(doc(db, 'users', u.uid), {
                        id: u.uid,
                        uid: u.uid,
                        role: currentRole,
                        isAdmin: expectedIsAdmin,
                        isTeacher: expectedIsTeacher,
                        isStudent: expectedIsStudent
                    }, { merge: true }).catch(err => console.error("Repair failed:", u.email, err));
                }
            });

            const counts = {
                total: usersList.length,
                students: usersList.filter(u => u.isAdmin !== true && u.isTeacher !== true).length,
                teachers: usersList.filter(u => u.isTeacher === true).length,
                admins: usersList.filter(u => u.isAdmin === true).length,
            };

            setStats(prev => prev.map(s => ({
                ...s,
                value: String(counts[s.key] || 0)
            })));

            setRecentUsers(usersList.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }));
            setLoading(false);
        }, (err) => {
            console.error("❌ AdminDashboard Snapshot Error:", err);
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
        { time: '08:00', active: 200 },
        { time: '09:00', active: 850 },
        { time: '10:00', active: 780 },
        { time: '11:00', active: 920 },
        { time: '12:00', active: 600 },
        { time: '13:00', active: 300 },
        { time: '14:00', active: 550 },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Admin Overview</h1>
                        <p className="text-gray-500 mt-1">System status and user management control panel.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="w-4 h-4" />
                            Filters
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <Card key={i} className="group hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl",
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
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold text-green-500">+12%</span>
                                <span className="text-xs text-gray-400">from last month</span>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
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
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="active" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* User Distribution */}
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
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${group.percentage}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: group.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Mail className="text-primary w-5 h-5" />
                                <span className="text-sm font-bold text-primary">System Notice</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                All system logs will be backed up automatically every Sunday at 12:00 AM UTC.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* User Table (Simplified) */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Recent User Registrations</h3>
                        <Button variant="ghost" className="text-xs">View all users</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">User</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Role</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Email</th>
                                    <th className="pb-4 font-semibold text-gray-500 text-sm">Date Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentUsers.map((user, i) => (
                                    <tr key={user.uid || i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-bold text-gray-700">{user.name || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <select
                                                value={user.role || 'student'}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                className={cn(
                                                    "bg-transparent border-none outline-none text-xs font-bold capitalize cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1",
                                                    user.role === 'admin' && "text-purple-600",
                                                    user.role === 'teacher' && "text-blue-600",
                                                    user.role === 'student' && "text-green-600",
                                                )}
                                            >
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
                                        <td className="py-4 text-sm text-gray-500">
                                            {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'No date'}
                                        </td>
                                    </tr>
                                ))}
                                {recentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-gray-400">No users found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
