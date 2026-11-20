import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '../../Components/Navbar';
import QrCodeSvg from '../../Components/QrCodeSvg';
import {
    ArrowLeft, CalendarDays, MapPin, Clock, Copy, Check,
    Printer, ShieldCheck, Ticket, Sparkles, Building2,
    Info, CheckCircle2, UserRound, Mail, Phone, ExternalLink
} from 'lucide-react';

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
            <Head title={`E-Tiket: ${event.title || 'Tiket Saya'} — Hajirin`} />

            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col print:bg-white">
                {/* Navbar (disembunyikan saat print) */}
                <div className="print:hidden">
                    <Navbar auth={auth} />
                </div>

                <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10 space-y-6">
                    {/* Header Navigasi Kembali & Aksi Cetak */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <Link
                            href="/dashboard#tiket"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-blue transition group"
                        >
                            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Kembali ke Tiket Saya</span>
                        </Link>

                        <div className="flex items-center gap-2.5">
                            <Link
                                href={`/orders/${order.orderReference}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-gray-50 transition"
                            >
                                <ExternalLink className="size-3.5" />
                                <span>Lihat Invoice Pesanan</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition"
                            >
                                <Printer className="size-3.5" />
                                <span>Cetak Semua Tiket</span>
                            </button>
                        </div>
                    </div>

                    {/* Banner Event Besar dengan Gambar Event Penuh */}
                    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl min-h-[220px] sm:min-h-[260px] flex flex-col justify-end p-6 sm:p-8">
                        {/* Gambar Event pada Kotak Besar */}
                        {event.banner && (
                            <img
                                src={event.banner}
                                alt={event.title}
                                className="absolute inset-0 size-full object-cover"
                            />
                        )}
                        {/* Lapisan overlay agar teks terbaca jelas dan elegan */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />

                        <div className="relative z-10 space-y-3 max-w-3xl">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug drop-shadow-sm">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-slate-200 font-medium pt-1">
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="size-4 text-blue-400 shrink-0" />
                                    {event.dateFormatted}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-4 text-blue-400 shrink-0" />
                                    {event.timeFormatted}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4 text-blue-400 shrink-0" />
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

                    {/* Instruksi Penggunaan Tiket */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-3 shadow-2xs print:hidden">
                        <Info className="size-5 text-brand-blue shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-brand-blue">Petunjuk Check-In E-Tiket</p>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Tunjukkan QR Code masing-masing tiket di bawah ini kepada petugas di meja registrasi / gerbang masuk.
                                Setiap tiket memiliki kode unik tersendiri untuk 1 orang pengunjung. Anda juga bisa menyalin kode tiket jika dibutuhkan.
                            </p>
                        </div>
                    </div>

                    {/* DAFTAR KARTU TIKET INDIVIDUAL (MULTI-TIKET DENGAN QR & SALIN KODE) */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-extrabold text-navy flex items-center gap-2">
                                <Ticket className="size-5 text-brand-blue" />
                                <span>Daftar E-Tiket Kamu ({tickets.length})</span>
                            </h2>
                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                                Total {tickets.length} Tiket
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {tickets.map((t) => {
                                const isCopied = copiedId === t.id;
                                const isActive = t.status === 'ACTIVE';

                                return (
                                    <div
                                        key={t.id}
                                        className="relative rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row transition hover:shadow-md"
                                    >
                                        {/* Bagian Kiri / Utama Tiket */}
                                        <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between space-y-5">
                                            {/* Badge Header Tiket */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-brand-blue">
                                                        Tiket #{t.ticketNumber} dari {tickets.length}
                                                    </span>
                                                    <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-extrabold text-indigo-700 uppercase">
                                                        {t.typeName}
                                                    </span>
                                                </div>

                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}>
                                                    <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                    {isActive ? 'Aktif — Siap Digunakan' : 'Sudah Digunakan'}
                                                </span>
                                            </div>

                                            {/* Data Pemegang & Event */}
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Acara</p>
                                                    <h3 className="text-base sm:text-lg font-bold text-navy mt-0.5">
                                                        {event.title}
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                    <div>
                                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pemegang Tiket</p>
                                                        <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                                            <UserRound className="size-3.5 text-brand-blue" />
                                                            {t.attendeeName}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="size-3 text-slate-400" />
                                                            {t.attendeeEmail}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Waktu & Lokasi</p>
                                                        <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                                            <CalendarDays className="size-3.5 text-brand-blue" />
                                                            {event.dateFormatted}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <MapPin className="size-3 text-slate-400" />
                                                            {event.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer Info Penyelenggara */}
                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-500">
                                                <span>Penyelenggara: <strong className="text-slate-700">{event.organizer}</strong></span>
                                                <span className="font-semibold text-brand-blue">{t.formattedPrice}</span>
                                            </div>
                                        </div>

                                        {/* Garis Perforasi / Pemotong Realistis (Khas E-Tiket Fisik) */}
                                        <div className="relative md:w-0 border-t md:border-t-0 md:border-l-2 border-dashed border-gray-300 flex items-center justify-center">
                                            {/* Setengah lingkaran cekung atas dan bawah untuk efek sobekan tiket */}
                                            <div className="hidden md:block absolute -top-3.5 left-1/2 -translate-x-1/2 size-7 rounded-full bg-[#f8fafc] border border-gray-300 print:bg-white" />
                                            <div className="hidden md:block absolute -bottom-3.5 left-1/2 -translate-x-1/2 size-7 rounded-full bg-[#f8fafc] border border-gray-300 print:bg-white" />
                                        </div>

                                        {/* Bagian Kanan: SCAN QR CODE & KODE TIKET + SALIN KODE */}
                                        <div className="w-full md:w-72 bg-gradient-to-b from-gray-50 to-white p-6 sm:p-7 flex flex-col items-center justify-center text-center space-y-4 border-t md:border-t-0 border-gray-100">
                                            {/* Container QR Code */}
                                            <div className="p-3 bg-white rounded-2xl border-2 border-brand-blue/30 shadow-md">
                                                <QrCodeSvg value={t.ticketCode} size={145} />
                                            </div>

                                            <p className="text-[11px] font-medium text-slate-500 leading-tight">
                                                Tunjukkan QR Code ini di meja registrasi event
                                            </p>

                                            {/* Box Kode Tiket & Tombol Salin Kode */}
                                            <div className="w-full space-y-2">
                                                <div className="bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kode E-Tiket</p>
                                                    <p className="font-mono text-xs sm:text-sm font-extrabold text-navy tracking-wider select-all">
                                                        {t.ticketCode}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(t.ticketCode, t.id)}
                                                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs ${
                                                        isCopied
                                                            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                                            : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="size-4 animate-scale" />
                                                            <span>Kode Berhasil Disalin!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-4 text-slate-500" />
                                                            <span>Salin Kode Tiket</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Syarat & Ketentuan Masuk */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-3 print:hidden">
                        <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                            <ShieldCheck className="size-4 text-brand-blue" />
                            <span>Ketentuan Penggunaan E-Tiket Hajirin</span>
                        </h4>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                            <li>E-Tiket ini merupakan bukti masuk sah yang diterbitkan resmi melalui sistem tiket Hajirin.</li>
                            <li>Setiap QR Code bersifat unik dan hanya berlaku untuk 1 (satu) kali pemindaian di pintu masuk.</li>
                            <li>Pastikan layar perangkat Anda memiliki kecerahan yang cukup saat melakukan pemindaian QR Code di lokasi.</li>
                            <li>Dilarang memperbanyak atau membagikan gambar QR Code tiket kepada pihak lain yang tidak berkepentingan untuk mencegah penyalahgunaan.</li>
                        </ul>
                    </section>
                </main>
            </div>
        </>
    );
}

