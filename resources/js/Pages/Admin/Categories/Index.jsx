import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Briefcase,
    Calendar,
    Edit2,
    GraduationCap,
    Headphones,
    LayoutGrid,
    Menu,
    Palette,
    Plus,
    Search,
    Sparkles,
    Tag,
    TentTree,
    Trash2,
    Trophy,
    UserRound,
    Users,
    Volleyball,
} from 'lucide-react';
import { Card } from '../../../Components/ui/Card';
import { StatCard } from '../../../Components/ui/StatCard';
import { NeutralTag } from '../../../Components/ui/StatusBadge';
import { Pagination } from '../../../Components/ui/Pagination';
import { FlashBanner } from '../../../Components/ui/FlashBanner';
import { Button } from '../../../Components/ui/Button';
import { Modal } from '../../../Components/ui/Dialog';

const ICON_COMPONENTS = {
    headphones: Headphones,
    users: Users,
    palette: Palette,
    volleyball: Volleyball,
    'user-round': UserRound,
    'tent-tree': TentTree,
    'layout-grid': LayoutGrid,
    menu: Menu,
    calendar: Calendar,
    sparkles: Sparkles,
    briefcase: Briefcase,
    'graduation-cap': GraduationCap,
    trophy: Trophy,
    tag: Tag,
};

const ICON_LABELS = {
    headphones: 'Musik / Audio',
    users: 'Seminar / Grup',
    palette: 'Workshop / Seni',
    volleyball: 'Olahraga',
    'user-round': 'Komunitas',
    'tent-tree': 'Festival',
    'layout-grid': 'Pameran',
    menu: 'Lainnya',
    calendar: 'Agenda',
    sparkles: 'Hiburan',
    briefcase: 'Bisnis',
    'graduation-cap': 'Edukasi',
    trophy: 'Kompetisi',
    tag: 'Umum',
};

const INPUT_CLASS =
    'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

