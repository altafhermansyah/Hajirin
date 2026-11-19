import React, { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    QrCode,
    Building2,
    ChevronDown,
    LogOut,
    ExternalLink,
    Menu,
    X,
    Plus,
} from 'lucide-react';

export default function EoLayout({ title, organizerName, children }) {
    const { url, props } = usePage();
    const { auth } = props;
    const user = auth?.user || { name: 'Organizer', email: 'eo@hajirin.com', role: 'EO' };
    const displayOrgName = organizerName || user.name;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    useEffect(() => {
        if (!isMobileMenuOpen && !isProfileDropdownOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsProfileDropdownOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen, isProfileDropdownOpen]);

    const initials = displayOrgName
        ? displayOrgName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'EO';

    const isEventFormOrEdit = url.startsWith('/eo/events/create');
    const isMyEvents =
        url === '/eo/events' ||
        url.startsWith('/eo/events?') ||
        (url.startsWith('/eo/events/') && !isEventFormOrEdit);

    const workspaceMenu = [
        {
            name: 'Ringkasan Dashboard',
            href: '/eo/dashboard',
            icon: LayoutDashboard,
            active: url === '/eo/dashboard',
        },
        {
            name: 'Buat Event & Tiket',
            href: '/eo/events/create',
            icon: Plus,
            active: isEventFormOrEdit,
        },
        {
            name: 'Event Saya',
            href: '/eo/events',
            icon: Calendar,
            active: isMyEvents,
        },
        {
            name: 'Transaksi & Peserta',
            href: '/eo/attendees',
            icon: Ticket,
            active: url.startsWith('/eo/attendees'),
        },
        {
            name: 'Check-in E-Tiket',
            href: '/eo/check-in',
            icon: QrCode,
            active: url.startsWith('/eo/check-in'),
        },
        {
            name: 'Profil Organisasi',
            href: '/eo/profile',
            icon: Building2,
            active: url.startsWith('/eo/profile'),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
            <Head title={`${title ? `${title} — ` : ''}EO Dashboard Hajirin`} />

            {/* Mobile Header Bar */}
            <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
                <Link href="/eo/dashboard" className="flex items-center gap-2.5">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                    <div>
                        <span className="text-sm font-semibold text-gray-900 block leading-tight">
                            Hajirin
                        </span>
                        <span className="text-xs text-gray-500 block leading-tight">
                            Creator Studio
                        </span>
                    </div>
                </Link>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-expanded={isMobileMenuOpen}
                    aria-label="Buka menu navigasi"
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                >
                    {isMobileMenuOpen ? (
                        <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                        <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    )}
                </button>
            </div>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                        isMobileMenuOpen ? 'translate-x-0 shadow-sm' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    {/* Brand Header */}
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200">
                        <img src="/hajirin_icon.svg" alt="Hajirin Logo" className="h-7 w-auto" />
                        <div>
                            <span className="text-base font-semibold text-gray-900 block leading-tight">
                                Hajirin
                            </span>
                            <span className="text-xs text-gray-500 block leading-tight">
                                Creator Studio
                            </span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto px-3 py-4">
                        <p className="px-3 text-xs font-medium text-gray-500 mb-2">
                            Menu penyelenggara
                        </p>
                        <nav aria-label="Menu penyelenggara" className="space-y-1">
                            {workspaceMenu.map((item) => {
                                const Icon = item.icon;
                                const isAnchor = item.href.startsWith('#');
                                const Component = isAnchor ? 'a' : Link;

                                return (
                                    <Component
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                                            item.active
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={`size-4 shrink-0 transition-colors ${
                                                    item.active
                                                        ? 'text-gray-900'
                                                        : 'text-gray-400 group-hover:text-gray-600'
                                                }`}
                                                strokeWidth={1.75}
                                                aria-hidden="true"
                                            />
                                            <span>{item.name}</span>
                                        </div>
                                    </Component>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Links */}
                    <div className="border-t border-gray-200 p-3 space-y-1">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            <ExternalLink
                                className="size-4 text-gray-400"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            Lihat Beranda Publik
                        </Link>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                        >
                            <LogOut
                                className="size-4 text-gray-400"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            Keluar Akun
                        </Link>
                    </div>
                </aside>

                {/* Mobile Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
                    {/* Topbar Header */}
                    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="hidden sm:inline">Creator Studio</span>
                            <span className="hidden sm:inline" aria-hidden="true">/</span>
                            <span className="font-medium text-gray-900">{title || 'Dashboard EO'}</span>
                        </div>

                        {/* Topbar Right Controls */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    aria-expanded={isProfileDropdownOpen}
                                    aria-haspopup="menu"
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                                >
                                    <div className="size-8 rounded-full bg-gray-200 text-gray-800 font-medium text-xs flex items-center justify-center shrink-0">
                                        {initials}
                                    </div>
                                    <div className="hidden sm:block leading-tight">
                                        <p className="text-sm font-medium text-gray-900 max-w-44 truncate">
                                            {displayOrgName}
                                        </p>
                                        <p className="text-xs text-gray-500">Event Organizer</p>
                                    </div>
                                    <ChevronDown
                                        className="size-4 text-gray-400 hidden sm:block"
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                    />
                                </button>

                                {isProfileDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            aria-hidden="true"
                                        />
                                        <div
                                            role="menu"
                                            className="absolute right-0 mt-2 w-60 rounded-lg bg-white border border-gray-200 shadow-sm py-1.5 z-40 text-sm"
                                        >
                                            <div className="px-4 py-2.5 border-b border-gray-200">
                                                <p className="font-medium text-gray-900 truncate">{displayOrgName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.name} · {user.email}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Penyelenggara terverifikasi
                                                </p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/eo/profile"
                                                    role="menuitem"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                                                >
                                                    <Building2
                                                        className="size-4 text-gray-400"
                                                        strokeWidth={1.75}
                                                        aria-hidden="true"
                                                    />
                                                    Profil Organisasi
                                                </Link>
                                                <Link
                                                    href="/"
                                                    role="menuitem"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                                                >
                                                    <ExternalLink
                                                        className="size-4 text-gray-400"
                                                        strokeWidth={1.75}
                                                        aria-hidden="true"
                                                    />
                                                    Lihat Beranda Publik
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-200 pt-1">
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    role="menuitem"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
                                                >
                                                    <LogOut
                                                        className="size-4 text-gray-400"
                                                        strokeWidth={1.75}
                                                        aria-hidden="true"
                                                    />
                                                    Keluar Akun
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Content Body */}
                    <main id="content" tabIndex={-1} className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="px-6 py-4 border-t border-gray-200 bg-white text-xs text-gray-500 mt-auto">
                        <p>© 2026 Hajirin Creator Studio — Panel Manajemen Event &amp; E-Ticketing Penyelenggara.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
