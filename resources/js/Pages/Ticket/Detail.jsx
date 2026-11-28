import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';
import QrCodeSvg from '../../Components/QrCodeSvg';
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    Clock,
    Copy,
    Check,
    Printer,
    ShieldCheck,
    Ticket,
    UserRound,
    Mail,
    ExternalLink,
    Send,
    XCircle,
    Lock,
} from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';
import { Modal } from '../../Components/ui/Dialog';

const INPUT_CLASS =
    'w-full h-11 sm:h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function TicketDetail({ auth, order = {}, event = {}, tickets = [] }) {
    const { flash, errors: pageErrors } = usePage().props;
    const [copiedId, setCopiedId] = useState(null);
    const [transferTicket, setTransferTicket] = useState(null);
    const [cancellingTransferId, setCancellingTransferId] = useState(null);

    const transferForm = useForm({
        recipient_name: '',
        recipient_email: '',
    });

    const handleCopy = (code, id) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2500);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleOpenTransferModal = (ticket) => {
        transferForm.reset();
        transferForm.clearErrors();
        setTransferTicket(ticket);
    };

    const handleSubmitTransfer = (e) => {
        e.preventDefault();
        if (!transferTicket) return;

        transferForm.post(`/tickets/${transferTicket.id}/transfer`, {
            preserveScroll: true,
            onSuccess: () => {
                setTransferTicket(null);
                transferForm.reset();
            },
        });
    };

    const handleCancelTransfer = (transferId) => {
        setCancellingTransferId(transferId);
        router.delete(`/ticket-transfers/${transferId}`, {
            preserveScroll: true,
            onFinish: () => setCancellingTransferId(null),
        });
    };

    return (
        <>
            <Head title={`E-Tiket: ${event.title || 'Tiket Saya'} - Hajirin`} />

            <UserLayout
                auth={auth}
                className="bg-slate-50 text-slate-900 print:bg-white"
            >

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6"
                >
                    {/* Header Navigasi & Aksi Cetak */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <Link
                            href="/dashboard#tiket"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            <span>Kembali ke Tiket Saya</span>
                        </Link>

                        <div className="flex flex-wrap items-center gap-2">
                            {order.isOrderBuyer !== false && (
                                <Link
                                    href={`/orders/${order.orderReference}`}
                                    className={buttonClass('outline', 'sm')}
                                >
                                    <ExternalLink className="size-3.5 text-slate-500" aria-hidden="true" />
                                    <span>Lihat Invoice Pesanan</span>
                                </Link>
                            )}

                            <Button variant="primary" size="sm" onClick={handlePrint}>
                                <Printer className="size-3.5" aria-hidden="true" />
                                <span>Cetak Semua Tiket</span>
                            </Button>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="print:hidden">
                            <FlashBanner tone="success" message={flash.success} />
                        </div>
                    )}
                    {flash?.error && (
                        <div className="print:hidden">
                            <FlashBanner tone="error" message={flash.error} />
                        </div>
                    )}
                    {pageErrors?.transfer && (
                        <div className="print:hidden">
                            <FlashBanner tone="error" message={pageErrors.transfer} />
                        </div>
                    )}

                    {/* Event Banner */}
                    <section className="relative overflow-hidden rounded-xl bg-navy text-white min-h-[200px] sm:min-h-[240px] flex flex-col justify-end p-6 sm:p-8 border border-slate-200 print:border-slate-300">
                        {event.banner && (
                            <img
                                src={event.banner}
                                alt={event.title}
                                fetchPriority="high"
                                decoding="async"
                                className="absolute inset-0 size-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/35" />

                        <div className="relative z-10 space-y-2.5 max-w-3xl">
                            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs sm:text-sm text-slate-200 tabular-nums">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="size-4 text-slate-300 shrink-0" aria-hidden="true" />
                                    {event.dateFormatted}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-4 text-slate-300 shrink-0" aria-hidden="true" />
                                    {event.timeFormatted}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4 text-slate-300 shrink-0" aria-hidden="true" />
                                    {event.location} {event.city ? `(${event.city})` : ''}
                                </span>
                            </div>

                            {event.address && (
                                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                                    {event.address}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Tautan Akses Event Online (Hanya untuk pemegang tiket pesanan PAID) */}
                    {event.eventType === 'ONLINE' && event.onlineUrl && (
                        <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                    Tautan Akses Event Online
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600 truncate">
                                    {event.onlineUrl}
                                </p>
                            </div>
                            <a
                                href={event.onlineUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonClass('primary', 'md', 'shrink-0')}
                            >
                                <ExternalLink className="size-4" aria-hidden="true" />
                                <span>Buka Link Event</span>
                            </a>
                        </Card>
                    )}

                    {/* Instruksi Check-in */}
                    <div className="print:hidden">
                        <FlashBanner
                            tone="info"
                            title="Petunjuk Check-In & Transfer E-Tiket"
                            message="Tunjukkan QR Code masing-masing tiket di bawah ini kepada petugas di gerbang masuk. Tiket aktif juga dapat ditransfer ke email orang lain menggunakan kode unik 6 karakter."
                        />
                    </div>

                    {/* Daftar E-Tiket */}
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Ticket className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Daftar E-Tiket ({tickets.length})</span>
                            </h2>
                            <span className="text-xs text-slate-500 hidden sm:inline tabular-nums">
                                Total {tickets.length} tiket
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {tickets.map((t) => {
                                const isCopied = copiedId === t.id;
                                const isActive = t.status === 'ACTIVE' && !t.isTransferredOut;

                                return (
                                    <Card
                                        key={t.id}
                                        className="relative overflow-hidden flex flex-col md:flex-row break-inside-avoid"
                                    >
                                        {/* Kiri: Informasi Tiket */}
                                        <div className="flex-1 p-6 flex flex-col justify-between space-y-5">
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <NeutralTag className="tabular-nums">
                                                        Tiket #{t.ticketNumber} dari {tickets.length}
                                                    </NeutralTag>
                                                    <NeutralTag>{t.typeName}</NeutralTag>
                                                </div>

                                                {t.isTransferredOut ? (
                                                    <StatusBadge tone="neutral" label="Telah Ditransfer" />
                                                ) : t.pendingTransfer ? (
                                                    <StatusBadge tone="warning" label="Menunggu Klaim Transfer" />
                                                ) : (
                                                    <StatusBadge
                                                        tone={isActive ? 'success' : 'neutral'}
                                                        label={
                                                            isActive
                                                                ? 'Aktif (Siap Digunakan)'
                                                                : t.status === 'CANCELLED'
                                                                  ? 'Dibatalkan'
                                                                  : 'Sudah Digunakan'
                                                        }
                                                    />
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-xs text-slate-500">Nama Acara</p>
                                                    <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                                                        {event.title}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Pemegang Tiket
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5 mt-1">
                                                            <UserRound
                                                                className="size-3.5 text-slate-400 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{t.attendeeName}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <Mail
                                                                className="size-3.5 text-slate-400 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{t.attendeeEmail}</span>
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Waktu &amp; Lokasi
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5 mt-1 tabular-nums">
                                                            <CalendarDays
                                                                className="size-3.5 text-slate-400 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{event.dateFormatted}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <MapPin
                                                                className="size-3.5 text-slate-400 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{event.location}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Banner Status Transfer */}
                                                {t.pendingTransfer && (
                                                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                                                        <div className="text-xs text-amber-950 space-y-0.5">
                                                            <p className="font-semibold">
                                                                Menunggu klaim oleh {t.pendingTransfer.recipientName}
                                                            </p>
                                                            <p className="text-amber-900/80">
                                                                Undangan &amp; kode unik dikirim ke{' '}
                                                                <span className="font-medium">
                                                                    {t.pendingTransfer.recipientEmail}
                                                                </span>{' '}
                                                                (berlaku hingga {t.pendingTransfer.expiresAtFormatted}).
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="danger-outline"
                                                            size="sm"
                                                            loading={cancellingTransferId === t.pendingTransfer.id}
                                                            onClick={() => handleCancelTransfer(t.pendingTransfer.id)}
                                                            className="shrink-0"
                                                        >
                                                            <XCircle className="size-3.5" aria-hidden="true" />
                                                            <span>Batalkan Transfer</span>
                                                        </Button>
                                                    </div>
                                                )}

                                                {t.isTransferredOut && (
                                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed">
                                                        Tiket ini telah resmi dipindahkan ke{' '}
                                                        <strong className="text-slate-900">
                                                            {t.transferredToName}
                                                        </strong>{' '}
                                                        ({t.transferredToEmail}). Kode QR sebelumnya telah dinonaktifkan.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                                                <span>
                                                    Penyelenggara:{' '}
                                                    <strong className="font-medium text-slate-700">
                                                        {event.organizer}
                                                    </strong>
                                                </span>

                                                <div className="flex items-center gap-3">
                                                    {t.canTransfer && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="print:hidden"
                                                            onClick={() => handleOpenTransferModal(t)}
                                                        >
                                                            <Send className="size-3.5 text-brand-blue" aria-hidden="true" />
                                                            <span>Transfer Tiket</span>
                                                        </Button>
                                                    )}
                                                    <span className="font-semibold text-slate-900 tabular-nums">
                                                        {t.formattedPrice}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Garis Perforasi Tiket */}
                                        <div className="relative md:w-0 border-t md:border-t-0 md:border-l border-dashed border-slate-300 flex items-center justify-center">
                                            <div className="hidden md:block absolute -top-3 left-1/2 -translate-x-1/2 size-6 rounded-full bg-slate-50 border border-slate-200 print:bg-white" />
                                            <div className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 size-6 rounded-full bg-slate-50 border border-slate-200 print:bg-white" />
                                        </div>

                                        {/* Kanan: QR Code & Kode Tiket */}
                                        <div className="w-full md:w-68 bg-slate-50/70 p-6 flex flex-col items-center justify-center text-center space-y-3.5 border-t md:border-t-0 border-slate-200">
                                            {t.isTransferredOut ? (
                                                <div className="space-y-3 py-4">
                                                    <div className="mx-auto size-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <Lock className="size-7" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            QR Tidak Aktif
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                            Kepemilikan tiket telah berpindah ke penerima dengan QR code baru.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                                        <QrCodeSvg value={t.ticketCode} size={140} />
                                                    </div>

                                                    <p className="text-xs text-slate-500 leading-snug">
                                                        Tunjukkan QR Code ini di gerbang masuk
                                                    </p>

                                                    <div className="w-full space-y-2">
                                                        <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                                            <p className="text-xs text-slate-400">
                                                                Kode E-Tiket
                                                            </p>
                                                            <p className="font-mono text-xs sm:text-sm font-semibold text-slate-900 tracking-wider select-all">
                                                                {t.ticketCode}
                                                            </p>
                                                        </div>

                                                        <Button
                                                            variant={isCopied ? 'primary' : 'outline'}
                                                            size="sm"
                                                            className="w-full print:hidden"
                                                            onClick={() => handleCopy(t.ticketCode, t.id)}
                                                        >
                                                            {isCopied ? (
                                                                <>
                                                                    <Check className="size-3.5" aria-hidden="true" />
                                                                    <span>Kode Disalin</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy
                                                                        className="size-3.5 text-slate-500"
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span>Salin Kode Tiket</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* Ketentuan Penggunaan */}
                    <Card as="section" className="p-6 space-y-2.5 print:hidden">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="size-4 text-slate-400" aria-hidden="true" />
                            <span>Ketentuan Penggunaan E-Tiket Hajirin</span>
                        </h3>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                            <li>
                                E-Tiket ini merupakan bukti masuk sah yang diterbitkan resmi melalui sistem tiket Hajirin.
                            </li>
                            <li>
                                Setiap QR Code bersifat unik dan hanya berlaku untuk 1 (satu) kali pemindaian di pintu masuk.
                            </li>
                            <li>
                                Bila tiket ditransfer dan diklaim penerima, kode QR lama otomatis hangus dan kode QR baru diterbitkan untuk penerima.
                            </li>
                            <li>
                                Dilarang memperbanyak atau membagikan gambar QR Code tiket kepada pihak lain yang tidak berkepentingan.
                            </li>
                        </ul>
                    </Card>
                </main>
            </UserLayout>

            {/* Modal Transfer Tiket */}
            <Modal
                open={Boolean(transferTicket)}
                onClose={() => {
                    if (!transferForm.processing) setTransferTicket(null);
                }}
                title="Transfer E-Tiket ke Orang Lain"
                description="Masukkan nama dan alamat email penerima. Sistem akan mengirim tautan klaim serta kode unik 6 karakter ke email tersebut."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmitTransfer} className="space-y-4">
                    {transferTicket && (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1">
                            <p className="font-semibold text-slate-900">{event.title}</p>
                            <p className="text-slate-600">
                                {transferTicket.typeName} · Kode saat ini:{' '}
                                <span className="font-mono font-medium">{transferTicket.ticketCode}</span>
                            </p>
                        </div>
                    )}

                    <div className="rounded-lg bg-blue-50/70 border border-blue-200 px-3.5 py-2.5 text-xs text-blue-900 leading-relaxed">
                        Penerima tidak wajib memiliki akun saat undangan dikirim, tetapi <strong>wajib masuk / mendaftar akun Hajirin dengan email yang sama</strong> dan memasukkan kode unik 6 karakter saat mengklaim. QR lama otomatis dirotasi ke QR baru.
                    </div>

                    <div>
                        <label
                            htmlFor="transfer-recipient-name"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Nama Lengkap Penerima <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="transfer-recipient-name"
                            type="text"
                            required
                            maxLength={100}
                            value={transferForm.data.recipient_name}
                            onChange={(e) => transferForm.setData('recipient_name', e.target.value)}
                            placeholder="Contoh: Siti Rahmawati"
                            className={INPUT_CLASS}
                        />
                        {transferForm.errors.recipient_name && (
                            <p role="alert" className="text-xs text-rose-600 mt-1">
                                {transferForm.errors.recipient_name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="transfer-recipient-email"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Alamat Email Penerima <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="transfer-recipient-email"
                            type="email"
                            required
                            maxLength={255}
                            value={transferForm.data.recipient_email}
                            onChange={(e) => transferForm.setData('recipient_email', e.target.value)}
                            placeholder="penerima@email.com"
                            className={INPUT_CLASS}
                        />
                        {transferForm.errors.recipient_email && (
                            <p role="alert" className="text-xs text-rose-600 mt-1">
                                {transferForm.errors.recipient_email}
                            </p>
                        )}
                    </div>

                    {transferForm.errors.transfer && (
                        <p role="alert" className="text-xs text-rose-600 font-medium">
                            {transferForm.errors.transfer}
                        </p>
                    )}

                    <label
                        htmlFor="transfer-recipient-consent"
                        className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none leading-relaxed"
                    >
                        <input
                            id="transfer-recipient-consent"
                            type="checkbox"
                            required
                            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        />
                        <span>
                            Saya menyatakan memiliki izin dari pemilik alamat email di atas untuk mengirimkan undangan transfer e-tiket ini.
                        </span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={transferForm.processing}
                            onClick={() => setTransferTicket(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={transferForm.processing}
                        >
                            <Send className="size-3.5" aria-hidden="true" />
                            <span>Kirim Undangan Transfer</span>
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
