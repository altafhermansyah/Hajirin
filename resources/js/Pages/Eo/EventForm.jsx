import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import EoLayout from '../../Layouts/EoLayout';
import {
    Card,
    EoButton,
    eoButtonClass,
    StatusBadge,
} from '../../Components/eo/Primitives';
import {
    ArrowLeft,
    CheckCircle2,
    Image as ImageIcon,
    Plus,
    Save,
    Send,
    Trash2,
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

const EVENT_STATUS_LABELS = {
    PUBLISHED: { tone: 'success', label: 'Published (Tayang)' },
    PENDING_REVIEW: { tone: 'warning', label: 'Menunggu Review Admin' },
    REJECTED: { tone: 'danger', label: 'Perlu Revisi' },
    CANCELLED: { tone: 'danger', label: 'Dibatalkan' },
    DRAFT: { tone: 'neutral', label: 'Draft' },
};

const INPUT_CLASS =
    'mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15';

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

    const currentStatusInfo = isEdit
        ? EVENT_STATUS_LABELS[event.status] || EVENT_STATUS_LABELS.DRAFT
        : null;

    return (
        <EoLayout
            title={isEdit ? `Edit Event: ${event.title}` : 'Buat Event & Tiket Baru'}
            organizerName={organizerName}
        >
            {/* Header & Back Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <Link
                        href="/eo/events"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline mb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-xs"
                    >
                        <ArrowLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                        Kembali ke Event Saya
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {isEdit ? 'Edit Event & Jenis Tiket' : 'Buat Event & Konfigurasi Tiket'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Lengkapi detail acara, jadwal, lokasi, serta kategori tiket dan harga.
                    </p>
                </div>

                {isEdit && currentStatusInfo && (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-1.5 self-start sm:self-auto">
                        <StatusBadge
                            tone={currentStatusInfo.tone}
                            label={`Status: ${currentStatusInfo.label}`}
                            className="text-xs"
                        />
                    </div>
                )}
            </div>

            {/* Rejection Alert if Event was Rejected by Admin */}
            {isEdit && event?.status === 'REJECTED' && event?.rejection_reason && (
                <Card
                    role="alert"
                    className="flex items-start gap-3 p-4 sm:p-5 text-sm text-gray-900"
                >
                    <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="font-medium text-gray-900">
                            Catatan Revisi dari Moderator Admin
                        </p>
                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                            {event.rejection_reason}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-500">
                            Perbaiki informasi event atau tiket di bawah ini, lalu pilih{' '}
                            <span className="font-medium text-gray-900">
                                Simpan &amp; Ajukan Review ke Admin
                            </span>
                            .
                        </p>
                    </div>
                </Card>
            )}

            <form
                onSubmit={handleFormSubmit}
                action={isEdit ? `/eo/events/${event.id}` : '/eo/events'}
                method="POST"
                encType="multipart/form-data"
                className="space-y-6"
            >
                {/* SECTION 1: Informasi Dasar & Poster Event */}
                <fieldset className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <legend className="text-base font-semibold text-gray-900">
                            1. Informasi Dasar &amp; Poster Event
                        </legend>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Judul, kategori, deskripsi, serta gambar poster utama acara.
                        </p>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                        <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr]">
                            <div>
                                <label
                                    htmlFor="event-title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Judul event <span className="text-red-600">*</span>
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
                                    className={INPUT_CLASS}
                                />
                                <p id="event-title-help" className="mt-1 text-xs text-gray-500">
                                    Gunakan judul yang spesifik dan mudah ditemukan pengunjung.
                                </p>
                                {errors.title && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="event-category"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Kategori acara <span className="text-red-600">*</span>
                                </label>
                                <select
                                    id="event-category"
                                    name="category_id"
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => updateField('category_id', Number(e.target.value))}
                                    className={INPUT_CLASS}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.category_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="event-description"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Deskripsi lengkap acara <span className="text-red-600">*</span>
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
                                placeholder="Jelaskan rangkaian acara, pembicara atau bintang tamu, serta fasilitas peserta (minimal 20 karakter)..."
                                className={INPUT_CLASS}
                            />
                            <p id="event-description-help" className="mt-1 text-xs text-gray-500">
                                Minimal 20 karakter untuk menjelaskan rangkaian acara pada halaman publik.
                            </p>
                            {errors.description && (
                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="event-tnc"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Syarat &amp; ketentuan peserta
                                </label>
                                <textarea
                                    id="event-tnc"
                                    name="terms_and_conditions"
                                    rows={4}
                                    value={formData.terms_and_conditions}
                                    onChange={(e) => updateField('terms_and_conditions', e.target.value)}
                                    placeholder="Contoh: Peserta wajib membawa kartu identitas saat penukaran tiket..."
                                    className={INPUT_CLASS}
                                />
                                {errors.terms_and_conditions && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.terms_and_conditions}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="event-banner"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Poster / banner event
                                </label>
                                <div className="mt-1.5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                                    {bannerPreview ? (
                                        <img
                                            src={bannerPreview}
                                            alt="Preview Poster Event"
                                            className="h-24 w-36 rounded-md object-cover border border-gray-200 shrink-0 bg-gray-100"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400">
                                            <ImageIcon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                                        </div>
                                    )}
                                    <div className="space-y-1.5 text-xs text-gray-600 w-full">
                                        <input
                                            id="event-banner"
                                            name="banner"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={handleBannerChange}
                                            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer"
                                        />
                                        <p className="text-xs text-gray-500">
                                            JPG, PNG, atau WEBP (maks. 4 MB, rasio landscape 16:9).
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
                    </div>
                </fieldset>

                {/* SECTION 2: Waktu & Lokasi Penyelenggaraan */}
                <fieldset className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <legend className="text-base font-semibold text-gray-900">
                            2. Jadwal &amp; Lokasi Penyelenggaraan
                        </legend>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Tentukan waktu mulai, waktu selesai, serta format acara offline atau online.
                        </p>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                        {/* Jadwal Mulai & Selesai */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="event-starts-at"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Waktu mulai acara <span className="text-red-600">*</span>
                                </label>
                                <input
                                    id="event-starts-at"
                                    name="starts_at"
                                    type="datetime-local"
                                    required
                                    value={formData.starts_at}
                                    onChange={(e) => updateField('starts_at', e.target.value)}
                                    className={INPUT_CLASS}
                                />
                                {errors.starts_at && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.starts_at}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="event-ends-at"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Waktu selesai acara <span className="text-red-600">*</span>
                                </label>
                                <input
                                    id="event-ends-at"
                                    name="ends_at"
                                    type="datetime-local"
                                    required
                                    value={formData.ends_at}
                                    onChange={(e) => updateField('ends_at', e.target.value)}
                                    className={INPUT_CLASS}
                                />
                                {errors.ends_at && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.ends_at}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Radio Pilihan Format Acara (OFFLINE vs ONLINE) */}
                        <div>
                            <span className="block text-sm font-medium text-gray-700">
                                Format penyelenggaraan acara <span className="text-red-600">*</span>
                            </span>
                            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label
                                    htmlFor="type-offline"
                                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                                        formData.event_type === 'OFFLINE'
                                            ? 'border-blue-600 bg-white'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        id="type-offline"
                                        type="radio"
                                        name="event_type"
                                        value="OFFLINE"
                                        checked={formData.event_type === 'OFFLINE'}
                                        onChange={() => updateField('event_type', 'OFFLINE')}
                                        className="mt-0.5 size-4 accent-blue-600"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">
                                            Event Offline (Lokasi Fisik / Venue)
                                        </span>
                                        <span className="mt-0.5 block text-xs text-gray-500">
                                            Peserta hadir langsung di lokasi gedung, hall, stadion, atau venue acara.
                                        </span>
                                    </div>
                                </label>

                                <label
                                    htmlFor="type-online"
                                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                                        formData.event_type === 'ONLINE'
                                            ? 'border-blue-600 bg-white'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        id="type-online"
                                        type="radio"
                                        name="event_type"
                                        value="ONLINE"
                                        checked={formData.event_type === 'ONLINE'}
                                        onChange={() => updateField('event_type', 'ONLINE')}
                                        className="mt-0.5 size-4 accent-blue-600"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 block">
                                            Event Online (Streaming / Webinar)
                                        </span>
                                        <span className="mt-0.5 block text-xs text-gray-500">
                                            Acara diselenggarakan daring melalui Zoom, Google Meet, atau platform streaming.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {formData.event_type === 'OFFLINE' ? (
                            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="event-city"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Kota / kabupaten <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="event-city"
                                            name="city"
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            placeholder="Contoh: Jakarta Selatan, Bandung, Surabaya"
                                            className={INPUT_CLASS}
                                        />
                                        {errors.city && (
                                            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                {errors.city}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="event-venue"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Nama gedung / venue <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="event-venue"
                                            name="venue_name"
                                            type="text"
                                            required
                                            value={formData.venue_name}
                                            onChange={(e) => updateField('venue_name', e.target.value)}
                                            placeholder="Contoh: ICE BSD Hall 1 / JCC Senayan"
                                            className={INPUT_CLASS}
                                        />
                                        {errors.venue_name && (
                                            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                {errors.venue_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="event-address"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Alamat lengkap venue <span className="text-red-600">*</span>
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
                                        className={INPUT_CLASS}
                                    />
                                    {errors.address && (
                                        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                            {errors.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <label
                                    htmlFor="event-online-url"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Tautan streaming / ruangan webinar <span className="text-red-600">*</span>
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
                                    className={INPUT_CLASS}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Tautan ini akan disertakan pada E-Tiket peserta setelah pembayaran lunas.
                                </p>
                                {errors.online_url && (
                                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                        {errors.online_url}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* SECTION 3: Manajemen Jenis Tiket & Tier Harga */}
                <fieldset className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                        <div>
                            <legend className="text-base font-semibold text-gray-900">
                                3. Manajemen Jenis Tiket &amp; Tier Harga
                            </legend>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Tambahkan kategori tiket (mis. Early Bird, Regular, VIP), kuota, dan masa penjualan.
                            </p>
                        </div>

                        <EoButton
                            variant="outline"
                            size="md"
                            onClick={addTicketTier}
                            className="self-start sm:self-auto"
                        >
                            <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
                            Tambah Jenis Tiket
                        </EoButton>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4">
                        {errors.tickets && (
                            <p role="alert" className="text-xs font-medium text-red-600">
                                {errors.tickets}
                            </p>
                        )}

                        {formData.tickets.map((ticket, index) => {
                            const isFree = Number(ticket.price) === 0;
                            const soldCount = Number(ticket.sold_count || 0);

                            return (
                                <div
                                    key={ticket.id || `tier-${index}`}
                                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5 space-y-4"
                                >
                                    <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs font-medium text-gray-500 tabular-nums">
                                                #{index + 1}
                                            </span>
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {ticket.name || `Kategori Tiket ${index + 1}`}
                                            </h3>
                                            {soldCount > 0 && (
                                                <StatusBadge
                                                    tone="success"
                                                    label={`${soldCount} terjual`}
                                                    className="text-xs"
                                                />
                                            )}
                                        </div>

                                        {formData.tickets.length > 1 && soldCount === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTicketTier(index)}
                                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                                                Hapus Tiket
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <label
                                                htmlFor={`ticket-name-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Nama jenis tiket <span className="text-red-600">*</span>
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
                                                className={INPUT_CLASS}
                                            />
                                            {errors[`tickets.${index}.name`] && (
                                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.name`]}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`ticket-tier-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Label tier harga
                                            </label>
                                            <input
                                                id={`ticket-tier-${index}`}
                                                type="text"
                                                value={ticket.price_tier_name}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'price_tier_name', e.target.value)
                                                }
                                                placeholder="Contoh: Early Bird / Harga Resmi"
                                                className={INPUT_CLASS}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <label
                                                    htmlFor={`ticket-price-${index}`}
                                                    className="block text-xs font-medium text-gray-700"
                                                >
                                                    Harga tiket (Rp) <span className="text-red-600">*</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTicketField(index, 'price', isFree ? 50000 : 0)
                                                    }
                                                    className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                                                >
                                                    {isFree ? 'Ubah ke Berbayar' : 'Set Tiket Gratis'}
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
                                                className={`${INPUT_CLASS} tabular-nums font-medium`}
                                            />
                                            {errors[`tickets.${index}.price`] && (
                                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.price`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-4">
                                        <div>
                                            <label
                                                htmlFor={`ticket-quota-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Total kuota tiket <span className="text-red-600">*</span>
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
                                                className={`${INPUT_CLASS} tabular-nums`}
                                            />
                                            {errors[`tickets.${index}.quota`] && (
                                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.quota`]}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`ticket-max-order-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Maks. per transaksi <span className="text-red-600">*</span>
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
                                                className={`${INPUT_CLASS} tabular-nums`}
                                            />
                                            {errors[`tickets.${index}.max_per_order`] && (
                                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.max_per_order`]}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`ticket-sale-start-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Mulai penjualan
                                            </label>
                                            <input
                                                id={`ticket-sale-start-${index}`}
                                                type="datetime-local"
                                                value={ticket.sale_start}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'sale_start', e.target.value)
                                                }
                                                className={INPUT_CLASS}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor={`ticket-sale-end-${index}`}
                                                className="block text-xs font-medium text-gray-700"
                                            >
                                                Akhir penjualan
                                            </label>
                                            <input
                                                id={`ticket-sale-end-${index}`}
                                                type="datetime-local"
                                                value={ticket.sale_end}
                                                onChange={(e) =>
                                                    updateTicketField(index, 'sale_end', e.target.value)
                                                }
                                                className={INPUT_CLASS}
                                            />
                                            {errors[`tickets.${index}.sale_end`] && (
                                                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                                                    {errors[`tickets.${index}.sale_end`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`ticket-desc-${index}`}
                                            className="block text-xs font-medium text-gray-700"
                                        >
                                            Benefit / deskripsi tiket
                                        </label>
                                        <input
                                            id={`ticket-desc-${index}`}
                                            type="text"
                                            value={ticket.description}
                                            onChange={(e) =>
                                                updateTicketField(index, 'description', e.target.value)
                                            }
                                            placeholder="Contoh: Termasuk akses penuh semua sesi dan e-sertifikat."
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </fieldset>

                {/* Form Submission Bar */}
                <Card className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5">
                    <div className="text-xs text-gray-500">
                        <p className="font-medium text-gray-900">Alur Moderasi Event</p>
                        <p className="mt-0.5">
                            Simpan sebagai Draft atau langsung Ajukan Review ke Admin untuk tayang di katalog publik.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        <Link
                            href="/eo/events"
                            className={eoButtonClass('outline', 'md')}
                        >
                            Batal
                        </Link>

                        {(!isEdit || event?.status !== 'PUBLISHED') && (
                            <EoButton
                                variant="outline"
                                size="md"
                                disabled={processingAction !== null}
                                onClick={() => submitWithAction('DRAFT')}
                            >
                                <Save className="size-4 text-gray-500" strokeWidth={1.75} aria-hidden="true" />
                                {processingAction === 'DRAFT' ? 'Menyimpan Draft...' : 'Simpan sebagai Draft'}
                            </EoButton>
                        )}

                        {isEdit && event?.status === 'PUBLISHED' ? (
                            <EoButton
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={processingAction !== null}
                            >
                                <CheckCircle2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                                {processingAction ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                            </EoButton>
                        ) : (
                            <EoButton
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={processingAction !== null}
                            >
                                <Send className="size-4" strokeWidth={1.75} aria-hidden="true" />
                                {processingAction === 'PENDING_REVIEW'
                                    ? 'Mengajukan ke Admin...'
                                    : 'Simpan & Ajukan Review'}
                            </EoButton>
                        )}
                    </div>
                </Card>
            </form>
        </EoLayout>
    );
}
