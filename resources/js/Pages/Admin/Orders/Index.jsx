import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Ticket,
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    ChevronDown,
    Calendar,
    Building2,
    Eye,
    X,
    AlertCircle,
    CreditCard,
    DollarSign,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowUpRight,
    RefreshCw,
    QrCode,
} from 'lucide-react';

export default function OrderManagementIndex({
    orders = { data: [], links: [] },
    stats = {},
    filters = {},
    eventOptions = [],
}) {
    const { flash } = usePage().props;

    // Filters state
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedEventId, setSelectedEventId] = useState(filters.event_id || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    // Modals
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
        <AdminLayout title="Kelola Pesanan & Transaksi Tiket">
            <Head title="Kelola Pesanan Tiket - Admin Hajirin" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs animate-fade-in">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <p className="font-semibold">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-xs animate-fade-in">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                    <p className="font-semibold">{flash.error}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Pesanan & Transaksi Tiket
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Total {stats.totalOrders || 0} Pesanan
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor seluruh transaksi tiket, verifikasi pembayaran, dan kelola status pemesanan platform.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/tickets"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                    >
                        <Ticket className="size-4 text-slate-500" />
                        <span>Data E-Tiket Peserta</span>
                    </Link>
                    <Link
                        href="/admin/refunds"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-xs"
                    >
                        <RefreshCw className="size-4 text-rose-600" />
                        <span>Manajemen Refund</span>
                    </Link>
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Omset Terbayar (PAID)</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1 truncate">
                            {stats.totalRevenueFormatted || 'Rp0'}
                        </h3>
                        <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            {stats.paidOrdersCount || 0} Transaksi Lunas
                        </p>
                    </div>
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp className="size-6" />
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semua Pesanan</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalOrders || 0}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Akumulasi seluruh checkout</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="size-6" />
                    </div>
                </div>

                {/* Menunggu Pembayaran */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Pembayaran</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.pendingOrdersCount || 0}</h3>
                        <p className="text-xs text-amber-600 mt-1 font-medium">Dalam batas waktu 15 menit</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="size-6" />
                    </div>
                </div>

                {/* Dibatalkan / Kedaluwarsa */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batal / Kedaluwarsa</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.cancelledOrdersCount || 0}</h3>
                        <p className="text-xs text-rose-600 mt-1 font-medium">Kuota tiket dikembalikan</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle className="size-6" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari no invoice, nama pembeli, email, event..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Status:</span>
                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        applyFilters({ status: e.target.value });
                                    }}
                                    className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-600 transition appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Semua Status</option>
                                    <option value="PAID">Lunas (PAID)</option>
                                    <option value="PENDING">Menunggu Bayar (PENDING)</option>
                                    <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
                                    <option value="EXPIRED">Kedaluwarsa (EXPIRED)</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Event Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Event:</span>
                            <div className="relative max-w-xs">
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => {
                                        setSelectedEventId(e.target.value);
                                        applyFilters({ event_id: e.target.value });
                                    }}
                                    className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-600 transition appearance-none cursor-pointer truncate"
                                >
                                    <option value="ALL">Semua Event</option>
                                    {eventOptions.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Urutan:</span>
                            <div className="relative">
                                <select
                                    value={selectedSort}
                                    onChange={(e) => {
                                        setSelectedSort(e.target.value);
                                        applyFilters({ sort: e.target.value });
                                    }}
                                    className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-600 transition appearance-none cursor-pointer"
                                >
                                    <option value="latest">Terbaru</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="highest_amount">Nominal Tertinggi</option>
                                    <option value="lowest_amount">Nominal Terendah</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">No. Invoice & Waktu</th>
                                <th scope="col" className="px-6 py-4">Event Terkait</th>
                                <th scope="col" className="px-6 py-4">Pemesan</th>
                                <th scope="col" className="px-6 py-4 text-center">Tiket</th>
                                <th scope="col" className="px-6 py-4 text-right">Total Transaksi</th>
                                <th scope="col" className="px-6 py-4 text-center">Status</th>
                                <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                                        <ShoppingBag className="mx-auto size-12 text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-800 text-base">Tidak ada pesanan ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba sesuaikan kata kunci pencarian atau ganti filter status dan event.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => {
                                    const isPaid = order.status === 'PAID';
                                    const isPending = order.status === 'PENDING';
                                    const isCancelled = order.status === 'CANCELLED';
                                    const isExpired = order.status === 'EXPIRED';

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Invoice & Time */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-mono font-bold text-blue-600 text-xs">
                                                        #{order.orderReference}
                                                    </span>
                                                    <p className="text-xs text-slate-500">{order.createdAtFormatted}</p>
                                                </div>
                                            </td>

                                            {/* Event & Organizer */}
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                                        {order.event.title}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Building2 className="size-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{order.event.organizerName}</span>
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Buyer Info */}
                                            <td className="px-6 py-4 text-xs">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-800">{order.buyer.name}</p>
                                                    <p className="text-slate-500 text-[11px] truncate">{order.buyer.email}</p>
                                                </div>
                                            </td>

                                            {/* Ticket Count */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-block text-center">
                                                    <span className="font-bold text-xs text-slate-800">
                                                        {order.ticketSummary.totalTickets} Tiket
                                                    </span>
                                                    {isPaid && (
                                                        <p className="text-[10px] text-emerald-600 font-semibold">
                                                            {order.ticketSummary.activeTickets} Aktif
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Total Amount */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-block text-right">
                                                    <span className="font-extrabold text-sm text-slate-900">
                                                        {order.totalAmountFormatted}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 uppercase font-mono">
                                                        {order.payment.method}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4 text-center">
                                                {isPaid && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Lunas
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="size-3.5" />
                                                        Menunggu
                                                    </span>
                                                )}
                                                {isCancelled && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="size-3.5" />
                                                        Batal
                                                    </span>
                                                )}
                                                {isExpired && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        <Clock className="size-3.5" />
                                                        Kedaluwarsa
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Detail View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailOrder(order)}
                                                        title="Rincian Pesanan & E-Tiket"
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>

                                                    {/* Mark as Paid if pending */}
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMarkPaidConfirmOrder(order)}
                                                            title="Konfirmasi Pembayaran LUNAS"
                                                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                                        >
                                                            <CheckCircle2 className="size-4" />
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

                {/* Pagination */}
                {orders.links && orders.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{orders.data.length}</span> dari{' '}
                            <span className="font-bold text-slate-800">{orders.total || orders.data.length}</span> Pesanan
                        </p>
                        <div className="flex items-center gap-1">
                            {orders.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        link.active
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : !link.url
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-600 hover:bg-slate-200/60'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail Pesanan */}
            {detailOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Invoice Rincian Pemesanan
                                </span>
                                <h3 className="font-mono font-black text-slate-900 text-base">
                                    #{detailOrder.orderReference}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailOrder(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Event & Status Header */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">Event:</span>
                                        <h4 className="font-extrabold text-slate-900 text-base">{detailOrder.event.title}</h4>
                                        <p className="text-xs text-slate-600">EO: {detailOrder.event.organizerName}</p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            detailOrder.status === 'PAID'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                : detailOrder.status === 'PENDING'
                                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                : 'bg-rose-100 text-rose-800 border-rose-200'
                                        }`}
                                    >
                                        {detailOrder.status}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                    <div>
                                        <span>Tanggal Event: </span>
                                        <strong className="text-slate-700">{detailOrder.event.eventDateFormatted}</strong>
                                    </div>
                                    <div>
                                        <span>Lokasi: </span>
                                        <strong className="text-slate-700">{detailOrder.event.venueName}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Data Pemesan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 font-semibold block mb-1">Nama Pemesan:</span>
                                    <span className="font-bold text-slate-800">{detailOrder.buyer.name}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 font-semibold block mb-1">Email Pemesan:</span>
                                    <span className="font-bold text-slate-800 break-all">{detailOrder.buyer.email}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 font-semibold block mb-1">No. WhatsApp / Telepon:</span>
                                    <span className="font-bold text-slate-800">{detailOrder.buyer.phone}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 font-semibold block mb-1">Waktu Transaksi:</span>
                                    <span className="font-bold text-slate-800">{detailOrder.createdAtFormatted}</span>
                                </div>
                            </div>

                            {/* Item Pembelian */}
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 mb-2">Rincian Pembelian Tiket:</h5>
                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                                    {detailOrder.items.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-white flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-800">{item.ticketTypeName}</p>
                                                <p className="text-[11px] text-slate-500">{item.unitPriceFormatted} × {item.quantity} tiket</p>
                                            </div>
                                            <span className="font-extrabold text-slate-900">
                                                {item.unitPrice > 0 ? 'Rp' + (item.unitPrice * item.quantity).toLocaleString('id-ID') : 'Gratis'}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="p-3 bg-slate-50 flex items-center justify-between font-bold text-sm">
                                        <span>Total Tagihan:</span>
                                        <span className="text-blue-700 text-base font-black">{detailOrder.totalAmountFormatted}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Daftar E-Tiket Terbit */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-bold text-slate-700">Kode E-Tiket Terbit:</h5>
                                    <span className="text-xs text-slate-500">{detailOrder.tickets.length} Tiket</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {detailOrder.tickets.map((tkt) => (
                                        <div
                                            key={tkt.id}
                                            className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <QrCode className="size-4 text-slate-400" />
                                                <span className="font-mono font-bold text-slate-800 text-[11px]">{tkt.ticketCode}</span>
                                            </div>
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    tkt.status === 'ACTIVE'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : tkt.status === 'USED'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {tkt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setDetailOrder(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Mark as Paid */}
            {markPaidConfirmOrder && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Pembayaran Lunas?</h3>
                                <p className="text-xs text-slate-500">
                                    Invoice: <strong className="font-mono text-slate-800">#{markPaidConfirmOrder.orderReference}</strong>
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Tindakan ini akan mengesahkan pembayaran senilai <strong>{markPaidConfirmOrder.totalAmountFormatted}</strong> secara manual, menerbitkan status LUNAS (PAID), dan mengaktifkan e-tiket pemesan.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setMarkPaidConfirmOrder(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMarkAsPaid(markPaidConfirmOrder)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                            >
                                Ya, Konfirmasi Lunas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
