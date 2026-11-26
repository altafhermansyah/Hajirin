import React, { useEffect, useRef, useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    CheckCircle2,
    Download,
    Megaphone,
    QrCode,
    Search,
    Ticket,
    Users,
    Wallet,
} from 'lucide-react';
import { Card, CardHeader } from '../../Components/ui/Card';
import { StatCard } from '../../Components/ui/StatCard';
import { StatusBadge } from '../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../Components/ui/UnderlineTabs';
import { Pagination } from '../../Components/ui/Pagination';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';
import { Modal } from '../../Components/ui/Dialog';

const TICKET_STATUS_MAP = {
    ACTIVE: { tone: 'warning', label: 'Siap Check-in' },
    USED: { tone: 'success', label: 'Sudah Check-in' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
};

const INPUT_CLASS =
    'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function EoAttendees({
    organizerName,
    events = [],
    filters = { eventId: '', ticketStatus: 'ALL', search: '' },
    summary = {},
    ticketTypeBreakdown = [],
    attendees = { data: [], links: [], total: 0, from: null, to: null },
}) {
    const { flash } = usePage().props;
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const isFirstRender = useRef(true);

    const broadcastForm = useForm({
        event_id: filters.eventId || events[0]?.id || '',
        title: '',
        message: '',
        send_email: false,
    });

    const openBroadcastModal = () => {
        broadcastForm.setData({
            event_id: filters.eventId || events[0]?.id || '',
            title: '',
            message: '',
            send_email: false,
        });
        broadcastForm.clearErrors();
        setIsBroadcastOpen(true);
    };

    const handleBroadcastSubmit = (e) => {
        e.preventDefault();
        broadcastForm.post('/eo/broadcasts', {
            preserveScroll: true,
            onSuccess: () => {
                setIsBroadcastOpen(false);
                broadcastForm.reset('title', 'message', 'send_email');
            },
        });
    };

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
        <EoLayout title="Peserta & Laporan Penjualan" organizerName={organizerName}>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Peserta &amp; Laporan Penjualan
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pantau rincian pendapatan per kategori tiket dan kelola daftar peserta event Anda.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {events.length > 0 && (
                        <Button variant="outline" size="md" onClick={openBroadcastModal}>
                            <Megaphone className="size-4 text-slate-500" aria-hidden="true" />
                            <span>Kirim Pengumuman</span>
                        </Button>
                    )}
                    <Link
                        href={
                            filters.eventId
                                ? `/eo/check-in?event_id=${filters.eventId}`
                                : '/eo/check-in'
                        }
                        className={buttonClass('outline', 'md')}
                    >
                        <QrCode className="size-4 text-slate-500" aria-hidden="true" />
                        <span>Buka Scanner Check-in</span>
                    </Link>
                    <a href={exportUrl} className={buttonClass('primary', 'md')}>
                        <Download className="size-4" aria-hidden="true" />
                        <span>Export CSV</span>
                    </a>
                </div>
            </div>

            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

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
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                >
                    <table className="w-full text-left text-sm">
                        <caption id="breakdown-table-caption" className="sr-only">
                            Ringkasan penjualan dan pendapatan per kategori tiket
                        </caption>
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="py-3 px-5">
                                    Event
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Kategori tiket
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Terjual / kuota
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Check-in
                                </th>
                                <th scope="col" className="py-3 px-5 text-right">
                                    Pendapatan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ticketTypeBreakdown.length > 0 ? (
                                ticketTypeBreakdown.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/60 transition-colors"
                                    >
                                        <td className="py-3 px-5 font-medium text-slate-900">
                                            {item.eventTitle}
                                        </td>
                                        <td className="py-3 px-5 text-slate-700">
                                            {item.ticketTypeName}
                                        </td>
                                        <td className="py-3 px-5 tabular-nums text-slate-700">
                                            <span className="font-medium text-slate-900">
                                                {item.soldCount}
                                            </span>{' '}
                                            <span className="text-slate-400">
                                                / {item.initialQuota}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 tabular-nums text-slate-700">
                                            {item.checkedInCount} hadir
                                        </td>
                                        <td className="py-3 px-5 text-right font-medium text-slate-900 tabular-nums">
                                            {item.formattedRevenue}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-10 px-5 text-center text-sm text-slate-500"
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
                        ['CANCELLED', 'Dibatalkan', '-'],
                    ]}
                />

                {/* Filter Controls */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        applyFilters({ search: searchInput });
                    }}
                    className="px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 bg-slate-50/40"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-80">
                            <label htmlFor="attendee-search" className="sr-only">
                                Cari kode tiket, nama peserta, email, atau nomor pesanan
                            </label>
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                id="attendee-search"
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari kode tiket, nama, email, no. order..."
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
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
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
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

                    <p className="text-xs text-slate-500 tabular-nums">
                        Total{' '}
                        <span className="font-medium text-slate-900">
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
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                >
                    <table className="w-full text-left text-sm">
                        <caption id="attendees-table-caption" className="sr-only">
                            Daftar peserta dan status check-in e-tiket
                        </caption>
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="py-3 px-5">
                                    Kode e-tiket
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Peserta
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Event &amp; tiket
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Pesanan
                                </th>
                                <th scope="col" className="py-3 px-5">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length > 0 ? (
                                rows.map((ticket) => {
                                    const statusInfo =
                                        TICKET_STATUS_MAP[ticket.status] ||
                                        TICKET_STATUS_MAP.ACTIVE;

                                    return (
                                        <tr
                                            key={ticket.id}
                                            className="hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="py-3.5 px-5 align-top">
                                                <span className="font-mono text-xs font-medium text-slate-900">
                                                    {ticket.ticketCode}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {ticket.attendeeName}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {ticket.attendeeEmail}
                                                    {ticket.attendeePhone !== '-'
                                                        ? ` · ${ticket.attendeePhone}`
                                                        : ''}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="text-sm text-slate-900">
                                                    {ticket.eventTitle}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {ticket.ticketTypeName} ·{' '}
                                                    <span className="tabular-nums">
                                                        {ticket.unitPriceFormatted}
                                                    </span>
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <p className="font-mono text-xs text-slate-900">
                                                    {ticket.orderReference}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                                                    {ticket.paymentMethod} · {ticket.paidAtFormatted}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 align-top">
                                                <StatusBadge
                                                    tone={statusInfo.tone}
                                                    label={statusInfo.label}
                                                />
                                                {ticket.checkedInAtFormatted && (
                                                    <p className="mt-1 text-xs text-slate-500 tabular-nums">
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
                                            className="mx-auto size-6 text-slate-300 mb-2"
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm font-medium text-slate-800">
                                            Belum ada peserta yang sesuai filter
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Tiket dari pesanan yang sudah lunas akan otomatis muncul di daftar ini.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    links={attendees.links}
                    from={attendees.from}
                    to={attendees.to}
                    total={attendees.total}
                    itemLabel="peserta"
                />
            </Card>

            {/* Modal Kirim Pengumuman (Native <dialog>) */}
            <Modal
                open={isBroadcastOpen}
                onClose={() => {
                    if (!broadcastForm.processing) setIsBroadcastOpen(false);
                }}
                title="Kirim Pengumuman ke Peserta"
                description="Pesan akan dikirimkan ke notifikasi akun seluruh pemegang tiket aktif pada event terpilih."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="broadcast-event"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Event Tujuan
                        </label>
                        <select
                            id="broadcast-event"
                            value={broadcastForm.data.event_id}
                            onChange={(e) => broadcastForm.setData('event_id', e.target.value)}
                            className={INPUT_CLASS}
                            required
                        >
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title}
                                </option>
                            ))}
                        </select>
                        {broadcastForm.errors.event_id && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">
                                {broadcastForm.errors.event_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="broadcast-subject"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Judul Pengumuman
                        </label>
                        <input
                            id="broadcast-subject"
                            type="text"
                            value={broadcastForm.data.title}
                            onChange={(e) => broadcastForm.setData('title', e.target.value)}
                            placeholder="Contoh: Info Open Gate & Link Zoom Acara"
                            className={INPUT_CLASS}
                            required
                            minLength={4}
                            maxLength={150}
                        />
                        {broadcastForm.errors.title && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">
                                {broadcastForm.errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="broadcast-message"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                            Isi Pengumuman
                        </label>
                        <textarea
                            id="broadcast-message"
                            rows={4}
                            value={broadcastForm.data.message}
                            onChange={(e) => broadcastForm.setData('message', e.target.value)}
                            placeholder="Tulis informasi penting untuk seluruh pemegang tiket aktif..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            required
                            minLength={10}
                            maxLength={1000}
                        />
                        {broadcastForm.errors.message && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">
                                {broadcastForm.errors.message}
                            </p>
                        )}
                    </div>

                    <label
                        htmlFor="broadcast-send-email"
                        className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-3 cursor-pointer hover:bg-slate-50 transition"
                    >
                        <input
                            id="broadcast-send-email"
                            type="checkbox"
                            checked={broadcastForm.data.send_email}
                            onChange={(e) =>
                                broadcastForm.setData('send_email', e.target.checked)
                            }
                            className="mt-0.5 size-4 rounded border-slate-300 accent-brand-blue"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-semibold text-slate-900 block">
                                Kirim juga salinan pengumuman via email
                            </span>
                            Email akan dikirim melalui antrean ke alamat email seluruh pemegang
                            tiket aktif pada event ini.
                        </span>
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={broadcastForm.processing}
                            onClick={() => setIsBroadcastOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={broadcastForm.processing}
                        >
                            {broadcastForm.processing ? 'Mengirim...' : 'Kirim ke Peserta'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </EoLayout>
    );
}
