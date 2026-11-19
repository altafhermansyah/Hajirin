import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import QrCodeSvg from '../Components/QrCodeSvg';
import Navbar from '../Components/Navbar';
import {
    ArrowLeft, ArrowRight, Bookmark, Building2, CalendarDays, Check,
    CheckCircle2, Clock, Copy, CreditCard, LogOut, MapPin, Printer,
    QrCode, Search, ShieldCheck, Sparkles, Ticket, Trash2, UserRound,
    X, AlertCircle, ChevronRight, ExternalLink, Camera, UploadCloud,
    FileText, Info
} from 'lucide-react';

export default function Dashboard({ auth, dashboard }) {
    const user = auth.user;
    const { flash } = usePage().props;

    // Menentukan tab aktif berdasarkan URL hash (#tiket, #bookmark, #pesanan, #profil)
    const getInitialTab = () => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '');
            if (['tiket', 'bookmark', 'pesanan', 'profil'].includes(hash)) {
                return hash;
            }
        }
        return 'tiket';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [selectedETicket, setSelectedETicket] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [ticketFilter, setTicketFilter] = useState('aktif'); // 'aktif' | 'semua'

    // State form profil & ganti foto profil
    const [profileName, setProfileName] = useState(user.name || '');
    const [profilePhone, setProfilePhone] = useState(user.phone || '');
    const [profilePassword, setProfilePassword] = useState('');
    const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user.avatar_path || null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
    const [profileErrors, setProfileErrors] = useState({});
    const [bookmarkToast, setBookmarkToast] = useState(null);

    const fileInputRef = useRef(null);

    // Sinkronisasi tab saat hash di URL berubah
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (['tiket', 'bookmark', 'pesanan', 'profil'].includes(hash)) {
                setActiveTab(hash);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Sinkronisasi avatar saat user diperbarui
    useEffect(() => {
        setAvatarPreview(user.avatar_path || null);
    }, [user.avatar_path]);

    const myTickets = dashboard.myTickets || [];
    const filteredTickets = myTickets.filter((t) => {
        if (ticketFilter === 'aktif') return t.status === 'ACTIVE';
        return true;
    });

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        window.history.replaceState(null, '', `#${tabKey}`);
    };

    // Handler memilih foto profil baru dari perangkat
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileErrors({});
        setProfileSuccessMsg(null);

        const formData = new FormData();
        formData.append('name', profileName);
        formData.append('phone', profilePhone || '');
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        if (profilePassword) {
            formData.append('password', profilePassword);
            formData.append('password_confirmation', profilePasswordConfirm);
        }

        router.post('/profile', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingProfile(false);
                setProfilePassword('');
                setProfilePasswordConfirm('');
                setAvatarFile(null);
                setProfileSuccessMsg('Profil dan foto berhasil diperbarui!');
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

    return (
        <>
            <Head title="Akun Saya — Hajirin" />

            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
                <Navbar auth={auth} />

                {/* Main Content Area */}
                <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
                    {/* Flash Notifications */}
                    {flash?.success && (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs sm:text-sm text-emerald-900 shadow-2xs">
                            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                            <p className="font-medium">{flash.success}</p>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs sm:text-sm text-red-900 shadow-2xs">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                            <p className="font-medium">{flash.error}</p>
                        </div>
                    )}
                    {bookmarkToast && (
                        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs sm:text-sm text-blue-900 shadow-2xs">
                            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-600" />
                            <p className="font-medium">{bookmarkToast}</p>
                        </div>
                    )}

                    {/* User Profile Header Card */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-lg shadow-blue-900/10">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="relative size-16 sm:size-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 overflow-hidden shadow-inner shrink-0">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt={user.name} className="size-full object-cover" />
                                    ) : (
                                        <div className="size-full flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Halo, {user.name}!</h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                            <Sparkles className="size-3" /> Akun Aktif
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-blue-100">{user.email}</p>
                                    <p className="text-[11px] text-blue-200/80 mt-1">
                                        {user.phone ? `Nomor WhatsApp: ${user.phone}` : 'Belum menambahkan nomor WhatsApp'}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats Badges */}
                            <div className="flex flex-wrap items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                                <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2.5 border border-white/15 text-center min-w-[100px]">
                                    <p className="text-lg sm:text-xl font-extrabold">{myTickets.length}</p>
                                    <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Event Tiket</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2.5 border border-white/15 text-center min-w-[100px]">
                                    <p className="text-lg sm:text-xl font-extrabold">{dashboard.bookmarkedEvents?.length || 0}</p>
                                    <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Disimpan</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2.5 border border-white/15 text-center min-w-[100px]">
                                    <p className="text-lg sm:text-xl font-extrabold">{dashboard.orderCount || 0}</p>
                                    <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Pesanan</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Consumer Navigation Tabs */}
                    <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => handleTabChange('tiket')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'tiket'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <Ticket className="size-4" />
                            <span>Tiket Saya ({myTickets.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('bookmark')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'bookmark'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <Bookmark className="size-4" />
                            <span>Event Disimpan ({dashboard.bookmarkedEvents?.length || 0})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('pesanan')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'pesanan'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <CreditCard className="size-4" />
                            <span>Riwayat Pesanan ({dashboard.orderCount || 0})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('profil')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'profil'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <UserRound className="size-4" />
                            <span>Profil & Akun</span>
                        </button>
                    </div>

                    {/* TAB 1: E-TIKET SAYA */}
                    {activeTab === 'tiket' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-navy">Daftar E-Tiket Saya</h2>
                                    <p className="text-xs text-slate mt-0.5">
                                        Klik tombol detail pada tiket untuk melihat barcode QR per tiket untuk masing-masing peserta.
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 text-xs font-semibold self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setTicketFilter('aktif')}
                                        className={`px-3 py-1.5 rounded-lg transition ${
                                            ticketFilter === 'aktif' ? 'bg-white text-brand-blue shadow-2xs' : 'text-slate hover:text-navy'
                                        }`}
                                    >
                                        Siap Digunakan ({myTickets.filter((t) => t.status === 'ACTIVE').length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTicketFilter('semua')}
                                        className={`px-3 py-1.5 rounded-lg transition ${
                                            ticketFilter === 'semua' ? 'bg-white text-brand-blue shadow-2xs' : 'text-slate hover:text-navy'
                                        }`}
                                    >
                                        Semua ({myTickets.length})
                                    </button>
                                </div>
                            </div>

                            {/* Daftar E-Tiket: Menampilkan 1 tiket pass per event yang dibeli */}
                            {filteredTickets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {filteredTickets.map((ticket) => (
                                        <article
                                            key={ticket.id || ticket.orderReference}
                                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                                        >
                                            <div>
                                                <div className="flex items-start gap-4 mb-4">
                                                    <img
                                                        src={ticket.banner}
                                                        alt={ticket.eventTitle}
                                                        className="size-20 sm:size-24 rounded-xl object-cover shrink-0 border border-gray-200 bg-gray-100"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-brand-blue border border-blue-200">
                                                                {ticket.ticketType}
                                                            </span>
                                                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                                Total {ticket.quantity} Tiket
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-sm sm:text-base text-navy line-clamp-2 leading-snug">
                                                            {ticket.eventTitle}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 text-xs text-slate pb-4 border-b border-gray-100">
                                                    <p className="flex items-center gap-2">
                                                        <CalendarDays className="size-3.5 text-slate-400 shrink-0" />
                                                        <span>{ticket.eventDate}</span>
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{ticket.eventLocation}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate">No. Referensi</p>
                                                    <p className="font-mono text-xs sm:text-sm font-extrabold text-brand-blue">{ticket.orderReference}</p>
                                                </div>

                                                <Link
                                                    href={`/my-tickets/${ticket.orderReference}`}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition"
                                                >
                                                    <QrCode className="size-3.5" />
                                                    <span>Buka E-Tiket & Scan QR</span>
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                                        <Ticket className="size-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-navy">Belum Ada E-Tiket Aktif</h3>
                                    <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
                                        Tiket dari acara yang berhasil kamu pesan akan otomatis tersimpan dan siap discan di sini.
                                    </p>
                                    <Link
                                        href="/#event-unggulan"
                                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition"
                                    >
                                        Jelajahi Event Sekarang <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: EVENT DISIMPAN (BOOKMARK) */}
                    {activeTab === 'bookmark' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-navy">Event yang Kamu Simpan</h2>
                                <p className="text-xs text-slate mt-0.5">
                                    Daftar acara favorit yang kamu tandai untuk diikuti.
                                </p>
                            </div>

                            {dashboard.bookmarkedEvents && dashboard.bookmarkedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {dashboard.bookmarkedEvents.map((evt) => (
                                        <article
                                            key={evt.id || evt.slug}
                                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md hover:border-blue-200"
                                        >
                                            <Link href={`/event/${evt.slug}`} className="relative h-40 overflow-hidden bg-gray-100 block">
                                                <img
                                                    src={evt.image}
                                                    alt={evt.title}
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold text-navy uppercase shadow-xs">
                                                    {evt.category}
                                                </span>
                                            </Link>

                                            <div className="p-4 flex flex-col flex-1">
                                                <p className="text-[11px] font-medium text-slate mb-1">{evt.date}</p>
                                                <h3 className="font-bold text-sm text-navy line-clamp-2 leading-snug mb-2">
                                                    <Link href={`/event/${evt.slug}`} className="hover:text-brand-blue transition">
                                                        {evt.title}
                                                    </Link>
                                                </h3>

                                                <p className="flex items-center text-xs text-slate mb-4 mt-auto">
                                                    <MapPin className="mr-1 size-3.5 text-gray-400 shrink-0" />
                                                    <span className="truncate">{evt.place}</span>
                                                </p>

                                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] text-slate">Mulai Dari</p>
                                                        <p className="text-sm font-extrabold text-brand-blue">{evt.price}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveBookmark(evt.id, evt.slug, evt.title)}
                                                            className="rounded-lg p-2 text-slate hover:text-red-600 hover:bg-red-50 transition"
                                                            title="Hapus dari simpanan"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                        <Link
                                                            href={`/event/${evt.slug}`}
                                                            className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
                                                        >
                                                            Beli Tiket
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                        <Bookmark className="size-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-navy">Belum Ada Event yang Disimpan</h3>
                                    <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
                                        Tekan ikon penanda (bookmark) pada acara yang kamu suka untuk menyimpannya ke halaman ini.
                                    </p>
                                    <Link
                                        href="/#event-unggulan"
                                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition"
                                    >
                                        Jelajahi Event <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: RIWAYAT TRANSAKSI / PESANAN */}
                    {activeTab === 'pesanan' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-navy">Riwayat Pemesanan & Pembayaran</h2>
                                <p className="text-xs text-slate mt-0.5">
                                    Catatan transaksi pembelian tiket event kamu. Klik detail untuk melihat rincian pembayaran.
                                </p>
                            </div>

                            {dashboard.recentOrders && dashboard.recentOrders.length > 0 ? (
                                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs divide-y divide-gray-100">
                                    {dashboard.recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-brand-blue">{order.orderReference}</span>
                                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        ✓ Lunas
                                                    </span>
                                                    <span className="text-[10px] text-slate bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                                                        {order.paymentMethod}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-sm text-navy">{order.eventTitle}</p>
                                                <p className="text-xs text-slate">{order.createdAt}</p>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 gap-2">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-slate">Total Pembayaran</p>
                                                    <p className="text-base font-extrabold text-brand-blue">
                                                        {order.formattedTotalAmount || (order.total_amount > 0 ? `Rp${Number(order.total_amount).toLocaleString('id-ID')}` : 'Gratis')}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/orders/${order.orderReference}`}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue hover:text-white transition shadow-2xs"
                                                >
                                                    <FileText className="size-3.5" />
                                                    <span>Buka Invoice & Detail</span>
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
                                        <CreditCard className="size-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-navy">Belum Ada Transaksi</h3>
                                    <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
                                        Semua riwayat pembayaran pesanan tiketmu akan tercatat lengkap di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: PROFIL & KEAMANAN AKUN (TERMASUK GANTI FOTO PROFIL DARI PERANGKAT) */}
                    {activeTab === 'profil' && (
                        <div className="max-w-2xl space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-navy">Pengaturan Akun & Profil</h2>
                                <p className="text-xs text-slate mt-0.5">
                                    Kelola identitas pribadi, foto profil dari perangkat, dan keamanan akun kamu.
                                </p>
                            </div>

                            {profileSuccessMsg && (
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                    <span>{profileSuccessMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                                {/* Upload Foto Profil dari Perangkat */}
                                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                                    <div className="relative size-20 rounded-full overflow-hidden border-2 border-brand-blue shadow-sm bg-white shrink-0">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt={user.name} className="size-full object-cover" />
                                        ) : (
                                            <span className="flex size-full items-center justify-center bg-brand-blue text-2xl font-bold text-white uppercase">
                                                {user.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-center sm:text-left flex-1">
                                        <p className="text-sm font-bold text-navy">Foto Profil Pengguna</p>
                                        <p className="text-xs text-slate mt-0.5">
                                            Pilih gambar foto profil dari perangkat kamu (Format JPG, PNG, WEBP, Maks. 5MB).
                                        </p>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            accept="image/jpeg,image/png,image/jpg,image/webp"
                                            className="hidden"
                                        />

                                        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-navy transition shadow-2xs"
                                            >
                                                <Camera className="size-3.5 text-brand-blue" />
                                                <span>Pilih Foto dari Perangkat</span>
                                            </button>

                                            {avatarFile && (
                                                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                                    ✓ {avatarFile.name} siap disimpan
                                                </span>
                                            )}
                                        </div>

                                        {profileErrors.avatar && (
                                            <p className="text-xs text-red-600 mt-2">{profileErrors.avatar}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate mb-1.5">
                                        Nama Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    {profileErrors.name && (
                                        <p className="text-xs text-red-600 mt-1">{profileErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate mb-1.5">
                                        Alamat Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-[11px] text-slate mt-1">Email digunakan untuk login dan pengiriman e-tiket resmi.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate mb-1.5">
                                        Nomor WhatsApp / HP (Hanya Angka)
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={profilePhone}
                                        onChange={(e) => {
                                            const onlyNumbers = e.target.value.replace(/\D/g, '');
                                            setProfilePhone(onlyNumbers);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                !/[0-9]/.test(e.key) &&
                                                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        placeholder="Contoh: 081234567890"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    {profileErrors.phone && (
                                        <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-navy mb-3">Ganti Password (Kosongkan bila tidak ingin diubah)</p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate mb-1.5">
                                                Password Baru
                                            </label>
                                            <input
                                                type="password"
                                                value={profilePassword}
                                                onChange={(e) => setProfilePassword(e.target.value)}
                                                placeholder="Minimal 8 karakter"
                                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                            />
                                            {profileErrors.password && (
                                                <p className="text-xs text-red-600 mt-1">{profileErrors.password}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate mb-1.5">
                                                Konfirmasi Password Baru
                                            </label>
                                            <input
                                                type="password"
                                                value={profilePasswordConfirm}
                                                onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                                                placeholder="Ulangi password baru"
                                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="w-full py-3 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition shadow-sm"
                                >
                                    {isSavingProfile ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
                                </button>
                            </form>
                        </div>
                    )}
                </main>

                {/* Footer Pengunjung */}
                <footer className="mt-auto border-t border-gray-200 bg-white py-8 px-4 text-center text-xs text-slate">
                    <p>© 2026 Hajirin — Platform E-Ticketing & Management Event Indonesia</p>
                </footer>
            </div>

            {/* MODAL DETAIL E-TIKET:
                Jika user membeli 10 tiket dengan jenis berbeda, akan menampilkan tiket apa saja dan kode QR untuk masing-masing tiket yang dibeli */}
            {selectedETicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col my-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedETicket(null)}
                            className="absolute right-5 top-5 rounded-full p-2 text-slate hover:bg-gray-100 hover:text-navy transition z-10"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="text-center pb-4 border-b border-gray-100">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue mb-2 border border-blue-200">
                                <Ticket className="size-3.5" /> E-Tiket Resmi Masuk Acara
                            </span>
                            <h3 className="text-xl font-bold text-navy leading-snug">{selectedETicket.eventTitle}</h3>
                            <p className="text-xs text-slate mt-1.5 flex items-center justify-center gap-2">
                                <CalendarDays className="size-3.5 text-slate-400" />
                                <span>{selectedETicket.eventDate}</span>
                            </p>
                            <p className="text-xs text-slate mt-0.5 flex items-center justify-center gap-2">
                                <MapPin className="size-3.5 text-slate-400" />
                                <span>{selectedETicket.eventLocation}</span>
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                                <span className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                    Total {selectedETicket.allTickets?.length || selectedETicket.quantity} Tiket Dibeli
                                </span>
                                <span className="bg-blue-50 text-brand-blue font-semibold px-3 py-1 rounded-full border border-blue-200">
                                    No. Pesanan: {selectedETicket.orderReference}
                                </span>
                            </div>
                        </div>

                        {/* List Seluruh Tiket yang Dibeli & Masing-Masing QR Code */}
                        <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate">
                                Rincian Tiket & QR Code Masuk ({selectedETicket.allTickets?.length || 1} Tiket):
                            </p>

                            {(selectedETicket.allTickets && selectedETicket.allTickets.length > 0 ? selectedETicket.allTickets : [
                                {
                                    ticketNumber: 1,
                                    code: selectedETicket.ticketCode,
                                    type: selectedETicket.ticketType,
                                    attendeeName: selectedETicket.attendeeName,
                                    status: selectedETicket.status,
                                }
                            ]).map((t, idx) => (
                                <div
                                    key={t.id || t.code || idx}
                                    className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs hover:border-brand-blue transition"
                                >
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="p-2 bg-white rounded-xl border border-blue-200 shadow-xs shrink-0">
                                            <QrCodeSvg value={t.code} className="size-20 sm:size-24" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                <span className="rounded-md bg-brand-blue px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                                    Tiket #{t.ticketNumber || (idx + 1)}
                                                </span>
                                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                                                    {t.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate mt-1">Nama Peserta: <span className="font-semibold text-navy">{t.attendeeName || user.name}</span></p>
                                            <p className="font-mono text-xs sm:text-sm font-extrabold text-navy mt-1">{t.code}</p>
                                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                ✓ Siap Discan
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyCode(t.code)}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-blue bg-white border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-50 transition shadow-2xs"
                                        >
                                            {copiedCode === t.code ? (
                                                <>
                                                    <Check className="size-3.5 text-emerald-600" />
                                                    <span className="text-emerald-600">Disalin</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3.5" />
                                                    <span>Salin Kode</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 py-3 border border-gray-300 text-slate hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                                <Printer className="size-4" />
                                <span>Cetak Semua E-Tiket</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedETicket(null)}
                                className="flex-1 py-3 bg-brand-blue text-white hover:bg-blue-800 rounded-xl text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL RIWAYAT TRANSAKSI / PEMESANAN */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col my-auto">
                        <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="absolute right-5 top-5 rounded-full p-2 text-slate hover:bg-gray-100 hover:text-navy transition z-10"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="text-center pb-4 border-b border-gray-100">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-2 border border-emerald-200">
                                <CheckCircle2 className="size-3.5" /> Pembayaran Berhasil
                            </span>
                            <h3 className="text-xl font-bold text-navy leading-snug">Rincian Transaksi Pemesanan</h3>
                            <p className="font-mono text-xs text-brand-blue font-bold mt-1">{selectedOrder.orderReference}</p>
                            <p className="text-xs text-slate mt-0.5">{selectedOrder.createdAt}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto py-5 space-y-5">
                            {/* Informasi Event */}
                            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Acara yang Dipesan</p>
                                <p className="text-sm font-bold text-navy">{selectedOrder.eventTitle}</p>
                                <p className="text-xs text-slate mt-1 flex items-center gap-1.5">
                                    <CalendarDays className="size-3.5 text-slate-400" />
                                    <span>{selectedOrder.eventDate}</span>
                                </p>
                                <p className="text-xs text-slate mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-slate-400" />
                                    <span>{selectedOrder.eventLocation}</span>
                                </p>
                            </div>

                            {/* Daftar Item Tiket yang Dibeli */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate mb-3">Item Tiket Dipesan</p>
                                <div className="space-y-2">
                                    {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [
                                        {
                                            ticketName: 'Tiket Event',
                                            quantity: 1,
                                            formattedUnitPrice: selectedOrder.formattedTotalAmount,
                                            formattedSubtotal: selectedOrder.formattedTotalAmount,
                                        }
                                    ]).map((it, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white border border-gray-200 text-xs">
                                            <div>
                                                <p className="font-bold text-navy">{it.ticketName}</p>
                                                <p className="text-[11px] text-slate">{it.quantity}x @ {it.formattedUnitPrice || `Rp${Number(it.unitPrice).toLocaleString('id-ID')}`}</p>
                                            </div>
                                            <span className="font-bold text-navy">
                                                {it.formattedSubtotal || `Rp${Number(it.subtotal).toLocaleString('id-ID')}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ringkasan Biaya & Pembayaran */}
                            <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100 text-xs space-y-2">
                                <div className="flex justify-between text-slate">
                                    <span>Metode Pembayaran</span>
                                    <span className="font-bold text-navy">{selectedOrder.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between text-slate">
                                    <span>Biaya Layanan Platform</span>
                                    <span className="font-bold text-emerald-700">Gratis (Rp0)</span>
                                </div>
                                <div className="flex justify-between text-slate">
                                    <span>Status</span>
                                    <span className="font-bold text-emerald-700">Lunas ({selectedOrder.paidAt})</span>
                                </div>
                                <div className="pt-2 border-t border-blue-200 flex justify-between items-baseline text-sm">
                                    <span className="font-bold text-navy">Total Bayar</span>
                                    <span className="font-extrabold text-lg text-brand-blue">{selectedOrder.formattedTotalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOrder(null);
                                    handleTabChange('tiket');
                                }}
                                className="flex-1 py-3 bg-brand-blue text-white hover:bg-blue-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                                <Ticket className="size-4" />
                                <span>Buka E-Tiket Saya</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 py-3 border border-gray-300 text-slate hover:bg-gray-50 rounded-xl text-xs font-bold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
