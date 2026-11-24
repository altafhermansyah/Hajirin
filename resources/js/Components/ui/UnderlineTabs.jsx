import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Clean underline filter tabs with muted tabular counters (no pill capsules).
 * Each item: [key, label, optionalCount] or { key, label, count }.
 */
export function UnderlineTabs({ items = [], activeKey, onChange, className = '' }) {
    return (
        <div
            className={cn(
                'flex items-center gap-6 border-b border-slate-200 px-5 overflow-x-auto scrollbar-none',
                className
            )}
        >
            {items.map((raw) => {
                const key = Array.isArray(raw) ? raw[0] : raw.key;
                const label = Array.isArray(raw) ? raw[1] : raw.label;
                const count = Array.isArray(raw) ? raw[2] : raw.count;
                const isActive = activeKey === key;

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(key)}
                        className={cn(
                            'py-3 border-b-2 text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer',
                            isActive
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        )}
                    >
                        <span>{label}</span>
                        {count !== undefined && count !== null && (
                            <span className="text-xs font-normal text-slate-400 tabular-nums">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
