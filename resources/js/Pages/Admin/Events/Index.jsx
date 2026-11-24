import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Calendar,
    CheckCircle2,
    Search,
    MapPin,
    ExternalLink,
    X,
    PlusCircle,
    Ban,
    Trash2,
    Globe,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../../Components/ui/UnderlineTabs';
import { Pagination } from '../../../Components/ui/Pagination';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const EVENT_STATUS_META = {
    PUBLISHED: { tone: 'success', label: 'Published' },
    PENDING_REVIEW: { tone: 'warning', label: 'Pending Review' },
    DRAFT: { tone: 'neutral', label: 'Draft' },
    CANCELLED: { tone: 'danger', label: 'Cancelled' },
    REJECTED: { tone: 'danger', label: 'Rejected' },
};

const TEXTAREA_CLASS =
    'w-full p-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function AdminEventsIndex({
    events = { data: [], links: [] },
    categories = [],
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    const [rejectingEvent, setRejectingEvent] = useState(null);
    const [cancellingEvent, setCancellingEvent] = useState(null);
    const [detailEvent, setDetailEvent] = useState(null);
    const [deletingEvent, setDeletingEvent] = useState(null);
    const [processingApproveId, setProcessingApproveId] = useState(null);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            category: newFilters.category !== undefined ? newFilters.category : selectedCategory,
            sort: newFilters.sort !== undefined ? newFilters.sort : selectedSort,
        };

        if (!queryParams.search) delete queryParams.search;
        if (queryParams.status === 'ALL') delete queryParams.status;
        if (queryParams.category === 'ALL') delete queryParams.category;
        if (queryParams.sort === 'latest') delete queryParams.sort;

        router.get('/admin/events', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleStatusTabChange = (status) => {
        setSelectedStatus(status);
        applyFilters({ status });
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        applyFilters({ category });
    };

    const handleSortChange = (sort) => {
        setSelectedSort(sort);
        applyFilters({ sort });
    };

    const handleApprove = (evt) => {
        setProcessingApproveId(evt.id);
        router.post(
            `/admin/events/${evt.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingApproveId(null),
            }
        );
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectingEvent) return;

        rejectForm.post(`/admin/events/${rejectingEvent.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingEvent(null);
                rejectForm.reset();
            },
        });
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        if (!cancellingEvent) return;

        cancelForm.post(`/admin/events/${cancellingEvent.id}/cancel`, {
            preserveScroll: true,
            onSuccess: () => {
                setCancellingEvent(null);
                cancelForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingEvent) return;

        router.delete(`/admin/events/${deletingEvent.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingEvent(null),
        });
    };

    const statusTabs = [
        ['ALL', 'Semua Event', stats.total ?? 0],
        ['PUBLISHED', 'Published', stats.published ?? 0],
        ['DRAFT', 'Draft', stats.draft ?? 0],
        ['PENDING_REVIEW', 'Pending Review', stats.pendingReview ?? 0],
        ['CANCELLED', 'Cancelled', stats.cancelled ?? 0],
        ['REJECTED', 'Rejected', stats.rejected ?? 0],
    ];

    return (
        <AdminLayout title="Kelola Event">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Kelola Event
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Kelola moderasi publikasi, status acara, dan pantau kuota tiket dari seluruh penyelenggara.
                    </p>
                </div>

                <Link href="/eo/events/create" className={buttonClass('primary', 'md')}>
                    <PlusCircle className="size-4" aria-hidden="true" />
                    <span>Buat Event Baru</span>
                </Link>
            </div>

            {/* Filter & Table Container */}
            <Card className="overflow-hidden">
                <UnderlineTabs
                    items={statusTabs}
                    activeKey={selectedStatus}
                    onChange={handleStatusTabChange}
                />

                {/* Search & Filter Bar */}
                <div className="px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/40">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama event, venue, atau EO..."
                            aria-label="Cari event"
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

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="event-category-filter" className="font-medium">
                                Kategori:
                            </label>
                            <select
                                id="event-category-filter"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="event-sort-filter" className="font-medium">
                                Urutkan:
                            </label>
                            <select
                                id="event-sort-filter"
                                value={selectedSort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="starts_soon">Waktu Mulai Terdekat</option>
                                <option value="title_asc">Judul (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="py-3 px-5">Event & Jadwal</th>
                                <th scope="col" className="py-3 px-5">Penyelenggara</th>
                                <th scope="col" className="py-3 px-5">Kategori & Waktu</th>
                                <th scope="col" className="py-3 px-5">Lokasi</th>
                                <th scope="col" className="py-3 px-5">Tiket Terjual</th>
                                <th scope="col" className="py-3 px-5">Status</th>
                                <th scope="col" className="py-3 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.data && events.data.length > 0 ? (
                                events.data.map((evt, idx) => {
                                    const statusMeta = EVENT_STATUS_META[evt.status] || {
                                        tone: 'neutral',
                                        label: evt.status,
                                    };

                                    return (
                                        <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-900">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-none">
                                                            {evt.monthBadge}
                                                        </span>
                                                        <span className="text-sm font-semibold tabular-nums leading-none mt-1">
                                                            {evt.dayBadge}
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0 max-w-xs">
                                                        <p className="font-medium text-slate-900 leading-snug line-clamp-2">
                                                            {evt.title}
                                                        </p>
                                                        <span className="text-xs font-mono text-slate-400">
                                                            #EVT-{String(idx + 1).padStart(3, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <p className="font-medium text-slate-900 text-sm leading-snug">
                                                    <span>{evt.organizerName}</span>
                                                    {evt.isVerifiedEo && (
                                                        <CheckCircle2
                                                            className="inline-block size-3.5 text-brand-blue ml-1.5 align-text-bottom"
                                                            aria-label="Penyelenggara terverifikasi"
                                                        />
                                                    )}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5 whitespace-nowrap">
                                                <NeutralTag>{evt.category}</NeutralTag>
                                                <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                                                    {evt.startsAtFormatted}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <p className="text-xs font-medium text-slate-800">
                                                    {evt.venueName}
                                                </p>
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                    {evt.eventType === 'ONLINE' ? (
                                                        <>
                                                            <Globe className="size-3 text-slate-400" aria-hidden="true" />
                                                            Online Event
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MapPin className="size-3 text-slate-400" aria-hidden="true" />
                                                            {evt.city || 'Offline'}
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center justify-between text-xs text-slate-700 mb-1.5 max-w-[130px] tabular-nums">
                                                    <span className="font-medium">
                                                        {evt.ticketsSold.toLocaleString('id-ID')} /{' '}
                                                        {evt.initialQuota.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-slate-500 ml-2">
                                                        {evt.soldPercentage}%
                                                    </span>
                                                </div>
                                                <div className="w-28 h-1 rounded-xs bg-slate-200 overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-blue transition-all duration-300"
                                                        style={{ width: `${Math.min(100, evt.soldPercentage)}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <StatusBadge
                                                    tone={statusMeta.tone}
                                                    label={statusMeta.label}
                                                />
                                            </td>

                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setDetailEvent(evt)}
                                                    >
                                                        Detail
                                                    </Button>

                                                    {evt.status === 'PENDING_REVIEW' && (
                                                        <>
                                                            <Button
                                                                variant="primary"
                                                                size="xs"
                                                                loading={processingApproveId === evt.id}
                                                                onClick={() => handleApprove(evt)}
                                                            >
                                                                {processingApproveId === evt.id ? '...' : 'Approve'}
                                                            </Button>
                                                            <Button
                                                                variant="danger-outline"
                                                                size="xs"
                                                                onClick={() => {
                                                                    rejectForm.reset();
                                                                    rejectForm.clearErrors();
                                                                    setRejectingEvent(evt);
                                                                }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {evt.status === 'PUBLISHED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                cancelForm.reset();
                                                                cancelForm.clearErrors();
                                                                setCancellingEvent(evt);
                                                            }}
                                                            className={buttonClass('danger-outline', 'icon')}
                                                            title="Tarik / Batalkan Event"
                                                            aria-label={`Batalkan event ${evt.title}`}
                                                        >
                                                            <Ban className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                    )}

                                                    {evt.status === 'DRAFT' && (
                                                        <>
                                                            <Button
                                                                variant="primary"
                                                                size="xs"
                                                                onClick={() => handleApprove(evt)}
                                                            >
                                                                Publish
                                                            </Button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingEvent(evt)}
                                                                className={buttonClass('danger-outline', 'icon')}
                                                                title="Hapus Event"
                                                                aria-label={`Hapus event ${evt.title}`}
                                                            >
                                                                <Trash2 className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        <Calendar className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada event ditemukan.
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Coba sesuaikan kata kunci pencarian atau filter status.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    links={events.links}
                    from={events.from}
                    to={events.to}
                    total={events.total}
                    itemLabel="event"
                />
            </Card>

            {/* Modal 1: Reject Event */}
            <Modal
                open={Boolean(rejectingEvent)}
                onClose={() => setRejectingEvent(null)}
                title="Tolak Publikasi Event"
                description={
                    rejectingEvent
                        ? `Berikan catatan revisi untuk penyelenggara: ${rejectingEvent.title}`
                        : null
                }
                maxWidth="max-w-lg"
            >
                {rejectingEvent && (
                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="admin-event-reject-reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Catatan Revisi / Alasan Penolakan <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="admin-event-reject-reason"
                                rows={4}
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                placeholder="Jelaskan bagian deskripsi, jadwal, atau kelengkapan yang perlu diperbaiki oleh EO..."
                                className={TEXTAREA_CLASS}
                                required
                            />
                            {rejectForm.errors.rejection_reason && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">
                                    {rejectForm.errors.rejection_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button variant="outline" size="sm" onClick={() => setRejectingEvent(null)}>
                                Batal
                            </Button>
                            <Button type="submit" variant="danger" size="sm" loading={rejectForm.processing}>
                                {rejectForm.processing ? 'Menyimpan...' : 'Tolak & Kembalikan ke EO'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal 2: Cancel / Take Down Event */}
            <Modal
                open={Boolean(cancellingEvent)}
                onClose={() => setCancellingEvent(null)}
                title="Tarik / Batalkan Event Publik"
                description={
                    cancellingEvent
                        ? `Event "${cancellingEvent.title}" akan diturunkan dari katalog publik.`
                        : null
                }
                maxWidth="max-w-lg"
            >
                {cancellingEvent && (
                    <form onSubmit={handleCancelSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="admin-event-cancel-reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Alasan Pembatalan / Take Down <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="admin-event-cancel-reason"
                                rows={4}
                                value={cancelForm.data.cancellation_reason}
                                onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                placeholder="Contoh: Pembatalan oleh pihak berwenang, pelanggaran syarat ketentuan, atau force majeure..."
                                className={TEXTAREA_CLASS}
                                required
                            />
                            {cancelForm.errors.cancellation_reason && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button variant="outline" size="sm" onClick={() => setCancellingEvent(null)}>
                                Batal
                            </Button>
                            <Button type="submit" variant="danger" size="sm" loading={cancelForm.processing}>
                                {cancelForm.processing ? 'Memproses...' : 'Ya, Batalkan Event'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal 3: Detail Event Quick View */}
            <Modal
                open={Boolean(detailEvent)}
                onClose={() => setDetailEvent(null)}
                title={detailEvent?.title || 'Detail Event'}
                description={
                    detailEvent
                        ? `Oleh: ${detailEvent.organizerName} (${detailEvent.organizerEmail})`
                        : null
                }
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex w-full items-center justify-between gap-2">
                        {detailEvent?.status === 'PUBLISHED' ? (
                            <Link
                                href={`/event/${detailEvent.slug}`}
                                className={buttonClass('outline', 'sm')}
                            >
                                <span>Buka Halaman Publik Event</span>
                                <ExternalLink className="size-3.5 text-slate-400" aria-hidden="true" />
                            </Link>
                        ) : (
                            <div />
                        )}

                        <Button variant="outline" size="sm" onClick={() => setDetailEvent(null)}>
                            Tutup
                        </Button>
                    </div>
                }
            >
                {detailEvent && (
                    <div className="space-y-4 text-sm text-slate-700">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <NeutralTag>{detailEvent.category}</NeutralTag>
                            <StatusBadge
                                tone={EVENT_STATUS_META[detailEvent.status]?.tone || 'neutral'}
                                label={EVENT_STATUS_META[detailEvent.status]?.label || detailEvent.status}
                            />
                        </div>

                        <div className="rounded-lg overflow-hidden max-h-48 bg-slate-100 border border-slate-200">
                            <img
                                src={detailEvent.banner}
                                alt={detailEvent.title}
                                className="w-full h-48 object-cover"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                            <div>
                                <p className="font-medium text-slate-500">Jadwal Acara</p>
                                <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                                    {detailEvent.startsAtFormatted}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-500">Lokasi / Venue</p>
                                <p className="font-semibold text-slate-900 mt-0.5">{detailEvent.location}</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-500">Tiket Terjual / Kuota</p>
                                <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                                    {detailEvent.ticketsSold} / {detailEvent.initialQuota} ({detailEvent.soldPercentage}%)
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-500">Status Saat Ini</p>
                                <p className="font-semibold text-slate-900 mt-0.5">
                                    {EVENT_STATUS_META[detailEvent.status]?.label || detailEvent.status}
                                </p>
                            </div>
                        </div>

                        {detailEvent.rejectionReason && (
                            <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800 text-xs">
                                <p className="font-semibold">Catatan Evaluasi / Penolakan Terakhir:</p>
                                <p className="mt-1 leading-relaxed">{detailEvent.rejectionReason}</p>
                            </div>
                        )}

                        {detailEvent.cancellationReason && (
                            <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800 text-xs">
                                <p className="font-semibold">Alasan Penarikan / Pembatalan:</p>
                                <p className="mt-1 leading-relaxed">{detailEvent.cancellationReason}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1.5">Deskripsi Singkat Acara</p>
                            <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                                {detailEvent.description}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal 4: Konfirmasi Hapus Draft Event */}
            <Modal
                open={Boolean(deletingEvent)}
                onClose={() => setDeletingEvent(null)}
                title="Hapus Event Permanen?"
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setDeletingEvent(null)}>
                            Batal
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
                            Ya, Hapus Event
                        </Button>
                    </>
                }
            >
                {deletingEvent && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Hapus draft event{' '}
                        <span className="font-semibold text-slate-900">{deletingEvent.title}</span> secara
                        permanen? Tindakan ini tidak dapat dibatalkan.
                    </p>
                )}
            </Modal>
        </AdminLayout>
    );
}
