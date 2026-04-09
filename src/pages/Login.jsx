import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/UI';
import { ShieldCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const { loginWithGoogle, userData, loading, firestoreError } = useAuth();
    console.log("Login Page Rendering. UserData:", !!userData, "Loading:", loading, "Error:", firestoreError);
    const navigate = useNavigate();

    useEffect(() => {
        if (userData) {
            navigate('/');
        }
    }, [userData, navigate]);

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login attempt failed:", error);
            if (error.code === 'auth/unauthorized-domain-email') {
                toast.error('❌ NavGurukul.org accounts is app mein allowed nahi hain.', {
                    duration: 5000,
                    style: { fontWeight: '600' }
                });
            } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                toast.error('Login failed. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8FAFC]">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]"></div>
            </div>

            <Card className="w-full max-w-md relative z-10 p-10 shadow-2xl border-none">
                <div className="flex flex-col items-center mb-10 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 mb-6"
                    >
                        <ShieldCheck className="text-white w-10 h-10" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">SmartQR</h1>
                    <p className="text-gray-500 mt-2 font-medium">Automatic Attendance System</p>
                </div>

                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
                        <p className="text-gray-400 text-sm mt-1">Please sign in with your campus account</p>
                    </div>

                    <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-16 flex items-center justify-center gap-4 text-lg font-bold shadow-xl shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 group disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        {loading ? 'Processing...' : 'Continue with Google'}
                    </Button>

                    {firestoreError && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-4 animate-shake">
                            <div className="flex gap-3">
                                <div className="p-1 bgColor-red-100 rounded-lg h-fit">🔐</div>
                                <div className="flex-1">
                                    <p className="text-red-700 text-sm font-bold">Database Access Error</p>
                                    <p className="text-red-500 text-xs mt-0.5 leading-tight">{firestoreError}</p>
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
                        Secure Authentication by Firebase
                    </p>
                </div>
            </Card>

            {/* Footer */}
            <div className="absolute bottom-10 text-center w-full text-gray-400 text-sm font-medium">
                © 2026 SmartQR AI. All identities verified.
            </div>
        </div>
    );
};

export default Login;
