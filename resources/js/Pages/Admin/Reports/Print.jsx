import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button, buttonClass } from '../../../Components/ui/Button';

export default function AdminReportPrint({
    summary = {},
    eventReports = [],
    generatedAtFormatted = '',
    generatedBy = 'Administrator',
    periodLabel = 'Semua Periode',
}) {
    const commissionRate = summary.commissionRate || '5%';

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 py-6 px-4 sm:px-8 print:p-0 font-sans">
            <Head title="Cetak Laporan Keuangan - Hajirin" />

            {/* Non-Printable Action Bar */}
            <div className="max-w-5xl mx-auto mb-5 print:hidden">
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports" className={buttonClass('outline', 'sm')}>
                            <ArrowLeft className="size-4 text-slate-500" aria-hidden="true" />
                            <span>Kembali</span>
                        </Link>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 leading-tight">
                                Pratinjau Cetak / Ekspor PDF
                            </p>
                            <p className="text-xs text-slate-500">
                                Gunakan dialog cetak browser untuk menyimpan dokumen sebagai PDF ukuran A4.
                            </p>
                        </div>
                    </div>

                    <Button variant="primary" size="md" onClick={handlePrint}>
                        <Printer className="size-4" aria-hidden="true" />
                        <span>Cetak / Simpan PDF</span>
                    </Button>
                </div>
            </div>

            {/* Formal A4 Financial Report Sheet */}
            <article className="max-w-5xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-12 print:p-0">
                {/* Corporate Letterhead */}
                <header className="pb-6 border-b-2 border-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <img src="/hajirin_icon.svg" alt="Hajirin" className="h-6 w-auto" />
                                <span className="text-base font-semibold tracking-tight text-slate-900">
                                    HAJIRIN
                                </span>
                            </div>
                            <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                                Laporan Keuangan & Rekapitulasi Penjualan Tiket
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                Platform Manajemen Tiket & Penyelenggaraan Event Terpadu
                            </p>
                        </div>

                        <dl className="text-xs text-slate-600 space-y-1.5 sm:text-right shrink-0">
                            <div className="flex sm:justify-end gap-2">
                                <dt className="text-slate-400">Periode:</dt>
                                <dd className="font-medium text-slate-900">{periodLabel}</dd>
                            </div>
                            <div className="flex sm:justify-end gap-2">
                                <dt className="text-slate-400">Tanggal Cetak:</dt>
                                <dd className="font-medium text-slate-900 tabular-nums">
                                    {generatedAtFormatted}
                                </dd>
                            </div>
                            <div className="flex sm:justify-end gap-2">
                                <dt className="text-slate-400">Disusun Oleh:</dt>
                                <dd className="font-medium text-slate-900">
                                    {generatedBy} (Super Admin)
                                </dd>
                            </div>
                            <div className="flex sm:justify-end gap-2">
                                <dt className="text-slate-400">Mata Uang:</dt>
                                <dd className="font-medium text-slate-900">IDR (Rupiah)</dd>
                            </div>
                        </dl>
                    </div>
                </header>

                {/* Section I: Executive Financial Summary */}
                <section className="mt-8">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        I. Ringkasan Eksekutif Finansial
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-slate-900 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/40">
                        <div className="p-4">
                            <p className="text-xs text-slate-500">Total Omset (GMV)</p>
                            <p className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
                                {summary.grossRevenueFormatted || 'Rp0'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 tabular-nums">
                                {summary.totalPaidOrders || 0} transaksi lunas
                            </p>
                        </div>

                        <div className="p-4">
                            <p className="text-xs text-slate-500">
                                Komisi Platform ({commissionRate})
                            </p>
                            <p className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
                                {summary.platformCommissionFormatted || 'Rp0'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Pendapatan operasional platform
                            </p>
                        </div>

                        <div className="p-4">
                            <p className="text-xs text-slate-500">Hak Bersih EO (Settlement)</p>
                            <p className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
                                {summary.netEoSettlementFormatted || 'Rp0'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Alokasi pencairan dana EO
                            </p>
                        </div>

                        <div className="p-4">
                            <p className="text-xs text-slate-500">Volume Tiket & Refund</p>
                            <p className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
                                {summary.totalTicketsSold || 0} Tiket
                            </p>
                            <p className="mt-1 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                                Refund:{' '}
                                {summary.totalRefunds > 0
                                    ? `-${summary.totalRefundsFormatted}`
                                    : 'Rp0'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section II: Detailed Event Ledger */}
                <section className="mt-9">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        II. Rekapitulasi Penjualan & Bagi Hasil per Event
                    </h2>

                    <div className="overflow-x-auto border-y-2 border-slate-900">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-900 text-slate-700 font-semibold">
                                <tr>
                                    <th scope="col" className="py-3 px-3 text-center w-10">
                                        No
                                    </th>
                                    <th scope="col" className="py-3 px-3">
                                        Nama Event & Penyelenggara
                                    </th>
                                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                                        Tiket
                                    </th>
                                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                                        Omset (GMV)
                                    </th>
                                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                                        Refund
                                    </th>
                                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                                        Komisi ({commissionRate})
                                    </th>
                                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">
                                        Hak Bersih EO
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                                {eventReports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="py-8 px-4 text-center text-slate-500"
                                        >
                                            Tidak ada data penjualan pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    eventReports.map((evt, idx) => (
                                        <tr key={evt.id} className="even:bg-slate-50/40">
                                            <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <p className="font-medium text-slate-900 leading-snug">
                                                    {evt.title}
                                                </p>
                                                <p className="text-slate-500 mt-0.5">
                                                    {evt.organizerName} · {evt.categoryName} ({evt.startsAtFormatted})
                                                </p>
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap">
                                                {evt.ticketsSold}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                                                {evt.grossRevenueFormatted}
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-slate-600">
                                                {evt.refundAmount > 0
                                                    ? `-${evt.refundAmountFormatted}`
                                                    : '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-slate-800">
                                                {evt.platformCommissionFormatted}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                                {evt.netEoPayoutFormatted}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-semibold text-slate-900">
                                <tr>
                                    <td colSpan="2" className="py-3 px-3 text-right uppercase tracking-wide text-slate-700">
                                        Total Keseluruhan
                                    </td>
                                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                        {summary.totalTicketsSold || 0}
                                    </td>
                                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                        {summary.grossRevenueFormatted || 'Rp0'}
                                    </td>
                                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                        {summary.totalRefunds > 0
                                            ? `-${summary.totalRefundsFormatted}`
                                            : 'Rp0'}
                                    </td>
                                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                        {summary.platformCommissionFormatted || 'Rp0'}
                                    </td>
                                    <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                                        {summary.netEoSettlementFormatted || 'Rp0'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* Section III: Sign-off */}
                <section className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs break-inside-avoid">
                    <div>
                        <p className="text-slate-500">Disiapkan oleh,</p>
                        <div className="h-16" />
                        <div className="w-52 mx-auto border-b border-slate-400 pb-1 font-semibold text-slate-900">
                            {generatedBy}
                        </div>
                        <p className="mt-1 text-slate-500">Super Administrator Platform</p>
                    </div>

                    <div>
                        <p className="text-slate-500">Mengetahui & Menyetujui,</p>
                        <div className="h-16" />
                        <div className="w-52 mx-auto border-b border-slate-400 pb-1 font-semibold text-slate-900">
                            Divisi Keuangan & Settlement
                        </div>
                        <p className="mt-1 text-slate-500">Hajirin Event Management</p>
                    </div>
                </section>

                {/* Document Footer */}
                <footer className="mt-12 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Dokumen internal resmi Sistem Informasi Hajirin</span>
                    <span className="tabular-nums">Dicetak pada {generatedAtFormatted}</span>
                </footer>
            </article>
        </div>
    );
}
