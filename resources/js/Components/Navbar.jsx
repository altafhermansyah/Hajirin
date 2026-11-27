import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { Search, LogOut, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import AuthModal from './Auth/AuthModal';
import { Avatar } from './ui/Avatar';
import { buttonClass } from './ui/Button';

export default function Navbar({
    auth,
    onOpenAuthModal,
    activeLink = '',
    initialSearchQuery = '',
    onSearch = null,
}) {
    const user = auth?.user;
    const [searchVal, setSearchVal] = useState(initialSearchQuery || '');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [internalAuthOpen, setInternalAuthOpen] = useState(false);
    const [internalAuthView, setInternalAuthView] = useState('login');
    const mobileSearchInputRef = useRef(null);

    useEffect(() => {
        if (initialSearchQuery !== undefined && initialSearchQuery !== null) {
            setSearchVal(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    useEffect(() => {
        if (isMobileSearchOpen) {
            mobileSearchInputRef.current?.focus();
        }
    }, [isMobileSearchOpen]);

    const openAuth = (view) => {
        if (onOpenAuthModal) {
            onOpenAuthModal(view);
            return;
        }
        setInternalAuthView(view);
        setInternalAuthOpen(true);
    };

    const handleCreateEventClick = (e) => {
        if (!user) {
            e.preventDefault();
            openAuth('login');
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

    const handleSearchInputChange = (val) => {
        setSearchVal(val);
        if (
            typeof window !== 'undefined' &&
            window.location.pathname === '/' &&
            onSearch
        ) {
            onSearch(val);
            if (val.trim().length > 0) {
                setTimeout(() => {
                    const targetEl =
                        document.getElementById('hasil-pencarian') ||
                        document.getElementById('search-section');
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 50);
            }
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchVal.trim();
        setIsMobileSearchOpen(false);

        if (typeof window !== 'undefined' && window.location.pathname === '/') {
            if (onSearch) {
                onSearch(trimmed);
            }
            const searchEl =
                document.getElementById('hasil-pencarian') ||
                document.getElementById('search-section');
            if (searchEl) {
                searchEl.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            router.visit(
                trimmed
                    ? `/?q=${encodeURIComponent(trimmed)}#hasil-pencarian`
                    : '/#search-section'
            );
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
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
            >
                Lewati ke konten utama
            </a>

            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <nav
                    aria-label="Navigasi utama"
                    className="px-3 h-16 sm:px-8 lg:px-10 flex items-center justify-between gap-2 sm:gap-3"
                >
                    <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                        <Link
                            href="/"
                            prefetch
                            className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                            aria-label="Beranda Hajirin"
                        >
                            <img
                                src="/hajirin_icon.svg"
                                alt="Logo Hajirin"
                                className="h-7 w-auto shrink-0"
                            />
                            <span className="text-base sm:text-xl font-bold tracking-tight text-navy">
                                HAJIRIN
                            </span>
                        </Link>

                        <div className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
                            <Link
                                href="/#event-unggulan"
                                aria-current={activeLink === 'jelajah' ? 'page' : undefined}
                                className={`transition-colors hover:text-slate-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                                    activeLink === 'jelajah'
                                        ? 'text-brand-blue font-semibold underline decoration-2 underline-offset-4'
                                        : ''
                                }`}
                            >
                                Jelajah Event
                            </Link>
                            <Link
                                href="/kategori"
                                prefetch
                                aria-current={activeLink === 'kategori' ? 'page' : undefined}
                                className={`transition-colors hover:text-slate-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                                    activeLink === 'kategori'
                                        ? 'text-brand-blue font-semibold underline decoration-2 underline-offset-4'
                                        : ''
                                }`}
                            >
                                Kategori
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-end max-w-2xl min-w-0">
                        {/* Inline search on sm+ screens */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="hidden sm:block relative sm:w-56 md:w-64 lg:w-72"
                        >
                            <button
                                type="submit"
                                aria-label="Cari Event"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition cursor-pointer"
                            >
                                <Search className="size-4" aria-hidden="true" />
                            </button>
                            <input
                                type="search"
                                enterKeyHint="search"
                                aria-label="Cari judul event"
                                value={searchVal}
                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                placeholder="Cari judul event..."
                                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                            />
                            {searchVal && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchInputChange('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                    aria-label="Hapus pencarian"
                                >
                                    <X className="size-3.5" aria-hidden="true" />
                                </button>
                            )}
                        </form>

                        {/* Compact search trigger on mobile (< 640px) */}
                        <button
                            type="button"
                            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                            aria-expanded={isMobileSearchOpen}
                            aria-controls="mobile-navbar-search"
                            aria-label={isMobileSearchOpen ? 'Tutup pencarian' : 'Cari Event'}
                            className="sm:hidden inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition cursor-pointer shrink-0"
                        >
                            {isMobileSearchOpen ? (
                                <X className="size-4.5" aria-hidden="true" />
                            ) : (
                                <Search className="size-4.5" aria-hidden="true" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleCreateEventClick}
                            className={buttonClass('outline', 'sm', 'hidden sm:inline-flex shrink-0')}
                        >
                            Buat Event
                        </button>

                        {user ? (
                            <div className="flex items-center gap-1.5 sm:gap-2 sm:pl-2 sm:border-l sm:border-slate-200 shrink-0">
                                <NotificationBell />
                                <Link
                                    href={userDashboardUrl}
                                    prefetch
                                    className="inline-flex items-center justify-center rounded-full p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition hover:opacity-90"
                                    title={`Akun: ${user.name}`}
                                    aria-label={`Buka dashboard akun ${user.name}`}
                                >
                                    <Avatar name={user.name} src={user.avatar_path} size="sm" />
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setIsLogoutOpen(true)}
                                    className={buttonClass(
                                        'danger-outline',
                                        'sm',
                                        'size-10 px-0 sm:w-auto sm:h-8 sm:px-3'
                                    )}
                                    title="Keluar dari akun"
                                    aria-label="Keluar dari akun"
                                >
                                    <LogOut className="size-4 sm:size-3.5" aria-hidden="true" />
                                    <span className="hidden sm:inline">Keluar</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => openAuth('login')}
                                    className={buttonClass('outline', 'sm', 'h-10 sm:h-8 px-3')}
                                >
                                    Masuk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openAuth('register')}
                                    className={buttonClass('primary', 'sm', 'h-10 sm:h-8 px-3')}
                                >
                                    Daftar
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Expandable full-width mobile search bar */}
                {isMobileSearchOpen && (
                    <div
                        id="mobile-navbar-search"
                        className="sm:hidden border-t border-slate-100 bg-white px-3 py-2.5"
                    >
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                                    aria-hidden="true"
                                />
                                <input
                                    ref={mobileSearchInputRef}
                                    type="search"
                                    enterKeyHint="search"
                                    aria-label="Cari judul event"
                                    value={searchVal}
                                    onChange={(e) => handleSearchInputChange(e.target.value)}
                                    placeholder="Cari konser, seminar, kota..."
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                                />
                                {searchVal && (
                                    <button
                                        type="button"
                                        onClick={() => handleSearchInputChange('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                                        aria-label="Hapus pencarian"
                                    >
                                        <X className="size-4" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                            <button type="submit" className={buttonClass('primary', 'md', 'shrink-0')}>
                                Cari
                            </button>
                        </form>
                    </div>
                )}
            </header>

            {user && (
                <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
            )}

            {!user && !onOpenAuthModal && (
                <AuthModal
                    isOpen={internalAuthOpen}
                    onClose={() => setInternalAuthOpen(false)}
                    initialView={internalAuthView}
                />
            )}
        </>
    );
}
