import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const TONES = {
    success: {
        box: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
        icon: 'text-emerald-600',
        Icon: CheckCircle2,
    },
    error: {
        box: 'border-rose-200 bg-rose-50/70 text-rose-900',
        icon: 'text-rose-600',
        Icon: AlertCircle,
    },
    warning: {
        box: 'border-amber-200 bg-amber-50/70 text-amber-900',
        icon: 'text-amber-600',
        Icon: AlertTriangle,
    },
    info: {
        box: 'border-slate-200 bg-slate-50 text-slate-800',
        icon: 'text-brand-blue',
        Icon: Info,
    },
};

/**
 * Flat, clean alert banner (no gradients, no heavy shadows).
 */
export function FlashBanner({ tone = 'info', title = null, message, action = null, className = '' }) {
    if (!message && !title) return null;
    const style = TONES[tone] || TONES.info;
    const Icon = style.Icon;

    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
                style.box,
                className
            )}
        >
            <div className="flex items-start gap-2.5 min-w-0">
                <Icon className={cn('size-4 mt-0.5 shrink-0', style.icon)} aria-hidden="true" />
                <div className="min-w-0">
                    {title && <p className="font-semibold leading-snug">{title}</p>}
                    {message && <p className={cn('leading-relaxed', title ? 'text-xs opacity-90 mt-0.5' : 'font-medium')}>{message}</p>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