function toSlug(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function CategoryManagementIndex({
    categories = { data: [], links: [] },
    stats = {},
    filters = {},
    iconOptions = Object.keys(ICON_COMPONENTS),
}) {
    const { flash, errors: pageErrors } = usePage().props;

    const [search, setSearch] = useState(filters.search || '');
    const [sort, setSort] = useState(filters.sort || 'name_asc');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [slugEditedManually, setSlugEditedManually] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState(null);

    const form = useForm({
        name: '',
        slug: '',
        icon: 'tag',
    });

    const applyFilters = (overrides = {}) => {
        const params = {
            search: overrides.search !== undefined ? overrides.search : search,
            sort: overrides.sort !== undefined ? overrides.sort : sort,
        };

        if (!params.search) delete params.search;
        if (params.sort === 'name_asc') delete params.sort;

        router.get('/admin/categories', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleSortChange = (nextSort) => {
        setSort(nextSort);
        applyFilters({ sort: nextSort });
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setSlugEditedManually(false);
        form.setData({ name: '', slug: '', icon: 'tag' });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setSlugEditedManually(true);
        form.setData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || 'tag',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
        form.clearErrors();
    };

    const handleNameChange = (value) => {
        form.setData((prev) => ({
            ...prev,
            name: value,
            slug: slugEditedManually ? prev.slug : toSlug(value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeFormModal();
                form.reset();
            },
        };

        if (editingCategory) {
            form.put(`/admin/categories/${editingCategory.id}`, options);
            return;
        }

        form.post('/admin/categories', options);
    };

    const handleDelete = () => {
        if (!deletingCategory) return;

        router.delete(`/admin/categories/${deletingCategory.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingCategory(null),
        });
    };

    return (
        <AdminLayout title="Kelola Kategori">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                        Kelola Kategori Event
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Data master kategori acara untuk mengelompokkan event di seluruh platform Hajirin.
                    </p>
                </div>

                <Button variant="primary" size="md" onClick={openCreateModal}>
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Tambah Kategori</span>
                </Button>
            </div>

            {flash?.success && <FlashBanner tone="success" message={flash.success} />}
            {pageErrors?.category && <FlashBanner tone="error" message={pageErrors.category} />}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Total Kategori"
                    icon={Tag}
                    value={stats.totalCategories ?? 0}
                    subtext="Data master aktif di sistem"
                />
                <StatCard
                    label="Kategori Terpakai"
                    icon={LayoutGrid}
                    value={stats.usedCategories ?? 0}
                    subtext={`${stats.unusedCategories ?? 0} kategori belum memiliki event`}
                />
                <StatCard
                    label="Event Terhubung"
                    icon={Calendar}
                    value={stats.totalEventsLinked ?? 0}
                    subtext="Total relasi event pada kategori"
                />
            </div>

            <Card className="overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex gap-2">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau slug kategori..."
                                aria-label="Cari kategori"
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                        </div>
                        <Button type="submit" variant="outline" size="md">
                            Cari
                        </Button>
                    </form>

                    <div className="flex items-center gap-2">
                        <label htmlFor="category-sort" className="text-xs font-medium text-slate-500">
                            Urutkan:
                        </label>
                        <select
                            id="category-sort"
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-blue focus:outline-none"
                        >
                            <option value="name_asc">Nama (A - Z)</option>
                            <option value="name_desc">Nama (Z - A)</option>
                            <option value="most_events">Event Terbanyak</option>
                            <option value="latest">Terbaru Ditambahkan</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                            <tr>
                                <th scope="col" className="px-5 py-3">Kategori</th>
                                <th scope="col" className="px-5 py-3">Slug URL</th>
                                <th scope="col" className="px-5 py-3">Jumlah Event</th>
                                <th scope="col" className="px-5 py-3">Dibuat</th>
                                <th scope="col" className="px-5 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                                        Tidak ada kategori yang cocok dengan pencarian Anda.
                                    </td>
                                </tr>
                            ) : (
                                categories.data.map((category) => {
                                    const IconComponent = ICON_COMPONENTS[category.icon] || Tag;

                                    return (
                                        <tr key={category.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                                                        <IconComponent className="size-4" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {category.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Ikon: {ICON_LABELS[category.icon] || category.icon}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                                                    /kategori/{category.slug}
                                                </code>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <NeutralTag className="tabular-nums">
                                                    {category.events_count} Event
                                                </NeutralTag>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500 tabular-nums">
                                                {category.created_at_formatted}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => openEditModal(category)}
                                                    >
                                                        <Edit2 className="size-3.5" aria-hidden="true" />
                                                        <span>Ubah</span>
                                                    </Button>
                                                    <Button
                                                        variant="danger-outline"
                                                        size="xs"
                                                        onClick={() => setDeletingCategory(category)}
                                                    >
                                                        <Trash2 className="size-3.5" aria-hidden="true" />
                                                        <span>Hapus</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    links={categories.links}
                    from={categories.from}
                    to={categories.to}
                    total={categories.total}
                    itemLabel="kategori"
                />
            </Card>

            {/* Modal Tambah / Ubah Kategori */}
            <Modal
                open={isFormOpen}
                onClose={closeFormModal}
                title={editingCategory ? 'Ubah Kategori Event' : 'Tambah Kategori Baru'}
                description="Kelola nama, slug URL, dan ikon kategori event."
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="category-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                            Nama Kategori
                        </label>
                        <input
                            id="category-name"
                            type="text"
                            value={form.data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Contoh: Teknologi, Kuliner, Pendidikan"
                            className={INPUT_CLASS}
                            required
                        />
                        {form.errors.name && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">{form.errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="category-slug" className="block text-xs font-medium text-slate-700 mb-1.5">
                            Slug URL
                        </label>
                        <input
                            id="category-slug"
                            type="text"
                            value={form.data.slug}
                            onChange={(e) => {
                                setSlugEditedManually(true);
                                form.setData('slug', e.target.value);
                            }}
                            placeholder="otomatis-dari-nama"
                            className={`${INPUT_CLASS} font-mono`}
                            required
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            Digunakan pada URL filter kategori: /kategori/{form.data.slug || 'slug'}
                        </p>
                        {form.errors.slug && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">{form.errors.slug}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="category-icon" className="block text-xs font-medium text-slate-700 mb-1.5">
                            Ikon Kategori
                        </label>
                        <select
                            id="category-icon"
                            value={form.data.icon}
                            onChange={(e) => form.setData('icon', e.target.value)}
                            className={INPUT_CLASS}
                        >
                            {iconOptions.map((iconKey) => (
                                <option key={iconKey} value={iconKey}>
                                    {ICON_LABELS[iconKey] || iconKey} ({iconKey})
                                </option>
                            ))}
                        </select>
                        {form.errors.icon && (
                            <p role="alert" className="mt-1 text-xs text-rose-600">{form.errors.icon}</p>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={closeFormModal}>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" size="sm" loading={form.processing}>
                            {form.processing
                                ? 'Menyimpan...'
                                : editingCategory
                                  ? 'Simpan Perubahan'
                                  : 'Tambah Kategori'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal
                open={Boolean(deletingCategory)}
                onClose={() => setDeletingCategory(null)}
                title={deletingCategory ? `Hapus Kategori "${deletingCategory.name}"?` : 'Hapus Kategori'}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setDeletingCategory(null)}>
                            Batal
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleDelete}>
                            Ya, Hapus
                        </Button>
                    </>
                }
            >
                {deletingCategory && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {deletingCategory.events_count > 0
                            ? `Kategori ini masih terhubung dengan ${deletingCategory.events_count} event sehingga penghapusan akan ditolak oleh sistem.`
                            : 'Kategori yang belum digunakan oleh event akan dihapus secara permanen.'}
                    </p>
                )}
            </Modal>
        </AdminLayout>
    );
}
