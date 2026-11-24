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

const heroEvents = [
    {
        id: 'hero-1',
        image: '/images/events/hero_festival.jpg',
        category: 'Festival Musik',
        title: 'Festival Musik Nusantara 2026: Merayakan Harmoni Musisi Indie & Elektronik',
        date: '24 - 25 September 2026',
        starts_at: '2026-09-24T18:00:00',
        place: 'Stadion Gelora Bung Karno, Jakarta',
        description:
            'Dimeriahkan oleh lebih dari 50 musisi lokal di 3 panggung epik. Rasakan pengalaman festival musik yang belum pernah ada sebelumnya.',
        price: 'Rp75.000',
        status: 'Tiket Tersedia',
        slug: 'festival-musik-nusantara-2026',
    },
    {
        id: 'hero-2',
        image: '/images/events/tech_hero.jpg',
        category: 'Konferensi Teknologi',
        title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering',
        date: '24 - 25 Oktober 2026',
        starts_at: '2026-10-24T09:00:00',
        place: 'ICE BSD Hall 1, Tangerang',
        description:
            'Menghadirkan lebih dari 500 praktisi teknologi, arsitek cloud, peneliti AI, dan pakar industri untuk membentuk masa depan ekosistem perangkat lunak global.',
        price: 'Rp150.000',
        status: 'Tiket Tersedia',
        slug: 'indonesia-tech-conference-2026',
    },
    {
        id: 'hero-3',
        image: '/images/events/marathon_hero.jpg',
        category: 'Olahraga',
        title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet',
        date: '01 November 2026',
        starts_at: '2026-11-01T05:30:00',
        place: 'Plaza FX Sudirman, Jakarta',
        description:
            'Berlari bersama ribuan penggiat kebugaran menyusuri fajar kota Jakarta. Setiap kilometer donasi untuk reboisasi hutan nusantara.',
        price: 'Rp125.000',
        status: 'Tiket Tersedia',
        slug: 'jakarta-sunrise-marathon-2026',
    },
    {
        id: 'hero-4',
        image: '/images/events/startup.jpg',
        category: 'Bisnis & Startup',
        title: 'Startup Growth Festival 2026: Scale Up Beyond Boundaries',
        date: '14 - 15 November 2026',
        starts_at: '2026-11-14T09:00:00',
        place: 'JCC Senayan, Jakarta',
        description:
            'Akselerasi bisnismu ke level berikutnya bersama para venture capital, unicorn founders, dan praktisi growth marketing terbaik di Asia Tenggara.',
        price: 'Rp75.000',
        status: 'Populer',
        slug: 'startup-growth-festival-2026',
    },
];

const featuredEvents = [
    {
        id: 'f-1',
        image: 'tech_hero.jpg',
        category: 'Konferensi Teknologi',
        date: 'Sab, 24 Okt 2026 · 09:00 WIB',
        starts_at: '2026-10-24T09:00:00',
        title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering',
        place: 'ICE BSD Hall 1, Tangerang',
        organizer: 'Tech Innovation Indonesia',
        price: 'Rp150.000',
        slug: 'indonesia-tech-conference-2026',
    },
    {
        id: 'f-2',
        image: 'design_hero.jpg',
        category: 'Workshop',
        date: 'Sab, 25 Okt 2026 · 10:00 WIB',
        starts_at: '2026-10-25T10:00:00',
        title: 'Creative Design & Typography Workshop 2026',
        place: 'Margo City, Bandung',
        organizer: 'Kreator Nusantara',
        price: 'Rp50.000',
        slug: 'creative-design-typography-workshop-2026',
    },
    {
        id: 'f-3',
        image: 'marathon_hero.jpg',
        category: 'Olahraga',
        date: 'Min, 01 Nov 2026 · 05:30 WIB',
        starts_at: '2026-11-01T05:30:00',
        title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet',
        place: 'Plaza FX Sudirman, Jakarta',
        organizer: 'IndoRunners Network',
        price: 'Rp125.000',
        slug: 'jakarta-sunrise-marathon-2026',
    },
    {
        id: 'f-4',
        image: 'soundscapes.jpg',
        category: 'Festival Musik',
        date: 'Sab, 30 Nov 2026 · 15:00 WIB',
        starts_at: '2026-11-30T15:00:00',
        title: 'Soundscapes Indie & Electronic Music Night',
        place: 'Campus Center Timur, Jakarta',
        organizer: 'Nusantara Live',
        price: 'Rp85.000',
        slug: 'soundscapes-indie-electronic-music-night',
    },
];

