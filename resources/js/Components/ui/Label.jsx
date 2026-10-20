import React from 'react';
import { cn } from '../../lib/utils';

export function Label({ className, children, ...props }) {
    return (
        <label
            className={cn(
                'text-xs font-semibold text-gray-700 tracking-wide block mb-1.5',
                className
            )}
            {...props}
        >
            {children}
        </label>
    );
}
