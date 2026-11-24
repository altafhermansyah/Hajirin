import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const BUTTON_BASE =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer whitespace-nowrap';

const BUTTON_VARIANTS = {
    primary: 'bg-brand-blue text-white hover:bg-blue-800',
    default: 'bg-brand-blue text-white hover:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
    'danger-outline':
        'border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-rose-600',
};

const BUTTON_SIZES = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-3.5 text-sm',
    default: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'size-8 p-0',
};

/**
 * Shared Tailwind class builder for Hajirin `<button>` and Inertia `<Link>` actions.
 */
export function buttonClass(variant = 'outline', size = 'sm', className = '') {
    return cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.outline,
        BUTTON_SIZES[size] || BUTTON_SIZES.sm,
        className
    );
}

/**
 * Unified accessible button component (pure CSS hover/focus, zero JS hover state).
 */
export function Button({
    children,
    className = '',
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    type = 'button',
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={buttonClass(variant, size, className)}
            {...props}
        >
            {loading && <Loader2 className="size-4 animate-spin shrink-0" aria-hidden="true" />}
            {children}
        </button>
    );
}
