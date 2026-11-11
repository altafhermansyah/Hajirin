import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CalendarDays, MapPin, Share2, Bookmark, Check,
    CircleUserRound, Info, Ticket, ChevronRight, Search,
    Clock, ShieldCheck, Globe, ExternalLink, CheckCircle2,
    Sparkles, ArrowRight, Minus, Plus, Building2, AlertCircle,
    Copy, Award, Coffee, FileText, CheckCircle
} from 'lucide-react';
import AuthModal from '../../Components/Auth/AuthModal';

export default function EventDetail({ auth, eventSlug, eventData, relatedEvents = [] }) {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('deskripsi');

    // Auth modal state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');

    if (!eventData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center font-sans">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                    <AlertCircle className="size-8" />
                </div>
                <h1 className="text-2xl font-bold text-navy mb-2">Event Tidak Ditemukan</h1>
                <p className="text-slate text-sm max-w-md mb-6">
                    Event yang kamu cari mungkin sudah berakhir, dihapus, atau tautan yang kamu akses tidak valid.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }

    const event = eventData;

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const handleCopyLink = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            showToast('Tautan event berhasil disalin ke clipboard!');
        } else {
            showToast('Tautan: ' + window.location.href);
        }
        setShowShareMenu(false);
    };

    const handleShareWhatsapp = () => {
        const text = encodeURIComponent(`Yuk ikut acara seru ini: ${event.title}\nCek detail tiketnya di: ${window.location.href}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        setShowShareMenu(false);
    };

    const handleSelectTicket = (ticket) => {
        if (ticket.status === 'Habis') return;
        setSelectedTicket(ticket);
        setTicketQuantity(1);
    };

    const handleQuantityChange = (delta) => {
        if (!selectedTicket) return;
        const newQty = ticketQuantity + delta;
        const maxQuota = selectedTicket.quota ? Math.min(selectedTicket.quota, 5) : 5;
        if (newQty >= 1 && newQty <= maxQuota) {
            setTicketQuantity(newQty);
        }
    };

    const calculateSubtotal = () => {
        if (!selectedTicket) return 0;
        return (selectedTicket.rawPrice || 0) * ticketQuantity;
    };

    const formatCurrency = (amount) => {
        return amount > 0
            ? 'Rp' + Number(amount).toLocaleString('id-ID')
            : 'Gratis';
    };

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
            showToast('Silakan masuk atau daftar terlebih dahulu untuk melanjutkan pemesanan tiket.');
        }
    };

    const checkoutUrl = selectedTicket
        ? `/checkout?event=${encodeURIComponent(eventSlug)}&ticket_id=${encodeURIComponent(selectedTicket.id)}&price_id=${encodeURIComponent(selectedTicket.priceId || '')}&ticket=${encodeURIComponent(selectedTicket.name)}&price=${encodeURIComponent(formatCurrency(calculateSubtotal()))}&qty=${ticketQuantity}`
        : '#pilih-tiket';

    return (
        <>
            <Head title={`${event.title} - Hajirin`} />

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-navy text-white px-5 py-3 shadow-2xl animate-fade-in border border-slate-700">
                    <CheckCircle className="size-5 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="bg-[#f8fafc] text-navy font-sans min-h-screen">
                {/* Navbar */}
                <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-8 lg:px-12">
                    <div className="flex items-center gap-6 sm:gap-10">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/hajirin_icon.svg" alt="Logo Hajirin" className="h-8 w-auto" />
                            <span className="text-2xl font-bold tracking-tighter text-navy">HAJIRIN</span>
                        </Link>
                        <div className="hidden gap-6 text-sm font-medium text-slate md:flex">
                            <Link href="/#event-unggulan" className="hover:text-brand-blue transition">Jelajah Event</Link>
                            <Link href="/kategori" className="hover:text-brand-blue transition">Kategori</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            href="/kategori"
                            className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-slate hover:bg-gray-100 sm:flex"
                        >
                            <Search className="size-3.5" />
                            <span>Cari Acara</span>
                        </Link>

                        {auth?.user ? (
                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-brand-blue">
                                    {auth.user.name.charAt(0)}
                                </span>
                                <Link href="/dashboard" className="hidden min-w-0 text-left sm:block">
                                    <p className="max-w-28 truncate text-xs font-bold leading-tight text-navy">{auth.user.name}</p>
                                    <p className="max-w-28 truncate text-[11px] text-slate">Dashboard</p>
                                </Link>
                                <span className="h-6 w-px bg-gray-200 hidden sm:block" />
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="text-xs font-medium text-slate hover:text-red-600 transition"
                                >
                                    Keluar
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setAuthView('login');
                                        setIsAuthModalOpen(true);
                                    }}
                                    className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:text-sm"
                                >
                                    Masuk
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthView('register');
                                        setIsAuthModalOpen(true);
                                    }}
                                    className="rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:text-sm"
                                >
                                    Daftar
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Breadcrumbs */}
                    <nav className="text-xs text-slate mb-6 flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
                        <Link href="/" className="hover:text-brand-blue transition">Beranda</Link>
                        <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
                        <Link href="/kategori" className="hover:text-brand-blue transition">Kategori</Link>
                        <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
                        <Link href={`/kategori/${event.category_slug || event.category.toLowerCase()}`} className="hover:text-brand-blue transition">
                            {event.category}
                        </Link>
                        <ChevronRight className="size-3.5 shrink-0 text-gray-400" />
                        <span className="font-semibold text-navy truncate max-w-[240px] sm:max-w-none">{event.title}</span>
                    </nav>

                    {/* Main Layout: 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column (8 cols): Media, Content, Tickets */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Banner & Badges */}
                            <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-md group">
                                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-200">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold tracking-wide uppercase text-navy shadow-sm backdrop-blur">
                                        {event.category}
                                    </span>
                                    <span className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide shadow-sm backdrop-blur ${
                                        event.event_type === 'ONLINE'
                                            ? 'bg-purple-600/90 text-white'
                                            : 'bg-emerald-600/90 text-white'
                                    }`}>
                                        {event.event_type === 'ONLINE' ? (
                                            <>
                                                <Globe className="size-3.5" /> Acara Online
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="size-3.5" /> Acara Offline
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowShareMenu(!showShareMenu)}
                                            className="flex size-9 items-center justify-center rounded-full bg-white/95 text-navy shadow-md hover:bg-white transition backdrop-blur"
                                            title="Bagikan Event"
                                        >
                                            <Share2 className="size-4" />
                                        </button>
                                        {showShareMenu && (
                                            <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-xl animate-scale-up">
                                                <button
                                                    onClick={handleCopyLink}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate hover:bg-blue-50 hover:text-brand-blue"
                                                >
                                                    <Copy className="size-3.5" /> Salin Tautan
                                                </button>
                                                <button
                                                    onClick={handleShareWhatsapp}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    <Share2 className="size-3.5" /> Kirim WhatsApp
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsBookmarked(!isBookmarked);
                                            showToast(isBookmarked ? 'Event dihapus dari simpanan.' : 'Event berhasil disimpan!');
                                        }}
                                        className={`flex size-9 items-center justify-center rounded-full shadow-md transition backdrop-blur ${
                                            isBookmarked
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-white/95 text-navy hover:bg-white'
                                        }`}
                                        title={isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Event'}
                                    >
                                        <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>

                            {/* Event Title & Organizer Info */}
                            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm">
                                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-navy mb-4">
                                    {event.title}
                                </h1>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                                            <CalendarDays className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate">Tanggal & Hari</p>
                                            <p className="text-sm font-bold text-navy mt-0.5">{event.date}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                                            <Clock className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate">Waktu Pelaksanaan</p>
                                            <p className="text-sm font-bold text-navy mt-0.5">{event.time}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate">Lokasi Event</p>
                                            <p className="text-sm font-bold text-navy mt-0.5 line-clamp-1">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold uppercase text-white shadow-sm">
                                            {event.organizer ? event.organizer.charAt(0) : 'E'}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold text-navy">{event.organizer}</p>
                                                <span className="flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    <CheckCircle2 className="size-3 mr-1" /> Terverifikasi
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate mt-0.5">Penyelenggara Resmi di Hajirin</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-slate">Harga Tiket</p>
                                        <p className="text-lg font-extrabold text-brand-blue">{event.price}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Navigation Tabs */}
                            <div className="flex border-b border-gray-200 bg-white rounded-xl px-2 py-1 shadow-sm overflow-x-auto">
                                {[
                                    { id: 'deskripsi', label: 'Deskripsi', anchor: 'deskripsi' },
                                    { id: 'tiket', label: 'Pilihan Tiket', anchor: 'pilih-tiket' },
                                    { id: 'lokasi', label: 'Lokasi & Waktu', anchor: 'lokasi' },
                                    { id: 'syarat', label: 'Syarat & Ketentuan', anchor: 'syarat' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => scrollToSection(tab.anchor, tab.id)}
                                        className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-lg transition ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 text-brand-blue'
                                                : 'text-slate hover:text-navy hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Section: Description */}
                            <section id="deskripsi" className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm scroll-mt-24">
                                <h2 className="text-xl font-bold mb-4 flex items-center text-navy">
                                    <Info className="mr-2.5 size-5 text-brand-blue" />
                                    Deskripsi Acara
                                </h2>
                                <div className="text-slate text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                    {event.description}
                                </div>

                                {/* Event Facilities / Perks */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">Fasilitas yang Didapat</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 border border-gray-100">
                                            <Award className="size-4 text-brand-blue shrink-0" />
                                            <span className="text-xs font-semibold text-slate">E-Sertifikat</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 border border-gray-100">
                                            <Coffee className="size-4 text-brand-blue shrink-0" />
                                            <span className="text-xs font-semibold text-slate">Snack / Coffee</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 border border-gray-100">
                                            <FileText className="size-4 text-brand-blue shrink-0" />
                                            <span className="text-xs font-semibold text-slate">Materi Pembicara</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 border border-gray-100">
                                            <Sparkles className="size-4 text-brand-blue shrink-0" />
                                            <span className="text-xs font-semibold text-slate">Akses Networking</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Ticket Selection */}
                            <section id="pilih-tiket" className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm scroll-mt-24">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center text-navy">
                                            <Ticket className="mr-2.5 size-5 text-brand-blue" />
                                            Pilih Tiket
                                        </h2>
                                        <p className="text-xs text-slate mt-1">Pilih kategori tiket yang sesuai untuk melanjutkan pemesanan.</p>
                                    </div>
                                    {selectedTicket && (
                                        <span className="hidden sm:inline-flex text-xs font-semibold text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                            1 Tiket Terpilih
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {event.tickets && event.tickets.length > 0 ? (
                                        event.tickets.map((ticket) => {
                                            const isHabis = ticket.status === 'Habis';
                                            const isSelected = selectedTicket?.id === ticket.id;

                                            return (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => !isHabis && handleSelectTicket(ticket)}
                                                    className={`relative border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
                                                        isHabis
                                                            ? 'bg-gray-50/80 border-gray-200 opacity-60 cursor-not-allowed'
                                                            : isSelected
                                                            ? 'bg-blue-50/40 border-brand-blue ring-2 ring-brand-blue/30 shadow-md cursor-pointer'
                                                            : 'bg-white border-gray-200 hover:border-brand-blue/60 hover:shadow-sm cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <h3 className={`font-bold text-lg ${isSelected ? 'text-brand-blue' : 'text-navy'}`}>
                                                                    {ticket.name}
                                                                </h3>
                                                                {isHabis ? (
                                                                    <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                                        Habis Terjual
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                                        <Check className="size-3" /> Tersedia
                                                                    </span>
                                                                )}
                                                                {ticket.quota > 0 && ticket.quota <= 25 && !isHabis && (
                                                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                        Sisa {ticket.quota} Kuota!
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-slate leading-relaxed">{ticket.desc}</p>
                                                        </div>

                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-xs text-slate">Harga</p>
                                                                <p className="text-xl font-extrabold text-brand-blue">{ticket.price}</p>
                                                            </div>

                                                            <div className="mt-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={isHabis}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!isHabis) handleSelectTicket(ticket);
                                                                    }}
                                                                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                                                                        isHabis
                                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                            : isSelected
                                                                            ? 'bg-brand-blue text-white shadow-sm'
                                                                            : 'bg-white border border-brand-blue text-brand-blue hover:bg-blue-50'
                                                                    }`}
                                                                >
                                                                    {isHabis ? 'Habis' : isSelected ? 'Tiket Dipilih' : 'Pilih Tiket'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quantity adjustment if selected */}
                                                    {isSelected && !isHabis && (
                                                        <div className="mt-4 pt-4 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3">
                                                            <p className="text-xs font-semibold text-slate">
                                                                Jumlah Tiket (Maks. {Math.min(ticket.quota || 5, 5)} per transaksi):
                                                            </p>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleQuantityChange(-1);
                                                                    }}
                                                                    disabled={ticketQuantity <= 1}
                                                                    className="flex size-7 items-center justify-center rounded-lg border border-gray-300 bg-white text-navy hover:bg-gray-100 disabled:opacity-40 transition"
                                                                >
                                                                    <Minus className="size-3.5" />
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-bold text-navy">
                                                                    {ticketQuantity}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleQuantityChange(1);
                                                                    }}
                                                                    disabled={ticketQuantity >= Math.min(ticket.quota || 5, 5)}
                                                                    className="flex size-7 items-center justify-center rounded-lg border border-gray-300 bg-white text-navy hover:bg-gray-100 disabled:opacity-40 transition"
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-slate text-sm">
                                            Informasi tiket untuk event ini belum dipublikasikan oleh penyelenggara.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Section: Location & Venue */}
                            <section id="lokasi" className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm scroll-mt-24">
                                <h2 className="text-xl font-bold mb-4 flex items-center text-navy">
                                    <MapPin className="mr-2.5 size-5 text-brand-blue" />
                                    Lokasi & Waktu Acara
                                </h2>

                                <div className="space-y-4">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-1">Gedung / Tempat</p>
                                        <p className="text-base font-bold text-navy">{event.location}</p>
                                        <p className="text-xs sm:text-sm text-slate mt-1">{event.fullAddress}</p>

                                        {event.event_type === 'OFFLINE' ? (
                                            <div className="mt-4">
                                                <a
                                                    href={getGoogleMapsUrl()}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-300 px-3.5 py-2 text-xs font-semibold text-navy shadow-sm hover:bg-gray-50 transition"
                                                >
                                                    <ExternalLink className="size-3.5 text-brand-blue" />
                                                    Buka di Google Maps
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                <Globe className="size-4 shrink-0" />
                                                <span>Tautan streaming / webinar akan diberikan di e-tiket setelah konfirmasi pemesanan.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Section: Terms and Conditions */}
                            <section id="syarat" className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-sm scroll-mt-24">
                                <h2 className="text-xl font-bold mb-4 flex items-center text-navy">
                                    <ShieldCheck className="mr-2.5 size-5 text-brand-blue" />
                                    Syarat & Ketentuan
                                </h2>
                                <ul className="space-y-2.5 text-xs sm:text-sm text-slate">
                                    {event.terms && event.terms.map((term, index) => (
                                        <li key={index} className="flex items-start gap-2.5">
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-brand-blue mt-0.5">
                                                {index + 1}
                                            </span>
                                            <span className="leading-relaxed">{term}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Right Column (4 cols): Sticky Checkout Card on Desktop */}
                        <div className="lg:col-span-4 sticky top-24 space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">
                                <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Ringkasan Pemesanan</p>
                                <h3 className="text-base font-bold text-navy line-clamp-2 leading-snug mb-4">
                                    {event.title}
                                </h3>

                                <div className="space-y-2.5 pb-4 border-b border-gray-100 text-xs text-slate">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="size-4 text-brand-blue shrink-0" />
                                        <span className="truncate">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-brand-blue shrink-0" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-4 text-brand-blue shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>

                                {/* Selected ticket summary */}
                                <div className="py-4 border-b border-gray-100">
                                    {selectedTicket ? (
                                        <div className="rounded-xl bg-blue-50/60 p-3.5 border border-blue-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-navy">{selectedTicket.name}</p>
                                                <span className="text-xs font-semibold text-brand-blue">
                                                    {ticketQuantity}x
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-xs text-slate">
                                                <span>Harga satuan</span>
                                                <span>{selectedTicket.price}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2 text-xs text-slate">
                                            Belum ada tiket yang dipilih.
                                        </div>
                                    )}
                                </div>

                                {/* Price Calculation */}
                                <div className="py-4 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-slate">
                                        <span>Subtotal Tiket</span>
                                        <span className="font-semibold text-navy">
                                            {selectedTicket ? formatCurrency(calculateSubtotal()) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate">
                                        <span>Biaya Layanan</span>
                                        <span className="font-semibold text-emerald-600">Gratis</span>
                                    </div>
                                    <div className="pt-2 flex items-baseline justify-between border-t border-gray-100">
                                        <span className="text-sm font-bold text-navy">Total Bayar</span>
                                        <span className="text-2xl font-extrabold text-brand-blue">
                                            {selectedTicket ? formatCurrency(calculateSubtotal()) : event.price}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {selectedTicket ? (
                                    <Link
                                        href={checkoutUrl}
                                        onClick={handleProceedCheckout}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition duration-150"
                                    >
                                        <span>Lanjut ke Pembayaran</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection('pilih-tiket', 'tiket')}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition duration-150"
                                    >
                                        <Ticket className="size-4" />
                                        <span>Pilih Tiket Dulu</span>
                                    </button>
                                )}

                                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate">
                                    <ShieldCheck className="size-3.5 text-emerald-600" />
                                    <span>Pemesanan aman & dilindungi jaminan tiket asli</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related / Other Events Recommendation */}
                    {relatedEvents && relatedEvents.length > 0 && (
                        <section className="mt-16 pt-10 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-navy">Event Menarik Lainnya</h2>
                                    <p className="text-xs sm:text-sm text-slate mt-1">Jelajahi berbagai agenda pilihan lainnya di Hajirin</p>
                                </div>
                                <Link
                                    href="/kategori"
                                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-blue hover:underline"
                                >
                                    Lihat Semua <ArrowRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/event/${item.slug}`}
                                        className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="relative h-40 overflow-hidden bg-gray-100">
                                            <img
                                                src={item.image || '/images/events/tech_hero.jpg'}
                                                alt={item.title}
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-navy shadow-sm uppercase backdrop-blur">
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="text-[11px] font-semibold text-slate mb-1">{item.date}</p>
                                            <h3 className="font-bold text-sm text-navy line-clamp-2 group-hover:text-brand-blue transition mb-2">
                                                {item.title}
                                            </h3>
                                            <p className="flex items-center text-xs text-slate mb-4 mt-auto">
                                                <MapPin className="mr-1 size-3 text-gray-400 shrink-0" />
                                                <span className="truncate">{item.place}</span>
                                            </p>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div>
                                                    <p className="text-[10px] text-slate">Mulai Dari</p>
                                                    <p className="text-sm font-bold text-brand-blue">{item.price}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-brand-blue group-hover:underline">
                                                    Detail →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Mobile Sticky Bottom Bar (Visible on mobile only) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate">
                            {selectedTicket ? `${selectedTicket.name} (${ticketQuantity}x)` : 'Harga Mulai'}
                        </p>
                        <p className="text-lg font-bold text-brand-blue">
                            {selectedTicket ? formatCurrency(calculateSubtotal()) : event.price}
                        </p>
                    </div>

                    {selectedTicket ? (
                        <Link
                            href={checkoutUrl}
                            onClick={handleProceedCheckout}
                            className="rounded-xl bg-brand-blue px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800 transition"
                        >
                            Lanjut Bayar
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => scrollToSection('pilih-tiket', 'tiket')}
                            className="rounded-xl bg-brand-blue px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-800 transition"
                        >
                            Pilih Tiket
                        </button>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-20 border-t border-gray-200 bg-white py-10 px-4 sm:px-8 text-center text-xs text-slate">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/hajirin_icon.svg" alt="Hajirin" className="h-6 w-auto" />
                            <span className="font-bold text-navy">HAJIRIN</span>
                            <span>— Platform Event & Tiket Terpercaya</span>
                        </div>
                        <p>© 2026 Hajirin Indonesia. Seluruh hak cipta dilindungi.</p>
                    </div>
                </footer>
            </div>

            {/* Auth Modal for Login / Register */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialView={authView}
            />
        </>
    );
}
