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
    CheckCircle2,
    CircleAlert,
    X,
    TentTree,
    Users,
    UserRound,
    Volleyball,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AuthModal from '../Components/Auth/AuthModal';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../Components/ui/Dialog';

const heroEvents = [
    {
        image: '/images/events/hero_festival.jpg',
        category: 'Festival Musik',
        title: 'Festival Musik Nusantara 2026: Merayakan Harmoni Musisi Indie & Elektronik',
        date: '24 - 25 September 2026',
        place: 'Stadion Gelora Bung Karno, Jakarta',
        description: 'Dimeriahkan oleh lebih dari 50 musisi lokal di 3 panggung epik. Rasakan pengalaman festival musik yang belum pernah ada sebelumnya.',
        price: 'Rp75.000',
        status: 'Tiket Tersedia',
        slug: 'festival-musik-nusantara-2026'
    },
    {
        image: '/images/events/tech_hero.jpg',
        category: 'Konferensi Teknologi',
        title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering',
        date: '24 - 25 Oktober 2026',
        place: 'ICE BSD Hall 1, Tangerang',
        description: 'Menghadirkan lebih dari 500 praktisi teknologi, arsitek cloud, peneliti AI, dan pakar industri untuk membentuk masa depan ekosistem perangkat lunak global.',
        price: 'Rp150.000',
        status: 'Tiket Tersedia',
        slug: 'indonesia-tech-conference-2026'
    },
    {
        image: '/images/events/marathon_hero.jpg',
        category: 'Olahraga',
        title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet',
        date: '01 November 2026',
        place: 'Plaza FX Sudirman, Jakarta',
        description: 'Berlari bersama ribuan penggiat kebugaran menyusuri fajar kota Jakarta. Setiap kilometer donasi untuk reboisasi hutan nusantara.',
        price: 'Rp125.000',
        status: 'Tiket Tersedia',
        slug: 'jakarta-sunrise-marathon-2026'
    },
    {
        image: '/images/events/startup.jpg',
        category: 'Bisnis & Startup',
        title: 'Startup Growth Festival 2026: Scale Up Beyond Boundaries',
        date: '14 - 15 November 2026',
        place: 'JCC Senayan, Jakarta',
        description: 'Akselerasi bisnismu ke level berikutnya bersama para venture capital, unicorn founders, dan praktisi growth marketing terbaik di Asia Tenggara.',
        price: 'Rp75.000',
        status: 'Populer',
        slug: 'startup-growth-festival-2026'
    },
];

const featuredEvents = [
    { image: 'tech_hero.jpg', category: 'KONFERENSI TEKNOLOGI', date: 'Sab, 24 Okt 2026 • 09:00 WIB', title: 'Indonesia Tech Conference 2026: The Future of AI & Engineering', place: 'ICE BSD Hall 1, Tangerang', organizer: 'Tech Innovation Indonesia', price: 'Rp150.000', slug: 'indonesia-tech-conference-2026' },
    { image: 'design_hero.jpg', category: 'WORKSHOP', date: 'Sab, 25 Okt 2026 • 10:00 WIB', title: 'Creative Design & Typography Workshop 2026', place: 'Margo City, Bandung', organizer: 'Kreator Nusantara', price: 'Rp50.000', slug: 'creative-design-typography-workshop-2026' },
    { image: 'marathon_hero.jpg', category: 'OLAHRAGA', date: 'Min, 01 Nov 2026 • 05:30 WIB', title: 'Jakarta Sunrise Marathon 2026: Run for Green Planet', place: 'Plaza FX Sudirman, Jakarta', organizer: 'IndoRunners Network', price: 'Rp125.000', slug: 'jakarta-sunrise-marathon-2026' },
    { image: 'soundscapes.jpg', category: 'FESTIVAL MUSIK', date: 'Sab, 30 Nov 2026 • 15:00 WIB', title: 'Soundscapes Indie & Electronic Music Night', place: 'Campus Center Timur, Jakarta', organizer: 'Nusantara Live', price: 'Rp85.000', slug: 'soundscapes-indie-electronic-music-night' },
];

