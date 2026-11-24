import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { QrCode, Users, ArrowLeft, Calendar, Ticket } from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { NeutralTag } from '../../../Components/ui/StatusBadge';
import { buttonClass } from '../../../Components/ui/Button';

export default function AdminCheckInIndex() {
    return (
        <AdminLayout title="Presensi & Check-in Tiket">
            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                Presensi & Check-in Tiket
                            </h1>
                            <NeutralTag>Dikelola oleh EO & Staff</NeutralTag>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Alur operasional presensi e-tiket di gerbang masuk (gate check-in).
                        </p>
                    </div>

                    <Link href="/admin/dashboard" className={buttonClass('outline', 'md')}>
                        <ArrowLeft className="size-4 text-slate-500" aria-hidden="true" />
                        <span>Kembali ke Dashboard</span>
                    </Link>
                </div>

                {/* Explanation Card */}
                <Card className="p-8 sm:p-10 text-center">
                    <div className="mx-auto size-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 mb-5">
                        <QrCode className="size-8" strokeWidth={1.6} aria-hidden="true" />
                    </div>

                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-2">
                        Modul Check-in Dikelola Khusus oleh EO & Event Staff
                    </h2>

                    <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed mb-8">
                        Sesuai pembagian peran di platform Hajirin, operasional pemindaian QR code tiket di pintu masuk dan pencatatan kehadiran peserta dikelola langsung oleh{' '}
                        <strong className="font-semibold text-slate-900">Penyelenggara Acara (EO)</strong> serta{' '}
                        <strong className="font-semibold text-slate-900">Event Staff</strong> lapangan melalui portal operasional EO.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left mb-8">
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
                                <Users className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Petugas Pintu Masuk</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Penyelenggara acara menugaskan event staff khusus dengan hak akses pemindai QR di lokasi.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
                                <Ticket className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Validasi Tiket Real-time</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Scanner memeriksa keaslian e-tiket dan mengubah status tiket menjadi USED secara otomatis.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
                                <Calendar className="size-4 text-slate-400" aria-hidden="true" />
                                <span>Laporan Kehadiran</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Data kehadiran peserta langsung tercatat pada laporan peserta dan ringkasan event EO.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <Link href="/admin/events" className={buttonClass('primary', 'md')}>
                            <Calendar className="size-4" aria-hidden="true" />
                            <span>Pantau Daftar Event</span>
                        </Link>
                        <Link href="/admin/tickets" className={buttonClass('outline', 'md')}>
                            <Ticket className="size-4 text-slate-500" aria-hidden="true" />
                            <span>Lihat Direktori E-Tiket Platform</span>
                        </Link>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
