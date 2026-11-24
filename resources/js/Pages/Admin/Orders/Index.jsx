import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Ticket,
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Building2,
    Eye,
    RefreshCw,
    QrCode,
    X,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge } from '../../../Components/ui/StatusBadge';
import { Pagination } from '../../../Components/ui/Pagination';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const ORDER_STATUS_META = {
    PAID: { tone: 'success', label: 'Lunas' },
    PENDING: { tone: 'warning', label: 'Menunggu' },
    CANCELLED: { tone: 'danger', label: 'Batal' },
    EXPIRED: { tone: 'neutral', label: 'Kedaluwarsa' },
};

const TICKET_STATUS_META = {
    ACTIVE: { tone: 'success', label: 'Aktif' },
    USED: { tone: 'info', label: 'Check-In' },
    CANCELLED: { tone: 'danger', label: 'Void' },
};

export default function OrderManagementIndex({
    orders = { data: [], links: [] },
    stats = {},
    filters = {},
    eventOptions = [],
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedEventId, setSelectedEventId] = useState(filters.event_id || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    const [detailOrder, setDetailOrder] = useState(null);
    const [markPaidConfirmOrder, setMarkPaidConfirmOrder] = useState(null);

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            event_id: newFilters.event_id !== undefined ? newFilters.event_id : selectedEventId,
            sort: newFilters.sort !== undefined ? newFilters.sort : selectedSort,
        };

        if (!queryParams.search) delete queryParams.search;
        if (queryParams.status === 'ALL') delete queryParams.status;
        if (queryParams.event_id === 'ALL') delete queryParams.event_id;
        if (queryParams.sort === 'latest') delete queryParams.sort;

        router.get('/admin/orders', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleMarkAsPaid = (order) => {
        router.patch(
            `/admin/orders/${order.id}/mark-as-paid`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setMarkPaidConfirmOrder(null),
            }
        );
    };

    return (
        <AdminLayout title="Pesanan & Transaksi">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Pesanan & Transaksi Tiket
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor seluruh transaksi tiket, verifikasi pembayaran, dan kelola status pemesanan platform.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/admin/tickets" className={buttonClass('outline', 'md')}>
                        <Ticket className="size-4 text-slate-500" aria-hidden="true" />
                        <span>Data E-Tiket</span>
                    </Link>
                    <Link href="/admin/refunds" className={buttonClass('outline', 'md')}>
                        <RefreshCw className="size-4 text-slate-500" aria-hidden="true" />
                        <span>Manajemen Refund</span>
                    </Link>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Omset Terbayar (Paid)"
                    icon={TrendingUp}
                    value={stats.totalRevenueFormatted || 'Rp0'}
                    subtext={`${stats.paidOrdersCount || 0} transaksi lunas`}
                />
                <StatCard
                    label="Semua Pesanan"
                    icon={ShoppingBag}
                    value={stats.totalOrders || 0}
                    subtext="Akumulasi seluruh checkout"
                />
                <StatCard
                    label="Menunggu Pembayaran"
                    icon={Clock}
                    value={stats.pendingOrdersCount || 0}
                    subtext="Batas waktu 15 menit"
                />
                <StatCard
                    label="Batal / Kedaluwarsa"
                    icon={XCircle}
                    value={stats.cancelledOrdersCount || 0}
                    subtext="Kuota tiket dikembalikan"
                />
            </div>

            {/* Orders Table Card */}
            <Card className="overflow-hidden">
                {/* Filter and Search Bar */}
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="w-full lg:max-w-sm relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari no invoice, nama pembeli, email, event..."
                            aria-label="Cari pesanan"
                            className="w-full h-9 pl-9 pr-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                        />
                        {search && (
                            <button
                                type="button"
                                aria-label="Hapus pencarian"
                                onClick={() => {
                                    setSearch('');
                                    applyFilters({ search: '' });
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="order-status-filter" className="font-medium">
                                Status:
                            </label>
                            <select
                                id="order-status-filter"
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="PAID">Lunas (PAID)</option>
                                <option value="PENDING">Menunggu Bayar (PENDING)</option>
                                <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
                                <option value="EXPIRED">Kedaluwarsa (EXPIRED)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="order-event-filter" className="font-medium">
                                Event:
                            </label>
                            <select
                                id="order-event-filter"
                                value={selectedEventId}
                                onChange={(e) => {
                                    setSelectedEventId(e.target.value);
                                    applyFilters({ event_id: e.target.value });
                                }}
                                className="h-9 max-w-[200px] truncate rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Event</option>
                                {eventOptions.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="order-sort-filter" className="font-medium">
                                Urutkan:
                            </label>
                            <select
                                id="order-sort-filter"
                                value={selectedSort}
                                onChange={(e) => {
                                    setSelectedSort(e.target.value);
                                    applyFilters({ sort: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="highest_amount">Nominal Tertinggi</option>
                                <option value="lowest_amount">Nominal Terendah</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">No. Invoice & Waktu</th>
                                <th scope="col" className="px-5 py-3">Event Terkait</th>
                                <th scope="col" className="px-5 py-3">Pemesan</th>
                                <th scope="col" className="px-5 py-3 text-right">Tiket</th>
                                <th scope="col" className="px-5 py-3 text-right">Total Transaksi</th>
                                <th scope="col" className="px-5 py-3">Status</th>
                                <th scope="col" className="px-5 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                                        <ShoppingBag className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada pesanan ditemukan
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba sesuaikan kata kunci pencarian atau ganti filter status dan event.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => {
                                    const isPaid = order.status === 'PAID';
                                    const isPending = order.status === 'PENDING';
                                    const statusMeta = ORDER_STATUS_META[order.status] || {
                                        tone: 'neutral',
                                        label: order.status,
                                    };

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono font-medium text-slate-900 text-xs block">
                                                    #{order.orderReference}
                                                </span>
                                                <span className="text-xs text-slate-400 tabular-nums">
                                                    {order.createdAtFormatted}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="max-w-xs">
                                                    <p className="font-medium text-slate-900 text-xs truncate">
                                                        {order.event.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Building2 className="size-3 text-slate-400 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{order.event.organizerName}</span>
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <p className="font-medium text-slate-900">{order.buyer.name}</p>
                                                <p className="text-slate-500 truncate">{order.buyer.email}</p>
                                            </td>

                                            <td className="px-5 py-3.5 text-right tabular-nums">
                                                <p className="font-medium text-xs text-slate-900">
                                                    {order.ticketSummary.totalTickets} Tiket
                                                </p>
                                                {isPaid && (
                                                    <p className="text-xs text-slate-500">
                                                        {order.ticketSummary.activeTickets} aktif
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-right tabular-nums">
                                                <p className="font-medium text-sm text-slate-900">
                                                    {order.totalAmountFormatted}
                                                </p>
                                                <p className="text-xs text-slate-400 uppercase font-mono">
                                                    {order.payment.method}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    tone={statusMeta.tone}
                                                    label={statusMeta.label}
                                                />
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailOrder(order)}
                                                        title="Rincian Pesanan & E-Tiket"
                                                        aria-label={`Lihat rincian pesanan #${order.orderReference}`}
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        <Eye className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMarkPaidConfirmOrder(order)}
                                                            title="Konfirmasi Pembayaran Lunas"
                                                            aria-label={`Konfirmasi pembayaran lunas #${order.orderReference}`}
                                                            className={buttonClass('primary', 'icon')}
                                                        >
                                                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    links={orders.links}
                    from={orders.from}
                    to={orders.to}
                    total={orders.total}
                    itemLabel="pesanan"
                />
            </Card>

            {/* Modal Detail Pesanan */}
            <Modal
                open={Boolean(detailOrder)}
                onClose={() => setDetailOrder(null)}
                title={detailOrder ? `Invoice #${detailOrder.orderReference}` : 'Rincian Pesanan'}
                description="Rincian transaksi pemesanan tiket dan daftar e-tiket terbit."
                maxWidth="max-w-xl"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setDetailOrder(null)}>
                        Tutup
                    </Button>
                }
            >
                {detailOrder && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Event</p>
                                    <h4 className="font-semibold text-slate-900 text-sm mt-0.5">
                                        {detailOrder.event.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        EO: {detailOrder.event.organizerName}
                                    </p>
                                </div>
                                <StatusBadge
                                    tone={ORDER_STATUS_META[detailOrder.status]?.tone || 'neutral'}
                                    label={ORDER_STATUS_META[detailOrder.status]?.label || detailOrder.status}
                                />
                            </div>
                            <div className="pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                <div>
                                    <span className="text-slate-500">Tanggal Event: </span>
                                    <strong className="text-slate-800">{detailOrder.event.eventDateFormatted}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-500">Lokasi: </span>
                                    <strong className="text-slate-800">{detailOrder.event.venueName}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-500 block mb-0.5">Nama Pemesan</span>
                                <span className="font-medium text-slate-900">{detailOrder.buyer.name}</span>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-500 block mb-0.5">Email Pemesan</span>
                                <span className="font-medium text-slate-900 break-all">
                                    {detailOrder.buyer.email}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-500 block mb-0.5">No. WhatsApp / Telepon</span>
                                <span className="font-medium text-slate-900 font-mono">
                                    {detailOrder.buyer.phone}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-200">
                                <span className="text-slate-500 block mb-0.5">Waktu Transaksi</span>
                                <span className="font-medium text-slate-900 tabular-nums">
                                    {detailOrder.createdAtFormatted}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-700 mb-2">
                                Rincian Pembelian Tiket
                            </p>
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                                {detailOrder.items.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-slate-900">{item.ticketTypeName}</p>
                                            <p className="text-slate-500 tabular-nums">
                                                {item.unitPriceFormatted} x {item.quantity} tiket
                                            </p>
                                        </div>
                                        <span className="font-semibold text-slate-900 tabular-nums">
                                            {item.unitPrice > 0
                                                ? 'Rp' + (item.unitPrice * item.quantity).toLocaleString('id-ID')
                                                : 'Gratis'}
                                        </span>
                                    </div>
                                ))}
                                <div className="p-3 bg-slate-50 flex items-center justify-between text-sm font-semibold text-slate-900">
                                    <span>Total Tagihan</span>
                                    <span className="tabular-nums">{detailOrder.totalAmountFormatted}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-700">Kode E-Tiket Terbit</p>
                                <span className="text-xs text-slate-500 tabular-nums">
                                    {detailOrder.tickets.length} Tiket
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {detailOrder.tickets.map((tkt) => {
                                    const tktStatus = TICKET_STATUS_META[tkt.status] || {
                                        tone: 'neutral',
                                        label: tkt.status,
                                    };
                                    return (
                                        <div
                                            key={tkt.id}
                                            className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <QrCode className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
                                                <span className="font-mono font-medium text-slate-800 truncate">
                                                    {tkt.ticketCode}
                                                </span>
                                            </div>
                                            <StatusBadge tone={tktStatus.tone} label={tktStatus.label} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Mark as Paid */}
            <Modal
                open={Boolean(markPaidConfirmOrder)}
                onClose={() => setMarkPaidConfirmOrder(null)}
                title="Konfirmasi Pembayaran Lunas?"
                description={
                    markPaidConfirmOrder
                        ? `Invoice #${markPaidConfirmOrder.orderReference}`
                        : null
                }
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMarkPaidConfirmOrder(null)}
                        >
                            Batal
                        </Button>
                        {markPaidConfirmOrder && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkAsPaid(markPaidConfirmOrder)}
                            >
                                Ya, Konfirmasi Lunas
                            </Button>
                        )}
                    </>
                }
            >
                {markPaidConfirmOrder && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Tindakan ini akan mengesahkan pembayaran senilai{' '}
                        <strong className="text-slate-900">
                            {markPaidConfirmOrder.totalAmountFormatted}
                        </strong>{' '}
                        secara manual, mengubah status menjadi LUNAS (PAID), dan mengaktifkan e-tiket pemesan.
                    </p>
                )}
            </Modal>
        </AdminLayout>
    );
}
