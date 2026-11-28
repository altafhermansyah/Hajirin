import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, useHttp, usePage } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    QrCode,
    Search,
    ShieldCheck,
    Tag,
    Ticket,
    Users,
    X,
} from 'lucide-react';
import NotificationBell from '../Components/NotificationBell';
import LogoutConfirmDialog from '../Components/LogoutConfirmDialog';
import { Avatar } from '../Components/ui/Avatar';

export default function AdminLayout({ title, children }) {
    const { url, props } = usePage();
    const { auth, adminCounts } = props;
    const user = auth?.user || { name: 'Admin', email: 'admin@hajirin.com', role: 'ADMIN' };

    const currentPath = url ? url.split('?')[0] : '/admin/dashboard';
    const isTicketSection =
        currentPath.startsWith('/admin/orders') ||
        currentPath.startsWith('/admin/tickets') ||
        currentPath.startsWith('/admin/refunds');

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState({
        'Organizers (EO)': currentPath.startsWith('/admin/organizers'),
        'Tiket & Transaksi': isTicketSection,
    });

    useEffect(() => {
        if (!isMobileMenuOpen && !isProfileDropdownOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsProfileDropdownOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen, isProfileDropdownOpen]);

    const toggleSubmenu = (name) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleNavigate = () => {
        setIsMobileMenuOpen(false);
    };

    const pendingAppsCount = adminCounts?.pendingApplications || 0;
    const pendingEventsCount = adminCounts?.pendingEvents || 0;
    const pendingRefundsCount = adminCounts?.pendingRefunds || 0;

    const workspaceMenu = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
            active: currentPath === '/admin/dashboard' || currentPath === '/admin',
        },
        {
            name: 'Kelola Events',
            href: '/admin/events',
            icon: Calendar,
            active: currentPath.startsWith('/admin/events'),
            badge: pendingEventsCount > 0 ? String(pendingEventsCount) : null,
        },
        {
            name: 'Organizers (EO)',
            icon: Building2,
            active: currentPath.startsWith('/admin/organizers'),
            badge: pendingAppsCount > 0 ? String(pendingAppsCount) : null,
            children: [
                {
                    name: 'Daftar Penyelenggara',
                    href: '/admin/organizers',
                    active: currentPath === '/admin/organizers',
                },
                {
                    name: 'Pengajuan & Verifikasi',
                    href: '/admin/organizers/applications',
                    active: currentPath.startsWith('/admin/organizers/applications'),
                    badge: pendingAppsCount > 0 ? String(pendingAppsCount) : null,
                },
            ],
        },
        {
            name: 'Tiket & Transaksi',
            icon: Ticket,
            active: isTicketSection,
            badge: pendingRefundsCount > 0 ? String(pendingRefundsCount) : null,
            children: [
                {
                    name: 'Semua Pesanan',
                    href: '/admin/orders',
                    active: currentPath.startsWith('/admin/orders'),
                },
                {
                    name: 'Daftar Tiket Peserta',
                    href: '/admin/tickets',
                    active: currentPath.startsWith('/admin/tickets'),
                },
                {
                    name: 'Pengembalian Dana (Refund)',
                    href: '/admin/refunds',
                    active: currentPath.startsWith('/admin/refunds'),
                    badge: pendingRefundsCount > 0 ? String(pendingRefundsCount) : null,
                },
            ],
        },
        {
            name: 'Check-in Scanner',
            href: '/admin/scanner',
            icon: QrCode,
            active: currentPath.startsWith('/admin/scanner') || currentPath.startsWith('/admin/check-in'),
        },
    ];

    const managementMenu = [
        {
            name: 'Kelola Kategori',
            href: '/admin/categories',
            icon: Tag,
            active: currentPath.startsWith('/admin/categories'),
        },
        {
            name: 'Kelola Pengguna',
            href: '/admin/users',
            icon: Users,
            active: currentPath.startsWith('/admin/users'),
        },
        {
            name: 'Laporan & Keuangan',
            href: '/admin/reports',
            icon: FileText,
            active: currentPath.startsWith('/admin/reports'),
        },
        {
            name: 'Log Audit',
            href: '/admin/audit-logs',
            icon: ShieldCheck,
            active: currentPath.startsWith('/admin/audit-logs'),
        },
    ];

    return (
        <div className="min-h-dvh bg-slate-50 text-slate-900 font-sans flex flex-col">
            <Head title={`${title ? `${title} - ` : ''}Admin Hajirin`} />
            <a
                href="#admin-main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
            >
                Lewati ke konten utama
            </a>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                        isMobileMenuOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    {/* Brand Header (unified with EoLayout) */}
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
                        <img src="/hajirin_icon.svg" alt="Hajirin Logo" className="h-7 w-auto" />
                        <div className="leading-tight">
                            <span className="text-base font-semibold text-slate-900 block">Hajirin</span>
                            <span className="text-xs text-slate-500 block">Platform Admin</span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                        <div>
                            <p className="px-3 text-xs font-medium text-slate-400 mb-2">Workspace</p>
                            <nav aria-label="Menu workspace admin" className="space-y-1">
                                {workspaceMenu.map((item) => (
                                    <SidebarMenuItem
                                        key={item.name}
                                        item={item}
                                        openSubmenus={openSubmenus}
                                        toggleSubmenu={toggleSubmenu}
                                        onNavigate={handleNavigate}
                                    />
                                ))}
                            </nav>
                        </div>

                        <div>
                            <p className="px-3 text-xs font-medium text-slate-400 mb-2">Manajemen</p>
                            <nav aria-label="Menu manajemen admin" className="space-y-1">
                                {managementMenu.map((item) => (
                                    <SidebarMenuItem
                                        key={item.name}
                                        item={item}
                                        openSubmenus={openSubmenus}
                                        toggleSubmenu={toggleSubmenu}
                                        onNavigate={handleNavigate}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Bottom Links (aligned with EoLayout) */}
                    <div className="border-t border-slate-200 p-3 space-y-1">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                        >
                            <ExternalLink className="size-4 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                            Lihat Beranda Publik
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsLogoutOpen(true);
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                        >
                            <LogOut className="size-4 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                            Keluar Akun
                        </button>
                    </div>
                </aside>

                {/* Mobile Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
                    {/* Single Unified Topbar Header (no double sticky bar on mobile) */}
                    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                                aria-expanded={isMobileMenuOpen}
                                aria-label="Buka menu navigasi"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="size-5" aria-hidden="true" />
                                ) : (
                                    <Menu className="size-5" aria-hidden="true" />
                                )}
                            </button>
                            <AdminGlobalSearch />
                        </div>

                        <div className="flex items-center gap-2.5">
                            <NotificationBell />

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    aria-expanded={isProfileDropdownOpen}
                                    aria-haspopup="menu"
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer"
                                >
                                    <Avatar name={user.name} src={user.avatar_path} size="sm" />
                                    <div className="hidden sm:block leading-tight">
                                        <p className="text-sm font-medium text-slate-900 max-w-40 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-slate-500">Super Admin</p>
                                    </div>
                                    <ChevronDown className="size-4 text-slate-400 hidden sm:block" aria-hidden="true" />
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
                                            className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-40 text-sm animate-scale-up"
                                        >
                                            <div className="px-4 py-2.5 border-b border-slate-100">
                                                <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/"
                                                    role="menuitem"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    <ExternalLink className="size-4 text-slate-400" aria-hidden="true" />
                                                    Lihat Beranda Publik
                                                </Link>
                                            </div>

                                            <div className="border-t border-slate-100 pt-1">
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        setIsLogoutOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition text-left cursor-pointer"
                                                >
                                                    <LogOut className="size-4 text-slate-400" aria-hidden="true" />
                                                    Keluar Akun
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Content Body */}
                    <main id="admin-main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 mt-auto">
                        <p>© 2026 Hajirin - Platform Manajemen Event &amp; E-Ticketing Terpadu.</p>
                    </footer>
                </div>
            </div>

            <LogoutConfirmDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
        </div>
    );
}

