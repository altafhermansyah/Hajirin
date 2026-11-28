import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    KeyRound,
    Mail,
    MailCheck,
    RefreshCw,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button, buttonClass } from './ui/Button';
import { Modal } from './ui/Dialog';

const INPUT_CLASS =
    'w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function AccountSecurityAndPrivacy({ user, flash = {} }) {
    const storageKey = `hajirin_pw_reset_wait_${user?.id || 'guest'}`;

    const [waitingBaseline, setWaitingBaseline] = useState(() => {
        if (typeof window === 'undefined') return null;
        try {
            return window.sessionStorage.getItem(storageKey);
        } catch {
            return null;
        }
    });

    const [dismissedCompleted, setDismissedCompleted] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [broadcastEnabled, setBroadcastEnabled] = useState(
        user?.broadcast_emails_enabled !== false
    );
    const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
    const lastReloadRef = useRef(0);

    useEffect(() => {
        setBroadcastEnabled(user?.broadcast_emails_enabled !== false);
    }, [user?.broadcast_emails_enabled]);

    const handleToggleBroadcastEmails = () => {
        if (isUpdatingPrefs) return;
        const nextValue = !broadcastEnabled;
        setBroadcastEnabled(nextValue);
        setIsUpdatingPrefs(true);

        router.patch(
            '/profile/preferences',
            { broadcast_emails_enabled: nextValue },
            {
                preserveScroll: true,
                onError: () => setBroadcastEnabled(!nextValue),
                onFinish: () => setIsUpdatingPrefs(false),
            }
        );
    };

    const resetLinkForm = useForm({
        email: '',
    });

    const deleteForm = useForm({
        email: '',
        confirmation: '',
    });

    const passwordChangedSinceWait =
        waitingBaseline !== null &&
        Boolean(user?.password_changed_at) &&
        user.password_changed_at !== waitingBaseline;

    const isPasswordChangedState =
        !dismissedCompleted &&
        (Boolean(flash?.password_reset_completed) || passwordChangedSinceWait);

    const isWaitingEmailState = !isPasswordChangedState && waitingBaseline !== null;

    // Bersihkan marker sessionStorage begitu perubahan kata sandi terdeteksi selesai
    useEffect(() => {
        if (isPasswordChangedState && typeof window !== 'undefined') {
            try {
                window.sessionStorage.removeItem(storageKey);
            } catch {
                // Abaikan jika sessionStorage tidak tersedia
            }
        }
    }, [isPasswordChangedState, storageKey]);

    // Dengarkan visibilitychange / focus saat menunggu user menyelesaikan ganti sandi di tab email
    useEffect(() => {
        if (!isWaitingEmailState || typeof document === 'undefined') return undefined;

        const checkAuthUpdate = () => {
            if (document.visibilityState && document.visibilityState !== 'visible') {
                return;
            }
            const now = Date.now();
            if (now - lastReloadRef.current < 2000) return;
            lastReloadRef.current = now;
            router.reload({ only: ['auth'] });
        };

        document.addEventListener('visibilitychange', checkAuthUpdate);
        window.addEventListener('focus', checkAuthUpdate);
        return () => {
            document.removeEventListener('visibilitychange', checkAuthUpdate);
            window.removeEventListener('focus', checkAuthUpdate);
        };
    }, [isWaitingEmailState]);

    const handleSendPasswordResetLink = (e) => {
        e.preventDefault();
        setDismissedCompleted(false);

        resetLinkForm.post('/profile/password-reset-link', {
            preserveScroll: true,
            onSuccess: () => {
                const baseline = user?.password_changed_at || 'none';
                setWaitingBaseline(baseline);
                try {
                    window.sessionStorage.setItem(storageKey, baseline);
                } catch {
                    // Abaikan jika sessionStorage tidak tersedia
                }
                resetLinkForm.reset('email');
            },
        });
    };

    const handleResetStateToForm = () => {
        setDismissedCompleted(true);
        setWaitingBaseline(null);
        try {
            window.sessionStorage.removeItem(storageKey);
        } catch {
            // Abaikan
        }
        resetLinkForm.clearErrors();
    };

    const handleDeleteAccount = (e) => {
        e.preventDefault();
        deleteForm.delete('/profile', {
            preserveScroll: true,
            onError: () => {
                // Modal tetap terbuka menampilkan pesan error
            },
        });
    };

    return (
        <div className="space-y-5">
            {/* Kartu 1: Ubah Kata Sandi Terintegrasi via Email */}
            <Card as="section" className="p-6 sm:p-8 space-y-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <KeyRound className="size-4 text-slate-400" aria-hidden="true" />
                        <span>Keamanan &amp; Ubah Kata Sandi</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Perubahan kata sandi menggunakan tautan verifikasi resmi ke email akun Anda agar lebih aman.
                    </p>
                </div>

                {isPasswordChangedState ? (
                    <div
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600">
                                <CheckCircle2 className="size-5" aria-hidden="true" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-emerald-950">
                                    Kata Sandi Berhasil Diperbarui
                                </p>
                                <p className="text-xs text-emerald-900/80 leading-relaxed">
                                    Kata sandi akun Hajirin Anda telah berhasil diganti
                                    {user?.password_changed_at_formatted
                                        ? ` pada ${user.password_changed_at_formatted}`
                                        : ''}
                                    . Tidak ada tindakan lanjutan yang diperlukan.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetStateToForm}
                            className="shrink-0 bg-white"
                        >
                            Kirim Link Baru Lagi
                        </Button>
                    </div>
                ) : isWaitingEmailState ? (
                    <div
                        role="status"
                        className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 space-y-3"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-brand-blue">
                                <MailCheck className="size-5" aria-hidden="true" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-900">
                                    Tautan Ganti Kata Sandi Telah Dikirim ke Email Anda
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {flash?.password_reset_status ||
                                        `Silakan buka kotak masuk email ${user?.email} dan klik tautan atur ulang kata sandi. Halaman ini otomatis mendeteksi status setelah kata sandi selesai diubah.`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-white"
                                onClick={() => router.reload({ only: ['auth'] })}
                            >
                                <RefreshCw className="size-3.5" aria-hidden="true" />
                                <span>Periksa Status Sekarang</span>
                            </Button>
                            <button
                                type="button"
                                onClick={handleResetStateToForm}
                                className="text-xs font-medium text-brand-blue hover:underline px-2 py-1 cursor-pointer"
                            >
                                Kirim ulang link ke email
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendPasswordResetLink} className="space-y-4 max-w-xl">
                        <div>
                            <label
                                htmlFor="profile-reset-email"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Masukkan Alamat Email Akun Anda untuk Konfirmasi{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                                <input
                                    id="profile-reset-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={resetLinkForm.data.email}
                                    onChange={(e) => {
                                        resetLinkForm.setData('email', e.target.value);
                                        if (resetLinkForm.errors.email) {
                                            resetLinkForm.clearErrors('email');
                                        }
                                    }}
                                    placeholder={user?.email || 'nama@email.com'}
                                    className={`${INPUT_CLASS} pl-9`}
                                />
                            </div>
                            {resetLinkForm.errors.email && (
                                <p role="alert" className="text-xs text-rose-600 mt-1 font-medium">
                                    {resetLinkForm.errors.email}
                                </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                                Ketik ulang email terdaftar Anda ({user?.email}) lalu kami akan mengirimkan tautan ubah kata sandi.
                            </p>
                        </div>

                        {user?.password_changed_at_formatted && (
                            <p className="text-xs text-slate-500">
                                Perubahan kata sandi terakhir:{' '}
                                <span className="font-medium text-slate-700">
                                    {user.password_changed_at_formatted}
                                </span>
                            </p>
                        )}

                        <div>
                            <Button
                                type="submit"
                                variant="outline"
                                size="md"
                                loading={resetLinkForm.processing}
                            >
                                <Mail className="size-4 text-brand-blue" aria-hidden="true" />
                                <span>
                                    {resetLinkForm.processing
                                        ? 'Mengirim Tautan...'
                                        : 'Kirim Link Ganti Kata Sandi'}
                                </span>
                            </Button>
                        </div>
                    </form>
                )}
            </Card>

            {/* Kartu 2: Privasi, Ekspor Data Pribadi & Penghapusan Akun */}
            <Card as="section" className="p-6 sm:p-8 space-y-6">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="size-4 text-slate-400" aria-hidden="true" />
                        <span>Data Saya &amp; Hapus Akun</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Anda bebas mengunduh salinan data Anda atau menghapus akun Hajirin kapan saja.
                    </p>
                </div>

                {/* Preferensi Email Pengumuman EO */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                            Email Pengumuman dari Penyelenggara
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Terima salinan email saat penyelenggara mengirim info terbaru tentang acara yang Anda ikuti. Notifikasi di dalam aplikasi tetap aktif.
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={broadcastEnabled}
                        aria-label="Aktifkan atau nonaktifkan email pengumuman dari penyelenggara"
                        disabled={isUpdatingPrefs}
                        onClick={handleToggleBroadcastEmails}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60 cursor-pointer ${
                            broadcastEnabled ? 'bg-brand-blue' : 'bg-slate-300'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`inline-block size-4.5 rounded-full bg-white shadow-xs transition-transform ${
                                broadcastEnabled ? 'translate-x-5.5' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Ekspor Data Pribadi */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900">
                            Unduh Salinan Data Saya
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Simpan salinan profil, pesanan, tiket, dan event tersimpan Anda dalam satu berkas.
                        </p>
                    </div>
                    <a
                        href="/profile/export-data"
                        download
                        className={buttonClass('outline', 'sm', 'shrink-0 bg-white')}
                    >
                        <Download className="size-3.5 text-slate-600" aria-hidden="true" />
                        <span>Unduh Data</span>
                    </a>
                </div>

                {/* Zona Berbahaya: Hapus Akun */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-rose-950">
                            Hapus Akun
                        </p>
                        <p className="text-xs text-rose-900/80 leading-relaxed">
                            Akun yang dihapus tidak bisa dipulihkan. Data pribadi Anda akan dihapus, sementara catatan transaksi tetap disimpan tanpa nama Anda untuk keperluan pembukuan.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="danger-outline"
                        size="sm"
                        className="shrink-0 bg-white"
                        onClick={() => {
                            deleteForm.reset();
                            deleteForm.clearErrors();
                            setIsDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        <span>Hapus Akun</span>
                    </Button>
                </div>
            </Card>

            {/* Modal Konfirmasi Hapus Akun */}
            <Modal
                open={isDeleteModalOpen}
                onClose={() => {
                    if (!deleteForm.processing) setIsDeleteModalOpen(false);
                }}
                title="Hapus akun Anda?"
                description="Setelah dihapus, Anda tidak bisa masuk lagi dan akun tidak bisa dipulihkan."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-900 leading-relaxed">
                        <AlertTriangle
                            className="size-4 text-rose-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                        />
                        <div>
                            Pesanan yang belum dibayar dan tiket yang sedang Anda transfer (belum diklaim) akan dibatalkan otomatis. Unduh salinan data Anda dulu jika masih diperlukan.
                        </div>
                    </div>

                    {deleteForm.errors.account && (
                        <p
                            role="alert"
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
                        >
                            {deleteForm.errors.account}
                        </p>
                    )}

                    <div>
                        <label
                            htmlFor="delete-account-email"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Email akun Anda <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="delete-account-email"
                            type="email"
                            required
                            value={deleteForm.data.email}
                            onChange={(e) => deleteForm.setData('email', e.target.value)}
                            placeholder={user?.email || 'nama@email.com'}
                            className={INPUT_CLASS}
                        />
                        {deleteForm.errors.email && (
                            <p role="alert" className="text-xs text-rose-600 mt-1">
                                {deleteForm.errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="delete-account-confirmation"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Ketik <span className="font-mono font-bold text-rose-700">HAPUS AKUN</span> untuk memastikan{' '}
                            <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="delete-account-confirmation"
                            type="text"
                            required
                            autoComplete="off"
                            value={deleteForm.data.confirmation}
                            onChange={(e) => deleteForm.setData('confirmation', e.target.value)}
                            placeholder="HAPUS AKUN"
                            className={`${INPUT_CLASS} font-mono`}
                        />
                        {deleteForm.errors.confirmation && (
                            <p role="alert" className="text-xs text-rose-600 mt-1">
                                {deleteForm.errors.confirmation}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deleteForm.processing}
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="danger-outline"
                            size="sm"
                            loading={deleteForm.processing}
                            disabled={
                                deleteForm.processing ||
                                deleteForm.data.confirmation.trim() !== 'HAPUS AKUN' ||
                                !deleteForm.data.email.trim()
                            }
                        >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            <span>Ya, Hapus Akun Saya</span>
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
