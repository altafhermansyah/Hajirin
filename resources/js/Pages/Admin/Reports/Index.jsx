import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    DollarSign,
    TrendingUp,
    Ticket,
    Building2,
    Search,
    Printer,
    ArrowUpRight,
    Shield,
    Calendar,
    Wallet,
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
                {/* Header & Primary Action Button (Matching Mockup: Dark Slate Solid Button) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Laporan & Keuangan
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                Komisi {summary.commissionRate || '5%'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Rekapitulasi omset tiket, pembagian komisi platform, dan kalkulasi settlement hak penyelenggara (EO).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={`/admin/reports/export-pdf?period=${selectedPeriod}&category_id=${selectedCategory}&search=${encodeURIComponent(search)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Ekspor Laporan (PDF)</span>
                        </a>
                    </div>
                </div>

                {/* Integrated Financial Telemetry Bar (No AI-slop separate boxes, no purple) */}
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                        {/* 1. GMV / Gross Merchandise Value */}
                        <div className="p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Total Omset (GMV)
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <DollarSign className="size-4" />
                                </span>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                    {summary.grossRevenueFormatted || 'Rp0'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Dari <strong className="text-slate-700">{summary.totalPaidOrders || 0}</strong> transaksi lunas
                                </p>
                            </div>
                        </div>

                        {/* 2. Platform Commission */}
                        <div className="p-5 flex flex-col justify-between bg-emerald-50/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                    Komisi Platform ({summary.commissionRate || '5%'})
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                    <TrendingUp className="size-4" />
                                </span>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-black text-emerald-800 tracking-tight font-mono">
                                    {summary.platformCommissionFormatted || 'Rp0'}
                                </p>
                                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                    Pendapatan operasional platform
                                </p>
                            </div>
                        </div>

                        {/* 3. Net EO Settlement */}
                        <div className="p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Hak Bersih EO (Settlement)
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                    <Wallet className="size-4" />
                                </span>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                    {summary.netEoSettlementFormatted || 'Rp0'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Hak pencairan dana penyelenggara
                                </p>
                            </div>
                        </div>

                        {/* 4. Tiket Terjual & Refund */}
                        <div className="p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Volume Tiket & Refund
                                </span>
                                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                    <Ticket className="size-4" />
                                </span>
                            </div>
                            <div className="mt-3">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                        {summary.totalTicketsSold || 0} <span className="text-xs font-semibold text-slate-400 font-sans">Tiket</span>
                                    </span>
                                    {summary.totalRefunds > 0 && (
                                        <span className="text-[11px] font-bold text-rose-600">
                                            -{summary.totalRefundsFormatted}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {summary.totalRefundCount || 0} klaim refund disetujui
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Pills & Search Bar (Handcrafted segment control matching mockup) */}
                <div className="space-y-3">
                    {/* Period Tabs in Floating Pill Style */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl inline-flex overflow-x-auto max-w-full">
                        {[
                            ['all', 'Semua Periode'],
                            ['this_month', 'Bulan Ini'],
                            ['last_30_days', '30 Hari Terakhir'],
                            ['this_year', 'Tahun Ini'],
                        ].map(([key, label]) => {
                            const active = selectedPeriod === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setSelectedPeriod(key);
                                        applyFilters({ period: key });
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter Inputs Row */}
                    <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama event atau penyelenggara (EO)..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                            />
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
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
                                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabel Rekapitulasi Penjualan per Event */}
                <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                Rekapitulasi Penjualan & Bagi Hasil per Event
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Transparansi omset kotor, potongan fee platform 5%, dan alokasi dana bersih EO.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {eventReports.length} Event
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                                <tr>
                                    <th className="px-6 py-3.5">Event & Penyelenggara</th>
                                    <th className="px-6 py-3.5 text-center">Tiket Terjual</th>
                                    <th className="px-6 py-3.5 text-right">Omset (GMV)</th>
                                    <th className="px-6 py-3.5 text-right">Refund</th>
                                    <th className="px-6 py-3.5 text-right text-emerald-700">Komisi Platform (5%)</th>
                                    <th className="px-6 py-3.5 text-right text-slate-900">Hak Bersih EO</th>
                                    <th className="px-6 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {eventReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada data transaksi atau event yang sesuai dengan filter.
                                        </td>
                                    </tr>
                                ) : (
                                    eventReports.map((evt) => (
                                        <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{evt.title}</p>
                                                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                                                        <span className="font-medium text-slate-600">{evt.organizerName}</span>
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
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                {evt.grossRevenueFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-600 font-semibold">
                                                {evt.refundAmount > 0 ? `-${evt.refundAmountFormatted}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                                                {evt.platformCommissionFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900">
                                                {evt.netEoPayoutFormatted}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        evt.status === 'PUBLISHED'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : evt.status === 'COMPLETED'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : evt.status === 'ONGOING'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-slate-100 text-slate-700 border-slate-200'
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

                {/* Transaksi Finansial Lunas Terbaru */}
                <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                                Transaksi Finansial Lunas Terbaru
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                10 transaksi invoice terakhir yang berhasil masuk ke sistem pembayaran.
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
                            <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
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
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                                    {trx.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">
                                                {trx.amountFormatted}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-500 text-[11px]">
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
