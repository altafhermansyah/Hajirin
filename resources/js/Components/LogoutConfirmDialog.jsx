import { useId, useState } from 'react';
import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/Dialog';

export default function LogoutConfirmDialog({ open, onOpenChange }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const titleId = useId();

    const handleClose = () => {
        if (isLoggingOut) return;
        onOpenChange(false);
    };

    const handleConfirmLogout = () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        router.post(
            '/logout',
            {},
            {
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsLoggingOut(false),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose} ariaLabelledBy={titleId}>
            <DialogContent onClose={handleClose} className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                        <LogOut className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5 pr-6">
                        <DialogTitle id={titleId} className="text-lg">
                            Keluar dari Akun?
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Anda akan keluar dari sesi Hajirin saat ini dan perlu masuk kembali untuk mengakses tiket atau dashboard.
                        </DialogDescription>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        autoFocus
                        onClick={handleClose}
                        disabled={isLoggingOut}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmLogout}
                        disabled={isLoggingOut}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition cursor-pointer"
                    >
                        <LogOut className="size-4" aria-hidden="true" />
                        <span>{isLoggingOut ? 'Memproses...' : 'Ya, Keluar'}</span>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
