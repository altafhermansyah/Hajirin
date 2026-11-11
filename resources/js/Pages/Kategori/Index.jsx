import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    Search, ChevronRight, ChevronDown, ChevronLeft,
    Headphones, Bookmark, CalendarDays, MapPin, CircleUserRound,
    Users, Palette, Volleyball, UserRound, TentTree, LayoutGrid, Menu,
    Compass
} from 'lucide-react';

export default function CategoryIndex({ auth, initialCategory = 'Semua' }) {
    // Normalisasi huruf pertama agar selalu sesuai dengan data kategori (misal: 'seminar' jadi 'Seminar')
    const formattedInitial = initialCategory ? initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1).toLowerCase() : 'Semua';
    
    const [activeCategory, setActiveCategory] = useState(formattedInitial);

    // Daftar semua kategori beserta icon-nya
    const categoryList = [
        { name: 'Semua', icon: Compass },
        { name: 'Musik', icon: Headphones },
        { name: 'Seminar', icon: Users },
        { name: 'Workshop', icon: Palette },
        { name: 'Olahraga', icon: Volleyball },
        { name: 'Komunitas', icon: UserRound },
        { name: 'Festival', icon: TentTree },
        { name: 'Pameran', icon: LayoutGrid },
        { name: 'Lainnya', icon: Menu },
    ];

    // Dummy Database Event (Semua Kategori Digabung)
    const allEvents = [
        { id: 1, category: "Musik", tag: "FESTIVAL", title: "Festival Musik Nusantara 2026: Merayakan Harmoni", date: "Sab, 24 Sep 2026 • 15:00 WIB", location: "Stadion Gelora Bung Karno", organizer: "LiveNation Indonesia", price: "Rp75.000", image: "/images/events/hero_festival.jpg" },
        { id: 2, category: "Musik", tag: "KONSER", title: "Soundscapes Indie & Electronic Music Night", date: "Jum, 15 Okt 2026 • 19:30 WIB", location: "Campus Center Timur, Surabaya", organizer: "Nusantara Live", price: "Rp85.000", image: "/images/events/soundscapes.jpg", badge: "Hampir Habis" },
        { id: 3, category: "Seminar", tag: "KONFERENSI", title: "Indonesia Tech Conference 2026: The Future of AI", date: "Sab, 24 Okt 2026 • 09:00 WIB", location: "ICE BSD Hall 1, Tangerang", organizer: "Tech Innovation", price: "Rp150.000", image: "/images/events/tech_hero.jpg" },
        { id: 4, category: "Seminar", tag: "SEMINAR", title: "FinTech Indonesia Leadership Summit 2026", date: "Sen, 21 Okt 2026 • 14:00 WIB", location: "Senayan, Jakarta", organizer: "Asosiasi FinTech Indo", price: "Rp200.000", image: "/images/events/startup.jpg" },
        { id: 5, category: "Workshop", tag: "WORKSHOP", title: "Creative Design & Typography Workshop 2026", date: "Sab, 25 Okt 2026 • 10:00 WIB", location: "Margo City, Bandung", organizer: "Kreator Nusantara", price: "Rp50.000", image: "/images/events/design_hero.jpg" },
        { id: 6, category: "Olahraga", tag: "MARATHON", title: "Jakarta Sunrise Marathon 2026: Run for Green", date: "Min, 01 Nov 2026 • 05:30 WIB", location: "Plaza FX Sudirman, Jakarta", organizer: "IndoRunners", price: "Rp125.000", image: "/images/events/marathon_hero.jpg" },
        { id: 7, category: "Festival", tag: "BUDAYA", title: "Jakarta Art & Culture Installation Weekend", date: "Sab, 24 Okt 2026 • 10:00 WIB", location: "Museum Nasional, Jakarta", organizer: "Dinas Pariwisata", price: "Rp45.000", image: "/images/events/nusantara-indie.jpg" },
        { id: 8, category: "Pameran", tag: "EXPO", title: "Indie Coffee & Culinary Expo", date: "Sab, 24 Okt 2026 • 15:00 WIB", location: "GBK Area, Jakarta", organizer: "Kopi Nusantara", price: "Rp35.000", image: "/images/events/bandung-creative.jpg" },
    ];

    // Proses Filtering
    const filteredEvents = activeCategory === 'Semua' 
        ? allEvents 
        : allEvents.filter(event => event.category.toLowerCase() === activeCategory.toLowerCase());

    const activeCatDetail = categoryList.find(c => c.name.toLowerCase() === activeCategory.toLowerCase()) || categoryList[0];
    const ActiveIcon = activeCatDetail.icon;

    const handleCategoryClick = (catName) => {
        setActiveCategory(catName);
        const urlSlug = catName === 'Semua' ? '' : catName.toLowerCase();
        window.history.pushState({}, '', `/kategori/${urlSlug}`);
    };

    return (
        <>
            <Head title={`Kategori ${activeCategory} - Hajirin`} />
            
            <div className="bg-white text-navy font-sans antialiased min-h-screen">
                {/* Navbar */}
                <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-8 lg:px-10">
                    <div className="flex items-center gap-5 sm:gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/hajirin_icon.svg" alt="Logo Hajirin" className="h-8 w-auto" />
                            <span className="text-2xl font-bold tracking-tighter text-navy">HAJIRIN</span>
                        </Link>
                        <div className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
                            <Link href="/#event-unggulan" className="hover:text-brand-blue">Jelajah Event</Link>
                            <Link href="/kategori" className="text-brand-blue font-bold">Kategori</Link>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/buat-event" className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 sm:block text-gray-700">Buat Event</Link>
                        <button className="p-2 text-gray-500 hover:text-navy"><Search className="size-5" /></button>
                        
                        {auth?.user ? (
                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 ml-2">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold uppercase text-brand-blue">
                                    {auth.user.name.charAt(0)}
                                </span>
                                <Link href="/dashboard" className="hidden min-w-0 text-left sm:block">
                                    <p className="max-w-32 truncate text-sm font-semibold leading-tight text-navy">{auth.user.name}</p>
                                    <p className="max-w-32 truncate text-xs text-gray-500">{auth.user.email}</p>
                                </Link>
                                <span className="h-8 w-px bg-gray-200" aria-hidden="true" />
                                <Link href="/logout" method="post" as="button" className="text-sm font-medium text-gray-500 transition hover:text-red-600">Keluar</Link>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-navy sm:block ml-2">Masuk</Link>
                                <Link href="/register" className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">Daftar</Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Header Dinamis */}
                <section className="bg-gray-50 border-b border-gray-100 py-8">
                    <div className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto">
                        <div className="text-xs text-slate mb-4 flex items-center space-x-2">
                            <Link href="/" className="hover:text-brand-blue">Beranda</Link>
                            <ChevronRight className="size-3" />
                            <Link href="/kategori" className="hover:text-brand-blue">Kategori</Link>
                            <ChevronRight className="size-3" />
                            <span className="font-semibold text-navy">{activeCategory}</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                                    <ActiveIcon className="size-8 text-brand-blue" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-navy mb-1">
                                        {activeCategory === 'Semua' ? 'Semua Event' : `Event ${activeCategory}`}
                                    </h1>
                                    <p className="text-sm text-slate">
                                        {activeCategory === 'Semua' 
                                            ? 'Temukan seluruh pilihan event menarik dan terbaik di Hajirin.' 
                                            : `Temukan berbagai event menarik dari kategori ${activeCategory.toLowerCase()} pilihan kami.`}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-navy mt-4 md:mt-0">
                                Menampilkan <span className="text-brand-blue">{filteredEvents.length}</span> Event
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tab Filter Kategori */}
                <section className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto py-6">
                    <div className="flex overflow-x-auto pb-4 gap-3">
                        {categoryList.map((cat) => {
                            const IconCat = cat.icon;
                            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
                            return (
                                <button
                                    key={cat.name}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`px-5 py-2.5 flex items-center rounded-full text-sm font-semibold whitespace-nowrap transition border ${
                                        isActive 
                                        ? 'bg-navy text-white border-navy shadow-md' 
                                        : 'bg-white text-slate border-gray-200 hover:border-brand-blue hover:text-brand-blue shadow-sm'
                                    }`}
                                >
                                    <IconCat className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Grid Event Dinamis */}
                <section className="px-4 sm:px-8 lg:px-10 max-w-[1400px] mx-auto pb-20">
                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredEvents.map((event) => (
                                <article key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col h-full group">
                                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm uppercase">
                                            {event.tag}
                                        </div>
                                        {event.badge && (
                                            <div className="absolute top-3 right-14 bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold tracking-wide shadow-sm border border-orange-200">
                                                {event.badge}
                                            </div>
                                        )}
                                        <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-navy">
                                            <Bookmark className="size-4" />
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <p className="text-brand-blue text-[11px] font-semibold mb-2 flex items-center">
                                            <CalendarDays className="mr-1.5 size-3" /> {event.date}
                                        </p>
                                        <h3 className="font-bold text-[15px] leading-tight mb-3 line-clamp-2">{event.title}</h3>
                                        <div className="mt-auto space-y-1.5">
                                            <p className="text-slate text-xs flex items-center">
                                                <MapPin className="mr-1.5 size-3 text-gray-400" /> {event.location}
                                            </p>
                                            <p className="text-slate text-xs flex items-center">
                                                <CircleUserRound className="mr-1.5 size-3 text-gray-400" /> {event.organizer}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <div>
                                            <p className="text-[10px] text-gray-500">Mulai dari</p>
                                            <p className="font-bold text-brand-blue text-lg">{event.price}</p>
                                        </div>
                                        <button className="border border-gray-300 bg-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm text-navy">Beli Tiket</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                            <Search className="size-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-navy">Belum ada event untuk kategori {activeCategory}</h3>
                            <p className="text-slate text-sm">Coba pilih kategori lain atau lihat semua event.</p>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-100 pt-12 pb-6 px-4 sm:px-8 lg:px-10">
                    <div className="text-center text-xs text-gray-400">© 2026 Hajirin - Platform E-ticketing & Management Event Indonesia</div>
                </footer>
            </div>
        </>
    );
}