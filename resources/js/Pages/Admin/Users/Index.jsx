import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Users,
    Building2,
    Shield,
    UserPlus,
    Search,
    Phone,
    Mail,
    Edit2,
    UserX,
    UserCheck,
    Trash2,
    X,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { StatusBadge, NeutralTag } from '../../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../../Components/ui/UnderlineTabs';
import { Pagination } from '../../../Components/ui/Pagination';
import { Avatar } from '../../../Components/ui/Avatar';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button, buttonClass } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const ROLE_LABELS = {
    ADMIN: 'Super Admin',
    EO: 'Event Organizer',
    USER: 'Peserta',
};

const INPUT_CLASS =
    'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function UserManagementIndex({
    users = { data: [], links: [] },
    stats = {},
    filters = {},
}) {
    const { flash, auth } = usePage().props;
    const currentAdminId = auth?.user?.id;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'ALL');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'ALL');
    const [selectedSort, setSelectedSort] = useState(filters.sort || 'latest');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [statusConfirmUser, setStatusConfirmUser] = useState(null);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'USER',
        status: 'ACTIVE',
        password: '',
    });

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

    const handleTabChange = (key) => {
        if (key === 'SUSPENDED_TAB') {
            setSelectedStatus('SUSPENDED');
            setSelectedRole('ALL');
            applyFilters({ status: 'SUSPENDED', role: 'ALL' });
        } else {
            setSelectedStatus('ALL');
            setSelectedRole(key);
            applyFilters({ status: 'ALL', role: key });
        }
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

    const activeTabKey = selectedStatus === 'SUSPENDED' ? 'SUSPENDED_TAB' : selectedRole;
    const roleTabs = [
        ['ALL', 'Semua User', stats.totalUsers ?? 0],
        ['ADMIN', 'Super Admin', stats.totalAdmin ?? 0],
        ['EO', 'Event Organizer', stats.totalEo ?? 0],
        ['USER', 'Peserta', stats.totalPeserta ?? 0],
        ['SUSPENDED_TAB', 'Suspended', stats.totalSuspended ?? 0],
    ];

    return (
        <AdminLayout title="Kelola Pengguna">
            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {flash?.error && <FlashBanner tone="error" message={flash.error} />}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Kelola Pengguna
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Atur hak akses pengguna (RBAC) serta kelola status akun peserta, EO, dan admin platform.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                        createForm.reset();
                        createForm.clearErrors();
                        setIsCreateModalOpen(true);
                    }}
                >
                    <UserPlus className="size-4" aria-hidden="true" />
                    <span>Tambah User Baru</span>
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Total Peserta Terdaftar"
                    icon={Users}
                    value={Number(stats.totalPeserta ?? 0).toLocaleString('id-ID')}
                    valueSuffix="akun"
                    subtext={`${stats.totalPeserta ?? 0} akun peserta aktif`}
                />
                <StatCard
                    label="Akun Penyelenggara (EO)"
                    icon={Building2}
                    value={Number(stats.totalEo ?? 0).toLocaleString('id-ID')}
                    valueSuffix="mitra"
                    subtext={`${stats.totalEo ?? 0} terverifikasi, ${stats.pendingEoCount ?? 0} pending`}
                />
                <StatCard
                    label="Platform Admin & Owner"
                    icon={Shield}
                    value={Number(stats.totalAdmin ?? 1).toLocaleString('id-ID')}
                    valueSuffix="admin"
                    subtext="Hak akses penuh platform"
                />
            </div>

            {/* Filter and Table Container */}
            <Card className="overflow-hidden">
                <UnderlineTabs
                    items={roleTabs}
                    activeKey={activeTabKey}
                    onChange={handleTabChange}
                />

                {/* Search & Filter Bar */}
                <div className="px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/40">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, email, nomor HP, atau ID..."
                            aria-label="Cari pengguna"
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

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="user-status-filter" className="font-medium">
                                Status:
                            </label>
                            <select
                                id="user-status-filter"
                                value={selectedStatus}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value="ACTIVE">Aktif</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <label htmlFor="user-sort-filter" className="font-medium">
                                Urutkan:
                            </label>
                            <select
                                id="user-sort-filter"
                                value={selectedSort}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
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
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="py-3 px-5">User & Profil</th>
                                <th scope="col" className="py-3 px-5">Kontak</th>
                                <th scope="col" className="py-3 px-5">Role</th>
                                <th scope="col" className="py-3 px-5">Tanggal Join</th>
                                <th scope="col" className="py-3 px-5">Status</th>
                                <th scope="col" className="py-3 px-5">Aktivitas</th>
                                <th scope="col" className="py-3 px-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data && users.data.length > 0 ? (
                                users.data.map((user) => {
                                    const isSelf = user.id === currentAdminId;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.name} size="md" />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900 leading-tight truncate">
                                                                {user.name}
                                                            </p>
                                                            {isSelf && <NeutralTag>Anda</NeutralTag>}
                                                        </div>
                                                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                                                            ID: {String(user.id).slice(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <p className="text-slate-700 flex items-center gap-1.5 text-xs">
                                                    <Mail className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                    <span>{user.email}</span>
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                                    <Phone className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                    <span>{user.phone}</span>
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <NeutralTag>
                                                    {ROLE_LABELS[user.role] || 'Peserta'}
                                                </NeutralTag>
                                            </td>

                                            <td className="py-3.5 px-5 text-slate-600 text-xs tabular-nums">
                                                {user.created_at_formatted}
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <StatusBadge
                                                    tone={user.status === 'SUSPENDED' ? 'danger' : 'success'}
                                                    label={user.status === 'SUSPENDED' ? 'Suspended' : 'Aktif'}
                                                />
                                            </td>

                                            <td className="py-3.5 px-5 text-xs text-slate-600">
                                                {user.activity}
                                            </td>

                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(user)}
                                                        className={buttonClass('outline', 'icon')}
                                                        title="Edit Data / Role"
                                                        aria-label={`Edit pengguna ${user.name}`}
                                                    >
                                                        <Edit2 className="size-3.5" aria-hidden="true" />
                                                    </button>

                                                    {!isSelf && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setStatusConfirmUser(user)}
                                                                className={buttonClass('outline', 'icon')}
                                                                title={
                                                                    user.status === 'SUSPENDED'
                                                                        ? 'Aktifkan Kembali'
                                                                        : 'Tangguhkan (Suspend) Akun'
                                                                }
                                                                aria-label={
                                                                    user.status === 'SUSPENDED'
                                                                        ? `Aktifkan kembali ${user.name}`
                                                                        : `Tangguhkan akun ${user.name}`
                                                                }
                                                            >
                                                                {user.status === 'SUSPENDED' ? (
                                                                    <UserCheck className="size-3.5" aria-hidden="true" />
                                                                ) : (
                                                                    <UserX className="size-3.5" aria-hidden="true" />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteConfirmUser(user)}
                                                                className={buttonClass('danger-outline', 'icon')}
                                                                title="Hapus Akun"
                                                                aria-label={`Hapus akun ${user.name}`}
                                                            >
                                                                <Trash2 className="size-3.5" aria-hidden="true" />
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
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        <Users className="mx-auto size-7 text-slate-300 mb-2" aria-hidden="true" />
                                        <p className="text-sm font-medium text-slate-700">
                                            Tidak ada data pengguna ditemukan.
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Coba sesuaikan kata kunci pencarian atau filter Anda.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    links={users.links}
                    from={users.from}
                    to={users.to}
                    total={users.total}
                    itemLabel="pengguna"
                />
            </Card>

            {/* Modal 1: Tambah User Baru */}
            <Modal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Pengguna Baru"
                description="Buat akun baru untuk Peserta, Event Organizer, atau Super Admin."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label htmlFor="create-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                            Nama Lengkap <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="create-name"
                            type="text"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            placeholder="Contoh: Budi Pratama"
                            className={INPUT_CLASS}
                            required
                        />
                        {createForm.errors.name && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">{createForm.errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="create-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Alamat Email <span className="text-rose-600">*</span>
                            </label>
                            <input
                                id="create-email"
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                placeholder="user@example.com"
                                className={INPUT_CLASS}
                                required
                            />
                            {createForm.errors.email && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">{createForm.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="create-phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Nomor Telepon
                            </label>
                            <input
                                id="create-phone"
                                type="text"
                                value={createForm.data.phone}
                                onChange={(e) => createForm.setData('phone', e.target.value)}
                                placeholder="0812xxxxxxxx"
                                className={INPUT_CLASS}
                            />
                            {createForm.errors.phone && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">{createForm.errors.phone}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="create-role" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Role / Hak Akses <span className="text-rose-600">*</span>
                            </label>
                            <select
                                id="create-role"
                                value={createForm.data.role}
                                onChange={(e) => createForm.setData('role', e.target.value)}
                                className={INPUT_CLASS}
                            >
                                <option value="USER">Peserta (User)</option>
                                <option value="EO">Event Organizer (EO)</option>
                                <option value="ADMIN">Super Admin (Platform Owner)</option>
                            </select>
                            {createForm.errors.role && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">{createForm.errors.role}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="create-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Status Awal
                            </label>
                            <select
                                id="create-status"
                                value={createForm.data.status}
                                onChange={(e) => createForm.setData('status', e.target.value)}
                                className={INPUT_CLASS}
                            >
                                <option value="ACTIVE">Aktif (Bisa Login)</option>
                                <option value="SUSPENDED">Ditangguhkan (Suspended)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="create-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                            Kata Sandi <span className="text-rose-600">*</span>
                        </label>
                        <input
                            id="create-password"
                            type="password"
                            value={createForm.data.password}
                            onChange={(e) => createForm.setData('password', e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className={INPUT_CLASS}
                            required
                        />
                        {createForm.errors.password && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">{createForm.errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" size="sm" loading={createForm.processing}>
                            {createForm.processing ? 'Menyimpan...' : 'Simpan Pengguna'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal 2: Edit User */}
            <Modal
                open={Boolean(editingUser)}
                onClose={() => setEditingUser(null)}
                title="Edit Pengguna"
                description="Perbarui profil, kontak, role, atau atur ulang kata sandi pengguna."
                maxWidth="max-w-lg"
            >
                {editingUser && (
                    <form onSubmit={handleEditUser} className="space-y-4">
                        <div>
                            <label htmlFor="edit-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Nama Lengkap <span className="text-rose-600">*</span>
                            </label>
                            <input
                                id="edit-name"
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className={INPUT_CLASS}
                                required
                            />
                            {editForm.errors.name && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">{editForm.errors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="edit-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Email <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className={INPUT_CLASS}
                                    required
                                />
                                {editForm.errors.email && (
                                    <p role="alert" className="mt-1 text-xs text-rose-600">{editForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="edit-phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Nomor Telepon
                                </label>
                                <input
                                    id="edit-phone"
                                    type="text"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                    placeholder="0812xxxxxxxx"
                                    className={INPUT_CLASS}
                                />
                                {editForm.errors.phone && (
                                    <p role="alert" className="mt-1 text-xs text-rose-600">{editForm.errors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="edit-role" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Role / Hak Akses <span className="text-rose-600">*</span>
                                </label>
                                <select
                                    id="edit-role"
                                    value={editForm.data.role}
                                    onChange={(e) => editForm.setData('role', e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    <option value="USER">Peserta (User)</option>
                                    <option value="EO">Event Organizer (EO)</option>
                                    <option value="ADMIN">Super Admin (Platform Owner)</option>
                                </select>
                                {editForm.errors.role && (
                                    <p role="alert" className="mt-1 text-xs text-rose-600">{editForm.errors.role}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="edit-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Status Akun
                                </label>
                                <select
                                    id="edit-status"
                                    value={editForm.data.status}
                                    onChange={(e) => editForm.setData('status', e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                                Kata Sandi Baru (Opsional)
                            </label>
                            <input
                                id="edit-password"
                                type="password"
                                value={editForm.data.password}
                                onChange={(e) => editForm.setData('password', e.target.value)}
                                placeholder="Biarkan kosong jika tidak ingin mengubah password"
                                className={INPUT_CLASS}
                            />
                            {editForm.errors.password && (
                                <p role="alert" className="mt-1 text-xs text-rose-600">{editForm.errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                                Batal
                            </Button>
                            <Button type="submit" variant="primary" size="sm" loading={editForm.processing}>
                                {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal 3: Konfirmasi Suspend / Aktifkan */}
            <Modal
                open={Boolean(statusConfirmUser)}
                onClose={() => setStatusConfirmUser(null)}
                title={
                    statusConfirmUser?.status === 'SUSPENDED'
                        ? 'Aktifkan Kembali Akun?'
                        : 'Tangguhkan (Suspend) Akun?'
                }
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setStatusConfirmUser(null)}>
                            Batal
                        </Button>
                        {statusConfirmUser && (
                            <Button
                                variant={statusConfirmUser.status === 'SUSPENDED' ? 'primary' : 'danger'}
                                size="sm"
                                onClick={() => handleToggleStatus(statusConfirmUser)}
                            >
                                {statusConfirmUser.status === 'SUSPENDED' ? 'Ya, Aktifkan' : 'Ya, Tangguhkan'}
                            </Button>
                        )}
                    </>
                }
            >
                {statusConfirmUser && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {statusConfirmUser.status === 'SUSPENDED'
                            ? `Pengguna ${statusConfirmUser.name} akan dapat masuk kembali ke platform Hajirin.`
                            : `Pengguna ${statusConfirmUser.name} tidak akan dapat login atau melakukan transaksi selama akun ditangguhkan.`}
                    </p>
                )}
            </Modal>

            {/* Modal 4: Konfirmasi Hapus User */}
            <Modal
                open={Boolean(deleteConfirmUser)}
                onClose={() => setDeleteConfirmUser(null)}
                title="Hapus Akun Pengguna?"
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirmUser(null)}>
                            Batal
                        </Button>
                        {deleteConfirmUser && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteUser(deleteConfirmUser)}
                            >
                                Ya, Hapus Akun
                            </Button>
                        )}
                    </>
                }
            >
                {deleteConfirmUser && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Apakah Anda yakin ingin menghapus akun{' '}
                        <span className="font-semibold text-slate-900">{deleteConfirmUser.name}</span> (
                        {deleteConfirmUser.email})? Tindakan ini tidak dapat dibatalkan.
                    </p>
                )}
            </Modal>
        </AdminLayout>
    );
}
