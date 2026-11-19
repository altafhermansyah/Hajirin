import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Calendar,
    CalendarDays,
    Building2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    MapPin,
    ExternalLink,
    Filter,
    X,
    Clock,
    Ticket,
    Eye,
    PlusCircle,
    Ban,
    Trash2,
    ChevronDown,
    SlidersHorizontal,
    Globe,
    Layers,
} from 'lucide-react';

export default function AdminEventsIndex({
    events = { data: [], links: [] },
    categories = [],
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    // Filters
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    // Modals
    const [rejectingEvent, setRejectingEvent] = useState(null);
    const [cancellingEvent, setCancellingEvent] = useState(null);
    const [detailEvent, setDetailEvent] = useState(null);
    const [processingApproveId, setProcessingApproveId] = useState(null);

    // Forms
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

    const handleDelete = (evt) => {
        if (!confirm(`Hapus event "${evt.title}" secara permanen?`)) return;

        router.delete(`/admin/events/${evt.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Kelola Event">
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

            {/* Page Header matching mockup */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            Kelola Event
                        </h1>
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
                            Total {stats.total ?? 0} Event
                        </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Kelola event, review, kurasi dan publikasi, serta pantau kuota tiket seluruh penyelenggara.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/eo/events/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                        <PlusCircle className="size-4" />
                        Buat Event Baru
                    </Link>
                </div>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Status Tabs matching mockup */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 pt-4 overflow-x-auto scrollbar-none">
                    {[
                        ['ALL', 'Semua Event', stats.total ?? 0, 'bg-slate-100 text-slate-700'],
                        ['PUBLISHED', 'Published', stats.published ?? 0, 'bg-emerald-50 text-emerald-700'],
                        ['DRAFT', 'Draft', stats.draft ?? 0, 'bg-slate-100 text-slate-700'],
                        ['PENDING_REVIEW', 'Pending Review', stats.pendingReview ?? 0, 'bg-amber-50 text-amber-700'],
                        ['CANCELLED', 'Cancelled', stats.cancelled ?? 0, 'bg-red-50 text-red-700'],
                        ['REJECTED', 'Rejected', stats.rejected ?? 0, 'bg-rose-50 text-rose-700'],
                    ].map(([key, label, count, badgeClass]) => {
                        const isTabActive = selectedStatus === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleStatusTabChange(key)}
                                className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                    isTabActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {label}
                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Filter Bar */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama event, venue, atau EO..."
                            className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    applyFilters({ search: '' });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Kategori Filter */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Kategori:</span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                            >
                                <option value="ALL">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Urutkan:</span>
                            <select
                                value={selectedSort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="starts_soon">Waktu Mulai Terdekat</option>
                                <option value="title_asc">Judul (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data matching Mockup Screen 1 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="py-3.5 px-5">Event & Banner</th>
                                <th scope="col" className="py-3.5 px-5">Penyelenggara (EO)</th>
                                <th scope="col" className="py-3.5 px-5">Kategori & Tanggal</th>
                                <th scope="col" className="py-3.5 px-5">Lokasi / Venue</th>
                                <th scope="col" className="py-3.5 px-5">Tiket Terjual / Kuota</th>
                                <th scope="col" className="py-3.5 px-5">Status</th>
                                <th scope="col" className="py-3.5 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.data && events.data.length > 0 ? (
                                events.data.map((evt, idx) => {
                                    return (
                                        <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                                            {/* Event & Banner with Date Badge */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    {/* Date Badge Box */}
                                                    <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold shadow-2xs">
                                                        <span className="text-[10px] uppercase tracking-wider leading-none">
                                                            {evt.monthBadge}
                                                        </span>
                                                        <span className="text-base font-black leading-none mt-0.5">
                                                            {evt.dayBadge}
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0 max-w-xs">
                                                        <p className="font-bold text-slate-900 leading-snug line-clamp-2">
                                                            {evt.title}
                                                        </p>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            ID: #EVT-{String(idx + 1).padStart(3, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Penyelenggara */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                                        {evt.organizerName}
                                                    </p>
                                                    {evt.isVerifiedEo && (
                                                        <CheckCircle2
                                                            className="size-3.5 text-blue-600 shrink-0"
                                                            title="EO Terverifikasi"
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400">
                                                    {evt.isVerifiedEo ? 'EO Terverifikasi' : 'Penyelenggara Akun'}
                                                </p>
                                            </td>

                                            {/* Kategori & Tanggal */}
                                            <td className="py-4 px-5">
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                                    {evt.category}
                                                </span>
                                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                    <Clock className="size-3 text-slate-400" />
                                                    {evt.startsAtFormatted}
                                                </p>
                                            </td>

                                            {/* Lokasi / Venue */}
                                            <td className="py-4 px-5">
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {evt.venueName}
                                                </p>
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                                    {evt.eventType === 'ONLINE' ? (
                                                        <>
                                                            <Globe className="size-3 text-blue-500" />
                                                            Online Event
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MapPin className="size-3 text-slate-400" />
                                                            {evt.city || 'Offline'}
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Tiket Terjual / Kuota with Progress Bar */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1 max-w-[130px]">
                                                    <span>
                                                        {evt.ticketsSold.toLocaleString('id-ID')} /{' '}
                                                        {evt.initialQuota.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-[11px] text-emerald-600 font-bold ml-1.5">
                                                        {evt.soldPercentage}%
                                                    </span>
                                                </div>
                                                <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(100, evt.soldPercentage)}%` }}
                                                    />
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-5">
                                                {evt.status === 'PUBLISHED' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        Published
                                                    </span>
                                                )}
                                                {evt.status === 'PENDING_REVIEW' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/70">
                                                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        Pending Review
                                                    </span>
                                                )}
                                                {evt.status === 'DRAFT' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                                                        Draft
                                                    </span>
                                                )}
                                                {evt.status === 'CANCELLED' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                                                        Cancelled
                                                    </span>
                                                )}
                                                {evt.status === 'REJECTED' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aksi Kolom */}
                                            <td className="py-4 px-5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {/* Tombol Detail Preview */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailEvent(evt)}
                                                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                    >
                                                        Detail
                                                    </button>

                                                    {/* Jika PENDING_REVIEW: Approve & Reject */}
                                                    {evt.status === 'PENDING_REVIEW' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApprove(evt)}
                                                                disabled={processingApproveId === evt.id}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                                                            >
                                                                {processingApproveId === evt.id ? '...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    rejectForm.reset();
                                                                    rejectForm.clearErrors();
                                                                    setRejectingEvent(evt);
                                                                }}
                                                                className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Jika PUBLISHED: Tombol Take Down / Batalkan */}
                                                    {evt.status === 'PUBLISHED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                cancelForm.reset();
                                                                cancelForm.clearErrors();
                                                                setCancellingEvent(evt);
                                                            }}
                                                            className="p-1 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                                                            title="Tarik / Batalkan Event"
                                                        >
                                                            <Ban className="size-3.5" />
                                                        </button>
                                                    )}

                                                    {/* Jika DRAFT: Tombol Publish & Delete */}
                                                    {evt.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApprove(evt)}
                                                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                                                            >
                                                                Publish
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(evt)}
                                                                className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-slate-50 transition"
                                                                title="Hapus Event"
                                                            >
                                                                <Trash2 className="size-3.5" />
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
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <Calendar className="mx-auto size-8 text-slate-300 mb-2" />
                                        <p className="font-semibold text-slate-600">Tidak ada event ditemukan.</p>
                                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer / Pagination matching mockup */}
                {events.links && events.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>
                            Menampilkan <span className="font-semibold text-slate-900">{events.from || 0}</span> sampai{' '}
                            <span className="font-semibold text-slate-900">{events.to || 0}</span> dari{' '}
                            <span className="font-semibold text-slate-900">{events.total || 0}</span> Event
                        </p>
                        <div className="flex items-center gap-1">
                            {events.links.map((link, idx) => {
                                const cleanLabel = link.label
                                    .replace('&laquo; Previous', 'Sebelumnya')
                                    .replace('Next &raquo;', 'Berikutnya');

                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        {cleanLabel}
                                    </Link>
                                ) : (
                                    <span
                                        key={idx}
                                        className="px-2.5 py-1 text-slate-300 border border-slate-100 rounded-lg"
                                    >
                                        {cleanLabel}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal 1: Reject Event with Revision Reason */}
            {rejectingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Tolak Publikasi Event</h3>
                                <p className="text-xs text-slate-500">
                                    Berikan catatan revisi atau alasan evaluasi bagi penyelenggara: <span className="font-semibold text-slate-700">{rejectingEvent.title}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingEvent(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Catatan Revisi / Alasan Penolakan *
                                </label>
                                <textarea
                                    rows="4"
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    placeholder="Jelaskan bagian deskripsi, jadwal, atau kelengkapan yang perlu diperbaiki oleh EO..."
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                                    required
                                />
                                {rejectForm.errors.rejection_reason && (
                                    <p className="mt-1 text-xs text-red-600">{rejectForm.errors.rejection_reason}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setRejectingEvent(null)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition"
                                >
                                    {rejectForm.processing ? 'Menyimpan...' : 'Tolak & Kembalikan ke EO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Cancel / Take Down Event */}
            {cancellingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                    <Ban className="size-5" />
                                    Tarik / Batalkan Event Publik
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Event <span className="font-semibold text-slate-700">{cancellingEvent.title}</span> akan diturunkan dari katalog publik.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancellingEvent(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Alasan Pembatalan / Take Down *
                                </label>
                                <textarea
                                    rows="4"
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                    placeholder="Contoh: Pembatalan oleh pihak berwenang, pelanggaran syarat ketentuan, atau force majeure..."
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                                    required
                                />
                                {cancelForm.errors.cancellation_reason && (
                                    <p className="mt-1 text-xs text-red-600">{cancelForm.errors.cancellation_reason}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCancellingEvent(null)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                                >
                                    {cancelForm.processing ? 'Memproses...' : 'Ya, Batalkan Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Detail Event Quick View */}
            {detailEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div>
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 mb-1">
                                    {detailEvent.category}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">{detailEvent.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Oleh: {detailEvent.organizerName} ({detailEvent.organizerEmail})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailEvent(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-700">
                            <div className="rounded-xl overflow-hidden max-h-48 bg-slate-100 border border-slate-200">
                                <img
                                    src={detailEvent.banner}
                                    alt={detailEvent.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Jadwal Acara</p>
                                    <p className="font-semibold text-slate-900 mt-0.5">{detailEvent.startsAtFormatted}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Lokasi / Venue</p>
                                    <p className="font-semibold text-slate-900 mt-0.5">{detailEvent.location}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Total Kuota / Tiket Terjual</p>
                                    <p className="font-semibold text-slate-900 mt-0.5">
                                        {detailEvent.ticketsSold} / {detailEvent.initialQuota} ({detailEvent.soldPercentage}%)
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Status Saat Ini</p>
                                    <p className="font-semibold text-slate-900 mt-0.5">{detailEvent.status}</p>
                                </div>
                            </div>

                            {detailEvent.rejectionReason && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                                    <p className="font-bold">Catatan Evaluasi / Penolakan Terakhir:</p>
                                    <p className="mt-0.5">{detailEvent.rejectionReason}</p>
                                </div>
                            )}

                            {detailEvent.cancellationReason && (
                                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                                    <p className="font-bold">Alasan Penarikan / Pembatalan:</p>
                                    <p className="mt-0.5">{detailEvent.cancellationReason}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Deskripsi Singkat Acara</p>
                                <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {detailEvent.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                            {detailEvent.status === 'PUBLISHED' ? (
                                <Link
                                    href={`/event/${detailEvent.slug}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                    target="_blank"
                                >
                                    Buka Halaman Publik Event <ExternalLink className="size-3.5" />
                                </Link>
                            ) : <div />}

                            <button
                                type="button"
                                onClick={() => setDetailEvent(null)}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
