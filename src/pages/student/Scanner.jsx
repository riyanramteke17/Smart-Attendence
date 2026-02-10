import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Camera,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';

const ScannerPage = () => {
    const { userData } = useAuth();
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scannedClass, setScannedClass] = useState(null);
    const navigate = useNavigate();

    const handleScan = async (data) => {
        if (data && isScanning && userData) {
            setIsScanning(false);
            const classId = data.text;

            try {
                // 1. Verify Class Exists
                const classDoc = await getDoc(doc(db, 'classes', classId));

                if (!classDoc.exists()) {
                    toast.error('Invalid QR Code');
                    setIsScanning(true);
                    return;
                }

                const classData = classDoc.data();
                if (classData.status !== 'active') {
                    toast.error('This class session has ended.');
                    setIsScanning(true);
                    return;
                }

                // 2. Prevent Double Attendance (Optional but good)
                const q = query(
                    collection(db, 'attendance'),
                    where('studentId', '==', userData.uid),
                    where('classId', '==', classId)
                );
                const existing = await getDocs(q);
                if (!existing.empty) {
                    toast.error('Attendance already marked!');
                    setScannedClass(classData);
                    setResult(classId);
                    return;
                }

                // 3. Mark Attendance
                const attendanceRecord = {
                    studentId: userData.uid,
                    studentName: userData.name,
                    studentEmail: userData.email,
                    classId: classId,
                    subject: classData.subject,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    time: format(new Date(), 'hh:mm a'),
                    status: 'Present', // You can add late logic here if needed
                    timestamp: serverTimestamp(),
                };

                await addDoc(collection(db, 'attendance'), attendanceRecord);

                setScannedClass(classData);
                setResult(classId);
                toast.success('Attendance Marked Successfully!');
            } catch (err) {
                console.error(err);
                toast.error('Error marking attendance');
                setIsScanning(true);
            }
        }
    };

    const handleError = (err) => {
        console.error(err);
        setError('Camera permission denied or not found.');
    };

    const previewStyle = {
        height: '100%',
        width: '100%',
        objectFit: 'cover',
    };

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col text-white">
            {/* Header */}
            <div className="p-6 flex items-center justify-between relative z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button
                    onClick={() => navigate('/student')}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">Attendance Scanner</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {isScanning ? (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-sm aspect-square relative rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl shadow-primary/20"
                        >
                            <QrScanner
                                delay={300}
                                style={previewStyle}
                                onError={handleError}
                                onScan={handleScan}
                                constraints={{
                                    video: { facingMode: "environment" }
                                }}
                            />

                            {/* Scanner Overlay UI */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-3/4 h-3/4 border-2 border-primary rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl -translate-x-1 -translate-y-1"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl translate-x-1 -translate-y-1"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl -translate-x-1 translate-y-1"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl translate-x-1 translate-y-1"></div>

                                    {/* Scanning Line Animation */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-sm"
                        >
                            <Card className="bg-white p-10 flex flex-col items-center text-gray-800">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-center">Success!</h2>
                                <p className="text-gray-500 text-center mb-8">
                                    Your attendance for <span className="text-primary font-bold">{scannedClass?.subject || 'the class'}</span> has been marked.
                                </p>
                                <div className="w-full grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">Status</p>
                                        <p className="font-bold text-green-600">Present</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">Time</p>
                                        <p className="font-bold text-gray-700">{format(new Date(), 'hh:mm a')}</p>
                                    </div>
                                </div>
                                <Button className="w-full mt-8" onClick={() => navigate('/student')}>
                                    Back to Dashboard
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mt-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {isScanning && (
                    <p className="mt-8 text-white/50 animate-pulse font-medium">
                        Place the QR code inside the frame to scan
                    </p>
                )}
            </div>

            {/* Tip */}
            <div className="p-8 text-center bg-white/5">
                <p className="text-sm text-white/40 italic">
                    Tip: Ensure you have a stable internet connection for real-time updates.
                </p>
            </div>
        </div>
    );
};

export default ScannerPage;
