import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Users,
    Building2,
    Shield,
    UserPlus,
    Search,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Phone,
    Mail,
    Edit2,
    UserX,
    UserCheck,
    Trash2,
    X,
    Filter,
    ShieldCheck,
    Lock,
    Key,
    Sparkles,
    Calendar,
} from 'lucide-react';

export default function UserManagementIndex({
    users = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash, auth } = usePage().props;
    const currentAdminId = auth?.user?.id;

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'ALL');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [statusConfirmUser, setStatusConfirmUser] = useState(null);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

    // Form Tambah User
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'USER',
        status: 'ACTIVE',
        password: '',
    });

    // Form Edit User
    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'USER',
        status: 'ACTIVE',
        password: '',
    });

    const applyFilters = (newFilters = {}) => {
        const queryParams = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            role: newFilters.role !== undefined ? newFilters.role : selectedRole,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            sort: newFilters.sort !== undefined ? newFilters.sort : selectedSort,
        };

        // Bersihkan parameter jika ALL atau kosong
        if (!queryParams.search) delete queryParams.search;
        if (queryParams.role === 'ALL') delete queryParams.role;
        if (queryParams.status === 'ALL') delete queryParams.status;
        if (queryParams.sort === 'latest') delete queryParams.sort;

        router.get('/admin/users', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleRoleTabChange = (role) => {
        setSelectedRole(role);
        applyFilters({ role });
    };

    const handleStatusFilterChange = (status) => {
        setSelectedStatus(status);
        applyFilters({ status });
    };

    const handleSortChange = (sort) => {
        setSelectedSort(sort);
        applyFilters({ sort });
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        createForm.post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const openEditModal = (user) => {
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone === '-' ? '' : user.phone,
            role: user.role,
            status: user.status,
            password: '',
        });
        editForm.clearErrors();
        setEditingUser(user);
    };

    const handleEditUser = (e) => {
        e.preventDefault();
        if (!editingUser) return;

        editForm.put(`/admin/users/${editingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const handleToggleStatus = (user) => {
        router.patch(
            `/admin/users/${user.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setStatusConfirmUser(null),
            }
        );
    };

    const handleDeleteUser = (user) => {
        router.delete(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirmUser(null),
        });
    };

    return (
        <AdminLayout title="Kelola Pengguna">
            {/* Flash Messages */}
            {flash?.success && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs animate-fade-in">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <p className="font-semibold">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-xs animate-fade-in">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                    <p className="font-semibold">{flash.error}</p>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Kelola Pengguna (User Management)
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Atur hak akses pengguna (RBAC), kelola status akun peserta, EO, dan admin platform.
                    </p>
                </div>

                {/* Header Action Button */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            createForm.reset();
                            createForm.clearErrors();
                            setIsCreateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
                    >
                        <UserPlus className="size-4" />
                        Tambah User Baru
                    </button>
                </div>
            </div>

            {/* Stat Cards matching mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Peserta Terdaftar */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Total Peserta Terdaftar
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {Number(stats.totalPeserta ?? 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Users</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <span>+{stats.totalPeserta ?? 0} akun peserta aktif</span>
                        </p>
                    </div>
                </div>

                {/* 2. Akun Penyelenggara (EO) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Akun Penyelenggara (EO)
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <Building2 className="size-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-950 tracking-tight">
                                {Number(stats.totalEo ?? 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs font-medium text-slate-500">Accounts</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{stats.totalEo ?? 0} Terverifikasi</span>,{' '}
                            <span className="font-semibold text-amber-600">{stats.pendingEoCount ?? 0} Pending</span>
                        </p>
                    </div>
                </div>

                {/* 3. Platform Admin & Owner */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Platform Admin & Owner
                        </p>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                        <p className="mt-1 text-xs font-medium text-amber-700 flex items-center gap-1">
                            <ShieldCheck className="size-3.5" />
                            Hak akses penuh (Full Access)
                        </p>
                    </div>
                </div>
            </div>

            {/* Role Tabs in Floating Pill Style matching mockup */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl inline-flex overflow-x-auto max-w-full">
                {[
                    ['ALL', 'Semua User', stats.totalUsers ?? 0],
                    ['ADMIN', 'Super Admin', stats.totalAdmin ?? 0],
                    ['EO', 'Event Organizer', stats.totalEo ?? 0],
                    ['USER', 'Peserta', stats.totalPeserta ?? 0],
                    ['SUSPENDED_TAB', 'Suspended', stats.totalSuspended ?? 0],
                ].map(([key, label, count]) => {
                    const isTabActive =
                        key === 'SUSPENDED_TAB'
                            ? selectedStatus === 'SUSPENDED'
                            : selectedRole === key && selectedStatus !== 'SUSPENDED';

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                if (key === 'SUSPENDED_TAB') {
                                    setSelectedStatus('SUSPENDED');
                                    setSelectedRole('ALL');
                                    applyFilters({ status: 'SUSPENDED', role: 'ALL' });
                                } else {
                                    setSelectedStatus('ALL');
                                    handleRoleTabChange(key);
                                }
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                isTabActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                        >
                            <span>{label}</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    isTabActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filter and Table Container */}
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/40">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, email, nomor HP, atau ID..."
                            className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    applyFilters({ search: '' });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Filter Status Dropdown */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Status:</span>
                            <select
                                value={selectedStatus}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Urutkan:</span>
                            <select
                                value={selectedSort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                            >
                                <option value="latest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="name_asc">Nama (A-Z)</option>
                                <option value="name_desc">Nama (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th scope="col" className="py-3.5 px-5">User & Profil</th>
                                <th scope="col" className="py-3.5 px-5">Kontak (Email & HP)</th>
                                <th scope="col" className="py-3.5 px-5">Role / Hak Akses</th>
                                <th scope="col" className="py-3.5 px-5">Tanggal Join</th>
                                <th scope="col" className="py-3.5 px-5">Status</th>
                                <th scope="col" className="py-3.5 px-5">Aktivitas</th>
                                <th scope="col" className="py-3.5 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data && users.data.length > 0 ? (
                                users.data.map((user) => {
                                    const userInitials = user.name
                                        ? user.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()
                                        : 'U';

                                    const isSelf = user.id === currentAdminId;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/70 transition">
                                            {/* User & Profil */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                                                            user.role === 'ADMIN'
                                                                ? 'bg-slate-900 text-white'
                                                                : user.role === 'EO'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-emerald-600 text-white'
                                                        }`}
                                                    >
                                                        {userInitials}
                                                    </span>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-slate-900 leading-tight">
                                                                {user.name}
                                                            </p>
                                                            {isSelf && (
                                                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                                                    Anda
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-mono text-slate-400">
                                                            ID: {String(user.id).slice(0, 8)}...
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kontak */}
                                            <td className="py-4 px-5">
                                                <p className="text-slate-700 font-medium flex items-center gap-1.5 text-xs">
                                                    <Mail className="size-3 text-slate-400" />
                                                    {user.email}
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                                    <Phone className="size-3 text-slate-400" />
                                                    {user.phone}
                                                </p>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="py-4 px-5">
                                                {user.role === 'ADMIN' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                        <Shield className="size-3" />
                                                        Super Admin
                                                    </span>
                                                ) : user.role === 'EO' ? (
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
                                            <td className="py-4 px-5 text-slate-600 text-xs">
                                                {user.created_at_formatted}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-5">
                                                {user.status === 'SUSPENDED' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200/70">
                                                        <span className="size-1.5 rounded-full bg-red-500" />
                                                        Suspended
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        Aktif
                                                    </span>
                                                )}
                                            </td>

                                            {/* Aktivitas */}
                                            <td className="py-4 px-5 text-xs text-slate-600">
                                                <span className="font-medium">{user.activity}</span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition"
                                                        title="Edit Data / Role"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>

                                                    {!isSelf && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setStatusConfirmUser(user)}
                                                                className={`p-1.5 rounded-lg border transition ${
                                                                    user.status === 'SUSPENDED'
                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                }`}
                                                                title={
                                                                    user.status === 'SUSPENDED'
                                                                        ? 'Aktifkan Kembali'
                                                                        : 'Tangguhkan (Suspend) Akun'
                                                                }
                                                            >
                                                                {user.status === 'SUSPENDED' ? (
                                                                    <UserCheck className="size-3.5" />
                                                                ) : (
                                                                    <UserX className="size-3.5" />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteConfirmUser(user)}
                                                                className="p-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                                                                title="Hapus Akun"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <Users className="mx-auto size-8 text-slate-300 mb-2" />
                                        <p className="font-semibold text-slate-600">Tidak ada data pengguna ditemukan.</p>
                                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer / Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>
                            Menampilkan <span className="font-semibold text-slate-900">{users.from || 0}</span> sampai{' '}
                            <span className="font-semibold text-slate-900">{users.to || 0}</span> dari{' '}
                            <span className="font-semibold text-slate-900">{users.total || 0}</span> Pengguna
                        </p>
                        <div className="flex items-center gap-1">
                            {users.links.map((link, idx) => {
                                const isNumber = !link.label.includes('&laquo;') && !link.label.includes('&raquo;');
                                const cleanLabel = link.label
                                    .replace('&laquo; Previous', '‹')
                                    .replace('Next &raquo;', '›');

                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        {cleanLabel}
                                    </Link>
                                ) : (
                                    <span
                                        key={idx}
                                        className="px-2.5 py-1 text-slate-300 border border-slate-100 rounded-lg"
                                    >
                                        {cleanLabel}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal 1: Tambah User Baru */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Tambah Pengguna Baru</h3>
                                <p className="text-xs text-slate-500">Buat akun untuk Peserta, Event Organizer, atau Super Admin.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Budi Pratama"
                                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                    required
                                />
                                {createForm.errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{createForm.errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Alamat Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={createForm.data.email}
                                        onChange={(e) => createForm.setData('email', e.target.value)}
                                        placeholder="user@example.com"
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                        required
                                    />
                                    {createForm.errors.email && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        placeholder="0812xxxxxxxx"
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                    />
                                    {createForm.errors.phone && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Role / Hak Akses *
                                    </label>
                                    <select
                                        value={createForm.data.role}
                                        onChange={(e) => createForm.setData('role', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-600 focus:outline-none"
                                    >
                                        <option value="USER">Peserta (User)</option>
                                        <option value="EO">Event Organizer (EO)</option>
                                        <option value="ADMIN">Super Admin (Platform Owner)</option>
                                    </select>
                                    {createForm.errors.role && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.role}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Status Awal
                                    </label>
                                    <select
                                        value={createForm.data.status}
                                        onChange={(e) => createForm.setData('status', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-600 focus:outline-none"
                                    >
                                        <option value="ACTIVE">Aktif (Bisa Login)</option>
                                        <option value="SUSPENDED">Ditangguhkan (Suspended)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Kata Sandi *
                                </label>
                                <input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                    required
                                />
                                {createForm.errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{createForm.errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition"
                                >
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Edit User */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Edit Pengguna</h3>
                                <p className="text-xs text-slate-500">Perbarui profil, kontak, role, atau reset password.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                                    required
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{editForm.errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.data.email}
                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                                        required
                                    />
                                    {editForm.errors.email && (
                                        <p className="mt-1 text-xs text-red-600">{editForm.errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        placeholder="0812xxxxxxxx"
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                                    />
                                    {editForm.errors.phone && (
                                        <p className="mt-1 text-xs text-red-600">{editForm.errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Role / Hak Akses *
                                    </label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-600 focus:outline-none"
                                    >
                                        <option value="USER">Peserta (User)</option>
                                        <option value="EO">Event Organizer (EO)</option>
                                        <option value="ADMIN">Super Admin (Platform Owner)</option>
                                    </select>
                                    {editForm.errors.role && (
                                        <p className="mt-1 text-xs text-red-600">{editForm.errors.role}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                        Status Akun
                                    </label>
                                    <select
                                        value={editForm.data.status}
                                        onChange={(e) => editForm.setData('status', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-blue-600 focus:outline-none"
                                    >
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Kata Sandi Baru (Opsional)
                                </label>
                                <input
                                    type="password"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Biarkan kosong jika tidak ingin mengubah password"
                                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none"
                                />
                                {editForm.errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{editForm.errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition"
                                >
                                    {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Konfirmasi Suspend / Aktifkan */}
            {statusConfirmUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center">
                        <span
                            className={`mx-auto flex size-12 items-center justify-center rounded-2xl mb-3 ${
                                statusConfirmUser.status === 'SUSPENDED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {statusConfirmUser.status === 'SUSPENDED' ? (
                                <UserCheck className="size-6" />
                            ) : (
                                <UserX className="size-6" />
                            )}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                            {statusConfirmUser.status === 'SUSPENDED'
                                ? 'Aktifkan Kembali Akun?'
                                : 'Tangguhkan (Suspend) Akun?'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {statusConfirmUser.status === 'SUSPENDED'
                                ? `Pengguna ${statusConfirmUser.name} akan dapat masuk kembali ke platform Hajirin.`
                                : `Pengguna ${statusConfirmUser.name} tidak akan dapat login atau melakukan transaksi selama akun ditangguhkan.`}
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStatusConfirmUser(null)}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(statusConfirmUser)}
                                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition ${
                                    statusConfirmUser.status === 'SUSPENDED'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                            >
                                {statusConfirmUser.status === 'SUSPENDED' ? 'Ya, Aktifkan' : 'Ya, Tangguhkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 4: Konfirmasi Hapus User */}
            {deleteConfirmUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center">
                        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 mb-3">
                            <Trash2 className="size-6" />
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">Hapus Akun Pengguna?</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-700">{deleteConfirmUser.name}</span> ({deleteConfirmUser.email})? Tindakan ini tidak dapat dibatalkan.
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmUser(null)}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteUser(deleteConfirmUser)}
                                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                            >
                                Ya, Hapus Akun
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