function SidebarMenuItem({ item, openSubmenus, toggleSubmenu, onNavigate }) {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isOpen = Boolean(openSubmenus[item.name]);
    const Icon = item.icon;

    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    type="button"
                    onClick={() => toggleSubmenu(item.name)}
                    aria-expanded={isOpen}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue cursor-pointer ${
                        item.active || isOpen
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <Icon
                            className={`size-4 shrink-0 transition-colors ${
                                item.active || isOpen
                                    ? 'text-slate-900'
                                    : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                            strokeWidth={1.75}
                            aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded-md bg-slate-200/80 text-slate-700 tabular-nums">
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight
                            className={`size-4 text-slate-400 transition-transform duration-200 ${
                                isOpen ? 'rotate-90 text-slate-700' : 'group-hover:text-slate-600'
                            }`}
                            aria-hidden="true"
                        />
                    </div>
                </button>

                {isOpen && (
                    <div className="ml-5 pl-3 border-l border-slate-200 space-y-0.5 py-0.5">
                        {item.children.map((subItem) => (
                            <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={onNavigate}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                                    subItem.active
                                        ? 'bg-slate-100 text-slate-900 font-semibold'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <span className="truncate">{subItem.name}</span>
                                {subItem.badge && (
                                    <span className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-slate-200/80 text-slate-700 tabular-nums">
                                        {subItem.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
                item.active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <Icon
                    className={`size-4 shrink-0 transition-colors ${
                        item.active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
            </div>
            {item.badge && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-md bg-slate-200/80 text-slate-700 tabular-nums">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

const SEARCH_GROUPS = [
    { key: 'events', label: 'Event' },
    { key: 'orders', label: 'Pesanan' },
    { key: 'organizers', label: 'Event Organizer (EO)' },
    { key: 'users', label: 'Pengguna' },
];

function AdminGlobalSearch() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState({ events: [], orders: [], organizers: [], users: [] });
    const containerRef = useRef(null);
    const http = useHttp({});

    useEffect(() => {
        const trimmed = query.trim();

        if (trimmed.length < 2) {
            setResults({ events: [], orders: [], organizers: [], users: [] });
            return;
        }

        const timer = setTimeout(() => {
            http.get(`/admin/search?q=${encodeURIComponent(trimmed)}`, {
                onSuccess: (data) => {
                    if (data && typeof data === 'object') {
                        setResults({
                            events: data.events || [],
                            orders: data.orders || [],
                            organizers: data.organizers || [],
                            users: data.users || [],
                        });
                    }
                },
            });
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const firstMatch =
        results.events[0] || results.orders[0] || results.organizers[0] || results.users[0] || null;

    const totalResults =
        results.events.length +
        results.orders.length +
        results.organizers.length +
        results.users.length;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;

        setIsOpen(false);
        router.visit(firstMatch ? firstMatch.href : `/admin/events?search=${encodeURIComponent(trimmed)}`);
    };

    return (
        <div ref={containerRef} className="relative flex-1 max-w-lg">
            <form onSubmit={handleSubmit} className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                    type="search"
                    enterKeyHint="search"
                    aria-label="Cari event, nomor order, nama peserta, atau EO"
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    placeholder="Cari event, nomor order, nama peserta, atau EO..."
                    className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-blue/25 transition"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setResults({ events: [], orders: [], organizers: [], users: [] });
                        }}
                        aria-label="Hapus pencarian"
                        className="absolute right-2 p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                )}
            </form>

            {isOpen && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
                    {http.processing ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">
                            Mencari &ldquo;{query.trim()}&rdquo;...
                        </div>
                    ) : totalResults === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">
                            Tidak ditemukan hasil untuk &ldquo;{query.trim()}&rdquo;.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {SEARCH_GROUPS.map((group) => {
                                const items = results[group.key];
                                if (!items || items.length === 0) return null;

                                return (
                                    <div key={group.key} className="py-1.5">
                                        <p className="px-3.5 py-1 text-xs font-medium text-slate-400">
                                            {group.label}
                                        </p>
                                        {items.map((item) => (
                                            <Link
                                                key={`${group.key}-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center justify-between gap-3 px-3.5 py-2 hover:bg-slate-50 transition"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-900 truncate">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {item.sublabel}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                    {item.badge}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