const popularEvents = [
    { image: 'startup.jpg', label: 'Populer', date: '14 - 15 Nov 2026', title: 'Startup Growth Festival 2026: Scale Up Beyond...', place: 'JCC Senayan, Jakarta', price: 'Rp75.000', availability: 'Tersedia', slug: 'startup-growth-festival-2026' },
    { image: 'nusantara-indie.jpg', label: 'Hampir Habis', date: '21 Nov 2026', title: 'Nusantara Indie Soundwave: Special Showcase Vol. 4', place: 'Bari Bintaro, Jakarta', price: 'Rp90.000', availability: 'Cepat Habis', slug: 'nusantara-indie-soundwave-vol-4' },
    { image: 'ai-product.jpg', label: 'Baru', date: '28 Nov 2026', title: 'AI Product Management: From LLM to Production', place: 'Cilandak Town Square, Jakarta', price: 'Rp99.000', availability: 'Tersedia', slug: 'ai-product-management-from-llm-to-production' },
    { image: 'bandung-creative.jpg', label: 'Populer', date: '05 Des 2026', title: 'Bandung Creative & Typography Showcase 2026', place: 'Margo City, Bandung', price: 'Rp50.000', availability: 'Tersedia', slug: 'bandung-creative-typography-showcase-2026' },
];

const nearbyEvents = [
    { date: '21 Okt 2026', time: '14:00 WIB', title: 'FinTech Indonesia Leadership Summit 2026', place: 'Senayan, Jakarta', organizer: 'OJK / Asosiasi FinTech Indo', price: 'Rp200.000', slug: 'fintech-indonesia-leadership-summit-2026' },
    { date: '24 Okt 2026', time: '10:00 WIB', title: 'Jakarta Art & Culture Installation Weekend', place: 'Museum Nasional, Jakarta', organizer: 'Dinas Pariwisata DKI Jakarta', price: 'Rp45.000', slug: 'jakarta-art-culture-installation-weekend' },
    { date: '24 Okt 2026', time: '15:00 WIB', title: 'Indie Coffee & Culinary Expo', place: 'GBK Area, Jakarta Selatan', organizer: 'Kopi Nusantara Asosiasi', price: 'Rp35.000', slug: 'indie-coffee-culinary-expo' },
    { date: '25 Okt 2026', time: '09:00 WIB', title: 'Product Design Thinking Interactive Jam', place: 'Menara BTPN, Mega Kuningan', organizer: 'GoJek UX / UI Design Hub Indo', price: 'Rp65.000', slug: 'product-design-thinking-interactive-jam' },
    { date: '28 Okt 2026', time: '16:00 WIB', title: 'Jakarta Tech Meetup 2026', place: 'Kuningan City, Jakarta', organizer: 'Tech Community JKT', price: 'Gratis', slug: 'jakarta-tech-meetup-2026' },
    { date: '01 Nov 2026', time: '08:00 WIB', title: 'Sunday Morning Yoga Session', place: 'Taman Menteng, Jakarta', organizer: 'Yoga Fit Jakarta', price: 'Rp50.000', slug: 'sunday-morning-yoga-session' },
    { date: '05 Nov 2026', time: '19:00 WIB', title: 'Stand Up Comedy Night: Local Heroes', place: 'Kemang, Jakarta', organizer: 'Comedy Club ID', price: 'Rp100.000', slug: 'stand-up-comedy-night-local-heroes' },
    { date: '10 Nov 2026', time: '10:00 WIB', title: 'Bazar UMKM Kreatif Nusantara', place: 'JIExpo Kemayoran, Jakarta', organizer: 'Kemenparekraf', price: 'Gratis', slug: 'bazar-umkm-kreatif-nusantara' },
];

