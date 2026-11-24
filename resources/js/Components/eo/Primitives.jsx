import React from 'react';
import { Button, buttonClass } from '../ui/Button';
import { Modal } from '../ui/Dialog';

export { buttonClass as eoButtonClass } from '../ui/Button';
export { Card, CardHeader } from '../ui/Card';
export { StatCard } from '../ui/StatCard';
export { StatusBadge } from '../ui/StatusBadge';
export { UnderlineTabs } from '../ui/UnderlineTabs';

/**
 * EO action button delegating to the unified `Components/ui/Button` primitive.
 */
export function EoButton({ variant = 'outline', size = 'sm', ...props }) {
    return <Button variant={variant} size={size} {...props} />;
}

/**
 * Accessible native `<dialog>` modal delegating to the unified `Components/ui/Dialog` Modal.
 */
export function NativeModal({ open, onClose, title, maxWidth = 'max-w-md', children }) {
    return (
        <Modal open={open} onClose={onClose} title={title} maxWidth={maxWidth}>
            {children}
        </Modal>
    );
}
