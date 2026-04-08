import React, { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    Plus,
    Download,
    Calendar,
    MoreVertical
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Button, Card } from '../../components/UI';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { cn } from '../../utils/utils';

import { useAuth } from '../../context/AuthContext';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

const TeacherDashboard = () => {
    const { userData } = useAuth();
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [activeAttendance, setActiveAttendance] = useState([]);
    const [stats, setStats] = useState([
        { label: 'Total Students', value: '45', icon: Users, color: 'blue' },
        { label: 'Present Today', value: '0', icon: CheckCircle2, color: 'green' },
        { label: 'Late Entries', value: '0', icon: Clock, color: 'amber' },
        { label: 'Absent', value: '0', icon: XCircle, color: 'red' },
    ]);

    const chartData = [
        { name: 'Mon', present: 40, late: 2, absent: 3 },
        { name: 'Tue', present: 38, late: 5, absent: 2 },
        { name: 'Wed', present: 42, late: 1, absent: 2 },
        { name: 'Thu', present: 35, late: 8, absent: 2 },
        { name: 'Fri', present: 39, late: 3, absent: 3 },
    ];

    // Listen for attendance if a class is active
    useEffect(() => {
        if (!selectedClass?.id) return;

        const q = query(
            collection(db, 'attendance'),
            where('classId', '==', selectedClass.id)
            // Removed orderBy to avoid mandatory Firestore Index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
            setActiveAttendance(data);

            // Update stats based on live data
            setStats(prev => prev.map(s => {
                if (s.label === 'Present Today') return { ...s, value: String(data.length) };
                return s;
            }));
        });

        return unsubscribe;
    }, [selectedClass?.id]);

    // Persistent Class Recovery: Fetch latest active class on load
    useEffect(() => {
        if (!userData?.uid) return;

        const q = query(
            collection(db, 'classes'),
            where('teacherId', '==', userData.uid),
            where('status', '==', 'active')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const classes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => new Date(b.createdAt?.seconds ? b.createdAt.toDate() : b.createdAt) - new Date(a.createdAt?.seconds ? a.createdAt.toDate() : a.createdAt));

                const classDoc = classes[0];
                setSelectedClass({
                    ...classDoc,
                    qrCode: classDoc.id
                });
            }
        });

        return unsubscribe;
    }, [userData?.uid]);

    const handleStartClass = async () => {
        try {
            const classData = {
                subject: 'Data Structures',
                teacherId: userData.uid,
                teacherName: userData.name,
                startTime: new Date().toISOString(),
                status: 'active',
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'classes'), classData);

            setSelectedClass({
                id: docRef.id,
                ...classData,
                qrCode: docRef.id // The QR code is just the class ID
            });

            setShowQRModal(true);
            toast.success('Class started! Students can now scan.');
        } catch (error) {
            toast.error('Failed to start class');
            console.error(error);
        }
    };

    const exportToExcel = () => {
        if (activeAttendance.length === 0) {
            toast.error("No data to export!");
            return;
        }

        const exportData = activeAttendance.map(record => ({
            'Student Name': record.studentName || 'N/A',
            'Email': record.studentEmail || 'N/A',
            'Subject': record.subject || 'Session',
            'Date': record.date || 'N/A',
            'Time': record.time || 'N/A',
            'Status': record.status || 'Present'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_${selectedClass?.subject || 'Report'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        toast.success('Excel Report downloaded!');
    };

    return (
        <DashboardLayout role="teacher">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage your classes and track student attendance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={exportToExcel}>
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                        <Button onClick={handleStartClass}>
                            <Plus className="w-4 h-4" />
                            Start New Class
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <Card key={i} className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                stat.color === 'blue' && "bg-blue-50 text-blue-500",
                                stat.color === 'green' && "bg-green-50 text-green-500",
                                stat.color === 'amber' && "bg-amber-50 text-amber-500",
                                stat.color === 'red' && "bg-red-50 text-red-500",
                            )}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart */}
                    <Card className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Attendance Overview</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#F1F5F9' }}
                                    />
                                    <Bar dataKey="present" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                            <button className="text-primary text-sm font-semibold hover:underline">View all</button>
                        </div>
                        <div className="space-y-6">
                            {activeAttendance.map((item) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                                        {item.studentName?.charAt(0) || 'S'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{item.studentName}</p>
                                        <p className="text-xs text-gray-500">
                                            Marked as <span className="text-green-500 font-bold">{item.status}</span>
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {item.time}
                                    </div>
                                </div>
                            ))}
                            {activeAttendance.length === 0 && (
                                <div className="py-10 text-center text-gray-400 text-sm">
                                    No attendance recorded yet.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* QR Code Modal */}
                <AnimatePresence>
                    {showQRModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowQRModal(false)}
                                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            />
                            <Card className="max-w-md w-full relative z-10 flex flex-col items-center animate-out">
                                <div className="w-full flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">Class In Progress</h2>
                                    <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-3xl shadow-inner mb-6">
                                    <QRCode value={selectedClass?.qrCode || ''} size={256} />
                                </div>

                                <h3 className="text-lg font-bold text-primary mb-2">{selectedClass?.subject}</h3>
                                <div className="flex items-center gap-2 text-gray-500 mb-6">
                                    <Clock className="w-4 h-4" />
                                    <span>Started at {selectedClass?.startTime ? format(new Date(selectedClass.startTime), 'hh:mm a') : 'Now'}</span>
                                </div>

                                <div className="w-full p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
                                    <p className="text-sm text-amber-700 text-center font-medium">
                                        QR code will expire in 10 minutes. Keep this screen visible to students.
                                    </p>
                                </div>

                                <Button className="w-full" onClick={() => setShowQRModal(false)}>
                                    Done
                                </Button>
                            </Card>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
