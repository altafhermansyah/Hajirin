import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import QrCodeSvg from '../../Components/QrCodeSvg';
import Navbar from '../../Components/Navbar';
import {
    ShieldCheck, CreditCard, QrCode, Building2,
    ArrowLeft, CheckCircle2, AlertCircle, Ticket,
    CalendarDays, MapPin, Clock, Loader2,
    Copy, Check, Sparkles, Search, LogOut
} from 'lucide-react';

export default function Checkout({
    auth,
    event,
    ticket,
    ticketTypes = [],
    initialQuantity = 1,
    formatted_total_amount = 'Rp0',
    total_amount = 0,
    orderSuccess = null,
}) {
    const [copiedCode, setCopiedCode] = useState(null);

    // Siapkan daftar item tiket jika ada pilihan multi-tiket
    const activeItems = (ticketTypes || []).filter((t) => (t.selected_quantity || 0) > 0);
    const defaultItems = activeItems.length > 0 ? activeItems.map((t) => ({
        ticket_type_id: t.id,
        ticket_price_id: t.price_id || '',
        name: t.name,
        unit_price: t.unit_price,
        quantity: t.selected_quantity,
    })) : [
        {
            ticket_type_id: ticket?.id || '',
            ticket_price_id: ticket?.price_id || '',
            name: ticket?.name || 'Tiket',
            unit_price: ticket?.unit_price || 0,
            quantity: initialQuantity,
        },
    ];

    const computedTotalAmount = defaultItems.reduce((acc, it) => acc + ((it.unit_price || 0) * (it.quantity || 0)), 0);
    const computedTotalQty = defaultItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

    // Inertia form
    const { data, setData, post, processing, errors } = useForm({
        event_id: event?.id || '',
        items: defaultItems,
        ticket_type_id: defaultItems[0]?.ticket_type_id || '',
        ticket_price_id: defaultItems[0]?.ticket_price_id || '',
        quantity: computedTotalQty,
        payment_method: 'qris',
        attendee_name: auth?.user?.name || '',
        attendee_email: auth?.user?.email || '',
        attendee_phone: auth?.user?.phone || '',
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

    // Tampilan Berhasil / Sukses Pembayaran:
    // Menampilkan CUMAN 1 TIKET DOANG sesuai dengan event yang dibeli (meskipun membeli 2 atau 100 tiket)
    if (orderSuccess) {
        const primaryCode = orderSuccess.primary_ticket_code || orderSuccess.tickets?.[0]?.code || orderSuccess.order_reference;

        return (
            <div className="bg-[#f8fafc] min-h-screen font-sans text-navy flex flex-col">
                <Head title="Pemesanan Tiket Berhasil - Hajirin" />
                <Navbar auth={auth} />

                <div className="flex-1 flex items-center justify-center py-12 px-4">
                    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-xl w-full text-center animate-scale-up">
                    <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <CheckCircle2 className="size-12" />
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
                        <Sparkles className="size-3.5" /> Pembayaran Berhasil & E-Tiket Aktif
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Terima Kasih, Pesananmu Berhasil!</h1>
                    <p className="text-slate text-sm max-w-md mx-auto mb-6">
                        E-tiket resmi untuk acara <span className="font-semibold text-navy">{orderSuccess.event_title}</span> telah diterbitkan dan tersimpan di akun Hajirin kamu.
                    </p>

                    {/* TAMPILAN CUMAN 1 E-TIKET RESMI SESUAI EVENT */}
                    <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50/70 to-white p-6 text-left shadow-sm mb-6">
                        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                                <Ticket className="size-4" /> E-Tiket Resmi Hajirin
                            </span>
                            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                                Total {orderSuccess.quantity} Tiket Masuk
                            </span>
                        </div>

                        <div className="py-4">
                            <h3 className="text-lg font-bold text-navy leading-snug">{orderSuccess.event_title}</h3>
                            <p className="text-xs text-slate mt-1.5 flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 text-slate-400 shrink-0" />
                                <span>{orderSuccess.event_date}</span>
                            </p>
                            <p className="text-xs text-slate mt-1 flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-slate-400 shrink-0" />
                                <span>{orderSuccess.event_location}</span>
                            </p>
                            <div className="mt-3 rounded-lg bg-white p-3 border border-blue-100 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate">Jenis Tiket:</span>
                                    <span className="font-bold text-navy">{orderSuccess.ticket_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate">Nama Pemesan:</span>
                                    <span className="font-semibold text-navy">{orderSuccess.tickets?.[0]?.attendee_name || auth?.user?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate">Nomor Pesanan:</span>
                                    <span className="font-mono font-semibold text-brand-blue">{orderSuccess.order_reference}</span>
                                </div>
                            </div>
                        </div>

                        {/* 1 QR Code & Kode Tiket Utama */}
                        <div className="pt-3 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl border border-blue-200 shadow-2xs shrink-0">
                                    <QrCodeSvg value={primaryCode} className="size-16" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate">Kode E-Tiket</p>
                                    <p className="font-mono text-sm font-extrabold text-brand-blue">{primaryCode}</p>
                                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">✓ Siap discan di lokasi acara</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCopyCode(primaryCode)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-lg transition shrink-0"
                            >
                                {copiedCode === primaryCode ? (
                                    <>
                                        <Check className="size-3.5 text-emerald-600" />
                                        <span className="text-emerald-600">Disalin</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3.5" />
                                        <span>Salin Kode</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {orderSuccess.quantity > 1 && (
                            <p className="mt-4 text-[11px] text-blue-800 bg-blue-100/70 p-2.5 rounded-xl text-center font-medium">
                                ℹ️ E-tiket ini berlaku untuk {orderSuccess.quantity} orang peserta sekaligus. Cukup tunjukkan 1 e-tiket ini saat registrasi di venue.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Link
                            href={`/my-tickets/${orderSuccess.order_reference}`}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue text-white font-bold rounded-xl text-sm shadow-md hover:bg-blue-800 transition"
                        >
                            <Ticket className="size-4" />
                            <span>Buka Halaman Detail E-Tiket & Scan QR</span>
                        </Link>
                        <div className="flex gap-2">
                            <Link
                                href={`/orders/${orderSuccess.order_reference}`}
                                className="flex-1 py-2.5 border border-gray-200 text-slate font-semibold rounded-xl text-xs hover:bg-gray-50 transition text-center"
                            >
                                Lihat Invoice Transaksi
                            </Link>
                            <Link
                                href="/dashboard#tiket"
                                className="flex-1 py-2.5 border border-gray-200 text-slate font-semibold rounded-xl text-xs hover:bg-gray-50 transition text-center"
                            >
                                Dashboard Tiket
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="w-full block py-2.5 border border-dashed border-gray-200 text-slate font-semibold rounded-xl text-xs hover:bg-gray-50 transition"
                        >
                            Cetak / Simpan Halaman Tiket
                        </button>
                        <Link
                            href="/"
                            className="w-full block py-2 text-slate text-xs hover:text-brand-blue transition font-medium"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`Checkout ${event?.title || 'Tiket'} - Hajirin`} />

            <div className="bg-[#f8fafc] text-navy font-sans min-h-screen pb-20">
                <Navbar auth={auth} />

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
                                                Nomor WhatsApp / HP (Hanya Angka) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={data.attendee_phone}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/\D/g, '');
                                                    setData('attendee_phone', numericValue);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        !/[0-9]/.test(e.key) &&
                                                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                placeholder="Contoh: 081234567890"
                                                required
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
                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${data.payment_method === 'qris'
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

                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${data.payment_method === 'transfer'
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

                                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${data.payment_method === 'card'
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

                                <div className="space-y-3 text-xs text-slate py-4 border-y border-gray-100 mb-4">
                                    {data.items && data.items.length > 0 ? (
                                        data.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-b-0 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-navy">{item.name}</p>
                                                    <p className="text-[11px] text-slate">
                                                        {item.quantity}x @ {item.unit_price > 0 ? `Rp${Number(item.unit_price).toLocaleString('id-ID')}` : 'Gratis'}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-navy text-sm">
                                                    {(item.unit_price * item.quantity) > 0 ? `Rp${Number(item.unit_price * item.quantity).toLocaleString('id-ID')}` : 'Gratis'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-navy">{ticket?.name}</p>
                                                <p className="text-[11px] text-slate">{data.quantity}x @ {ticket?.formatted_unit_price}</p>
                                            </div>
                                            <span className="font-bold text-navy text-sm">
                                                {formatted_total_amount}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-gray-100">
                                        <span>Biaya Layanan Platform</span>
                                        <span className="font-bold text-emerald-600">Gratis (Rp0)</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-baseline mb-6">
                                    <span className="text-sm font-bold text-navy">Total Pembayaran</span>
                                    <span className="text-2xl font-extrabold text-brand-blue">
                                        {computedTotalAmount > 0 ? `Rp${Number(computedTotalAmount).toLocaleString('id-ID')}` : (formatted_total_amount || 'Gratis')}
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
                                        <span>Bayar & Terbitkan Tiket</span>
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
