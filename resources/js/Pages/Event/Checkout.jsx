import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShieldCheck, CreditCard, QrCode, Building2,
    ArrowLeft, CheckCircle2, AlertCircle, Ticket,
    CalendarDays, MapPin, Clock, ArrowRight, Loader2,
    Copy, Check, Sparkles
} from 'lucide-react';

export default function Checkout({
    auth,
    event,
    ticket,
    initialQuantity = 1,
    formatted_total_amount = 'Rp0',
    total_amount = 0,
    orderSuccess = null,
}) {
    const [copiedCode, setCopiedCode] = useState(null);

    // Inertia form
    const { data, setData, post, processing, errors } = useForm({
        event_id: event?.id || '',
        ticket_type_id: ticket?.id || '',
        ticket_price_id: ticket?.price_id || '',
        quantity: initialQuantity,
        payment_method: 'qris',
        attendee_name: auth?.user?.name || '',
        attendee_email: auth?.user?.email || '',
        attendee_phone: '',
    });

    const handleCopyCode = (code) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2500);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/checkout', {
            preserveScroll: true,
        });
    };

    // Tampilan Berhasil / Sukses Pembayaran
    if (orderSuccess) {
        return (
            <div className="bg-[#f8fafc] min-h-screen py-12 px-4 font-sans text-navy flex items-center justify-center">
                <Head title="Pemesanan Tiket Berhasil - Hajirin" />

                <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-xl w-full text-center animate-scale-up">
                    <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <CheckCircle2 className="size-12" />
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
                        <Sparkles className="size-3.5" /> Pembayaran Berhasil & E-Tiket Aktif
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Terima Kasih, Pesananmu Berhasil!</h1>
                    <p className="text-slate text-sm max-w-md mx-auto mb-6">
                        E-tiket untuk acara <span className="font-semibold text-navy">{orderSuccess.event_title}</span> telah diterbitkan dan tersimpan di akun Hajirin kamu.
                    </p>

                    {/* Ringkasan Kode Pesanan */}
                    <div className="bg-slate-50 rounded-2xl p-5 text-left text-xs text-slate space-y-3 mb-6 border border-slate-100">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="font-medium text-slate">Nomor Referensi Pesanan:</span>
                            <span className="font-mono font-bold text-sm text-brand-blue">{orderSuccess.order_reference}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Kategori Tiket:</span>
                            <span className="font-bold text-navy">{orderSuccess.ticket_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Jumlah Tiket:</span>
                            <span className="font-bold text-navy">{orderSuccess.quantity} Tiket</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Total Dibayar:</span>
                            <span className="font-bold text-emerald-700 text-sm">{orderSuccess.total_amount}</span>
                        </div>
                    </div>

                    {/* Daftar Tiket yang Diterbitkan */}
                    {orderSuccess.tickets && orderSuccess.tickets.length > 0 && (
                        <div className="mb-8 text-left">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate mb-3">Kode E-Tiket Kamu</p>
                            <div className="space-y-2">
                                {orderSuccess.tickets.map((t, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 bg-blue-50/50"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-lg bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-xs">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-mono font-bold text-sm text-navy">{t.code}</p>
                                                <p className="text-[11px] text-slate">{t.attendee_name}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(t.code)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg transition shadow-2xs"
                                        >
                                            {copiedCode === t.code ? (
                                                <>
                                                    <Check className="size-3 text-emerald-600" />
                                                    <span className="text-emerald-600">Disalin</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3" />
                                                    <span>Salin</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Link
                            href="/dashboard"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-800 transition"
                        >
                            <Ticket className="size-4" />
                            <span>Buka E-Tiket di Dashboard</span>
                        </Link>
                        <Link
                            href="/"
                            className="w-full block py-3 border border-gray-200 text-slate font-semibold rounded-xl text-xs hover:bg-gray-50 transition"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`Checkout ${event?.title || 'Tiket'} - Hajirin`} />

            <div className="bg-[#f8fafc] text-navy font-sans min-h-screen pb-20">
                {/* Navbar */}
                <nav className="bg-white border-b border-gray-100 px-4 py-4 sm:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/hajirin_icon.svg" alt="Logo Hajirin" className="h-8 w-auto" />
                        <span className="text-2xl font-bold tracking-tighter text-navy">HAJIRIN</span>
                    </Link>
                    <div className="flex items-center text-xs font-medium text-slate bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <ShieldCheck className="size-4 text-emerald-600 mr-1.5 shrink-0" />
                        <span>Transaksi Aman & Terenkripsi</span>
                    </div>
                </nav>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    <Link
                        href={`/event/${event?.slug || ''}`}
                        className="inline-flex items-center text-xs font-semibold text-slate hover:text-brand-blue mb-6 transition"
                    >
                        <ArrowLeft className="mr-1.5 size-4" /> Kembali ke Detail Event
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Selesaikan Pemesanan Tiket</h1>
                        <p className="text-xs sm:text-sm text-slate mt-1">Lengkapi data pemesan dan pilih metode pembayaran resmi.</p>
                    </div>

                    {/* Global error message */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-start gap-3">
                            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">Gagal memproses pemesanan:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {Object.values(errors).map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Form Fields: 8 columns */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Data Pemesan */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs">
                                <h2 className="text-lg font-bold text-navy mb-4">Informasi Pemesan</h2>
                                <p className="text-xs text-slate mb-5">
                                    E-tiket digital dan invoice akan dikirimkan ke alamat email berikut.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate mb-1.5">
                                            Nama Lengkap (Sesuai KTP / Paspor) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.attendee_name}
                                            onChange={(e) => setData('attendee_name', e.target.value)}
                                            placeholder="Masukkan nama lengkap"
                                            required
                                            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                        />
                                        {errors.attendee_name && (
                                            <p className="text-xs text-red-600 mt-1">{errors.attendee_name}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate mb-1.5">
                                                Email Penerima Tiket <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={data.attendee_email}
                                                onChange={(e) => setData('attendee_email', e.target.value)}
                                                placeholder="nama@email.com"
                                                required
                                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                            />
                                            {errors.attendee_email && (
                                                <p className="text-xs text-red-600 mt-1">{errors.attendee_email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate mb-1.5">
                                                Nomor WhatsApp / HP
                                            </label>
                                            <input
                                                type="tel"
                                                value={data.attendee_phone}
                                                onChange={(e) => setData('attendee_phone', e.target.value)}
                                                placeholder="08123456789"
                                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                            />
                                            {errors.attendee_phone && (
                                                <p className="text-xs text-red-600 mt-1">{errors.attendee_phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pilihan Metode Pembayaran */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs">
                                <h2 className="text-lg font-bold text-navy mb-4">Pilih Metode Pembayaran</h2>
                                <p className="text-xs text-slate mb-5">
                                    Seluruh transaksi disimulasikan dan langsung terverifikasi secara instan.
                                </p>

                                <div className="space-y-3">
                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                                        data.payment_method === 'qris'
                                            ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/30 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}>
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-blue shrink-0 shadow-2xs">
                                                <QrCode className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-navy">QRIS Instan (GoPay, OVO, Dana, ShopeePay)</p>
                                                <p className="text-xs text-slate mt-0.5">Scan langsung barcode QRIS melalui aplikasi dompet digital</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={data.payment_method === 'qris'}
                                            onChange={() => setData('payment_method', 'qris')}
                                            className="accent-brand-blue size-4"
                                        />
                                    </label>

                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                                        data.payment_method === 'transfer'
                                            ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/30 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}>
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-blue shrink-0 shadow-2xs">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-navy">Transfer Virtual Account (BCA, Mandiri, BRI, BNI)</p>
                                                <p className="text-xs text-slate mt-0.5">Verifikasi otomatis tanpa perlu upload bukti transfer</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={data.payment_method === 'transfer'}
                                            onChange={() => setData('payment_method', 'transfer')}
                                            className="accent-brand-blue size-4"
                                        />
                                    </label>

                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                                        data.payment_method === 'card'
                                            ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/30 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}>
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-blue shrink-0 shadow-2xs">
                                                <CreditCard className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-navy">Kartu Debit / Kredit Online</p>
                                                <p className="text-xs text-slate mt-0.5">Mendukung jaringan Visa, Mastercard, dan JCB 3D Secure</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={data.payment_method === 'card'}
                                            onChange={() => setData('payment_method', 'card')}
                                            className="accent-brand-blue size-4"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary: 4 columns */}
                        <div className="lg:col-span-4 sticky top-24 space-y-4">
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg shadow-gray-200/50">
                                <h2 className="text-base font-bold text-navy mb-4 pb-3 border-b border-gray-100">
                                    Ringkasan Pesanan
                                </h2>

                                <div className="flex gap-3 mb-4">
                                    <img
                                        src={event?.image || '/images/events/tech_hero.jpg'}
                                        alt=""
                                        className="size-16 rounded-xl object-cover shrink-0 bg-gray-100"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-xs line-clamp-2 leading-snug text-navy">{event?.title}</h3>
                                        <p className="text-[11px] text-slate mt-1 flex items-center gap-1">
                                            <CalendarDays className="size-3 text-brand-blue shrink-0" />
                                            <span className="truncate">{event?.date}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs text-slate py-4 border-y border-gray-100 mb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-navy">{ticket?.name}</p>
                                            <p className="text-[11px] text-slate">{data.quantity}x @ {ticket?.formatted_unit_price}</p>
                                        </div>
                                        <span className="font-bold text-navy text-sm">
                                            {formatted_total_amount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span>Biaya Layanan Platform</span>
                                        <span className="font-bold text-emerald-600">Gratis (Rp0)</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-baseline mb-6">
                                    <span className="text-sm font-bold text-navy">Total Pembayaran</span>
                                    <span className="text-2xl font-extrabold text-brand-blue">
                                        {formatted_total_amount}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-800 disabled:opacity-50 transition duration-150"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Memproses Transaksi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Bayar & Terbitkan Tiket</span>
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate">
                                    <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                                    <span>Jaminan pemesanan tiket resmi dan aman</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
}
