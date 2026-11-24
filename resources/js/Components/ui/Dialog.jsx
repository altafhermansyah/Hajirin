import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onOpenChange, ariaLabelledBy, ariaLabel, maxWidth = 'max-w-[440px]', children }) {
    const dialogRef = useRef(null);
    const pressedOutsideRef = useRef(false);

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

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => {
            dialog.returnValue = '';
            onOpenChange?.(false);
        };

        const isOutside = (event) => {
            const rect = dialog.getBoundingClientRect();
            return (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            );
        };

        const handlePointerDown = (event) => {
            pressedOutsideRef.current = isOutside(event);
        };

        const handlePointerUp = (event) => {
            if (pressedOutsideRef.current && isOutside(event) && dialog.open) {
                dialog.close();
            }
            pressedOutsideRef.current = false;
        };

        dialog.addEventListener('close', handleClose);

        const needsLightDismissFallback = !('closedBy' in HTMLDialogElement.prototype);
        if (needsLightDismissFallback) {
            dialog.addEventListener('pointerdown', handlePointerDown);
            dialog.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            dialog.removeEventListener('close', handleClose);
            if (needsLightDismissFallback) {
                dialog.removeEventListener('pointerdown', handlePointerDown);
                dialog.removeEventListener('pointerup', handlePointerUp);
            }
        };
    }, [onOpenChange]);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={ariaLabelledBy}
            aria-label={!ariaLabelledBy ? ariaLabel : undefined}
            className={cn('hajirin-dialog m-auto w-full', maxWidth)}
            {...{ closedby: 'any' }}
        >
            {open ? children : null}
        </dialog>
    );
}

export function DialogContent({ className, children, onClose, ...props }) {
    return (
        <div
            className={cn(
                'relative w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-7 text-left overflow-y-auto max-h-[calc(100dvh-2rem)]',
                className
            )}
            {...props}
        >
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                    aria-label="Tutup dialog"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            )}
            {children}
        </div>
    );
}

export function DialogTitle({ className, ...props }) {
    return (
        <h1 className={cn('text-lg font-semibold tracking-tight text-slate-900', className)} {...props} />
    );
}

export function DialogDescription({ className, ...props }) {
    return (
        <p className={cn('text-sm text-slate-500 leading-relaxed', className)} {...props} />
    );
}

/**
 * Structured modal built on native `<dialog>` with consistent header, scrollable body, and optional footer.
 */
export function Modal({
    open,
    onClose,
    title,
    description = null,
    maxWidth = 'max-w-lg',
    footer = null,
    children,
}) {
    const titleId = useId();

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose?.()} ariaLabelledBy={titleId} maxWidth={maxWidth}>
            <div className="w-full rounded-xl border border-slate-200 bg-white text-left shadow-lg overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 shrink-0">
                    <div className="min-w-0">
                        <h1 id={titleId} className="text-base font-semibold text-slate-900">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup dialog"
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition-colors cursor-pointer"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="overflow-y-auto p-5 flex-1">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
