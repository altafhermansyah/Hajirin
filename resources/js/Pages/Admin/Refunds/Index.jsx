import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    RefreshCw,
    CheckCircle2,
    Clock,
    Search,
    Eye,
    X,
    Check,
    MessageSquare,
    ShoppingBag,
    ArrowLeft,
    TrendingDown,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge } from '../../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../../Components/ui/UnderlineTabs';
import { Pagination } from '../../../Components/ui/Pagination';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const REFUND_STATUS_META = {
    PENDING: { tone: 'warning', label: 'Menunggu' },
    APPROVED: { tone: 'success', label: 'Disetujui' },
    COMPLETED: { tone: 'success', label: 'Disetujui' },
    REJECTED: { tone: 'danger', label: 'Ditolak' },
};

export default function RefundManagementIndex({
    refunds = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'PENDING');

    const [detailRefund, setDetailRefund] = useState(null);
    const [approvingRefund, setApprovingRefund] = useState(null);
    const [rejectingRefund, setRejectingRefund] = useState(null);
    const [viewNoteRefund, setViewNoteRefund] = useState(null);

    const approveForm = useForm({
        resolution_note: '',
    });

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
        ['PENDING', 'Menunggu Evaluasi', stats.pending || 0],
        ['APPROVED', 'Disetujui', stats.approved || 0],
        ['REJECTED', 'Ditolak', stats.rejected || 0],
        ['ALL', 'Semua Refund', stats.total || 0],
    ];

    return (
        <AdminLayout title="Pengembalian Dana (Refund)">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/orders"
                            className={buttonClass('outline', 'icon')}
                            title="Kembali ke Semua Pesanan"
                            aria-label="Kembali ke Semua Pesanan"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                            Pengembalian Dana (Refund)
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Tinjau permohonan pengembalian dana tiket dari pembeli, verifikasi alasan, dan selesaikan refund.
                    </p>
                </div>

                <Link href="/admin/orders" className={buttonClass('outline', 'md')}>
                    <ShoppingBag className="size-4 text-slate-500" aria-hidden="true" />
                    <span>Semua Pesanan</span>
                </Link>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Dana Dikembalikan"
                    icon={TrendingDown}
                    value={stats.totalRefundedFormatted || 'Rp0'}
                    subtext="Refund yang telah disahkan"
                />
                <StatCard
                    label="Total Pengajuan"
                    icon={RefreshCw}
                    value={stats.total || 0}
                    subtext="Akumulasi klaim masuk"
                />
                <StatCard
                    label="Menunggu Evaluasi"
                    icon={Clock}
                    value={stats.pending || 0}
                    subtext="Perlu verifikasi admin"
                />
                <StatCard
                    label="Refund Disetujui"
                    icon={CheckCircle2}
                    value={stats.approved || 0}
                    subtext="Tiket void & kuota kembali"
                />
            </div>

            {/* Refunds Table Card */}
            <Card className="overflow-hidden">
                <UnderlineTabs
                    items={statusTabs}
                    activeKey={selectedStatus}
                    onChange={handleStatusTabChange}
                />

                {/* Search Bar */}
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-sm relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari no invoice, alasan, nama pemohon, event..."
                            aria-label="Cari permohonan refund"
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
                </div>

                {/* Refunds Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">No. Order & Waktu</th>
                                <th scope="col" className="px-5 py-3">Event Terkait</th>
                                <th scope="col" className="px-5 py-3">Pemohon</th>
                                <th scope="col" className="px-5 py-3 text-right">Nominal Refund</th>
                                <th scope="col" className="px-5 py-3">Alasan Permohonan</th>
                                <th scope="col" className="px-5 py-3">Status</th>
                                <th scope="col" className="px-5 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {refunds.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                                        <RefreshCw className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada permohonan refund
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Semua permohonan pengembalian dana pada status ini telah diproses atau belum ada data masuk.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                refunds.data.map((rf) => {
                                    const isPending = rf.status === 'PENDING';
                                    const statusMeta = REFUND_STATUS_META[rf.status] || {
                                        tone: 'neutral',
                                        label: rf.status,
                                    };

                                    return (
                                        <tr key={rf.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={`/admin/orders?search=${encodeURIComponent(rf.orderReference)}`}
                                                    className="font-mono font-medium text-brand-blue text-xs hover:underline block"
                                                >
                                                    #{rf.orderReference}
                                                </Link>
                                                <span className="text-xs text-slate-400 tabular-nums">
                                                    {rf.requestedAtFormatted}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="max-w-xs">
                                                    <p className="font-medium text-slate-900 text-xs truncate">
                                                        {rf.event.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        EO: {rf.event.organizerName}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <p className="font-medium text-slate-900">{rf.applicant.name}</p>
                                                <p className="text-slate-500 truncate">{rf.applicant.email}</p>
                                            </td>

                                            <td className="px-5 py-3.5 text-right font-medium text-slate-900 tabular-nums">
                                                {rf.amountFormatted}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <p className="line-clamp-2 text-slate-600 max-w-xs">
                                                    {rf.reason}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5">
                                                    <StatusBadge
                                                        tone={statusMeta.tone}
                                                        label={statusMeta.label}
                                                    />
                                                    {rf.reviewerName && (
                                                        <p className="text-xs text-slate-400">
                                                            Oleh: {rf.reviewerName}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailRefund(rf)}
                                                        title="Detail Permohonan Refund"
                                                        aria-label={`Lihat detail refund #${rf.orderReference}`}
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        <Eye className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setApprovingRefund(rf);
                                                                    approveForm.setData('resolution_note', '');
                                                                }}
                                                                title="Setujui Pengembalian Dana"
                                                                aria-label={`Setujui refund #${rf.orderReference}`}
                                                                className={buttonClass('primary', 'icon')}
                                                            >
                                                                <Check className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectingRefund(rf);
                                                                    rejectForm.setData('resolution_note', '');
                                                                    rejectForm.clearErrors();
                                                                }}
                                                                title="Tolak Pengembalian Dana"
                                                                aria-label={`Tolak refund #${rf.orderReference}`}
                                                                className={buttonClass('danger-outline', 'icon')}
                                                            >
                                                                <X className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {rf.resolutionNote && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewNoteRefund(rf)}
                                                            title="Lihat Catatan Resolusi"
                                                            aria-label={`Lihat catatan resolusi #${rf.orderReference}`}
                                                            className={buttonClass('outline', 'icon')}
                                                        >
                                                            <MessageSquare className="size-3.5" aria-hidden="true" />
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

                <Pagination
                    links={refunds.links}
                    from={refunds.from}
                    to={refunds.to}
                    total={refunds.total}
                    itemLabel="permohonan"
                />
            </Card>

            {/* Modal Detail Refund */}
            <Modal
                open={Boolean(detailRefund)}
                onClose={() => setDetailRefund(null)}
                title="Detail Permohonan Refund"
                maxWidth="max-w-lg"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setDetailRefund(null)}>
                        Tutup
                    </Button>
                }
            >
                {detailRefund && (
                    <div className="space-y-4">
                        <dl className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Invoice Terkait</dt>
                                <dd className="font-mono font-medium text-slate-900">
                                    #{detailRefund.orderReference}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Event</dt>
                                <dd className="font-medium text-slate-900 text-right">
                                    {detailRefund.event.title}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-slate-500">Pemohon</dt>
                                <dd className="font-medium text-slate-900 text-right">
                                    {detailRefund.applicant.name} ({detailRefund.applicant.email})
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                <dt className="font-semibold text-slate-700">Nominal Pengembalian</dt>
                                <dd className="font-semibold text-slate-900 text-sm tabular-nums">
                                    {detailRefund.amountFormatted}
                                </dd>
                            </div>
                        </dl>

                        <div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">
                                Alasan Pengembalian
                            </p>
                            <div className="p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                                {detailRefund.reason}
                            </div>
                        </div>

                        {detailRefund.resolutionNote && (
                            <div>
                                <p className="text-xs font-medium text-slate-700 mb-1.5">
                                    Catatan Resolusi Administrator
                                </p>
                                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 leading-relaxed">
                                    {detailRefund.resolutionNote}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Setujui Refund */}
            <Modal
                open={Boolean(approvingRefund)}
                onClose={() => setApprovingRefund(null)}
                title="Setujui Pengembalian Dana"
                maxWidth="max-w-md"
            >
                {approvingRefund && (
                    <form onSubmit={handleApproveSubmit} className="space-y-4">
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                            <p className="font-semibold text-slate-900">
                                Konfirmasi Refund: {approvingRefund.amountFormatted}
                            </p>
                            <p className="leading-relaxed">
                                Penyetujuan ini akan membatalkan (VOID) tiket terkait dan mengembalikan kuota tiket ke event.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="approve-refund-note"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Catatan Konfirmasi / Instruksi Pencairan (Opsional)
                            </label>
                            <textarea
                                id="approve-refund-note"
                                value={approveForm.data.resolution_note}
                                onChange={(e) => approveForm.setData('resolution_note', e.target.value)}
                                placeholder="Contoh: Dana telah ditransfer kembali ke rekening pemohon..."
                                rows={3}
                                className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setApprovingRefund(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                loading={approveForm.processing}
                            >
                                {approveForm.processing ? 'Memproses...' : 'Ya, Setujui Refund'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal Tolak Refund */}
            <Modal
                open={Boolean(rejectingRefund)}
                onClose={() => setRejectingRefund(null)}
                title="Tolak Pengembalian Dana"
                maxWidth="max-w-md"
            >
                {rejectingRefund && (
                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900">
                            <p className="font-semibold">
                                Invoice #{rejectingRefund.orderReference} ({rejectingRefund.amountFormatted})
                            </p>
                            <p className="mt-0.5">
                                Berikan alasan mengapa permohonan pengembalian dana ini tidak dapat disetujui.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="reject-refund-note"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Alasan Penolakan <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="reject-refund-note"
                                value={rejectForm.data.resolution_note}
                                onChange={(e) => rejectForm.setData('resolution_note', e.target.value)}
                                placeholder="Contoh: Permohonan diajukan melampaui batas waktu kebijakan refund H-3 sebelum acara..."
                                rows={3}
                                required
                                className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            {rejectForm.errors.resolution_note && (
                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                    {rejectForm.errors.resolution_note}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingRefund(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                size="sm"
                                loading={rejectForm.processing}
                                disabled={!rejectForm.data.resolution_note.trim()}
                            >
                                {rejectForm.processing ? 'Menyimpan...' : 'Tolak Permohonan'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal Lihat Catatan Resolusi */}
            <Modal
                open={Boolean(viewNoteRefund)}
                onClose={() => setViewNoteRefund(null)}
                title="Catatan Resolusi Administrator"
                maxWidth="max-w-md"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setViewNoteRefund(null)}>
                        Tutup
                    </Button>
                }
            >
                {viewNoteRefund && (
                    <div className="text-xs space-y-3">
                        <p className="text-slate-500">
                            Invoice:{' '}
                            <strong className="font-mono text-slate-900">
                                #{viewNoteRefund.orderReference}
                            </strong>
                        </p>
                        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                            {viewNoteRefund.resolutionNote}
                        </div>
                        {viewNoteRefund.reviewerName && (
                            <p className="text-slate-400">
                                Diproses oleh {viewNoteRefund.reviewerName} pada{' '}
                                {viewNoteRefund.processedAtFormatted}
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
