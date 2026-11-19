import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircleUserRound,
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
    X,
    TentTree,
    Users,
    UserRound,
    Volleyball,
    LogOut,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from '../Components/Auth/AuthModal';
import Navbar from '../Components/Navbar';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../Components/ui/Dialog';

const heroEvents = [
    {
        id: 'hero-1',
        image: '/images/events/hero_festival.jpg',
        category: 'Festival Musik',
        title: 'Festival Musik Nusantara 2026: Merayakan Harmoni Musisi Indie & Elektronik',
        date: '24 - 25 September 2026',
        starts_at: '2026-09-24T18:00:00',
        place: 'Stadion Gelora Bung Karno, Jakarta',
        description: 'Dimeriahkan oleh lebih dari 50 musisi lokal di 3 panggung epik. Rasakan pengalaman festival musik yang belum pernah ada sebelumnya.',
        price: 'Rp75.000',
        status: 'Tiket Tersedia',
        slug: 'festival-musik-nusantara-2026'
    },
    {
        id: 'hero-2',
        image: '/images/events/tech_hero.jpg',
        category: 'Konferensi Teknologi',
        title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering',
        date: '24 - 25 Oktober 2026',
        starts_at: '2026-10-24T09:00:00',
        place: 'ICE BSD Hall 1, Tangerang',
        description: 'Menghadirkan lebih dari 500 praktisi teknologi, arsitek cloud, peneliti AI, dan pakar industri untuk membentuk masa depan ekosistem perangkat lunak global.',
        price: 'Rp150.000',
        status: 'Tiket Tersedia',
        slug: 'indonesia-tech-conference-2026'
    },
    {
        id: 'hero-3',
        image: '/images/events/marathon_hero.jpg',
        category: 'Olahraga',
        title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet',
        date: '01 November 2026',
        starts_at: '2026-11-01T05:30:00',
        place: 'Plaza FX Sudirman, Jakarta',
        description: 'Berlari bersama ribuan penggiat kebugaran menyusuri fajar kota Jakarta. Setiap kilometer donasi untuk reboisasi hutan nusantara.',
        price: 'Rp125.000',
        status: 'Tiket Tersedia',
        slug: 'jakarta-sunrise-marathon-2026'
    },
    {
        id: 'hero-4',
        image: '/images/events/startup.jpg',
        category: 'Bisnis & Startup',
        title: 'Startup Growth Festival 2026: Scale Up Beyond Boundaries',
        date: '14 - 15 November 2026',
        starts_at: '2026-11-14T09:00:00',
        place: 'JCC Senayan, Jakarta',
        description: 'Akselerasi bisnismu ke level berikutnya bersama para venture capital, unicorn founders, dan praktisi growth marketing terbaik di Asia Tenggara.',
        price: 'Rp75.000',
        status: 'Populer',
        slug: 'startup-growth-festival-2026'
    },
];