export default function Home({ auth, categories = [] }) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [logoutToast, setLogoutToast] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    // State untuk fitur Load More
    const [visibleNearby, setVisibleNearby] = useState(4);

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

            <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-8 lg:px-10">
                <div className="flex items-center gap-5 sm:gap-8">
                    <Link href="/" className="flex items-center gap-2" aria-label="Beranda Hajirin">
                        <img src="/hajirin_icon.svg" alt="Logo Hajirin" className="h-8 w-auto" />
                        <span className="text-2xl font-bold tracking-tighter text-navy">HAJIRIN</span>
                    </Link>
                    <div className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
                        <a href="#event-unggulan" className="hover:text-brand-blue">Jelajah Event</a>
                        <Link href="/kategori" className="hover:text-brand-blue">Kategori</Link>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button type="button" className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 sm:block">Buat Event</button>
                    <button type="button" aria-label="Cari event" className="p-2 text-gray-500 hover:text-navy"><Search className="size-5" /></button>
                    {auth?.user ? (
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase ${auth.user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-brand-blue'}`}>
                                {auth.user.name.charAt(0)}
                            </span>
                            <Link href={auth.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} className="hidden min-w-0 text-left sm:block">
                                <p className="max-w-36 truncate text-sm font-semibold leading-tight text-navy">{auth.user.name}</p>
                                <p className="max-w-36 truncate text-xs text-gray-500">
                                    {auth.user.role === 'ADMIN' ? 'Dashboard Admin ↗' : auth.user.email}
                                </p>
                            </Link>
                            <span className="h-8 w-px bg-gray-200" aria-hidden="true" />
                            <button type="button" onClick={() => setIsLogoutConfirmOpen(true)} className="text-sm font-medium text-gray-500 transition hover:text-red-600">Keluar</button>
                        </div>
                    ) : (
                        <>
                            <button type="button" onClick={() => openAuthModal('login')} className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-navy sm:block">Masuk</button>
                            <button type="button" onClick={() => openAuthModal('register')} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">Daftar</button>
                        </>
                    )}
                </div>
            </nav>

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
                                            
                                            <button type="button" aria-label={`Simpan ${event.title}`} className="flex size-11 items-center justify-center rounded-lg border border-white/30 hover:bg-white/10"><Bookmark className="size-5" /></button>
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

                <section className="px-4 py-4 sm:px-8 lg:px-10">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                        <h2 className="mb-4 text-lg font-bold text-navy">Ada event apa yang ingin kamu datangi?</h2>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <label className="relative flex-1"><span className="sr-only">Cari event</span><Search className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" /><input type="search" placeholder="Cari nama event, artis, atau penyelenggara..." className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" /></label>
                            <label className="relative md:w-56"><span className="sr-only">Lokasi</span><MapPin className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" /><select className="h-12 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm font-medium text-gray-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Yogyakarta</option><option>Bali</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-5 text-gray-400" /></label>
                            <label className="relative md:w-56"><span className="sr-only">Tanggal</span><CalendarDays className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" /><select className="h-12 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-11 pr-10 text-sm font-medium text-gray-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"><option>Semua Waktu</option><option>Hari Ini</option><option>Minggu Ini</option><option>Bulan Ini</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-5 text-gray-400" /></label>
                            <button type="button" className="h-12 rounded-lg bg-brand-blue px-6 text-sm font-semibold text-white transition hover:bg-blue-800">Cari Event</button>
                        </div>
                    </div>
                </section>

                <SectionHeading id="event-unggulan" title="Event Unggulan Minggu Ini" description="Pilihan event terbaik yang sayang untuk dilewatkan" action="Lihat Semua" />
                <section className="px-4 pb-8 sm:px-8 lg:px-10">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {featuredEvents.map((evt) => (
                            <FeaturedCard
                                key={evt.title}
                                {...evt}
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

                <SectionHeading title="Event Terdekat" description="Temukan acara seru yang berlokasi dekat di sekitarmu" action="Lihat Semua Event" />
                <section className="px-4 pb-10 sm:px-8 lg:px-10">
                    <div className="mb-6 flex justify-end">
                        <button type="button" className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            <MapPin className="mr-2 size-4 text-red-500" />Jakarta <ChevronDown className="ml-2 size-4 text-gray-400" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {nearbyEvents.slice(0, visibleNearby).map((evt, index) => <NearbyCard key={index} {...evt} />)}
                    </div>
                    
                    <div className="mt-6 text-center">
                        {visibleNearby < nearbyEvents.length ? (
                            <button type="button" onClick={() => setVisibleNearby(visibleNearby + 4)} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                                Lihat Lebih Banyak Event Terdekat <ChevronDown className="ml-2 size-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={() => setVisibleNearby(4)} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                                Tampilkan Lebih Sedikit <ChevronUp className="ml-2 size-4" />
                            </button>
                        )}
                    </div>
                </section>

                <section className="px-4 py-10 sm:px-8 lg:px-10"><div className="relative flex flex-col items-center justify-between overflow-hidden rounded-2xl bg-navy p-8 text-center md:flex-row md:p-10 md:text-left"><div className="absolute -right-32 -top-32 size-64 rounded-full bg-brand-blue/10 blur-3xl" /><div className="relative z-10 max-w-2xl text-white"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-yellow-400">Untuk Penyelenggara Acara</p><h2 className="mb-3 text-3xl font-bold">Punya acara yang ingin kamu selenggarakan?</h2><p className="text-sm text-gray-300">Kelola event, jual tiket secara digital dalam satu sistem, dan pantau secara real-time dari tingkat pengunjung hingga hasil penjualanmu!</p></div><div className="relative z-10 mt-6 flex flex-col items-center md:mt-0 md:items-end"><button type="button" className="inline-flex items-center rounded-lg bg-brand-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/30 hover:bg-blue-800"><PlusCircle className="mr-2 size-4" />Mulai Buat Event</button><a href="#" className="mt-3 inline-flex items-center text-xs text-gray-300 hover:text-white hover:underline">Pelajari lebih lanjut <ArrowRight className="ml-1 size-3" /></a></div></div></section>
            </main>

            <footer className="border-t border-gray-100 bg-white px-4 pb-6 pt-12 sm:px-8 lg:px-10"><div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4"><div className="pr-4"><div className="mb-4 flex items-center gap-2"><img src="/hajirin_icon.svg" alt="" className="h-8 w-auto" /><span className="text-xl font-bold tracking-tighter">HAJIRIN</span></div><p className="mb-6 text-xs leading-relaxed text-slate">Platform e-ticketing aggregate komunitas dan ekosistem penyelenggara event terpercaya di Indonesia.</p><FooterLinks links={['Tentang Hajirin', 'Karir Kami', 'Kontak']} /></div><FooterColumn title="Untuk Pengunjung" links={['Jelajah Event', 'Kategori', 'Beli Tiket']} /><FooterColumn title="Untuk EO" links={['Buat Event', 'Harga Tiket']} onDashboardClick={() => openAuthModal('login')} /><FooterColumn title="Informasi" links={['Syarat & Ketentuan', 'Kebijakan Privasi', 'FAQ']} /></div><div className="flex flex-col items-center justify-between border-t border-gray-100 pt-6 text-[11px] text-gray-400 md:flex-row"><p>© 2026 Hajirin - Platform E-ticketing & Management Event Indonesia</p><span className="mt-4 md:mt-0">Pilih Bahasa: Bahasa Indonesia</span></div></footer>

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

function SectionHeading({ id, title, description, action }) {
    return <section id={id} className="flex items-end justify-between px-4 pb-6 pt-8 sm:px-8 lg:px-10"><div><h2 className="mb-1 text-2xl font-bold text-navy">{title}</h2><p className="text-sm text-slate">{description}</p></div><a href="#" className="hidden items-center text-sm font-semibold text-brand-blue hover:underline sm:flex">{action} <ArrowRight className="ml-1 size-4" /></a></section>;
}

// Komponen Card diubah menggunakan <Link>
function FeaturedCard({ slug, image, category, date, title, place, organizer, price, onBuyTicket }) {
    return (
        <Link href={`/event/${slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
            <div className="relative h-48 overflow-hidden bg-gray-200">
                <img src={`/images/events/${image}`} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-[10px] font-bold tracking-wide shadow-sm">{category}</span>
                <button type="button" onClick={(e) => e.preventDefault()} aria-label={`Simpan ${title}`} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm hover:text-navy"><Bookmark className="size-4" /></button>
            </div>
            <div className="flex flex-grow flex-col p-4">
                <p className="mb-1 flex items-center text-[11px] font-semibold text-brand-blue"><CalendarDays className="mr-1 size-3" />{date}</p>
                <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-navy group-hover:text-brand-blue transition-colors">{title}</h3>
                <div className="mt-auto">
                    <p className="mb-1 flex items-center text-xs text-slate"><MapPin className="mr-1 size-3" />{place}</p>
                    <p className="flex items-center text-xs text-slate"><CircleUserRound className="mr-1 size-3" />{organizer}</p>
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
                <div>
                    <p className="text-[10px] text-gray-500">Mulai dari</p>
                    <p className="text-lg font-bold text-brand-blue">{price}</p>
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