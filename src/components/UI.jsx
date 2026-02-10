import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/utils';

export const Button = React.forwardRef(({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
        primary: 'bg-gradient-primary text-white hover:shadow-lg hover:shadow-blue-500/30',
        secondary: 'bg-white bg-opacity-20 text-gray-800 border border-white border-opacity-30 hover:bg-opacity-30',
        outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            className={cn(
                'px-6 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                className
            )}
            {...props}
        />
    );
});

export const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full space-y-1.5">
            {label && <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>}
            <input
                ref={ref}
                className={cn(
                    "w-full px-4 py-3 bg-white bg-opacity-50 backdrop-blur-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400",
                    error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
});

export const Card = ({ children, className, animate = true }) => {
    const Component = animate ? motion.div : 'div';
    return (
        <Component
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            className={cn(
                'glass-card p-6',
                className
            )}
        >
            {children}
        </Component>
    );
};
