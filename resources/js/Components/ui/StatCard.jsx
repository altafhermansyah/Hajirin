import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

/**
 * Neutral KPI card: sentence-case label, subtle 16px muted icon, tabular numeric value,
 * concise subtext, and optional thin progress bar (no colored icon box).
 */
export function StatCard({
    label,
    icon: Icon = null,
    value,
    valueSuffix = null,
    subtext = null,
    progress = null,
    className = '',
}) {
    return (
        <Card className={cn('p-5 flex flex-col justify-between', className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                {Icon && (
                    <Icon
                        className="size-4 shrink-0 text-slate-400"
                        strokeWidth={1.75}
                        aria-hidden="true"
                    />
                )}
            </div>

            <div className="mt-2.5">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                        {value}
                    </span>
                    {valueSuffix && (
                        <span className="text-xs font-normal text-slate-500">
                            {valueSuffix}
                        </span>
                    )}
                </div>

                {subtext && (
                    <p className="mt-1 text-xs text-slate-500 truncate">{subtext}</p>
                )}

                {typeof progress === 'number' && (
                    <div
                        className="mt-3 h-1 w-full overflow-hidden rounded-xs bg-slate-200"
                        role="progressbar"
                        aria-label={label}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="h-full bg-brand-blue transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
