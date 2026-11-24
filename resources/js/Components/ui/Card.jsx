import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Clean bordered surface container (8px radius, flat border-driven design).
 */
export function Card({ as: Component = 'div', className = '', children, ...props }) {
    return (
        <Component
            className={cn('rounded-lg border border-slate-200 bg-white', className)}
            {...props}
        >
            {children}
        </Component>
    );
}

/**
 * Standard card header bar with title, optional description, and right action slot.
 */
export function CardHeader({ title, description = null, action = null, className = '' }) {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 px-5 py-4',
                className
            )}
        >
            <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {description && (
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
