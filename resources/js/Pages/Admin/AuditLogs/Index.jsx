import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { Pagination } from '../../../Components/ui/Pagination';
import { Button } from '../../../Components/ui/Button';
import { Clock, Eye, RotateCcw, Search, ShieldCheck } from 'lucide-react';

const ACTION_META = {
    'eo_document.viewed': { label: 'Lihat Dokumen KTP EO', tone: 'info' },
    'eo_documents.purged': { label: 'Pembersihan Dokumen EO', tone: 'neutral' },
    'attendees.exported': { label: 'Ekspor CSV Peserta', tone: 'info' },
    'account.exported': { label: 'Unduh Data Pribadi', tone: 'info' },
    'account.deleted': { label: 'Hapus Akun Pengguna', tone: 'danger' },
    'order.marked_paid': { label: 'Konfirmasi Lunas Manual', tone: 'warning' },
    'refund.approved': { label: 'Refund Disetujui', tone: 'success' },
    'refund.rejected': { label: 'Refund Ditolak', tone: 'danger' },
    'user.status_changed': { label: 'Ubah Status Akun', tone: 'warning' },
    'eo.revoked': { label: 'Cabut Hak Akses EO', tone: 'danger' },
    'event.moderated': { label: 'Moderasi Event', tone: 'success' },
    'event.cancelled': { label: 'Pembatalan Event', tone: 'danger' },
    'eo_application.reviewed': { label: 'Tinjau Pengajuan EO', tone: 'success' },
};

function formatMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') return '-';
    const entries = Object.entries(metadata).filter(([, v]) => v !== null && v !== '');
    if (entries.length === 0) return '-';

    return entries
        .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'ya' : 'tidak') : String(value)}`)
        .join(' · ');
}

export default function AdminAuditLogsIndex({
    logs = { data: [], links: [] },
    availableActions = [],
    stats = {},
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || 'ALL');

    const applyFilters = (nextSearch, nextAction) => {
        const query = {};
        if (nextSearch.trim() !== '') query.search = nextSearch.trim();
        if (nextAction && nextAction !== 'ALL') query.action = nextAction;

        router.get('/admin/audit-logs', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        applyFilters(search, action);
    };

    const handleReset = () => {
        setSearch('');
        setAction('ALL');
        router.get('/admin/audit-logs', {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout title="Log Audit">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                        Log Audit Keamanan &amp; Privasi
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Rekam jejak read-only untuk akses data pribadi, tindakan finansial, dan moderasi platform.
                    </p>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Aktivitas"
                        value={stats.total ?? 0}
                        icon={ShieldCheck}
                        subtext="Seluruh catatan audit"
                    />
                    <StatCard
                        label="Hari Ini"
                        value={stats.today ?? 0}
                        icon={Clock}
                        subtext="Tercatat sejak 00:00 WIB"
                    />
                    <StatCard
                        label="Akses Data Pribadi"
                        value={stats.piiAccess ?? 0}
                        icon={Eye}
                        subtext="KTP, ekspor CSV, & akun"
                    />
                    <StatCard
                        label="Moderasi & Finansial"
                        value={stats.moderation ?? 0}
                        icon={ShieldCheck}
                        subtext="Suspend, refund, & event"
                    />
                </div>

                {/* Filter & Tabel */}
                <Card className="overflow-hidden">
                    <form
                        onSubmit={handleSubmit}
                        className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-3"
                    >
                        <div className="relative flex-1">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari aktor, email, IP, aksi, atau ID..."
                                aria-label="Cari catatan log audit"
                                className="w-full h-11 sm:h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                            />
                        </div>

                        <select
                            value={action}
                            onChange={(e) => {
                                const val = e.target.value;
                                setAction(val);
                                applyFilters(search, val);
                            }}
                            aria-label="Filter jenis aksi"
                            className="h-11 sm:h-10 rounded-lg border border-slate-200 bg-white px-3 text-base sm:text-sm text-slate-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                        >
                            <option value="ALL">Semua Jenis Aksi</option>
                            {availableActions.map((act) => (
                                <option key={act} value={act}>
                                    {ACTION_META[act]?.label || act}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button type="submit" variant="primary" size="md">
                                Filter
                            </Button>
                            {(search || action !== 'ALL') && (
                                <Button type="button" variant="outline" size="md" onClick={handleReset}>
                                    <RotateCcw className="size-3.5" aria-hidden="true" />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>
                    </form>

                    <div
                        tabIndex={0}
                        role="region"
                        aria-label="Tabel log audit sistem"
                        className="overflow-x-auto"
                    >
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                                    <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Aksi</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Aktor</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Target</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Detail &amp; IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {logs.data.length > 0 ? (
                                    logs.data.map((log) => {
                                        const meta = ACTION_META[log.action] || {
                                            label: log.action,
                                            tone: 'neutral',
                                        };

                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/60 align-top">
                                                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 tabular-nums">
                                                    {log.createdAtFormatted}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <StatusBadge tone={meta.tone} label={meta.label} />
                                                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                                                        {log.action}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="font-medium text-slate-900">
                                                        {log.actor.name}
                                                    </p>
                                                    <p className="text-slate-500">{log.actor.email}</p>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {log.subjectType ? (
                                                        <NeutralTag>{log.subjectType}</NeutralTag>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                    {log.subjectId && (
                                                        <p className="mt-1 font-mono text-[11px] text-slate-500 max-w-36 truncate" title={log.subjectId}>
                                                            {log.subjectId}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 max-w-xs">
                                                    <p className="text-slate-700 break-words">
                                                        {formatMetadata(log.metadata)}
                                                    </p>
                                                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                                                        IP: {log.ipAddress}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-sm text-slate-500"
                                        >
                                            Belum ada catatan log audit yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        links={logs.links}
                        from={logs.from}
                        to={logs.to}
                        total={logs.total}
                        itemLabel="catatan"
                    />
                </Card>
            </div>
        </AdminLayout>
    );
}
