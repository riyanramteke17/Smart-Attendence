import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/UI';
import { UserPlus, User, GraduationCap, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData.email, formData.password, formData.name, formData.role);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'student', label: 'Student', icon: GraduationCap },
        { id: 'teacher', label: 'Teacher', icon: Briefcase },
        { id: 'admin', label: 'Admin', icon: User },
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

            <Card className="w-full max-w-lg relative z-10 p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-bold gradient-text">Join SmartQR</h1>
                    <p className="text-gray-500 mt-2">Secure attendance management</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">I am a...</label>
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.role === role.id
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-transparent bg-white/50 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <role.icon className="w-6 h-6" />
                                    <span className="text-xs font-semibold">{role.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                        {!loading && <UserPlus className="w-5 h-5" />}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Register;
