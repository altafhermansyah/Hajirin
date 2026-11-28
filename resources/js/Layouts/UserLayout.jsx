import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Compass, Home, Ticket, UserRound } from 'lucide-react';
import Navbar from '../Components/Navbar';
import AuthModal from '../Components/Auth/AuthModal';
import CookieNotice from '../Components/CookieNotice';

export default function UserLayout({
    auth: authProp,
    activeLink = '',
    initialSearchQuery = '',
    onSearch = null,
    onOpenAuthModal = null,
    showBottomNav = true,
    showFooter = false,
    className = 'bg-white text-slate-900',
    children,
}) {
    const { url, props } = usePage();
    const auth = authProp ?? props.auth;
    const user = auth?.user;

    const [internalAuthOpen, setInternalAuthOpen] = useState(false);
    const [internalAuthView, setInternalAuthView] = useState('login');
    const [currentHash, setCurrentHash] = useState(() =>
        typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncHash = () => setCurrentHash(window.location.hash.replace('#', ''));
        syncHash();
        window.addEventListener('hashchange', syncHash);
        return () => window.removeEventListener('hashchange', syncHash);
    }, [url]);

    const openAuth = (view = 'login') => {
        if (onOpenAuthModal) {
            onOpenAuthModal(view);
            return;
        }
        setInternalAuthView(view);
        setInternalAuthOpen(true);
    };

    const currentPath = (url || '/').split('?')[0].split('#')[0];

    const userAccountUrl = user
        ? user.role === 'ADMIN'
            ? '/admin/dashboard'
            : user.role === 'EO'
              ? '/eo/dashboard'
              : '/dashboard#profil'
        : '/dashboard#profil';

    const isHomeActive = currentPath === '/';
    const isExploreActive =
        currentPath.startsWith('/kategori') ||
        currentPath.startsWith('/event-terdekat') ||
        currentPath.startsWith('/event/');
    const isTicketsActive =
        currentPath.startsWith('/my-tickets') ||
        (currentPath === '/dashboard' && (currentHash === '' || currentHash === 'tiket'));
    const isAccountActive =
        currentPath.startsWith('/profile') ||
        currentPath.startsWith('/eo') ||
        currentPath.startsWith('/admin') ||
        (currentPath === '/dashboard' && currentHash !== '' && currentHash !== 'tiket');

    const navItemClass = (active) =>
        `relative flex flex-col items-center justify-center gap-1 min-h-12 py-1.5 text-[11px] leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue cursor-pointer ${
            active ? 'font-semibold text-brand-blue' : 'font-medium text-slate-500 hover:text-slate-900'
        }`;

    return (
        <div
            className={`min-h-dvh font-sans flex flex-col ${
                showBottomNav ? 'pb-16 sm:pb-0' : ''
            } ${className}`}
        >
            <div className="print:hidden">
                <Navbar
                    auth={auth}
                    activeLink={activeLink}
                    initialSearchQuery={initialSearchQuery}
                    onSearch={onSearch}
                    onOpenAuthModal={openAuth}
                />
            </div>

            {children}

            {showFooter && (
                <footer className="print:hidden border-t border-slate-200 bg-white py-6 px-4 sm:px-8 text-xs text-slate-500 mt-auto">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <img
                                src="/hajirin_icon.svg"
                                alt="Hajirin"
                                loading="lazy"
                                decoding="async"
                                className="h-5 w-auto"
                            />
                            <span className="font-semibold text-navy">HAJIRIN</span>
                            <span>- Platform Event &amp; Tiket Terpercaya</span>
                        </div>
                        <p>© 2026 Hajirin Indonesia. Seluruh hak cipta dilindungi.</p>
                    </div>
                </footer>
            )}

            {showBottomNav && (
                <nav
                    aria-label="Navigasi utama mobile"
                    className="sm:hidden print:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe"
                >
                    <div className="grid grid-cols-4">
                        <Link
                            href="/"
                            prefetch
                            aria-current={isHomeActive ? 'page' : undefined}
                            className={navItemClass(isHomeActive)}
                        >
                            {isHomeActive && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-blue"
                                />
                            )}
                            <Home className="size-5" aria-hidden="true" />
                            <span>Beranda</span>
                        </Link>

                        <Link
                            href="/kategori"
                            prefetch
                            aria-current={isExploreActive ? 'page' : undefined}
                            className={navItemClass(isExploreActive)}
                        >
                            {isExploreActive && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-blue"
                                />
                            )}
                            <Compass className="size-5" aria-hidden="true" />
                            <span>Jelajah</span>
                        </Link>

                        {user ? (
                            <Link
                                href="/dashboard#tiket"
                                prefetch
                                aria-current={isTicketsActive ? 'page' : undefined}
                                className={navItemClass(isTicketsActive)}
                            >
                                {isTicketsActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-blue"
                                    />
                                )}
                                <Ticket className="size-5" aria-hidden="true" />
                                <span>Tiket</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openAuth('login')}
                                className={navItemClass(false)}
                            >
                                <Ticket className="size-5" aria-hidden="true" />
                                <span>Tiket</span>
                            </button>
                        )}

                        {user ? (
                            <Link
                                href={userAccountUrl}
                                prefetch
                                aria-current={isAccountActive ? 'page' : undefined}
                                className={navItemClass(isAccountActive)}
                            >
                                {isAccountActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-blue"
                                    />
                                )}
                                <UserRound className="size-5" aria-hidden="true" />
                                <span>Akun</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openAuth('login')}
                                className={navItemClass(false)}
                            >
                                <UserRound className="size-5" aria-hidden="true" />
                                <span>Masuk</span>
                            </button>
                        )}
                    </div>
                </nav>
            )}

            <CookieNotice />

            {!user && !onOpenAuthModal && (
                <AuthModal
                    isOpen={internalAuthOpen}
                    onClose={() => setInternalAuthOpen(false)}
                    initialView={internalAuthView}
                />
            )}
        </div>
    );
}
