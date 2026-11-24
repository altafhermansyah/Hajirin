import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Building2,
    ShieldCheck,
    UserX,
    UserCheck,
    Calendar,
    TrendingUp,
    Search,
    ExternalLink,
    FileText,
    Mail,
    Phone,
    Globe,
    Eye,
    ShieldAlert,
    Ticket,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { Pagination } from '../../../Components/ui/Pagination';
import { Avatar } from '../../../Components/ui/Avatar';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

export default function OrganizerManagementIndex({
    organizers = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedVerification, setSelectedVerification] = useState(filters.verification || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    const [detailOrganizer, setDetailOrganizer] = useState(null);
    const [statusConfirmOrganizer, setStatusConfirmOrganizer] = useState(null);
    const [revokeConfirmOrganizer, setRevokeConfirmOrganizer] = useState(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [isRevoking, setIsRevoking] = useState(false);

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            verification:
                newFilters.verification !== undefined ? newFilters.verification : selectedVerification,
            sort: newFilters.sort !== undefined ? newFilters.sort : selectedSort,
        };

        if (!queryParams.search) delete queryParams.search;
        if (queryParams.status === 'ALL') delete queryParams.status;
        if (queryParams.verification === 'ALL') delete queryParams.verification;
        if (queryParams.sort === 'latest') delete queryParams.sort;

        router.get('/admin/organizers', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleToggleStatus = (eo) => {
        router.patch(
            `/admin/organizers/${eo.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setStatusConfirmOrganizer(null),
            }
        );
    };

    const handleRevokeSubmit = (e) => {
        e.preventDefault();
        if (!revokeConfirmOrganizer) return;

        setIsRevoking(true);
        router.post(
            `/admin/organizers/${revokeConfirmOrganizer.id}/revoke`,
            { reason: revokeReason || 'Dicabut oleh Administrator platform.' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRevokeConfirmOrganizer(null);
                    setRevokeReason('');
                    setIsRevoking(false);
                },
                onError: () => {
                    setIsRevoking(false);
                },
            }
        );
    };

    return (
        <AdminLayout title="Kelola Penyelenggara (EO)">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Pending Applications Notice Banner */}
            {stats.pendingApplicationsCount > 0 && (
                <FlashBanner
                    tone="warning"
                    title={`${stats.pendingApplicationsCount} Pengajuan Event Organizer Menunggu Verifikasi`}
                    message="Evaluasi dokumen legalitas dan profil calon EO untuk memperluas kemitraan event."
                    action={
                        <Link
                            href="/admin/organizers/applications"
                            className={buttonClass('outline', 'sm')}
                        >
                            Tinjau Pengajuan
                        </Link>
                    }
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Kelola Penyelenggara (EO)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pantau kinerja mitra penyelenggara, kelola status operasional, dan verifikasi legalitas akun EO.
                    </p>
                </div>

                <Link
                    href="/admin/organizers/applications"
                    className={buttonClass('outline', 'md')}
                >
                    <UserCheck className="size-4 text-slate-500" aria-hidden="true" />
                    <span>Antrean Verifikasi EO</span>
                    {stats.pendingApplicationsCount > 0 && (
                        <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
                            {stats.pendingApplicationsCount}
                        </span>
                    )}
                </Link>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Penyelenggara"
                    icon={Building2}
                    value={stats.totalEo || 0}
                    subtext={`${stats.activeEo || 0} aktif · ${stats.suspendedEo || 0} suspended`}
                />
                <StatCard
                    label="Event Dibuat EO"
                    icon={Calendar}
                    value={stats.totalEventsByEo || 0}
                    subtext="Total event terdaftar di platform"
                />
                <StatCard
                    label="Tiket Terjual (EO)"
                    icon={Ticket}
                    value={stats.totalTicketsSoldByEo || 0}
                    subtext="Tiket terkonfirmasi lunas"
                />
                <StatCard
                    label="Akumulasi Omset EO"
                    icon={TrendingUp}
                    value={stats.totalRevenueByEoFormatted || 'Rp0'}
                    subtext="Gross merchandise value"
                />
            </div>

            {/* Organizers Table Card */}
            <Card className="overflow-hidden">
                {/* Filter, Search & Sorting Bar */}
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
                            placeholder="Cari organisasi, nama, kontak, email..."
                            aria-label="Cari penyelenggara"
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="eo-status-filter" className="font-medium">
                                Status:
                            </label>
                            <select
                                id="eo-status-filter"
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="SUSPENDED">Ditangguhkan</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="eo-verification-filter" className="font-medium">
                                Verifikasi:
                            </label>
                            <select
                                id="eo-verification-filter"
                                value={selectedVerification}
                                onChange={(e) => {
                                    setSelectedVerification(e.target.value);
                                    applyFilters({ verification: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Verifikasi</option>
                                <option value="VERIFIED">Terverifikasi</option>
                                <option value="UNVERIFIED">Belum Verifikasi</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="eo-sort-filter" className="font-medium">
                                Urutkan:
                            </label>
                            <select
                                id="eo-sort-filter"
                                value={selectedSort}
                                onChange={(e) => {
                                    setSelectedSort(e.target.value);
                                    applyFilters({ sort: e.target.value });
                                }}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="latest">Terbaru Bergabung</option>
                                <option value="oldest">Terlama</option>
                                <option value="most_events">Event Terbanyak</option>
                                <option value="most_revenue">Omset Tertinggi</option>
                                <option value="name_asc">Nama (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Organizers Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">Penyelenggara / Organisasi</th>
                                <th scope="col" className="px-5 py-3">Kontak & Portofolio</th>
                                <th scope="col" className="px-5 py-3">Status Operasional</th>
                                <th scope="col" className="px-5 py-3 text-right">Event</th>
                                <th scope="col" className="px-5 py-3 text-right">Tiket & Omset</th>
                                <th scope="col" className="px-5 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizers.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                        <Building2 className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada data Event Organizer ditemukan
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba ubah kata kunci pencarian atau sesuaikan filter status dan verifikasi.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                organizers.data.map((eo) => {
                                    const isSuspended = eo.status === 'SUSPENDED';

                                    return (
                                        <tr key={eo.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={eo.organizationName || 'EO'}
                                                        size="md"
                                                        shape="rounded"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-medium text-slate-900 truncate">
                                                                {eo.organizationName}
                                                            </span>
                                                            {eo.isVerified ? (
                                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                                    <ShieldCheck
                                                                        className="size-3.5 text-brand-blue"
                                                                        aria-hidden="true"
                                                                    />
                                                                    Terverifikasi
                                                                </span>
                                                            ) : (
                                                                <NeutralTag>Belum verifikasi</NeutralTag>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            PJ: {eo.name} · Gabung {eo.joinedAtFormatted}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Mail className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{eo.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                                                        <Phone className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                        <span>{eo.phone}</span>
                                                    </div>
                                                    {eo.portfolioUrl ? (
                                                        <a
                                                            href={eo.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-brand-blue hover:underline font-medium"
                                                        >
                                                            <Globe className="size-3.5" aria-hidden="true" />
                                                            <span>Portofolio Web</span>
                                                            <ExternalLink className="size-3" aria-hidden="true" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400">Tanpa tautan web</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    tone={isSuspended ? 'danger' : 'success'}
                                                    label={isSuspended ? 'Ditangguhkan' : 'Aktif Operasional'}
                                                />
                                            </td>

                                            <td className="px-5 py-3.5 text-right tabular-nums">
                                                <p className="font-medium text-slate-900">
                                                    {eo.eventsCount} Event
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {eo.publishedEventsCount} terbit
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5 text-right tabular-nums">
                                                <p className="font-medium text-slate-900">
                                                    {eo.ticketsSold} Tiket
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {eo.revenueFormatted}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailOrganizer(eo)}
                                                        title="Detail Profil & Performa"
                                                        aria-label={`Lihat detail ${eo.organizationName}`}
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        <Eye className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusConfirmOrganizer(eo)}
                                                        title={
                                                            isSuspended
                                                                ? 'Aktifkan Kembali Akun EO'
                                                                : 'Tangguhkan Operasional EO'
                                                        }
                                                        aria-label={
                                                            isSuspended
                                                                ? `Aktifkan kembali ${eo.organizationName}`
                                                                : `Tangguhkan ${eo.organizationName}`
                                                        }
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        {isSuspended ? (
                                                            <UserCheck className="size-3.5" aria-hidden="true" />
                                                        ) : (
                                                            <UserX className="size-3.5" aria-hidden="true" />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRevokeConfirmOrganizer(eo);
                                                            setRevokeReason('');
                                                        }}
                                                        title="Cabut Hak Akses EO (Demote ke Peserta)"
                                                        aria-label={`Cabut status EO ${eo.organizationName}`}
                                                        className={buttonClass('danger-outline', 'icon')}
                                                    >
                                                        <ShieldAlert className="size-3.5" aria-hidden="true" />
                                                    </button>
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
                    links={organizers.links}
                    from={organizers.from}
                    to={organizers.to}
                    total={organizers.total}
                    itemLabel="penyelenggara"
                />
            </Card>

            {/* Modal Detail Profil & Performa EO */}
            <Modal
                open={Boolean(detailOrganizer)}
                onClose={() => setDetailOrganizer(null)}
                title="Profil & Analisis Event Organizer"
                maxWidth="max-w-xl"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setDetailOrganizer(null)}>
                        Tutup
                    </Button>
                }
            >
                {detailOrganizer && (
                    <div className="space-y-5">
                        <div className="flex items-start gap-3.5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <Avatar
                                name={detailOrganizer.organizationName}
                                size="lg"
                                shape="rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h4 className="font-semibold text-base text-slate-900">
                                        {detailOrganizer.organizationName}
                                    </h4>
                                    <StatusBadge
                                        tone={detailOrganizer.isVerified ? 'success' : 'warning'}
                                        label={
                                            detailOrganizer.isVerified
                                                ? 'Terverifikasi'
                                                : 'Belum Terverifikasi'
                                        }
                                    />
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    Penanggung Jawab: {detailOrganizer.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Bergabung: {detailOrganizer.joinedAtFormatted}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                <span className="text-slate-500 block mb-0.5">Email Resmi</span>
                                <span className="font-medium text-slate-900 break-all">
                                    {detailOrganizer.email}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                <span className="text-slate-500 block mb-0.5">Nomor Telepon / WhatsApp</span>
                                <span className="font-medium text-slate-900 font-mono">
                                    {detailOrganizer.phone}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-200 bg-white sm:col-span-2">
                                <span className="text-slate-500 block mb-0.5">Portofolio / Website</span>
                                {detailOrganizer.portfolioUrl ? (
                                    <a
                                        href={detailOrganizer.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue hover:underline font-medium inline-flex items-center gap-1 break-all"
                                    >
                                        <span>{detailOrganizer.portfolioUrl}</span>
                                        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                                    </a>
                                ) : (
                                    <span className="text-slate-400">
                                        Tidak mencantumkan tautan portofolio
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                            <p className="text-xs font-medium text-slate-500 mb-3">
                                Metrik Penyelenggaraan Event
                            </p>
                            <div className="grid grid-cols-3 gap-3 text-center tabular-nums">
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                    <span className="text-xs text-slate-500 block">Event Dibuat</span>
                                    <span className="text-lg font-semibold text-slate-900">
                                        {detailOrganizer.eventsCount}
                                    </span>
                                    <span className="text-xs text-slate-400 block">
                                        {detailOrganizer.publishedEventsCount} terbit
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                    <span className="text-xs text-slate-500 block">Tiket Terjual</span>
                                    <span className="text-lg font-semibold text-slate-900">
                                        {detailOrganizer.ticketsSold}
                                    </span>
                                    <span className="text-xs text-slate-400 block">Lunas</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                    <span className="text-xs text-slate-500 block">Omset Penjualan</span>
                                    <span className="text-sm font-semibold text-slate-900 truncate block mt-0.5">
                                        {detailOrganizer.revenueFormatted}
                                    </span>
                                    <span className="text-xs text-slate-400 block">Bruto</span>
                                </div>
                            </div>
                        </div>

                        {detailOrganizer.applicationId && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-2.5">
                                    <FileText className="size-4 text-slate-500 shrink-0" aria-hidden="true" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-900">
                                            Berkas Verifikasi Terlampir
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Dokumen legalitas pendukung yang disetujui.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={`/admin/organizers/applications/${detailOrganizer.applicationId}/document`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={buttonClass('outline', 'sm')}
                                >
                                    <span>Lihat Berkas</span>
                                    <ExternalLink className="size-3.5 text-slate-400" aria-hidden="true" />
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Suspend / Aktifkan EO */}
            <Modal
                open={Boolean(statusConfirmOrganizer)}
                onClose={() => setStatusConfirmOrganizer(null)}
                title={
                    statusConfirmOrganizer?.status === 'SUSPENDED'
                        ? 'Aktifkan Kembali Akun EO?'
                        : 'Tangguhkan (Suspend) Akun EO?'
                }
                description={
                    statusConfirmOrganizer
                        ? `Organisasi: ${statusConfirmOrganizer.organizationName}`
                        : null
                }
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusConfirmOrganizer(null)}
                        >
                            Batal
                        </Button>
                        {statusConfirmOrganizer && (
                            <Button
                                variant={
                                    statusConfirmOrganizer.status === 'SUSPENDED' ? 'primary' : 'danger'
                                }
                                size="sm"
                                onClick={() => handleToggleStatus(statusConfirmOrganizer)}
                            >
                                {statusConfirmOrganizer.status === 'SUSPENDED'
                                    ? 'Ya, Aktifkan Akun'
                                    : 'Ya, Tangguhkan Akun'}
                            </Button>
                        )}
                    </>
                }
            >
                {statusConfirmOrganizer && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {statusConfirmOrganizer.status === 'SUSPENDED'
                            ? 'Dengan mengaktifkan akun ini kembali, EO dapat mengelola event dan tiket secara normal di platform Hajirin.'
                            : 'Penangguhan akun akan membekukan aktivitas pembuatan event baru dan akses operasional dashboard EO sampai diaktifkan kembali oleh Administrator.'}
                    </p>
                )}
            </Modal>

            {/* Modal Cabut Hak Akses EO (Revoke) */}
            <Modal
                open={Boolean(revokeConfirmOrganizer)}
                onClose={() => setRevokeConfirmOrganizer(null)}
                title="Cabut Hak Akses Event Organizer"
                maxWidth="max-w-lg"
            >
                {revokeConfirmOrganizer && (
                    <form onSubmit={handleRevokeSubmit} className="space-y-4">
                        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 text-xs text-rose-900 space-y-1">
                            <p className="font-semibold">Peringatan Penurunan Hak Akses</p>
                            <p className="leading-relaxed">
                                Tindakan ini akan mengembalikan role pengguna{' '}
                                <strong>{revokeConfirmOrganizer.name}</strong> (
                                {revokeConfirmOrganizer.organizationName}) dari Event Organizer menjadi{' '}
                                <strong>Peserta (USER)</strong>.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="revoke-eo-reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Alasan Pencabutan Hak Akses EO <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="revoke-eo-reason"
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                placeholder="Contoh: Terjadi pelanggaran ketentuan penyelenggaraan kegiatan atau ketidaksesuaian berkas legalitas..."
                                rows={3}
                                required
                                className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Alasan ini akan dikirimkan ke notifikasi akun pengguna terkait.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRevokeConfirmOrganizer(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                size="sm"
                                loading={isRevoking}
                                disabled={!revokeReason.trim()}
                            >
                                {isRevoking ? 'Memproses...' : 'Cabut Status EO'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </AdminLayout>
    );
}
