import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    QrCode,
    Users,
    ShieldAlert,
    ExternalLink,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Ticket,
} from 'lucide-react';

export default function AdminCheckInIndex() {
    return (
        <AdminLayout title="Presensi & Check-in Tiket">
            <Head title="Presensi & Check-in - Admin Hajirin" />

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                Presensi & Check-in Tiket
                            </h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                Dikelola oleh EO & Staff
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Pemberitahuan alur operasional presensi e-tiket di gerbang masuk (gate check-in).
                        </p>
                    </div>

                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Dashboard</span>
                    </Link>
                </div>

                {/* Empty State Banner & Explanation */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs">
                    <div className="mx-auto size-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                        <QrCode className="size-10" />
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-2">
                        Modul Check-in Dikelola Khusus oleh EO & Event Staff
                    </h2>

                    <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed mb-8">
                        Sesuai arsitektur pembagian tugas platform Hajirin, operasional pemindaian QR code tiket di pintu masuk dan pencatatan presensi kehadiran peserta ditugaskan langsung kepada <strong>Penyelenggara Acara (EO)</strong> serta <strong>Event Staff</strong> lapangan melalui portal operasional EO.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left mb-8">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                            <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs mb-1">
                                <Users className="size-4" />
                                <span>Petugas Pintu Masuk</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Penyelenggara acara menugaskan event staff khusus dengan hak akses scanner scanner di lokasi.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                            <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-xs mb-1">
                                <Ticket className="size-4" />
                                <span>Validasi Tiket Real-time</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Scanner memeriksa keaslian e-tiket dan mengubah status tiket menjadi USED secara otomatis.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                            <div className="flex items-center gap-2.5 text-amber-700 font-bold text-xs mb-1">
                                <Calendar className="size-4" />
                                <span>Laporan Kehadiran</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Data kehadiran peserta langsung tercatat pada laporan peserta dan ringkasan event EO.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/admin/events"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                        >
                            <Calendar className="size-4" />
                            <span>Pantau Daftar Event</span>
                        </Link>
                        <Link
                            href="/admin/tickets"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                        >
                            <Ticket className="size-4" />
                            <span>Lihat Direktori E-Tiket Platform</span>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
