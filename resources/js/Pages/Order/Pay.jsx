import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Navbar from '../../Components/Navbar';
import QrCodeSvg from '../../Components/QrCodeSvg';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    MapPin,
    QrCode,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';

function formatTimer(secondsLeft) {
    const safe = Math.max(0, secondsLeft);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function OrderPay({
    auth,
    order = {},
    event = {},
    items = [],
    payment = {},
    serverNowIso = null,
}) {
    const { flash } = usePage().props;
    const [copiedKey, setCopiedKey] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [clockOffsetMs] = useState(() => {
        if (!serverNowIso) return 0;
        const serverMs = Date.parse(serverNowIso);
        return Number.isNaN(serverMs) ? 0 : serverMs - Date.now();
    });

    const expiresAtMs = order.expiresAtIso ? Date.parse(order.expiresAtIso) : null;

    const [secondsLeft, setSecondsLeft] = useState(() => {
        if (!expiresAtMs || Number.isNaN(expiresAtMs)) return 0;
        return Math.max(0, Math.floor((expiresAtMs - (Date.now() + clockOffsetMs)) / 1000));
    });

    const isPending = order.status === 'PENDING' && secondsLeft > 0;
    const isExpired = order.status === 'EXPIRED' || (order.status === 'PENDING' && secondsLeft <= 0);
    const isCancelled = order.status === 'CANCELLED';

    useEffect(() => {
        if (order.status !== 'PENDING' || !expiresAtMs) return undefined;

        const tick = () => {
            const diff = Math.max(0, Math.floor((expiresAtMs - (Date.now() + clockOffsetMs)) / 1000));
            setSecondsLeft(diff);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [order.status, expiresAtMs, clockOffsetMs]);

    const handleCopy = (value, key) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(String(value));
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2200);
        }
    };

    const handleConfirmDemoPayment = () => {
        if (!isPending || isConfirming) return;
        setIsConfirming(true);
        router.post(
            `/orders/${order.orderReference}/confirm-payment`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsConfirming(false),
            }
        );
    };

    const handleCancelOrder = () => {
        if (!isPending || isCancelling) return;
        setIsCancelling(true);
        router.post(
            `/orders/${order.orderReference}/cancel`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsCancelling(false),
            }
        );
    };

    const methodMeta = {
        QRIS: {
            label: 'QRIS Instan',
            icon: QrCode,
            subtitle: 'Pindai QRIS menggunakan GoPay, OVO, DANA, ShopeePay, atau Mobile Banking.',
        },
        BANK_TRANSFER: {
            label: 'Transfer Virtual Account',
            icon: Building2,
            subtitle: 'Transfer tepat sesuai nominal ke Nomor Virtual Account di bawah ini.',
        },
        CARD: {
            label: 'Kartu Debit / Kredit (3D Secure)',
            icon: CreditCard,
            subtitle: 'Simulasi otorisasi 3D Secure tanpa menyimpan informasi nomor kartu.',
        },
    }[payment.method] || {
        label: payment.method || 'Pembayaran',
        icon: CreditCard,
        subtitle: 'Selesaikan pembayaran sebelum batas waktu berakhir.',
    };

    const MethodIcon = methodMeta.icon;

    return (
        <>
            <Head title={`Pembayaran ${order.orderReference || ''} - Hajirin`} />

            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
                <Navbar auth={auth} />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/dashboard#pesanan"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            <span>Kembali ke Riwayat Pesanan</span>
                        </Link>
                        <NeutralTag className="font-mono">{order.orderReference}</NeutralTag>
                    </div>

                    {flash?.success && <FlashBanner tone="success" message={flash.success} />}
                    {flash?.error && <FlashBanner tone="error" message={flash.error} />}

                    {/* Countdown / Status Header */}
                    {isPending ? (
                        <Card className="p-5 border-amber-200 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-600">
                                    <Clock className="size-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-950">
                                        Selesaikan Pembayaran Sebelum Batas Waktu Berakhir
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-900/80">
                                        Kuota tiket Anda sedang ditahan hingga{' '}
                                        <span className="font-semibold">{order.expiresAtFormatted}</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-center sm:text-right">
                                <p className="text-[11px] font-medium text-amber-700">Sisa Waktu</p>
                                <p className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                                    {formatTimer(secondsLeft)}
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-6 border-rose-200 bg-rose-50/70 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                                    {isCancelled ? (
                                        <XCircle className="size-5" aria-hidden="true" />
                                    ) : (
                                        <AlertTriangle className="size-5" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-base font-semibold text-rose-950">
                                        {isCancelled
                                            ? 'Pesanan Telah Dibatalkan'
                                            : 'Batas Waktu Pembayaran Telah Habis'}
                                    </h1>
                                    <p className="text-xs text-rose-900/80 leading-relaxed">
                                        {isCancelled
                                            ? 'Pesanan ini telah Anda batalkan dan seluruh kuota tiket telah dikembalikan.'
                                            : 'Waktu pembayaran 15 menit telah berakhir. Kuota tiket otomatis dikembalikan agar dapat dipesan kembali.'}
                                    </p>
                                    <div className="pt-2 flex flex-wrap gap-2">
                                        <Link
                                            href={`/event/${event.slug}`}
                                            className={buttonClass('primary', 'sm')}
                                        >
                                            Pesan Ulang Tiket Event
                                        </Link>
                                        <Link
                                            href="/dashboard#pesanan"
                                            className={buttonClass('outline', 'sm')}
                                        >
                                            Lihat Riwayat Pesanan
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Kiri: Instruksi Pembayaran Sesuai Metode */}
                        <div className="lg:col-span-7 space-y-5">
                            <Card className="p-6 space-y-5">
                                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-brand-blue shrink-0">
                                            <MethodIcon className="size-5" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h1 className="text-base font-semibold text-slate-900">
                                                {methodMeta.label}
                                            </h1>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {methodMeta.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge
                                        tone={isPending ? 'warning' : 'danger'}
                                        label={isPending ? 'Menunggu Pembayaran' : order.status}
                                    />
                                </div>

                                {/* Nominal Tagihan */}
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Total Tagihan</p>
                                        <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                                            {order.formattedTotalAmount}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(order.totalAmount, 'amount')}
                                    >
                                        {copiedKey === 'amount' ? (
                                            <>
                                                <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                                                <span>Disalin</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3.5 text-slate-500" aria-hidden="true" />
                                                <span>Salin Nominal</span>
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Detail Per Metode */}
                                {payment.method === 'QRIS' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center text-center space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                            <span>QRIS</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{payment.merchantName}</span>
                                        </div>
                                        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                                            <QrCodeSvg value={payment.qrisPayload} className="size-48" />
                                        </div>
                                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                                            Buka aplikasi GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin&apos; by Mandiri, atau BRImo lalu pindai kode QR di atas.
                                        </p>
                                    </div>
                                )}

                                {payment.method === 'BANK_TRANSFER' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Nomor Virtual Account (Otomatis)
                                                </p>
                                                <p className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-900 mt-1 select-all">
                                                    {payment.vaNumber}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy(payment.vaNumber, 'va')}
                                            >
                                                {copiedKey === 'va' ? (
                                                    <>
                                                        <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                                                        <span>Tersalin</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="size-3.5 text-slate-500" aria-hidden="true" />
                                                        <span>Salin Nomor VA</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(payment.vaBanks || []).map((bank) => (
                                                <NeutralTag key={bank}>{bank}</NeutralTag>
                                            ))}
                                        </div>
                                        <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                                            <li>Buka aplikasi Mobile Banking atau ATM pilihan Anda.</li>
                                            <li>Pilih menu Transfer &rarr; Virtual Account Billing.</li>
                                            <li>Masukkan nomor Virtual Account <span className="font-mono font-semibold">{payment.vaNumber}</span> dan pastikan nominal sesuai ({order.formattedTotalAmount}).</li>
                                            <li>Konfirmasi pembayaran, lalu tekan tombol simulasi di bawah untuk demo verifikasi instan.</li>
                                        </ol>
                                    </div>
                                )}

                                {payment.method === 'CARD' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Gateway Otorisasi</span>
                                            <span className="font-semibold text-slate-900">
                                                Hajirin 3D Secure Sandbox
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Referensi Otorisasi</span>
                                            <span className="font-mono font-semibold text-slate-900">
                                                {payment.cardAuthRef}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Jaringan Didukung</span>
                                            <span className="font-medium text-slate-900">
                                                Visa • Mastercard • JCB
                                            </span>
                                        </div>
                                        <p className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 leading-relaxed">
                                            Mode simulasi demo tidak meminta maupun menyimpan nomor kartu atau CVV asli. Klik tombol di bawah untuk mensimulasikan verifikasi 3D Secure berhasil.
                                        </p>
                                    </div>
                                )}

                                {/* Tombol Aksi Demo Pembayaran */}
                                {isPending && (
                                    <div className="pt-2 space-y-3 border-t border-slate-100">
                                        <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 px-3.5 py-2.5 text-xs text-blue-900 leading-relaxed">
                                            <strong>Mode Simulasi Demo:</strong> Klik tombol di bawah untuk memicu konfirmasi pembayaran sukses, mengubah status pesanan menjadi <strong>PAID</strong>, menerbitkan e-tiket &amp; QR code, serta mengirim email konfirmasi.
                                        </div>

                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="lg"
                                            loading={isConfirming}
                                            disabled={!isPending || isCancelling}
                                            onClick={handleConfirmDemoPayment}
                                            className="w-full"
                                        >
                                            <CheckCircle2 className="size-4" aria-hidden="true" />
                                            <span>
                                                {isConfirming
                                                    ? 'Memverifikasi Pembayaran...'
                                                    : 'Selesaikan Pembayaran (Simulasi Demo)'}
                                            </span>
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger-outline"
                                            size="md"
                                            loading={isCancelling}
                                            disabled={!isPending || isConfirming}
                                            onClick={handleCancelOrder}
                                            className="w-full"
                                        >
                                            <span>Batalkan Pesanan &amp; Kembalikan Kuota</span>
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Kanan: Ringkasan Pesanan */}
                        <div className="lg:col-span-5">
                            <Card className="p-6 space-y-4">
                                <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
                                    Ringkasan Pesanan
                                </h2>

                                <div className="flex gap-3">
                                    <img
                                        src={event.banner}
                                        alt={event.title}
                                        className="size-16 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0 space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 tabular-nums">
                                            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                                            <span className="truncate">{event.dateFormatted}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                            <span className="truncate">{event.location}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="border-y border-slate-100 py-3 space-y-2 text-xs">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-2">
                                            <span className="text-slate-600">
                                                {item.ticketName} ({item.quantity}x)
                                            </span>
                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                {item.formattedSubtotal}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <dl className="space-y-1.5 text-xs">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Referensi Bayar</dt>
                                        <dd className="font-mono text-slate-800">{payment.paymentReference}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Pemesan</dt>
                                        <dd className="font-medium text-slate-900">{order.attendeeName}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Email Tiket</dt>
                                        <dd className="text-slate-700 truncate">{order.attendeeEmail}</dd>
                                    </div>
                                </dl>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                    <ShieldCheck className="size-3.5 text-slate-400" aria-hidden="true" />
                                    <span>Transaksi dilindungi idempotency key &amp; kuota terkunci</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
