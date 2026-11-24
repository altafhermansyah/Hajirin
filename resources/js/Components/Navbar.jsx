import { useState, useEffect } from 'react';
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
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [internalAuthOpen, setInternalAuthOpen] = useState(false);
    const [internalAuthView, setInternalAuthView] = useState('login');

    useEffect(() => {
        if (initialSearchQuery !== undefined && initialSearchQuery !== null) {
            setSearchVal(initialSearchQuery);
        }
    }, [initialSearchQuery]);

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

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchVal.trim();

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

            <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 h-16 backdrop-blur sm:px-8 lg:px-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                        aria-label="Beranda Hajirin"
                    >
                        <img
                            src="/hajirin_icon.svg"
                            alt="Logo Hajirin"
                            className="h-7 w-auto shrink-0"
                        />
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-navy">
                            HAJIRIN
                        </span>
                    </Link>

                    <div className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
                        <Link
                            href="/#event-unggulan"
                            className={`transition-colors hover:text-slate-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                                activeLink === 'jelajah' ? 'text-brand-blue font-semibold' : ''
                            }`}
                        >
                            Jelajah Event
                        </Link>
                        <Link
                            href="/kategori"
                            className={`transition-colors hover:text-slate-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                                activeLink === 'kategori' ? 'text-brand-blue font-semibold' : ''
                            }`}
                        >
                            Kategori
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 flex-1 justify-end max-w-2xl">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative w-36 sm:w-56 md:w-64 lg:w-72"
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
                            onChange={(e) => {
                                const val = e.target.value;
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
                            }}
                            placeholder="Cari judul event..."
                            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition"
                        />
                        {searchVal && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchVal('');
                                    if (
                                        typeof window !== 'undefined' &&
                                        window.location.pathname === '/' &&
                                        onSearch
                                    ) {
                                        onSearch('');
                                    }
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                aria-label="Hapus pencarian"
                            >
                                <X className="size-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </form>

                    <button
                        type="button"
                        onClick={handleCreateEventClick}
                        className={buttonClass('outline', 'sm', 'hidden sm:inline-flex shrink-0')}
                    >
                        Buat Event
                    </button>

                    {user ? (
                        <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200 shrink-0">
                            <NotificationBell />
                            <Link
                                href={userDashboardUrl}
                                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue transition hover:opacity-90"
                                title={`Akun: ${user.name}`}
                                aria-label={`Buka dashboard akun ${user.name}`}
                            >
                                <Avatar name={user.name} src={user.avatar_path} size="sm" />
                            </Link>

                            <button
                                type="button"
                                onClick={() => setIsLogoutOpen(true)}
                                className={buttonClass('danger-outline', 'sm')}
                                title="Keluar dari akun"
                                aria-label="Keluar dari akun"
                            >
                                <LogOut className="size-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">Keluar</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => openAuth('login')}
                                className={buttonClass('outline', 'sm', 'hidden sm:inline-flex')}
                            >
                                Masuk
                            </button>
                            <button
                                type="button"
                                onClick={() => openAuth('register')}
                                className={buttonClass('primary', 'sm')}
                            >
                                Daftar
                            </button>
                        </div>
                    )}
                </div>
            </nav>

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
