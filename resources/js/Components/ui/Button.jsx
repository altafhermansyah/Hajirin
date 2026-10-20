import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
    children,
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    type = 'button',
    style = {},
    ...props
}) {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/25 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

    const variants = {
        default: 'text-white shadow-md shadow-[#1D4ED8]/25',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
        outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-200',
        ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
    };

    const sizes = {
        default: 'h-11 px-5 py-2.5 text-sm',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
    };

    // Guarantee default variant is always Hajirin vibrant blue with white text
    const computedStyle = variant === 'default' ? {
        backgroundColor: isHovered && !disabled && !loading ? '#1e40af' : '#1D4ED8',
        color: '#FFFFFF',
        ...style,
    } : style;

    return (
        <button
            type={type}
            disabled={disabled || loading}
            style={computedStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />}
            {children}
        </button>
    );
}
