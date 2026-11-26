import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '../../Components/Navbar';
import AuthModal from '../../Components/Auth/AuthModal';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    KeyRound,
    LogIn,
    LogOut,
    MapPin,
    ShieldCheck,
    Ticket,
    XCircle,
} from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';

export default function AcceptTransfer({
    auth,
    transfer = {},
    event = null,
    emailMatches = false,
    orderReference = null,
}) {
    const { flash } = usePage().props;
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');

    const acceptForm = useForm({
        code: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        acceptForm.post(`/ticket-transfers/${transfer.token}/accept`, {
            preserveScroll: true,
        });
    };

    const handleSwitchAccount = () => {
        router.post('/logout', {}, {
            onSuccess: () => {
                router.visit(`/ticket-transfers/${transfer.token}`);
            },
        });
    };

    const isPending = transfer.status === 'PENDING';
    const isAccepted = transfer.status === 'ACCEPTED';
    const isCancelledOrExpired = transfer.status === 'CANCELLED' || transfer.status === 'EXPIRED';

    return (
        <>
            <Head title={`Klaim Transfer E-Tiket - Hajirin`} />

            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
                <Navbar
                    auth={auth}
                    onOpenAuthModal={(view) => {
                        setAuthView(view);
                        setIsAuthModalOpen(true);
                    }}
                />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 space-y-6"
                >
                    {flash?.success && <FlashBanner tone="success" message={flash.success} />}
                    {flash?.error && <FlashBanner tone="error" message={flash.error} />}

                    <Card className="overflow-hidden">
                        {/* Event Header */}
                        {event && (
                            <div className="relative h-44 bg-navy text-white flex flex-col justify-end p-6">
                                {event.banner && (
                                    <img
                                        src={event.banner}
                                        alt={event.title}
                                        className="absolute inset-0 size-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/35" />
                                <div className="relative z-10 space-y-1.5">
                                    <NeutralTag className="bg-white/95 text-slate-900">
                                        {event.ticketTypeName}
                                    </NeutralTag>
                                    <h1 className="text-lg sm:text-xl font-semibold leading-snug">
                                        {event.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-200 tabular-nums">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays className="size-3.5" aria-hidden="true" />
                                            {event.dateFormatted}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3.5" aria-hidden="true" />
                                            {event.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6 sm:p-7 space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500">Transfer E-Tiket dari</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                        {transfer.senderName}
                                    </p>
                                </div>
                                <StatusBadge
                                    tone={
                                        isAccepted
                                            ? 'success'
                                            : isPending
                                              ? 'warning'
                                              : 'danger'
                                    }
                                    label={
                                        isAccepted
                                            ? 'Berhasil Diklaim'
                                            : isPending
                                              ? 'Menunggu Klaim'
                                              : transfer.status === 'CANCELLED'
                                                ? 'Dibatalkan Pengirim'
                                                : 'Kedaluwarsa'
                                    }
                                />
                            </div>

                            <dl className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Penerima Dituju</dt>
                                    <dd className="font-medium text-slate-900">
                                        {transfer.recipientName}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Email Tujuan</dt>
                                    <dd className="font-mono font-medium text-slate-900">
                                        {transfer.recipientEmail}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Batas Waktu Klaim</dt>
                                    <dd className="font-medium text-slate-900 tabular-nums">
                                        {transfer.expiresAtFormatted}
                                    </dd>
                                </div>
                            </dl>

                            {isAccepted && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-center space-y-3">
                                    <CheckCircle2
                                        className="mx-auto size-8 text-emerald-600"
                                        aria-hidden="true"
                                    />
                                    <h2 className="text-base font-semibold text-emerald-950">
                                        E-Tiket Sudah Diklaim
                                    </h2>
                                    <p className="text-xs text-emerald-900/80">
                                        Kepemilikan e-tiket telah berhasil dipindahkan pada{' '}
                                        {transfer.acceptedAtFormatted || '-'}.
                                    </p>
                                    <div className="pt-1 flex justify-center">
                                        <Link
                                            href={
                                                orderReference
                                                    ? `/my-tickets/${orderReference}`
                                                    : '/dashboard#tiket'
                                            }
                                            className={buttonClass('primary', 'md')}
                                        >
                                            <Ticket className="size-4" aria-hidden="true" />
                                            <span>Buka E-Tiket Saya</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {isCancelledOrExpired && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 text-center space-y-2.5">
                                    <XCircle
                                        className="mx-auto size-8 text-rose-600"
                                        aria-hidden="true"
                                    />
                                    <h2 className="text-base font-semibold text-rose-950">
                                        {transfer.status === 'CANCELLED'
                                            ? 'Undangan Transfer Dibatalkan'
                                            : 'Undangan Transfer Kedaluwarsa'}
                                    </h2>
                                    <p className="text-xs text-rose-900/80 leading-relaxed max-w-md mx-auto">
                                        {transfer.status === 'CANCELLED'
                                            ? 'Pengirim telah membatalkan transfer ini sehingga tiket tetap berada di akun pengirim.'
                                            : 'Batas waktu 24 jam atau batas percobaan kode unik telah habis. Minta pengirim membuat undangan baru.'}
                                    </p>
                                    <div className="pt-2">
                                        <Link href="/" className={buttonClass('outline', 'sm')}>
                                            Kembali ke Beranda
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {isPending && !auth?.user && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <LogIn className="size-5 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                                        <div className="space-y-1">
                                            <h2 className="text-sm font-semibold text-slate-900">
                                                Masuk atau Daftar Akun Hajirin Terlebih Dahulu
                                            </h2>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Untuk mengklaim e-tiket ini, silakan masuk atau buat akun Hajirin menggunakan alamat email{' '}
                                                <strong className="text-slate-900">
                                                    {transfer.recipientEmail}
                                                </strong>
                                                , lalu masukkan kode unik 6 karakter dari email undangan.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            onClick={() => {
                                                setAuthView('login');
                                                setIsAuthModalOpen(true);
                                            }}
                                        >
                                            Masuk ke Akun
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="md"
                                            onClick={() => {
                                                setAuthView('register');
                                                setIsAuthModalOpen(true);
                                            }}
                                        >
                                            Daftar Akun Baru
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isPending && auth?.user && !emailMatches && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle
                                            className="size-5 text-amber-600 shrink-0 mt-0.5"
                                            aria-hidden="true"
                                        />
                                        <div className="space-y-1">
                                            <h2 className="text-sm font-semibold text-amber-950">
                                                Alamat Email Akun Tidak Sesuai
                                            </h2>
                                            <p className="text-xs text-amber-900/90 leading-relaxed">
                                                Saat ini Anda masuk sebagai{' '}
                                                <strong>{auth.user.email}</strong>, sedangkan transfer tiket ini ditujukan khusus untuk{' '}
                                                <strong>{transfer.recipientEmail}</strong>. Silakan keluar dan masuk dengan akun yang sesuai.
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleSwitchAccount}>
                                        <LogOut className="size-3.5" aria-hidden="true" />
                                        <span>Keluar &amp; Ganti Akun</span>
                                    </Button>
                                </div>
                            )}

                            {isPending && auth?.user && emailMatches && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="transfer-unique-code"
                                            className="block text-xs font-medium text-slate-700 mb-1.5"
                                        >
                                            Masukkan Kode Unik Transfer (6 Karakter){' '}
                                            <span className="text-rose-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <KeyRound
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <input
                                                id="transfer-unique-code"
                                                type="text"
                                                maxLength={6}
                                                autoComplete="off"
                                                spellCheck={false}
                                                required
                                                value={acceptForm.data.code}
                                                onChange={(e) =>
                                                    acceptForm.setData(
                                                        'code',
                                                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                                                    )
                                                }
                                                placeholder="Contoh: K7P9X2"
                                                className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-10 pr-4 font-mono text-lg font-bold tracking-[0.35em] uppercase text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                                            />
                                        </div>
                                        {acceptForm.errors.code && (
                                            <p role="alert" className="text-xs font-medium text-rose-600 mt-1.5">
                                                {acceptForm.errors.code}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1.5">
                                            Kode unik 6 karakter tersedia pada email undangan transfer. Maksimal {transfer.maxAttempts || 5} kali percobaan.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        loading={acceptForm.processing}
                                        className="w-full"
                                    >
                                        <Ticket className="size-4" aria-hidden="true" />
                                        <span>
                                            {acceptForm.processing
                                                ? 'Memverifikasi & Merotasi QR...'
                                                : 'Klaim E-Tiket Sekarang'}
                                        </span>
                                    </Button>

                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                        <ShieldCheck className="size-3.5 text-slate-400" aria-hidden="true" />
                                        <span>QR lama milik pengirim otomatis hangus setelah diklaim</span>
                                    </div>
                                </form>
                            )}
                        </div>
                    </Card>
                </main>

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    initialView={authView}
                />
            </div>
        </>
    );
}
