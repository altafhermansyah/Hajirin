import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const BUTTON_BASE =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap select-none';

const BUTTON_VARIANTS = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
};

const BUTTON_SIZES = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3.5 text-sm',
};

/**
 * Shared button class builder for EO `<button>` and Inertia `<Link>` actions.
 */
export function eoButtonClass(variant = 'outline', size = 'sm', className = '') {
    return cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.outline,
        BUTTON_SIZES[size] || BUTTON_SIZES.sm,
        className
    );
}

/**
 * Neutral EO action button with consistent focus-visible and radius tokens.
 */
export function EoButton({
    variant = 'outline',
    size = 'sm',
    type = 'button',
    className = '',
    children,
    ...props
}) {
    return (
        <button
            type={type}
            className={eoButtonClass(variant, size, className)}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Clean bordered surface container (`8px` radius, no elevation shadow).
 */
export function Card({ as: Component = 'div', className = '', children, ...props }) {
    return (
        <Component
            className={cn('rounded-lg border border-gray-200 bg-white', className)}
            {...props}
        >
            {children}
        </Component>
    );
}

/**
 * Standard card header bar with title and optional concise description/action.
 */
export function CardHeader({ title, description = null, action = null, className = '' }) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4',
                className
            )}
        >
            <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                {description && (
                    <p className="mt-0.5 text-xs text-gray-500">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}

/**
 * Minimal KPI card with sentence-case label, subtle 16px icon, tabular value,
 * single-line neutral subtext, and optional `4px` progress bar.
 */
export function StatCard({
    label,
    icon: Icon = null,
    value,
    valueSuffix = null,
    subtext = null,
    progress = null,
}) {
    return (
        <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                {Icon && (
                    <Icon
                        className="size-4 shrink-0 text-gray-400"
                        strokeWidth={1.75}
                        aria-hidden="true"
                    />
                )}
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-gray-900 tabular-nums">
                        {value}
                    </span>
                    {valueSuffix && (
                        <span className="text-xs font-normal text-gray-500">
                            {valueSuffix}
                        </span>
                    )}
                </div>

                {subtext && (
                    <p className="mt-1 text-xs text-gray-500 truncate">{subtext}</p>
                )}

                {typeof progress === 'number' && (
                    <div
                        className="mt-3 h-1 w-full overflow-hidden rounded-xs bg-gray-200"
                        role="progressbar"
                        aria-label={label}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}

const STATUS_DOT_TONES = {
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
    neutral: 'bg-gray-400',
};

/**
 * Status display using a small `8px` semantic dot paired with neutral text.
 */
export function StatusBadge({ tone = 'neutral', label, className = '' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap',
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
 * Underline filter tabs with plain muted counters (no capsule backgrounds).
 */
export function UnderlineTabs({ items = [], activeKey, onChange }) {
    return (
        <div className="flex items-center gap-6 border-b border-gray-200 px-5 overflow-x-auto scrollbar-none">
            {items.map(([key, label, count]) => {
                const isActive = activeKey === key;

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(key)}
                        className={cn(
                            'py-3 border-b-2 text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer',
                            isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <span>{label}</span>
                        <span className="text-xs font-normal text-gray-500 tabular-nums">
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Accessible native `<dialog>` modal with `closedby="any"` and backdrop fallback.
 */
export function NativeModal({
    open,
    onClose,
    titleId,
    title,
    maxWidth = 'max-w-md',
    children,
}) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (open) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleBackdropClick = (e) => {
        const dialog = dialogRef.current;
        if (!dialog || e.target !== dialog || 'closedBy' in dialog) return;

        const rect = dialog.getBoundingClientRect();
        const isInside =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;

        if (!isInside) {
            onClose?.();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            closedby="any"
            aria-labelledby={titleId}
            onClose={() => onClose?.()}
            onClick={handleBackdropClick}
            className={cn(
                'm-auto w-[calc(100%-2rem)] rounded-lg border border-gray-200 bg-white p-0 text-left text-gray-900 shadow-sm backdrop:bg-gray-900/40',
                maxWidth
            )}
        >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 id={titleId} className="text-base font-semibold text-gray-900">
                    {title}
                </h3>
                <button
                    type="button"
                    onClick={() => onClose?.()}
                    aria-label="Tutup"
                    className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            </div>
            <div className="p-5">{children}</div>
        </dialog>
    );
}
