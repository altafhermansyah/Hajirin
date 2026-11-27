import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    CalendarDays,
    MapPin,
    Share2,
    Bookmark,
    Info,
    Ticket,
    ChevronRight,
    Clock,
    ShieldCheck,
    Globe,
    ExternalLink,
    CheckCircle2,
    Users,
    Minus,
    Plus,
    Copy,
    Award,
    Coffee,
    FileText,
    CheckCircle,
} from 'lucide-react';
import AuthModal from '../../Components/Auth/AuthModal';
import UserLayout from '../../Layouts/UserLayout';
import { Card } from '../../Components/ui/Card';
import { Avatar } from '../../Components/ui/Avatar';
import { StatusBadge, NeutralTag } from '../../Components/ui/StatusBadge';
import { UnderlineTabs } from '../../Components/ui/UnderlineTabs';
import { Button, buttonClass } from '../../Components/ui/Button';

export default function EventDetail({
    auth,
    eventSlug,
    eventData,
    relatedEvents = [],
    isBookmarked: initialBookmarked,
}) {
    const [selectedTickets, setSelectedTickets] = useState({});
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked || false);
    const [toastMessage, setToastMessage] = useState('');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('deskripsi');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');

    useEffect(() => {
        setIsBookmarked(initialBookmarked || false);
    }, [initialBookmarked]);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const handleToggleBookmark = () => {
        if (!auth?.user) {
            setAuthView('login');
            setIsAuthModalOpen(true);
            showToast('Silakan masuk atau daftar terlebih dahulu untuk menandai event.');
            return;
        }

        const next = !isBookmarked;
        setIsBookmarked(next);

        router.post(
            `/events/${eventData?.id || eventSlug}/bookmark`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(
                        next
                            ? 'Event berhasil disimpan ke profil kamu.'
                            : 'Event dihapus dari simpanan.'
                    );
                },
                onError: () => {
                    setIsBookmarked(!next);
                    showToast('Gagal memperbarui status simpanan event.');
                },
            }
        );
    };

    if (!eventData) {
        return (
            <UserLayout
                auth={auth}
                onOpenAuthModal={(view) => {
                    setAuthView(view);
                    setIsAuthModalOpen(true);
                }}
                className="bg-white text-slate-900"
            >
                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 flex items-center justify-center px-6 py-16"
                >
                    <div className="w-full max-w-md">
                        <p className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
                            404
                        </p>
                        <h1 className="mt-3 text-xl font-semibold text-slate-900">
                            Event Tidak Ditemukan
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            Event yang kamu cari mungkin sudah berakhir, dihapus, atau tautan yang diakses tidak valid.
                        </p>
                        <div className="mt-6">
                            <Link href="/" className={buttonClass('primary', 'md')}>
                                Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </main>
            </UserLayout>
        );
    }

    const event = eventData;

    const handleCopyLink = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            showToast('Tautan event berhasil disalin ke clipboard.');
        } else {
            showToast('Tautan: ' + window.location.href);
        }
        setShowShareMenu(false);
    };

    const handleShareWhatsapp = () => {
        const text = encodeURIComponent(
            `Yuk ikut acara ini: ${event.title}\nCek detail tiketnya di: ${window.location.href}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        setShowShareMenu(false);
    };

    const handleSetTicketQuantity = (ticket, qty) => {
        if (ticket.status === 'Habis') return;
        const limitPerOrder = ticket.maxPerOrder || 10;
        const maxQuota = Math.min(ticket.quota || limitPerOrder, limitPerOrder);
        const validQty = Math.max(0, Math.min(qty, maxQuota));
        setSelectedTickets((prev) => {
            const next = { ...prev };
            if (validQty > 0) {
                next[ticket.id] = validQty;
            } else {
                delete next[ticket.id];
            }
            return next;
        });
    };

    const selectedList = (event?.tickets || []).filter((t) => (selectedTickets[t.id] || 0) > 0);
    const totalSelectedTicketsCount = selectedList.reduce(
        (acc, t) => acc + (selectedTickets[t.id] || 0),
        0
    );
    const totalSubtotal = selectedList.reduce(
        (acc, t) => acc + (t.rawPrice || 0) * (selectedTickets[t.id] || 0),
        0
    );

    const firstSelected = selectedList[0] || null;
    const checkoutItems = selectedList.map((t) => ({
        ticket_id: t.id,
        ticket_type_id: t.id,
        price_id: t.priceId || '',
        quantity: selectedTickets[t.id],
        qty: selectedTickets[t.id],
    }));

    const formatCurrency = (amount) =>
        amount > 0 ? 'Rp' + Number(amount).toLocaleString('id-ID') : 'Gratis';

    const scrollToSection = (id, tabName) => {
        setActiveTab(tabName);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getGoogleMapsUrl = () => {
        const query = encodeURIComponent(`${event.location}, ${event.fullAddress}`);
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    const handleProceedCheckout = (e) => {
        if (!auth?.user) {
            e.preventDefault();
            setAuthView('login');
            setIsAuthModalOpen(true);
            showToast(
                'Silakan masuk atau daftar terlebih dahulu untuk melanjutkan pemesanan tiket.'
            );
        }
    };

    const checkoutUrl =
        totalSelectedTicketsCount > 0
            ? `/checkout?event=${encodeURIComponent(eventSlug)}&ticket_id=${encodeURIComponent(firstSelected?.id || '')}&price_id=${encodeURIComponent(firstSelected?.priceId || '')}&qty=${selectedTickets[firstSelected?.id] || 1}&items=${encodeURIComponent(JSON.stringify(checkoutItems))}`
            : '#pilih-tiket';

    const sectionTabItems = [
        ['deskripsi', 'Deskripsi'],
        ['lokasi', 'Lokasi & Waktu'],
        ['syarat', 'Syarat & Ketentuan'],
        ['tiket', 'Pilihan Tiket'],
    ];

    const sectionAnchors = {
        deskripsi: 'deskripsi',
        lokasi: 'lokasi',
        syarat: 'syarat',
        tiket: 'pilih-tiket',
    };

    return (
        <>
            <Head title={`${event.title} - Hajirin`} />

            {toastMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 lg:bottom-6 z-50 flex items-center gap-2.5 rounded-lg bg-navy text-white px-4 py-3 shadow-lg border border-slate-700"
                >
                    <CheckCircle className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-medium">{toastMessage}</span>
                </div>
            )}

            <UserLayout
                auth={auth}
                showBottomNav={false}
                onOpenAuthModal={(view) => {
                    setAuthView(view);
                    setIsAuthModalOpen(true);
                }}
                className="bg-slate-50 text-slate-900"
            >

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12"
                >
                    {/* Breadcrumbs */}
                    <nav
                        aria-label="Breadcrumb"
                        className="text-xs text-slate-500 mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap"
                    >
                        <Link href="/" className="hover:text-brand-blue transition">
                            Beranda
                        </Link>
                        <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <Link href="/kategori" className="hover:text-brand-blue transition">
                            Kategori
                        </Link>
                        <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <Link
                            href={`/kategori/${event.category_slug || event.category.toLowerCase()}`}
                            className="hover:text-brand-blue transition"
                        >
                            {event.category}
                        </Link>
                        <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="font-medium text-slate-900 truncate max-w-[240px] sm:max-w-none">
                            {event.title}
                        </span>
                    </nav>

                    {/* Main Layout: 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* Left Column (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Banner & Actions */}
                            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
                                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        fetchPriority="high"
                                        decoding="async"
                                        className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                                    <span className="rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-900 backdrop-blur-xs">
                                        {event.category}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-navy/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
                                        {event.event_type === 'ONLINE' ? (
                                            <>
                                                <Globe className="size-3.5" aria-hidden="true" />
                                                Acara Online
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="size-3.5" aria-hidden="true" />
                                                Acara Offline
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowShareMenu(!showShareMenu)}
                                            aria-label="Bagikan Event"
                                            className="flex size-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/95 text-slate-700 hover:bg-white transition backdrop-blur-xs cursor-pointer"
                                            title="Bagikan Event"
                                        >
                                            <Share2 className="size-4" aria-hidden="true" />
                                        </button>
                                        {showShareMenu && (
                                            <div className="absolute right-0 top-11 z-30 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                                                <button
                                                    type="button"
                                                    onClick={handleCopyLink}
                                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                                                >
                                                    <Copy className="size-3.5 text-slate-400" aria-hidden="true" />
                                                    Salin Tautan
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleShareWhatsapp}
                                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                                                >
                                                    <Share2 className="size-3.5 text-slate-400" aria-hidden="true" />
                                                    Kirim WhatsApp
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleBookmark}
                                        aria-label={
                                            isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Event'
                                        }
                                        aria-pressed={isBookmarked}
                                        className={`flex size-9 items-center justify-center rounded-lg border transition backdrop-blur-xs cursor-pointer ${
                                            isBookmarked
                                                ? 'border-brand-blue bg-brand-blue text-white'
                                                : 'border-slate-200/80 bg-white/95 text-slate-700 hover:bg-white'
                                        }`}
                                        title={
                                            isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Event'
                                        }
                                    >
                                        <Bookmark
                                            className="size-4"
                                            fill={isBookmarked ? 'currentColor' : 'none'}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Event Title & Organizer Info */}
                            <Card className="p-6 sm:p-7">
                                <h1 className="text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-slate-900 mb-5">
                                    {event.title}
                                </h1>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                            <CalendarDays className="size-4" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Tanggal & Hari</p>
                                            <p className="text-sm font-medium text-slate-900 mt-0.5 tabular-nums">
                                                {event.date}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                            <Clock className="size-4" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Waktu Pelaksanaan</p>
                                            <p className="text-sm font-medium text-slate-900 mt-0.5 tabular-nums">
                                                {event.time}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                            <MapPin className="size-4" aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-500">Lokasi Event</p>
                                            <p className="text-sm font-medium text-slate-900 mt-0.5 line-clamp-1">
                                                {event.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            name={event.organizer || 'EO'}
                                            src={event.organizer_avatar}
                                            size="md"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                                <span>{event.organizer}</span>
                                                <CheckCircle2
                                                    className="size-3.5 text-brand-blue shrink-0"
                                                    aria-label="Penyelenggara terverifikasi"
                                                />
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Penyelenggara Resmi di Hajirin
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Harga Tiket</p>
                                        <p className="text-lg font-semibold text-slate-900 tabular-nums">
                                            {event.price}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Section Tabs */}
                            <Card className="overflow-hidden">
                                <UnderlineTabs
                                    items={sectionTabItems}
                                    activeKey={activeTab}
                                    onChange={(key) => scrollToSection(sectionAnchors[key], key)}
                                    className="border-b-0"
                                />
                            </Card>

                            {/* Description */}
                            <Card as="section" id="deskripsi" className="p-6 sm:p-7 scroll-mt-24">
                                <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-900">
                                    <Info className="size-4 text-slate-400" aria-hidden="true" />
                                    <span>Deskripsi Acara</span>
                                </h2>
                                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                    {event.description}
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                                        Fasilitas yang Didapat
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                                            <Award className="size-4 text-slate-500 shrink-0" aria-hidden="true" />
                                            <span className="text-xs font-medium text-slate-700">
                                                E-Sertifikat
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                                            <Coffee className="size-4 text-slate-500 shrink-0" aria-hidden="true" />
                                            <span className="text-xs font-medium text-slate-700">
                                                Snack / Coffee
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                                            <FileText className="size-4 text-slate-500 shrink-0" aria-hidden="true" />
                                            <span className="text-xs font-medium text-slate-700">
                                                Materi Pembicara
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                                            <Users className="size-4 text-slate-500 shrink-0" aria-hidden="true" />
                                            <span className="text-xs font-medium text-slate-700">
                                                Akses Networking
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Location & Venue */}
                            <Card as="section" id="lokasi" className="p-6 sm:p-7 scroll-mt-24">
                                <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-900">
                                    <MapPin className="size-4 text-slate-400" aria-hidden="true" />
                                    <span>Lokasi & Waktu Acara</span>
                                </h2>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                        Gedung / Tempat
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {event.location}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {event.fullAddress}
                                    </p>

                                    {event.event_type === 'OFFLINE' ? (
                                        <div className="mt-4">
                                            <a
                                                href={getGoogleMapsUrl()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={buttonClass('outline', 'sm')}
                                            >
                                                <ExternalLink className="size-3.5 text-slate-500" aria-hidden="true" />
                                                <span>Buka di Google Maps</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                                            <Globe className="size-4 text-brand-blue shrink-0" aria-hidden="true" />
                                            <span>
                                                Tautan streaming / webinar akan diberikan pada e-tiket setelah konfirmasi pemesanan.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Terms & Conditions */}
                            <Card as="section" id="syarat" className="p-6 sm:p-7 scroll-mt-24">
                                <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-900">
                                    <ShieldCheck className="size-4 text-slate-400" aria-hidden="true" />
                                    <span>Syarat & Ketentuan</span>
                                </h2>
                                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                                    {event.terms &&
                                        event.terms.map((term, index) => (
                                            <li key={index} className="flex items-start gap-2.5">
                                                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-600 mt-0.5 tabular-nums">
                                                    {index + 1}
                                                </span>
                                                <span className="leading-relaxed">{term}</span>
                                            </li>
                                        ))}
                                </ol>
                            </Card>

                            {/* Ticket Selection (Urutan Paling Bawah Sebelum Pembayaran) */}
                            <Card as="section" id="pilih-tiket" className="p-6 sm:p-7 scroll-mt-24">
                                <div className="flex items-center justify-between gap-3 mb-5">
                                    <div>
                                        <h2 className="text-base font-semibold flex items-center gap-2 text-slate-900">
                                            <Ticket className="size-4 text-slate-400" aria-hidden="true" />
                                            <span>Pilih Tiket</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Pilih jenis dan jumlah tiket yang diinginkan (bisa memilih lebih dari satu jenis).
                                        </p>
                                    </div>
                                    {totalSelectedTicketsCount > 0 && (
                                        <NeutralTag className="hidden sm:inline-flex tabular-nums">
                                            {totalSelectedTicketsCount} Tiket ({selectedList.length} Jenis)
                                        </NeutralTag>
                                    )}
                                </div>

                                <div className="space-y-3.5">
                                    {event.tickets && event.tickets.length > 0 ? (
                                        event.tickets.map((ticket) => {
                                            const isHabis = ticket.status === 'Habis';
                                            const currentQty = selectedTickets[ticket.id] || 0;
                                            const isSelected = currentQty > 0;
                                            const limitPerOrder = ticket.maxPerOrder || 10;
                                            const maxQuota = Math.min(
                                                ticket.quota || limitPerOrder,
                                                limitPerOrder
                                            );

                                            return (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() =>
                                                        !isHabis &&
                                                        currentQty === 0 &&
                                                        handleSetTicketQuantity(ticket, 1)
                                                    }
                                                    className={`relative border rounded-xl p-5 transition ${
                                                        isHabis
                                                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                                            : isSelected
                                                              ? 'bg-blue-50/30 border-brand-blue ring-1 ring-brand-blue/30'
                                                              : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                                                <h3 className="font-semibold text-base text-slate-900">
                                                                    {ticket.name}
                                                                </h3>
                                                                <StatusBadge
                                                                    tone={isHabis ? 'danger' : 'success'}
                                                                    label={isHabis ? 'Habis Terjual' : 'Tersedia'}
                                                                />
                                                                {ticket.quota > 0 &&
                                                                    ticket.quota <= 25 &&
                                                                    !isHabis && (
                                                                        <NeutralTag className="tabular-nums">
                                                                            Sisa {ticket.quota} kuota
                                                                        </NeutralTag>
                                                                    )}
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                                                {ticket.desc}
                                                            </p>
                                                        </div>

                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2 shrink-0">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-xs text-slate-500">Harga</p>
                                                                <p className="text-lg font-semibold text-slate-900 tabular-nums">
                                                                    {ticket.price}
                                                                </p>
                                                            </div>

                                                            {isSelected ? (
                                                                <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 p-1">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Kurangi jumlah ${ticket.name}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSetTicketQuantity(
                                                                                ticket,
                                                                                currentQty - 1
                                                                            );
                                                                        }}
                                                                        className="flex size-11 sm:size-8 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                                                                    >
                                                                        <Minus className="size-4 sm:size-3.5" aria-hidden="true" />
                                                                    </button>
                                                                    <span className="w-7 text-center text-sm font-semibold text-slate-900 tabular-nums">
                                                                        {currentQty}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Tambah jumlah ${ticket.name}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSetTicketQuantity(
                                                                                ticket,
                                                                                currentQty + 1
                                                                            );
                                                                        }}
                                                                        disabled={currentQty >= maxQuota}
                                                                        className="flex size-11 sm:size-8 items-center justify-center rounded-md bg-brand-blue text-white hover:bg-blue-800 disabled:opacity-40 transition cursor-pointer"
                                                                    >
                                                                        <Plus className="size-4 sm:size-3.5" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={isHabis}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isHabis) {
                                                                            handleSetTicketQuantity(
                                                                                ticket,
                                                                                1
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {isHabis ? 'Habis' : '+ Pilih Tiket'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">
                                                                Subtotal untuk jenis tiket ini
                                                            </span>
                                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                                {formatCurrency(
                                                                    (ticket.rawPrice || 0) * currentQty
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            Informasi tiket untuk event ini belum dipublikasikan oleh penyelenggara.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Right Column (4 cols): Sticky Checkout Summary (Desktop only; mobile uses sticky bottom bar) */}
                        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
                            <Card className="p-6">
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                    Ringkasan Pemesanan
                                </p>
                                <h3 className="text-base font-semibold text-slate-900 line-clamp-2 leading-snug mb-4">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 pb-4 border-b border-slate-100 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
                                        <span className="truncate tabular-nums">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
                                        <span className="tabular-nums">{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-4 text-slate-400 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>

                                <div className="py-4 border-b border-slate-100 space-y-2">
                                    {selectedList.length > 0 ? (
                                        selectedList.map((t) => (
                                            <div
                                                key={t.id}
                                                className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 flex items-center justify-between gap-2"
                                            >
                                                <div>
                                                    <p className="text-xs font-medium text-slate-900">
                                                        {t.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 tabular-nums">
                                                        {t.price} x {selectedTickets[t.id]}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-semibold text-slate-900 tabular-nums">
                                                    {formatCurrency(
                                                        (t.rawPrice || 0) * selectedTickets[t.id]
                                                    )}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-2 text-xs text-slate-500">
                                            Belum ada tiket yang dipilih.
                                        </p>
                                    )}
                                </div>

                                <div className="py-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Subtotal ({totalSelectedTicketsCount} Tiket)</span>
                                        <span className="font-medium text-slate-900 tabular-nums">
                                            {totalSelectedTicketsCount > 0
                                                ? formatCurrency(totalSubtotal)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Biaya Layanan</span>
                                        <span className="font-medium text-slate-900">Gratis</span>
                                    </div>
                                    <div className="pt-2.5 flex items-baseline justify-between border-t border-slate-100">
                                        <span className="text-sm font-semibold text-slate-900">
                                            Total Bayar
                                        </span>
                                        <span className="text-xl font-semibold text-slate-900 tabular-nums">
                                            {totalSelectedTicketsCount > 0
                                                ? formatCurrency(totalSubtotal)
                                                : event.price}
                                        </span>
                                    </div>
                                </div>

                                {totalSelectedTicketsCount > 0 ? (
                                    <Link
                                        href={checkoutUrl}
                                        onClick={handleProceedCheckout}
                                        className={buttonClass('primary', 'lg', 'w-full')}
                                    >
                                        <span>
                                            Lanjut ke Pembayaran ({totalSelectedTicketsCount} Tiket)
                                        </span>
                                    </Link>
                                ) : (
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() => scrollToSection('pilih-tiket', 'tiket')}
                                    >
                                        <Ticket className="size-4" aria-hidden="true" />
                                        <span>Pilih Tiket Dulu</span>
                                    </Button>
                                )}

                                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                    <ShieldCheck
                                        className="size-3.5 text-slate-400 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span>Pemesanan aman &amp; jaminan e-tiket resmi</span>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Related Events */}
                    {relatedEvents && relatedEvents.length > 0 && (
                        <section className="mt-14 pt-8 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                                        Event Menarik Lainnya
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                        Jelajahi agenda pilihan lainnya di Hajirin
                                    </p>
                                </div>
                                <Link
                                    href="/kategori"
                                    className="text-xs sm:text-sm font-medium text-brand-blue hover:underline"
                                >
                                    Lihat Semua
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/event/${item.slug}`}
                                        className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition"
                                    >
                                        <div className="relative h-40 overflow-hidden bg-slate-100">
                                            <img
                                                src={item.image || '/images/events/tech_hero.webp'}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="text-xs font-medium text-brand-blue mb-1 tabular-nums">
                                                {item.date}
                                            </p>
                                            <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-brand-blue transition mb-2">
                                                {item.title}
                                            </h3>
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 mt-auto">
                                                <MapPin
                                                    className="size-3.5 text-slate-400 shrink-0"
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate">{item.place}</span>
                                            </p>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-500">Mulai dari</p>
                                                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                                        {item.price}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-brand-blue group-hover:underline">
                                                    Detail
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Mobile Sticky Bottom Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 pt-3 pb-safe flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-slate-500">
                            {totalSelectedTicketsCount > 0
                                ? `${totalSelectedTicketsCount} Tiket Dipilih`
                                : 'Harga Mulai'}
                        </p>
                        <p className="text-base font-semibold text-slate-900 tabular-nums">
                            {totalSelectedTicketsCount > 0
                                ? formatCurrency(totalSubtotal)
                                : event.price}
                        </p>
                    </div>

                    {totalSelectedTicketsCount > 0 ? (
                        <Link
                            href={checkoutUrl}
                            onClick={handleProceedCheckout}
                            className={buttonClass('primary', 'md')}
                        >
                            Lanjut Bayar
                        </Link>
                    ) : (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => scrollToSection('pilih-tiket', 'tiket')}
                        >
                            Pilih Tiket
                        </Button>
                    )}
                </div>

                <footer className="border-t border-slate-200 bg-white pt-6 pb-24 lg:py-6 px-4 sm:px-8 text-xs text-slate-400">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <img
                                src="/hajirin_icon.svg"
                                alt="Hajirin"
                                loading="lazy"
                                decoding="async"
                                className="h-5 w-auto"
                            />
                            <span className="font-semibold text-navy">HAJIRIN</span>
                            <span>- Platform Event &amp; Tiket Terpercaya</span>
                        </div>
                        <p>© 2026 Hajirin Indonesia. Seluruh hak cipta dilindungi.</p>
                    </div>
                </footer>
            </UserLayout>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialView={authView}
            />
        </>
    );
}
