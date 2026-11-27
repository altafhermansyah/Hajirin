import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Clean underline filter tabs with muted tabular counters (no pill capsules).
 * Each item: [key, label, optionalCount] or { key, label, shortLabel, count }.
 */
export function UnderlineTabs({
    items = [],
    activeKey,
    onChange,
    mobileGrid = false,
    className = '',
}) {
    return (
        <div
            className={cn(
                mobileGrid
                    ? 'grid grid-cols-4 border-b border-slate-200 sm:flex sm:items-center sm:gap-6 sm:px-5'
                    : 'flex items-center gap-6 border-b border-slate-200 px-5 overflow-x-auto no-scrollbar',
                className
            )}
        >
            {items.map((raw) => {
                const key = Array.isArray(raw) ? raw[0] : raw.key;
                const label = Array.isArray(raw) ? raw[1] : raw.label;
                const shortLabel = Array.isArray(raw) ? null : raw.shortLabel;
                const count = Array.isArray(raw) ? raw[2] : raw.count;
                const isActive = activeKey === key;

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={(e) => {
                            onChange(key);
                            if (!mobileGrid) {
                                e.currentTarget.scrollIntoView({
                                    block: 'nearest',
                                    inline: 'nearest',
                                });
                            }
                        }}
                        className={cn(
                            'min-h-11 py-3 border-b-2 font-medium whitespace-nowrap inline-flex items-center justify-center gap-1 sm:gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue cursor-pointer',
                            mobileGrid ? 'px-1 text-xs sm:px-0 sm:text-sm' : 'text-sm',
                            isActive
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        )}
                    >
                        {shortLabel ? (
                            <>
                                <span className="sm:hidden">{shortLabel}</span>
                                <span className="hidden sm:inline">{label}</span>
                            </>
                        ) : (
                            <span>{label}</span>
                        )}
                        {count !== undefined && count !== null && (
                            <span className="text-[11px] sm:text-xs font-normal text-slate-400 tabular-nums">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