const popularEvents = [
    {
        id: 'p-1',
        image: 'startup.jpg',
        label: 'Populer',
        date: '14 - 15 Nov 2026',
        starts_at: '2026-11-14T09:00:00',
        title: 'Startup Growth Festival 2026: Scale Up Beyond...',
        place: 'JCC Senayan, Jakarta',
        price: 'Rp75.000',
        availability: 'Tersedia',
        slug: 'startup-growth-festival-2026',
    },
    {
        id: 'p-2',
        image: 'nusantara-indie.jpg',
        label: 'Hampir Habis',
        date: '21 Nov 2026',
        starts_at: '2026-11-21T18:30:00',
        title: 'Nusantara Indie Soundwave: Special Showcase Vol. 4',
        place: 'Bari Bintaro, Jakarta',
        price: 'Rp90.000',
        availability: 'Cepat Habis',
        slug: 'nusantara-indie-soundwave-vol-4',
    },
    {
        id: 'p-3',
        image: 'ai-product.jpg',
        label: 'Baru',
        date: '28 Nov 2026',
        starts_at: '2026-11-28T09:30:00',
        title: 'AI Product Management: From LLM to Production',
        place: 'Cilandak Town Square, Jakarta',
        price: 'Rp99.000',
        availability: 'Tersedia',
        slug: 'ai-product-management-from-llm-to-production',
    },
    {
        id: 'p-4',
        image: 'bandung-creative.jpg',
        label: 'Populer',
        date: '05 Des 2026',
        starts_at: '2026-12-05T10:00:00',
        title: 'Bandung Creative & Typography Showcase 2026',
        place: 'Margo City, Bandung',
        price: 'Rp50.000',
        availability: 'Tersedia',
        slug: 'bandung-creative-typography-showcase-2026',
    },
];

const nearbyEvents = [
    {
        id: 'n-1',
        date: '21 Okt 2026',
        time: '14:00 WIB',
        starts_at: '2026-10-21T14:00:00',
        title: 'FinTech Indonesia Leadership Summit 2026',
        place: 'Senayan, Jakarta',
        organizer: 'OJK / Asosiasi FinTech Indo',
        price: 'Rp200.000',
        slug: 'fintech-indonesia-leadership-summit-2026',
    },
    {
        id: 'n-2',
        date: '24 Okt 2026',
        time: '10:00 WIB',
        starts_at: '2026-10-24T10:00:00',
        title: 'Jakarta Art & Culture Installation Weekend',
        place: 'Museum Nasional, Jakarta',
        organizer: 'Dinas Pariwisata DKI Jakarta',
        price: 'Rp45.000',
        slug: 'jakarta-art-culture-installation-weekend',
    },
    {
        id: 'n-3',
        date: '24 Okt 2026',
        time: '15:00 WIB',
        starts_at: '2026-10-24T15:00:00',
        title: 'Indie Coffee & Culinary Expo',
        place: 'GBK Area, Jakarta Selatan',
        organizer: 'Kopi Nusantara Asosiasi',
        price: 'Rp35.000',
        slug: 'indie-coffee-culinary-expo',
    },
    {
        id: 'n-4',
        date: '25 Okt 2026',
        time: '09:00 WIB',
        starts_at: '2026-10-25T09:00:00',
        title: 'Product Design Thinking Interactive Jam',
        place: 'Menara BTPN, Mega Kuningan',
        organizer: 'GoJek UX / UI Design Hub Indo',
        price: 'Rp65.000',
        slug: 'product-design-thinking-interactive-jam',
    },
    {
        id: 'n-5',
        date: '28 Okt 2026',
        time: '16:00 WIB',
        starts_at: '2026-10-28T16:00:00',
        title: 'Jakarta Tech Meetup 2026',
        place: 'Kuningan City, Jakarta',
        organizer: 'Tech Community JKT',
        price: 'Gratis',
        slug: 'jakarta-tech-meetup-2026',
    },
    {
        id: 'n-6',
        date: '01 Nov 2026',
        time: '08:00 WIB',
        starts_at: '2026-11-01T08:00:00',
        title: 'Sunday Morning Yoga Session',
        place: 'Taman Menteng, Jakarta',
        organizer: 'Yoga Fit Jakarta',
        price: 'Rp50.000',
        slug: 'sunday-morning-yoga-session',
    },
    {
        id: 'n-7',
        date: '05 Nov 2026',
        time: '19:00 WIB',
        starts_at: '2026-11-05T19:00:00',
        title: 'Stand Up Comedy Night: Local Heroes',
        place: 'Kemang, Jakarta',
        organizer: 'Comedy Club ID',
        price: 'Rp100.000',
        slug: 'stand-up-comedy-night-local-heroes',
    },
    {
        id: 'n-8',
        date: '10 Nov 2026',
        time: '10:00 WIB',
        starts_at: '2026-11-10T10:00:00',
        title: 'Bazar UMKM Kreatif Nusantara',
        place: 'JIExpo Kemayoran, Jakarta',
        organizer: 'Kemenparekraf',
        price: 'Gratis',
        slug: 'bazar-umkm-kreatif-nusantara',
    },
];

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

