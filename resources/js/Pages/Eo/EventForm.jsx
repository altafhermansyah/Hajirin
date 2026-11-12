import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Calendar,
    MapPin,
    Globe,
    Image as ImageIcon,
    Ticket,
    PlusCircle,
    Trash2,
    ArrowLeft,
    CheckCircle2,
    Send,
    Save,
    AlertCircle,
    FileText,
} from 'lucide-react';

const emptyTicketTemplate = () => ({
    id: null,
    name: '',
    description: '',
    quota: 50,
    sold_count: 0,
    max_per_order: 5,
    sale_start: '',
    sale_end: '',
    price: 0,
    price_tier_name: 'Harga Resmi',
});

export default function EventForm({
    mode = 'create',
    organizerName = '',
    categories = [],
    event = null,
}) {
    const { errors = {} } = usePage().props;
    const isEdit = mode === 'edit' && event !== null;

    const [formData, setFormData] = useState({
        title: event?.title || '',
        category_id: event?.category_id || (categories[0]?.id ?? ''),
        description: event?.description || '',
        terms_and_conditions: event?.terms_and_conditions || '',
        event_type: event?.event_type || 'OFFLINE',
        city: event?.city || '',
        venue_name: event?.venue_name || '',
        address: event?.address || '',
        online_url: event?.online_url || '',
        starts_at: event?.starts_at || '',
        ends_at: event?.ends_at || '',
        banner: null,
        tickets:
            event?.tickets && event.tickets.length > 0
                ? event.tickets
                : [
                      {
                          ...emptyTicketTemplate(),
                          name: 'Regular Pass',
                          quota: 100,
                          price: 50000,
                      },
                  ],
    });

    const [bannerPreview, setBannerPreview] = useState(event?.banner_path || null);
    const [processingAction, setProcessingAction] = useState(null);

    const updateField = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleBannerChange = (e) => {
        const file = e.target.files?.[0] || null;
        updateField('banner', file);
        if (file) {
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const addTicketTier = () => {
        setFormData((prev) => ({
            ...prev,
            tickets: [...prev.tickets, emptyTicketTemplate()],
        }));
    };

    const removeTicketTier = (index) => {
        setFormData((prev) => {
            if (prev.tickets.length <= 1) return prev;
            return {
                ...prev,
                tickets: prev.tickets.filter((_, idx) => idx !== index),
            };
        });
    };

    const updateTicketField = (index, field, value) => {
        setFormData((prev) => {
            const nextTickets = [...prev.tickets];
            nextTickets[index] = {
                ...nextTickets[index],
                [field]: value,
            };
            return {
                ...prev,
                tickets: nextTickets,
            };
        });
    };

    const submitWithAction = (submitAction) => {
        setProcessingAction(submitAction);

        if (isEdit) {
            router.post(
                `/eo/events/${event.id}`,
                {
                    _method: 'put',
                    ...formData,
                    submit_action: submitAction,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onFinish: () => setProcessingAction(null),
                }
            );
        } else {
            router.post(
                '/eo/events',
                {
                    ...formData,
                    submit_action: submitAction,
                },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onFinish: () => setProcessingAction(null),
                }
            );
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const defaultAction =
            isEdit && event?.status === 'PUBLISHED' ? 'KEEP' : 'PENDING_REVIEW';
        submitWithAction(defaultAction);
    };

    return (
        <EoLayout
            title={isEdit ? `Edit Event: ${event.title}` : 'Buat Event & Tiket Baru'}
            organizerName={organizerName}
        >
            {/* Header & Back Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/eo/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 mb-2"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Dashboard EO
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {isEdit ? 'Edit Informasi Event & Jenis Tiket' : 'Buat Event & Konfigurasi Tiket'}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Lengkapi detail acara, jadwal, lokasi, serta atur variasi jenis tiket dan tier harga dalam satu halaman.
                    </p>
                </div>

                {isEdit && (
                    <span
                        className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full px-3.5 py-1.5 text-xs font-bold border ${
                            event.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : event.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : event.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                        Status Saat Ini:{' '}
                        {event.status === 'PUBLISHED'
                            ? 'Published (Tayang)'
                            : event.status === 'PENDING_REVIEW'
                            ? 'Menunggu Review Admin'
                            : event.status === 'REJECTED'
                            ? 'Perlu Revisi'
                            : 'Draft'}
                    </span>
                )}
            </div>

            {/* Rejection Alert if Event was Rejected by Admin */}
            {isEdit && event?.status === 'REJECTED' && event?.rejection_reason && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50/90 p-4 sm:p-5 text-sm text-red-900 shadow-xs flex items-start gap-3"
                >
                    <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                    <div>
                        <p className="font-bold">Catatan Revisi dari Moderator Admin:</p>
                        <p className="mt-1 text-xs sm:text-sm text-red-800 leading-relaxed">
                            {event.rejection_reason}
                        </p>
                        <p className="mt-1.5 text-xs text-red-700">
                            Silakan perbaiki informasi event atau tiket di bawah ini, lalu klik tombol{' '}
                            <span className="font-bold">"Simpan & Ajukan Review ke Admin"</span>.
                        </p>
                    </div>
                </div>
            )}

            <form
                onSubmit={handleFormSubmit}
                action={isEdit ? `/eo/events/${event.id}` : '/eo/events'}
                method="POST"
                encType="multipart/form-data"
                className="space-y-6"
            >
                {/* SECTION 1: Informasi Dasar & Poster Event */}
                <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
                    <legend className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 px-1">
                        <FileText className="size-5 text-blue-600" />
                        1. Informasi Dasar & Poster Event
                    </legend>

                    <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr]">
                        <div className="space-y-2">
                            <label
                                htmlFor="event-title"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Judul Event <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="event-title"
                                name="title"
                                type="text"
                                required
                                maxLength={200}
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                aria-describedby="event-title-help"
                                placeholder="Contoh: Indonesia Tech Conference 2026: Future of AI"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            />
                            <p id="event-title-help" className="text-[11px] text-slate-500">
                                Gunakan judul yang spesifik dan menarik agar mudah ditemukan pengunjung.
                            </p>
                            {errors.title && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="event-category"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Kategori Acara <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="event-category"
                                name="category_id"
                                required
                                value={formData.category_id}
                                onChange={(e) => updateField('category_id', Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.category_id}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="event-description"
                            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                        >
                            Deskripsi Lengkap Acara <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="event-description"
                            name="description"
                            rows={5}
                            required
                            minLength={20}
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            aria-describedby="event-description-help"
                            placeholder="Jelaskan rangkaian acara, pembicara/bintang tamu, fasilitas yang didapat peserta, dan highlight acara (minimal 20 karakter)..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                        />
                        <p id="event-description-help" className="text-[11px] text-slate-500">
                            Minimal 20 karakter. Anda dapat menulis poin-poin highlight acara untuk memperjelas tampilan halaman publik.
                        </p>
                        {errors.description && (
                            <p role="alert" className="text-xs font-medium text-red-600">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="event-tnc"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Syarat & Ketentuan Peserta (Opsional)
                            </label>
                            <textarea
                                id="event-tnc"
                                name="terms_and_conditions"
                                rows={4}
                                value={formData.terms_and_conditions}
                                onChange={(e) => updateField('terms_and_conditions', e.target.value)}
                                placeholder="Contoh: Peserta wajib membawa kartu identitas saat penukaran wristband, dilarang membawa senjata tajam..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            />
                            {errors.terms_and_conditions && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.terms_and_conditions}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="event-banner"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Poster / Banner Event (JPG, PNG, WEBP — Maks 4 MB)
                            </label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                                {bannerPreview ? (
                                    <img
                                        src={bannerPreview}
                                        alt="Preview Poster Event"
                                        className="h-24 w-36 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                                    />
                                ) : (
                                    <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                                        <ImageIcon className="size-7" />
                                    </div>
                                )}
                                <div className="space-y-1.5 text-xs text-slate-600 w-full">
                                    <input
                                        id="event-banner"
                                        name="banner"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleBannerChange}
                                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Rekomendasi rasio landscape 16:9. Jika dikosongkan, sistem akan menggunakan banner standar kategori.
                                    </p>
                                    {errors.banner && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            {errors.banner}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* SECTION 2: Waktu & Lokasi Penyelenggaraan */}
                <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
                    <legend className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 px-1">
                        <Calendar className="size-5 text-blue-600" />
                        2. Jadwal & Lokasi Penyelenggaraan
                    </legend>

                    {/* Jadwal Mulai & Selesai */}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="event-starts-at"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Waktu Mulai Acara <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="event-starts-at"
                                name="starts_at"
                                type="datetime-local"
                                required
                                value={formData.starts_at}
                                onChange={(e) => updateField('starts_at', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            />
                            {errors.starts_at && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.starts_at}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="event-ends-at"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                            >
                                Waktu Selesai Acara <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="event-ends-at"
                                name="ends_at"
                                type="datetime-local"
                                required
                                value={formData.ends_at}
                                onChange={(e) => updateField('ends_at', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            />
                            {errors.ends_at && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.ends_at}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Radio Pilihan Format Acara (OFFLINE vs ONLINE) */}
                    <div className="space-y-2">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Format Penyelenggaraan Acara <span className="text-red-500">*</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                                htmlFor="type-offline"
                                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                                    formData.event_type === 'OFFLINE'
                                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/15'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    id="type-offline"
                                    type="radio"
                                    name="event_type"
                                    value="OFFLINE"
                                    checked={formData.event_type === 'OFFLINE'}
                                    onChange={() => updateField('event_type', 'OFFLINE')}
                                    className="mt-1 size-4 accent-blue-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        <MapPin className="size-4 text-blue-600" />
                                        Event Offline (Lokasi Fisik / Venue)
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        Peserta hadir langsung di lokasi gedung, hall, stadion, atau venue acara.
                                    </span>
                                </div>
                            </label>

                            <label
                                htmlFor="type-online"
                                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                                    formData.event_type === 'ONLINE'
                                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/15'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    id="type-online"
                                    type="radio"
                                    name="event_type"
                                    value="ONLINE"
                                    checked={formData.event_type === 'ONLINE'}
                                    onChange={() => updateField('event_type', 'ONLINE')}
                                    className="mt-1 size-4 accent-blue-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        <Globe className="size-4 text-indigo-600" />
                                        Event Online (Streaming / Webinar)
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        Acara diselenggarakan secara daring melalui Zoom, Google Meet, atau platform streaming.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {formData.event_type === 'OFFLINE' ? (
                        <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="event-city"
                                        className="block text-xs font-bold text-slate-700"
                                    >
                                        Kota / Kabupaten <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="event-city"
                                        name="city"
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="Contoh: Jakarta Selatan, Bandung, Surabaya"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                    />
                                    {errors.city && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            {errors.city}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="event-venue"
                                        className="block text-xs font-bold text-slate-700"
                                    >
                                        Nama Gedung / Venue <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="event-venue"
                                        name="venue_name"
                                        type="text"
                                        required
                                        value={formData.venue_name}
                                        onChange={(e) => updateField('venue_name', e.target.value)}
                                        placeholder="Contoh: ICE BSD Hall 1 / JCC Senayan"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                    />
                                    {errors.venue_name && (
                                        <p role="alert" className="text-xs font-medium text-red-600">
                                            {errors.venue_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="event-address"
                                    className="block text-xs font-bold text-slate-700"
                                >
                                    Alamat Lengkap Venue <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="event-address"
                                    name="address"
                                    rows={2}
                                    required
                                    autoComplete="street-address"
                                    value={formData.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    placeholder="Jl. Jend. Sudirman Kav. 52-53, Senayan, Kec. Kebayoran Baru..."
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                                />
                                {errors.address && (
                                    <p role="alert" className="text-xs font-medium text-red-600">
                                        {errors.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                            <label
                                htmlFor="event-online-url"
                                className="block text-xs font-bold text-slate-700"
                            >
                                Tautan Streaming / Ruangan Webinar <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="event-online-url"
                                name="online_url"
                                type="url"
                                required
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                value={formData.online_url}
                                onChange={(e) => updateField('online_url', e.target.value)}
                                placeholder="https://zoom.us/j/123456789 atau https://meet.google.com/..."
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                            />
                            <p className="text-[11px] text-slate-500">
                                Tautan ini akan disertakan pada E-Tiket peserta yang telah menyelesaikan pemesanan.
                            </p>
                            {errors.online_url && (
                                <p role="alert" className="text-xs font-medium text-red-600">
                                    {errors.online_url}
                                </p>
                            )}
                        </div>
                    )}
                </fieldset>

                {/* SECTION 3: Manajemen Jenis Tiket & Tier Harga (Fase 4) */}
                <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <legend className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <Ticket className="size-5 text-blue-600" />
                                3. Manajemen Jenis Tiket & Tier Harga
                            </legend>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tambahkan satu atau lebih kategori tiket (misal: Early Bird, Regular, VIP) beserta kuota dan periode penjualannya.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addTicketTier}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition self-start sm:self-auto"
                        >
                            <PlusCircle className="size-4" />
                            Tambah Jenis Tiket
                        </button>
                    </div>

                    {errors.tickets && (
                        <p role="alert" className="text-xs font-medium text-red-600">
                            {errors.tickets}
                        </p>
                    )}

                    <div className="space-y-4">
                        {formData.tickets.map((ticket, index) => {
                            const isFree = Number(ticket.price) === 0;
                            const soldCount = Number(ticket.sold_count || 0);

                            return (
                                <div
                                    key={ticket.id || `tier-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4"
                                >
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                {ticket.name || `Kategori Tiket #${index + 1}`}
                                            </h3>
                                            {soldCount > 0 && (
                                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                    {soldCount} Terjual
                                                </span>
                                            )}
                                        </div>

                                        {formData.tickets.length > 1 && soldCount === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTicketTier(index)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Hapus Tiket
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-1.5 sm:col-span-1">
                                            <label
                                                htmlFor={`ticket-name-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Nama Jenis Tiket <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id={`ticket-name-${index}`}
                                                type="text"
                                                required
                                                value={ticket.name}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'name', e.target.value)
                                                }
                                                placeholder="Contoh: Presale 1 / Regular / VIP"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                            {errors[`tickets.${index}.name`] && (
                                                <p role="alert" className="text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.name`]}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`ticket-tier-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Label Tier Harga
                                            </label>
                                            <input
                                                id={`ticket-tier-${index}`}
                                                type="text"
                                                value={ticket.price_tier_name}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'price_tier_name', e.target.value)
                                                }
                                                placeholder="Contoh: Early Bird / Harga Resmi"
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    htmlFor={`ticket-price-${index}`}
                                                    className="block text-xs font-bold text-slate-700"
                                                >
                                                    Harga Tiket (Rp) <span className="text-red-500">*</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTicketField(index, 'price', isFree ? 50000 : 0)
                                                    }
                                                    className="text-[11px] font-bold text-blue-600 hover:underline"
                                                >
                                                    {isFree ? 'Ubah ke Berbayar' : 'Set Tiket Gratis (Rp0)'}
                                                </button>
                                            </div>
                                            <input
                                                id={`ticket-price-${index}`}
                                                type="number"
                                                min={0}
                                                step="1000"
                                                required
                                                value={ticket.price}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'price', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                            {errors[`tickets.${index}.price`] && (
                                                <p role="alert" className="text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.price`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`ticket-quota-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Total Kuota Tiket <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id={`ticket-quota-${index}`}
                                                type="number"
                                                min={Math.max(1, soldCount)}
                                                required
                                                value={ticket.quota}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'quota', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                            {errors[`tickets.${index}.quota`] && (
                                                <p role="alert" className="text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.quota`]}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`ticket-max-order-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Maks. per Transaksi <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id={`ticket-max-order-${index}`}
                                                type="number"
                                                min={1}
                                                max={20}
                                                required
                                                value={ticket.max_per_order}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'max_per_order', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                            {errors[`tickets.${index}.max_per_order`] && (
                                                <p role="alert" className="text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.max_per_order`]}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`ticket-sale-start-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Mulai Penjualan (Opsional)
                                            </label>
                                            <input
                                                id={`ticket-sale-start-${index}`}
                                                type="datetime-local"
                                                value={ticket.sale_start}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'sale_start', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={`ticket-sale-end-${index}`}
                                                className="block text-xs font-bold text-slate-700"
                                            >
                                                Akhir Penjualan (Opsional)
                                            </label>
                                            <input
                                                id={`ticket-sale-end-${index}`}
                                                type="datetime-local"
                                                value={ticket.sale_end}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'sale_end', e.target.value)
                                                }
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                                            />
                                            {errors[`tickets.${index}.sale_end`] && (
                                                <p role="alert" className="text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.sale_end`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor={`ticket-desc-${index}`}
                                            className="block text-xs font-bold text-slate-700"
                                        >
                                            Benefit / Deskripsi Tiket
                                        </label>
                                        <input
                                            id={`ticket-desc-${index}`}
                                            type="text"
                                            value={ticket.description}
                                            onChange={(e) =>
                                                updateTicketField(index, 'description', e.target.value)
                                            }
                                            placeholder="Contoh: Termasuk akses penuh semua sesi, konsumsi makan siang, dan e-sertifikat."
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </fieldset>

                {/* Form Submission Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="text-xs text-slate-500">
                        <p className="font-bold text-slate-800">Alur Moderasi Event Hajirin</p>
                        <p className="mt-0.5">
                            Simpan sebagai <span className="font-semibold">Draft</span> jika masih ingin melengkapi nanti, atau{' '}
                            <span className="font-semibold">Ajukan ke Admin</span> agar event diverifikasi dan tayang publik.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                        <Link
                            href="/eo/dashboard"
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>

                        {(!isEdit || event?.status !== 'PUBLISHED') && (
                            <button
                                type="button"
                                disabled={processingAction !== null}
                                onClick={() => submitWithAction('DRAFT')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition"
                            >
                                <Save className="size-4 text-slate-600" />
                                {processingAction === 'DRAFT' ? 'Menyimpan Draft...' : 'Simpan sebagai Draft'}
                            </button>
                        )}

                        {isEdit && event?.status === 'PUBLISHED' ? (
                            <button
                                type="submit"
                                disabled={processingAction !== null}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 transition"
                            >
                                <CheckCircle2 className="size-4" />
                                {processingAction ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Event & Tiket'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processingAction !== null}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 transition"
                            >
                                <Send className="size-4" />
                                {processingAction === 'PENDING_REVIEW'
                                    ? 'Mengajukan ke Admin...'
                                    : 'Simpan & Ajukan Review ke Admin'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </EoLayout>
    );
}
