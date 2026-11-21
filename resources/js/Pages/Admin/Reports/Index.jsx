import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    DollarSign,
    TrendingUp,
    Ticket,
    RotateCcw,
    Building2,
    Calendar,
    Search,
    ChevronDown,
    FileText,
    Printer,
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    CreditCard,
    Layers,
} from 'lucide-react';

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
            category_id: newFilters.category_id !== undefined ? newFilters.category_id : selectedCategory,
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

    return (
        <AdminLayout title="Laporan & Keuangan Platform">
            <Head title="Laporan & Keuangan - Admin Hajirin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header & Export Action */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Laporan & Keuangan Platform
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                Komisi Platform {summary.commissionRate || '5%'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Rekapitulasi omset penjualan tiket, bagi hasil komisi platform, dan kalkulasi settlement dana EO.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={`/admin/reports/export-pdf?period=${selectedPeriod}&category_id=${selectedCategory}&search=${encodeURIComponent(search)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                        >
                            <Printer className="size-4" />
                            <span>Ekspor Laporan (PDF)</span>
                        </a>
                    </div>
                </div>

                {/* KPI Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* GMV / Omset Kotor */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Total Omset (GMV)
                            </span>
                            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-2">
                            {summary.grossRevenueFormatted || 'Rp0'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                            Dari <strong>{summary.totalPaidOrders || 0}</strong> pesanan lunas
                        </p>
                    </div>

                    {/* Komisi Platform */}
                    <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                Pendapatan Platform
                            </span>
                            <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-800 mt-2">
                            {summary.platformCommissionFormatted || 'Rp0'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            Bagi hasil {summary.commissionRate || '5%'} platform fee
                        </p>
                    </div>

                    {/* Hak Bersih Penyelenggara (Settlement EO) */}
                    <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                                Hak Bersih EO (Settlement)
                            </span>
                            <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                <Building2 className="size-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-purple-900 mt-2">
                            {summary.netEoSettlementFormatted || 'Rp0'}
                        </p>
                        <p className="text-[11px] text-purple-700 font-medium mt-1">
                            Dana yang berhak dicairkan EO
                        </p>
                    </div>

                    {/* Tiket & Refund */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Tiket & Pengembalian
                            </span>
                            <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Ticket className="size-5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-xl font-black text-slate-900">
                                {summary.totalTicketsSold || 0} <span className="text-xs font-bold text-slate-500">Tiket</span>
                            </span>
                            <span className="text-xs font-bold text-rose-600">
                                -{summary.totalRefundsFormatted || 'Rp0'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                            {summary.totalRefundCount || 0} klaim refund disetujui
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama event atau organizer (EO)..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                            />
                        </form>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Periode */}
                            <select
                                value={selectedPeriod}
                                onChange={(e) => {
                                    setSelectedPeriod(e.target.value);
                                    applyFilters({ period: e.target.value });
                                }}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-blue-600 transition"
                            >
                                <option value="all">Semua Periode</option>
                                <option value="this_month">Bulan Ini</option>
                                <option value="last_30_days">30 Hari Terakhir</option>
                                <option value="this_year">Tahun Ini</option>
                            </select>

                            {/* Filter Kategori */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilters({ category_id: e.target.value });
                                }}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:border-blue-600 transition"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            {(selectedPeriod !== 'all' || selectedCategory || search) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPeriod('all');
                                        setSelectedCategory('');
                                        setSearch('');
                                        router.get('/admin/reports');
                                    }}
                                    className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabel Rekapitulasi Penjualan per Event */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-extrabold text-slate-900 text-base">
                                Rekapitulasi Penjualan & Bagi Hasil per Event
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Rincian omset tiket, potongan komisi platform 5%, dan dana bersih hak penyelenggara.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                            {eventReports.length} Event Terdata
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3.5">Event & Penyelenggara</th>
                                    <th className="px-6 py-3.5 text-center">Tiket Terjual</th>
                                    <th className="px-6 py-3.5 text-right">Omset Kotor (GMV)</th>
                                    <th className="px-6 py-3.5 text-right">Refund</th>
                                    <th className="px-6 py-3.5 text-right text-emerald-700">Komisi Platform (5%)</th>
                                    <th className="px-6 py-3.5 text-right text-purple-700">Hak Bersih EO</th>
                                    <th className="px-6 py-3.5 text-center">Status Event</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {eventReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada data transaksi atau event yang sesuai dengan filter yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    eventReports.map((evt) => (
                                        <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{evt.title}</p>
                                                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                                                        <span>{evt.organizerName}</span>
                                                        <span>•</span>
                                                        <span className="text-blue-600 font-semibold">{evt.categoryName}</span>
                                                        <span>•</span>
                                                        <span>{evt.startsAtFormatted}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-900">
                                                {evt.ticketsSold} <span className="text-[10px] font-normal text-slate-400">tiket</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {evt.grossRevenueFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-right text-rose-600 font-semibold">
                                                {evt.refundAmount > 0 ? `-${evt.refundAmountFormatted}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-700">
                                                {evt.platformCommissionFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-right font-extrabold text-purple-900">
                                                {evt.netEoPayoutFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        evt.status === 'PUBLISHED'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : evt.status === 'COMPLETED'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : evt.status === 'ONGOING'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {evt.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Transaksi Finansial Terbaru */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-extrabold text-slate-900 text-base">
                                Transaksi Finansial Lunas Terbaru
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Log 10 pesanan e-tiket yang telah diverifikasi dan lunas terbayar.
                            </p>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                            <span>Semua Pesanan</span>
                            <ArrowUpRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">No. Invoice</th>
                                    <th className="px-6 py-3">Pembeli</th>
                                    <th className="px-6 py-3">Event</th>
                                    <th className="px-6 py-3 text-center">Metode</th>
                                    <th className="px-6 py-3 text-right">Nominal</th>
                                    <th className="px-6 py-3 text-right">Waktu Bayar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                            Belum ada transaksi pembayaran lunas.
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-6 py-3 font-mono font-bold text-slate-900">
                                                #{trx.orderReference}
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-slate-800">
                                                {trx.buyerName}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">
                                                {trx.eventTitle}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                    {trx.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-emerald-700">
                                                {trx.amountFormatted}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-500">
                                                {trx.paidAtFormatted}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
