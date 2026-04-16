import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';

const ScannerPage = () => {
    const { userData } = useAuth();
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scannedClass, setScannedClass] = useState(null);
    const navigate = useNavigate();

    const handleScan = async (data) => {
        if (data && isScanning && userData) {
            setIsScanning(false);
            const qrText = data.text;
            const isDailyQR = qrText.startsWith('admin_qr:');
            const classId = isDailyQR ? qrText.split(':')[1] : qrText;

            try {
                if (isDailyQR) {
                    if (new Date().getHours() >= 18) {
                        toast.error('Daily QR Code has expired (after 6:00 PM)!');
                        setIsScanning(true);
                        return;
                    }
                }

                const classDoc = await getDoc(doc(db, 'classes', classId));

                if (!classDoc.exists()) {
                    toast.error('Invalid QR Code');
                    setIsScanning(true);
                    return;
                }

                const classData = classDoc.data();
                if (classData.status !== 'active') {
                    toast.error('This session has ended.');
                    setIsScanning(true);
                    return;
                }

                if (isDailyQR) {
                    const attendanceId = `${userData.uid}_${classId}_daily`;
                    const existingDoc = await getDoc(doc(db, 'attendance', attendanceId));

                    if (existingDoc.exists()) {
                        const existingData = existingDoc.data();
                        if (existingData.outTime) {
                            toast.error('You have already marked OUT for today!');
                            setScannedClass({ subject: "Daily Campus OUT (Already Marked)" });
                            return;
                        } else {
                            await updateDoc(doc(db, 'attendance', attendanceId), {
                                outTime: format(new Date(), 'hh:mm a'),
                                status: 'Signed Out'
                            });
                            setScannedClass({ subject: "Daily Campus (OUT Marked)" });
                            toast.success('OUT Time Marked Successfully!');
                            return;
                        }
                    } else {
                        await setDoc(doc(db, 'attendance', attendanceId), {
                            studentId: userData.uid || 'unknown',
                            userName: userData.name || 'Unknown',
                            studentName: userData.name || 'Unknown',
                            studentEmail: userData.email || 'Unknown',
                            role: userData.role || 'user',
                            classId: classId || 'unknown',
                            isDailyQR: true,
                            date: format(new Date(), 'yyyy-MM-dd'),
                            inTime: format(new Date(), 'hh:mm a'),
                            time: format(new Date(), 'hh:mm a'), // fallback
                            status: 'Signed In',
                            timestamp: serverTimestamp(),
                        });
                        setScannedClass({ subject: "Daily Campus (IN Marked)" });
                        toast.success('IN Time Marked Successfully!');
                        return;
                    }
                }

                // Prevent duplicate attendance for regular classes
                const q = query(
                    collection(db, 'attendance'),
                    where('studentId', '==', userData.uid),
                    where('classId', '==', classId)
                );
                const existing = await getDocs(q);
                if (!existing.empty) {
                    toast.error('Attendance already marked!');
                    setScannedClass(classData);
                    return;
                }

                const attendanceId = `${userData.uid}_${classId}`;
                await setDoc(doc(db, 'attendance', attendanceId), {
                    studentId: userData.uid || 'unknown',
                    studentName: userData.name || 'Unknown',
                    studentEmail: userData.email || 'Unknown',
                    classId: classId || 'unknown',
                    teacherId: classData.teacherId || 'unknown',
                    teacherName: classData.teacherName || 'Unknown',
                    subject: classData.subject || 'Unknown',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    time: format(new Date(), 'hh:mm a'),
                    status: 'Present',
                    timestamp: serverTimestamp(),
                });

                setScannedClass(classData);
                toast.success('Attendance Marked Successfully!');
            } catch (err) {
                console.error("Scanning Error:", err);
                toast.error(err.message || 'Error marking attendance');
                setIsScanning(true);
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
        setError('Camera access denied. Please allow camera permission and try again.');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col text-white">
            {/* Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between relative z-10 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={() => navigate(userData?.role === 'teacher' ? '/teacher' : '/student')}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold">Scan Attendance QR</h1>
                <div className="w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-6">
                <AnimatePresence mode="wait">
                    {isScanning ? (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-xs sm:max-w-sm"
                        >
                            {/* Scanner Box */}
                            <div className="aspect-square relative rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl shadow-primary/30">
                                <QrScanner
                                    delay={300}
                                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                    onError={handleError}
                                    onScan={handleScan}
                                    constraints={{ video: { facingMode: 'environment' } }}
                                />

                                {/* Corner markers overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-3/4 h-3/4 relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />

                                        {/* Scanning line */}
                                        <motion.div
                                            animate={{ top: ['0%', '100%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(59,130,246,0.9)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hint */}
                            <p className="text-center text-white/50 font-medium text-sm mt-6 animate-pulse">
                                Point camera at the QR code shown by your teacher
                            </p>

                            {/* Error */}
                            {error && (
                                <div className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-xs sm:max-w-sm"
                        >
                            <Card className="bg-white p-6 sm:p-10 flex flex-col items-center text-gray-800">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5"
                                >
                                    <CheckCircle2 className="w-11 h-11 text-green-500" />
                                </motion.div>

                                <h2 className="text-2xl font-black mb-2 text-center">Marked! 🎉</h2>
                                <p className="text-gray-400 text-center text-sm mb-6">
                                    Attendance for <span className="text-primary font-bold">{scannedClass?.subject || 'the class'}</span> has been recorded.
                                </p>

                                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 sm:p-4 bg-green-50 rounded-2xl text-center">
                                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">Status</p>
                                        <p className="font-bold text-green-600 text-sm">Present ✓</p>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-gray-50 rounded-2xl text-center">
                                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">Time</p>
                                        <p className="font-bold text-gray-700 text-sm">{format(new Date(), 'hh:mm a')}</p>
                                    </div>
                                </div>

                                <Button className="w-full" onClick={() => navigate(userData?.role === 'teacher' ? '/teacher' : '/student')}>
                                    Back to Dashboard
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer tip */}
            <div className="p-6 text-center">
                <p className="text-xs text-white/30 flex items-center justify-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    Ensure stable internet for real-time sync
                </p>
            </div>
        </div>
    );
};

export default ScannerPage;
