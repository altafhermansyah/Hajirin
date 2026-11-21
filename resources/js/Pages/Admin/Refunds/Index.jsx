import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ChevronDown,
    Building2,
    Eye,
    X,
    AlertCircle,
    Check,
    FileText,
    MessageSquare,
    DollarSign,
    ShoppingBag,
    ArrowLeft,
    TrendingDown,
} from 'lucide-react';

export default function RefundManagementIndex({
    refunds = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    // Filters
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'PENDING');

    // Modals
    const [detailRefund, setDetailRefund] = useState(null);
    const [approvingRefund, setApprovingRefund] = useState(null);
    const [rejectingRefund, setRejectingRefund] = useState(null);
    const [viewNoteRefund, setViewNoteRefund] = useState(null);

    // Form Approve
    const approveForm = useForm({
        resolution_note: '',
    });

    // Form Reject
    const rejectForm = useForm({
        resolution_note: '',
    });

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
        };

        if (!queryParams.search) delete queryParams.search;
        if (queryParams.status === 'ALL') delete queryParams.status;

        router.get('/admin/refunds', queryParams, {
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

    const handleApproveSubmit = (e) => {
        e.preventDefault();
        if (!approvingRefund) return;

        approveForm.post(`/admin/refunds/${approvingRefund.id}/approve`, {
            preserveScroll: true,
            onSuccess: () => {
                setApprovingRefund(null);
                approveForm.reset();
            },
        });
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        if (!rejectingRefund) return;

        rejectForm.post(`/admin/refunds/${rejectingRefund.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingRefund(null);
                rejectForm.reset();
            },
        });
    };

    const statusTabs = [
        { key: 'PENDING', label: 'Menunggu Evaluasi', count: stats.pending, color: 'text-amber-700 bg-amber-100' },
        { key: 'APPROVED', label: 'Disetujui', count: stats.approved, color: 'text-emerald-700 bg-emerald-100' },
        { key: 'REJECTED', label: 'Ditolak', count: stats.rejected, color: 'text-rose-700 bg-rose-100' },
        { key: 'ALL', label: 'Semua Refund', count: stats.total, color: 'text-slate-700 bg-slate-200' },
    ];

    return (
        <AdminLayout title="Kelola Pengembalian Dana (Refund)">
            <Head title="Manajemen Refund - Admin Hajirin" />

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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/orders"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Kembali ke Semua Pesanan"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Pengembalian Dana (Refund)
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            {stats.pending || 0} Perlu Ditinjau
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Tinjau permohonan pengembalian dana tiket dari pembeli, verifikasi alasan, dan selesaikan refund.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                    >
                        <ShoppingBag className="size-4 text-slate-500" />
                        <span>Semua Pesanan</span>
                    </Link>
                </div>
            </div>

            {/* Integrated Refund Telemetry Strip */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* Total Refunded */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Dana Dikembalikan
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                            <TrendingDown className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                            {stats.totalRefundedFormatted || 'Rp0'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Refund yang telah disahkan
                        </p>
                    </div>
                </div>

                {/* Total Pengajuan */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Pengajuan
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <RefreshCw className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                            {stats.total || 0}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Akumulasi klaim masuk
                        </p>
                    </div>
                </div>

                {/* Menunggu Evaluasi */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Menunggu Evaluasi
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <Clock className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-amber-700 tracking-tight font-mono">
                            {stats.pending || 0}
                        </p>
                        <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                            Perlu verifikasi admin
                        </p>
                    </div>
                </div>

                {/* Disetujui */}
                <div className="p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Refund Disetujui
                        </span>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="size-4" />
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
                            {stats.approved || 0}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            Tiket void & kuota kembali
                        </p>
                    </div>
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
                            placeholder="Cari no invoice, alasan, nama pemohon, event..."
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

            {/* Refunds Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">No. Order & Waktu</th>
                                <th scope="col" className="px-6 py-4">Event Terkait</th>
                                <th scope="col" className="px-6 py-4">Pemohon</th>
                                <th scope="col" className="px-6 py-4 text-right">Nominal Refund</th>
                                <th scope="col" className="px-6 py-4">Alasan Permohonan</th>
                                <th scope="col" className="px-6 py-4 text-center">Status</th>
                                <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {refunds.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                                        <RefreshCw className="mx-auto size-12 text-slate-300 mb-3" />
                                        <p className="font-bold text-slate-800 text-base">Tidak ada permohonan refund</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Semua permohonan pengembalian dana pada status ini telah diproses atau belum ada data masuk.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                refunds.data.map((rf) => {
                                    const isPending = rf.status === 'PENDING';
                                    const isApproved = rf.status === 'APPROVED' || rf.status === 'COMPLETED';
                                    const isRejected = rf.status === 'REJECTED';

                                    return (
                                        <tr key={rf.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Order Reference */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <Link
                                                        href={`/admin/orders?search=${encodeURIComponent(rf.orderReference)}`}
                                                        className="font-mono font-bold text-blue-600 text-xs hover:underline"
                                                    >
                                                        #{rf.orderReference}
                                                    </Link>
                                                    <p className="text-xs text-slate-500">{rf.requestedAtFormatted}</p>
                                                </div>
                                            </td>

                                            {/* Event */}
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                                        {rf.event.title}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        EO: {rf.event.organizerName}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Applicant */}
                                            <td className="px-6 py-4 text-xs">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-800">{rf.applicant.name}</p>
                                                    <p className="text-slate-500 text-[11px] truncate">{rf.applicant.email}</p>
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-block text-right">
                                                    <span className="font-extrabold text-sm text-rose-600">
                                                        {rf.amountFormatted}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Reason */}
                                            <td className="px-6 py-4 text-xs">
                                                <p className="line-clamp-2 text-slate-700 max-w-xs">{rf.reason}</p>
                                            </td>

                                            {/* Status & Reviewer */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-block text-center space-y-1">
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock className="size-3.5" />
                                                            Menunggu
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

                                                    {rf.reviewerName && (
                                                        <p className="text-[10px] text-slate-400">
                                                            Oleh: {rf.reviewerName}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Detail View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailRefund(rf)}
                                                        title="Detail Permohonan Refund"
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>

                                                    {/* If Pending: Approve & Reject */}
                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setApprovingRefund(rf);
                                                                    approveForm.setData('resolution_note', '');
                                                                }}
                                                                title="Setujui Pengembalian Dana"
                                                                className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                                            >
                                                                <Check className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectingRefund(rf);
                                                                    rejectForm.setData('resolution_note', '');
                                                                    rejectForm.clearErrors();
                                                                }}
                                                                title="Tolak Pengembalian Dana"
                                                                className="p-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* If has resolution note */}
                                                    {rf.resolutionNote && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewNoteRefund(rf)}
                                                            title="Lihat Catatan Resolusi"
                                                            className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
                                                        >
                                                            <MessageSquare className="size-4" />
                                                        </button>
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
                {refunds.links && refunds.links.length > 3 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{refunds.data.length}</span> dari{' '}
                            <span className="font-bold text-slate-800">{refunds.total || refunds.data.length}</span> Permohonan
                        </p>
                        <div className="flex items-center gap-1">
                            {refunds.links.map((link, idx) => (
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

            {/* Modal Detail Refund */}
            {detailRefund && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="size-5 text-rose-600" />
                                <h3 className="font-black text-slate-900 text-base">Detail Permohonan Refund</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailRefund(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Summary Card */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Invoice Terkait:</span>
                                    <span className="font-mono font-bold text-blue-700">#{detailRefund.orderReference}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Event:</span>
                                    <span className="font-bold text-slate-800">{detailRefund.event.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Pemohon:</span>
                                    <span className="font-bold text-slate-800">{detailRefund.applicant.name} ({detailRefund.applicant.email})</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span className="font-bold text-slate-700">Nominal Pengembalian:</span>
                                    <span className="font-black text-rose-600 text-base">{detailRefund.amountFormatted}</span>
                                </div>
                            </div>

                            {/* Alasan */}
                            <div>
                                <h5 className="text-xs font-bold text-slate-700 mb-1">Alasan Pengembalian:</h5>
                                <div className="p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                                    {detailRefund.reason}
                                </div>
                            </div>

                            {/* Resolution Note if present */}
                            {detailRefund.resolutionNote && (
                                <div>
                                    <h5 className="text-xs font-bold text-slate-700 mb-1">Catatan Resolusi Administrator:</h5>
                                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 leading-relaxed">
                                        {detailRefund.resolutionNote}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setDetailRefund(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Setujui Refund */}
            {approvingRefund && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/80">
                            <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-base">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                                <span>Setujui Pengembalian Dana</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setApprovingRefund(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                                <p className="font-bold">
                                    Konfirmasi Refund: {approvingRefund.amountFormatted}
                                </p>
                                <p>
                                    Penyetujuan ini akan membatalkan (VOID) tiket terkait dan mengembalikan kuota tiket ke event.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Catatan Konfirmasi / Instruksi Pencairan (Opsional)
                                </label>
                                <textarea
                                    value={approveForm.data.resolution_note}
                                    onChange={(e) => approveForm.setData('resolution_note', e.target.value)}
                                    placeholder="Contoh: Dana telah ditransfer kembali ke rekening pemohon / instruksi selesai..."
                                    rows="3"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setApprovingRefund(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={approveForm.processing}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
                                >
                                    {approveForm.processing ? 'Memproses...' : 'Ya, Setujui Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tolak Refund */}
            {rejectingRefund && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/70">
                            <div className="flex items-center gap-2 text-rose-950 font-extrabold text-base">
                                <XCircle className="size-5 text-rose-600" />
                                <span>Tolak Pengembalian Dana</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingRefund(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                                <p className="font-bold">
                                    Invoice: #{rejectingRefund.orderReference} ({rejectingRefund.amountFormatted})
                                </p>
                                <p className="mt-0.5">Berikan alasan mengapa permohonan pengembalian dana ini tidak dapat disetujui.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Alasan Penolakan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={rejectForm.data.resolution_note}
                                    onChange={(e) => rejectForm.setData('resolution_note', e.target.value)}
                                    placeholder="Contoh: Permohonan diajukan melampaui batas waktu kebijakan refund H-3 sebelum acara..."
                                    rows="3"
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10 transition"
                                />
                                {rejectForm.errors.resolution_note && (
                                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                                        {rejectForm.errors.resolution_note}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingRefund(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing || !rejectForm.data.resolution_note.trim()}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
                                >
                                    {rejectForm.processing ? 'Menyimpan...' : 'Tolak Permohonan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Lihat Catatan Resolusi */}
            {viewNoteRefund && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
                                <MessageSquare className="size-4.5 text-blue-600" />
                                <span>Catatan Resolusi Administrator</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewNoteRefund(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="text-xs space-y-2">
                            <p className="text-slate-500">
                                Invoice: <strong className="font-mono text-slate-800">#{viewNoteRefund.orderReference}</strong>
                            </p>
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium">
                                {viewNoteRefund.resolutionNote}
                            </div>
                            {viewNoteRefund.reviewerName && (
                                <p className="text-[11px] text-slate-400">
                                    Diproses oleh {viewNoteRefund.reviewerName} pada {viewNoteRefund.processedAtFormatted}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setViewNoteRefund(null)}
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
