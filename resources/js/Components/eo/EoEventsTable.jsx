import React, { useEffect, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Card,
    EoButton,
    eoButtonClass,
    NativeModal,
    StatusBadge,
    UnderlineTabs,
} from './Primitives';
import { CalendarDays, MoreHorizontal, Search } from 'lucide-react';

const EVENT_STATUS_MAP = {
    PUBLISHED: { tone: 'success', label: 'Published' },
    PENDING_REVIEW: { tone: 'warning', label: 'Menunggu Review' },
    REJECTED: { tone: 'danger', label: 'Perlu Revisi' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
    DRAFT: { tone: 'neutral', label: 'Draft' },
};

/**
 * Shared EO event management table with status filter tabs, search, row action menu,
 * and native modal cancellation flow.
 */
export default function EoEventsTable({
    myEvents = [],
    stats = {},
    id = undefined,
    captionId = 'eo-events-table-caption',
    className = '',
}) {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingReviewId, setSubmittingReviewId] = useState(null);
    const [cancellingEvent, setCancellingEvent] = useState(null);
    const [actionMenu, setActionMenu] = useState(null);

    const cancelForm = useForm({
        cancellation_reason: '',
    });

    useEffect(() => {
        if (!actionMenu) return;

        const closeMenu = () => setActionMenu(null);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', closeMenu, true);
        window.addEventListener('resize', closeMenu);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', closeMenu, true);
            window.removeEventListener('resize', closeMenu);
        };
    }, [actionMenu]);

    const handleQuickSubmitReview = (eventId) => {
        setSubmittingReviewId(eventId);
        router.post(
            `/eo/events/${eventId}/submit`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmittingReviewId(null),
            }
        );
    };

    const openCancelModal = (eventItem) => {
        setActionMenu(null);
        cancelForm.reset();
        cancelForm.clearErrors();
        setCancellingEvent(eventItem);
    };

    const closeCancelModal = () => {
        setCancellingEvent(null);
    };

    const toggleActionMenu = (e, eventItem) => {
        if (actionMenu?.event.id === eventItem.id) {
            setActionMenu(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const openUpwards = rect.bottom + 120 > window.innerHeight;
        setActionMenu({
            event: eventItem,
            top: openUpwards ? rect.top - 108 : rect.bottom + 4,
            right: Math.max(16, window.innerWidth - rect.right),
        });
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        if (!cancellingEvent) return;

        cancelForm.post(`/eo/events/${cancellingEvent.id}/cancel`, {
            preserveScroll: true,
            onSuccess: () => {
                setCancellingEvent(null);
                cancelForm.reset();
            },
        });
    };

    const filteredEvents = myEvents.filter((event) => {
        const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            event.title.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query) ||
            event.city.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    return (
        <>
            <Card as="section" id={id} className={`overflow-hidden ${className}`}>
                <UnderlineTabs
                    activeKey={statusFilter}
                    onChange={setStatusFilter}
                    items={[
                        ['ALL', 'Semua Event', stats.totalEvents ?? myEvents.length],
                        ['PUBLISHED', 'Published', stats.publishedEvents ?? 0],
                        ['PENDING_REVIEW', 'Menunggu Review', stats.pendingEvents ?? 0],
                        ['DRAFT', 'Draft', stats.draftEvents ?? 0],
                        ['REJECTED', 'Perlu Revisi', stats.rejectedEvents ?? 0],
                        ['CANCELLED', 'Dibatalkan', stats.cancelledEvents ?? 0],
                    ]}
                />

                <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 bg-white">
                    <div className="relative w-full sm:w-80">
                        <label htmlFor="eo-event-search" className="sr-only">
                            Cari judul event, kategori, atau kota
                        </label>
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none"
                            strokeWidth={1.75}
                            aria-hidden="true"
                        />
                        <input
                            id="eo-event-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari judul event, kategori, atau kota..."
                            className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                        />
                    </div>
                    <p className="text-xs text-gray-500 tabular-nums">
                        Menampilkan{' '}
                        <span className="font-medium text-gray-900">
                            {filteredEvents.length}
                        </span>{' '}
                        dari{' '}
                        <span className="font-medium text-gray-900">
                            {myEvents.length}
                        </span>{' '}
                        event
                    </p>
                </div>

                <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby={captionId}
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <table className="w-full text-left text-sm">
                        <caption id={captionId} className="sr-only">
                            Daftar event milik organisasi
                        </caption>
                        <thead className="border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
                            <tr>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Informasi event
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Jadwal &amp; lokasi
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Status
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Penjualan / kuota
                                </th>
                                <th scope="col" className="py-3 px-5 font-medium">
                                    Pendapatan
                                </th>
                                <th scope="col" className="py-3 px-5 text-right font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => {
                                    const soldPercent =
                                        event.initialQuota > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      (event.ticketsSold / event.initialQuota) *
                                                          100
                                                  )
                                              )
                                            : 0;
                                    const statusInfo =
                                        EVENT_STATUS_MAP[event.status] || EVENT_STATUS_MAP.DRAFT;

                                    return (
                                        <tr
                                            key={event.id}
                                            className="hover:bg-gray-50/70 transition-colors"
                                        >
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={event.banner}
                                                        alt=""
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="size-11 rounded-md object-cover border border-gray-200 bg-gray-100 shrink-0"
                                                    />
                                                    <div className="min-w-0 max-w-xs">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {event.title}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-gray-500">
                                                            {event.category}
                                                        </p>
                                                        {event.status === 'REJECTED' &&
                                                            event.rejectionReason && (
                                                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                                                    <span className="font-medium text-gray-900">
                                                                        Revisi:
                                                                    </span>{' '}
                                                                    {event.rejectionReason}
                                                                </p>
                                                            )}
                                                        {event.status === 'CANCELLED' &&
                                                            event.cancellationReason && (
                                                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                                                    <span className="font-medium text-gray-700">
                                                                        Alasan batal:
                                                                    </span>{' '}
                                                                    {event.cancellationReason}
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <p className="text-sm text-gray-900">
                                                    {event.dateFormatted}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500 truncate max-w-48">
                                                    {event.city} · {event.location}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <StatusBadge
                                                    tone={statusInfo.tone}
                                                    label={statusInfo.label}
                                                />
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <div className="w-36">
                                                    <div className="flex items-baseline justify-between text-xs tabular-nums">
                                                        <span className="font-medium text-gray-900">
                                                            {event.ticketsSold} terjual
                                                        </span>
                                                        <span className="text-gray-500">
                                                            / {event.initialQuota}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-xs bg-gray-200">
                                                        <div
                                                            className="h-full bg-blue-600"
                                                            style={{ width: `${soldPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5 text-sm font-medium text-gray-900 tabular-nums">
                                                {event.formattedRevenue}
                                            </td>

                                            <td className="py-3.5 px-5 text-right">
                                                {event.status !== 'CANCELLED' ? (
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        {event.status === 'PUBLISHED' && (
                                                            <Link
                                                                href={`/event/${event.slug}`}
                                                                aria-label={`Lihat ${event.title}`}
                                                                className={eoButtonClass(
                                                                    'outline',
                                                                    'sm'
                                                                )}
                                                            >
                                                                Lihat
                                                            </Link>
                                                        )}

                                                        <Link
                                                            href={`/eo/events/${event.id}/edit`}
                                                            aria-label={`Edit ${event.title}`}
                                                            className={eoButtonClass('outline', 'sm')}
                                                        >
                                                            Edit
                                                        </Link>

                                                        {(event.status === 'DRAFT' ||
                                                            event.status === 'REJECTED') && (
                                                            <EoButton
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    submittingReviewId === event.id
                                                                }
                                                                onClick={() =>
                                                                    handleQuickSubmitReview(
                                                                        event.id
                                                                    )
                                                                }
                                                            >
                                                                {submittingReviewId === event.id
                                                                    ? '...'
                                                                    : 'Ajukan Review'}
                                                            </EoButton>
                                                        )}

                                                        <EoButton
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-8 px-0 text-gray-600"
                                                            aria-haspopup="menu"
                                                            aria-expanded={
                                                                actionMenu?.event.id === event.id
                                                            }
                                                            aria-label={`Aksi lainnya untuk ${event.title}`}
                                                            onClick={(e) =>
                                                                toggleActionMenu(e, event)
                                                            }
                                                        >
                                                            <MoreHorizontal
                                                                className="size-4"
                                                                strokeWidth={1.75}
                                                                aria-hidden="true"
                                                            />
                                                        </EoButton>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 px-5 text-center">
                                        <CalendarDays
                                            className="mx-auto size-5 text-gray-400 mb-2"
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm font-medium text-gray-900">
                                            Belum ada event pada kategori ini
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Gunakan tombol Buat Event &amp; Tiket Baru untuk menambahkan acara.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {actionMenu && (
                <>
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActionMenu(null)}
                        aria-hidden="true"
                    />
                    <div
                        role="menu"
                        style={{
                            top: `${actionMenu.top}px`,
                            right: `${actionMenu.right}px`,
                        }}
                        className="fixed z-40 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-sm"
                    >
                        <Link
                            href={`/eo/attendees?event_id=${actionMenu.event.id}`}
                            role="menuitem"
                            onClick={() => setActionMenu(null)}
                            className="block w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Peserta &amp; laporan
                        </Link>
                        {actionMenu.event.status === 'PUBLISHED' && (
                            <Link
                                href={`/eo/check-in?event_id=${actionMenu.event.id}`}
                                role="menuitem"
                                onClick={() => setActionMenu(null)}
                                className="block w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Scanner check-in
                            </Link>
                        )}
                        <Link
                            href={`/eo/staff?event_id=${actionMenu.event.id}`}
                            role="menuitem"
                            onClick={() => setActionMenu(null)}
                            className="block w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Kelola staff
                        </Link>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => openCancelModal(actionMenu.event)}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                        >
                            Batalkan event
                        </button>
                    </div>
                </>
            )}

            <NativeModal
                open={Boolean(cancellingEvent)}
                onClose={closeCancelModal}
                titleId="cancel-event-title"
                title="Konfirmasi Pembatalan Event"
            >
                {cancellingEvent && (
                    <form onSubmit={handleCancelSubmit} className="space-y-4">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            <p className="font-medium text-gray-900">
                                {cancellingEvent.title}
                            </p>
                            <p className="mt-1">
                                Event yang dibatalkan akan ditarik dari katalog publik dan tidak dapat menerima penjualan tiket baru.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="cancellation_reason"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Alasan Pembatalan Resmi <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                id="cancellation_reason"
                                name="cancellation_reason"
                                rows={3}
                                required
                                minLength={10}
                                value={cancelForm.data.cancellation_reason}
                                onChange={(e) =>
                                    cancelForm.setData('cancellation_reason', e.target.value)
                                }
                                placeholder="Jelaskan alasan pembatalan acara ini (minimal 10 karakter)..."
                                className="mt-1.5 w-full rounded-md border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                            />
                            {cancelForm.errors.cancellation_reason && (
                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <EoButton
                                variant="outline"
                                size="md"
                                onClick={closeCancelModal}
                            >
                                Tutup
                            </EoButton>
                            <EoButton
                                type="submit"
                                variant="danger"
                                size="md"
                                disabled={cancelForm.processing}
                            >
                                {cancelForm.processing
                                    ? 'Membatalkan...'
                                    : 'Konfirmasi Batalkan Event'}
                            </EoButton>
                        </div>
                    </form>
                )}
            </NativeModal>
        </>
    );
}
