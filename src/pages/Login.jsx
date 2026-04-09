import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const { loginWithGoogle, userData, loading, firestoreError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userData) navigate('/');
    }, [userData, navigate]);

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login attempt failed:", error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                toast.error('Login failed. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8FAFC] relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <Card className="p-6 sm:p-10 shadow-2xl border-none">
                    {/* Logo & Title */}
                    <div className="flex flex-col items-center mb-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 mb-5"
                        >
                            <ShieldCheck className="text-white w-8 h-8 sm:w-10 sm:h-10" />
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">SmartQR</h1>
                        <p className="text-gray-500 mt-1.5 font-medium text-sm sm:text-base">Automatic Attendance System</p>
                    </div>

                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Welcome Back</h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">Sign in with your campus Google account</p>
                        </div>

                        {/* Google Sign In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg font-bold rounded-2xl bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            {loading ? 'Signing in...' : 'Continue with Google'}
                        </button>

                        {/* Firestore Error */}
                        {firestoreError && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                <div className="flex gap-3">
                                    <span className="text-lg">🔐</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-red-700 text-sm font-bold">Database Access Error</p>
                                        <p className="text-red-500 text-xs mt-0.5 leading-tight break-words">{firestoreError}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-3 text-[10px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                                        >
                                            REFRESH & TRY AGAIN
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            Secured by Firebase Authentication
                        </p>
                    </div>
                </Card>

                <p className="text-center text-gray-400 text-xs font-medium mt-6">
                    © 2026 SmartQR AI. All identities verified.
                </p>
            </div>
        </div>
    );
};

export default Login;
