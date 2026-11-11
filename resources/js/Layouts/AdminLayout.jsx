import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    Building2,
    Ticket,
    UserCheck,
    QrCode,
    Users,
    FileText,
    Settings,
    Search,
    Bell,
    Clock,
    Palette,
    ChevronDown,
    ChevronRight,
    LogOut,
    ExternalLink,
    Menu,
    X,
    Shield,
} from 'lucide-react';

export default function AdminLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'Admin', email: 'admin@hajirin.com', role: 'ADMIN' };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSubmenu = (name) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleNavigate = () => {
        setIsMobileMenuOpen(false);
    };

    // Initial avatar letters
    const initials = user.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'AD';

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin/dashboard';

    const workspaceMenu = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
            active: currentPath === '/admin/dashboard' || currentPath === '/admin',
        },
        {
            name: 'Kelola Events',
            href: '#events',
            icon: Calendar,
            badge: '42',
            badgeColor: 'bg-blue-100 text-blue-700',
            active: false,
        },
        {
            name: 'Organizers (EO)',
            icon: Building2,
            active: false,
            children: [
                { name: 'Daftar Penyelenggara', href: '#organizers' },
                { name: 'Pengajuan & Verifikasi', href: '#organizer-applications', badge: '2', badgeColor: 'bg-amber-100 text-amber-700' },
                { name: 'Laporan Performa EO', href: '#organizer-performance' },
            ],
        },
        {
            name: 'Tiket & Transaksi',
            icon: Ticket,
            active: false,
            children: [
                { name: 'Semua Pesanan', href: '#orders' },
                { name: 'Status Pembayaran', href: '#payments' },
                { name: 'Pengembalian Dana (Refund)', href: '#refunds' },
            ],
        },
        {
            name: 'Verifikasi EO',
            href: '#verifikasi-eo',
            icon: UserCheck,
            badge: '2',
            badgeColor: 'bg-amber-100 text-amber-700',
            active: false,
        },
        {
            name: 'Check-in Scanner',
            href: '#scanner',
            icon: QrCode,
            active: false,
        },
    ];

    const managementMenu = [
        {
            name: 'Kelola Pengguna',
            href: '#users',
            icon: Users,
            active: false,
        },
        {
            name: 'Laporan & Keuangan',
            icon: FileText,
            active: false,
            children: [
                { name: 'Ringkasan Pendapatan', href: '#reports-revenue' },
                { name: 'Komisi Platform', href: '#reports-commission' },
                { name: 'Rekapitulasi Penjualan', href: '#reports-sales' },
            ],
        },
        {
            name: 'Pengaturan Sistem',
            icon: Settings,
            active: false,
            children: [
                { name: 'Pengaturan Umum', href: '#settings-general' },
                { name: 'Tarif Biaya Layanan', href: '#settings-fees' },
                { name: 'Log & Keamanan Sistem', href: '#settings-security' },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
            <Head title={`${title ? `${title} — ` : ''}Admin Hajirin`} />

            {/* Mobile Header Bar */}
            <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                    <div>
                        <span className="font-extrabold text-base tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                        <span className="text-[10px] block font-medium text-slate-400 -mt-1">Platform Admin</span>
                    </div>
                </Link>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
            </div>

            <div className="flex flex-1">
                {/* Desktop & Mobile Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                        }`}
                >
                    {/* Brand Header */}
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
                        <img src="/hajirin_icon.svg" alt="Hajirin Logo" className="h-8 w-auto" />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-lg tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                            </div>
                            <span className="text-[11px] block font-medium text-slate-400 -mt-0.5 tracking-wide">
                                Dashboard Admin
                            </span>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
                        {/* WORKSPACE SECTION */}
                        <div>
                            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Workspace
                            </p>
                            <nav className="space-y-1">
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

                        {/* MANAJEMEN SECTION */}
                        <div>
                            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Manajemen
                            </p>
                            <nav className="space-y-1">
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
                </aside>

                {/* Mobile Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
                    {/* Topbar Header */}
                    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
                        {/* Search Bar matching mockup */}
                        <div className="flex-1 max-w-lg">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari event, nomor order, nama peserta, atau EO..."
                                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition"
                                />
                            </div>
                        </div>

                        {/* Topbar Right Controls */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* User Avatar & Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
                                >
                                    <div className="size-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                        {initials}
                                    </div>
                                    <div className="hidden sm:block leading-tight">
                                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                        <p className="text-[11px] text-slate-500">Super Admin</p>
                                    </div>
                                    <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
                                </button>

                                {/* Dropdown menu */}
                                {isProfileDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-40 text-sm animate-scale-up">
                                            <div className="px-4 py-2 border-b border-slate-100">
                                                <p className="font-semibold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                                    <Shield className="size-3" />
                                                    Platform Owner
                                                </span>
                                            </div>

                                            <div className="py-1">
                                                <Link
                                                    href="/"
                                                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    <ExternalLink className="size-4 text-slate-400" />
                                                    Lihat Beranda Publik
                                                </Link>
                                            </div>

                                            <div className="border-t border-slate-100 pt-1">
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition text-left"
                                                >
                                                    <LogOut className="size-4" />
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
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 mt-auto">
                        <p>© 2026 Hajirin — Platform Manajemen Event & E-Ticketing Terpadu.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}

function SidebarMenuItem({ item, openSubmenus, toggleSubmenu, onNavigate }) {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isOpen = Boolean(openSubmenus[item.name]);

    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    type="button"
                    onClick={() => toggleSubmenu(item.name)}
                    aria-expanded={isOpen}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        item.active || isOpen
                            ? 'bg-slate-100/80 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <item.icon
                            className={`size-4.5 transition-colors ${
                                item.active || isOpen
                                    ? 'text-blue-700'
                                    : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                        />
                        <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {item.badge && (
                            <span
                                className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}
                            >
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight
                            className={`size-4 text-slate-400 transition-transform duration-200 ${
                                isOpen ? 'rotate-90 text-blue-700' : 'group-hover:text-slate-600'
                            }`}
                        />
                    </div>
                </button>

                {isOpen && (
                    <div className="ml-5.5 pl-3 border-l-2 border-slate-200/90 space-y-1 py-1 animate-fade-in">
                        {item.children.map((subItem) => (
                            <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={onNavigate}
                                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    subItem.active
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <span>{subItem.name}</span>
                                {subItem.badge && (
                                    <span
                                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                            subItem.badgeColor || 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
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
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <div className="flex items-center gap-3">
                <item.icon
                    className={`size-4.5 transition-colors ${
                        item.active ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                />
                <span>{item.name}</span>
            </div>
            {item.badge && (
                <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

