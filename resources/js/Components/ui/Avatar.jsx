import React from 'react';
import { cn } from '../../lib/utils';

const AVATAR_SIZES = {
    xs: 'size-7 text-[11px]',
    sm: 'size-8 text-xs',
    md: 'size-9 text-xs',
    lg: 'size-11 text-sm',
};

function getInitials(name) {
    if (!name) return '?';
    return String(name)
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Calm neutral monogram or photo avatar (replaces neon solid-fill table avatars).
 */
export function Avatar({ name = '', src = null, size = 'md', shape = 'circle', className = '' }) {
    const shapeClass = shape === 'rounded' ? 'rounded-lg' : 'rounded-full';
    const sizeClass = AVATAR_SIZES[size] || AVATAR_SIZES.md;

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={cn(
                    'shrink-0 object-cover border border-slate-200',
                    shapeClass,
                    sizeClass,
                    className
                )}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-flex shrink-0 items-center justify-center border border-slate-200/90 bg-slate-100 font-semibold text-slate-700 select-none',
                shapeClass,
                sizeClass,
                className
            )}
        >
            {getInitials(name)}
        </span>
    );
}
