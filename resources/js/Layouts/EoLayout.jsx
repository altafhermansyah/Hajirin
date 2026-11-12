import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    QrCode,
    Users,
    Building2,
    ChevronDown,
    LogOut,
    ExternalLink,
    Menu,
    X,
    CheckCircle2,
    PlusCircle,
} from 'lucide-react';

export default function EoLayout({ title, organizerName, children }) {
    const { url, props } = usePage();
    const { auth } = props;
    const user = auth?.user || { name: 'Organizer', email: 'eo@hajirin.com', role: 'EO' };
    const displayOrgName = organizerName || user.name;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const initials = displayOrgName
        ? displayOrgName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'EO';

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
            icon: PlusCircle,
            active: url.startsWith('/eo/events'),
        },
        {
            name: 'Event Saya',
            href: '/eo/dashboard#event-saya',
            icon: Calendar,
            active: false,
        },
        {
            name: 'Transaksi & Peserta',
            href: '/eo/dashboard#transaksi',
            icon: Ticket,
            active: false,
        },
        {
            name: 'Check-in E-Tiket',
            href: '/eo/dashboard#event-saya',
            icon: QrCode,
            active: false,
        },
        {
            name: 'Profil Organisasi',
            href: '/eo/dashboard#profil-eo',
            icon: Building2,
            active: false,
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
            <Head title={`${title ? `${title} — ` : ''}EO Dashboard Hajirin`} />

            {/* Mobile Header Bar */}
            <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
                <Link href="/eo/dashboard" className="flex items-center gap-2">
                    <img src="/hajirin_icon.svg" alt="Hajirin" className="h-7 w-auto" />
                    <div>
                        <span className="font-extrabold text-base tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                        <span className="text-[10px] block font-medium text-indigo-600 -mt-1">Creator Studio (EO)</span>
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
                {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    {/* Brand Header */}
                    <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
                        <img src="/hajirin_icon.svg" alt="Hajirin Logo" className="h-8 w-auto" />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-lg tracking-tight text-[#0D1B2A]">HAJIRIN</span>
                            </div>
                            <span className="text-[11px] block font-semibold text-indigo-600 -mt-0.5 tracking-wide">
                                Event Organizer Studio
                            </span>
                        </div>
                    </div>

                    {/* Active Organization Card */}
                    <div className="px-3.5 pt-4">
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Penyelenggara Resmi
                            </p>
                            <p className="mt-1 text-xs font-extrabold text-slate-900 truncate">
                                {displayOrgName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
                        <div>
                            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Menu Penyelenggara
                            </p>
                            <nav className="space-y-1">
                                {workspaceMenu.map((item) => {
                                    const Icon = item.icon;
                                    const isAnchor = item.href.startsWith('#');
                                    const Component = isAnchor ? 'a' : Link;

                                    return (
                                        <Component
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                item.active
                                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon
                                                    className={`size-4.5 transition-colors ${
                                                        item.active
                                                            ? 'text-blue-700'
                                                            : 'text-slate-400 group-hover:text-slate-600'
                                                    }`}
                                                />
                                                <span>{item.name}</span>
                                            </div>
                                        </Component>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Bottom Links */}
                    <div className="border-t border-slate-100 p-3.5 space-y-1">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            <ExternalLink className="size-4 text-slate-400" />
                            Lihat Beranda Publik
                        </Link>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                        >
                            <LogOut className="size-4" />
                            Keluar Akun
                        </Link>
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
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="hidden sm:inline">Creator Studio</span>
                            <span className="hidden sm:inline">/</span>
                            <span className="font-semibold text-slate-900">{title || 'Dashboard EO'}</span>
                        </div>

                        {/* Topbar Right Controls */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
                                >
                                    <div className="size-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                        {initials}
                                    </div>
                                    <div className="hidden sm:block leading-tight">
                                        <p className="text-sm font-semibold text-slate-900 max-w-44 truncate">
                                            {displayOrgName}
                                        </p>
                                        <p className="text-[11px] text-indigo-600 font-medium">Event Organizer</p>
                                    </div>
                                    <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
                                </button>

                                {isProfileDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-40 text-sm">
                                            <div className="px-4 py-2.5 border-b border-slate-100">
                                                <p className="font-bold text-slate-900 truncate">{displayOrgName}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.name} · {user.email}</p>
                                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                                                    <Building2 className="size-3" />
                                                    Verified Event Organizer
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
                        <p>© 2026 Hajirin Creator Studio — Panel Manajemen Event & E-Ticketing Penyelenggara.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
