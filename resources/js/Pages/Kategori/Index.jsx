import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Bookmark,
    Briefcase,
    Calendar,
    CalendarDays,
    ChevronRight,
    CircleUserRound,
    Compass,
    GraduationCap,
    Headphones,
    LayoutGrid,
    MapPin,
    Menu,
    Palette,
    Search,
    Sparkles,
    Tag,
    TentTree,
    Trophy,
    UserRound,
    Users,
    Volleyball,
} from 'lucide-react';
import AuthModal from '../../Components/Auth/AuthModal';
import Navbar from '../../Components/Navbar';
import { buttonClass } from '../../Components/ui/Button';

const CATEGORY_ICON_MAP = {
    compass: Compass,
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
};

const SLUG_ICON_FALLBACK = {
    musik: Headphones,
    seminar: Users,
    workshop: Palette,
    olahraga: Volleyball,
    komunitas: UserRound,
    festival: TentTree,
    pameran: LayoutGrid,
    lainnya: Menu,
};

function resolveCategoryIcon(category) {
    if (category?.icon && CATEGORY_ICON_MAP[category.icon]) {
        return CATEGORY_ICON_MAP[category.icon];
    }

    if (category?.slug && SLUG_ICON_FALLBACK[category.slug]) {
        return SLUG_ICON_FALLBACK[category.slug];
    }

    return Tag;
}

