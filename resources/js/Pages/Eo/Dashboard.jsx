import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    CalendarDays,
    Ticket,
    Wallet,
    QrCode,
    Search,
    Building2,
    MapPin,
    ExternalLink,
    CheckCircle2,
    Clock3,
    AlertCircle,
    PlusCircle,
    Phone,
    Globe,
    Pencil,
    Send,
    Ban,
    X,
} from 'lucide-react';

export default function EoDashboard({
    organizerProfile = {},
    stats = {},
    myEvents = [],
    recentOrders = [],
}) {
    const { auth, flash } = usePage().props;
    const user = auth?.user || {};

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingReviewId, setSubmittingReviewId] = useState(null);
    const [cancellingEvent, setCancellingEvent] = useState(null);

    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const handleQuickSubmitReview = (eventId) => {
        setSubmittingReviewId(eventId);
        router.post(
            `/eo/events/${eventId}/submit`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmittingReviewId(null),
            }
        );
    };

    const openCancelModal = (eventItem) => {
        cancelForm.reset();
        cancelForm.clearErrors();
        setCancellingEvent(eventItem);
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        if (!cancellingEvent) return;

        cancelForm.post(`/eo/events/${cancellingEvent.id}/cancel`, {
            preserveScroll: true,
            onSuccess: () => {
                setCancellingEvent(null);
                cancelForm.reset();
            },
        });
    };

    const filteredEvents = myEvents.filter((event) => {
        const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            event.title.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query) ||
            event.city.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    const occupancyRate =
        stats.totalInitialQuota > 0
            ? Math.min(100, Math.round((stats.ticketsSold / stats.totalInitialQuota) * 100))
            : 0;

    return (
        <EoLayout
            title="Ringkasan Dashboard EO"
            organizerName={organizerProfile.organizationName}
        >
            {flash?.success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-xs">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <p className="font-medium">{flash.success}</p>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 mb-2">
                        <Building2 className="size-3.5" />
                        {organizerProfile.organizationName || user.name}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Dashboard Penyelenggara (EO)
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Pantau performa penjualan tiket, okupansi kuota acara, dan kelola publikasi event secara real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/eo/events/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 transition"
                    >
                        <PlusCircle className="size-4" />
                        Buat Event & Tiket Baru
                    </Link>
                </div>
            </div>

            {/* 4 Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Pendapatan */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Pendapatan Tiket
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Wallet className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                            {stats.formattedRevenue || 'Rp0'}
                        </span>
                        <p className="mt-1 text-xs text-slate-500">
                            Dari <span className="font-semibold text-emerald-600">{stats.paidOrdersCount ?? 0} pesanan lunas</span>
                        </p>
                    </div>
                </div>

                {/* 2. Tiket Terjual & Check-in */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tiket Terjual
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Ticket className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.ticketsSold ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">E-Tiket</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-blue-700">{stats.ticketsCheckedIn ?? 0} Sudah Check-in</span> ·{' '}
                            <span>Sisa {stats.totalRemainingQuota ?? 0} kuota</span>
                        </p>
                    </div>
                </div>

                {/* 3. Portofolio Event */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Event Diselenggarakan
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <CalendarDays className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalEvents ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Events</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-emerald-600">{stats.publishedEvents ?? 0} Tayang</span> ·{' '}
                            <span className="font-semibold text-amber-600">{stats.pendingEvents ?? 0} Ditinjau</span> ·{' '}
                            <span>{stats.draftEvents ?? 0} Draft</span>
                        </p>
                    </div>
                </div>

                {/* 4. Tingkat Okupansi Kuota */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Okupansi Kapasitas
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <QrCode className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {occupancyRate}%
                            </span>
                            <span className="text-xs font-medium text-slate-500">Terisi</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${occupancyRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Daftar Event Saya */}
            <section
                id="event-saya"
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20"
            >
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 pt-4 overflow-x-auto scrollbar-none">
                    {[
                        ['ALL', 'Semua Event', stats.totalEvents ?? 0],
                        ['PUBLISHED', 'Published', stats.publishedEvents ?? 0],
                        ['PENDING_REVIEW', 'Menunggu Review', stats.pendingEvents ?? 0],
                        ['DRAFT', 'Draft', stats.draftEvents ?? 0],
                        ['REJECTED', 'Perlu Revisi', stats.rejectedEvents ?? 0],
                        ['CANCELLED', 'Dibatalkan', stats.cancelledEvents ?? 0],
                    ].map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setStatusFilter(key)}
                            className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                                statusFilter === key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            {label}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Controls */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari judul event, kategori, atau kota..."
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        Menampilkan <span className="font-bold text-slate-800">{filteredEvents.length}</span> dari{' '}
                        <span className="font-bold text-slate-800">{myEvents.length}</span> event milik organisasimu
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="py-3.5 px-5">Informasi Event</th>
                                <th scope="col" className="py-3.5 px-5">Jadwal & Lokasi</th>
                                <th scope="col" className="py-3.5 px-5">Status</th>
                                <th scope="col" className="py-3.5 px-5">Penjualan / Kuota</th>
                                <th scope="col" className="py-3.5 px-5">Pendapatan</th>
                                <th scope="col" className="py-3.5 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => {
                                    const soldPercent =
                                        event.initialQuota > 0
                                            ? Math.min(100, Math.round((event.ticketsSold / event.initialQuota) * 100))
                                            : 0;

                                    return (
                                        <tr key={event.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-4 px-5">
                                                <div className="flex items-start gap-3.5">
                                                    <img
                                                        src={event.banner}
                                                        alt=""
                                                        className="size-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0 mt-0.5"
                                                    />
                                                    <div className="min-w-0 max-w-xs">
                                                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 mb-1">
                                                            {event.category}
                                                        </span>
                                                        <p className="font-bold text-slate-900 truncate">
                                                            {event.title}
                                                        </p>
                                                        {event.status === 'REJECTED' && event.rejectionReason && (
                                                            <p className="mt-1 text-[11px] text-red-600 line-clamp-2">
                                                                <span className="font-bold">Revisi:</span> {event.rejectionReason}
                                                            </p>
                                                        )}
                                                        {event.status === 'CANCELLED' && event.cancellationReason && (
                                                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                                                                <span className="font-bold">Alasan Batal:</span> {event.cancellationReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 text-xs text-slate-600">
                                                <p className="font-semibold text-slate-800">{event.dateFormatted}</p>
                                                <p className="mt-0.5 flex items-center gap-1 text-slate-500">
                                                    <MapPin className="size-3.5 shrink-0 text-slate-400" />
                                                    <span className="truncate max-w-44">
                                                        {event.city} · {event.location}
                                                    </span>
                                                </p>
                                            </td>

                                            <td className="py-4 px-5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                                        event.status === 'PUBLISHED'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : event.status === 'PENDING_REVIEW'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : event.status === 'REJECTED'
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    {event.status === 'PUBLISHED'
                                                        ? 'Published'
                                                        : event.status === 'PENDING_REVIEW'
                                                        ? 'Menunggu Review'
                                                        : event.status === 'REJECTED'
                                                        ? 'Perlu Revisi'
                                                        : event.status === 'CANCELLED'
                                                        ? 'Dibatalkan'
                                                        : 'Draft'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="w-36">
                                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                        <span>{event.ticketsSold} terjual</span>
                                                        <span className="text-slate-400">/ {event.initialQuota}</span>
                                                    </div>
                                                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-blue-600"
                                                            style={{ width: `${soldPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 font-bold text-slate-900">
                                                {event.formattedRevenue}
                                            </td>

                                            <td className="py-4 px-5 text-right">
                                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                    {event.status === 'PUBLISHED' && (
                                                        <Link
                                                            href={`/event/${event.slug}`}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            Lihat <ExternalLink className="size-3" />
                                                        </Link>
                                                    )}

                                                    {event.status !== 'CANCELLED' && (
                                                        <Link
                                                            href={`/eo/events/${event.id}/edit`}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                                                        >
                                                            <Pencil className="size-3" />
                                                            Edit & Tiket
                                                        </Link>
                                                    )}

                                                    {(event.status === 'DRAFT' || event.status === 'REJECTED') && (
                                                        <button
                                                            type="button"
                                                            disabled={submittingReviewId === event.id}
                                                            onClick={() => handleQuickSubmitReview(event.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                                        >
                                                            <Send className="size-3" />
                                                            {submittingReviewId === event.id ? '...' : 'Ajukan Review'}
                                                        </button>
                                                    )}

                                                    {event.status !== 'CANCELLED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCancelModal(event)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                                        >
                                                            <Ban className="size-3" />
                                                            Batalkan
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <CalendarDays className="mx-auto size-8 text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-slate-800">
                                            Belum ada event pada kategori ini
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Klik tombol &quot;Buat Event &amp; Tiket Baru&quot; untuk mulai menambahkan acaramu.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Bottom Grid: Transaksi Terbaru & Profil Organisasi EO */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Transaksi Peserta Terbaru */}
                <section
                    id="transaksi"
                    className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="font-bold text-slate-900">Transaksi Pembelian Tiket Terbaru</h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Daftar pesanan tiket masuk dari seluruh event milik organisasimu.
                            </p>
                        </div>
                        <Clock3 className="size-5 text-slate-400" />
                    </div>

                    {recentOrders.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900">
                                            {order.buyerName}{' '}
                                            <span className="font-normal text-xs text-slate-400">
                                                ({order.buyerEmail})
                                            </span>
                                        </p>
                                        <p className="truncate text-xs font-medium text-slate-600 mt-0.5">
                                            {order.eventTitle}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Ref: <span className="font-mono font-semibold text-slate-600">{order.orderReference}</span> · {order.createdAtFormatted}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-extrabold text-slate-900">
                                            {order.formattedAmount}
                                        </p>
                                        <span
                                            className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                                order.status === 'PAID'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}
                                        >
                                            {order.status === 'PAID' ? 'Lunas' : order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 px-6 text-center">
                            <Ticket className="mx-auto size-8 text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-800">Belum ada transaksi tiket</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Setiap pembelian tiket dari pengunjung akan tercatat otomatis di sini.
                            </p>
                        </div>
                    )}
                </section>

                {/* Profil Resmi Organisasi EO */}
                <section
                    id="profil-eo"
                    className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden scroll-mt-20"
                >
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="font-bold text-slate-900">Identitas Penyelenggara (EO)</h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Profil resmi yang tampil pada halaman publik acara Anda.
                        </p>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Nama Organisasi / Brand EO</p>
                            <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-bold text-slate-900">
                                {organizerProfile.organizationName || user.name}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-500">Nama & Email Akun Penanggung Jawab</p>
                            <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                                {user.name} ({user.email})
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Phone className="size-3" /> Kontak PIC
                                </p>
                                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-800 truncate">
                                    {organizerProfile.contactPhone || '-'}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Globe className="size-3" /> Portofolio
                                </p>
                                <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-800 truncate">
                                    {organizerProfile.portfolioUrl ? (
                                        <a
                                            href={organizerProfile.portfolioUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Buka Tautan ↗
                                        </a>
                                    ) : (
                                        '-'
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50/70 p-3.5 text-xs leading-relaxed text-indigo-950 border border-indigo-100">
                            <CheckCircle2 className="size-4 shrink-0 text-indigo-600 mt-0.5" />
                            <span>
                                Akun Event Organizer Anda telah terverifikasi oleh Tim Moderator Hajirin
                                {organizerProfile.verifiedAt ? ` sejak ${organizerProfile.verifiedAt}` : ''}.
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal Batalkan Event */}
            {cancellingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                Konfirmasi Pembatalan Event
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCancellingEvent(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4">
                            <div className="rounded-xl bg-red-50/70 p-3 text-xs text-red-900 border border-red-100">
                                <p className="font-bold">{cancellingEvent.title}</p>
                                <p className="mt-0.5 text-red-700">
                                    Event yang dibatalkan akan ditarik dari katalog publik dan tidak dapat menerima penjualan tiket baru.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="cancellation_reason"
                                    className="block text-xs font-semibold text-slate-700"
                                >
                                    Alasan Pembatalan Resmi <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="cancellation_reason"
                                    name="cancellation_reason"
                                    rows={3}
                                    required
                                    minLength={10}
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(e) =>
                                        cancelForm.setData('cancellation_reason', e.target.value)
                                    }
                                    placeholder="Jelaskan alasan pembatalan acara ini (minimal 10 karakter)..."
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                                />
                                {cancelForm.errors.cancellation_reason && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {cancelForm.errors.cancellation_reason}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancellingEvent(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {cancelForm.processing ? 'Membatalkan...' : 'Konfirmasi Batalkan Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </EoLayout>
    );
}
