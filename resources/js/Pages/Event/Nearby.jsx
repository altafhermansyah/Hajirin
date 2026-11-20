import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    Search, MapPin, CalendarDays, CircleUserRound, Bookmark,
    ArrowRight, CheckCircle2, CircleAlert, X, ChevronRight, RotateCcw, LogOut
} from 'lucide-react';
import AuthModal from '../../Components/Auth/AuthModal';
import Navbar from '../../Components/Navbar';

export default function Nearby({
    auth,
    events = [],
    selectedCity: initialCity = 'Semua Kota',
    searchQuery: initialSearch = '',
    availableCities = ['Semua Kota', 'Jakarta', 'Tangerang', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali'],
    bookmarkedEventIds = [],
}) {
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [bookmarkedSet, setBookmarkedSet] = useState(new Set(bookmarkedEventIds || []));
    const [toast, setToast] = useState(null);

    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');

    useEffect(() => {
        setBookmarkedSet(new Set(bookmarkedEventIds || []));
    }, [bookmarkedEventIds]);

    function openAuthModal(view) {
        setAuthView(view);
        setIsAuthModalOpen(true);
    }

    function handleCreateEventClick() {
        if (!auth?.user) {
            openAuthModal('login');
            return;
        }
        if (auth.user.role === 'EO') {
            router.visit('/eo/dashboard');
            return;
        }
        if (auth.user.role === 'ADMIN') {
            router.visit('/admin/dashboard');
            return;
        }
        router.visit('/eo-applications/create');
    }

    function handleToggleBookmark(eventId, eventSlug, eventTitle, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!auth?.user) {
            openAuthModal('login');
            setToast({
                type: 'error',
                message: 'Silakan masuk atau daftar terlebih dahulu untuk menandai event.',
            });
            return;
        }

        const isCurrentlyBookmarked = (eventId && bookmarkedSet.has(eventId)) || (eventSlug && bookmarkedSet.has(eventSlug));
        const nextSet = new Set(bookmarkedSet);
        if (isCurrentlyBookmarked) {
            if (eventId) nextSet.delete(eventId);
            if (eventSlug) nextSet.delete(eventSlug);
        } else {
            if (eventId) nextSet.add(eventId);
            if (eventSlug) nextSet.add(eventSlug);
        }
        setBookmarkedSet(nextSet);

        const targetIdentifier = eventSlug || eventId;
        router.post(
            `/events/${targetIdentifier}/bookmark`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setToast({
                        type: 'success',
                        message: isCurrentlyBookmarked
                            ? `"${eventTitle}" dihapus dari simpanan.`
                            : 'Penanda telah berhasil dan tersimpan di halaman bookmark!',
                    });
                },
                onError: () => {
                    setBookmarkedSet(new Set(bookmarkedSet));
                    setToast({
                        type: 'error',
                        message: 'Gagal memperbarui simpanan event.',
                    });
                },
            }
        );
    }

    const filteredEvents = useMemo(() => {
        return events.filter((item) => {
            const q = searchQuery.trim().toLowerCase();
            const matchText = !q || (item.title && item.title.toLowerCase().includes(q));

            const matchCity =
                selectedCity === 'Semua Kota' ||
                (item.city && item.city.toLowerCase().includes(selectedCity.toLowerCase())) ||
                (item.place && item.place.toLowerCase().includes(selectedCity.toLowerCase())) ||
                (item.address && item.address.toLowerCase().includes(selectedCity.toLowerCase()));

            return matchText && matchCity;
        });
    }, [events, selectedCity, searchQuery]);

    return (
        <>
            <Head title={`Event Terdekat di ${selectedCity} - Hajirin`} />

            <div className="min-h-screen bg-[#f8fafc] text-navy font-sans antialiased">
                <Navbar auth={auth} onOpenAuthModal={openAuthModal} />

                {/* Header Banner */}
                <header className="border-b border-gray-100 bg-white py-8">
                    <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
                        <div className="mb-3 flex items-center space-x-2 text-xs text-slate">
                            <Link href="/" className="hover:text-brand-blue">Beranda</Link>
                            <ChevronRight className="size-3 text-gray-400" />
                            <span className="font-semibold text-navy">Event Terdekat</span>
                        </div>
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                                    Event Terdekat di Sekitarmu
                                </h1>
                                <p className="mt-1 text-sm text-slate">
                                    Temukan berbagai acara menarik, konser, festival, dan workshop di kota pilihanmu.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue border border-blue-200">
                                    {filteredEvents.length} Event Ditemukan
                                </span>
                            </div>
                        </div>

                        {/* Search & City Filter Bar */}
                        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Search input */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari judul event..."
                                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-9 text-xs placeholder:text-gray-400 transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* City Pills Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                {availableCities.map((city) => (
                                    <button
                                        key={city}
                                        type="button"
                                        onClick={() => setSelectedCity(city)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                            selectedCity === city
                                                ? 'bg-brand-blue text-white shadow-sm'
                                                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <MapPin className="size-3.5" />
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:px-10">
                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredEvents.map((evt) => {
                                const isBookmarked = bookmarkedSet.has(evt.id) || bookmarkedSet.has(evt.slug);

                                return (
                                    <article
                                        key={evt.id || evt.slug}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg"
                                    >
                                        <Link href={`/event/${evt.slug}`} className="relative h-44 overflow-hidden bg-gray-100 block">
                                            <img
                                                src={evt.image}
                                                alt={evt.title}
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                            <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                                                {evt.category}
                                            </span>
                                        </Link>

                                        {/* Tombol Bookmark */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleBookmark(evt.id, evt.slug, evt.title, e)}
                                            aria-label={isBookmarked ? `Hapus ${evt.title} dari simpanan` : `Simpan ${evt.title}`}
                                            className={`absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full shadow-md transition ${
                                                isBookmarked
                                                    ? 'bg-brand-blue text-white shadow-blue-500/20'
                                                    : 'bg-white/95 text-gray-400 hover:text-navy hover:bg-white'
                                            }`}
                                        >
                                            <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                                        </button>

                                        <div className="flex flex-1 flex-col p-4">
                                            <p className="mb-1 flex items-center text-[11px] font-semibold text-brand-blue">
                                                <CalendarDays className="mr-1.5 size-3.5 shrink-0" />
                                                {evt.date}
                                            </p>
                                            <Link href={`/event/${evt.slug}`} className="block">
                                                <h3 className="mb-2 text-base font-bold leading-tight text-navy line-clamp-2 group-hover:text-brand-blue transition">
                                                    {evt.title}
                                                </h3>
                                            </Link>
                                            <div className="mt-auto space-y-1">
                                                <p className="flex items-center text-xs text-slate">
                                                    <MapPin className="mr-1.5 size-3.5 shrink-0 text-red-500" />
                                                    <span className="truncate">{evt.place}</span>
                                                </p>
                                                <p className="flex items-center text-xs text-slate">
                                                    <CircleUserRound className="mr-1.5 size-3.5 shrink-0 text-gray-400" />
                                                    <span className="truncate">{evt.organizer}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
                                            <div>
                                                <p className="text-[10px] text-gray-500">Mulai dari</p>
                                                <p className="text-base font-bold text-brand-blue">{evt.price}</p>
                                            </div>
                                            <Link
                                                href={`/event/${evt.slug}`}
                                                className="rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
                                            >
                                                Lihat Event
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="my-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                                <MapPin className="size-8 text-brand-blue" />
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-navy">
                                Belum Ada Event di {selectedCity}
                            </h2>
                            <p className="mb-6 max-w-md text-sm text-slate">
                                {searchQuery ? (
                                    <>
                                        Tidak ditemukan event dengan kata kunci <span className="font-semibold text-navy">"{searchQuery}"</span> di kota <span className="font-semibold text-navy">"{selectedCity}"</span>.
                                    </>
                                ) : (
                                    <>
                                        Saat ini belum ada event terdekat yang dijadwalkan di kota <span className="font-semibold text-navy">"{selectedCity}"</span>. Coba pilih kota lain atau tampilkan semua kota.
                                    </>
                                )}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCity('Semua Kota');
                                    setSearchQuery('');
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
                            >
                                <RotateCcw className="size-3.5" />
                                Tampilkan Semua Event di Semua Kota
                            </button>
                        </div>
                    )}
                </main>

                {/* Toast Notification */}
                {toast && (
                    <div role="status" aria-live="polite" className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
                        {toast.type === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" />}
                        <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
                        <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi" className="text-gray-400 hover:text-gray-700"><X className="size-4" /></button>
                    </div>
                )}

                {/* Auth Modal */}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authView} />
            </div>
        </>
    );
}

