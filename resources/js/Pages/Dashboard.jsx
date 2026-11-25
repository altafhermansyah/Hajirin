import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../Components/Navbar';
import {
    ArrowRight,
    Bookmark,
    CalendarDays,
    Camera,
    CreditCard,
    FileText,
    KeyRound,
    Lock,
    MapPin,
    QrCode,
    Ticket,
    Trash2,
    UserRound,
} from 'lucide-react';
import { Card } from '../Components/ui/Card';
import { StatusBadge, NeutralTag } from '../Components/ui/StatusBadge';
import { UnderlineTabs } from '../Components/ui/UnderlineTabs';
import { FlashBanner } from '../Components/ui/FlashBanner';
import { Button, buttonClass } from '../Components/ui/Button';

const INPUT_CLASS =
    'w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/15 transition';

export default function Dashboard({ auth, dashboard }) {
    const user = auth.user;
    const { flash } = usePage().props;

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
    const [avatarPreview, setAvatarPreview] = useState(user.avatar_path || null);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
    const [bookmarkToast, setBookmarkToast] = useState(null);
    const fileInputRef = useRef(null);

    const profileForm = useForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: null,
        password: '',
        password_confirmation: '',
    });

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

    useEffect(() => {
        setAvatarPreview(user.avatar_path || null);
    }, [user.avatar_path]);

    const myTickets = dashboard.myTickets || [];
    const bookmarkedEvents = dashboard.bookmarkedEvents || [];
    const recentOrders = dashboard.recentOrders || [];

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        window.history.replaceState(null, '', `#${tabKey}`);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            profileForm.setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setProfileSuccessMsg(null);

        profileForm.transform((data) => {
            const payload = {
                name: data.name,
                phone: data.phone || '',
            };
            if (data.avatar) {
                payload.avatar = data.avatar;
            }
            if (data.password) {
                payload.password = data.password;
                payload.password_confirmation = data.password_confirmation;
            }
            return payload;
        });

        profileForm.post('/profile', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                profileForm.setData((prev) => ({
                    ...prev,
                    avatar: null,
                    password: '',
                    password_confirmation: '',
                }));
                setProfileSuccessMsg('Profil dan foto berhasil diperbarui.');
                setTimeout(() => setProfileSuccessMsg(null), 4000);
            },
        });
    };

    const handleRemoveBookmark = (eventId, eventSlug, eventTitle) => {
        router.post(
            `/events/${eventId || eventSlug}/bookmark`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBookmarkToast(`"${eventTitle}" berhasil dihapus dari simpanan.`);
                    setTimeout(() => setBookmarkToast(null), 3000);
                },
                onError: () => {
                    setBookmarkToast('Gagal menghapus event dari simpanan.');
                    setTimeout(() => setBookmarkToast(null), 3000);
                },
            }
        );
    };

    const tabs = [
        ['tiket', 'Tiket Saya', myTickets.length],
        ['bookmark', 'Event Disimpan', bookmarkedEvents.length],
        ['pesanan', 'Riwayat Pesanan', dashboard.orderCount || 0],
        ['profil', 'Pengaturan Profil', null],
    ];

    return (
        <>
            <Head title="Akun Saya - Hajirin" />

            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
                <Navbar auth={auth} />

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
                >
                    {flash?.success && <FlashBanner tone="success" message={flash.success} />}
                    {flash?.error && <FlashBanner tone="error" message={flash.error} />}
                    {bookmarkToast && <FlashBanner tone="info" message={bookmarkToast} />}

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                Akun & Profil Saya
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Kelola tiket acara, event tersimpan, riwayat pesanan, dan pengaturan profil Anda.
                            </p>
                        </div>

                        {dashboard.staffEvents && dashboard.staffEvents.length > 0 && (
                            <Link href="/staff/check-in" className={buttonClass('primary', 'md')}>
                                <QrCode className="size-4" aria-hidden="true" />
                                <span>Tugas Check-in ({dashboard.staffEvents.length} Event)</span>
                            </Link>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <UnderlineTabs
                            items={tabs}
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            className="border-b-0 px-0"
                        />
                    </div>

                    {/* TAB 1: E-TIKET SAYA */}
                    {activeTab === 'tiket' && (
                        <div className="space-y-5">
                            {myTickets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {myTickets.map((ticket) => (
                                        <Card
                                            as="article"
                                            key={ticket.id || ticket.orderReference}
                                            className="p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                                        >
                                            <div>
                                                <div className="mb-3.5 pb-3 border-b border-slate-100">
                                                    <h2 className="font-semibold text-base text-slate-900 line-clamp-2 leading-snug">
                                                        {ticket.eventTitle}
                                                    </h2>
                                                </div>

                                                <div className="flex items-start gap-4 mb-4">
                                                    <img
                                                        src={ticket.banner}
                                                        alt={ticket.eventTitle}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="size-20 rounded-lg object-cover shrink-0 border border-slate-200 bg-slate-100"
                                                    />
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <NeutralTag>{ticket.ticketType}</NeutralTag>
                                                            <NeutralTag className="tabular-nums">
                                                                {ticket.quantity} Tiket
                                                            </NeutralTag>
                                                        </div>

                                                        <div className="space-y-1 text-xs text-slate-600">
                                                            <p className="flex items-center gap-1.5 tabular-nums">
                                                                <CalendarDays
                                                                    className="size-3.5 text-slate-400 shrink-0"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>{ticket.eventDate}</span>
                                                            </p>
                                                            <p className="flex items-center gap-1.5">
                                                                <MapPin
                                                                    className="size-3.5 text-slate-400 shrink-0"
                                                                    aria-hidden="true"
                                                                />
                                                                <span className="truncate">
                                                                    {ticket.eventLocation}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs text-slate-400">No. Referensi</p>
                                                    <p className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                                                        {ticket.orderReference}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/my-tickets/${ticket.orderReference}`}
                                                    className={buttonClass('primary', 'sm')}
                                                >
                                                    <QrCode className="size-3.5" aria-hidden="true" />
                                                    <span>Buka E-Tiket</span>
                                                    <ArrowRight className="size-3.5" aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-10 text-center border-dashed">
                                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                        <Ticket className="size-6" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Belum Ada E-Tiket Aktif
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                        Tiket dari acara yang berhasil kamu pesan akan tersimpan dan siap dipindai di sini.
                                    </p>
                                    <Link
                                        href="/#event-unggulan"
                                        className={buttonClass('primary', 'md', 'mt-5')}
                                    >
                                        <span>Jelajahi Event</span>
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </Link>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* TAB 2: EVENT DISIMPAN (BOOKMARK) */}
                    {activeTab === 'bookmark' && (
                        <div className="space-y-5">
                            {bookmarkedEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {bookmarkedEvents.map((evt) => (
                                        <Card
                                            as="article"
                                            key={evt.id || evt.slug}
                                            className="group overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
                                        >
                                            <Link
                                                href={`/event/${evt.slug}`}
                                                className="relative h-44 overflow-hidden bg-slate-100 block"
                                            >
                                                <img
                                                    src={evt.image}
                                                    alt={evt.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-slate-800 backdrop-blur-xs">
                                                    {evt.category}
                                                </span>
                                            </Link>

                                            <div className="p-4 flex flex-col flex-1">
                                                <p className="text-xs font-medium text-brand-blue mb-1 tabular-nums">
                                                    {evt.date}
                                                </p>
                                                <h2 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug mb-2">
                                                    <Link
                                                        href={`/event/${evt.slug}`}
                                                        className="hover:text-brand-blue transition"
                                                    >
                                                        {evt.title}
                                                    </Link>
                                                </h2>

                                                <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 mt-auto">
                                                    <MapPin
                                                        className="size-3.5 text-slate-400 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate">{evt.place}</span>
                                                </p>

                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-xs text-slate-500">Mulai dari</p>
                                                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                                            {evt.price}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveBookmark(
                                                                    evt.id,
                                                                    evt.slug,
                                                                    evt.title
                                                                )
                                                            }
                                                            className={buttonClass('danger-outline', 'icon')}
                                                            title="Hapus dari simpanan"
                                                            aria-label={`Hapus ${evt.title} dari simpanan`}
                                                        >
                                                            <Trash2 className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                        <Link
                                                            href={`/event/${evt.slug}`}
                                                            className={buttonClass('primary', 'sm')}
                                                        >
                                                            Beli Tiket
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-10 text-center border-dashed">
                                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                        <Bookmark className="size-6" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Belum Ada Event yang Disimpan
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                        Tekan ikon bookmark pada acara yang kamu suka untuk menyimpannya di sini.
                                    </p>
                                    <Link
                                        href="/#event-unggulan"
                                        className={buttonClass('primary', 'md', 'mt-5')}
                                    >
                                        <span>Jelajahi Event</span>
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </Link>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* TAB 3: RIWAYAT TRANSAKSI / PESANAN */}
                    {activeTab === 'pesanan' && (
                        <div className="space-y-5">
                            {recentOrders.length > 0 ? (
                                <Card className="overflow-hidden divide-y divide-slate-100">
                                    {recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                                        >
                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <span className="font-mono text-xs font-semibold text-slate-900">
                                                        {order.orderReference}
                                                    </span>
                                                    <StatusBadge tone="success" label="Lunas" />
                                                    <NeutralTag className="font-mono uppercase">
                                                        {order.paymentMethod}
                                                    </NeutralTag>
                                                </div>
                                                <p className="font-medium text-sm text-slate-900">
                                                    {order.eventTitle}
                                                </p>
                                                <p className="text-xs text-slate-500 tabular-nums">
                                                    {order.createdAt}
                                                </p>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2 shrink-0">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs text-slate-400">
                                                        Total Pembayaran
                                                    </p>
                                                    <p className="text-base font-semibold text-slate-900 tabular-nums">
                                                        {order.formattedTotalAmount ||
                                                            (order.total_amount > 0
                                                                ? `Rp${Number(order.total_amount).toLocaleString('id-ID')}`
                                                                : 'Gratis')}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/orders/${order.orderReference}`}
                                                    className={buttonClass('outline', 'sm')}
                                                >
                                                    <FileText className="size-3.5 text-slate-500" aria-hidden="true" />
                                                    <span>Invoice & Detail</span>
                                                    <ArrowRight className="size-3.5 text-slate-400" aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            ) : (
                                <Card className="p-10 text-center border-dashed">
                                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                        <CreditCard className="size-6" aria-hidden="true" />
                                    </div>
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Belum Ada Transaksi
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                        Semua riwayat pembayaran pesanan tiketmu akan tercatat lengkap di sini.
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* TAB 4: PENGATURAN PROFIL & AKUN */}
                    {activeTab === 'profil' && (
                        <div className="space-y-5">
                            {profileSuccessMsg && (
                                <FlashBanner tone="success" message={profileSuccessMsg} />
                            )}

                            <Card as="form" onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-8">
                                {/* Foto Profil */}
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <Camera className="size-4 text-slate-400" aria-hidden="true" />
                                            <span>Foto Profil Pengguna</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Foto profil ditampilkan pada navbar dan tiket event yang kamu pesan.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-5">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            aria-label="Pilih foto profil dari perangkat"
                                            className="group relative size-20 sm:size-24 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                                        >
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt={user.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover transition duration-200 group-hover:scale-105"
                                                />
                                            ) : (
                                                <span className="text-2xl font-semibold text-slate-700 uppercase">
                                                    {user.name.charAt(0)}
                                                </span>
                                            )}

                                            <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-center">
                                                <Camera className="size-4 mb-0.5" aria-hidden="true" />
                                                <span className="text-xs font-medium">Ubah</span>
                                            </div>
                                        </button>

                                        <div className="space-y-2 text-center sm:text-left flex-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleAvatarChange}
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                className="hidden"
                                            />

                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Camera className="size-3.5 text-slate-500" aria-hidden="true" />
                                                    <span>Pilih Foto dari Perangkat</span>
                                                </Button>

                                                {profileForm.data.avatar && (
                                                    <NeutralTag>
                                                        {profileForm.data.avatar.name} siap disimpan
                                                    </NeutralTag>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-400">
                                                Format gambar JPG, PNG, atau WEBP. Ukuran maksimal 5MB.
                                            </p>

                                            {profileForm.errors.avatar && (
                                                <p role="alert" className="text-xs text-rose-600">
                                                    {profileForm.errors.avatar}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200" />

                                {/* Data Diri */}
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <UserRound className="size-4 text-slate-400" aria-hidden="true" />
                                            <span>Data Diri Pribadi</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Digunakan sebagai data pemesan pada e-tiket resmi.
                                        </p>
                                    </div>

                                    <div className="space-y-4 max-w-xl">
                                        <div>
                                            <label
                                                htmlFor="profile-name"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Nama Lengkap <span className="text-rose-600">*</span>
                                            </label>
                                            <input
                                                id="profile-name"
                                                type="text"
                                                value={profileForm.data.name}
                                                onChange={(e) =>
                                                    profileForm.setData('name', e.target.value)
                                                }
                                                placeholder="Nama lengkap sesuai identitas"
                                                required
                                                className={INPUT_CLASS}
                                            />
                                            {profileForm.errors.name && (
                                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                                    {profileForm.errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="profile-email"
                                                className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                <span>Alamat Email</span>
                                                <span className="text-slate-400 font-normal">
                                                    Tidak dapat diubah
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="profile-email"
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 pl-3.5 pr-10 text-sm text-slate-500 cursor-not-allowed select-none"
                                                />
                                                <Lock
                                                    className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Alamat email terdaftar digunakan untuk login dan pengiriman tiket.
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="profile-phone"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Nomor WhatsApp / HP
                                            </label>
                                            <input
                                                id="profile-phone"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={profileForm.data.phone}
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        'phone',
                                                        e.target.value.replace(/\D/g, '')
                                                    )
                                                }
                                                placeholder="Contoh: 081234567890"
                                                className={INPUT_CLASS}
                                            />
                                            {profileForm.errors.phone && (
                                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                                    {profileForm.errors.phone}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                Digunakan untuk informasi pemesanan dan koordinasi acara.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200" />

                                {/* Keamanan Kata Sandi */}
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <KeyRound className="size-4 text-slate-400" aria-hidden="true" />
                                            <span>Ubah Kata Sandi (Opsional)</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Biarkan kosong jika Anda tidak bermaksud mengubah kata sandi akun.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                                        <div>
                                            <label
                                                htmlFor="profile-password"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Password Baru
                                            </label>
                                            <input
                                                id="profile-password"
                                                type="password"
                                                autoComplete="new-password"
                                                value={profileForm.data.password}
                                                onChange={(e) =>
                                                    profileForm.setData('password', e.target.value)
                                                }
                                                placeholder="Minimal 8 karakter"
                                                className={INPUT_CLASS}
                                            />
                                            {profileForm.errors.password && (
                                                <p role="alert" className="text-xs text-rose-600 mt-1">
                                                    {profileForm.errors.password}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="profile-password-confirm"
                                                className="block text-xs font-medium text-slate-700 mb-1.5"
                                            >
                                                Konfirmasi Password Baru
                                            </label>
                                            <input
                                                id="profile-password-confirm"
                                                type="password"
                                                autoComplete="new-password"
                                                value={profileForm.data.password_confirmation}
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        'password_confirmation',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ulangi password baru"
                                                className={INPUT_CLASS}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        loading={profileForm.processing}
                                    >
                                        {profileForm.processing
                                            ? 'Menyimpan Perubahan...'
                                            : 'Simpan Perubahan Profil'}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </main>

                <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-400">
                    <p>© 2026 Hajirin - Platform E-Ticketing &amp; Management Event Indonesia</p>
                </footer>
            </div>
        </>
    );
}
