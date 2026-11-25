import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    Users,
    Building2,
    Shield,
    CalendarDays,
    Search,
    CheckCircle2,
    FileCheck2,
    ExternalLink,
    XCircle,
    Clock3,
    Phone,
    Globe,
    MapPin,
    Ticket,
} from 'lucide-react';
import { Card, CardHeader } from '../../Components/ui/Card';
import { StatCard } from '../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../Components/ui/UnderlineTabs';
import { Avatar } from '../../Components/ui/Avatar';
import { FlashBanner } from '../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../Components/ui/Button';
import { Modal } from '../../Components/ui/Dialog';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const ROLE_LABELS = {
    ADMIN: 'Super Admin',
    EO: 'Event Organizer',
    USER: 'Peserta',
};

const EO_STATUS_META = {
    PENDING: { tone: 'warning', label: 'Menunggu Verifikasi' },
    APPROVED: { tone: 'success', label: 'Disetujui' },
    REJECTED: { tone: 'danger', label: 'Ditolak' },
};

const EVENT_STATUS_META = {
    PENDING_REVIEW: { tone: 'warning', label: 'Menunggu Review' },
    PUBLISHED: { tone: 'success', label: 'Published' },
    REJECTED: { tone: 'danger', label: 'Perlu Revisi' },
};

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
        const matchesRole = selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            String(user.id).toLowerCase().includes(query);
        return matchesRole && matchesSearch;
    });

    const eoTabs = [
        ['PENDING', 'Pending', eoApplications.filter((a) => a.status === 'PENDING').length],
        ['APPROVED', 'Disetujui', eoApplications.filter((a) => a.status === 'APPROVED').length],
        ['REJECTED', 'Ditolak', eoApplications.filter((a) => a.status === 'REJECTED').length],
        ['ALL', 'Semua', eoApplications.length],
    ];

    const eventTabs = [
        [
            'PENDING_REVIEW',
            'Menunggu Review',
            eventsForModeration.filter((e) => e.status === 'PENDING_REVIEW').length,
        ],
        [
            'PUBLISHED',
            'Published',
            eventsForModeration.filter((e) => e.status === 'PUBLISHED').length,
        ],
        [
            'REJECTED',
            'Perlu Revisi',
            eventsForModeration.filter((e) => e.status === 'REJECTED').length,
        ],
        ['ALL', 'Semua', eventsForModeration.length],
    ];

    const userRoleTabs = [
        ['ALL', 'Semua User', stats.totalUsers ?? 0],
        ['ADMIN', 'Super Admin', stats.totalAdmin ?? 0],
        ['EO', 'Event Organizer', stats.totalEo ?? 0],
        ['USER', 'Peserta', stats.totalPeserta ?? 0],
    ];

    return (
        <AdminLayout title="Dashboard Platform">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Dashboard Admin & Moderasi Platform
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pantau statistik pengguna, verifikasi berkas pengajuan EO, dan moderasi kelayakan publikasi event.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a href="#verifikasi-eo" className={buttonClass('outline', 'md')}>
                        <Building2 className="size-4 text-slate-500" aria-hidden="true" />
                        <span>Pengajuan EO ({stats.pendingEoApplications ?? 0})</span>
                    </a>
                    <a href="#moderasi-event" className={buttonClass('primary', 'md')}>
                        <CalendarDays className="size-4" aria-hidden="true" />
                        <span>Moderasi Event ({stats.pendingEvents ?? 0})</span>
                    </a>
                </div>
            </div>

            {/* Quick Attention Banner */}
            {(stats.pendingEoApplications > 0 || stats.pendingEvents > 0) && (
                <FlashBanner
                    tone="warning"
                    title="Butuh Tindakan Moderator Admin"
                    message={`Terdapat ${stats.pendingEoApplications ?? 0} pengajuan EO dan ${stats.pendingEvents ?? 0} event baru yang menunggu tinjauan dan verifikasi Anda.`}
                    action={
                        <a href="#moderasi-event" className={buttonClass('outline', 'sm')}>
                            Tinjau Sekarang
                        </a>
                    }
                />
            )}

            {/* Top Metric Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Peserta Terdaftar"
                    icon={Users}
                    value={Number(stats.totalPeserta ?? 0).toLocaleString('id-ID')}
                    valueSuffix="akun"
                    subtext={`${stats.totalPeserta ?? 0} akun peserta aktif`}
                />
                <StatCard
                    label="Akun Penyelenggara (EO)"
                    icon={Building2}
                    value={Number(stats.totalEo ?? 0).toLocaleString('id-ID')}
                    valueSuffix="mitra"
                    subtext={`${stats.totalEo ?? 0} terverifikasi, ${stats.pendingEoApplications ?? 0} pending`}
                />
                <StatCard
                    label="Platform Admin & Owner"
                    icon={Shield}
                    value={Number(stats.totalAdmin ?? 1).toLocaleString('id-ID')}
                    valueSuffix="admin"
                    subtext="Hak akses penuh platform"
                />
                <StatCard
                    label="Event Terdaftar"
                    icon={CalendarDays}
                    value={Number(stats.totalEvents ?? 0).toLocaleString('id-ID')}
                    valueSuffix="event"
                    subtext={`${stats.publishedEvents ?? 0} published · ${stats.pendingEvents ?? 0} pending`}
                />
            </div>

            {/* Section 1: Antrean Verifikasi Pengajuan EO */}
            <Card as="section" id="verifikasi-eo" className="overflow-hidden scroll-mt-20">
                <CardHeader
                    title="Verifikasi Pengajuan Event Organizer (EO)"
                    description="Periksa berkas verifikasi gabungan sebelum menyetujui perubahan role akun menjadi EO."
                />
                <UnderlineTabs
                    items={eoTabs}
                    activeKey={eoStatusFilter}
                    onChange={setEoStatusFilter}
                />

                {filteredEoApplications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredEoApplications.map((app) => {
                            const statusMeta = EO_STATUS_META[app.status] || {
                                tone: 'neutral',
                                label: app.status,
                            };

                            return (
                                <div
                                    key={app.id}
                                    className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                                >
                                    <div className="space-y-2.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {app.organization_name}
                                            </h3>
                                            <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
                                            <span className="text-xs text-slate-500">
                                                Diajukan {app.created_at_formatted}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                                            <span className="font-medium text-slate-800">
                                                Pemohon: {app.applicant_name} ({app.applicant_email})
                                            </span>
                                            <span className="inline-flex items-center gap-1 tabular-nums">
                                                <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                                                {app.contact_phone}
                                            </span>
                                            {app.portfolio_url && (
                                                <a
                                                    href={app.portfolio_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-medium text-brand-blue hover:underline"
                                                >
                                                    <Globe className="size-3.5" aria-hidden="true" />
                                                    Portofolio
                                                    <ExternalLink className="size-3" aria-hidden="true" />
                                                </a>
                                            )}
                                        </div>

                                        <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200/70 leading-relaxed">
                                            {app.reason}
                                        </p>

                                        {app.status === 'REJECTED' && app.rejection_reason && (
                                            <p className="text-xs text-rose-700 bg-rose-50/70 rounded-lg px-3 py-2 border border-rose-200/70">
                                                <span className="font-semibold">Alasan Penolakan:</span>{' '}
                                                {app.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0">
                                        {app.document_url && (
                                            <a
                                                href={app.document_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={buttonClass('outline', 'sm')}
                                            >
                                                <FileCheck2 className="size-3.5 text-slate-500" aria-hidden="true" />
                                                <span>Buka Berkas</span>
                                                <ExternalLink className="size-3 text-slate-400" aria-hidden="true" />
                                            </a>
                                        )}

                                        {app.status === 'PENDING' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    loading={processingApproveId === app.id}
                                                    onClick={() => handleApproveEo(app)}
                                                >
                                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                    <span>
                                                        {processingApproveId === app.id
                                                            ? 'Memproses...'
                                                            : 'Setujui EO'}
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="danger-outline"
                                                    size="sm"
                                                    onClick={() => openRejectModal(app)}
                                                >
                                                    <XCircle className="size-3.5" aria-hidden="true" />
                                                    <span>Tolak</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center">
                        <Clock3 className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                        <p className="text-sm font-medium text-slate-800">
                            Tidak ada pengajuan EO pada filter status ini
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Seluruh pengajuan akun Event Organizer dari pengguna akan tampil di sini.
                        </p>
                    </div>
                )}
            </Card>

            {/* Section 2: Moderasi & Verifikasi Publikasi Event */}
            <Card as="section" id="moderasi-event" className="overflow-hidden scroll-mt-20">
                <CardHeader
                    title="Moderasi & Persetujuan Publikasi Event"
                    description="Tinjau kelengkapan informasi acara, jadwal, dan kuota tiket yang diajukan oleh Event Organizer."
                />
                <UnderlineTabs
                    items={eventTabs}
                    activeKey={eventStatusFilter}
                    onChange={setEventStatusFilter}
                />

                {filteredModerationEvents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredModerationEvents.map((evt) => {
                            const statusMeta = EVENT_STATUS_META[evt.status] || {
                                tone: 'neutral',
                                label: evt.status,
                            };

                            return (
                                <div
                                    key={evt.id}
                                    className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <img
                                            src={evt.banner}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            className="size-16 sm:size-20 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                                        />
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <NeutralTag>{evt.category}</NeutralTag>
                                                <StatusBadge
                                                    tone={statusMeta.tone}
                                                    label={statusMeta.label}
                                                />
                                            </div>

                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {evt.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                                <span className="font-medium text-slate-800">
                                                    EO: {evt.organizerName} ({evt.organizerEmail})
                                                </span>
                                                <span>{evt.startsAtFormatted}</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 text-slate-400" aria-hidden="true" />
                                                    {evt.location}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <NeutralTag className="tabular-nums">
                                                    <Ticket className="size-3.5 text-slate-400" aria-hidden="true" />
                                                    {evt.ticketTypesCount} Kategori Tiket · Kuota {evt.totalQuota}
                                                </NeutralTag>
                                                <NeutralTag className="tabular-nums font-semibold text-slate-900">
                                                    {evt.priceLabel}
                                                </NeutralTag>
                                            </div>

                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {evt.description}
                                            </p>

                                            {evt.status === 'REJECTED' && evt.rejectionReason && (
                                                <p className="text-xs text-rose-700 bg-rose-50/70 rounded-lg px-3 py-2 border border-rose-200/70">
                                                    <span className="font-semibold">Catatan Revisi:</span>{' '}
                                                    {evt.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end justify-end gap-2 shrink-0">
                                        {evt.status === 'PUBLISHED' && (
                                            <Link
                                                href={`/event/${evt.slug}`}
                                                className={buttonClass('outline', 'sm')}
                                            >
                                                <span>Lihat Halaman Publik</span>
                                                <ExternalLink className="size-3.5 text-slate-400" aria-hidden="true" />
                                            </Link>
                                        )}

                                        {evt.status === 'PENDING_REVIEW' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    loading={processingEventApproveId === evt.id}
                                                    onClick={() => handleApproveEvent(evt)}
                                                >
                                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                    <span>
                                                        {processingEventApproveId === evt.id
                                                            ? 'Memproses...'
                                                            : 'Setujui & Tayangkan'}
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="danger-outline"
                                                    size="sm"
                                                    onClick={() => openRejectEventModal(evt)}
                                                >
                                                    <XCircle className="size-3.5" aria-hidden="true" />
                                                    <span>Minta Revisi</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center">
                        <CalendarDays className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                        <p className="text-sm font-medium text-slate-800">
                            Tidak ada event pada filter status ini
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Event yang diajukan oleh Event Organizer untuk moderasi akan tampil di sini.
                        </p>
                    </div>
                )}
            </Card>

            {/* Section 3: Ringkasan Pengguna Terbaru */}
            <Card as="section" id="users" className="overflow-hidden scroll-mt-20">
                <CardHeader
                    title="Pengguna Terbaru"
                    description="Ringkasan akun yang baru terdaftar di platform."
                    action={
                        <Link href="/admin/users" className={buttonClass('outline', 'sm')}>
                            Kelola Semua Pengguna
                        </Link>
                    }
                />

                <UnderlineTabs
                    items={userRoleTabs}
                    activeKey={selectedRoleFilter}
                    onChange={setSelectedRoleFilter}
                />

                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, email, atau ID..."
                            aria-label="Cari pengguna terbaru"
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                        />
                    </div>
                    <p className="text-xs text-slate-500 tabular-nums">
                        Menampilkan {filteredUsers.length} dari {stats.totalUsers ?? 0} pengguna
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="py-3 px-5">User & Profil</th>
                                <th scope="col" className="py-3 px-5">Kontak</th>
                                <th scope="col" className="py-3 px-5">Role</th>
                                <th scope="col" className="py-3 px-5">Tanggal Bergabung</th>
                                <th scope="col" className="py-3 px-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={item.name} size="md" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-900 leading-tight truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                                                        ID: {String(item.id).slice(0, 8).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-5">
                                            <p className="text-slate-700">{item.email}</p>
                                            {item.phone && (
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                    {item.phone}
                                                </p>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-5">
                                            <NeutralTag>
                                                {ROLE_LABELS[item.role] || 'Peserta'}
                                            </NeutralTag>
                                        </td>

                                        <td className="py-3.5 px-5 text-slate-600 text-xs tabular-nums">
                                            {item.created_at
                                                ? dateFormatter.format(new Date(item.created_at))
                                                : '-'}
                                        </td>

                                        <td className="py-3.5 px-5">
                                            <StatusBadge tone="success" label="Aktif" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-sm text-slate-500">
                                        Tidak ada data pengguna yang sesuai dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Tolak Pengajuan EO */}
            <Modal
                open={Boolean(rejectingApplication)}
                onClose={() => setRejectingApplication(null)}
                title="Tolak Pengajuan EO"
                description="Berikan catatan agar pemohon dapat melengkapi atau memperbaiki berkas verifikasinya."
                maxWidth="max-w-md"
            >
                {rejectingApplication && (
                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80">
                            <p className="font-semibold text-slate-900">
                                {rejectingApplication.organization_name}
                            </p>
                            <p className="mt-0.5">
                                Pemohon: {rejectingApplication.applicant_name} ({rejectingApplication.applicant_email})
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="rejection_reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Alasan Penolakan / Catatan Perbaikan <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="rejection_reason"
                                rows={3}
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                placeholder="Jelaskan alasan penolakan agar pemohon dapat memperbaiki berkasnya (minimal 10 karakter)..."
                                className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            {rejectForm.errors.rejection_reason && (
                                <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
                                    {rejectForm.errors.rejection_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingApplication(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                size="sm"
                                loading={rejectForm.processing}
                            >
                                {rejectForm.processing ? 'Menyimpan...' : 'Konfirmasi Tolak'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal Minta Revisi / Tolak Event */}
            <Modal
                open={Boolean(rejectingEvent)}
                onClose={() => setRejectingEvent(null)}
                title="Kembalikan Event untuk Revisi"
                description="Jelaskan bagian informasi acara atau tiket yang perlu diperbaiki oleh Event Organizer."
                maxWidth="max-w-md"
            >
                {rejectingEvent && (
                    <form onSubmit={handleRejectEventSubmit} className="space-y-4">
                        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80">
                            <p className="font-semibold text-slate-900">{rejectingEvent.title}</p>
                            <p className="mt-0.5">Penyelenggara: {rejectingEvent.organizerName}</p>
                        </div>

                        <div>
                            <label
                                htmlFor="event_rejection_reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Catatan Revisi / Alasan Penolakan <span className="text-rose-600">*</span>
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
                                className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            {rejectEventForm.errors.rejection_reason && (
                                <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
                                    {rejectEventForm.errors.rejection_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingEvent(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                size="sm"
                                loading={rejectEventForm.processing}
                            >
                                {rejectEventForm.processing ? 'Menyimpan...' : 'Kirim Catatan Revisi'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AdminLayout>
    );
}
