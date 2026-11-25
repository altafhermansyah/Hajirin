import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    Briefcase,
    Calendar,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleUserRound,
    GraduationCap,
    Headphones,
    LayoutGrid,
    MapPin,
    Menu,
    Palette,
    PlusCircle,
    Search,
    SearchX,
    RotateCcw,
    CheckCircle2,
    CircleAlert,
    Sparkles,
    Tag,
    Trophy,
    X,
    TentTree,
    Users,
    UserRound,
    Volleyball,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from '../Components/Auth/AuthModal';
import Navbar from '../Components/Navbar';
import { Button, buttonClass } from '../Components/ui/Button';

const CATEGORY_ICON_MAP = {
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
    musik: Headphones,
    seminar: Users,
    workshop: Palette,
    olahraga: Volleyball,
    komunitas: UserRound,
    festival: TentTree,
    pameran: LayoutGrid,
    lainnya: Menu,
};

function resolveImageSrc(image) {
    if (!image) return '/images/events/tech_hero.jpg';
    if (image.startsWith('/') || image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }
    return `/images/events/${image}`;
}

export default function Home({
    auth,
    categories = [],
    events = [],
    heroEvents = [],
    featuredEvents = [],
    popularEvents = [],
    availableCities = [],
    bookmarkedEventIds = [],
}) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [logoutToast, setLogoutToast] = useState(null);

    const [bookmarkedSet, setBookmarkedSet] = useState(new Set(bookmarkedEventIds || []));

    useEffect(() => {
        setBookmarkedSet(new Set(bookmarkedEventIds || []));
    }, [bookmarkedEventIds]);

    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('q') || params.get('search') || '';
        }
        return '';
    });
    const [selectedLocation, setSelectedLocation] = useState('Semua Kota');
    const [selectedTime, setSelectedTime] = useState('Semua Waktu');
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const initialQ = params.get('q') || params.get('search');
            if (initialQ) {
                setSearchQuery(initialQ);
                setTimeout(() => {
                    const searchEl =
                        document.getElementById('hasil-pencarian') ||
                        document.getElementById('search-section');
                    if (searchEl) searchEl.scrollIntoView({ behavior: 'smooth' });
                }, 350);
            }
        }
    }, []);

    function handleToggleBookmark(eventId, eventSlug, eventTitle, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!auth?.user) {
            openAuthModal('login');
            setLogoutToast({
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
                    setLogoutToast({
                        type: 'success',
                        message: isCurrentlyBookmarked
                            ? `"${eventTitle}" dihapus dari simpanan.`
                            : 'Event berhasil disimpan ke bookmark Anda.',
                    });
                },
                onError: () => {
                    setBookmarkedSet(new Set(bookmarkedSet));
                    setLogoutToast({
                        type: 'error',
                        message: 'Gagal memperbarui simpanan event.',
                    });
                },
            }
        );
    }

    const isSearching =
        searchQuery.trim().length > 0 ||
        selectedLocation !== 'Semua Kota' ||
        selectedTime !== 'Semua Waktu';

    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        const q = searchQuery.trim().toLowerCase();

        return events.filter((item) => {
            const matchText = !q || (item.title && item.title.toLowerCase().includes(q));

            const matchLocation =
                selectedLocation === 'Semua Kota' ||
                (item.city && item.city.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                (item.place && item.place.toLowerCase().includes(selectedLocation.toLowerCase()));

            let matchTime = true;
            if (selectedTime !== 'Semua Waktu') {
                const eventDate = item.starts_at ? new Date(item.starts_at) : null;
                if (eventDate && !isNaN(eventDate.getTime())) {
                    const now = new Date();
                    const startOfToday = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    );
                    const endOfToday = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        23,
                        59,
                        59,
                        999
                    );

                    if (selectedTime === 'Hari Ini') {
                        matchTime = eventDate >= startOfToday && eventDate <= endOfToday;
                    } else if (selectedTime === 'Minggu Ini') {
                        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
                        const startOfWeek = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate() - (dayOfWeek - 1)
                        );
                        const endOfWeek = new Date(
                            startOfWeek.getFullYear(),
                            startOfWeek.getMonth(),
                            startOfWeek.getDate() + 6,
                            23,
                            59,
                            59,
                            999
                        );
                        matchTime = eventDate >= startOfWeek && eventDate <= endOfWeek;
                    } else if (selectedTime === 'Bulan Ini') {
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const endOfMonth = new Date(
                            now.getFullYear(),
                            now.getMonth() + 1,
                            0,
                            23,
                            59,
                            59,
                            999
                        );
                        matchTime = eventDate >= startOfMonth && eventDate <= endOfMonth;
                    }
                }
            }

            return matchText && matchLocation && matchTime;
        });
    }, [searchQuery, selectedLocation, selectedTime, isSearching, events]);

    function handleSearchSubmit(e) {
        if (e) e.preventDefault();
        const resultsEl =
            document.getElementById('hasil-pencarian') ||
            document.getElementById('search-section');
        if (resultsEl) {
            resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function handleResetSearch() {
        setSearchQuery('');
        setSelectedLocation('Semua Kota');
        setSelectedTime('Semua Waktu');
        searchInputRef.current?.focus();
    }

    useEffect(() => {
        if (isCarouselPaused || heroEvents.length <= 1) return undefined;
        const timer = window.setInterval(() => {
            setActiveSlide((currentSlide) => (currentSlide + 1) % heroEvents.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, [isCarouselPaused, heroEvents.length]);

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

    function changeSlide(offset) {
        if (heroEvents.length <= 1) return;
        setActiveSlide(
            (currentSlide) => (currentSlide + offset + heroEvents.length) % heroEvents.length
        );
    }

    const getCategoryIcon = (category) =>
        CATEGORY_ICON_MAP[category?.icon] || CATEGORY_ICON_MAP[category?.slug] || Tag;

    return (
        <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans antialiased">
            <Head title="Hajirin - Event & Ticketing" />

            <Navbar
                auth={auth}
                onOpenAuthModal={openAuthModal}
                initialSearchQuery={searchQuery}
                onSearch={(q) => {
                    setSearchQuery(q);
                    if (q.trim().length > 0) {
                        setTimeout(() => {
                            const resultsEl =
                                document.getElementById('hasil-pencarian') ||
                                document.getElementById('search-section');
                            if (resultsEl) {
                                resultsEl.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 50);
                    }
                }}
            />

            <main id="main-content" tabIndex={-1}>
                {/* Hero Carousel */}
                <section className="px-4 py-6 sm:px-8 lg:px-10">
                    {heroEvents.length > 0 ? (
                        <div
                            className="group relative h-[520px] overflow-hidden rounded-xl bg-navy sm:h-[460px]"
                            onMouseEnter={() => setIsCarouselPaused(true)}
                            onMouseLeave={() => setIsCarouselPaused(false)}
                        >
                            {heroEvents.map((event, index) => (
                                <article
                                    key={event.id || event.slug}
                                    className={`absolute inset-0 transition-opacity duration-700 ${
                                        index === activeSlide
                                            ? 'z-10 opacity-100'
                                            : 'pointer-events-none z-0 opacity-0'
                                    }`}
                                >
                                    <img
                                        src={resolveImageSrc(event.image)}
                                        alt=""
                                        decoding="async"
                                        fetchPriority={index === 0 ? 'high' : 'low'}
                                        loading={index === 0 ? undefined : 'lazy'}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                                        <div className="max-w-3xl">
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span className="rounded-md border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
                                                    {event.category}
                                                </span>
                                                <span className="rounded-md border border-white/20 bg-navy/60 px-2.5 py-0.5 text-xs font-medium text-slate-200 backdrop-blur-xs">
                                                    {event.status}
                                                </span>
                                            </div>
                                            <h1 className="mb-3 text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
                                                {event.title}
                                            </h1>
                                            <div className="mb-3 flex flex-col gap-1.5 text-sm text-slate-200 sm:flex-row sm:gap-6">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="size-4 text-slate-300" aria-hidden="true" />
                                                    {event.date}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="size-4 text-slate-300" aria-hidden="true" />
                                                    {event.place}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="mb-6 max-w-2xl text-sm text-slate-300 leading-relaxed line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                                                <div>
                                                    <p className="text-xs text-slate-300">Harga Tiket Mulai</p>
                                                    <p className="text-xl font-semibold tabular-nums">
                                                        {event.price}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/event/${event.slug}`}
                                                    className={buttonClass('primary', 'lg')}
                                                >
                                                    Lihat Event
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleToggleBookmark(
                                                            event.id,
                                                            event.slug,
                                                            event.title,
                                                            e
                                                        )
                                                    }
                                                    aria-label={
                                                        bookmarkedSet.has(event.id) ||
                                                        bookmarkedSet.has(event.slug)
                                                            ? `Hapus simpanan ${event.title}`
                                                            : `Simpan ${event.title}`
                                                    }
                                                    className={`flex size-11 items-center justify-center rounded-lg border transition cursor-pointer ${
                                                        bookmarkedSet.has(event.id) ||
                                                        bookmarkedSet.has(event.slug)
                                                            ? 'border-brand-blue bg-brand-blue text-white'
                                                            : 'border-white/30 text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    <Bookmark
                                                        className="size-5"
                                                        fill={
                                                            bookmarkedSet.has(event.id) ||
                                                            bookmarkedSet.has(event.slug)
                                                                ? 'currentColor'
                                                                : 'none'
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {heroEvents.length > 1 && (
                                <>
                                    <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 sm:left-10">
                                        {heroEvents.map((event, index) => (
                                            <button
                                                key={event.id || event.slug}
                                                type="button"
                                                aria-label={`Tampilkan ${event.title}`}
                                                onClick={() => setActiveSlide(index)}
                                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                                    index === activeSlide
                                                        ? 'w-7 bg-white'
                                                        : 'w-2 bg-white/40 hover:bg-white/70'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 sm:bottom-8 sm:right-10">
                                        <button
                                            type="button"
                                            aria-label="Slide sebelumnya"
                                            onClick={() => changeSlide(-1)}
                                            className="flex size-9 items-center justify-center rounded-lg border border-white/25 bg-navy/50 text-white backdrop-blur-sm hover:bg-white/20 transition cursor-pointer"
                                        >
                                            <ChevronLeft className="size-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Slide selanjutnya"
                                            onClick={() => changeSlide(1)}
                                            className="flex size-9 items-center justify-center rounded-lg border border-white/25 bg-navy/50 text-white backdrop-blur-sm hover:bg-white/20 transition cursor-pointer"
                                        >
                                            <ChevronRight className="size-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-end rounded-xl bg-navy p-8 text-white sm:min-h-[300px] sm:p-10">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                                Platform Event &amp; Ticketing
                            </p>
                            <h1 className="mb-3 max-w-2xl text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
                                Temukan dan hadiri event terbaik di sekitarmu
                            </h1>
                            <p className="mb-6 max-w-xl text-sm text-slate-300 leading-relaxed">
                                Belum ada event publik yang tayang saat ini. Jelajahi kategori atau mulai buat event pertamamu di Hajirin.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link href="/kategori" className={buttonClass('primary', 'lg')}>
                                    Jelajahi Kategori
                                </Link>
                                <Button variant="outline" size="lg" onClick={handleCreateEventClick}>
                                    Mulai Buat Event
                                </Button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Search Box */}
                <section id="search-section" className="px-4 py-3 sm:px-8 lg:px-10">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
                    >
                        <h2 className="mb-3.5 text-base font-semibold text-slate-900">
                            Cari event yang ingin kamu datangi
                        </h2>
                        <div className="flex flex-col gap-3 md:flex-row">
                            <label className="relative flex-1">
                                <span className="sr-only">Cari event</span>
                                <Search
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchQuery(val);
                                        if (val.trim().length > 0) {
                                            setTimeout(() => {
                                                const resultsEl =
                                                    document.getElementById('hasil-pencarian');
                                                if (resultsEl) {
                                                    resultsEl.scrollIntoView({
                                                        behavior: 'smooth',
                                                    });
                                                }
                                            }, 50);
                                        }
                                    }}
                                    placeholder="Cari judul event..."
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Hapus pencarian"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="size-4" aria-hidden="true" />
                                    </button>
                                )}
                            </label>

                            <label className="relative md:w-52">
                                <span className="sr-only">Lokasi</span>
                                <MapPin
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm font-medium text-slate-700 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                                >
                                    <option value="Semua Kota">Semua Kota</option>
                                    {availableCities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                            </label>

                            <label className="relative md:w-52">
                                <span className="sr-only">Tanggal</span>
                                <CalendarDays
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm font-medium text-slate-700 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                                >
                                    <option value="Semua Waktu">Semua Waktu</option>
                                    <option value="Hari Ini">Hari Ini</option>
                                    <option value="Minggu Ini">Minggu Ini</option>
                                    <option value="Bulan Ini">Bulan Ini</option>
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                            </label>

                            <Button type="submit" variant="primary" size="lg">
                                Cari Event
                            </Button>
                        </div>
                    </form>
                </section>

                {isSearching ? (
                    <section id="hasil-pencarian" className="px-4 py-8 sm:px-8 lg:px-10">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                    Hasil Pencarian
                                </h2>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {searchResults.length > 0
                                        ? `Menampilkan ${searchResults.length} event untuk "${searchQuery || selectedLocation}"`
                                        : 'Tidak ditemukan event yang cocok'}
                                </p>
                            </div>
                            <Button variant="outline" size="md" onClick={handleResetSearch}>
                                <RotateCcw className="size-4 text-slate-500" aria-hidden="true" />
                                <span>Reset Pencarian</span>
                            </Button>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                {searchResults.map((evt, idx) => (
                                    <FeaturedCard
                                        key={evt.slug || evt.id || idx}
                                        {...evt}
                                        isBookmarked={
                                            bookmarkedSet.has(evt.id) || bookmarkedSet.has(evt.slug)
                                        }
                                        onToggleBookmark={(e) =>
                                            handleToggleBookmark(evt.id, evt.slug, evt.title, e)
                                        }
                                        onBuyTicket={(e) => {
                                            if (!auth?.user) {
                                                e.preventDefault();
                                                openAuthModal('login');
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="my-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
                                <div className="mb-4 flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                    <SearchX className="size-6" aria-hidden="true" />
                                </div>
                                <h3 className="mb-1.5 text-lg font-semibold text-slate-900">
                                    Tidak Ada Hasil Pencarian
                                </h3>
                                <p className="mb-6 max-w-md text-sm text-slate-500">
                                    {searchQuery ? (
                                        <>
                                            Maaf, kami tidak menemukan event dengan kata kunci{' '}
                                            <span className="font-medium text-slate-900">
                                                "{searchQuery}"
                                            </span>
                                            {selectedLocation !== 'Semua Kota' && (
                                                <>
                                                    {' '}
                                                    di kota{' '}
                                                    <span className="font-medium text-slate-900">
                                                        "{selectedLocation}"
                                                    </span>
                                                </>
                                            )}
                                            .
                                        </>
                                    ) : (
                                        <>
                                            Belum ada event tersedia di kota{' '}
                                            <span className="font-medium text-slate-900">
                                                "{selectedLocation}"
                                            </span>
                                            .
                                        </>
                                    )}{' '}
                                    Coba kata kunci lain atau reset filter pencarian.
                                </p>
                                <Button variant="primary" size="md" onClick={handleResetSearch}>
                                    <RotateCcw className="size-4" aria-hidden="true" />
                                    <span>Tampilkan Semua Event</span>
                                </Button>
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <SectionHeading
                            id="event-unggulan"
                            title="Event Unggulan Minggu Ini"
                            description="Pilihan event terbaik yang sayang untuk dilewatkan"
                            action="Lihat Semua"
                            actionHref="/kategori"
                        />
                        <section className="px-4 pb-8 sm:px-8 lg:px-10">
                            {featuredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                    {featuredEvents.map((evt) => (
                                        <FeaturedCard
                                            key={evt.id || evt.slug}
                                            {...evt}
                                            isBookmarked={
                                                bookmarkedSet.has(evt.id) ||
                                                bookmarkedSet.has(evt.slug)
                                            }
                                            onToggleBookmark={(e) =>
                                                handleToggleBookmark(
                                                    evt.id,
                                                    evt.slug,
                                                    evt.title,
                                                    e
                                                )
                                            }
                                            onBuyTicket={(e) => {
                                                if (!auth?.user) {
                                                    e.preventDefault();
                                                    openAuthModal('login');
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                                    Belum ada event unggulan yang tersedia saat ini.
                                </div>
                            )}
                        </section>

                        <SectionHeading
                            title="Sedang Populer"
                            description="Event yang paling banyak diminati minggu ini"
                            action="Lihat Semua"
                            actionHref="/kategori"
                        />
                        <section className="px-4 pb-10 sm:px-8 lg:px-10">
                            {popularEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                    {popularEvents.map((evt) => (
                                        <PopularCard key={evt.id || evt.slug} {...evt} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                                    Belum ada event populer yang tersedia saat ini.
                                </div>
                            )}
                        </section>

                        <section
                            id="kategori"
                            className="border-y border-slate-200 bg-white px-4 py-10 sm:px-8 lg:px-10"
                        >
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Jelajahi Berdasarkan Kategori
                            </h2>
                            <p className="mt-1 mb-6 text-sm text-slate-500">
                                Temukan event sesuai minat dan hobi kamu
                            </p>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
                                {categories.map((cat) => {
                                    const IconComponent = getCategoryIcon(cat);
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={`/kategori/${cat.slug}`}
                                            className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-brand-blue hover:bg-white hover:text-brand-blue"
                                        >
                                            <IconComponent
                                                className="mb-2 size-6 text-slate-400 transition group-hover:text-brand-blue"
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                            />
                                            <span className="text-xs font-medium text-slate-800 group-hover:text-brand-blue">
                                                {cat.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}

                {/* Organizer CTA */}
                <section className="px-4 py-10 sm:px-8 lg:px-10">
                    <div className="flex flex-col items-center justify-between gap-6 rounded-xl bg-navy p-8 text-center md:flex-row md:p-10 md:text-left">
                        <div className="max-w-2xl text-white">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                                Untuk Penyelenggara Acara
                            </p>
                            <h2 className="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight">
                                Punya acara yang ingin kamu selenggarakan?
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Kelola event, jual tiket secara digital dalam satu sistem, dan pantau kehadiran peserta hingga hasil penjualan secara real-time.
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-end shrink-0">
                            <Button variant="primary" size="lg" onClick={handleCreateEventClick}>
                                <PlusCircle className="size-4" aria-hidden="true" />
                                <span>Mulai Buat Event</span>
                            </Button>
                            <Link
                                href="/syarat-ketentuan#kewajiban-eo"
                                className="mt-3 inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white hover:underline"
                            >
                                <span>Pelajari ketentuan penyelenggara</span>
                                <ArrowRight className="size-3" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white px-4 pb-6 pt-12 sm:px-8 lg:px-10">
                <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="pr-4">
                        <div className="mb-3 flex items-center gap-2">
                            <img
                                src="/hajirin_icon.svg"
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-7 w-auto"
                            />
                            <span className="text-lg font-bold tracking-tight text-navy">HAJIRIN</span>
                        </div>
                        <p className="mb-5 text-xs leading-relaxed text-slate-500">
                            Platform e-ticketing komunitas dan ekosistem penyelenggara event terpercaya di Indonesia.
                        </p>
                        <FooterLinks
                            links={[
                                { label: 'Beranda', href: '/' },
                                { label: 'Event Terdekat', href: '/event-terdekat' },
                                { label: 'Hubungi Kami', href: '/syarat-ketentuan#kontak' },
                            ]}
                        />
                    </div>
                    <FooterColumn
                        title="Untuk Pengunjung"
                        links={[
                            { label: 'Jelajah Event', href: '/#event-unggulan' },
                            { label: 'Kategori', href: '/kategori' },
                            { label: 'Event Terdekat', href: '/event-terdekat' },
                        ]}
                    />
                    <FooterColumn
                        title="Untuk EO"
                        links={[
                            { label: 'Ajukan Akun EO', href: '/eo-applications/create' },
                            { label: 'Ketentuan Penyelenggara', href: '/syarat-ketentuan#kewajiban-eo' },
                        ]}
                        onDashboardClick={handleCreateEventClick}
                    />
                    <FooterColumn
                        title="Informasi"
                        links={[
                            { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
                            { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
                            { label: 'Kebijakan Refund', href: '/syarat-ketentuan#refund' },
                        ]}
                    />
                </div>
                <div className="flex flex-col items-center justify-between border-t border-slate-200 pt-5 text-xs text-slate-400 md:flex-row">
                    <p>© 2026 Hajirin - Platform E-ticketing &amp; Management Event Indonesia</p>
                    <span className="mt-3 md:mt-0">Bahasa Indonesia</span>
                </div>
            </footer>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialView={authView}
            />

            {logoutToast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed right-4 top-20 z-[120] flex max-w-sm items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-lg ${
                        logoutToast.type === 'success' ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                >
                    {logoutToast.type === 'success' ? (
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
                    <p className="flex-1 text-xs font-medium text-slate-800">
                        {logoutToast.message}
                    </p>
                    <button
                        type="button"
                        onClick={() => setLogoutToast(null)}
                        aria-label="Tutup notifikasi"
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}

function SectionHeading({ id, title, description, action, actionHref }) {
    return (
        <section
            id={id}
            className="flex items-end justify-between px-4 pb-5 pt-8 sm:px-8 lg:px-10"
        >
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            </div>
            {action && (
                <Link
                    href={actionHref || '/kategori'}
                    className="hidden items-center gap-1 text-sm font-medium text-brand-blue hover:underline sm:inline-flex"
                >
                    <span>{action}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
            )}
        </section>
    );
}

function FeaturedCard({
    slug,
    image,
    category,
    date,
    title,
    place,
    organizer,
    price,
    isBookmarked,
    onToggleBookmark,
    onBuyTicket,
}) {
    const imageSrc = resolveImageSrc(image);

    return (
        <Link
            href={`/event/${slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
        >
            <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                    src={imageSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                {category && (
                    <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                        {category}
                    </span>
                )}
                <button
                    type="button"
                    onClick={onToggleBookmark}
                    aria-label={isBookmarked ? `Hapus ${title} dari simpanan` : `Simpan ${title}`}
                    className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg border transition cursor-pointer ${
                        isBookmarked
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-slate-200/80 bg-white/95 text-slate-500 hover:text-slate-900'
                    }`}
                >
                    <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className="flex flex-grow flex-col p-4">
                {date && (
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-blue tabular-nums">
                        <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                        <span>{date}</span>
                    </p>
                )}
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-blue transition-colors">
                    {title}
                </h3>
                <div className="mt-auto space-y-1 pt-2">
                    {place && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="truncate">{place}</span>
                        </p>
                    )}
                    {organizer && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CircleUserRound
                                className="size-3.5 text-slate-400 shrink-0"
                                aria-hidden="true"
                            />
                            <span className="truncate">{organizer}</span>
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                <div>
                    <p className="text-xs text-slate-500">Mulai dari</p>
                    <p className="text-base font-semibold text-slate-900 tabular-nums">
                        {price || 'Rp0'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onBuyTicket}
                    className={buttonClass('outline', 'sm')}
                >
                    Beli Tiket
                </button>
            </div>
        </Link>
    );
}

function PopularCard({
    slug,
    image,
    label,
    date,
    dateShort,
    title,
    place,
    price,
    availability,
    remainingQuota,
}) {
    const isUrgent = label === 'Hampir Habis';

    return (
        <Link
            href={`/event/${slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 flex flex-col h-full"
        >
            <div className="relative h-40 overflow-hidden bg-slate-100 shrink-0">
                <img
                    src={resolveImageSrc(image)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                    {label}
                </span>
                {isUrgent && remainingQuota > 0 && (
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-navy/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs tabular-nums">
                        Sisa {remainingQuota} Tiket
                    </span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="mb-1 text-xs font-medium text-slate-500 tabular-nums">
                    {dateShort || date}
                </p>
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-blue transition-colors">
                    {title}
                </h3>
                <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 mt-auto">
                    <MapPin className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{place}</span>
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-base font-semibold text-slate-900 tabular-nums">{price}</p>
                    <p
                        className={`text-xs font-medium ${
                            isUrgent ? 'text-amber-700' : 'text-slate-500'
                        }`}
                    >
                        {availability}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function FooterColumn({ title, links, onDashboardClick }) {
    return (
        <div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-900">
                {title}
            </h2>
            <FooterLinks links={links} />
            {onDashboardClick && (
                <button
                    type="button"
                    onClick={onDashboardClick}
                    className="mt-3 text-xs text-slate-500 hover:text-brand-blue cursor-pointer"
                >
                    Masuk Dashboard
                </button>
            )}
        </div>
    );
}

function FooterLinks({ links }) {
    return (
        <div className="flex flex-col gap-2.5 text-xs text-slate-500">
            {links.map((item) => (
                <Link key={item.label} href={item.href} className="hover:text-brand-blue transition">
                    {item.label}
                </Link>
            ))}
        </div>
    );
}
