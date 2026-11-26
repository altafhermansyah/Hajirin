import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    MapPin,
    CalendarDays,
    CircleUserRound,
    Bookmark,
    CheckCircle2,
    CircleAlert,
    X,
    ChevronRight,
    RotateCcw,
    LocateFixed,
    Loader2,
} from 'lucide-react';
import AuthModal from '../../Components/Auth/AuthModal';
import Navbar from '../../Components/Navbar';
import { Button, buttonClass } from '../../Components/ui/Button';
import { findNearestCity } from '../../lib/cityGeolocation';

export default function Nearby({
    auth,
    events = [],
    selectedCity: initialCity = 'Semua Kota',
    searchQuery: initialSearch = '',
    availableCities = [
        'Semua Kota',
        'Jakarta',
        'Tangerang',
        'Bandung',
        'Surabaya',
        'Yogyakarta',
        'Bali',
    ],
    bookmarkedEventIds = [],
}) {
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [bookmarkedSet, setBookmarkedSet] = useState(new Set(bookmarkedEventIds || []));
    const [toast, setToast] = useState(null);
    const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'loading' | 'detected' | 'error'
    const [geoMessage, setGeoMessage] = useState('');

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');

    useEffect(() => {
        setSelectedCity(initialCity);
    }, [initialCity]);

    useEffect(() => {
        setBookmarkedSet(new Set(bookmarkedEventIds || []));
    }, [bookmarkedEventIds]);

    function handleSelectCity(city) {
        setSelectedCity(city);
        const query = {};
        if (city && city !== 'Semua Kota') {
            query.city = city;
        }
        if (searchQuery.trim()) {
            query.q = searchQuery.trim();
        }
        router.get('/event-terdekat', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function handleDetectLocation() {
        if (typeof window === 'undefined' || !navigator?.geolocation) {
            setGeoStatus('error');
            setGeoMessage('Browser perangkat Anda tidak mendukung fitur deteksi lokasi.');
            return;
        }

        setGeoStatus('loading');
        setGeoMessage('Meminta izin akses lokasi perangkat...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const nearest = findNearestCity(latitude, longitude, availableCities);

                if (nearest) {
                    handleSelectCity(nearest.city);
                    setGeoStatus('detected');
                    setGeoMessage(
                        `Lokasi terdekat terdeteksi: ${nearest.city} (~${nearest.distanceKm} km). Koordinat hanya diproses di perangkat Anda.`
                    );
                } else {
                    setGeoStatus('error');
                    setGeoMessage('Tidak dapat mencocokkan kota terdekat. Silakan pilih kota secara manual.');
                }
            },
            (err) => {
                setGeoStatus('error');
                if (err.code === 1) {
                    setGeoMessage(
                        'Izin lokasi ditolak. Anda tetap dapat memilih kota secara manual di daftar bawah.'
                    );
                } else if (err.code === 3) {
                    setGeoMessage('Waktu deteksi lokasi habis. Coba ulangi atau pilih kota secara manual.');
                } else {
                    setGeoMessage('Lokasi perangkat tidak dapat ditentukan saat ini.');
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    }

    function openAuthModal(view) {
        setAuthView(view);
        setIsAuthModalOpen(true);
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

        const isCurrentlyBookmarked =
            (eventId && bookmarkedSet.has(eventId)) || (eventSlug && bookmarkedSet.has(eventSlug));
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
                            : 'Event berhasil disimpan ke bookmark Anda.',
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

            <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans antialiased flex flex-col">
                <Navbar auth={auth} onOpenAuthModal={openAuthModal} />

                <main id="main-content" tabIndex={-1} className="flex-1">
                    {/* Header Banner */}
                    <section className="border-b border-slate-200 bg-white py-7">
                        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-10">
                            <nav
                                aria-label="Breadcrumb"
                                className="mb-4 flex items-center gap-2 text-xs text-slate-500"
                            >
                                <Link href="/" className="hover:text-brand-blue">
                                    Beranda
                                </Link>
                                <ChevronRight className="size-3 text-slate-400" aria-hidden="true" />
                                <span className="font-medium text-slate-900">Event Terdekat</span>
                            </nav>

                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                        Event Terdekat di Sekitarmu
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Temukan berbagai acara menarik, konser, festival, dan workshop di kota pilihanmu.
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500 tabular-nums">
                                    Menampilkan{' '}
                                    <span className="font-semibold text-slate-900">
                                        {filteredEvents.length}
                                    </span>{' '}
                                    event
                                </p>
                            </div>

                            {/* Search & City Filter Bar */}
                            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari judul event..."
                                        aria-label="Cari judul event terdekat"
                                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            aria-label="Hapus pencarian"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            <X className="size-4" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        disabled={geoStatus === 'loading'}
                                        title="Deteksi kota terdekat dari GPS perangkat tanpa mengirim koordinat ke server"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue/30 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-blue-100 disabled:opacity-60 transition cursor-pointer"
                                    >
                                        {geoStatus === 'loading' ? (
                                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <LocateFixed className="size-3.5" aria-hidden="true" />
                                        )}
                                        <span>
                                            {geoStatus === 'loading'
                                                ? 'Mendeteksi...'
                                                : 'Gunakan Lokasi Saya'}
                                        </span>
                                    </button>
                                    {availableCities.map((city) => {
                                        const active = selectedCity === city;
                                        return (
                                            <button
                                                key={city}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => handleSelectCity(city)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition border cursor-pointer ${
                                                    active
                                                        ? 'bg-brand-blue text-white border-brand-blue'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                            >
                                                <MapPin className="size-3.5" aria-hidden="true" />
                                                <span>{city}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {geoMessage ? (
                                <p
                                    role="status"
                                    aria-live="polite"
                                    className={`mt-3 text-xs font-medium ${
                                        geoStatus === 'error'
                                            ? 'text-rose-600'
                                            : geoStatus === 'detected'
                                              ? 'text-emerald-700'
                                              : 'text-slate-500'
                                    }`}
                                >
                                    {geoMessage}
                                </p>
                            ) : (
                                <p className="mt-3 text-xs text-slate-500">
                                    Klik <strong>Gunakan Lokasi Saya</strong> jika ingin mengizinkan deteksi kota terdekat. Koordinat GPS hanya diproses di perangkat Anda dan tidak disimpan di server.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Content Grid */}
                    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:px-10">
                        {filteredEvents.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredEvents.map((evt) => {
                                    const isBookmarked =
                                        bookmarkedSet.has(evt.id) || bookmarkedSet.has(evt.slug);

                                    return (
                                        <article
                                            key={evt.id || evt.slug}
                                            className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                                        >
                                            <Link
                                                href={`/event/${evt.slug}`}
                                                className="relative h-44 overflow-hidden bg-slate-100 block"
                                            >
                                                <img
                                                    src={evt.image}
                                                    alt={evt.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                                                    {evt.category}
                                                </span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={(e) =>
                                                    handleToggleBookmark(
                                                        evt.id,
                                                        evt.slug,
                                                        evt.title,
                                                        e
                                                    )
                                                }
                                                aria-label={
                                                    isBookmarked
                                                        ? `Hapus ${evt.title} dari simpanan`
                                                        : `Simpan ${evt.title}`
                                                }
                                                aria-pressed={isBookmarked}
                                                className={`absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg border transition cursor-pointer ${
                                                    isBookmarked
                                                        ? 'border-brand-blue bg-brand-blue text-white'
                                                        : 'border-slate-200/80 bg-white/95 text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                <Bookmark
                                                    className="size-4"
                                                    fill={isBookmarked ? 'currentColor' : 'none'}
                                                    aria-hidden="true"
                                                />
                                            </button>

                                            <div className="flex flex-1 flex-col p-4">
                                                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-blue tabular-nums">
                                                    <CalendarDays
                                                        className="size-3.5 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <span>{evt.date}</span>
                                                </p>
                                                <Link href={`/event/${evt.slug}`} className="block">
                                                    <h2 className="mb-2 text-sm font-semibold leading-snug text-slate-900 line-clamp-2 group-hover:text-brand-blue transition">
                                                        {evt.title}
                                                    </h2>
                                                </Link>
                                                <div className="mt-auto space-y-1 pt-2">
                                                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <MapPin
                                                            className="size-3.5 shrink-0 text-slate-400"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="truncate">{evt.place}</span>
                                                    </p>
                                                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <CircleUserRound
                                                            className="size-3.5 shrink-0 text-slate-400"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="truncate">{evt.organizer}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                                                <div>
                                                    <p className="text-xs text-slate-500">Mulai dari</p>
                                                    <p className="text-base font-semibold text-slate-900 tabular-nums">
                                                        {evt.price}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/event/${evt.slug}`}
                                                    className={buttonClass('outline', 'sm')}
                                                >
                                                    Lihat Event
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="my-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 px-4 text-center">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                    <MapPin className="size-6" aria-hidden="true" />
                                </div>
                                <h2 className="mb-1.5 text-lg font-semibold text-slate-900">
                                    Belum Ada Event di {selectedCity}
                                </h2>
                                <p className="mb-6 max-w-md text-sm text-slate-500">
                                    {searchQuery ? (
                                        <>
                                            Tidak ditemukan event dengan kata kunci{' '}
                                            <span className="font-medium text-slate-900">
                                                "{searchQuery}"
                                            </span>{' '}
                                            di kota{' '}
                                            <span className="font-medium text-slate-900">
                                                "{selectedCity}"
                                            </span>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            Saat ini belum ada event terdekat yang dijadwalkan di kota{' '}
                                            <span className="font-medium text-slate-900">
                                                "{selectedCity}"
                                            </span>
                                            . Coba pilih kota lain atau tampilkan semua kota.
                                        </>
                                    )}
                                </p>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCity('Semua Kota');
                                        router.get('/event-terdekat', {}, {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        });
                                    }}
                                >
                                    <RotateCcw className="size-4" aria-hidden="true" />
                                    <span>Tampilkan Semua Kota</span>
                                </Button>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8 lg:px-10">
                    <div className="text-center text-xs text-slate-400">
                        © 2026 Hajirin - Platform E-ticketing &amp; Management Event Indonesia
                    </div>
                </footer>

                {toast && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-lg ${
                            toast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2
                                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                                aria-hidden="true"
                            />
                        ) : (
                            <CircleAlert
                                className="mt-0.5 size-4 shrink-0 text-rose-600"
                                aria-hidden="true"
                            />
                        )}
                        <p className="flex-1 text-xs font-medium text-slate-800">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            aria-label="Tutup notifikasi"
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                )}

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    initialView={authView}
                />
            </div>
        </>
    );
}
