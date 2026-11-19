import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    UserCheck,
    Building2,
    Search,
    ChevronDown,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    FileText,
    Mail,
    Phone,
    Globe,
    AlertTriangle,
    Eye,
    X,
    Check,
    XCircle,
    ArrowLeft,
    Clock,
    User,
    Download,
    MessageSquare,
} from 'lucide-react';

export default function EoApplicationsIndex({
    applications = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'PENDING');

    // Modals & Active items
    const [detailApplication, setDetailApplication] = useState(null);
    const [approvingApplication, setApprovingApplication] = useState(null);
    const [rejectingApplication, setRejectingApplication] = useState(null);
    const [viewReasonApplication, setViewReasonApplication] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

    // Reject Form
    const rejectForm = useForm({
        rejection_reason: '',
    });

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
        };

        if (!queryParams.search) delete queryParams.search;
        if (queryParams.status === 'ALL') delete queryParams.status;

        router.get('/admin/organizers/applications', queryParams, {
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

    const handleApprove = (app) => {
        setIsApproving(true);
        router.post(
            `/admin/organizers/applications/${app.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApprovingApplication(null);
                    setIsApproving(false);
                },
                onError: () => {
                    setIsApproving(false);
                },
            }
        );
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectingApplication) return;

        rejectForm.post(`/admin/organizers/applications/${rejectingApplication.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingApplication(null);
                rejectForm.reset();
            },
        });
    };

    const statusTabs = [
        { key: 'PENDING', label: 'Menunggu Evaluasi', count: stats.pending, color: 'text-amber-700 bg-amber-100' },
        { key: 'APPROVED', label: 'Disetujui', count: stats.approved, color: 'text-emerald-700 bg-emerald-100' },
        { key: 'REJECTED', label: 'Ditolak', count: stats.rejected, color: 'text-rose-700 bg-rose-100' },
        { key: 'ALL', label: 'Semua Pengajuan', count: stats.total, color: 'text-slate-700 bg-slate-200' },
    ];

    return (
        <AdminLayout title="Verifikasi Pengajuan Event Organizer">
            <Head title="Verifikasi Pengajuan EO - Admin Hajirin" />

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

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/organizers"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Kembali ke Direktori EO"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Verifikasi Pengajuan Event Organizer
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {stats.pending || 0} Perlu Tindakan
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Evaluasi portofolio, nomor kontak, legalitas, dan berkas persyaratan pendaftaran mitra penyelenggara baru.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/organizers"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                    >
                        <Building2 className="size-4 text-slate-500" />
                        <span>Direktori Seluruh EO</span>
                    </Link>
                </div>
            </div>

            {/* Filter and Tab Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                    {statusTabs.map((tab) => {
                        const isActive = selectedStatus === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleStatusTabChange(tab.key)}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                        isActive ? 'bg-white/20 text-white' : tab.color
                                    }`}
                                >
                                    {tab.count || 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama organisasi, pemohon, email, no HP..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                    </form>

                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                applyFilters({ search: '' });
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                        >
                            <X className="size-3.5" />
                            <span>Hapus Pencarian</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">Pemohon & Organisasi</th>
                                <th scope="col" className="px-6 py-4">Kontak & Portofolio</th>
                                <th scope="col" className="px-6 py-4 text-center">Berkas Legalitas</th>
                                <th scope="col" className="px-6 py-4 text-center">Status & Evaluasi</th>
                                <th scope="col" className="px-6 py-4">Waktu Pengajuan</th>
                                <th scope="col" className="px-6 py-4 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                                        <UserCheck className="mx-auto size-12 text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-800 text-base">Tidak ada pengajuan ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Semua pengajuan Event Organizer pada kategori ini telah diproses atau belum ada data yang masuk.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                applications.data.map((app) => {
                                    const isPending = app.status === 'PENDING';
                                    const isApproved = app.status === 'APPROVED';
                                    const isRejected = app.status === 'REJECTED';

                                    return (
                                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Applicant & Organization */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 uppercase text-sm">
                                                        {app.organizationName ? app.organizationName.substring(0, 2) : 'EO'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-slate-900 truncate">
                                                            {app.organizationName}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <span>Pemohon: {app.applicantName}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact & Portfolio */}
                                            <td className="px-6 py-4 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Mail className="size-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{app.applicantEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Phone className="size-3.5 text-slate-400 shrink-0" />
                                                        <span>{app.contactPhone || '-'}</span>
                                                    </div>
                                                    {app.portfolioUrl ? (
                                                        <a
                                                            href={app.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                                        >
                                                            <Globe className="size-3.5 text-blue-500" />
                                                            <span>Lihat Portofolio</span>
                                                            <ExternalLink className="size-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Tanpa tautan web</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Document */}
                                            <td className="px-6 py-4 text-center">
                                                {app.hasDocument ? (
                                                    <a
                                                        href={app.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition shadow-xs"
                                                    >
                                                        <FileText className="size-3.5" />
                                                        <span>Buka Dokumen</span>
                                                        <Download className="size-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Tidak ada berkas</span>
                                                )}
                                            </td>

                                            {/* Status & Reviewer */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-block text-center space-y-1">
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock className="size-3.5" />
                                                            Menunggu Evaluasi
                                                        </span>
                                                    )}
                                                    {isApproved && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Disetujui
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <XCircle className="size-3.5" />
                                                            Ditolak
                                                        </span>
                                                    )}

                                                    {/* Reviewer Info */}
                                                    {app.reviewerName && (
                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                            Oleh: {app.reviewerName}
                                                        </p>
                                                    )}

                                                    {/* Reason Button if Rejected */}
                                                    {isRejected && app.rejectionReason && (
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewReasonApplication(app)}
                                                                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold hover:underline inline-flex items-center gap-1"
                                                            >
                                                                <MessageSquare className="size-3" />
                                                                <span>Catatan Evaluasi</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Submission Date */}
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                <p className="font-semibold text-slate-700">{app.createdAtFormatted}</p>
                                                {app.reviewedAtFormatted && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Ditelaah: {app.reviewedAtFormatted}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Detail Application Modal */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailApplication(app)}
                                                        title="Lihat Detail Pengajuan"
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>

                                                    {/* Actions if Pending */}
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setApprovingApplication(app)}
                                                                title="Setujui Pengajuan EO"
                                                                className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                                            >
                                                                <Check className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectingApplication(app);
                                                                    rejectForm.setData('rejection_reason', '');
                                                                    rejectForm.clearErrors();
                                                                }}
                                                                title="Tolak Pengajuan EO"
                                                                className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* If Approved: quick link to directory */}
                                                    {isApproved && (
                                                        <Link
                                                            href={`/admin/organizers?search=${encodeURIComponent(app.organizationName)}`}
                                                            title="Buka di Direktori EO"
                                                            className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                                                        >
                                                            <Building2 className="size-4" />
                                                        </Link>
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

                {/* Pagination */}
                {applications.links && applications.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{applications.data.length}</span> dari{' '}
                            <span className="font-bold text-slate-800">{applications.total || applications.data.length}</span> Pengajuan
                        </p>
                        <div className="flex items-center gap-1">
                            {applications.links.map((link, idx) => (
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

            {/* Modal Detail Pengajuan EO */}
            {detailApplication && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                                <Building2 className="size-5 text-blue-600" />
                                <h3 className="font-black text-slate-900 text-base">Rincian Pengajuan Akun EO</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailApplication(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Organization Profile */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Nama Organisasi / Komunitas
                                </span>
                                <h4 className="text-xl font-black text-slate-900">{detailApplication.organizationName}</h4>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                    <div>
                                        <span className="font-semibold text-slate-400 block">Pemohon:</span>
                                        <span className="font-bold text-slate-800">{detailApplication.applicantName}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-400 block">Email Akun:</span>
                                        <span className="font-bold text-slate-800">{detailApplication.applicantEmail}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-400 block">No. Telepon / WhatsApp:</span>
                                        <span className="font-bold text-slate-800">{detailApplication.contactPhone || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-400 block">Status Pengajuan:</span>
                                        <span className="font-bold text-slate-800">{detailApplication.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Alasan / Motivasi Pengajuan */}
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 mb-1">
                                    Alasan & Motivasi Mengajukan Sebagai Event Organizer:
                                </h5>
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                                    {detailApplication.reason || 'Tidak ada alasan khusus yang dicantumkan.'}
                                </div>
                            </div>

                            {/* Portofolio & Dokumen */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                                    <span className="text-slate-400 font-semibold block mb-1">Tautan Portofolio:</span>
                                    {detailApplication.portfolioUrl ? (
                                        <a
                                            href={detailApplication.portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1 break-all"
                                        >
                                            <span>{detailApplication.portfolioUrl}</span>
                                            <ExternalLink className="size-3 shrink-0" />
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 italic">Tidak ada tautan</span>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                                    <div>
                                        <span className="text-slate-400 font-semibold block mb-1">Berkas Verifikasi:</span>
                                        <span className="text-slate-700 font-medium">
                                            {detailApplication.hasDocument ? 'Dokumen terlampir di server' : 'Tidak melampirkan berkas'}
                                        </span>
                                    </div>
                                    {detailApplication.hasDocument && (
                                        <a
                                            href={detailApplication.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                                        >
                                            <Download className="size-3.5" />
                                            <span>Buka / Unduh Berkas</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Rejection Note if Rejected */}
                            {detailApplication.status === 'REJECTED' && detailApplication.rejectionReason && (
                                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-xs text-rose-900">
                                    <p className="font-bold mb-1">Catatan Evaluasi / Alasan Penolakan:</p>
                                    <p className="leading-relaxed">{detailApplication.rejectionReason}</p>
                                    {detailApplication.reviewerName && (
                                        <p className="text-[10px] text-rose-600 mt-2 font-medium">
                                            Ditolak oleh {detailApplication.reviewerName} pada {detailApplication.reviewedAtFormatted}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <div>
                                {detailApplication.status === 'PENDING' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = detailApplication;
                                                setDetailApplication(null);
                                                setApprovingApplication(target);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                                        >
                                            <Check className="size-3.5" />
                                            <span>Setujui</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = detailApplication;
                                                setDetailApplication(null);
                                                setRejectingApplication(target);
                                                rejectForm.setData('rejection_reason', '');
                                                rejectForm.clearErrors();
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                                        >
                                            <X className="size-3.5" />
                                            <span>Tolak</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailApplication(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Persetujuan (Approve) */}
            {approvingApplication && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-base">
                                    Setujui Pengajuan Event Organizer?
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Organisasi: <span className="font-bold text-slate-700">{approvingApplication.organizationName}</span>
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Setelah disetujui, role akun pengguna <strong>{approvingApplication.applicantName}</strong> akan otomatis ditingkatkan menjadi <strong>Event Organizer (EO)</strong> dan pemohon akan menerima notifikasi resmi.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setApprovingApplication(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isApproving}
                                onClick={() => handleApprove(approvingApplication)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                            >
                                <Check className="size-4" />
                                <span>{isApproving ? 'Memproses...' : 'Ya, Setujui Pengajuan'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tolak Pengajuan (Reject) */}
            {rejectingApplication && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/70">
                            <div className="flex items-center gap-2.5">
                                <XCircle className="size-5 text-rose-600" />
                                <h3 className="font-black text-rose-950 text-base">Tolak Pengajuan Event Organizer</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingApplication(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-900">
                                <p className="font-bold">
                                    Pemohon: {rejectingApplication.applicantName} ({rejectingApplication.organizationName})
                                </p>
                                <p className="mt-0.5 text-rose-800">
                                    Berikan catatan evaluasi yang jelas agar pemohon dapat memperbaiki dokumen atau persyaratan yang kurang.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Alasan Penolakan / Catatan Evaluasi <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    placeholder="Contoh: Dokumen legalitas/KTP penanggung jawab buram dan belum dapat diverifikasi. Harap unggah ulang berkas yang terbaca jelas..."
                                    rows="4"
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10 transition"
                                />
                                {rejectForm.errors.rejection_reason && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                        {rejectForm.errors.rejection_reason}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingApplication(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing || !rejectForm.data.rejection_reason.trim()}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                                >
                                    <X className="size-4" />
                                    <span>{rejectForm.processing ? 'Menyimpan...' : 'Tolak Pengajuan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Lihat Alasan Penolakan (View Reason) */}
            {viewReasonApplication && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                                <MessageSquare className="size-4.5" />
                                <span>Catatan Evaluasi Penolakan</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewReasonApplication(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="text-xs space-y-2">
                            <p className="text-slate-500">
                                Organisasi:{' '}
                                <strong className="text-slate-800">{viewReasonApplication.organizationName}</strong>
                            </p>
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 leading-relaxed font-medium">
                                {viewReasonApplication.rejectionReason}
                            </div>
                            {viewReasonApplication.reviewerName && (
                                <p className="text-[11px] text-slate-400">
                                    Ditinjau oleh {viewReasonApplication.reviewerName} pada{' '}
                                    {viewReasonApplication.reviewedAtFormatted}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setViewReasonApplication(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
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
