import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '../../Components/Navbar';
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
} from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';

export default function TicketDetail({ auth, order = {}, event = {}, tickets = [] }) {
    const [copiedId, setCopiedId] = useState(null);

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

    return (
        <>
            <Head title={`E-Tiket: ${event.title || 'Tiket Saya'} - Hajirin`} />

            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col print:bg-white">
                <div className="print:hidden">
                    <Navbar auth={auth} />
                </div>

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
                            <Link
                                href={`/orders/${order.orderReference}`}
                                className={buttonClass('outline', 'sm')}
                            >
                                <ExternalLink className="size-3.5 text-slate-500" aria-hidden="true" />
                                <span>Lihat Invoice Pesanan</span>
                            </Link>

                            <Button variant="primary" size="sm" onClick={handlePrint}>
                                <Printer className="size-3.5" aria-hidden="true" />
                                <span>Cetak Semua Tiket</span>
                            </Button>
                        </div>
                    </div>

                    {/* Event Banner */}
                    <section className="relative overflow-hidden rounded-xl bg-navy text-white min-h-[200px] sm:min-h-[240px] flex flex-col justify-end p-6 sm:p-8 border border-slate-200 print:border-slate-300">
                        {event.banner && (
                            <img
                                src={event.banner}
                                alt={event.title}
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

                    {/* Instruksi Check-in */}
                    <div className="print:hidden">
                        <FlashBanner
                            tone="info"
                            title="Petunjuk Check-In E-Tiket"
                            message="Tunjukkan QR Code masing-masing tiket di bawah ini kepada petugas di gerbang masuk. Setiap tiket memiliki kode unik untuk 1 orang pengunjung."
                        />
                    </div>

                    {/* Daftar E-Tiket */}
                    <section className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Ticket className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Daftar E-Tiket Kamu ({tickets.length})</span>
                            </h2>
                            <span className="text-xs text-slate-500 hidden sm:inline tabular-nums">
                                Total {tickets.length} tiket
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {tickets.map((t) => {
                                const isCopied = copiedId === t.id;
                                const isActive = t.status === 'ACTIVE';

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

                                                <StatusBadge
                                                    tone={isActive ? 'success' : 'neutral'}
                                                    label={
                                                        isActive
                                                            ? 'Aktif (Siap Digunakan)'
                                                            : 'Sudah Digunakan'
                                                    }
                                                />
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
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                <span>
                                                    Penyelenggara:{' '}
                                                    <strong className="font-medium text-slate-700">
                                                        {event.organizer}
                                                    </strong>
                                                </span>
                                                <span className="font-semibold text-slate-900 tabular-nums">
                                                    {t.formattedPrice}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Garis Perforasi Tiket */}
                                        <div className="relative md:w-0 border-t md:border-t-0 md:border-l border-dashed border-slate-300 flex items-center justify-center">
                                            <div className="hidden md:block absolute -top-3 left-1/2 -translate-x-1/2 size-6 rounded-full bg-slate-50 border border-slate-200 print:bg-white" />
                                            <div className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 size-6 rounded-full bg-slate-50 border border-slate-200 print:bg-white" />
                                        </div>

                                        {/* Kanan: QR Code & Kode Tiket */}
                                        <div className="w-full md:w-68 bg-slate-50/70 p-6 flex flex-col items-center justify-center text-center space-y-3.5 border-t md:border-t-0 border-slate-200">
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
                                Pastikan layar perangkat Anda memiliki kecerahan yang cukup saat melakukan pemindaian QR Code di lokasi.
                            </li>
                            <li>
                                Dilarang memperbanyak atau membagikan gambar QR Code tiket kepada pihak lain yang tidak berkepentingan.
                            </li>
                        </ul>
                    </Card>
                </main>
            </div>
        </>
    );
}
