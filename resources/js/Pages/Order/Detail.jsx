import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Navbar from '../../Components/Navbar';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    MapPin,
    Printer,
    RotateCcw,
    Ticket,
} from 'lucide-react';
import { Card } from '../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';
import { Modal } from '../../Components/ui/Dialog';

const REFUND_STATUS_META = {
    PENDING: { tone: 'warning', label: 'Menunggu Tinjauan Admin' },
    APPROVED: { tone: 'success', label: 'Pengembalian Dana Disetujui' },
    COMPLETED: { tone: 'success', label: 'Pengembalian Dana Selesai' },
    REJECTED: { tone: 'danger', label: 'Pengajuan Refund Ditolak' },
};

export default function OrderDetail({
    auth,
    order = {},
    event = {},
    items = [],
    refund = null,
    canRequestRefund = false,
    refundBlockedReason = null,
}) {
    const { flash, errors: pageErrors } = usePage().props;
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    const refundForm = useForm({
        reason: '',
    });

    const isPaid = order.status === 'PAID';
    const isCancelled = order.status === 'CANCELLED';
    const refundMeta = refund
        ? REFUND_STATUS_META[refund.status] || REFUND_STATUS_META.PENDING
        : null;

    const orderStatusMeta = isPaid
        ? { tone: 'success', label: 'Pembayaran Berhasil (Lunas)' }
        : isCancelled
          ? { tone: 'danger', label: 'Pesanan Dibatalkan / Refund' }
          : { tone: 'warning', label: order.status || 'Menunggu Pembayaran' };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleOpenRefundModal = () => {
        refundForm.clearErrors();
        setIsRefundModalOpen(true);
    };

    const handleSubmitRefund = (e) => {
        e.preventDefault();

        refundForm.post(`/orders/${order.orderReference}/refund`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRefundModalOpen(false);
                refundForm.reset();
            },
        });
    };

    return (
        <>
            <Head title={`Detail Transaksi: ${order.orderReference || 'Pesanan'} - Hajirin`} />

            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col print:bg-white">
                <div className="print:hidden">
                    <Navbar auth={auth} />
                </div>

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6"
                >
                    {/* Header Navigasi & Aksi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <Link
                            href="/dashboard#pesanan"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            <span>Kembali ke Riwayat Pesanan</span>
                        </Link>

                        <div className="flex flex-wrap items-center gap-2">
                            {order.hasTickets && isPaid && (
                                <Link
                                    href={`/my-tickets/${order.orderReference}`}
                                    className={buttonClass('primary', 'sm')}
                                >
                                    <Ticket className="size-3.5" aria-hidden="true" />
                                    <span>Buka E-Tiket & QR</span>
                                </Link>
                            )}

                            {canRequestRefund && (
                                <Button
                                    variant="danger-outline"
                                    size="sm"
                                    onClick={handleOpenRefundModal}
                                >
                                    <RotateCcw className="size-3.5" aria-hidden="true" />
                                    <span>
                                        {refund?.status === 'REJECTED'
                                            ? 'Ajukan Refund Ulang'
                                            : 'Ajukan Refund'}
                                    </span>
                                </Button>
                            )}

                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="size-3.5 text-slate-500" aria-hidden="true" />
                                <span>Cetak Invoice</span>
                            </Button>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="print:hidden">
                            <FlashBanner tone="success" message={flash.success} />
                        </div>
                    )}

                    {pageErrors?.refund && (
                        <div className="print:hidden">
                            <FlashBanner tone="error" message={pageErrors.refund} />
                        </div>
                    )}

                    {/* Status Pengajuan Refund */}
                    {refund && refundMeta && (
                        <Card as="section" className="p-5 space-y-3 print:hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Status Pengembalian Dana (Refund)
                                </h2>
                                <StatusBadge tone={refundMeta.tone} label={refundMeta.label} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                                <div>
                                    <p className="text-slate-500">Nominal Diajukan</p>
                                    <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                                        {refund.amountFormatted}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Waktu Pengajuan</p>
                                    <p className="font-medium text-slate-900 mt-0.5 tabular-nums">
                                        {refund.requestedAtFormatted}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-slate-500">Alasan Pengajuan</p>
                                    <p className="text-slate-800 mt-0.5 leading-relaxed">
                                        {refund.reason}
                                    </p>
                                </div>
                                {refund.resolutionNote && (
                                    <div className="sm:col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
                                        <p className="text-xs font-medium text-slate-500">
                                            Catatan Administrator
                                            {refund.processedAtFormatted
                                                ? ` · ${refund.processedAtFormatted}`
                                                : ''}
                                        </p>
                                        <p className="text-slate-800 mt-1 leading-relaxed">
                                            {refund.resolutionNote}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Dokumen Invoice Resmi */}
                    <Card
                        as="article"
                        className="p-6 sm:p-10 space-y-8 print:border-none print:rounded-none print:p-0"
                    >
                        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/hajirin_icon.svg"
                                        alt="Hajirin"
                                        className="h-7 w-auto"
                                    />
                                    <span className="text-lg font-bold tracking-tight text-navy">
                                        HAJIRIN
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Invoice Resmi Pemesanan Tiket Event
                                </p>
                            </div>

                            <div className="sm:text-right space-y-1">
                                <div className="sm:flex sm:justify-end">
                                    <StatusBadge
                                        tone={orderStatusMeta.tone}
                                        label={orderStatusMeta.label}
                                    />
                                </div>
                                <p className="font-mono text-sm font-semibold text-slate-900 pt-1">
                                    No. {order.orderReference}
                                </p>
                                <p className="text-xs text-slate-500 tabular-nums">
                                    Tanggal Transaksi: {order.createdAt}
                                </p>
                            </div>
                        </header>

                        {/* Informasi Acara & Pembeli */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                                <p className="text-xs font-medium text-slate-500">Detail Acara</p>
                                <div className="flex items-start gap-3">
                                    <div className="size-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                                        <img
                                            src={event.banner}
                                            alt={event.title}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h2 className="text-sm font-semibold text-slate-900 leading-snug">
                                            {event.title}
                                        </h2>
                                        <p className="text-xs text-slate-600 flex items-center gap-1.5 tabular-nums">
                                            <CalendarDays
                                                className="size-3.5 text-slate-400 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>{event.dateFormatted}</span>
                                        </p>
                                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                            <MapPin
                                                className="size-3.5 text-slate-400 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>{event.location}</span>
                                        </p>
                                    </div>
                                </div>
                                {event.address && (
                                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-200/70 leading-relaxed">
                                        {event.address}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                                <p className="text-xs font-medium text-slate-500">
                                    Detail Pembeli &amp; Pembayaran
                                </p>
                                <dl className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/60">
                                        <dt className="text-slate-500">Nama Pembeli</dt>
                                        <dd className="font-medium text-slate-900">
                                            {order.buyerName}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/60">
                                        <dt className="text-slate-500">Email Akun</dt>
                                        <dd className="font-medium text-slate-900">
                                            {order.buyerEmail}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/60">
                                        <dt className="text-slate-500">Metode Bayar</dt>
                                        <dd className="font-mono font-medium text-slate-900 uppercase">
                                            {order.paymentMethod}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 py-1">
                                        <dt className="text-slate-500">Waktu Lunas</dt>
                                        <dd className="font-medium text-slate-900 tabular-nums">
                                            {order.paidAt}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Tabel Item Rincian Tiket */}
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-900">
                                Rincian Pembelian Tiket
                            </p>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                        <tr>
                                            <th scope="col" className="py-3 px-4">
                                                Jenis Tiket
                                            </th>
                                            <th scope="col" className="py-3 px-4 text-right">
                                                Harga Satuan
                                            </th>
                                            <th scope="col" className="py-3 px-4 text-center">
                                                Jumlah
                                            </th>
                                            <th scope="col" className="py-3 px-4 text-right">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-800">
                                        {items.map((it) => (
                                            <tr key={it.id}>
                                                <td className="py-3 px-4 font-medium text-slate-900">
                                                    {it.ticketName}
                                                </td>
                                                <td className="py-3 px-4 text-right tabular-nums">
                                                    {it.formattedUnitPrice}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <NeutralTag className="tabular-nums">
                                                        {it.quantity} Tiket
                                                    </NeutralTag>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                                                    {it.formattedSubtotal}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Ringkasan Perhitungan */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4 border-t border-slate-200">
                            <div className="space-y-1 text-xs text-slate-500 max-w-sm">
                                <p className="font-medium text-slate-700">Catatan Transaksi</p>
                                <p className="leading-relaxed">
                                    Transaksi ini sah dan dilindungi oleh sistem keamanan Hajirin. Pembayaran telah terverifikasi.
                                </p>
                                {refundBlockedReason && (
                                    <p className="text-slate-400 pt-1 print:hidden">
                                        Info Refund: {refundBlockedReason}
                                    </p>
                                )}
                            </div>

                            <div className="w-full sm:w-80 rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Total Item Tiket</span>
                                    <span className="font-medium text-slate-900 tabular-nums">
                                        {order.totalTickets} Tiket
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Biaya Layanan &amp; Admin</span>
                                    <span className="font-medium text-slate-900">Gratis (Rp0)</span>
                                </div>
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm">
                                    <span className="font-semibold text-slate-900">Total Bayar</span>
                                    <span className="font-semibold text-base text-slate-900 tabular-nums">
                                        {order.formattedTotalAmount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Bawah */}
                        {order.hasTickets && isPaid && (
                            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                                <p className="text-xs text-slate-500">
                                    Tiket sudah siap digunakan. Buka halaman e-tiket untuk melihat QR code masing-masing tiket.
                                </p>

                                <Link
                                    href={`/my-tickets/${order.orderReference}`}
                                    className={buttonClass('primary', 'md', 'w-full sm:w-auto')}
                                >
                                    <Ticket className="size-4" aria-hidden="true" />
                                    <span>Lihat E-Tiket ({order.totalTickets} Tiket)</span>
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </Card>
                </main>
            </div>

            {/* Modal Form Pengajuan Refund (Native <dialog>) */}
            <Modal
                open={isRefundModalOpen}
                onClose={() => {
                    if (!refundForm.processing) setIsRefundModalOpen(false);
                }}
                title="Ajukan Pengembalian Dana (Refund)"
                description="Isi alasan pembatalan agar tim administrator dapat meninjau permohonan Anda."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmitRefund} className="space-y-4">
                    <dl className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Nomor Pesanan</dt>
                            <dd className="font-mono font-semibold text-slate-900">
                                {order.orderReference}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Nominal Refund</dt>
                            <dd className="font-semibold text-slate-900 tabular-nums">
                                {order.formattedTotalAmount}
                            </dd>
                        </div>
                    </dl>

                    <div className="rounded-lg bg-amber-50/70 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
                        Jika permohonan disetujui Administrator, seluruh e-tiket pada pesanan ini akan otomatis dibatalkan dan kuota tiket dikembalikan ke event.
                    </div>

                    <div>
                        <label
                            htmlFor="refund-reason"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Alasan Pengajuan Refund <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                            id="refund-reason"
                            rows={4}
                            value={refundForm.data.reason}
                            onChange={(e) => refundForm.setData('reason', e.target.value)}
                            placeholder="Jelaskan alasan pembatalan pesanan Anda (minimal 10 karakter)..."
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            required
                            minLength={10}
                            maxLength={1000}
                        />
                        {refundForm.errors.reason && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">
                                {refundForm.errors.reason}
                            </p>
                        )}
                        {refundForm.errors.refund && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">
                                {refundForm.errors.refund}
                            </p>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={refundForm.processing}
                            onClick={() => setIsRefundModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            loading={refundForm.processing}
                        >
                            {refundForm.processing ? 'Mengirim...' : 'Kirim Pengajuan Refund'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
