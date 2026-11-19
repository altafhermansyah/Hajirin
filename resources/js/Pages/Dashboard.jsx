import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import QrCodeSvg from '../Components/QrCodeSvg';
import {
    ArrowLeft, ArrowRight, Bookmark, Building2, CalendarDays, ChevronRight, Clock3,
    CreditCard, LayoutDashboard, LogOut, MapPin, Ticket, Trash2, UserRound,
    QrCode, Printer, X, Check, Copy, Sparkles, ShieldCheck, AlertCircle, CheckCircle2
} from 'lucide-react';

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function Dashboard({ auth, dashboard }) {
    const user = auth.user;
    const { flash } = usePage().props;
    const [selectedETicket, setSelectedETicket] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [activeTicketTab, setActiveTicketTab] = useState('aktif');

    // State untuk edit profil
    const [profileName, setProfileName] = useState(user.name || '');
    const [profilePhone, setProfilePhone] = useState(user.phone || '');
    const [profilePassword, setProfilePassword] = useState('');
    const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
    const [profileErrors, setProfileErrors] = useState({});
    const [bookmarkToast, setBookmarkToast] = useState(null);

    const navItems = [
        { icon: LayoutDashboard, label: 'Ringkasan', href: '#ringkasan' },
        { icon: Ticket, label: 'Tiket saya', href: '#tiket' },
        { icon: CreditCard, label: 'Pesanan', href: '#pesanan' },
        { icon: Bookmark, label: 'Event Disimpan (Bookmark)', href: '#bookmark' },
        { icon: UserRound, label: 'Profil Saya', href: '#profil' },
        { icon: Building2, label: 'Jadi Penyelenggara (EO)', href: '/eo-applications/create', isPageLink: true },
    ];

    const myTickets = dashboard.myTickets || [];
    const filteredTickets = myTickets.filter(t => {
        if (activeTicketTab === 'aktif') return t.status === 'ACTIVE';
        if (activeTicketTab === 'digunakan') return t.status === 'USED';
        return true;
    });

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileErrors({});
        setProfileSuccessMsg(null);

        router.put('/profile', {
            name: profileName,
            phone: profilePhone,
            password: profilePassword || undefined,
            password_confirmation: profilePasswordConfirm || undefined,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingProfile(false);
                setProfilePassword('');
                setProfilePasswordConfirm('');
                setProfileSuccessMsg('Profil berhasil diperbarui!');
                setTimeout(() => setProfileSuccessMsg(null), 4000);
            },
            onError: (errs) => {
                setIsSavingProfile(false);
                setProfileErrors(errs);
            },
        });
    };

    const handleRemoveBookmark = (eventId, eventSlug, eventTitle) => {
        router.post(`/events/${eventId || eventSlug}/bookmark`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setBookmarkToast(`"${eventTitle}" berhasil dihapus dari simpanan.`);
                setTimeout(() => setBookmarkToast(null), 3000);
            },
            onError: () => {
                setBookmarkToast('Gagal menghapus event dari simpanan.');
                setTimeout(() => setBookmarkToast(null), 3000);
            },
        });
    };

    const handleCopyCode = (code) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2500);
        }
    };

    const handlePrintTicket = () => {
        window.print();
    };

    return (
        <>
            <Head title="Dashboard — Hajirin" />
            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
                {/* Sidebar */}
                <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
                    <Link href="/" className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
                        <img src="/hajirin_icon.svg" alt="" className="h-8 w-auto" />
                        <span className="text-lg font-bold tracking-tight text-navy">HAJIRIN</span>
                    </Link>
                    <div className="px-4 py-6">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu akun</p>
                        <nav className="space-y-1">
                            {navItems.map((item, index) => {
                                const Icon = item.icon;
                                const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                    index === 0
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`;

                                return item.isPageLink ? (
                                    <Link key={item.href} href={item.href} className={className}>
                                        <Icon className="size-4" />
                                        {item.label}
                                    </Link>
                                ) : (
                                    <a key={item.href} href={item.href} className={className}>
                                        <Icon className="size-4" />
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="mt-auto border-t border-slate-100 p-4">
                        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                            <ArrowLeft className="size-4" />Kembali ke beranda
                        </Link>
                        <Link href="/logout" method="post" as="button" className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition">
                            <LogOut className="size-4" />Keluar
                        </Link>
                    </div>
                </aside>

                <div className="lg:pl-64">
                    {/* Header */}
                    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
                        <Link href="/" className="flex items-center gap-2 lg:hidden">
                            <img src="/hajirin_icon.svg" alt="" className="h-7" />
                            <span className="font-bold text-navy">HAJIRIN</span>
                        </Link>
                        <p className="hidden text-sm text-slate-500 lg:block">
                            Dashboard / <span className="font-medium text-slate-900">Ringkasan</span>
                        </p>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="hidden text-right sm:block">
                                <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                                <span className="block text-xs text-slate-500">Akun Pengunjung</span>
                            </span>
                            <span className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <Link href="/logout" method="post" as="button" className="text-sm font-medium text-slate-500 hover:text-red-600 lg:hidden">
                                Keluar
                            </Link>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
                        {flash?.success && (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 shadow-xs">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                <p className="font-medium">{flash.success}</p>
                            </div>
                        )}

                        {flash?.error && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 shadow-xs">
                                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                                <p className="font-medium">{flash.error}</p>
                            </div>
                        )}

                        {/* Welcome Banner */}
                        <section id="ringkasan" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-sm font-medium text-blue-700 flex items-center gap-1.5">
                                    <Sparkles className="size-4" /> Ruang Akun Hajirin
                                </p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    Halo, {user.name.split(' ')[0]}!
                                </h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Kelola e-tiket dan pantau seluruh aktivitas event yang kamu ikuti.
                                </p>
                            </div>
                            <Link
                                href="/#event-unggulan"
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
                            >
                                <Ticket className="size-4" /> Jelajahi Event Lain
                            </Link>
                        </section>

                        {/* Stat Cards */}
                        <section className="grid gap-4 sm:grid-cols-3">
                            <StatCard
                                icon={Ticket}
                                label="Total Tiket Aktif"
                                value={dashboard.ticketCount}
                                detail="E-Tiket siap digunakan di venue"
                            />
                            <StatCard
                                icon={CalendarDays}
                                label="Event Mendatang"
                                value={dashboard.upcomingEventCount ?? 0}
                                detail="Jadwal event yang belum berlangsung"
                            />
                            <StatCard
                                icon={CreditCard}
                                label="Total Transaksi"
                                value={dashboard.orderCount}
                                detail="Pesanan lunas tercatat di sistem"
                            />
                        </section>

                        {/* Section: E-Tiket Saya */}
                        <section id="tiket" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden scroll-mt-20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6 gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Ticket className="size-5 text-blue-700" />
                                        E-Tiket Saya
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Tunjukkan barcode atau kode e-tiket saat registrasi ulang di lokasi acara.
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTicketTab('aktif')}
                                        className={`px-3 py-1.5 rounded-lg transition ${
                                            activeTicketTab === 'aktif' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Aktif ({myTickets.filter(t => t.status === 'ACTIVE').length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTicketTab('semua')}
                                        className={`px-3 py-1.5 rounded-lg transition ${
                                            activeTicketTab === 'semua' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Semua ({myTickets.length})
                                    </button>
                                </div>
                            </div>

                            {filteredTickets.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {filteredTickets.map((ticket) => (
                                        <article
                                            key={ticket.id}
                                            className="p-5 sm:p-6 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                                        >
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={ticket.banner}
                                                    alt=""
                                                    className="size-20 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-100"
                                                />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                                                            {ticket.ticketType}
                                                        </span>
                                                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                                                            ticket.status === 'ACTIVE'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {ticket.status === 'ACTIVE' ? '✓ Siap Digunakan' : 'Sudah Digunakan'}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                                                        {ticket.eventTitle}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                        <CalendarDays className="size-3.5 text-slate-400 shrink-0" />
                                                        <span>{ticket.eventDate}</span>
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{ticket.eventLocation}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 gap-3">
                                                <div className="text-left md:text-right">
                                                    <p className="text-[11px] text-slate-400">Kode E-Tiket</p>
                                                    <p className="font-mono text-xs sm:text-sm font-bold text-slate-900">{ticket.ticketCode}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedETicket(ticket)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
                                                >
                                                    <QrCode className="size-3.5" />
                                                    <span>Lihat QR Code & Tiket</span>
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Ticket}
                                    title="Belum ada tiket pada kategori ini"
                                    message="Tiket dari pesanan yang berhasil kamu bayar akan otomatis muncul dan dapat discan di sini."
                                    action="Beli tiket event sekarang"
                                    href="/#event-unggulan"
                                />
                            )}
                        </section>

                        {/* Section: Bookmark Event */}
                        <section id="bookmark" className="rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-20">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div>
                                    <h2 className="font-bold text-slate-900">Event Disimpan (Bookmark)</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Daftar acara yang kamu tandai dan simpan untuk diikuti.
                                    </p>
                                </div>
                                <Bookmark className="size-5 text-amber-500" />
                            </div>

                            {dashboard.bookmarkedEvents && dashboard.bookmarkedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                                    {dashboard.bookmarkedEvents.map((evt) => (
                                        <div
                                            key={evt.id || evt.slug}
                                            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
                                        >
                                            <div className="relative h-36 overflow-hidden bg-slate-100">
                                                <img
                                                    src={evt.image}
                                                    alt={evt.title}
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-xs text-navy">
                                                    {evt.category}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBookmark(evt.id, evt.slug, evt.title)}
                                                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-xs hover:bg-rose-50 transition"
                                                    title="Hapus dari Simpanan"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                            <div className="flex flex-1 flex-col p-4">
                                                <p className="mb-1 flex items-center text-[11px] font-semibold text-blue-700">
                                                    <CalendarDays className="mr-1 size-3" />
                                                    {evt.date}
                                                </p>
                                                <h3 className="mb-1 text-sm font-bold leading-snug text-slate-900 line-clamp-2">
                                                    {evt.title}
                                                </h3>
                                                <p className="mb-3 flex items-center text-xs text-slate-500">
                                                    <MapPin className="mr-1 size-3 text-slate-400 shrink-0" />
                                                    <span className="truncate">{evt.place}</span>
                                                </p>
                                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400">Harga Mulai</p>
                                                        <p className="text-sm font-bold text-blue-700">{evt.price}</p>
                                                    </div>
                                                    <Link
                                                        href={`/event/${evt.slug}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition"
                                                    >
                                                        Buka Event
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Bookmark}
                                    title="Belum ada event yang disimpan"
                                    message="Tandai event menarik dengan menekan ikon bookmark di halaman utama atau halaman detail event untuk menyimpannya di sini."
                                    action="Jelajahi Event Sekarang"
                                    href="/#event-unggulan"
                                />
                            )}
                        </section>

                        {/* Section: Pesanan & Profil */}
                        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                            <div id="pesanan" className="rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-20">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <div>
                                        <h2 className="font-bold text-slate-900">Riwayat Pesanan</h2>
                                        <p className="mt-0.5 text-xs text-slate-500">Daftar transaksi akunmu di platform Hajirin.</p>
                                    </div>
                                    <Clock3 className="size-5 text-slate-400" />
                                </div>
                                {dashboard.recentOrders.length ? (
                                    <div className="divide-y divide-slate-100">
                                        {dashboard.recentOrders.map((order) => (
                                            <div key={order.order_reference} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{order.title}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Ref: <span className="font-mono font-medium">{order.order_reference}</span> · {dateTime.format(new Date(order.created_at))}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-bold text-slate-900">{currency.format(Number(order.total_amount))}</p>
                                                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        order.status === 'PAID'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : order.status === 'PENDING'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {order.status === 'PAID' ? 'Lunas' : order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={CreditCard}
                                        title="Belum ada pesanan"
                                        message="Pesanan tiket yang kamu buat akan tercatat secara rinci di sini."
                                    />
                                )}
                            </div>

                            <div id="profil" className="rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-20">
                                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                                    <h2 className="font-bold text-slate-900">Profil & Pengaturan Akun</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">Kelola informasi pribadi dan keamanan akun kamu.</p>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="space-y-4 p-5 sm:p-6">
                                    {profileSuccessMsg && (
                                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                            <span>{profileSuccessMsg}</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                        {profileErrors.name && (
                                            <p className="mt-1 text-xs text-rose-600">{profileErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-[11px] text-slate-400">Email akun tidak dapat diubah untuk menjaga integritas tiket terbitan.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon (WhatsApp)</label>
                                        <input
                                            type="text"
                                            value={profilePhone}
                                            onChange={(e) => setProfilePhone(e.target.value)}
                                            placeholder="Contoh: 08123456789"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                        {profileErrors.phone && (
                                            <p className="mt-1 text-xs text-rose-600">{profileErrors.phone}</p>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-900 mb-2">Ganti Kata Sandi (Opsional)</p>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-600 mb-1">Password Baru</label>
                                                <input
                                                    type="password"
                                                    value={profilePassword}
                                                    onChange={(e) => setProfilePassword(e.target.value)}
                                                    placeholder="Minimal 8 karakter"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                />
                                                {profileErrors.password && (
                                                    <p className="mt-1 text-xs text-rose-600">{profileErrors.password}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-600 mb-1">Konfirmasi Password</label>
                                                <input
                                                    type="password"
                                                    value={profilePasswordConfirm}
                                                    onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                                                    placeholder="Ulangi password baru"
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 transition"
                                        >
                                            {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/70 p-3.5 text-xs leading-relaxed text-blue-900 border border-blue-100">
                                        <ShieldCheck className="size-4 shrink-0 text-blue-700 mt-0.5" />
                                        <span>Data profil dan tiket kamu terlindungi dengan standar keamanan enkripsi data Hajirin.</span>
                                    </div>
                                </form>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                            <span>© 2026 Hajirin Indonesia · Temukan event, buat kenangan.</span>
                            <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-700 transition">
                                Kembali ke beranda <ChevronRight className="size-3.5" />
                            </Link>
                        </footer>
                    </main>
                </div>

                {/* Modal E-Tiket Interaktif & Scannable QR Code */}
                {selectedETicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
                            {/* Modal Header */}
                            <div className="bg-blue-700 text-white p-5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ticket className="size-5" />
                                    <span className="font-bold text-sm tracking-wide uppercase">E-Tiket Resmi Hajirin</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedETicket(null)}
                                    className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Ticket Content */}
                            <div className="p-6 space-y-5">
                                <div>
                                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                                        {selectedETicket.ticketType}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-900 mt-2 leading-snug">
                                        {selectedETicket.eventTitle}
                                    </h3>
                                </div>

                                {/* Scannable QR Code Box */}
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                                    <div className="size-44 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                                        <QrCodeSvg value={selectedETicket.ticketCode} className="size-full" />
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <p className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                                            {selectedETicket.ticketCode}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(selectedETicket.ticketCode)}
                                            className="text-slate-400 hover:text-blue-700 transition"
                                            title="Salin Kode Tiket"
                                        >
                                            {copiedCode === selectedETicket.ticketCode ? (
                                                <Check className="size-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tunjukkan barcode ini kepada petugas tiket saat check-in</p>
                                </div>

                                {/* Ticket Details */}
                                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Nama Peserta:</span>
                                        <span className="font-bold text-slate-900">{selectedETicket.attendeeName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Email:</span>
                                        <span className="font-medium text-slate-900">{selectedETicket.attendeeEmail}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Jadwal:</span>
                                        <span className="font-semibold text-slate-900">{selectedETicket.eventDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Lokasi:</span>
                                        <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">{selectedETicket.eventLocation}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handlePrintTicket}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                                    >
                                        <Printer className="size-4" /> Cetak Tiket
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedETicket(null)}
                                        className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {bookmarkToast && (
                    <div role="status" aria-live="polite" className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg animate-fade-in">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                        <p className="flex-1 text-sm font-medium text-slate-800">{bookmarkToast}</p>
                        <button type="button" onClick={() => setBookmarkToast(null)} aria-label="Tutup notifikasi" className="text-slate-400 hover:text-slate-700"><X className="size-4" /></button>
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="size-4" />
                </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </article>
    );
}

function EmptyState({ icon: Icon, title, message, action, href }) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon className="size-6" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
            {action && href && (
                <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                    {action} <ChevronRight className="size-3.5" />
                </Link>
            )}
        </div>
    );
}

function ProfileField({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800">
                <span className="truncate">{value}</span>
            </div>
        </div>
    );
}
