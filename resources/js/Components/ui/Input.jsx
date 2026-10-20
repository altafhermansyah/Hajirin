import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
    return (
        <input
            type={type}
            ref={ref}
            className={cn(
                'flex h-11 w-full rounded-xl border bg-gray-50/70 px-3.5 py-2 text-sm text-gray-900 transition-all duration-200',
                'placeholder:text-gray-400',
                'focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/10 focus:border-[#1D4ED8]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 hover:border-gray-300',
                className
            )}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export const InputGroup = React.forwardRef(({
    className,
    containerClassName,
    icon: Icon,
    rightElement,
    error,
    type = 'text',
    ...props
}, ref) => {
    return (
        <div
            className={cn(
                'group flex items-center h-11 w-full rounded-xl border bg-gray-50/70 px-3.5 transition-all duration-200',
                'focus-within:bg-white focus-within:border-[#1D4ED8] focus-within:ring-4 focus-within:ring-[#1D4ED8]/10',
                error
                    ? 'border-red-400 bg-red-50/30 focus-within:border-red-500 focus-within:ring-red-500/10'
                    : 'border-gray-200 hover:border-gray-300',
                containerClassName
            )}
        >
            {Icon && (
                <Icon className={cn(
                    'w-4 h-4 shrink-0 mr-3 text-gray-400 transition-colors duration-150 group-focus-within:text-[#1D4ED8]',
                    error && 'text-red-400 group-focus-within:text-red-500'
                )} />
            )}
            <input
                ref={ref}
                type={type}
                className={cn(
                    'w-full h-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                {...props}
            />
            {rightElement && (
                <div className="shrink-0 ml-2 flex items-center">
                    {rightElement}
                </div>
            )}
        </div>
    );
});

InputGroup.displayName = 'InputGroup';
