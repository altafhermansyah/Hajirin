import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminReportPrint({
    summary = {},
    eventReports = [],
    generatedAtFormatted = '',
    generatedBy = 'Administrator',
    periodLabel = 'Semua Periode',
}) {
    // Tombol cetak manual atau otomatis
    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-slate-800 p-4 sm:p-8 font-sans">
            <Head title="Cetak Laporan Keuangan - Hajirin" />

            {/* Floating Non-Printable Action Bar */}
            <div className="max-w-5xl mx-auto mb-6 print:hidden">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/reports"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Laporan</span>
                        </Link>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Pratinjau Cetak / Ekspor PDF</p>
                            <p className="text-[11px] text-slate-500">
                                Gunakan dialog cetak browser untuk menyimpan dokumen ini sebagai file <strong>PDF</strong>.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md cursor-pointer"
                    >
                        <Printer className="size-4" />
                        <span>Cetak / Simpan sebagai PDF</span>
                    </button>
                </div>
            </div>

            {/* Printable Paper Canvas (A4 Styled) */}
            <div className="max-w-5xl mx-auto bg-white border border-slate-200 print:border-none rounded-2xl print:rounded-none p-8 sm:p-12 shadow-sm print:shadow-none print:p-0">
                {/* Official Letterhead / Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                HAJIRIN TICKETING PLATFORM
                            </h1>
                            <p className="text-sm font-bold text-blue-600 mt-0.5">
                                LAPORAN KEUANGAN & REKAPITULASI PENJUALAN TIKET
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Platform Manajemen Tiket & Penyelenggaraan Event Terpadu
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-600 space-y-1">
                            <p>
                                <strong>Periode:</strong> {periodLabel}
                            </p>
                            <p>
                                <strong>Dicetak pada:</strong> {generatedAtFormatted}
                            </p>
                            <p>
                                <strong>Petugas:</strong> {generatedBy} (Super Admin)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ringkasan Finansial Eksekutif */}
                <div className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        I. Ringkasan Eksekutif Finansial
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Omset (GMV)</p>
                            <p className="text-lg font-black text-slate-900 mt-1">
                                {summary.grossRevenueFormatted || 'Rp0'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                {summary.totalPaidOrders || 0} transaksi lunas
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                            <p className="text-[11px] font-bold text-emerald-800 uppercase">Komisi Platform (5%)</p>
                            <p className="text-lg font-black text-emerald-800 mt-1">
                                {summary.platformCommissionFormatted || 'Rp0'}
                            </p>
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                                Pendapatan platform
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-[11px] font-bold text-slate-700 uppercase">Hak Bersih EO (Settlement)</p>
                            <p className="text-lg font-black text-slate-900 mt-1">
                                {summary.netEoSettlementFormatted || 'Rp0'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                Hak pencairan dana EO
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Tiket & Refund</p>
                            <p className="text-lg font-black text-slate-900 mt-1">
                                {summary.totalTicketsSold || 0} Tiket
                            </p>
                            <p className="text-[10px] text-rose-600 mt-0.5">
                                Refund: -{summary.totalRefundsFormatted || 'Rp0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabel Rekapitulasi Rinci per Event */}
                <div className="mb-10">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        II. Rekapitulasi Penjualan & Bagi Hasil per Event
                    </h2>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">No</th>
                                    <th className="px-4 py-3">Nama Event & EO</th>
                                    <th className="px-4 py-3 text-center">Tiket</th>
                                    <th className="px-4 py-3 text-right">Omset (GMV)</th>
                                    <th className="px-4 py-3 text-right">Refund</th>
                                    <th className="px-4 py-3 text-right text-emerald-800">Komisi (5%)</th>
                                    <th className="px-4 py-3 text-right text-slate-900">Hak Bersih EO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                                {eventReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-6 text-center text-slate-400">
                                            Tidak ada data penjualan pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    eventReports.map((evt, idx) => (
                                        <tr key={evt.id} className="even:bg-slate-50/50">
                                            <td className="px-4 py-2.5 text-slate-400 text-center font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <p className="font-bold text-slate-900">{evt.title}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    {evt.organizerName} • {evt.categoryName} ({evt.startsAtFormatted})
                                                </p>
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-semibold">
                                                {evt.ticketsSold}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold">
                                                {evt.grossRevenueFormatted}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-rose-600">
                                                {evt.refundAmount > 0 ? `-${evt.refundAmountFormatted}` : '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-emerald-800">
                                                {evt.platformCommissionFormatted}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">
                                                {evt.netEoPayoutFormatted}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                                <tr>
                                    <td colSpan="2" className="px-4 py-3 text-right uppercase">
                                        Total Keseluruhan:
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {summary.totalTicketsSold || 0}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {summary.grossRevenueFormatted || 'Rp0'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-rose-600">
                                        -{summary.totalRefundsFormatted || 'Rp0'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-800">
                                        {summary.platformCommissionFormatted || 'Rp0'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-900">
                                        {summary.netEoSettlementFormatted || 'Rp0'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Lembar Tanda Tangan Resmi */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                        <p className="text-slate-500 mb-16">Disiapkan oleh,</p>
                        <p className="font-bold text-slate-900 underline">{generatedBy}</p>
                        <p className="text-[11px] text-slate-500">Super Administrator Platform</p>
                    </div>

                    <div>
                        <p className="text-slate-500 mb-16">Mengetahui & Menyetujui,</p>
                        <p className="font-bold text-slate-900 underline">Divisi Keuangan & Settlement</p>
                        <p className="text-[11px] text-slate-500">Hajirin Event Management</p>
                    </div>
                </div>

                {/* Footer Notice */}
                <div className="mt-12 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                    Dokumen ini dihasilkan secara otomatis oleh Sistem Informasi Hajirin pada {generatedAtFormatted}.
                </div>
            </div>
        </div>
    );
}