const featuredEvents = [
    { id: 'f-1', image: 'tech_hero.jpg', category: 'KONFERENSI TEKNOLOGI', date: 'Sab, 24 Okt 2026 • 09:00 WIB', starts_at: '2026-10-24T09:00:00', title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering', place: 'ICE BSD Hall 1, Tangerang', organizer: 'Tech Innovation Indonesia', price: 'Rp150.000', slug: 'indonesia-tech-conference-2026' },
    { id: 'f-2', image: 'design_hero.jpg', category: 'WORKSHOP', date: 'Sab, 25 Okt 2026 • 10:00 WIB', starts_at: '2026-10-25T10:00:00', title: 'Creative Design & Typography Workshop 2026', place: 'Margo City, Bandung', organizer: 'Kreator Nusantara', price: 'Rp50.000', slug: 'creative-design-typography-workshop-2026' },
    { id: 'f-3', image: 'marathon_hero.jpg', category: 'OLAHRAGA', date: 'Min, 01 Nov 2026 • 05:30 WIB', starts_at: '2026-11-01T05:30:00', title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet', place: 'Plaza FX Sudirman, Jakarta', organizer: 'IndoRunners Network', price: 'Rp125.000', slug: 'jakarta-sunrise-marathon-2026' },
    { id: 'f-4', image: 'soundscapes.jpg', category: 'FESTIVAL MUSIK', date: 'Sab, 30 Nov 2026 • 15:00 WIB', starts_at: '2026-11-30T15:00:00', title: 'Soundscapes Indie & Electronic Music Night', place: 'Campus Center Timur, Jakarta', organizer: 'Nusantara Live', price: 'Rp85.000', slug: 'soundscapes-indie-electronic-music-night' },
];

const popularEvents = [
    { id: 'p-1', image: 'startup.jpg', label: 'Populer', date: '14 - 15 Nov 2026', starts_at: '2026-11-14T09:00:00', title: 'Startup Growth Festival 2026: Scale Up Beyond...', place: 'JCC Senayan, Jakarta', price: 'Rp75.000', availability: 'Tersedia', slug: 'startup-growth-festival-2026' },
    { id: 'p-2', image: 'nusantara-indie.jpg', label: 'Hampir Habis', date: '21 Nov 2026', starts_at: '2026-11-21T18:30:00', title: 'Nusantara Indie Soundwave: Special Showcase Vol. 4', place: 'Bari Bintaro, Jakarta', price: 'Rp90.000', availability: 'Cepat Habis', slug: 'nusantara-indie-soundwave-vol-4' },
    { id: 'p-3', image: 'ai-product.jpg', label: 'Baru', date: '28 Nov 2026', starts_at: '2026-11-28T09:30:00', title: 'AI Product Management: From LLM to Production', place: 'Cilandak Town Square, Jakarta', price: 'Rp99.000', availability: 'Tersedia', slug: 'ai-product-management-from-llm-to-production' },
    { id: 'p-4', image: 'bandung-creative.jpg', label: 'Populer', date: '05 Des 2026', starts_at: '2026-12-05T10:00:00', title: 'Bandung Creative & Typography Showcase 2026', place: 'Margo City, Bandung', price: 'Rp50.000', availability: 'Tersedia', slug: 'bandung-creative-typography-showcase-2026' },
];

const nearbyEvents = [
    { id: 'n-1', date: '21 Okt 2026', time: '14:00 WIB', starts_at: '2026-10-21T14:00:00', title: 'FinTech Indonesia Leadership Summit 2026', place: 'Senayan, Jakarta', organizer: 'OJK / Asosiasi FinTech Indo', price: 'Rp200.000', slug: 'fintech-indonesia-leadership-summit-2026' },
    { id: 'n-2', date: '24 Okt 2026', time: '10:00 WIB', starts_at: '2026-10-24T10:00:00', title: 'Jakarta Art & Culture Installation Weekend', place: 'Museum Nasional, Jakarta', organizer: 'Dinas Pariwisata DKI Jakarta', price: 'Rp45.000', slug: 'jakarta-art-culture-installation-weekend' },
    { id: 'n-3', date: '24 Okt 2026', time: '15:00 WIB', starts_at: '2026-10-24T15:00:00', title: 'Indie Coffee & Culinary Expo', place: 'GBK Area, Jakarta Selatan', organizer: 'Kopi Nusantara Asosiasi', price: 'Rp35.000', slug: 'indie-coffee-culinary-expo' },
    { id: 'n-4', date: '25 Okt 2026', time: '09:00 WIB', starts_at: '2026-10-25T09:00:00', title: 'Product Design Thinking Interactive Jam', place: 'Menara BTPN, Mega Kuningan', organizer: 'GoJek UX / UI Design Hub Indo', price: 'Rp65.000', slug: 'product-design-thinking-interactive-jam' },
    { id: 'n-5', date: '28 Okt 2026', time: '16:00 WIB', starts_at: '2026-10-28T16:00:00', title: 'Jakarta Tech Meetup 2026', place: 'Kuningan City, Jakarta', organizer: 'Tech Community JKT', price: 'Gratis', slug: 'jakarta-tech-meetup-2026' },
    { id: 'n-6', date: '01 Nov 2026', time: '08:00 WIB', starts_at: '2026-11-01T08:00:00', title: 'Sunday Morning Yoga Session', place: 'Taman Menteng, Jakarta', organizer: 'Yoga Fit Jakarta', price: 'Rp50.000', slug: 'sunday-morning-yoga-session' },
    { id: 'n-7', date: '05 Nov 2026', time: '19:00 WIB', starts_at: '2026-11-05T19:00:00', title: 'Stand Up Comedy Night: Local Heroes', place: 'Kemang, Jakarta', organizer: 'Comedy Club ID', price: 'Rp100.000', slug: 'stand-up-comedy-night-local-heroes' },
    { id: 'n-8', date: '10 Nov 2026', time: '10:00 WIB', starts_at: '2026-11-10T10:00:00', title: 'Bazar UMKM Kreatif Nusantara', place: 'JIExpo Kemayoran, Jakarta', organizer: 'Kemenparekraf', price: 'Gratis', slug: 'bazar-umkm-kreatif-nusantara' },
];

export default function Home({ auth, categories = [], events = [], bookmarkedEventIds = [] }) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [logoutToast, setLogoutToast] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // State untuk bookmark event
    const [bookmarkedSet, setBookmarkedSet] = useState(new Set(bookmarkedEventIds || []));

    // Sinkronisasi saat bookmarkedEventIds dari backend diperbarui
    useEffect(() => {
        setBookmarkedSet(new Set(bookmarkedEventIds || []));
    }, [bookmarkedEventIds]);

    // State untuk fitur pencarian
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
                    const searchEl = document.getElementById('search-section') || document.getElementById('hasil-pencarian');
                    if (searchEl) searchEl.scrollIntoView({ behavior: 'smooth' });
                }, 350);
            }
        }
    }, []);

    // Toggle bookmark event
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

        // Kirim targetIdentifier (slug atau eventId) ke endpoint bookmark
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
                            : 'Penanda telah berhasil dan tersimpan di halaman bookmark!',
                    });
                },
                onError: () => {
                    // Revert state jika gagal
                    setBookmarkedSet(new Set(bookmarkedSet));
                    setLogoutToast({
                        type: 'error',
                        message: 'Gagal memperbarui simpanan event.',
                    });
                },
            }
        );
    }

    // Daftar semua event yang dapat dicari (gabungan dari database dan fallback data)
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

    const isSearching = searchQuery.trim().length > 0 || selectedLocation !== 'Semua Kota' || selectedTime !== 'Semua Waktu';

    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        const q = searchQuery.trim().toLowerCase();

        return allSearchableEvents.filter((item) => {
            const matchText =
                !q ||
                (item.title && item.title.toLowerCase().includes(q)) ||
                (item.category && item.category.toLowerCase().includes(q)) ||
                (item.place && item.place.toLowerCase().includes(q)) ||
                (item.location && item.location.toLowerCase().includes(q)) ||
                (item.organizer && item.organizer.toLowerCase().includes(q));

            const matchLocation =
                selectedLocation === 'Semua Kota' ||
                (item.place && item.place.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                (item.location && item.location.toLowerCase().includes(selectedLocation.toLowerCase()));

            // Filter Waktu (Semua Waktu, Hari Ini, Minggu Ini, Bulan Ini)
            let matchTime = true;
            if (selectedTime !== 'Semua Waktu') {
                const eventDate = item.starts_at ? new Date(item.starts_at) : null;
                if (eventDate && !isNaN(eventDate.getTime())) {
                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

                    if (selectedTime === 'Hari Ini') {
                        matchTime = eventDate >= startOfToday && eventDate <= endOfToday;
                    } else if (selectedTime === 'Minggu Ini') {
                        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
                        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1));
                        const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);
                        matchTime = eventDate >= startOfWeek && eventDate <= endOfWeek;
                    } else if (selectedTime === 'Bulan Ini') {
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                        matchTime = eventDate >= startOfMonth && eventDate <= endOfMonth;
                    }
                }
            }

            return matchText && matchLocation && matchTime;
        });
    }, [searchQuery, selectedLocation, selectedTime, isSearching, allSearchableEvents]);

    function handleNavbarSearchClick() {
        const searchSection = document.getElementById('search-section');
        if (searchSection) {
            searchSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 300);
        }
    }

    function handleNavbarSearchSubmit(e) {
        if (e) e.preventDefault();
        const resultsEl = document.getElementById('hasil-pencarian') || document.getElementById('search-section');
        if (resultsEl) {
            resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function handleSearchSubmit(e) {
        if (e) e.preventDefault();
        const resultsEl = document.getElementById('hasil-pencarian') || document.getElementById('search-section');
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
        setActiveSlide((currentSlide) => (currentSlide + offset + heroEvents.length) % heroEvents.length);
    }

    function confirmLogout() {
        router.post(
            '/logout',
            {},
            {
                onStart: () => setIsLoggingOut(true),
                onSuccess: () => {
                    setIsLogoutConfirmOpen(false);
                    setLogoutToast({ type: 'success', message: 'Berhasil keluar dari akun.' });
                },
                onError: () => {
                    setLogoutToast({ type: 'error', message: 'Gagal keluar. Periksa koneksi lalu coba lagi.' });
                },
                onFinish: () => setIsLoggingOut(false),
            },
        );
    }

    const getCategoryIcon = (slug) => {
        const iconMap = {
            'musik': Headphones,
            'seminar': Users,
            'workshop': Palette,
            'olahraga': Volleyball,
            'komunitas': UserRound,
            'festival': TentTree,
            'pameran': LayoutGrid,
            'lainnya': Menu
        };
        return iconMap[slug] || Menu;
    };

    return (
        <>
            <Head title="Hajirin - Event & Ticketing" />

            <Navbar
                auth={auth}
                onOpenAuthModal={openAuthModal}
                initialSearchQuery={searchQuery}
                onSearch={(q) => setSearchQuery(q)}
            />

            <main>
                <section className="px-4 py-6 sm:px-8 lg:px-10">
                    <div className="group relative h-[540px] overflow-hidden rounded-2xl bg-navy sm:h-[480px]" onMouseEnter={() => setIsCarouselPaused(true)} onMouseLeave={() => setIsCarouselPaused(false)}>
                        {heroEvents.map((event, index) => (
                            <article key={event.title} className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
                                <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                                    <div className="max-w-3xl">
                                        <div className="mb-4 flex flex-wrap items-center gap-3">
                                            <span className="rounded border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">{event.category}</span>
                                            <span className={`rounded border px-3 py-1 text-xs font-semibold ${event.status === 'Populer' ? 'border-blue-400/40 bg-brand-blue/30 text-blue-200' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}>{event.status}</span>
                                        </div>
                                        <h1 className="mb-3 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
                                        <div className="mb-4 flex flex-col gap-2 text-sm text-gray-200 sm:flex-row sm:gap-6">
                                            <span className="flex items-center"><CalendarDays className="mr-2 size-4" />{event.date}</span>
                                            <span className="flex items-center"><MapPin className="mr-2 size-4" />{event.place}</span>
                                        </div>
                                        <p className="mb-6 max-w-2xl text-sm text-gray-200 sm:mb-8">{event.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                            <div><p className="mb-1 text-xs text-gray-300">Harga Tiket Mulai</p><p className="text-2xl font-bold">Mulai dari {event.price}</p></div>
                                            
                                            {/* Link tombol hero ke halaman detail */}
                                            <Link href={`/event/${event.slug}`} className="inline-flex items-center rounded-lg bg-brand-blue px-6 py-3 text-sm font-semibold shadow-md transition hover:bg-blue-800">Lihat Event <ArrowRight className="ml-2 size-4" /></Link>
                                            
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleBookmark(event.id, event.slug, event.title, e)}
                                                aria-label={bookmarkedSet.has(event.id) || bookmarkedSet.has(event.slug) ? `Hapus simpanan ${event.title}` : `Simpan ${event.title}`}
                                                className={`flex size-11 items-center justify-center rounded-lg border transition ${
                                                    bookmarkedSet.has(event.id) || bookmarkedSet.has(event.slug)
                                                        ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                                                        : 'border-white/30 text-white hover:bg-white/10'
                                                }`}
                                            >
                                                <Bookmark className="size-5" fill={bookmarkedSet.has(event.id) || bookmarkedSet.has(event.slug) ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}

                        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 sm:bottom-6 sm:left-10">
                            {heroEvents.map((event, index) => <button key={event.title} type="button" aria-label={`Tampilkan ${event.title}`} onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-brand-blue' : 'w-2 bg-white/40 hover:bg-white/70'}`} />)}
                        </div>
                        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3 sm:bottom-10 sm:right-10">
                            <button type="button" aria-label="Slide sebelumnya" onClick={() => changeSlide(-1)} className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/20"><ChevronLeft className="size-5" /></button>
                            <button type="button" aria-label="Slide selanjutnya" onClick={() => changeSlide(1)} className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/20"><ChevronRight className="size-5" /></button>
                        </div>
                    </div>
                </section>

                <section id="search-section" className="px-4 py-4 sm:px-8 lg:px-10">
                    <form onSubmit={handleSearchSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                        <h2 className="mb-4 text-lg font-bold text-navy">Ada event apa yang ingin kamu datangi?</h2>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <label className="relative flex-1">
                                <span className="sr-only">Cari event</span>
                                <Search className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama event, artis, atau penyelenggara..."
                                    className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Hapus pencarian"
                                        className="absolute right-3 top-3.5 text-gray-400 transition hover:text-gray-600"
                                    >
                                        <X className="size-5" />
                                    </button>
                                )}
                            </label>
                            <label className="relative md:w-56">
                                <span className="sr-only">Lokasi</span>
                                <MapPin className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" />
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="h-12 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm font-medium text-gray-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                >
                                    <option value="Semua Kota">Semua Kota</option>
                                    <option value="Jakarta">Jakarta</option>
                                    <option value="Surabaya">Surabaya</option>
                                    <option value="Bandung">Bandung</option>
                                    <option value="Yogyakarta">Yogyakarta</option>
                                    <option value="Bali">Bali</option>
                                    <option value="Tangerang">Tangerang</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-5 text-gray-400" />
                            </label>
                            <label className="relative md:w-56">
                                <span className="sr-only">Tanggal</span>
                                <CalendarDays className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" />
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="h-12 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm font-medium text-gray-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                >
                                    <option value="Semua Waktu">Semua Waktu</option>
                                    <option value="Hari Ini">Hari Ini</option>
                                    <option value="Minggu Ini">Minggu Ini</option>
                                    <option value="Bulan Ini">Bulan Ini</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-5 text-gray-400" />
                            </label>
                            <button
                                type="submit"
                                className="h-12 rounded-lg bg-brand-blue px-6 text-sm font-semibold text-white transition hover:bg-blue-800"
                            >
                                Cari Event
                            </button>
                        </div>
                    </form>
                </section>

                {isSearching ? (
                    <section id="hasil-pencarian" className="px-4 py-8 sm:px-8 lg:px-10">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-navy">Hasil Pencarian</h2>
                                <p className="text-sm text-slate">
                                    {searchResults.length > 0
                                        ? `Menampilkan ${searchResults.length} event untuk "${searchQuery || selectedLocation}"`
                                        : 'Tidak ditemukan event yang cocok'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-navy"
                            >
                                <RotateCcw className="size-4" />
                                Reset Pencarian
                            </button>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                {searchResults.map((evt, idx) => (
                                    <FeaturedCard
                                        key={evt.slug || evt.id || idx}
                                        {...evt}
                                        isBookmarked={bookmarkedSet.has(evt.id) || bookmarkedSet.has(evt.slug)}
                                        onToggleBookmark={(e) => handleToggleBookmark(evt.id, evt.slug, evt.title, e)}
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
                            <div className="my-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-4 py-16 text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                                    <SearchX className="size-8" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-navy">
                                    Tidak Ada Hasil Pencarian
                                </h3>
                                <p className="mb-6 max-w-md text-sm text-slate">
                                    {searchQuery ? (
                                        <>
                                            Maaf, kami tidak dapat menemukan event dengan kata kunci{' '}
                                            <span className="font-semibold text-navy">"{searchQuery}"</span>
                                            {selectedLocation !== 'Semua Kota' && (
                                                <> di kota <span className="font-semibold text-navy">"{selectedLocation}"</span></>
                                            )}
                                            .
                                        </>
                                    ) : (
                                        <>
                                            Maaf, saat ini belum ada event yang tersedia di kota{' '}
                                            <span className="font-semibold text-navy">"{selectedLocation}"</span>.
                                        </>
                                    )}
                                    {' '}Coba gunakan kata kunci lain atau reset filter pencarian.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResetSearch}
                                    className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                                >
                                    <RotateCcw className="size-4" />
                                    Reset Pencarian & Tampilkan Semua Event
                                </button>
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <SectionHeading id="event-unggulan" title="Event Unggulan Minggu Ini" description="Pilihan event terbaik yang sayang untuk dilewatkan" action="Lihat Semua" />
                        <section className="px-4 pb-8 sm:px-8 lg:px-10">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                {featuredEvents.map((evt) => (
                                    <FeaturedCard
                                        key={evt.title}
                                        {...evt}
                                        isBookmarked={bookmarkedSet.has(evt.id) || bookmarkedSet.has(evt.slug)}
                                        onToggleBookmark={(e) => handleToggleBookmark(evt.id, evt.slug, evt.title, e)}
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

                        <SectionHeading title="Sedang Populer" description="Event yang sedang banyak dilihat minggu ini" action="Lihat Semua" />
                        <section className="px-4 pb-8 sm:px-8 lg:px-10">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                {popularEvents.map((evt) => <PopularCard key={evt.title} {...evt} />)}
                            </div>
                        </section>

                        <section id="kategori" className="border-y border-gray-100 bg-lightgray px-4 py-8 sm:px-8 lg:px-10">
                            <h2 className="mb-1 text-2xl font-bold text-navy">Jelajahi Berdasarkan Kategori</h2>
                            <p className="mb-6 text-sm text-slate">Temukan event sesuai minat dan hobi kamu</p>
                            
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
                                {categories.map((cat) => {
                                    const IconComponent = getCategoryIcon(cat.slug);
                                    return (
                                        <Link key={cat.id} href={`/kategori/${cat.slug}`} className="group flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-blue hover:text-brand-blue">
                                            <IconComponent className="mb-2 size-7 text-gray-400 transition group-hover:text-brand-blue" />
                                            <span className="text-sm font-semibold">{cat.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}

                <section className="px-4 py-10 sm:px-8 lg:px-10"><div className="relative flex flex-col items-center justify-between overflow-hidden rounded-2xl bg-navy p-8 text-center md:flex-row md:p-10 md:text-left"><div className="absolute -right-32 -top-32 size-64 rounded-full bg-brand-blue/10 blur-3xl" /><div className="relative z-10 max-w-2xl text-white"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-yellow-400">Untuk Penyelenggara Acara</p><h2 className="mb-3 text-3xl font-bold">Punya acara yang ingin kamu selenggarakan?</h2><p className="text-sm text-gray-300">Kelola event, jual tiket secara digital dalam satu sistem, dan pantau secara real-time dari tingkat pengunjung hingga hasil penjualanmu!</p></div><div className="relative z-10 mt-6 flex flex-col items-center md:mt-0 md:items-end"><button type="button" onClick={handleCreateEventClick} className="inline-flex items-center rounded-lg bg-brand-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/30 hover:bg-blue-800"><PlusCircle className="mr-2 size-4" />Mulai Buat Event</button><a href="#event-unggulan" className="mt-3 inline-flex items-center text-xs text-gray-300 hover:text-white hover:underline">Pelajari lebih lanjut <ArrowRight className="ml-1 size-3" /></a></div></div></section>
            </main>

            <footer className="border-t border-gray-100 bg-white px-4 pb-6 pt-12 sm:px-8 lg:px-10"><div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4"><div className="pr-4"><div className="mb-4 flex items-center gap-2"><img src="/hajirin_icon.svg" alt="" className="h-8 w-auto" /><span className="text-xl font-bold tracking-tighter">HAJIRIN</span></div><p className="mb-6 text-xs leading-relaxed text-slate">Platform e-ticketing aggregate komunitas dan ekosistem penyelenggara event terpercaya di Indonesia.</p><FooterLinks links={['Tentang Hajirin', 'Karir Kami', 'Kontak']} /></div><FooterColumn title="Untuk Pengunjung" links={['Jelajah Event', 'Kategori', 'Beli Tiket']} /><FooterColumn title="Untuk EO" links={['Buat Event', 'Harga Tiket']} onDashboardClick={handleCreateEventClick} /><FooterColumn title="Informasi" links={['Syarat & Ketentuan', 'Kebijakan Privasi', 'FAQ']} /></div><div className="flex flex-col items-center justify-between border-t border-gray-100 pt-6 text-[11px] text-gray-400 md:flex-row"><p>© 2026 Hajirin - Platform E-ticketing & Management Event Indonesia</p><span className="mt-4 md:mt-0">Pilih Bahasa: Bahasa Indonesia</span></div></footer>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authView} />

            <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
                <DialogContent onClose={() => setIsLogoutConfirmOpen(false)} className="p-6 sm:p-7">
                    <DialogTitle>Keluar dari akun?</DialogTitle>
                    <DialogDescription className="mt-2">Kamu perlu masuk kembali untuk mengakses akun dan fitur personal.</DialogDescription>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsLogoutConfirmOpen(false)} disabled={isLoggingOut} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
                        <button type="button" onClick={confirmLogout} disabled={isLoggingOut} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{isLoggingOut ? 'Memproses…' : 'Ya, keluar'}</button>
                    </div>
                </DialogContent>
            </Dialog>

            {logoutToast && (
                <div role="status" aria-live="polite" className={`fixed right-4 top-20 z-[120] flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${logoutToast.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
                    {logoutToast.type === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" />}
                    <p className="flex-1 text-sm font-medium text-gray-800">{logoutToast.message}</p>
                    <button type="button" onClick={() => setLogoutToast(null)} aria-label="Tutup notifikasi" className="text-gray-400 hover:text-gray-700"><X className="size-4" /></button>
                </div>
            )}
        </>
    );
}

function SectionHeading({ id, title, description, action, actionHref }) {
    return (
        <section id={id} className="flex items-end justify-between px-4 pb-6 pt-8 sm:px-8 lg:px-10">
            <div>
                <h2 className="mb-1 text-2xl font-bold text-navy">{title}</h2>
                <p className="text-sm text-slate">{description}</p>
            </div>
            {action && (
                <Link
                    href={actionHref || '#'}
                    className="hidden items-center text-sm font-semibold text-brand-blue hover:underline sm:flex"
                >
                    {action} <ArrowRight className="ml-1 size-4" />
                </Link>
            )}
        </section>
    );
}

// Komponen Card diubah menggunakan <Link>
function FeaturedCard({ slug, image, category, date, title, place, organizer, price, isBookmarked, onToggleBookmark, onBuyTicket }) {
    const imageSrc = !image ? '/images/events/tech_hero.jpg' : image.startsWith('/') ? image : `/images/events/${image}`;

    return (
        <Link href={`/event/${slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
            <div className="relative h-48 overflow-hidden bg-gray-200">
                <img src={imageSrc} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                {category && (
                    <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                        {category}
                    </span>
                )}
                <button
                    type="button"
                    onClick={onToggleBookmark}
                    aria-label={isBookmarked ? `Hapus ${title} dari simpanan` : `Simpan ${title}`}
                    className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-full shadow-sm transition ${
                        isBookmarked
                            ? 'bg-brand-blue text-white'
                            : 'bg-white text-gray-400 hover:text-navy'
                    }`}
                >
                    <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className="flex flex-grow flex-col p-4">
                {date && <p className="mb-1 flex items-center text-[11px] font-semibold text-brand-blue"><CalendarDays className="mr-1 size-3" />{date}</p>}
                <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-navy group-hover:text-brand-blue transition-colors">{title}</h3>
                <div className="mt-auto">
                    {place && <p className="mb-1 flex items-center text-xs text-slate"><MapPin className="mr-1 size-3" />{place}</p>}
                    {organizer && <p className="flex items-center text-xs text-slate"><CircleUserRound className="mr-1 size-3" />{organizer}</p>}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
                <div>
                    <p className="text-[10px] text-gray-500">Mulai dari</p>
                    <p className="text-lg font-bold text-brand-blue">{price || 'Rp0'}</p>
                </div>
                <button type="button" onClick={onBuyTicket} className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold hover:bg-gray-100 text-navy">Beli Tiket</button>
            </div>
        </Link>
    );
}

function PopularCard({ slug, image, label, date, title, place, price, availability }) {
    const isUrgent = label === 'Hampir Habis';
    const isNew = label === 'Baru';
    const labelClass = isUrgent ? 'border border-orange-200 bg-orange-100 text-orange-600' : isNew ? 'border border-emerald-200 bg-emerald-100 text-emerald-600' : 'bg-brand-blue text-white';
    
    return (
        <Link href={`/event/${slug}`} className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg flex flex-col h-full">
            <div className="relative h-40 overflow-hidden bg-gray-200 shrink-0">
                <img src={`/images/events/${image}`} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className={`absolute left-3 top-3 rounded px-2 py-1 text-[10px] font-bold tracking-wide shadow-sm ${labelClass}`}>{label}</span>
                {isUrgent && <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">Sisa 12 Tiket</span>}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="mb-1 text-[11px] font-semibold text-slate">{date}</p>
                <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-tight text-navy group-hover:text-brand-blue transition-colors">{title}</h3>
                <p className="mb-4 flex items-center text-xs text-slate mt-auto"><MapPin className="mr-1 size-3 text-gray-400 shrink-0" /><span className="truncate">{place}</span></p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-lg font-bold text-brand-blue">{price}</p>
                    <p className={`text-xs font-medium ${isUrgent ? 'font-bold text-orange-500' : 'text-gray-500'}`}>{availability}</p>
                </div>
            </div>
        </Link>
    );
}

function NearbyCard({ slug, date, time, title, place, organizer, price }) {
    return (
        <Link href={`/event/${slug}`} className="flex flex-col h-full rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md group">
            <div className="mb-2 flex justify-between text-[11px] font-semibold text-slate">
                <span className="text-brand-blue">{date}</span>
                <span>{time}</span>
            </div>
            <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-tight text-navy group-hover:text-brand-blue transition-colors">{title}</h3>
            <div className="mt-auto pt-3 border-t border-gray-50 border-dashed">
                <p className="mb-1 flex items-center text-xs text-slate"><MapPin className="mr-1 size-3 text-gray-400 shrink-0" /><span className="truncate">{place}</span></p>
                <p className="mb-4 flex items-center text-[11px] text-slate"><CircleUserRound className="mr-1 size-3 text-gray-400 shrink-0" /><span className="truncate">{organizer}</span></p>
                <div className="flex items-center justify-between">
                    <p className="font-bold text-navy text-base">{price}</p>
                    <span className="inline-flex items-center text-xs font-semibold text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        Detail <ArrowRight className="ml-1 size-3" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

function FooterColumn({ title, links, onDashboardClick }) {
    return <div><h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-navy">{title}</h2><FooterLinks links={links} />{onDashboardClick && <button type="button" onClick={onDashboardClick} className="mt-3 text-xs text-slate hover:text-brand-blue">Masuk Dashboard</button>}</div>;
}

function FooterLinks({ links }) {
    return <div className="flex flex-col gap-3 text-xs text-slate">{links.map((link) => <a key={link} href="#" className="hover:text-brand-blue">{link}</a>)}</div>;
}