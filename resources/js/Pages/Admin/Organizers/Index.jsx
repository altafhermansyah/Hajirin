import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Building2,
    ShieldCheck,
    UserX,
    UserCheck,
    Calendar,
    TrendingUp,
    Search,
    ChevronDown,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    FileText,
    ArrowUpRight,
    Mail,
    Phone,
    Globe,
    AlertTriangle,
    Eye,
    X,
    Filter,
    ShieldAlert,
    Ticket,
} from 'lucide-react';

export default function OrganizerManagementIndex({
    organizers = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedVerification, setSelectedVerification] = useState(filters.verification || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    // Modals
    const [detailOrganizer, setDetailOrganizer] = useState(null);
    const [statusConfirmOrganizer, setStatusConfirmOrganizer] = useState(null);
    const [revokeConfirmOrganizer, setRevokeConfirmOrganizer] = useState(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [isRevoking, setIsRevoking] = useState(false);

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            verification: newFilters.verification !== undefined ? newFilters.verification : selectedVerification,
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
            <Head title="Kelola Penyelenggara (EO) - Admin Hajirin" />

            {/* Flash Notifications */}
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

            {/* Pending Applications Notice Banner */}
            {stats.pendingApplicationsCount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="size-5 text-amber-700" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-amber-950">
                                {stats.pendingApplicationsCount} Pengajuan Event Organizer Menunggu Verifikasi
                            </h4>
                            <p className="text-xs text-amber-800">
                                Segera evaluasi dokumen legalitas & profil calon EO untuk memperluas kemitraan event.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/organizers/applications"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                    >
                        <span>Tinjau Pengajuan</span>
                        <ArrowUpRight className="size-4" />
                    </Link>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Kelola Penyelenggara (EO)
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Total {stats.totalEo || 0} EO
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Pantau kinerja mitra penyelenggara, kelola status operasional, serta verifikasi legalitas akun EO.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/organizers/applications"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition shadow-xs"
                    >
                        <UserCheck className="size-4 text-amber-600" />
                        <span>Antrean Verifikasi EO</span>
                        {stats.pendingApplicationsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-black">
                                {stats.pendingApplicationsCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Integrated Organizer Telemetry Strip */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* Total EO */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Penyelenggara
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Building2 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                            {stats.totalEo || 0}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <span className="text-emerald-700 font-bold">{stats.activeEo || 0} Aktif</span> •{' '}
                            <span className="text-rose-600 font-bold">{stats.suspendedEo || 0} Suspended</span>
                        </p>
                    </div>
                </div>

                {/* Event Diselenggarakan */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Event Dibuat EO
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <Calendar className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                            {stats.totalEventsByEo || 0}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Total event terdaftar di platform
                        </p>
                    </div>
                </div>

                {/* Tiket Terjual */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Tiket Terjual (EO)
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Ticket className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                            {stats.totalTicketsSoldByEo || 0}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Tiket terkonfirmasi lunas
                        </p>
                    </div>
                </div>

                {/* Total Transaksi EO */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Akumulasi Omset EO
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <TrendingUp className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-emerald-800 tracking-tight font-mono">
                            {stats.totalRevenueByEoFormatted || 'Rp0'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            Gross merchandise value
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter, Search & Sorting Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari organisasi, nama, kontak, email..."
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
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="SUSPENDED">Ditangguhkan</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Verification Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Verifikasi:</span>
                            <div className="relative">
                                <select
                                    value={selectedVerification}
                                    onChange={(e) => {
                                        setSelectedVerification(e.target.value);
                                        applyFilters({ verification: e.target.value });
                                    }}
                                    className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-600 transition appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Semua Verifikasi</option>
                                    <option value="VERIFIED">Terverifikasi (Dokumen Valid)</option>
                                    <option value="UNVERIFIED">Belum Verifikasi</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort Dropdown */}
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
                                    <option value="latest">Terbaru Bergabung</option>
                                    <option value="oldest">Terlama</option>
                                    <option value="most_events">Event Terbanyak</option>
                                    <option value="most_revenue">Omset Tertinggi</option>
                                    <option value="name_asc">Nama (A-Z)</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organizers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">Penyelenggara / Organisasi</th>
                                <th scope="col" className="px-6 py-4">Kontak & Portofolio</th>
                                <th scope="col" className="px-6 py-4 text-center">Status Operasional</th>
                                <th scope="col" className="px-6 py-4 text-center">Event Terdaftar</th>
                                <th scope="col" className="px-6 py-4 text-right">Tiket & Omset</th>
                                <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizers.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                        <Building2 className="mx-auto size-12 text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-800 text-base">Tidak ada data Event Organizer ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Coba ubah kata kunci pencarian atau sesuaikan opsi filter status dan verifikasi.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                organizers.data.map((eo) => {
                                    const isSuspended = eo.status === 'SUSPENDED';

                                    return (
                                        <tr key={eo.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Organization & Owner */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 uppercase text-sm">
                                                        {eo.organizationName ? eo.organizationName.substring(0, 2) : 'EO'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-slate-900 truncate">
                                                                {eo.organizationName}
                                                            </span>
                                                            {eo.isVerified ? (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                                    <ShieldCheck className="size-3" />
                                                                    Terverifikasi
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                                                                    Non-Verif
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <span>Penanggung Jawab: {eo.name}</span>
                                                            <span>•</span>
                                                            <span>Gabung {eo.joinedAtFormatted}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact & Portfolio */}
                                            <td className="px-6 py-4 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Mail className="size-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{eo.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Phone className="size-3.5 text-slate-400 shrink-0" />
                                                        <span>{eo.phone}</span>
                                                    </div>
                                                    {eo.portfolioUrl ? (
                                                        <a
                                                            href={eo.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                                        >
                                                            <Globe className="size-3.5 text-blue-500" />
                                                            <span>Portofolio Web</span>
                                                            <ExternalLink className="size-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Tanpa tautan web</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Operational Status */}
                                            <td className="px-6 py-4 text-center">
                                                {isSuspended ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <UserX className="size-3.5" />
                                                        Ditangguhkan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <UserCheck className="size-3.5" />
                                                        Aktif Operasional
                                                    </span>
                                                )}
                                            </td>

                                            {/* Events Metric */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-block text-center">
                                                    <span className="font-extrabold text-sm text-slate-900">
                                                        {eo.eventsCount} Event
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 font-medium">
                                                        {eo.publishedEventsCount} Terbit Aktif
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Tickets & Revenue */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-block text-right">
                                                    <span className="font-bold text-sm text-slate-900">
                                                        {eo.ticketsSold} Tiket
                                                    </span>
                                                    <p className="text-xs font-bold text-emerald-600">
                                                        {eo.revenueFormatted}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Detail Profile Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailOrganizer(eo)}
                                                        title="Detail Profil & Performa"
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>

                                                    {/* Toggle Status (Active / Suspend) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setStatusConfirmOrganizer(eo)}
                                                        title={isSuspended ? 'Aktifkan Kembali Akun EO' : 'Tangguhkan Operasional EO'}
                                                        className={`p-1.5 rounded-lg border transition ${
                                                            isSuspended
                                                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                                : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        {isSuspended ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                                                    </button>

                                                    {/* Revoke Role */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRevokeConfirmOrganizer(eo);
                                                            setRevokeReason('');
                                                        }}
                                                        title="Cabut Hak Akses EO (Demote ke Peserta)"
                                                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                                                    >
                                                        <ShieldAlert className="size-4" />
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

                {/* Pagination */}
                {organizers.links && organizers.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{organizers.data.length}</span> dari{' '}
                            <span className="font-bold text-slate-800">{organizers.total || organizers.data.length}</span> Event Organizer
                        </p>
                        <div className="flex items-center gap-1">
                            {organizers.links.map((link, idx) => (
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

            {/* Modal Detail Profil & Performa EO */}
            {detailOrganizer && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                                <Building2 className="size-5 text-blue-600" />
                                <h3 className="font-black text-slate-900 text-base">Profil & Analisis Event Organizer</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailOrganizer(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Organization Profile Header */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="size-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                                    {detailOrganizer.organizationName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-extrabold text-lg text-slate-900">{detailOrganizer.organizationName}</h4>
                                        {detailOrganizer.isVerified ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                                <ShieldCheck className="size-3.5" /> Terverifikasi
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                Belum Terverifikasi
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">Penanggung Jawab: {detailOrganizer.name}</p>
                                    <p className="text-xs text-slate-400">Bergabung: {detailOrganizer.joinedAtFormatted}</p>
                                </div>
                            </div>

                            {/* Contact & Links Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                                    <span className="text-slate-400 font-semibold block mb-1">Email Resmi:</span>
                                    <span className="font-bold text-slate-800 break-all">{detailOrganizer.email}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                                    <span className="text-slate-400 font-semibold block mb-1">Nomor Telepon / WhatsApp:</span>
                                    <span className="font-bold text-slate-800">{detailOrganizer.phone}</span>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200 bg-white sm:col-span-2">
                                    <span className="text-slate-400 font-semibold block mb-1">Portofolio / Website:</span>
                                    {detailOrganizer.portfolioUrl ? (
                                        <a
                                            href={detailOrganizer.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                                        >
                                            <span>{detailOrganizer.portfolioUrl}</span>
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 italic">Tidak mencantumkan tautan portofolio</span>
                                    )}
                                </div>
                            </div>

                            {/* Metrics Breakdown */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Metrik Penyelenggaraan Event
                                </h5>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                        <span className="text-[11px] text-slate-400 block font-medium">Event Dibuat</span>
                                        <span className="text-lg font-black text-slate-900">{detailOrganizer.eventsCount}</span>
                                        <span className="text-[10px] text-slate-500 block">{detailOrganizer.publishedEventsCount} Terbit</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                        <span className="text-[11px] text-slate-400 block font-medium">Tiket Terjual</span>
                                        <span className="text-lg font-black text-slate-900">{detailOrganizer.ticketsSold}</span>
                                        <span className="text-[10px] text-emerald-600 block">Lunas</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                        <span className="text-[11px] text-slate-400 block font-medium">Omset Penjualan</span>
                                        <span className="text-base font-black text-emerald-600 truncate block">
                                            {detailOrganizer.revenueFormatted}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">Bruto</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dokumen Verifikasi if available */}
                            {detailOrganizer.applicationId && (
                                <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
                                    <div className="flex items-center gap-2.5">
                                        <FileText className="size-4.5 text-blue-600" />
                                        <div>
                                            <p className="text-xs font-bold text-blue-950">Berkas Verifikasi Terlampir</p>
                                            <p className="text-[11px] text-blue-700">Tersedia dokumen legalitas pendukung yang disetujui.</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`/admin/organizers/applications/${detailOrganizer.applicationId}/document`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                    >
                                        <span>Lihat Berkas</span>
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setDetailOrganizer(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Suspend / Aktifkan EO */}
            {statusConfirmOrganizer && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div
                                className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                    statusConfirmOrganizer.status === 'SUSPENDED'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                                {statusConfirmOrganizer.status === 'SUSPENDED' ? (
                                    <UserCheck className="size-6" />
                                ) : (
                                    <UserX className="size-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">
                                    {statusConfirmOrganizer.status === 'SUSPENDED'
                                        ? 'Aktifkan Kembali Akun EO?'
                                        : 'Tangguhkan (Suspend) Akun EO?'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Organisasi: <span className="font-bold text-slate-700">{statusConfirmOrganizer.organizationName}</span>
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            {statusConfirmOrganizer.status === 'SUSPENDED'
                                ? 'Dengan mengaktifkan akun ini kembali, EO dapat mengelola event dan tiket secara normal di platform Hajirin.'
                                : 'Penangguhan akun akan membekukan aktivitas pembuatan event baru dan akses operasional dashboard EO sampai diaktifkan kembali oleh Administrator.'}
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStatusConfirmOrganizer(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(statusConfirmOrganizer)}
                                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition shadow-xs ${
                                    statusConfirmOrganizer.status === 'SUSPENDED'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {statusConfirmOrganizer.status === 'SUSPENDED'
                                    ? 'Ya, Aktifkan Akun'
                                    : 'Ya, Tangguhkan Akun'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cabut Hak Akses EO (Revoke) */}
            {revokeConfirmOrganizer && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/70">
                            <div className="flex items-center gap-2.5">
                                <ShieldAlert className="size-5 text-rose-600" />
                                <h3 className="font-black text-rose-950 text-base">Cabut Hak Akses Event Organizer</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRevokeConfirmOrganizer(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRevokeSubmit} className="p-6 space-y-4">
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-900 space-y-1">
                                <p className="font-bold">Peringatan Tindakan Penurunan Hak Akses:</p>
                                <p>
                                    Tindakan ini akan mengembalikan role pengguna <strong>{revokeConfirmOrganizer.name}</strong> ({revokeConfirmOrganizer.organizationName}) dari Event Organizer menjadi <strong>Peserta (USER)</strong> biasa.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Alasan Pencabutan Hak Akses EO <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                    placeholder="Contoh: Terjadi pelanggaran ketentuan penyelenggaraan kegiatan atau ketidaksesuaian berkas legalitas..."
                                    rows="3"
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10 transition"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Alasan ini akan dikirimkan otomatis ke notifikasi inbox akun pengguna terkait.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRevokeConfirmOrganizer(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRevoking || !revokeReason.trim()}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                                >
                                    <ShieldAlert className="size-4" />
                                    <span>{isRevoking ? 'Memproses...' : 'Cabut Status EO'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
