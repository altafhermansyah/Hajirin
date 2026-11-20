import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../Components/Navbar';
import {
    ArrowLeft, ArrowRight, Bookmark, Building2, CalendarDays, Check,
    CheckCircle2, Clock, Copy, CreditCard, LogOut, MapPin, Printer,
    QrCode, Search, ShieldCheck, Sparkles, Ticket, Trash2, UserRound,
    X, AlertCircle, ChevronRight, ExternalLink, Camera, UploadCloud,
    FileText, Info, Mail, Phone, Lock, KeyRound, Shield, Compass
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
    const filteredTickets = myTickets;

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

    return (
        <>
            <Head title="Akun Saya — Hajirin" />

            <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
                <Navbar auth={auth} />

                {/* Main Content Area - Single Unified Column (No Sidebar) */}
                <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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

                    {/* Header Halaman Akun & Profil */}
                    <div className="pb-3 border-b border-gray-200">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">Akun & Profil Saya</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Kelola tiket acara, bookmark event tersimpan, riwayat pesanan, dan pengaturan profil Anda.
                        </p>
                    </div>

                    {/* Navigasi Tab Horizontal Lengkap */}
                    <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-2 sm:gap-4 pt-1">
                        <button
                            type="button"
                            onClick={() => handleTabChange('tiket')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'tiket'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate-600 hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <Ticket className="size-4" />
                            <span>Tiket Saya ({myTickets.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('bookmark')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'bookmark'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate-600 hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <Bookmark className="size-4" />
                            <span>Event Disimpan ({dashboard.bookmarkedEvents?.length || 0})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('pesanan')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'pesanan'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate-600 hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <CreditCard className="size-4" />
                            <span>Riwayat Pesanan ({dashboard.orderCount || 0})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('profil')}
                            className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition ${
                                activeTab === 'profil'
                                    ? 'border-brand-blue text-brand-blue'
                                    : 'border-transparent text-slate-600 hover:text-navy hover:border-gray-300'
                            }`}
                        >
                            <UserRound className="size-4" />
                            <span>Pengaturan Profil</span>
                        </button>
                    </div>

                    {/* TAB 1: E-TIKET SAYA */}
                    {activeTab === 'tiket' && (
                        <div className="space-y-6">
                            {/* Daftar E-Tiket: Menampilkan tiket pass per event yang dibeli */}
                            {filteredTickets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {filteredTickets.map((ticket) => (
                                        <article
                                            key={ticket.id || ticket.orderReference}
                                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                                        >
                                            <div>
                                                {/* Judul Event Paling Atas */}
                                                <div className="mb-3.5 pb-2.5 border-b border-gray-100">
                                                    <h3 className="font-extrabold text-base sm:text-lg text-navy line-clamp-2 leading-snug">
                                                        {ticket.eventTitle}
                                                    </h3>
                                                </div>

                                                <div className="flex items-start gap-4 mb-4">
                                                    <img
                                                        src={ticket.banner}
                                                        alt={ticket.eventTitle}
                                                        className="size-20 sm:size-24 rounded-2xl object-cover shrink-0 border border-gray-200 bg-gray-100"
                                                    />
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-brand-blue border border-blue-200">
                                                                {ticket.ticketType}
                                                            </span>
                                                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                                Total {ticket.quantity} Tiket
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1 text-xs text-slate-600">
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
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">No. Referensi</p>
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
                                <div className="rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
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
                            {dashboard.bookmarkedEvents && dashboard.bookmarkedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {dashboard.bookmarkedEvents.map((evt) => (
                                        <article
                                            key={evt.id || evt.slug}
                                            className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-white transition hover:shadow-md hover:border-blue-200"
                                        >
                                            <Link href={`/event/${evt.slug}`} className="relative h-44 overflow-hidden bg-gray-100 block">
                                                <img
                                                    src={evt.image}
                                                    alt={evt.title}
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase shadow-xs">
                                                    {evt.category}
                                                </span>
                                            </Link>

                                            <div className="p-5 flex flex-col flex-1">
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
                                                        <p className="text-[10px] text-slate-400">Mulai Dari</p>
                                                        <p className="text-sm font-extrabold text-brand-blue">{evt.price}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveBookmark(evt.id, evt.slug, evt.title)}
                                                            className="rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                            title="Hapus dari simpanan"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                        <Link
                                                            href={`/event/${evt.slug}`}
                                                            className="rounded-xl bg-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
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
                                <div className="rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
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
                            {dashboard.recentOrders && dashboard.recentOrders.length > 0 ? (
                                <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs divide-y divide-gray-100">
                                    {dashboard.recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-brand-blue">{order.orderReference}</span>
                                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        ✓ Lunas
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                                                        {order.paymentMethod}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-sm text-navy">{order.eventTitle}</p>
                                                <p className="text-xs text-slate-500">{order.createdAt}</p>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 gap-2">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] text-slate-400">Total Pembayaran</p>
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
                                <div className="rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
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

                    {/* TAB 4: PENGATURAN PROFIL & AKUN */}
                    {activeTab === 'profil' && (
                        <div className="space-y-6">
                            {profileSuccessMsg && (
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-3 shadow-2xs">
                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                                    <span>{profileSuccessMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleUpdateProfile} className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-8">
                                {/* Bagian 1: Foto Profil & Identitas Visual */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                                            <Camera className="size-4 text-brand-blue" />
                                            <span>Foto Profil Pengguna</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Foto profil akan ditampilkan pada navbar dan tiket event yang kamu pesan.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => fileInputRef.current?.click()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            title="Klik untuk memilih foto dari perangkat"
                                            className="group relative size-24 sm:size-28 rounded-full overflow-hidden ring-4 ring-slate-100 border-2 border-gray-200 shadow-sm bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer transition hover:ring-brand-blue/30"
                                        >
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt={user.name} className="size-full object-cover transition duration-200 group-hover:scale-105" />
                                            ) : (
                                                <span className="flex size-full items-center justify-center bg-slate-100 text-3xl font-extrabold text-navy uppercase">
                                                    {user.name.charAt(0)}
                                                </span>
                                            )}

                                            {/* Hover overlay hint */}
                                            <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center backdrop-blur-2xs">
                                                <Camera className="size-5 mb-0.5 text-white" />
                                                <span className="text-[10px] font-bold leading-tight">Pilih Foto</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5 text-center sm:text-left flex-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleAvatarChange}
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                className="hidden"
                                            />

                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-gray-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-gray-400 transition shadow-2xs"
                                                >
                                                    <Camera className="size-4 text-brand-blue" />
                                                    <span>Pilih Foto dari Perangkat</span>
                                                </button>

                                                {avatarFile && (
                                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl">
                                                        ✓ {avatarFile.name} siap disimpan
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Format gambar JPG, PNG, atau WEBP. Ukuran maksimal 5MB.
                                            </p>

                                            {profileErrors.avatar && (
                                                <p className="text-xs text-red-600">{profileErrors.avatar}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Bagian 2: Informasi Data Diri Pribadi */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                                            <UserRound className="size-4 text-brand-blue" />
                                            <span>Data Diri Pribadi</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Informasi ini digunakan sebagai data pemesan pada e-tiket resmi.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Nama Lengkap <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                placeholder="Nama lengkap sesuai identitas"
                                                required
                                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition"
                                            />
                                            {profileErrors.name && (
                                                <p className="text-xs text-red-600 mt-1">{profileErrors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                                                <span>Alamat Email</span>
                                                <span className="text-[10px] text-slate-400 font-normal">Tidak dapat diubah</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-10 py-2.5 text-sm text-gray-500 cursor-not-allowed select-none"
                                                />
                                                <Lock className="size-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Alamat email terdaftar digunakan untuk akses login dan pengiriman tiket.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition"
                                            />
                                            {profileErrors.phone && (
                                                <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                                            )}
                                            <p className="text-[11px] text-slate-400 mt-1">Nomor telepon digunakan untuk pengiriman notifikasi pemesanan via WhatsApp.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Bagian 3: Keamanan Kata Sandi */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                                            <KeyRound className="size-4 text-brand-blue" />
                                            <span>Ubah Kata Sandi (Opsional)</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Biarkan kolom di bawah kosong jika Anda tidak bermaksud mengubah kata sandi akun.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Password Baru
                                            </label>
                                            <input
                                                type="password"
                                                value={profilePassword}
                                                onChange={(e) => setProfilePassword(e.target.value)}
                                                placeholder="Minimal 8 karakter"
                                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition"
                                            />
                                            {profileErrors.password && (
                                                <p className="text-xs text-red-600 mt-1">{profileErrors.password}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Konfirmasi Password Baru
                                            </label>
                                            <input
                                                type="password"
                                                value={profilePasswordConfirm}
                                                onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                                                placeholder="Ulangi password baru"
                                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tombol Simpan Perubahan */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-8 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50 transition"
                                    >
                                        {isSavingProfile ? (
                                            <span>Menyimpan Perubahan...</span>
                                        ) : (
                                            <span>Simpan Perubahan Profil</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>

                {/* Footer Pengunjung */}
                <footer className="mt-auto border-t border-gray-200 bg-white py-8 px-4 text-center text-xs text-slate">
                    <p>© 2026 Hajirin — Platform E-Ticketing & Management Event Indonesia</p>
                </footer>
            </div>
        </>
    );
}
