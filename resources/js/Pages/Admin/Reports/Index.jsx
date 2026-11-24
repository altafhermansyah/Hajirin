import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    DollarSign,
    TrendingUp,
    Ticket,
    Search,
    Printer,
    ArrowUpRight,
    Wallet,
    X,
} from 'lucide-react';
import { Card, CardHeader } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../../Components/ui/UnderlineTabs';
import { Button, buttonClass } from '../../../Components/ui/Button';

const REPORT_EVENT_STATUS_META = {
    PUBLISHED: { tone: 'success', label: 'Published' },
    COMPLETED: { tone: 'info', label: 'Selesai' },
    ONGOING: { tone: 'warning', label: 'Berlangsung' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
};

export default function AdminReportIndex({
    summary = {},
    eventReports = [],
    recentTransactions = [],
    categories = [],
    filters = {},
}) {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || 'all');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            period: newFilters.period !== undefined ? newFilters.period : selectedPeriod,
            category_id:
                newFilters.category_id !== undefined ? newFilters.category_id : selectedCategory,
            search: newFilters.search !== undefined ? newFilters.search : search,
        };

        if (queryParams.period === 'all') delete queryParams.period;
        if (!queryParams.category_id) delete queryParams.category_id;
        if (!queryParams.search) delete queryParams.search;

        router.get('/admin/reports', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const periodTabs = [
        ['all', 'Semua Periode'],
        ['this_month', 'Bulan Ini'],
        ['last_30_days', '30 Hari Terakhir'],
        ['this_year', 'Tahun Ini'],
    ];

    return (
        <AdminLayout title="Laporan & Keuangan">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                            Laporan & Keuangan
                        </h1>
                        <NeutralTag>Komisi {summary.commissionRate || '5%'}</NeutralTag>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Rekapitulasi omset tiket, pembagian komisi platform, dan kalkulasi settlement hak penyelenggara (EO).
                    </p>
                </div>

                <a
                    href={`/admin/reports/export-pdf?period=${selectedPeriod}&category_id=${selectedCategory}&search=${encodeURIComponent(search)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass('primary', 'md')}
                >
                    <Printer className="size-4" aria-hidden="true" />
                    <span>Ekspor Laporan (PDF)</span>
                </a>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Omset (GMV)"
                    icon={DollarSign}
                    value={summary.grossRevenueFormatted || 'Rp0'}
                    subtext={`Dari ${summary.totalPaidOrders || 0} transaksi lunas`}
                />
                <StatCard
                    label={`Komisi Platform (${summary.commissionRate || '5%'})`}
                    icon={TrendingUp}
                    value={summary.platformCommissionFormatted || 'Rp0'}
                    subtext="Pendapatan operasional platform"
                />
                <StatCard
                    label="Hak Bersih EO (Settlement)"
                    icon={Wallet}
                    value={summary.netEoSettlementFormatted || 'Rp0'}
                    subtext="Hak pencairan dana penyelenggara"
                />
                <StatCard
                    label="Volume Tiket & Refund"
                    icon={Ticket}
                    value={summary.totalTicketsSold || 0}
                    valueSuffix="tiket"
                    subtext={
                        summary.totalRefunds > 0
                            ? `${summary.totalRefundCount || 0} refund (-${summary.totalRefundsFormatted})`
                            : `${summary.totalRefundCount || 0} klaim refund disetujui`
                    }
                />
            </div>

            {/* Tabel Rekapitulasi Penjualan per Event */}
            <Card className="overflow-hidden">
                <CardHeader
                    title="Rekapitulasi Penjualan & Bagi Hasil per Event"
                    description="Transparansi omset kotor, potongan fee platform 5%, dan alokasi dana bersih EO."
                    action={<NeutralTag className="tabular-nums">{eventReports.length} Event</NeutralTag>}
                />

                <UnderlineTabs
                    items={periodTabs}
                    activeKey={selectedPeriod}
                    onChange={(key) => {
                        setSelectedPeriod(key);
                        applyFilters({ period: key });
                    }}
                />

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
                            placeholder="Cari nama event atau penyelenggara (EO)..."
                            aria-label="Cari laporan event"
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

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor="report-category-filter" className="sr-only">
                            Filter kategori
                        </label>
                        <select
                            id="report-category-filter"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                applyFilters({ category_id: e.target.value });
                            }}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        {(selectedPeriod !== 'all' || selectedCategory || search) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedPeriod('all');
                                    setSelectedCategory('');
                                    setSearch('');
                                    router.get('/admin/reports');
                                }}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">Event & Penyelenggara</th>
                                <th scope="col" className="px-5 py-3 text-right">Tiket Terjual</th>
                                <th scope="col" className="px-5 py-3 text-right">Omset (GMV)</th>
                                <th scope="col" className="px-5 py-3 text-right">Refund</th>
                                <th scope="col" className="px-5 py-3 text-right">Komisi Platform (5%)</th>
                                <th scope="col" className="px-5 py-3 text-right">Hak Bersih EO</th>
                                <th scope="col" className="px-5 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {eventReports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Tidak ada data transaksi atau event yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                eventReports.map((evt) => {
                                    const statusMeta = REPORT_EVENT_STATUS_META[evt.status] || {
                                        tone: 'neutral',
                                        label: evt.status,
                                    };

                                    return (
                                        <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-slate-900">{evt.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {evt.organizerName} · {evt.categoryName} · {evt.startsAtFormatted}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-slate-900 tabular-nums">
                                                {evt.ticketsSold}{' '}
                                                <span className="text-xs font-normal text-slate-400">tiket</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-slate-900 tabular-nums">
                                                {evt.grossRevenueFormatted}
                                            </td>
                                            <td className="px-5 py-3.5 text-right tabular-nums">
                                                {evt.refundAmount > 0 ? (
                                                    <span className="text-rose-600 font-medium">
                                                        -{evt.refundAmountFormatted}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-slate-900 tabular-nums">
                                                {evt.platformCommissionFormatted}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                                                {evt.netEoPayoutFormatted}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    tone={statusMeta.tone}
                                                    label={statusMeta.label}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Transaksi Finansial Lunas Terbaru */}
            <Card className="overflow-hidden">
                <CardHeader
                    title="Transaksi Finansial Lunas Terbaru"
                    description="10 transaksi invoice terakhir yang berhasil masuk ke sistem pembayaran."
                    action={
                        <Link href="/admin/orders" className={buttonClass('outline', 'sm')}>
                            <span>Semua Pesanan</span>
                            <ArrowUpRight className="size-3.5 text-slate-400" aria-hidden="true" />
                        </Link>
                    }
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">No. Invoice</th>
                                <th scope="col" className="px-5 py-3">Pembeli</th>
                                <th scope="col" className="px-5 py-3">Event</th>
                                <th scope="col" className="px-5 py-3">Metode</th>
                                <th scope="col" className="px-5 py-3 text-right">Nominal</th>
                                <th scope="col" className="px-5 py-3 text-right">Waktu Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">
                                        Belum ada transaksi pembayaran lunas.
                                    </td>
                                </tr>
                            ) : (
                                recentTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3 font-mono text-xs font-medium text-slate-900">
                                            #{trx.orderReference}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900 text-xs">
                                            {trx.buyerName}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 text-xs">
                                            {trx.eventTitle}
                                        </td>
                                        <td className="px-5 py-3">
                                            <NeutralTag className="font-mono uppercase">
                                                {trx.paymentMethod}
                                            </NeutralTag>
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums text-xs">
                                            {trx.amountFormatted}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-500 text-xs tabular-nums">
                                            {trx.paidAtFormatted}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AdminLayout>
    );
}
