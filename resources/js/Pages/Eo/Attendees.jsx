import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Card,
    CardHeader,
    eoButtonClass,
    StatCard,
    StatusBadge,
    UnderlineTabs,
} from '../../Components/eo/Primitives';
import {
    CheckCircle2,
    Download,
    QrCode,
    Search,
    Ticket,
    Users,
    Wallet,
} from 'lucide-react';

const TICKET_STATUS_MAP = {
    ACTIVE: { tone: 'warning', label: 'Siap Check-in' },
    USED: { tone: 'success', label: 'Sudah Check-in' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
};

function formatPaginationLabel(label) {
    if (label.includes('Previous')) return 'Sebelumnya';
    if (label.includes('Next')) return 'Berikutnya';
    return label;
}

export default function EoAttendees({
    organizerName,
    events = [],
    filters = { eventId: '', ticketStatus: 'ALL', search: '' },
    summary = {},
    ticketTypeBreakdown = [],
    attendees = { data: [], links: [], total: 0, from: null, to: null },
}) {
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const applyFilters = (overrides = {}) => {
        const nextEventId =
            overrides.eventId !== undefined ? overrides.eventId : filters.eventId;
        const nextStatus =
            overrides.ticketStatus !== undefined
                ? overrides.ticketStatus
                : filters.ticketStatus;
        const nextSearch =
            overrides.search !== undefined ? overrides.search : searchInput;

        const query = {};
        if (nextEventId) query.event_id = nextEventId;
        if (nextStatus && nextStatus !== 'ALL') query.ticket_status = nextStatus;
        if (nextSearch.trim() !== '') query.search = nextSearch.trim();

        router.get('/eo/attendees', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (searchInput === (filters.search || '')) return;

        const timer = setTimeout(() => {
            applyFilters({ search: searchInput });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const exportParams = new URLSearchParams();
    if (filters.eventId) exportParams.set('event_id', filters.eventId);
    if (filters.ticketStatus && filters.ticketStatus !== 'ALL') {
        exportParams.set('ticket_status', filters.ticketStatus);
    }
    if (searchInput.trim() !== '') exportParams.set('search', searchInput.trim());
    const exportUrl = `/eo/attendees/export${
        exportParams.toString() ? `?${exportParams.toString()}` : ''
    }`;

    const rows = attendees.data || [];
    const attendanceRate = summary.attendanceRate ?? 0;

    return (
        <EoLayout
            title="Peserta & Laporan Penjualan"
            organizerName={organizerName}
        >
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Peserta &amp; Laporan Penjualan
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Pantau rincian pendapatan per kategori tiket dan kelola daftar peserta event Anda.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={
                            filters.eventId
                                ? `/eo/check-in?event_id=${filters.eventId}`
                                : '/eo/check-in'
                        }
                        className={eoButtonClass('outline', 'md')}
                    >
                        <QrCode className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        Buka Scanner Check-in
                    </Link>
                    <a href={exportUrl} className={eoButtonClass('primary', 'md')}>
                        <Download className="size-4" strokeWidth={2} aria-hidden="true" />
                        Export CSV
                    </a>
                </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total pendapatan"
                    icon={Wallet}
                    value={summary.formattedRevenue || 'Rp0'}
                    subtext={`Dari ${summary.paidOrdersCount ?? 0} pesanan lunas`}
                />

                <StatCard
                    label="Tiket terjual"
                    icon={Ticket}
                    value={summary.totalTicketsSold ?? 0}
                    valueSuffix="tiket"
                    subtext={`${summary.pendingCheckInCount ?? 0} menunggu check-in`}
                />

                <StatCard
                    label="Sudah check-in"
                    icon={CheckCircle2}
                    value={summary.checkedInCount ?? 0}
                    valueSuffix="peserta"
                    subtext={`Dari ${summary.totalTicketsSold ?? 0} tiket valid`}
                />

                <StatCard
                    label="Tingkat kehadiran"
                    icon={Users}
                    value={`${attendanceRate}%`}
                    valueSuffix="hadir"
                    progress={attendanceRate}
                />
            </div>

            {/* Breakdown Penjualan per Jenis Tiket */}
            <Card as="section" className="overflow-hidden">
                <CardHeader
                    title="Laporan Penjualan per Kategori Tiket"
                    description="Ringkasan kuota, jumlah terjual, kehadiran, dan total pendapatan per jenis tiket."
                />

                <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby="breakdown-table-caption"
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <table className="w-full text-left text-sm">
                        <caption id="breakdown-table-caption" className="sr-only">
                            Ringkasan penjualan dan pendapatan per kategori tiket
                        </caption>
                        <thead className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                            <tr>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Event
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Kategori tiket
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Terjual / kuota
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Check-in
                                </th>
                                <th scope="col" className="py-3 px-5 text-right font-medium">
                                    Pendapatan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ticketTypeBreakdown.length > 0 ? (
                                ticketTypeBreakdown.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50/70 transition-colors"
                                    >
                                        <td className="py-3 px-5 font-medium text-gray-900">
                                            {item.eventTitle}
                                        </td>
                                        <td className="py-3 px-5 text-gray-700">
                                            {item.ticketTypeName}
                                        </td>
                                        <td className="py-3 px-5 tabular-nums text-gray-700">
                                            <span className="font-medium text-gray-900">
                                                {item.soldCount}
                                            </span>{' '}
                                            <span className="text-gray-500">
                                                / {item.initialQuota}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 tabular-nums text-gray-700">
                                            {item.checkedInCount} hadir
                                        </td>
                                        <td className="py-3 px-5 text-right font-medium text-gray-900 tabular-nums">
                                            {item.formattedRevenue}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-10 px-5 text-center text-sm text-gray-500"
                                    >
                                        Belum ada kategori tiket untuk event yang dipilih.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Daftar Peserta & E-Tiket */}
            <Card as="section" className="overflow-hidden">
                <UnderlineTabs
                    activeKey={filters.ticketStatus || 'ALL'}
                    onChange={(status) => applyFilters({ ticketStatus: status })}
                    items={[
                        ['ALL', 'Semua Peserta', summary.totalTicketsSold ?? 0],
                        ['ACTIVE', 'Siap Check-in', summary.pendingCheckInCount ?? 0],
                        ['USED', 'Sudah Check-in', summary.checkedInCount ?? 0],
                        ['CANCELLED', 'Dibatalkan', '—'],
                    ]}
                />

                {/* Filter Controls */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        applyFilters({ search: searchInput });
                    }}
                    className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-200 bg-white"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-80">
                            <label htmlFor="attendee-search" className="sr-only">
                                Cari kode tiket, nama peserta, email, atau nomor pesanan
                            </label>
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            <input
                                id="attendee-search"
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari kode tiket, nama, email, no. order..."
                                className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                            />
                        </div>

                        <div className="w-full sm:w-64">
                            <label htmlFor="attendee-event-filter" className="sr-only">
                                Filter berdasarkan event
                            </label>
                            <select
                                id="attendee-event-filter"
                                value={filters.eventId || ''}
                                onChange={(e) => applyFilters({ eventId: e.target.value })}
                                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                            >
                                <option value="">Semua event</option>
                                {events.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 tabular-nums">
                        Total{' '}
                        <span className="font-medium text-gray-900">
                            {attendees.total ?? rows.length}
                        </span>{' '}
                        peserta
                    </p>
                </form>

                {/* Attendees Table */}
                <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby="attendees-table-caption"
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <table className="w-full text-left text-sm">
                        <caption id="attendees-table-caption" className="sr-only">
                            Daftar peserta dan status check-in e-tiket
                        </caption>
                        <thead className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                            <tr>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Kode e-tiket
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Peserta
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Event &amp; tiket
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Pesanan
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rows.length > 0 ? (
                                rows.map((ticket) => {
                                    const statusInfo =
                                        TICKET_STATUS_MAP[ticket.status] ||
                                        TICKET_STATUS_MAP.ACTIVE;

                                    return (
                                        <tr
                                            key={ticket.id}
                                            className="hover:bg-gray-50/70 transition-colors"
                                        >
                                            <td className="py-3.5 px-5 align-top">
                                                <span className="font-mono text-xs font-medium text-gray-900">
                                                    {ticket.ticketCode}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {ticket.attendeeName}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {ticket.attendeeEmail}
                                                    {ticket.attendeePhone !== '-'
                                                        ? ` · ${ticket.attendeePhone}`
                                                        : ''}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="text-sm text-gray-900">
                                                    {ticket.eventTitle}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {ticket.ticketTypeName} ·{' '}
                                                    <span className="tabular-nums">
                                                        {ticket.unitPriceFormatted}
                                                    </span>
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="font-mono text-xs text-gray-900">
                                                    {ticket.orderReference}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {ticket.paymentMethod} · {ticket.paidAtFormatted}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <StatusBadge
                                                    tone={statusInfo.tone}
                                                    label={statusInfo.label}
                                                />
                                                {ticket.checkedInAtFormatted && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {ticket.checkedInAtFormatted}
                                                        {ticket.checkedInByName
                                                            ? ` · ${ticket.checkedInByName}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 px-5 text-center">
                                        <Users
                                            className="mx-auto size-5 text-gray-400 mb-2"
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm font-medium text-gray-900">
                                            Belum ada peserta yang sesuai filter
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Tiket dari pesanan yang sudah lunas akan otomatis muncul di daftar ini.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {attendees.links && attendees.links.length > 3 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 px-5 py-3.5 text-xs text-gray-600">
                        <p className="tabular-nums">
                            Menampilkan {attendees.from ?? 0}–{attendees.to ?? 0} dari{' '}
                            {attendees.total ?? 0} peserta
                        </p>
                        <nav aria-label="Paginasi daftar peserta" className="flex flex-wrap gap-1.5">
                            {attendees.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        preserveState
                                        className={eoButtonClass(
                                            link.active ? 'primary' : 'outline',
                                            'sm',
                                            'min-w-8'
                                        )}
                                    >
                                        {formatPaginationLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span
                                        key={`${link.label}-${index}`}
                                        aria-disabled="true"
                                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-200 px-2.5 text-xs text-gray-400"
                                    >
                                        {formatPaginationLabel(link.label)}
                                    </span>
                                )
                            )}
                        </nav>
                    </div>
                )}
            </Card>
        </EoLayout>
    );
}
