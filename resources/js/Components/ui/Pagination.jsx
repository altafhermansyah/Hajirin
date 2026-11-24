import React from 'react';
import { Link } from '@inertiajs/react';
import { buttonClass } from './Button';
import { cn } from '../../lib/utils';

function formatLabel(label) {
    const cleaned = String(label || '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
    if (/previous/i.test(cleaned)) return 'Sebelumnya';
    if (/next/i.test(cleaned)) return 'Berikutnya';
    return cleaned;
}

/**
 * Safe Inertia pagination bar (no dangerouslySetInnerHTML, consistent tabular summary).
 */
export function Pagination({
    links = [],
    from = 0,
    to = 0,
    total = 0,
    itemLabel = 'data',
    className = '',
}) {
    if (!links || links.length <= 3) {
        if (total === 0) return null;
        return (
            <div className={cn('px-5 py-3 border-t border-slate-200 text-xs text-slate-500 tabular-nums', className)}>
                Menampilkan {from ?? 0}-{to ?? 0} dari {total} {itemLabel}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                className
            )}
        >
            <p className="text-xs text-slate-500 tabular-nums">
                Menampilkan <span className="font-medium text-slate-700">{from ?? 0}-{to ?? 0}</span> dari{' '}
                <span className="font-medium text-slate-700">{total ?? 0}</span> {itemLabel}
            </p>
            <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center gap-1">
                {links.map((link, index) => {
                    const text = formatLabel(link.label);
                    if (!link.url) {
                        return (
                            <span
                                key={`${text}-${index}`}
                                aria-disabled="true"
                                className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2.5 text-xs text-slate-400"
                            >
                                {text}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={`${text}-${index}`}
                            href={link.url}
                            preserveScroll
                            preserveState
                            aria-current={link.active ? 'page' : undefined}
                            className={buttonClass(
                                link.active ? 'primary' : 'outline',
                                'sm',
                                'min-w-8 tabular-nums'
                            )}
                        >
                            {text}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
