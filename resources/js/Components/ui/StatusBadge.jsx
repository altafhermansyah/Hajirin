import React from 'react';
import { cn } from '../../lib/utils';

const STATUS_DOT_TONES = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-600',
    info: 'bg-brand-blue',
    neutral: 'bg-slate-400',
};

/**
 * Calm status indicator using an 8px semantic dot paired with neutral text (no neon capsule fills).
 */
export function StatusBadge({ tone = 'neutral', label, className = '' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 text-xs font-medium text-slate-700 whitespace-nowrap',
                className
            )}
        >
            <span
                className={cn(
                    'size-2 shrink-0 rounded-full',
                    STATUS_DOT_TONES[tone] || STATUS_DOT_TONES.neutral
                )}
                aria-hidden="true"
            />
            <span>{label}</span>
        </span>
    );
}

/**
 * Subtle neutral metadata tag (for roles, categories, ticket types, counters).
 */
export function NeutralTag({ children, className = '' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap',
                className
            )}
        >
            {children}
        </span>
    );
}
