import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import QrCodeSvg from '../../Components/QrCodeSvg';
import Navbar from '../../Components/Navbar';
import {
    ShieldCheck,
    CreditCard,
    QrCode,
    Building2,
    ArrowLeft,
    CheckCircle2,
    Ticket,
    CalendarDays,
    MailWarning,
    MapPin,
    Copy,
    Check,
} from 'lucide-react';
import EmailVerificationModal from '../../Components/Auth/EmailVerificationModal';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';

const INPUT_CLASS =
    'w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function Checkout({
    auth,
    event,
    ticket,
    ticketTypes = [],
    initialQuantity = 1,
    formatted_total_amount = 'Rp0',
    idempotencyKey = '',
    orderSuccess = null,
}) {
    const [copiedCode, setCopiedCode] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const isEmailVerified = Boolean(auth?.user?.email_verified_at);

    const [clientIdempotencyKey] = useState(() => {
        if (idempotencyKey) return idempotencyKey;
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    });

    const activeItems = (ticketTypes || []).filter((t) => (t.selected_quantity || 0) > 0);
    const defaultItems =
        activeItems.length > 0
            ? activeItems.map((t) => ({
                  ticket_type_id: t.id,
                  ticket_price_id: t.price_id || '',
                  name: t.name,
                  unit_price: t.unit_price,
                  quantity: t.selected_quantity,
              }))
            : [
                  {
                      ticket_type_id: ticket?.id || '',
                      ticket_price_id: ticket?.price_id || '',
                      name: ticket?.name || 'Tiket',
                      unit_price: ticket?.unit_price || 0,
                      quantity: initialQuantity,
                  },
              ];

    const computedTotalAmount = defaultItems.reduce(
        (acc, it) => acc + (it.unit_price || 0) * (it.quantity || 0),
        0
    );
    const computedTotalQty = defaultItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

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
        idempotency_key: clientIdempotencyKey,
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
        if (!isEmailVerified) {
            setIsVerifyModalOpen(true);
            return;
        }
        post('/checkout', {
            preserveScroll: true,
        });
    };

    if (orderSuccess) {
        const primaryCode =
            orderSuccess.primary_ticket_code ||
            orderSuccess.tickets?.[0]?.code ||
            orderSuccess.order_reference;

        return (
            <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
                <Head title="Pemesanan Tiket Berhasil - Hajirin" />
                <div className="print:hidden">
                    <Navbar auth={auth} />
                </div>

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 flex items-center justify-center py-10 px-4"
                >
                    <Card className="p-6 sm:p-8 max-w-xl w-full space-y-6">
                        <div className="text-center space-y-2.5">
                            <div className="mx-auto size-12 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="size-6" aria-hidden="true" />
                            </div>
                            <div className="flex justify-center">
                                <StatusBadge
                                    tone="success"
                                    label="Pembayaran Berhasil & E-Tiket Aktif"
                                />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                                Pesanan Tiket Berhasil
                            </h1>
                            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                                E-tiket resmi untuk{' '}
                                <span className="font-medium text-slate-900">
                                    {orderSuccess.event_title}
                                </span>{' '}
                                telah diterbitkan dan tersimpan di akun Hajirin kamu.
                            </p>
                        </div>

                        {/* E-Tiket Utama */}
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-left space-y-4">
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                                <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                                    <Ticket className="size-4 text-slate-400" aria-hidden="true" />
                                    E-Tiket Resmi Hajirin
                                </span>
                                <NeutralTag className="tabular-nums">
                                    {orderSuccess.quantity} Tiket Masuk
                                </NeutralTag>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                                        {orderSuccess.event_title}
                                    </h2>
                                    <div className="mt-1.5 space-y-1 text-xs text-slate-600">
                                        <p className="flex items-center gap-1.5 tabular-nums">
                                            <CalendarDays
                                                className="size-3.5 text-slate-400 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>{orderSuccess.event_date}</span>
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <MapPin
                                                className="size-3.5 text-slate-400 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>{orderSuccess.event_location}</span>
                                        </p>
                                    </div>
                                </div>

                                <dl className="rounded-lg bg-white p-3 border border-slate-200 text-xs space-y-1.5">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Jenis Tiket</dt>
                                        <dd className="font-medium text-slate-900">
                                            {orderSuccess.ticket_name}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Nama Pemesan</dt>
                                        <dd className="font-medium text-slate-900">
                                            {orderSuccess.tickets?.[0]?.attendee_name ||
                                                auth?.user?.name}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">Nomor Pesanan</dt>
                                        <dd className="font-mono font-medium text-slate-900">
                                            {orderSuccess.order_reference}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                                        <QrCodeSvg value={primaryCode} className="size-16" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Kode E-Tiket</p>
                                        <p className="font-mono text-sm font-semibold text-slate-900">
                                            {primaryCode}
                                        </p>
                                        <div className="mt-1">
                                            <StatusBadge tone="success" label="Siap dipindai di venue" />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyCode(primaryCode)}
                                    className="shrink-0"
                                >
                                    {copiedCode === primaryCode ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                                            <span>Disalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5 text-slate-500" aria-hidden="true" />
                                            <span>Salin Kode</span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            {orderSuccess.quantity > 1 && (
                                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                                    E-tiket ini mencakup {orderSuccess.quantity} tiket dalam satu pesanan. Buka halaman detail e-tiket untuk melihat seluruh QR code masing-masing tiket.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2.5 print:hidden">
                            <Link
                                href={`/my-tickets/${orderSuccess.order_reference}`}
                                className={buttonClass('primary', 'lg', 'w-full')}
                            >
                                <Ticket className="size-4" aria-hidden="true" />
                                <span>Buka Detail E-Tiket & QR</span>
                            </Link>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Link
                                    href={`/orders/${orderSuccess.order_reference}`}
                                    className={buttonClass('outline', 'md', 'w-full')}
                                >
                                    Lihat Invoice Transaksi
                                </Link>
                                <Link
                                    href="/dashboard#tiket"
                                    className={buttonClass('outline', 'md', 'w-full')}
                                >
                                    Dashboard Tiket
                                </Link>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => window.print()}
                            >
                                Cetak / Simpan Halaman Tiket
                            </Button>
                            <div className="text-center pt-1">
                                <Link
                                    href="/"
                                    className="text-xs font-medium text-slate-500 hover:text-brand-blue transition"
                                >
                                    Kembali ke Beranda
                                </Link>
                            </div>
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    const paymentMethods = [
        {
            id: 'qris',
            icon: QrCode,
            title: 'QRIS Instan (GoPay, OVO, Dana, ShopeePay)',
            desc: 'Scan langsung kode QRIS melalui aplikasi dompet digital atau mobile banking',
        },
        {
            id: 'transfer',
            icon: Building2,
            title: 'Transfer Virtual Account (BCA, Mandiri, BRI, BNI)',
            desc: 'Verifikasi otomatis tanpa perlu mengunggah bukti transfer',
        },
        {
            id: 'card',
            icon: CreditCard,
            title: 'Kartu Debit / Kredit Online',
            desc: 'Mendukung jaringan Visa, Mastercard, dan JCB 3D Secure',
        },
    ];

    return (
        <>
            <Head title={`Checkout ${event?.title || 'Tiket'} - Hajirin`} />

            <div className="bg-slate-50 text-slate-900 font-sans min-h-screen pb-16">
                <Navbar auth={auth} />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-7"
                >
                    <Link
                        href={`/event/${event?.slug || ''}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-5 transition"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>Kembali ke Detail Event</span>
                    </Link>

                    <div className="mb-6">
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                            Selesaikan Pemesanan Tiket
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Lengkapi data pemesan dan pilih metode pembayaran.
                        </p>
                    </div>

                    {!isEmailVerified && (
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950">
                            <div className="flex items-start gap-3">
                                <MailWarning
                                    className="mt-0.5 size-5 shrink-0 text-amber-600"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-amber-950">
                                        Verifikasi email diperlukan sebelum checkout
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-900/80 leading-relaxed">
                                        Pastikan email akunmu ({auth?.user?.email}) sudah
                                        terverifikasi OTP 6 digit agar invoice dan e-tiket terkirim
                                        dengan aman.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                className="shrink-0 self-start sm:self-center"
                                onClick={() => setIsVerifyModalOpen(true)}
                            >
                                Verifikasi Email Sekarang
                            </Button>
                        </div>
                    )}

                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6">
                            <FlashBanner
                                tone="error"
                                title="Gagal memproses pemesanan"
                                message={Object.values(errors).join(' ')}
                            />
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
                    >
                        {/* Form Fields */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="p-6 sm:p-7">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Informasi Pemesan
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 mb-5">
                                    E-tiket digital dan invoice dikirimkan ke alamat email berikut.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="attendee-name"
                                            className="block text-xs font-medium text-slate-700 mb-1.5"
                                        >
                                            Nama Lengkap (Sesuai KTP / Paspor){' '}
                                            <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            id="attendee-name"
                                            type="text"
                                            value={data.attendee_name}
                                            onChange={(e) =>
                                                setData('attendee_name', e.target.value)
                                            }
                                            placeholder="Masukkan nama lengkap"
                                            required
                                            className={INPUT_CLASS}
                                        />
                                        {errors.attendee_name && (
                                            <p role="alert" className="text-xs text-rose-600 mt-1">
                                                {errors.attendee_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                htmlFor="attendee-email"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Email Penerima Tiket{' '}
                                                <span className="text-rose-600">*</span>
                                            </label>
                                            <input
                                                id="attendee-email"
                                                type="email"
                                                value={data.attendee_email}
                                                onChange={(e) =>
                                                    setData('attendee_email', e.target.value)
                                                }
                                                placeholder="nama@email.com"
                                                required
                                                className={INPUT_CLASS}
                                            />
                                            <p className="mt-1 text-xs text-slate-500">
                                                Bisa diubah ke email orang lain jika tiket dibelikan untuk rekan; e-tiket akan dikirim ke alamat ini.
                                            </p>
                                            {errors.attendee_email && (
                                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                                    {errors.attendee_email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="attendee-phone"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Nomor WhatsApp / HP{' '}
                                                <span className="text-rose-600">*</span>
                                            </label>
                                            <input
                                                id="attendee-phone"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={data.attendee_phone}
                                                onChange={(e) =>
                                                    setData(
                                                        'attendee_phone',
                                                        e.target.value.replace(/\D/g, '')
                                                    )
                                                }
                                                placeholder="Contoh: 081234567890"
                                                required
                                                className={INPUT_CLASS}
                                            />
                                            {errors.attendee_phone && (
                                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                                    {errors.attendee_phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Metode Pembayaran */}
                            <Card className="p-6 sm:p-7">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Pilih Metode Pembayaran
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 mb-5">
                                    {computedTotalAmount > 0
                                        ? 'Setelah klik lanjutkan, pesanan akan menahan kuota tiket selama 15 menit hingga pembayaran simulasi diselesaikan.'
                                        : 'Tiket gratis langsung diterbitkan secara instan setelah konfirmasi pemesanan.'}
                                </p>

                                <div className="space-y-3">
                                    {paymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const checked = data.payment_method === method.id;
                                        return (
                                            <label
                                                key={method.id}
                                                className={`flex items-center justify-between gap-3 p-4 rounded-xl border cursor-pointer transition ${
                                                    checked
                                                        ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue/30'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="size-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                                                        <Icon className="size-5" aria-hidden="true" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-slate-900">
                                                            {method.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {method.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    checked={checked}
                                                    onChange={() =>
                                                        setData('payment_method', method.id)
                                                    }
                                                    className="accent-brand-blue size-4 shrink-0"
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24">
                            <Card className="p-6">
                                <h2 className="text-base font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                                    Ringkasan Pesanan
                                </h2>

                                <div className="flex gap-3 mb-4">
                                    <img
                                        src={event?.image || '/images/events/tech_hero.webp'}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="size-14 rounded-lg object-cover shrink-0 bg-slate-100 border border-slate-200"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-xs line-clamp-2 leading-snug text-slate-900">
                                            {event?.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 tabular-nums">
                                            <CalendarDays
                                                className="size-3.5 text-slate-400 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span className="truncate">{event?.date}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs text-slate-600 py-4 border-y border-slate-100 mb-4">
                                    {data.items && data.items.length > 0 ? (
                                        data.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center gap-2 pb-2 border-b border-slate-100 last:border-b-0 last:pb-0"
                                            >
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-slate-500 tabular-nums">
                                                        {item.quantity}x @{' '}
                                                        {item.unit_price > 0
                                                            ? `Rp${Number(item.unit_price).toLocaleString('id-ID')}`
                                                            : 'Gratis'}
                                                    </p>
                                                </div>
                                                <span className="font-semibold text-slate-900 tabular-nums">
                                                    {item.unit_price * item.quantity > 0
                                                        ? `Rp${Number(item.unit_price * item.quantity).toLocaleString('id-ID')}`
                                                        : 'Gratis'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {ticket?.name}
                                                </p>
                                                <p className="text-slate-500 tabular-nums">
                                                    {data.quantity}x @ {ticket?.formatted_unit_price}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                {formatted_total_amount}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-slate-100">
                                        <span>Biaya Layanan Platform</span>
                                        <span className="font-medium text-slate-900">Gratis (Rp0)</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-baseline mb-5">
                                    <span className="text-sm font-semibold text-slate-900">
                                        Total Pembayaran
                                    </span>
                                    <span className="text-xl font-semibold text-slate-900 tabular-nums">
                                        {computedTotalAmount > 0
                                            ? `Rp${Number(computedTotalAmount).toLocaleString('id-ID')}`
                                            : formatted_total_amount || 'Gratis'}
                                    </span>
                                </div>

                                <label
                                    htmlFor="checkout-consent"
                                    className="mb-4 flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none leading-relaxed"
                                >
                                    <input
                                        id="checkout-consent"
                                        type="checkbox"
                                        required
                                        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                                    />
                                    <span>
                                        Saya menyetujui{' '}
                                        <a
                                            href="/syarat-ketentuan#pemesanan"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-brand-blue hover:underline"
                                        >
                                            Ketentuan Pemesanan &amp; Refund
                                        </a>{' '}
                                        serta membagikan data peserta di atas kepada penyelenggara acara.
                                    </span>
                                </label>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    loading={processing}
                                    className="w-full"
                                >
                                    {processing
                                        ? 'Memproses Transaksi...'
                                        : computedTotalAmount > 0
                                          ? 'Lanjutkan ke Pembayaran'
                                          : 'Dapatkan Tiket Gratis'}
                                </Button>

                                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                    <ShieldCheck
                                        className="size-3.5 text-slate-400 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span>Jaminan pemesanan tiket resmi dan aman</span>
                                </div>
                            </Card>
                        </div>
                    </form>
                </main>

                <EmailVerificationModal
                    open={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    email={auth?.user?.email || ''}
                />
            </div>
        </>
    );
}
