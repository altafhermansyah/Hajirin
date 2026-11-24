import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    UserCheck,
    Building2,
    Search,
    ExternalLink,
    FileText,
    Mail,
    Phone,
    Globe,
    Eye,
    X,
    Check,
    ArrowLeft,
    Download,
    MessageSquare,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatusBadge } from '../../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../../Components/ui/UnderlineTabs';
import { Pagination } from '../../../Components/ui/Pagination';
import { Avatar } from '../../../Components/ui/Avatar';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const APP_STATUS_META = {
    PENDING: { tone: 'warning', label: 'Menunggu Evaluasi' },
    APPROVED: { tone: 'success', label: 'Disetujui' },
    REJECTED: { tone: 'danger', label: 'Ditolak' },
};

export default function EoApplicationsIndex({
    applications = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'PENDING');

    const [detailApplication, setDetailApplication] = useState(null);
    const [approvingApplication, setApprovingApplication] = useState(null);
    const [rejectingApplication, setRejectingApplication] = useState(null);
    const [viewReasonApplication, setViewReasonApplication] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

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
        ['PENDING', 'Menunggu Evaluasi', stats.pending || 0],
        ['APPROVED', 'Disetujui', stats.approved || 0],
        ['REJECTED', 'Ditolak', stats.rejected || 0],
        ['ALL', 'Semua Pengajuan', stats.total || 0],
    ];

    return (
        <AdminLayout title="Verifikasi Pengajuan Event Organizer">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/organizers"
                            className={buttonClass('outline', 'icon')}
                            title="Kembali ke Direktori EO"
                            aria-label="Kembali ke Direktori EO"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                            Verifikasi Pengajuan EO
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Evaluasi portofolio, nomor kontak, legalitas, dan berkas persyaratan pendaftaran mitra penyelenggara baru.
                    </p>
                </div>

                <Link href="/admin/organizers" className={buttonClass('outline', 'md')}>
                    <Building2 className="size-4 text-slate-500" aria-hidden="true" />
                    <span>Direktori Seluruh EO</span>
                </Link>
            </div>

            {/* Applications Table Card */}
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
                            placeholder="Cari nama organisasi, pemohon, email, no HP..."
                            aria-label="Cari pengajuan EO"
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

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">Pemohon & Organisasi</th>
                                <th scope="col" className="px-5 py-3">Kontak & Portofolio</th>
                                <th scope="col" className="px-5 py-3">Berkas Legalitas</th>
                                <th scope="col" className="px-5 py-3">Status & Evaluasi</th>
                                <th scope="col" className="px-5 py-3">Waktu Pengajuan</th>
                                <th scope="col" className="px-5 py-3 text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {applications.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                        <UserCheck className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada pengajuan ditemukan
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            Semua pengajuan Event Organizer pada kategori ini telah diproses atau belum ada data masuk.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                applications.data.map((app) => {
                                    const isPending = app.status === 'PENDING';
                                    const isApproved = app.status === 'APPROVED';
                                    const isRejected = app.status === 'REJECTED';
                                    const statusMeta = APP_STATUS_META[app.status] || {
                                        tone: 'neutral',
                                        label: app.status,
                                    };

                                    return (
                                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={app.organizationName || 'EO'}
                                                        size="md"
                                                        shape="rounded"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">
                                                            {app.organizationName}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Pemohon: {app.applicantName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Mail className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{app.applicantEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                                                        <Phone className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                        <span>{app.contactPhone || '-'}</span>
                                                    </div>
                                                    {app.portfolioUrl ? (
                                                        <a
                                                            href={app.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-brand-blue hover:underline font-medium"
                                                        >
                                                            <Globe className="size-3.5" aria-hidden="true" />
                                                            <span>Lihat Portofolio</span>
                                                            <ExternalLink className="size-3" aria-hidden="true" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400">Tanpa tautan web</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                {app.hasDocument ? (
                                                    <a
                                                        href={app.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={buttonClass('outline', 'xs')}
                                                    >
                                                        <FileText className="size-3.5 text-slate-500" aria-hidden="true" />
                                                        <span>Buka Dokumen</span>
                                                        <Download className="size-3 text-slate-400" aria-hidden="true" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Tidak ada berkas
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="space-y-1">
                                                    <StatusBadge
                                                        tone={statusMeta.tone}
                                                        label={statusMeta.label}
                                                    />
                                                    {app.reviewerName && (
                                                        <p className="text-xs text-slate-500">
                                                            Oleh: {app.reviewerName}
                                                        </p>
                                                    )}
                                                    {isRejected && app.rejectionReason && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewReasonApplication(app)}
                                                            className="text-xs text-rose-600 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <MessageSquare className="size-3" aria-hidden="true" />
                                                            <span>Catatan Evaluasi</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-slate-600 tabular-nums">
                                                <p className="font-medium text-slate-800">
                                                    {app.createdAtFormatted}
                                                </p>
                                                {app.reviewedAtFormatted && (
                                                    <p className="text-slate-400 mt-0.5">
                                                        Ditelaah: {app.reviewedAtFormatted}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailApplication(app)}
                                                        title="Lihat Detail Pengajuan"
                                                        aria-label={`Lihat detail pengajuan ${app.organizationName}`}
                                                        className={buttonClass('outline', 'icon')}
                                                    >
                                                        <Eye className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setApprovingApplication(app)}
                                                                title="Setujui Pengajuan EO"
                                                                aria-label={`Setujui pengajuan ${app.organizationName}`}
                                                                className={buttonClass('primary', 'icon')}
                                                            >
                                                                <Check className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRejectingApplication(app);
                                                                    rejectForm.setData('rejection_reason', '');
                                                                    rejectForm.clearErrors();
                                                                }}
                                                                title="Tolak Pengajuan EO"
                                                                aria-label={`Tolak pengajuan ${app.organizationName}`}
                                                                className={buttonClass('danger-outline', 'icon')}
                                                            >
                                                                <X className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {isApproved && (
                                                        <Link
                                                            href={`/admin/organizers?search=${encodeURIComponent(app.organizationName)}`}
                                                            title="Buka di Direktori EO"
                                                            aria-label={`Buka ${app.organizationName} di Direktori EO`}
                                                            className={buttonClass('outline', 'icon')}
                                                        >
                                                            <Building2 className="size-3.5" aria-hidden="true" />
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

                <Pagination
                    links={applications.links}
                    from={applications.from}
                    to={applications.to}
                    total={applications.total}
                    itemLabel="pengajuan"
                />
            </Card>

            {/* Modal Detail Pengajuan EO */}
            <Modal
                open={Boolean(detailApplication)}
                onClose={() => setDetailApplication(null)}
                title="Rincian Pengajuan Akun EO"
                maxWidth="max-w-xl"
                footer={
                    <div className="flex w-full items-center justify-between gap-2">
                        <div>
                            {detailApplication?.status === 'PENDING' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            const target = detailApplication;
                                            setDetailApplication(null);
                                            setApprovingApplication(target);
                                        }}
                                    >
                                        <Check className="size-3.5" aria-hidden="true" />
                                        <span>Setujui</span>
                                    </Button>
                                    <Button
                                        variant="danger-outline"
                                        size="sm"
                                        onClick={() => {
                                            const target = detailApplication;
                                            setDetailApplication(null);
                                            setRejectingApplication(target);
                                            rejectForm.setData('rejection_reason', '');
                                            rejectForm.clearErrors();
                                        }}
                                    >
                                        <X className="size-3.5" aria-hidden="true" />
                                        <span>Tolak</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setDetailApplication(null)}>
                            Tutup
                        </Button>
                    </div>
                }
            >
                {detailApplication && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-xs font-medium text-slate-500">
                                Nama Organisasi / Komunitas
                            </p>
                            <h4 className="text-base font-semibold text-slate-900 mt-0.5">
                                {detailApplication.organizationName}
                            </h4>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Pemohon</span>
                                    <span className="font-medium text-slate-900">
                                        {detailApplication.applicantName}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Email Akun</span>
                                    <span className="font-medium text-slate-900">
                                        {detailApplication.applicantEmail}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">No. Telepon / WhatsApp</span>
                                    <span className="font-medium text-slate-900 font-mono">
                                        {detailApplication.contactPhone || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Status Pengajuan</span>
                                    <div className="mt-0.5">
                                        <StatusBadge
                                            tone={APP_STATUS_META[detailApplication.status]?.tone || 'neutral'}
                                            label={APP_STATUS_META[detailApplication.status]?.label || detailApplication.status}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">
                                Alasan & Motivasi Mengajukan Sebagai Event Organizer
                            </p>
                            <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                                {detailApplication.reason || 'Tidak ada alasan khusus yang dicantumkan.'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                <span className="text-slate-500 block mb-1">Tautan Portofolio</span>
                                {detailApplication.portfolioUrl ? (
                                    <a
                                        href={detailApplication.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue hover:underline font-medium inline-flex items-center gap-1 break-all"
                                    >
                                        <span>{detailApplication.portfolioUrl}</span>
                                        <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                                    </a>
                                ) : (
                                    <span className="text-slate-400">Tidak ada tautan</span>
                                )}
                            </div>

                            <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between gap-2">
                                <div>
                                    <span className="text-slate-500 block mb-0.5">Berkas Verifikasi</span>
                                    <span className="text-slate-800 font-medium">
                                        {detailApplication.hasDocument
                                            ? 'Dokumen terlampir di server'
                                            : 'Tidak melampirkan berkas'}
                                    </span>
                                </div>
                                {detailApplication.hasDocument && (
                                    <a
                                        href={detailApplication.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={buttonClass('outline', 'xs', 'w-full')}
                                    >
                                        <Download className="size-3.5 text-slate-500" aria-hidden="true" />
                                        <span>Buka / Unduh Berkas</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {detailApplication.status === 'REJECTED' && detailApplication.rejectionReason && (
                            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 text-xs text-rose-900">
                                <p className="font-semibold mb-1">Catatan Evaluasi / Alasan Penolakan</p>
                                <p className="leading-relaxed">{detailApplication.rejectionReason}</p>
                                {detailApplication.reviewerName && (
                                    <p className="text-rose-700 mt-2">
                                        Ditolak oleh {detailApplication.reviewerName} pada{' '}
                                        {detailApplication.reviewedAtFormatted}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Persetujuan (Approve) */}
            <Modal
                open={Boolean(approvingApplication)}
                onClose={() => setApprovingApplication(null)}
                title="Setujui Pengajuan Event Organizer?"
                description={
                    approvingApplication
                        ? `Organisasi: ${approvingApplication.organizationName}`
                        : null
                }
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setApprovingApplication(null)}
                        >
                            Batal
                        </Button>
                        {approvingApplication && (
                            <Button
                                variant="primary"
                                size="sm"
                                loading={isApproving}
                                onClick={() => handleApprove(approvingApplication)}
                            >
                                {isApproving ? 'Memproses...' : 'Ya, Setujui Pengajuan'}
                            </Button>
                        )}
                    </>
                }
            >
                {approvingApplication && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Setelah disetujui, role akun pengguna{' '}
                        <strong className="text-slate-900">{approvingApplication.applicantName}</strong> akan
                        otomatis ditingkatkan menjadi{' '}
                        <strong className="text-slate-900">Event Organizer (EO)</strong> dan pemohon akan
                        menerima notifikasi resmi.
                    </p>
                )}
            </Modal>

            {/* Modal Tolak Pengajuan (Reject) */}
            <Modal
                open={Boolean(rejectingApplication)}
                onClose={() => setRejectingApplication(null)}
                title="Tolak Pengajuan Event Organizer"
                maxWidth="max-w-lg"
            >
                {rejectingApplication && (
                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
                            <p className="font-semibold text-slate-900">
                                Pemohon: {rejectingApplication.applicantName} (
                                {rejectingApplication.organizationName})
                            </p>
                            <p className="mt-1 text-slate-600">
                                Berikan catatan evaluasi yang jelas agar pemohon dapat memperbaiki dokumen atau persyaratan yang kurang.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="app-reject-reason"
                                className="block text-xs font-medium text-slate-700 mb-1.5"
                            >
                                Alasan Penolakan / Catatan Evaluasi <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="app-reject-reason"
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                placeholder="Contoh: Dokumen legalitas/KTP penanggung jawab buram dan belum dapat diverifikasi. Harap unggah ulang berkas yang terbaca jelas..."
                                rows={4}
                                required
                                className="w-full p-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            {rejectForm.errors.rejection_reason && (
                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                    {rejectForm.errors.rejection_reason}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
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
                                disabled={!rejectForm.data.rejection_reason.trim()}
                            >
                                {rejectForm.processing ? 'Menyimpan...' : 'Tolak Pengajuan'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal Lihat Alasan Penolakan (View Reason) */}
            <Modal
                open={Boolean(viewReasonApplication)}
                onClose={() => setViewReasonApplication(null)}
                title="Catatan Evaluasi Penolakan"
                maxWidth="max-w-md"
                footer={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewReasonApplication(null)}
                    >
                        Tutup
                    </Button>
                }
            >
                {viewReasonApplication && (
                    <div className="text-xs space-y-3">
                        <p className="text-slate-500">
                            Organisasi:{' '}
                            <strong className="text-slate-900">
                                {viewReasonApplication.organizationName}
                            </strong>
                        </p>
                        <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900 leading-relaxed">
                            {viewReasonApplication.rejectionReason}
                        </div>
                        {viewReasonApplication.reviewerName && (
                            <p className="text-slate-400">
                                Ditinjau oleh {viewReasonApplication.reviewerName} pada{' '}
                                {viewReasonApplication.reviewedAtFormatted}
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
