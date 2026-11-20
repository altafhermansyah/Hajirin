import { Head, Link } from '@inertiajs/react';
import Navbar from '../../Components/Navbar';
import {
    ArrowLeft, ArrowRight, CalendarDays, MapPin, Clock,
    Printer, ShieldCheck, Ticket, CheckCircle2,
    Building2, CreditCard, FileText, UserRound, Mail,
    Phone, Download, ExternalLink, Sparkles
} from 'lucide-react';

export default function OrderDetail({ auth, order = {}, event = {}, items = [] }) {
    const isPaid = order.status === 'PAID';

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    return (
        <>
            <Head title={`Detail Transaksi: ${order.orderReference || 'Pesanan'} — Hajirin`} />

            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col print:bg-white">
                {/* Navbar (disembunyikan saat print) */}
                <div className="print:hidden">
                    <Navbar auth={auth} />
                </div>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-10 space-y-6">
                    {/* Header Navigasi Kembali & Aksi Cetak */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <Link
                            href="/dashboard#pesanan"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-blue transition group"
                        >
                            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Kembali ke Riwayat Pesanan</span>
                        </Link>

                        <div className="flex items-center gap-2.5">
                            {order.hasTickets && isPaid && (
                                <Link
                                    href={`/my-tickets/${order.orderReference}`}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition"
                                >
                                    <Ticket className="size-3.5" />
                                    <span>Buka Halaman E-Tiket & QR</span>
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-gray-50 transition"
                            >
                                <Printer className="size-3.5" />
                                <span>Cetak Invoice</span>
                            </button>
                        </div>
                    </div>

                    {/* DOKUMEN INVOICE RESMI TRANSAKSI */}
                    <article className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6 sm:p-10 space-y-8">
                        {/* Header Invoice Resmi */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-8 w-auto" />
                                    <span className="text-xl font-bold tracking-tight text-navy">HAJIRIN</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Platform Event & Pemesanan Tiket Resmi</p>
                            </div>

                            <div className="sm:text-right space-y-1">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-700">
                                    <CheckCircle2 className="size-3.5" />
                                    {isPaid ? 'Pembayaran Berhasil — Lunas' : order.status}
                                </span>
                                <p className="font-mono text-sm font-extrabold text-navy pt-1">
                                    No. {order.orderReference}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                    Tanggal Transaksi: {order.createdAt}
                                </p>
                            </div>
                        </div>

                        {/* Informasi Acara & Pembeli */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card Informasi Event */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detail Acara</p>
                                <div className="flex items-start gap-3.5">
                                    <div className="size-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-gray-200 shadow-2xs">
                                        <img src={event.banner} alt={event.title} className="size-full object-cover" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-sm sm:text-base font-bold text-navy leading-snug">
                                            {event.title}
                                        </h2>
                                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                            <CalendarDays className="size-3.5 text-brand-blue shrink-0" />
                                            {event.dateFormatted}
                                        </p>
                                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-brand-blue shrink-0" />
                                            {event.location}
                                        </p>
                                    </div>
                                </div>
                                {event.address && (
                                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">
                                        {event.address}
                                    </p>
                                )}
                            </div>

                            {/* Card Informasi Pembeli & Pembayaran */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detail Pembeli & Pembayaran</p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                                        <span className="text-slate-500">Nama Pembeli</span>
                                        <span className="font-bold text-slate-800">{order.buyerName}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                                        <span className="text-slate-500">Email Akun</span>
                                        <span className="font-semibold text-slate-800">{order.buyerEmail}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                                        <span className="text-slate-500">Metode Bayar</span>
                                        <span className="font-bold text-brand-blue uppercase">{order.paymentMethod}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Waktu Lunas</span>
                                        <span className="font-semibold text-emerald-700">{order.paidAt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Item Rincian Tiket */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-navy flex items-center gap-2">
                                <Ticket className="size-4 text-brand-blue" />
                                <span>Rincian Pembelian Tiket</span>
                            </p>

                            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Jenis Tiket</th>
                                            <th className="py-3 px-4 text-right">Harga Satuan</th>
                                            <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                                            <th className="py-3 px-4 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                                        {items.map((it) => (
                                            <tr key={it.id} className="hover:bg-gray-50/70 transition">
                                                <td className="py-3.5 px-4 font-bold text-navy">
                                                    {it.ticketName}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {it.formattedUnitPrice}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                                                        {it.quantity} Tiket
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-navy">
                                                    {it.formattedSubtotal}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Ringkasan Perhitungan Pembayaran */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4 border-t border-gray-100">
                            <div className="space-y-1 text-xs text-slate-500 max-w-sm">
                                <p className="font-semibold text-slate-700">Catatan Transaksi:</p>
                                <p className="leading-relaxed">
                                    Transaksi ini sah dan dilindungi oleh sistem keamanan Hajirin. Pembayaran telah diverifikasi secara instan.
                                </p>
                            </div>

                            <div className="w-full sm:w-80 rounded-2xl bg-slate-50 p-5 border border-slate-200/80 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Total Item Tiket:</span>
                                    <span className="font-bold text-slate-800">{order.totalTickets} Tiket</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Biaya Layanan & Admin:</span>
                                    <span className="font-semibold text-emerald-600">Gratis (Rp0)</span>
                                </div>
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm">
                                    <span className="font-extrabold text-navy">Total Bayar:</span>
                                    <span className="font-extrabold text-lg text-brand-blue">
                                        {order.formattedTotalAmount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Bawah */}
                        {order.hasTickets && isPaid && (
                            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                                <p className="text-xs text-slate-500">
                                    Tiket sudah siap digunakan. Klik tombol untuk melihat kode QR masing-masing tiket.
                                </p>

                                <Link
                                    href={`/my-tickets/${order.orderReference}`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-800 transition"
                                >
                                    <Ticket className="size-4" />
                                    <span>Lihat E-Tiket & Scan QR ({order.totalTickets} Tiket)</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        )}
                    </article>
                </main>
            </div>
        </>
    );
}

