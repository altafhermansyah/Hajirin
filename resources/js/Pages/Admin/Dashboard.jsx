import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
    Users,
    Building2,
    Shield,
    CalendarDays,
    UserPlus,
    Search,
    ChevronDown,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

export default function AdminDashboard({
    stats = {},
    recentUsers = [],
    pendingEoList = [],
    pendingEventsList = [],
}) {
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = recentUsers.filter((user) => {
        const matchesRole =
            selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;
        const matchesSearch =
            searchQuery === '' ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <AdminLayout title="Dashboard Platform">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Dashboard Admin & Kelola Pengguna
                    </h1>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => alert('Fitur tambah user baru siap dikembangkan.')}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                        <UserPlus className="size-4" />
                        Tambah User Baru
                    </button>
                </div>
            </div>

            {/* Quick Attention Alert (if pending verifications exist) */}
            {(stats.pendingEoApplications > 0 || stats.pendingEvents > 0) && (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <AlertCircle className="size-5" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">
                                Butuh Tindakan Moderator Admin
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Terdapat{' '}
                                <span className="font-semibold text-amber-800">
                                    {stats.pendingEoApplications} pengajuan EO
                                </span>{' '}
                                dan{' '}
                                <span className="font-semibold text-amber-800">
                                    {stats.pendingEvents} event
                                </span>{' '}
                                menunggu tinjauan dan verifikasi Anda.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-white border border-amber-200 rounded-lg px-3 py-1.5 shadow-2xs">
                            Status: Siap Ditinjau
                        </span>
                    </div>
                </div>
            )}

            {/* Top Metric Stats Cards (Mirrors mockup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Peserta */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Peserta Terdaftar
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalPeserta ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Users</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <span>+{stats.totalPeserta > 0 ? stats.totalPeserta : 1} user baru bulan ini</span>
                        </p>
                    </div>
                </div>

                {/* 2. Akun Penyelenggara (EO) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Akun Penyelenggara (EO)
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Building2 className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalEo ?? 0}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Accounts</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{stats.totalEo ?? 0} Terverifikasi</span>,{' '}
                            <span className="font-semibold text-amber-600">{stats.pendingEoApplications ?? 0} Pending</span>
                        </p>
                    </div>
                </div>

                {/* 3. Platform Admin & Owner */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Platform Admin & Owner
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <Shield className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {stats.totalAdmin ?? 1}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Owners</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-purple-700 flex items-center gap-1">
                            <Shield className="size-3.5" />
                            Hak akses penuh (Full Access)
                        </p>
                    </div>
                </div>

                {/* 4. Total Event Platform */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Event Terdaftar
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
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
                            <span className="font-semibold text-emerald-600">{stats.publishedEvents ?? 0} Published</span> ·{' '}
                            <span className="font-semibold text-slate-600">{stats.draftEvents ?? 0} Draft</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search Bar Section (Mirrors Mockup) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Role Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 pt-4 overflow-x-auto scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('ALL')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'ALL'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Semua User
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {stats.totalUsers ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('ADMIN')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'ADMIN'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Super Admin
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                            {stats.totalAdmin ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('EO')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'EO'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Event Organizer
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {stats.totalEo ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('USER')}
                        className={`pb-3 px-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                            selectedRoleFilter === 'USER'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Peserta
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {stats.totalPeserta ?? 0}
                        </span>
                    </button>
                </div>

                {/* Search & Filter Controls */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama, user, email, atau ID..."
                            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Status:</span>
                            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                Semua Status
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Urutkan:</span>
                            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                Terbaru
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table Data matching the mockup */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="py-3.5 px-5">User & Profil</th>
                                <th scope="col" className="py-3.5 px-5">Kontak (Email)</th>
                                <th scope="col" className="py-3.5 px-5">Role / Hak Akses</th>
                                <th scope="col" className="py-3.5 px-5">Tanggal Join</th>
                                <th scope="col" className="py-3.5 px-5">Status</th>
                                <th scope="col" className="py-3.5 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((item, index) => {
                                    const userInitials = item.name
                                        ? item.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()
                                        : 'U';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            {/* User & Profil */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                                                            item.role === 'ADMIN'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : item.role === 'EO'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                    >
                                                        {userInitials}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 leading-tight">
                                                            {item.name}
                                                        </p>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            ID: USR-{String(index + 1).padStart(3, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kontak */}
                                            <td className="py-4 px-5">
                                                <p className="text-slate-700 font-medium">{item.email}</p>
                                                <p className="text-xs text-slate-400 font-mono">+62 812-3456-7890</p>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="py-4 px-5">
                                                {item.role === 'ADMIN' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                                                        <Shield className="size-3" />
                                                        Super Admin
                                                    </span>
                                                ) : item.role === 'EO' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                        <Building2 className="size-3" />
                                                        Event Organizer
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                                        <Users className="size-3" />
                                                        Peserta
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tanggal Join */}
                                            <td className="py-4 px-5 text-slate-600">
                                                {item.created_at
                                                    ? dateFormatter.format(new Date(item.created_at))
                                                    : '10 Nov 2026'}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-5">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    Aktif
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => alert(`Kelola user: ${item.name}`)}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-slate-500">
                                        Tidak ada data pengguna yang sesuai dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Menampilkan {filteredUsers.length} dari {stats.totalUsers ?? 0} Pengguna
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold">1</span>
                        <span className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">2</span>
                        <span className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">3</span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