export default function Home({ auth, categories = [], events = [], bookmarkedEventIds = [] }) {
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

    const allSearchableEvents = useMemo(() => {
        const list = events && events.length > 0 ? [...events] : [];
        featuredEvents.forEach((f) => {
            if (!list.some((x) => x.slug === f.slug)) {
                list.push(f);
            }
        });
        popularEvents.forEach((p) => {
            if (!list.some((x) => x.slug === p.slug)) {
                list.push({
                    id: p.id,
                    slug: p.slug,
                    image: p.image,
                    category: p.label || 'Populer',
                    date: p.date,
                    starts_at: p.starts_at,
                    title: p.title,
                    place: p.place,
                    organizer: 'Penyelenggara Hajirin',
                    price: p.price,
                });
            }
        });
        nearbyEvents.forEach((n) => {
            if (!list.some((x) => x.slug === n.slug)) {
                list.push({
                    id: n.id,
                    slug: n.slug,
                    image: 'tech_hero.jpg',
                    category: 'Event Terdekat',
                    date: n.date,
                    starts_at: n.starts_at,
                    title: n.title,
                    place: n.place,
                    organizer: n.organizer,
                    price: n.price,
                });
            }
        });
        return list;
    }, [events]);

    const isSearching =
        searchQuery.trim().length > 0 ||
        selectedLocation !== 'Semua Kota' ||
        selectedTime !== 'Semua Waktu';

    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        const q = searchQuery.trim().toLowerCase();

        return allSearchableEvents.filter((item) => {
            const matchText = !q || (item.title && item.title.toLowerCase().includes(q));

            const matchLocation =
                selectedLocation === 'Semua Kota' ||
                (item.place && item.place.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                (item.location &&
                    item.location.toLowerCase().includes(selectedLocation.toLowerCase()));

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
    }, [searchQuery, selectedLocation, selectedTime, isSearching, allSearchableEvents]);

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
        if (isCarouselPaused) return undefined;
        const timer = window.setInterval(() => {
            setActiveSlide((currentSlide) => (currentSlide + 1) % heroEvents.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, [isCarouselPaused]);

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
                    <div
                        className="group relative h-[520px] overflow-hidden rounded-xl bg-navy sm:h-[460px]"
                        onMouseEnter={() => setIsCarouselPaused(true)}
                        onMouseLeave={() => setIsCarouselPaused(false)}
                    >
                        {heroEvents.map((event, index) => (
                            <article
                                key={event.title}
                                className={`absolute inset-0 transition-opacity duration-700 ${
                                    index === activeSlide
                                        ? 'z-10 opacity-100'
                                        : 'pointer-events-none z-0 opacity-0'
                                }`}
                            >
                                <img
                                    src={event.image}
                                    alt=""
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
                                        <p className="mb-6 max-w-2xl text-sm text-slate-300 leading-relaxed line-clamp-2">
                                            {event.description}
                                        </p>
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

                        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 sm:left-10">
                            {heroEvents.map((event, index) => (
                                <button
                                    key={event.title}
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
                    </div>
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
                                    <option value="Jakarta">Jakarta</option>
                                    <option value="Surabaya">Surabaya</option>
                                    <option value="Bandung">Bandung</option>
                                    <option value="Yogyakarta">Yogyakarta</option>
                                    <option value="Bali">Bali</option>
                                    <option value="Tangerang">Tangerang</option>
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
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                {featuredEvents.map((evt) => (
                                    <FeaturedCard
                                        key={evt.title}
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
                        </section>

                        <SectionHeading
                            title="Sedang Populer"
                            description="Event yang paling banyak diminati minggu ini"
                            action="Lihat Semua"
                            actionHref="/kategori"
                        />
                        <section className="px-4 pb-10 sm:px-8 lg:px-10">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                {popularEvents.map((evt) => (
                                    <PopularCard key={evt.title} {...evt} />
                                ))}
                            </div>
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
                            <img src="/hajirin_icon.svg" alt="" className="h-7 w-auto" />
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
    const imageSrc = !image
        ? '/images/events/tech_hero.jpg'
        : image.startsWith('/')
          ? image
          : `/images/events/${image}`;

    return (
        <Link
            href={`/event/${slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
        >
            <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                    src={imageSrc}
                    alt=""
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

function PopularCard({ slug, image, label, date, title, place, price, availability }) {
    const isUrgent = label === 'Hampir Habis';

    return (
        <Link
            href={`/event/${slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 flex flex-col h-full"
        >
            <div className="relative h-40 overflow-hidden bg-slate-100 shrink-0">
                <img
                    src={`/images/events/${image}`}
                    alt=""
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                    {label}
                </span>
                {isUrgent && (
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-navy/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-xs tabular-nums">
                        Sisa 12 Tiket
                    </span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="mb-1 text-xs font-medium text-slate-500 tabular-nums">{date}</p>
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
