import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { Search, LogOut, X } from 'lucide-react';

export default function Navbar({
    auth,
    onOpenAuthModal,
    activeLink = '',
    initialSearchQuery = '',
    onSearch = null,
}) {
    const user = auth?.user;
    const [searchVal, setSearchVal] = useState(initialSearchQuery || '');

    useEffect(() => {
        if (initialSearchQuery !== undefined && initialSearchQuery !== null) {
            setSearchVal(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const handleCreateEventClick = (e) => {
        if (!user) {
            if (onOpenAuthModal) {
                e.preventDefault();
                onOpenAuthModal('login');
            } else {
                router.visit('/login');
            }
            return;
        }

        if (user.role === 'EO') {
            router.visit('/eo/dashboard');
            return;
        }

        if (user.role === 'ADMIN') {
            router.visit('/admin/dashboard');
            return;
        }

        router.visit('/eo-applications/create');
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchVal.trim();

        if (typeof window !== 'undefined' && window.location.pathname === '/') {
            if (onSearch) {
                onSearch(trimmed);
            }
            const searchEl = document.getElementById('search-section') || document.getElementById('hasil-pencarian');
            if (searchEl) {
                searchEl.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            router.visit(trimmed ? `/?q=${encodeURIComponent(trimmed)}#search-section` : '/#search-section');
        }
    };

    const userDashboardUrl = user
        ? user.role === 'ADMIN'
            ? '/admin/dashboard'
            : user.role === 'EO'
            ? '/eo/dashboard'
            : '/dashboard'
        : '/dashboard';

    return (
        <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-3 py-3 backdrop-blur sm:px-8 lg:px-12 flex items-center justify-between shadow-2xs gap-3">
            <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                <Link href="/" className="flex items-center gap-2" aria-label="Beranda Hajirin">
                    <img src="/hajirin_icon.svg" alt="Logo Hajirin" className="h-8 w-auto shrink-0" />
                    <span className="text-xl sm:text-2xl font-bold tracking-tighter text-navy">HAJIRIN</span>
                </Link>
                <div className="hidden gap-6 text-sm font-medium text-slate md:flex">
                    <Link
                        href="/#event-unggulan"
                        className={`transition hover:text-brand-blue ${activeLink === 'jelajah' ? 'text-brand-blue font-bold' : ''}`}
                    >
                        Jelajah Event
                    </Link>
                    <Link
                        href="/kategori"
                        className={`transition hover:text-brand-blue ${activeLink === 'kategori' ? 'text-brand-blue font-bold' : ''}`}
                    >
                        Kategori
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end max-w-2xl">
                {/* Form Input Pencarian Interaktif di Navbar */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="relative w-36 sm:w-56 md:w-64 lg:w-72"
                >
                    <button
                        type="submit"
                        aria-label="Cari Event"
                        className="absolute left-2.5 top-2.5 text-gray-400 hover:text-brand-blue transition"
                    >
                        <Search className="size-4" />
                    </button>
                    <input
                        type="text"
                        value={searchVal}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchVal(val);
                            if (onSearch && typeof window !== 'undefined' && window.location.pathname === '/') {
                                onSearch(val);
                            }
                        }}
                        placeholder="Cari event..."
                        className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/90 pl-8 pr-7 text-xs text-slate-800 placeholder:text-gray-400 transition focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                    {searchVal && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchVal('');
                                if (onSearch && typeof window !== 'undefined' && window.location.pathname === '/') {
                                    onSearch('');
                                }
                            }}
                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            title="Hapus pencarian"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </form>

                <button
                    type="button"
                    onClick={handleCreateEventClick}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shrink-0"
                >
                    Buat Event
                </button>

                {/* Di sebelah kanan Buat Event: HANYA AVATAR SAJA (Tanpa Nama User & Gmail) */}
                {user ? (
                    <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-gray-200 shrink-0">
                        <Link
                            href={userDashboardUrl}
                            className="group relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-blue/40 overflow-hidden shadow-xs hover:border-brand-blue hover:ring-2 hover:ring-brand-blue/20 transition"
                            title={`Akun: ${user.name}`}
                        >
                            {user.avatar_path ? (
                                <img
                                    src={user.avatar_path}
                                    alt={user.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="flex size-full items-center justify-center bg-brand-blue text-xs font-bold text-white uppercase group-hover:bg-blue-800 transition">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            )}
                        </Link>

                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-slate hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                            title="Keluar dari akun"
                        >
                            <LogOut className="size-3.5" />
                            <span className="hidden sm:inline">Keluar</span>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => (onOpenAuthModal ? onOpenAuthModal('login') : router.visit('/login'))}
                            className="hidden rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-navy sm:block transition"
                        >
                            Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => (onOpenAuthModal ? onOpenAuthModal('register') : router.visit('/register'))}
                            className="rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800"
                        >
                            Daftar
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
