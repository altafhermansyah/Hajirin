import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    Users,
    Building2,
    Shield,
    CalendarDays,
    Search,
    AlertCircle,
    CheckCircle2,
    FileCheck2,
    ExternalLink,
    XCircle,
    Clock3,
    Phone,
    Globe,
    MapPin,
    Ticket,
    X,
} from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

export default function AdminDashboard({
    stats = {},
    eoApplications = [],
    eventsForModeration = [],
    recentUsers = [],
}) {
    const { flash } = usePage().props;
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [eoStatusFilter, setEoStatusFilter] = useState('PENDING');
    const [eventStatusFilter, setEventStatusFilter] = useState('PENDING_REVIEW');
    const [processingApproveId, setProcessingApproveId] = useState(null);
    const [processingEventApproveId, setProcessingEventApproveId] = useState(null);
    const [rejectingApplication, setRejectingApplication] = useState(null);
    const [rejectingEvent, setRejectingEvent] = useState(null);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const rejectEventForm = useForm({
        rejection_reason: '',
    });

    const handleApproveEo = (application) => {
        setProcessingApproveId(application.id);
        router.post(
            `/admin/eo-applications/${application.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingApproveId(null),
            }
        );
    };

    const openRejectModal = (application) => {
        rejectForm.reset();
        rejectForm.clearErrors();
        setRejectingApplication(application);
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectingApplication) return;

        rejectForm.post(`/admin/eo-applications/${rejectingApplication.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingApplication(null);
                rejectForm.reset();
            },
        });
    };

    const handleApproveEvent = (eventItem) => {
        setProcessingEventApproveId(eventItem.id);
        router.post(
            `/admin/events/${eventItem.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingEventApproveId(null),
            }
        );
    };

    const openRejectEventModal = (eventItem) => {
        rejectEventForm.reset();
        rejectEventForm.clearErrors();
        setRejectingEvent(eventItem);
    };

    const handleRejectEventSubmit = (e) => {
        e.preventDefault();
        if (!rejectingEvent) return;

        rejectEventForm.post(`/admin/events/${rejectingEvent.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingEvent(null);
                rejectEventForm.reset();
            },
        });
    };

    const filteredEoApplications = eoApplications.filter((app) => {
        if (eoStatusFilter === 'ALL') return true;
        return app.status === eoStatusFilter;
    });

    const filteredModerationEvents = eventsForModeration.filter((evt) => {
        if (eventStatusFilter === 'ALL') return true;
        return evt.status === eventStatusFilter;
    });

    const filteredUsers = recentUsers.filter((user) => {
        const matchesRole =
            selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            String(user.id).toLowerCase().includes(query);
        return matchesRole && matchesSearch;
    });

    return (
        <AdminLayout title="Dashboard Platform">
            {flash?.success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-xs">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <p className="font-medium">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 shadow-xs">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                    <p className="font-medium">{flash.error}</p>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Dashboard Admin & Moderasi Platform
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Pantau statistik pengguna, verifikasi berkas pengajuan EO, dan moderasi kelayakan publikasi event.
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <a
                        href="#verifikasi-eo"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                        <Building2 className="size-4" />
                        Pengajuan EO ({stats.pendingEoApplications ?? 0})
                    </a>
                    <a
                        href="#moderasi-event"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition"
                    >
                        <CalendarDays className="size-4" />
                        Moderasi Event ({stats.pendingEvents ?? 0})
                    </a>
                </div>
            </div>

            {/* Quick Attention Alert (if pending verifications exist) */}
            {(stats.pendingEoApplications > 0 || stats.pendingEvents > 0) && (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <AlertCircle className="size-5" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">
                                Butuh Tindakan Moderator Admin
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Terdapat{' '}
                                <span className="font-semibold text-amber-800">
                                    {stats.pendingEoApplications} pengajuan EO
                                </span>{' '}
                                dan{' '}
                                <span className="font-semibold text-amber-800">
                                    {stats.pendingEvents} event baru
                                </span>{' '}
                                menunggu tinjauan dan verifikasi Anda.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="#moderasi-event"
                            className="inline-flex items-center text-xs font-semibold text-amber-700 bg-white border border-amber-200 rounded-lg px-3 py-1.5 shadow-2xs hover:bg-amber-50 transition"
                        >
                            Tinjau Sekarang ↓
                        </a>
                    </div>
                </div>
            )}

            {/* Top Metric Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Peserta */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Peserta Terdaftar
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalPeserta ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Users</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <span>+{stats.totalPeserta > 0 ? stats.totalPeserta : 1} akun peserta aktif</span>
                        </p>
                    </div>
                </div>

                {/* 2. Akun Penyelenggara (EO) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Akun Penyelenggara (EO)
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Building2 className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalEo ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Accounts</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{stats.totalEo ?? 0} Terverifikasi</span>,{' '}
                            <span className="font-semibold text-amber-600">{stats.pendingEoApplications ?? 0} Pending</span>
                        </p>
                    </div>
                </div>

                {/* 3. Platform Admin & Owner */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Platform Admin & Owner
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <Shield className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalAdmin ?? 1}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Owners</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-purple-700 flex items-center gap-1">
                            <Shield className="size-3.5" />
                            Hak akses penuh (Full Access)
                        </p>
                    </div>
                </div>

                {/* 4. Total Event Platform */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Event Terdaftar
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CalendarDays className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalEvents ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Events</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-emerald-600">{stats.publishedEvents ?? 0} Published</span> ·{' '}
                            <span className="font-semibold text-amber-600">{stats.pendingEvents ?? 0} Pending</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1: Antrean Verifikasi Pengajuan EO */}
            <section
                id="verifikasi-eo"
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="size-5 text-indigo-600" />
                            Verifikasi Pengajuan Event Organizer (EO)
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Periksa berkas verifikasi gabungan (via Pre-signed URL) sebelum menyetujui perubahan role akun menjadi EO.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                        {[
                            ['PENDING', `Pending (${eoApplications.filter((a) => a.status === 'PENDING').length})`],
                            ['APPROVED', `Disetujui (${eoApplications.filter((a) => a.status === 'APPROVED').length})`],
                            ['REJECTED', `Ditolak (${eoApplications.filter((a) => a.status === 'REJECTED').length})`],
                            ['ALL', `Semua (${eoApplications.length})`],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setEoStatusFilter(key)}
                                className={`px-3 py-1.5 rounded-lg transition ${
                                    eoStatusFilter === key
                                        ? 'bg-white text-blue-700 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredEoApplications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredEoApplications.map((app) => (
                            <div
                                key={app.id}
                                className="p-5 sm:p-6 hover:bg-slate-50/50 transition flex flex-col lg:flex-row lg:items-start justify-between gap-5"
                            >
                                <div className="space-y-2.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-extrabold text-slate-900">
                                            {app.organization_name}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                                app.status === 'PENDING'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : app.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}
                                        >
                                            {app.status === 'PENDING'
                                                ? 'Menunggu Verifikasi'
                                                : app.status === 'APPROVED'
                                                ? 'Disetujui'
                                                : 'Ditolak'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            · Diajukan {app.created_at_formatted}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                                        <span className="font-medium text-slate-800">
                                            Pemohon: {app.applicant_name} ({app.applicant_email})
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="size-3.5 text-slate-400" />
                                            {app.contact_phone}
                                        </span>
                                        {app.portfolio_url && (
                                            <a
                                                href={app.portfolio_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                                            >
                                                <Globe className="size-3.5" />
                                                Portofolio / Sosmed ↗
                                            </a>
                                        )}
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100 leading-relaxed">
                                        {app.reason}
                                    </p>

                                    {app.status === 'REJECTED' && app.rejection_reason && (
                                        <p className="text-xs text-red-700 bg-red-50/70 rounded-xl px-3 py-2 border border-red-100">
                                            <span className="font-bold">Alasan Penolakan:</span> {app.rejection_reason}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end justify-end gap-2.5 shrink-0">
                                    {app.document_url && (
                                        <a
                                            href={app.document_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                        >
                                            <FileCheck2 className="size-4" />
                                            Buka Berkas Verifikasi
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    )}

                                    {app.status === 'PENDING' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={processingApproveId === app.id}
                                                onClick={() => handleApproveEo(app)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                {processingApproveId === app.id ? 'Memproses...' : 'Setujui EO'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openRejectModal(app)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                                            >
                                                <XCircle className="size-4" />
                                                Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center">
                        <Clock3 className="mx-auto size-8 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-800">
                            Tidak ada pengajuan EO pada filter status ini
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Seluruh pengajuan akun Event Organizer dari pengguna akan tampil di sini.
                        </p>
                    </div>
                )}
            </section>

            {/* Section 2: Moderasi & Verifikasi Publikasi Event (Fase 3) */}
            <section
                id="moderasi-event"
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <CalendarDays className="size-5 text-blue-600" />
                            Moderasi & Persetujuan Publikasi Event
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Tinjau kelengkapan informasi acara, jadwal, dan kuota tiket yang diajukan oleh Event Organizer.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold overflow-x-auto">
                        {[
                            [
                                'PENDING_REVIEW',
                                `Menunggu Review (${eventsForModeration.filter((e) => e.status === 'PENDING_REVIEW').length})`,
                            ],
                            [
                                'PUBLISHED',
                                `Published (${eventsForModeration.filter((e) => e.status === 'PUBLISHED').length})`,
                            ],
                            [
                                'REJECTED',
                                `Perlu Revisi (${eventsForModeration.filter((e) => e.status === 'REJECTED').length})`,
                            ],
                            ['ALL', `Semua (${eventsForModeration.length})`],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setEventStatusFilter(key)}
                                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                                    eventStatusFilter === key
                                        ? 'bg-white text-blue-700 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredModerationEvents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredModerationEvents.map((evt) => (
                            <div
                                key={evt.id}
                                className="p-5 sm:p-6 hover:bg-slate-50/50 transition flex flex-col lg:flex-row lg:items-start justify-between gap-5"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <img
                                        src={evt.banner}
                                        alt=""
                                        className="size-16 sm:size-20 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                                    />
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                                {evt.category}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                                    evt.status === 'PENDING_REVIEW'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : evt.status === 'PUBLISHED'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}
                                            >
                                                {evt.status === 'PENDING_REVIEW'
                                                    ? 'Menunggu Review'
                                                    : evt.status === 'PUBLISHED'
                                                    ? 'Published'
                                                    : 'Perlu Revisi'}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-extrabold text-slate-900">
                                            {evt.title}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                            <span className="font-semibold text-indigo-700">
                                                EO: {evt.organizerName} ({evt.organizerEmail})
                                            </span>
                                            <span>· {evt.startsAtFormatted}</span>
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="size-3.5 text-slate-400" />
                                                {evt.location}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                                <Ticket className="size-3.5 text-blue-600" />
                                                {evt.ticketTypesCount} Kategori Tiket · Total Kuota {evt.totalQuota}
                                            </span>
                                            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200">
                                                {evt.priceLabel}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                            {evt.description}
                                        </p>

                                        {evt.status === 'REJECTED' && evt.rejectionReason && (
                                            <p className="text-xs text-red-700 bg-red-50/70 rounded-xl px-3 py-2 border border-red-100">
                                                <span className="font-bold">Catatan Revisi:</span> {evt.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0">
                                    {evt.status === 'PUBLISHED' && (
                                        <Link
                                            href={`/event/${evt.slug}`}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Lihat Halaman Publik
                                            <ExternalLink className="size-3.5" />
                                        </Link>
                                    )}

                                    {evt.status === 'PENDING_REVIEW' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={processingEventApproveId === evt.id}
                                                onClick={() => handleApproveEvent(evt)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                {processingEventApproveId === evt.id
                                                    ? 'Memproses...'
                                                    : 'Setujui & Tayangkan'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openRejectEventModal(evt)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                                            >
                                                <XCircle className="size-4" />
                                                Minta Revisi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center">
                        <CalendarDays className="mx-auto size-8 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-800">
                            Tidak ada event pada filter status ini
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Event yang diajukan oleh Event Organizer untuk moderasi akan tampil di sini.
                        </p>
                    </div>
                )}
            </section>

            {/* Filter Tabs & Search Bar Section */}
            <div id="users" className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20">
                {/* Role Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 pt-4 overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('ALL')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'ALL'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Semua User
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {stats.totalUsers ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('ADMIN')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'ADMIN'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Super Admin
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            {stats.totalAdmin ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('EO')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'EO'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Event Organizer
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {stats.totalEo ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('USER')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'USER'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Peserta
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {stats.totalPeserta ?? 0}
                        </span>
                    </button>
                </div>

                {/* Search & Filter Controls */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, user, email, atau ID..."
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Status:</span>
                            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                Semua Status
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Urutkan:</span>
                            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                Terbaru
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="py-3.5 px-5">User & Profil</th>
                                <th scope="col" className="py-3.5 px-5">Kontak (Email)</th>
                                <th scope="col" className="py-3.5 px-5">Role / Hak Akses</th>
                                <th scope="col" className="py-3.5 px-5">Tanggal Join</th>
                                <th scope="col" className="py-3.5 px-5">Status</th>
                                <th scope="col" className="py-3.5 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((item) => {
                                    const userInitials = item.name
                                        ? item.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()
                                        : 'U';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            {/* User & Profil */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                                                            item.role === 'ADMIN'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : item.role === 'EO'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                    >
                                                        {userInitials}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 leading-tight">
                                                            {item.name}
                                                        </p>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            ID: {String(item.id).slice(0, 8).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kontak */}
                                            <td className="py-4 px-5">
                                                <p className="text-slate-700 font-medium">{item.email}</p>
                                                {item.phone && (
                                                    <p className="text-xs text-slate-400">{item.phone}</p>
                                                )}
                                            </td>

                                            {/* Role Badge */}
                                            <td className="py-4 px-5">
                                                {item.role === 'ADMIN' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                                                        <Shield className="size-3" />
                                                        Super Admin
                                                    </span>
                                                ) : item.role === 'EO' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                        <Building2 className="size-3" />
                                                        Event Organizer
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                                        <Users className="size-3" />
                                                        Peserta
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tanggal Join */}
                                            <td className="py-4 px-5 text-slate-600">
                                                {item.created_at
                                                    ? dateFormatter.format(new Date(item.created_at))
                                                    : '10 Nov 2026'}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-5">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    Aktif
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-5 text-right">
                                                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                    Terdaftar
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-slate-500">
                                        Tidak ada data pengguna yang sesuai dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Menampilkan {filteredUsers.length} dari {stats.totalUsers ?? 0} Pengguna
                    </p>
                </div>
            </div>

            {/* Modal Tolak Pengajuan EO */}
            {rejectingApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                Tolak Pengajuan EO
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRejectingApplication(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                                <p className="font-bold text-slate-900">{rejectingApplication.organization_name}</p>
                                <p className="mt-0.5">Pemohon: {rejectingApplication.applicant_name} ({rejectingApplication.applicant_email})</p>
                            </div>

                            <div>
                                <label htmlFor="rejection_reason" className="block text-xs font-semibold text-slate-700">
                                    Alasan Penolakan / Catatan Perbaikan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="rejection_reason"
                                    rows={3}
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    placeholder="Jelaskan alasan penolakan agar pemohon dapat memperbaiki berkasnya (minimal 10 karakter)..."
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                                />
                                {rejectForm.errors.rejection_reason && (
                                    <p className="mt-1 text-xs font-medium text-red-600">
                                        {rejectForm.errors.rejection_reason}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingApplication(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {rejectForm.processing ? 'Menyimpan...' : 'Konfirmasi Tolak'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Minta Revisi / Tolak Event */}
            {rejectingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                Kembalikan Event untuk Revisi
                            </h3>
                            <button
                                type="button"
                                onClick={() => setRejectingEvent(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectEventSubmit} className="mt-4 space-y-4">
                            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                                <p className="font-bold text-slate-900">{rejectingEvent.title}</p>
                                <p className="mt-0.5">Penyelenggara: {rejectingEvent.organizerName}</p>
                            </div>

                            <div>
                                <label
                                    htmlFor="event_rejection_reason"
                                    className="block text-xs font-semibold text-slate-700"
                                >
                                    Catatan Revisi / Alasan Penolakan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="event_rejection_reason"
                                    name="rejection_reason"
                                    rows={3}
                                    required
                                    minLength={10}
                                    value={rejectEventForm.data.rejection_reason}
                                    onChange={(e) =>
                                        rejectEventForm.setData('rejection_reason', e.target.value)
                                    }
                                    placeholder="Jelaskan bagian informasi event atau tiket yang perlu diperbaiki oleh EO (minimal 10 karakter)..."
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                                />
                                {rejectEventForm.errors.rejection_reason && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {rejectEventForm.errors.rejection_reason}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingEvent(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectEventForm.processing}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {rejectEventForm.processing ? 'Menyimpan...' : 'Kirim Catatan Revisi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
