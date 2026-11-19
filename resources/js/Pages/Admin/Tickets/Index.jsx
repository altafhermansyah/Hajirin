import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Ticket,
    CheckCircle2,
    XCircle,
    Search,
    ChevronDown,
    Calendar,
    Building2,
    Eye,
    X,
    AlertCircle,
    User,
    Mail,
    Phone,
    MapPin,
    QrCode,
    Check,
    Clock,
    ShoppingBag,
} from 'lucide-react';

export default function TicketManagementIndex({
    tickets = { data: [], links: [] },
    stats = {},
    filters = {},
    eventOptions = [],
}) {
    const { flash } = usePage().props;

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedEventId, setSelectedEventId] = useState(filters.event_id || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    // Modals
    const [detailTicket, setDetailTicket] = useState(null);
    const [checkInConfirmTicket, setCheckInConfirmTicket] = useState(null);

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

        router.get('/admin/tickets', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleCheckIn = (ticket) => {
        router.post(
            `/admin/tickets/${ticket.id}/check-in`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setCheckInConfirmTicket(null),
            }
        );
    };

    return (
        <AdminLayout title="Kelola E-Tiket Peserta">
            <Head title="Kelola E-Tiket Peserta - Admin Hajirin" />

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
                            Data E-Tiket Peserta
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Total {stats.totalTickets || 0} Tiket
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Pemeriksaan kode tiket unik, status kepemilikan, dan riwayat kehadiran check-in e-tiket platform.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                    >
                        <ShoppingBag className="size-4 text-slate-500" />
                        <span>Semua Pesanan</span>
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tiket */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total E-Tiket Terbit</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalTickets || 0}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Seluruh tiket di database</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Ticket className="size-6" />
                    </div>
                </div>

                {/* Tiket Aktif */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiket Aktif (Belum Dipakai)</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.activeTickets || 0}</h3>
                        <p className="text-xs text-emerald-600 mt-1 font-medium">Valid untuk masuk gerbang</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-6" />
                    </div>
                </div>

                {/* Tiket Terpakai (Check-in) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telah Check-In</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.usedTickets || 0}</h3>
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Peserta hadir di lokasi</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <QrCode className="size-6" />
                    </div>
                </div>

                {/* Tiket Batal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiket Batal (Void)</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.cancelledTickets || 0}</h3>
                        <p className="text-xs text-rose-600 mt-1 font-medium">Refund atau dibatalkan</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <XCircle className="size-6" />
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kode tiket, nama peserta, email, no order..."
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
                                    <option value="ACTIVE">Aktif (Valid)</option>
                                    <option value="USED">Sudah Check-In</option>
                                    <option value="CANCELLED">Dibatalkan (Void)</option>
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
                                    <option value="code_asc">Kode (A-Z)</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">Kode Tiket</th>
                                <th scope="col" className="px-6 py-4">Peserta / Pemegang</th>
                                <th scope="col" className="px-6 py-4">Event & Kategori</th>
                                <th scope="col" className="px-6 py-4">No. Order</th>
                                <th scope="col" className="px-6 py-4 text-center">Status Tiket</th>
                                <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                        <Ticket className="mx-auto size-12 text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-800 text-base">Tidak ada data tiket ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba sesuaikan kata kunci pencarian atau ganti filter status dan event.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                tickets.data.map((tkt) => {
                                    const isActive = tkt.status === 'ACTIVE';
                                    const isUsed = tkt.status === 'USED';
                                    const isCancelled = tkt.status === 'CANCELLED';

                                    return (
                                        <tr key={tkt.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Ticket Code */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                        <QrCode className="size-4.5" />
                                                    </div>
                                                    <div>
                                                        <span className="font-mono font-bold text-xs text-blue-700 block">
                                                            {tkt.ticketCode}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">{tkt.createdAtFormatted}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Attendee */}
                                            <td className="px-6 py-4 text-xs">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-800">{tkt.attendeeName}</p>
                                                    <p className="text-slate-500 text-[11px] truncate">{tkt.attendeeEmail}</p>
                                                </div>
                                            </td>

                                            {/* Event & Category */}
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                                        {tkt.event.title}
                                                    </h4>
                                                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                        {tkt.ticketTypeName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Order Reference */}
                                            <td className="px-6 py-4 text-xs">
                                                <Link
                                                    href={`/admin/orders?search=${encodeURIComponent(tkt.orderReference)}`}
                                                    className="font-mono font-bold text-slate-700 hover:text-blue-600 hover:underline"
                                                >
                                                    #{tkt.orderReference}
                                                </Link>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-block text-center space-y-0.5">
                                                    {isActive && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Valid Aktif
                                                        </span>
                                                    )}
                                                    {isUsed && (
                                                        <div>
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                                <Check className="size-3.5" />
                                                                Check-In
                                                            </span>
                                                            {tkt.checkedInAtFormatted && (
                                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                                    {tkt.checkedInAtFormatted}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isCancelled && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <XCircle className="size-3.5" />
                                                            Dibatalkan
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Detail View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailTicket(tkt)}
                                                        title="Rincian E-Tiket"
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>

                                                    {/* Manual Check-in if Active */}
                                                    {isActive && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCheckInConfirmTicket(tkt)}
                                                            title="Check-In Manual Tiket"
                                                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                                        >
                                                            <Check className="size-4" />
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
                {tickets.links && tickets.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{tickets.data.length}</span> dari{' '}
                            <span className="font-bold text-slate-800">{tickets.total || tickets.data.length}</span> Tiket
                        </p>
                        <div className="flex items-center gap-1">
                            {tickets.links.map((link, idx) => (
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

            {/* Modal Detail E-Tiket (Digital Boarding Pass Style) */}
            {detailTicket && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        {/* Ticket Header Graphic */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white mb-2">
                                E-Tiket Resmi Hajirin
                            </span>
                            <h3 className="font-black text-lg text-white leading-tight">
                                {detailTicket.event.title}
                            </h3>
                            <p className="text-xs text-blue-100 mt-1">
                                {detailTicket.event.venueName} • {detailTicket.event.startsAtFormatted}
                            </p>
                        </div>

                        {/* Ticket Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kategori Tiket</span>
                                    <span className="font-extrabold text-sm text-slate-900">{detailTicket.ticketTypeName}</span>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        detailTicket.status === 'ACTIVE'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : detailTicket.status === 'USED'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}
                                >
                                    {detailTicket.status}
                                </span>
                            </div>

                            {/* QR & Code */}
                            <div className="text-center p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                                <QrCode className="size-28 mx-auto text-slate-800 mb-2" />
                                <span className="font-mono font-black text-sm text-blue-700 tracking-wider">
                                    {detailTicket.ticketCode}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Tunjukkan kode unik ini di gerbang masuk lokasi acara
                                </p>
                            </div>

                            {/* Attendee Details */}
                            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Nama Peserta:</span>
                                    <span className="font-bold text-slate-800">{detailTicket.attendeeName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Email:</span>
                                    <span className="font-bold text-slate-800">{detailTicket.attendeeEmail}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">No. WhatsApp / Telepon:</span>
                                    <span className="font-bold text-slate-800">{detailTicket.attendeePhone}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Invoice Induk:</span>
                                    <span className="font-mono font-bold text-slate-700">#{detailTicket.orderReference}</span>
                                </div>
                                {detailTicket.checkedInAtFormatted && (
                                    <div className="flex items-center justify-between text-blue-700 font-semibold">
                                        <span>Check-In Pada:</span>
                                        <span>{detailTicket.checkedInAtFormatted}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setDetailTicket(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Check-In Manual */}
            {checkInConfirmTicket && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">Check-In Manual Tiket?</h3>
                                <p className="text-xs text-slate-500">
                                    Peserta: <strong className="text-slate-800">{checkInConfirmTicket.attendeeName}</strong>
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Tindakan ini akan mengesahkan kehadiran peserta untuk tiket{' '}
                            <strong className="font-mono">{checkInConfirmTicket.ticketCode}</strong> pada event{' '}
                            <strong>{checkInConfirmTicket.event.title}</strong>.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCheckInConfirmTicket(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCheckIn(checkInConfirmTicket)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                            >
                                Ya, Check-In Tiket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