export default function CategoryIndex({
    auth,
    categories = [],
    initialCategory = 'Semua',
    initialCategorySlug = 'semua',
    events = [],
    bookmarkedEventIds = [],
}) {
    const categoryList = [
        { id: 'semua', name: 'Semua', slug: 'semua', icon: 'compass' },
        ...categories,
    ];

    const initialSlug = categoryList.some((c) => c.slug === initialCategorySlug)
        ? initialCategorySlug
        : 'semua';

    const [activeSlug, setActiveSlug] = useState(initialSlug);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState('login');
    const [bookmarkedSet, setBookmarkedSet] = useState(() => new Set(bookmarkedEventIds || []));

    useEffect(() => {
        setBookmarkedSet(new Set(bookmarkedEventIds || []));
    }, [bookmarkedEventIds]);

    function handleToggleBookmark(e, eventId) {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.user) {
            openAuthModal('login');
            return;
        }

        setBookmarkedSet((prev) => {
            const next = new Set(prev);
            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }
            return next;
        });

        router.post(
            `/events/${eventId}/bookmark`,
            {},
            { preserveScroll: true, preserveState: true }
        );
    }

    function openAuthModal(view) {
        setAuthView(view);
        setIsAuthModalOpen(true);
    }

    const activeCatDetail = categoryList.find((c) => c.slug === activeSlug) || {
        name: initialCategory || 'Semua',
        slug: 'semua',
        icon: 'compass',
    };
    const activeCategory = activeCatDetail.name;
    const ActiveIcon = resolveCategoryIcon(activeCatDetail);

    const filteredEvents =
        activeSlug === 'semua'
            ? events
            : events.filter((event) =>
                  event.category_slug
                      ? event.category_slug === activeSlug
                      : event.category?.toLowerCase() === activeCategory.toLowerCase()
              );

    const handleCategoryClick = (category) => {
        setActiveSlug(category.slug);
        const nextUrl = category.slug === 'semua' ? '/kategori' : `/kategori/${category.slug}`;
        window.history.replaceState({}, '', nextUrl);
    };

    return (
        <>
            <Head title={`Kategori ${activeCategory} - Hajirin`} />

            <div className="bg-slate-50/40 text-slate-900 font-sans antialiased min-h-screen flex flex-col">
                <Navbar auth={auth} onOpenAuthModal={openAuthModal} activeLink="kategori" />

                <main id="main-content" tabIndex={-1} className="flex-1">
                    {/* Header Dinamis */}
                    <section className="bg-white border-b border-slate-200 py-7">
                        <div className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto">
                            <nav
                                aria-label="Breadcrumb"
                                className="text-xs text-slate-500 mb-4 flex items-center gap-2"
                            >
                                <Link href="/" className="hover:text-brand-blue">
                                    Beranda
                                </Link>
                                <ChevronRight className="size-3 text-slate-400" aria-hidden="true" />
                                <Link href="/kategori" className="hover:text-brand-blue">
                                    Kategori
                                </Link>
                                <ChevronRight className="size-3 text-slate-400" aria-hidden="true" />
                                <span className="font-medium text-slate-900">{activeCategory}</span>
                            </nav>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                        <ActiveIcon
                                            className="size-6 text-slate-700"
                                            strokeWidth={1.75}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                            {activeSlug === 'semua'
                                                ? 'Semua Event'
                                                : `Event ${activeCategory}`}
                                        </h1>
                                        <p className="mt-0.5 text-sm text-slate-500">
                                            {activeSlug === 'semua'
                                                ? 'Temukan seluruh pilihan event menarik dan terbaik di Hajirin.'
                                                : `Berbagai pilihan acara dalam kategori ${activeCategory.toLowerCase()}.`}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 tabular-nums">
                                    Menampilkan{' '}
                                    <span className="font-semibold text-slate-900">
                                        {filteredEvents.length}
                                    </span>{' '}
                                    event
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Tab Filter Kategori */}
                    <section className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto py-5">
                        <div className="flex overflow-x-auto pb-2 gap-2">
                            {categoryList.map((cat) => {
                                const IconCat = resolveCategoryIcon(cat);
                                const isActive = activeSlug === cat.slug;
                                return (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => handleCategoryClick(cat)}
                                        className={`px-3.5 py-2 inline-flex items-center gap-2 rounded-lg text-xs font-medium whitespace-nowrap transition border cursor-pointer ${
                                            isActive
                                                ? 'bg-brand-blue text-white border-brand-blue'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                                        }`}
                                    >
                                        <IconCat
                                            className={`size-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                                            aria-hidden="true"
                                        />
                                        <span>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Grid Event Dinamis */}
                    <section className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto pb-16">
                        {filteredEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {filteredEvents.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/event/${event.slug}`}
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition flex flex-col h-full group"
                                    >
                                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                            />
                                            <span className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 rounded-md text-xs font-medium text-slate-800 backdrop-blur-xs">
                                                {event.tag}
                                            </span>
                                            {event.badge && (
                                                <span className="absolute bottom-2.5 left-3 bg-navy/80 text-white px-2 py-0.5 rounded-md text-xs font-medium backdrop-blur-xs">
                                                    {event.badge}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleBookmark(e, event.id)}
                                                aria-label={
                                                    bookmarkedSet.has(event.id)
                                                        ? `Hapus ${event.title} dari bookmark`
                                                        : `Simpan ${event.title} ke bookmark`
                                                }
                                                aria-pressed={bookmarkedSet.has(event.id)}
                                                className={`absolute top-3 right-3 size-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                                                    bookmarkedSet.has(event.id)
                                                        ? 'border-brand-blue bg-brand-blue text-white'
                                                        : 'border-slate-200/80 bg-white/95 text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                <Bookmark
                                                    className={`size-4 ${
                                                        bookmarkedSet.has(event.id)
                                                            ? 'fill-current'
                                                            : ''
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <p className="text-brand-blue text-xs font-medium mb-1.5 flex items-center gap-1.5 tabular-nums">
                                                <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                                                <span>{event.date}</span>
                                            </p>
                                            <h3 className="font-semibold text-sm leading-snug text-slate-900 mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors">
                                                {event.title}
                                            </h3>
                                            <div className="mt-auto space-y-1">
                                                <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                                                    <span className="truncate">{event.location}</span>
                                                </p>
                                                <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                                    <CircleUserRound
                                                        className="size-3.5 text-slate-400 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate">{event.organizer}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <div>
                                                <p className="text-xs text-slate-500">Mulai dari</p>
                                                <p className="font-semibold text-slate-900 text-base tabular-nums">
                                                    {event.price}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    if (!auth?.user) {
                                                        e.preventDefault();
                                                        openAuthModal('login');
                                                    }
                                                }}
                                                className={buttonClass('outline', 'sm')}
                                            >
                                                Beli Tiket
                                            </button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                <Search className="size-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                                <h3 className="text-base font-semibold text-slate-900">
                                    Belum ada event untuk kategori {activeCategory}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    Coba pilih kategori lain atau lihat semua event.
                                </p>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8 lg:px-10">
                    <div className="text-center text-xs text-slate-400">
                        © 2026 Hajirin - Platform E-ticketing &amp; Management Event Indonesia
                    </div>
                </footer>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialView={authView}
            />
        </>
    );
}
