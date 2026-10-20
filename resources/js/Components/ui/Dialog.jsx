import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onOpenChange, children }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && open) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Inline keyframes for guaranteed 60fps smooth spring transitions */}
            <style>{`
                @keyframes hajirinFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes hajirinSpringIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.94) translateY(14px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>

            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-[#0D1B2A]/60 backdrop-blur-sm transition-opacity"
                style={{ animation: 'hajirinFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Modal Body */}
            <div
                className="relative w-full max-w-[440px] z-10 my-auto"
                style={{ animation: 'hajirinSpringIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ className, children, onClose, ...props }) {
    return (
        <div
            className={cn(
                'relative w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 text-left overflow-hidden',
                className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 active:scale-90"
                    aria-label="Tutup"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return (
        <div className={cn('flex flex-col space-y-1.5 text-left mb-6', className)} {...props} />
    );
}

export function DialogTitle({ className, ...props }) {
    return (
        <h2 className={cn('text-xl font-bold tracking-tight text-gray-900', className)} {...props} />
    );
}

export function DialogDescription({ className, ...props }) {
    return (
        <p className={cn('text-xs text-gray-500 leading-relaxed', className)} {...props} />
    );
}
