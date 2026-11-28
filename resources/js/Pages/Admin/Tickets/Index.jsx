import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Ticket,
    CheckCircle2,
    XCircle,
    Search,
    Eye,
    X,
    QrCode,
    Check,
    ShoppingBag,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { Pagination } from '../../../Components/ui/Pagination';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';
import QrCodeSvg from '../../../Components/QrCodeSvg';

const TICKET_STATUS_META = {
    ACTIVE: { tone: 'success', label: 'Valid Aktif' },
    USED: { tone: 'info', label: 'Check-In' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
};

export default function TicketManagementIndex({
    tickets = { data: [], links: [] },
    stats = {},
    filters = {},
    eventOptions = [],
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedEventId, setSelectedEventId] = useState(filters.event_id || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

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
        <AdminLayout title="Data E-Tiket Peserta">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Data E-Tiket Peserta
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pemeriksaan kode tiket unik, status kepemilikan, dan riwayat kehadiran check-in e-tiket platform.
                    </p>
                </div>

                <Link href="/admin/orders" className={buttonClass('outline', 'md')}>
                    <ShoppingBag className="size-4 text-slate-500" aria-hidden="true" />
                    <span>Semua Pesanan</span>
                </Link>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total E-Tiket Terbit"
                    icon={Ticket}
                    value={stats.totalTickets || 0}
                    subtext="Seluruh tiket di database"
                />
                <StatCard
                    label="Tiket Aktif"
                    icon={CheckCircle2}
                    value={stats.activeTickets || 0}
                    subtext="Siap dipindai di pintu masuk"
                />
                <StatCard
                    label="Telah Check-In"
                    icon={QrCode}
                    value={stats.usedTickets || 0}
                    subtext="Peserta telah hadir di lokasi"
                />
                <StatCard
                    label="Tiket Batal (Void)"
                    icon={XCircle}
                    value={stats.cancelledTickets || 0}
                    subtext="Refund atau dibatalkan"
                />
            </div>

            {/* Tickets Table Card */}
            <Card className="overflow-hidden">
                {/* Search and Filters */}
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
                            placeholder="Cari kode tiket, nama peserta, email, no order..."
                            aria-label="Cari e-tiket"
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
                            <label htmlFor="ticket-status-filter" className="font-medium">
                                Status:
                            </label>
                            <select
                                id="ticket-status-filter"
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="ACTIVE">Aktif (Valid)</option>
                                <option value="USED">Sudah Check-In</option>
                                <option value="CANCELLED">Dibatalkan (Void)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="ticket-event-filter" className="font-medium">
                                Event:
                            </label>
                            <select
                                id="ticket-event-filter"
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
                            <label htmlFor="ticket-sort-filter" className="font-medium">
                                Urutkan:
                            </label>
                            <select
                                id="ticket-sort-filter"
                                value={selectedSort}
                                onChange={(e) => {
                                    setSelectedSort(e.target.value);
                                    applyFilters({ sort: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="code_asc">Kode (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">Kode Tiket</th>
                                <th scope="col" className="px-5 py-3">Peserta / Pemegang</th>
                                <th scope="col" className="px-5 py-3">Event & Kategori</th>
                                <th scope="col" className="px-5 py-3">No. Order</th>
                                <th scope="col" className="px-5 py-3">Status Tiket</th>
                                <th scope="col" className="px-5 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tickets.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                        <Ticket className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada data tiket ditemukan
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba sesuaikan kata kunci pencarian atau ganti filter status dan event.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                tickets.data.map((tkt) => {
                                    const isActive = tkt.status === 'ACTIVE';
                                    const statusMeta = TICKET_STATUS_META[tkt.status] || {
                                        tone: 'neutral',
                                        label: tkt.status,
                                    };

                                    return (
                                        <tr key={tkt.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                                                        <QrCode className="size-4" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <span className="font-mono font-medium text-xs text-slate-900 block">
                                                            {tkt.ticketCode}
                                                        </span>
                                                        <span className="text-xs text-slate-400 tabular-nums">
                                                            {tkt.createdAtFormatted}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <p className="font-medium text-slate-900">{tkt.attendeeName}</p>
                                                <p className="text-slate-500 truncate">{tkt.attendeeEmail}</p>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="max-w-xs space-y-1">
                                                    <p className="font-medium text-slate-900 text-xs truncate">
                                                        {tkt.event.title}
                                                    </p>
                                                    <NeutralTag>{tkt.ticketTypeName}</NeutralTag>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <Link
                                                    href={`/admin/orders?search=${encodeURIComponent(tkt.orderReference)}`}
                                                    className="font-mono font-medium text-slate-700 hover:text-brand-blue hover:underline"
                                                >
                                                    #{tkt.orderReference}
                                                </Link>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5">
                                                    <StatusBadge
                                                        tone={statusMeta.tone}
                                                        label={statusMeta.label}
                                                    />
                                                    {tkt.status === 'USED' && tkt.checkedInAtFormatted && (
                                                        <p className="text-xs text-slate-400 tabular-nums">
                                                            {tkt.checkedInAtFormatted}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailTicket(tkt)}
                                                        title="Rincian E-Tiket"
                                                        aria-label={`Lihat rincian tiket ${tkt.ticketCode}`}
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        <Eye className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    {isActive && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCheckInConfirmTicket(tkt)}
                                                            title="Check-In Manual Tiket"
                                                            aria-label={`Check-in manual tiket ${tkt.ticketCode}`}
                                                            className={buttonClass('primary', 'icon')}
                                                        >
                                                            <Check className="size-3.5" aria-hidden="true" />
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
                    links={tickets.links}
                    from={tickets.from}
                    to={tickets.to}
                    total={tickets.total}
                    itemLabel="tiket"
                />
            </Card>

            {/* Modal Detail E-Tiket */}
            <Modal
                open={Boolean(detailTicket)}
                onClose={() => setDetailTicket(null)}
                title="Rincian E-Tiket"
                description={
                    detailTicket
                        ? `${detailTicket.event.venueName} · ${detailTicket.event.startsAtFormatted}`
                        : null
                }
                maxWidth="max-w-md"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setDetailTicket(null)}>
                        Tutup
                    </Button>
                }
            >
                {detailTicket && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                            <p className="font-semibold text-sm text-slate-900 leading-snug">
                                {detailTicket.event.title}
                            </p>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                <NeutralTag>{detailTicket.ticketTypeName}</NeutralTag>
                                <StatusBadge
                                    tone={TICKET_STATUS_META[detailTicket.status]?.tone || 'neutral'}
                                    label={TICKET_STATUS_META[detailTicket.status]?.label || detailTicket.status}
                                />
                            </div>
                        </div>

                        <div className="text-center p-5 rounded-lg border border-dashed border-slate-300 bg-white">
                            <div className="mx-auto mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-2">
                                <QrCodeSvg value={detailTicket.ticketCode} size={144} />
                            </div>
                            <p className="font-mono font-semibold text-sm text-slate-900 tracking-wider">
                                {detailTicket.ticketCode}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Tunjukkan kode unik ini di gerbang masuk lokasi acara
                            </p>
                        </div>

                        <dl className="space-y-2 text-xs border-t border-slate-200 pt-3">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Nama Peserta</dt>
                                <dd className="font-medium text-slate-900">{detailTicket.attendeeName}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Email</dt>
                                <dd className="font-medium text-slate-900">{detailTicket.attendeeEmail}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">No. WhatsApp / Telepon</dt>
                                <dd className="font-medium text-slate-900 font-mono">
                                    {detailTicket.attendeePhone}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Invoice Induk</dt>
                                <dd className="font-mono font-medium text-slate-900">
                                    #{detailTicket.orderReference}
                                </dd>
                            </div>
                            {detailTicket.checkedInAtFormatted && (
                                <div className="flex items-center justify-between gap-2">
                                    <dt className="text-slate-500">Check-In Pada</dt>
                                    <dd className="font-medium text-slate-900 tabular-nums">
                                        {detailTicket.checkedInAtFormatted}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Check-In Manual */}
            <Modal
                open={Boolean(checkInConfirmTicket)}
                onClose={() => setCheckInConfirmTicket(null)}
                title="Check-In Manual Tiket?"
                description={
                    checkInConfirmTicket
                        ? `Peserta: ${checkInConfirmTicket.attendeeName}`
                        : null
                }
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCheckInConfirmTicket(null)}
                        >
                            Batal
                        </Button>
                        {checkInConfirmTicket && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleCheckIn(checkInConfirmTicket)}
                            >
                                Ya, Check-In Tiket
                            </Button>
                        )}
                    </>
                }
            >
                {checkInConfirmTicket && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Tindakan ini akan mengesahkan kehadiran peserta untuk tiket{' '}
                        <strong className="font-mono text-slate-900">
                            {checkInConfirmTicket.ticketCode}
                        </strong>{' '}
                        pada event <strong className="text-slate-900">{checkInConfirmTicket.event.title}</strong>.
                    </p>
                )}
            </Modal>
        </AdminLayout>
    );
}
