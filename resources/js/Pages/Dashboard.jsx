import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, CalendarDays, ChevronRight, CircleHelp, Clock3,
    CreditCard, LayoutDashboard, LogOut, MapPin, Ticket, UserRound,
} from 'lucide-react';

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function Dashboard({ auth, dashboard }) {
    const user = auth.user;
    const navItems = [
        [LayoutDashboard, 'Ringkasan', '#ringkasan'],
        [Ticket, 'Tiket saya', '#tiket'],
        [CreditCard, 'Pesanan', '#pesanan'],
        [UserRound, 'Profil', '#profil'],
    ];

    return (
        <>
            <Head title="Dashboard — Hajirin" />
            <div className="min-h-screen bg-[#f8fafc] text-slate-900">
                <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
                    <Link href="/" className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
                        <img src="/hajirin_icon.svg" alt="" className="h-8 w-auto" />
                        <span className="text-lg font-bold tracking-tight text-navy">HAJIRIN</span>
                    </Link>
                    <div className="px-4 py-6">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu akun</p>
                        <nav className="space-y-1">
                            {navItems.map(([Icon, label, href], index) => (
                                <a key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                                    <Icon className="size-4" />{label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-auto border-t border-slate-100 p-4">
                        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                            <ArrowLeft className="size-4" />Kembali ke beranda
                        </Link>
                        <Link href="/logout" method="post" as="button" className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600">
                            <LogOut className="size-4" />Keluar
                        </Link>
                    </div>
                </aside>

                <div className="lg:pl-64">
                    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
                        <Link href="/" className="flex items-center gap-2 lg:hidden"><img src="/hajirin_icon.svg" alt="" className="h-7" /><span className="font-bold text-navy">HAJIRIN</span></Link>
                        <p className="hidden text-sm text-slate-500 lg:block">Dashboard / <span className="font-medium text-slate-900">Ringkasan</span></p>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{user.name}</span><span className="block text-xs text-slate-500">Akun pengunjung</span></span>
                            <span className="flex size-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">{user.name.charAt(0).toUpperCase()}</span>
                            <Link href="/logout" method="post" as="button" className="text-sm font-medium text-slate-500 hover:text-red-600 lg:hidden">Keluar</Link>
                        </div>
                    </header>

                    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
                        <section id="ringkasan" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div><p className="text-sm font-medium text-blue-700">Ruang akun Hajirin</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Halo, {user.name.split(' ')[0]}</h1><p className="mt-2 text-sm text-slate-500">Ringkasan tiket dan aktivitas event kamu.</p></div>
                            <Link href="/#event-unggulan" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"><Ticket className="size-4" />Jelajahi event</Link>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-3">
                            <StatCard icon={Ticket} label="Total tiket aktif" value={dashboard.ticketCount} detail="Tiket dari pesanan lunas" />
                            <StatCard icon={CalendarDays} label="Event mendatang" value={dashboard.upcomingEvents.length} detail="Event yang belum berlangsung" />
                            <StatCard icon={CreditCard} label="Total pesanan" value={dashboard.orderCount} detail="Termasuk pesanan yang diproses" />
                        </section>

                        <section id="tiket" className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-slate-900">Event mendatang</h2><p className="mt-1 text-sm text-slate-500">Tiket aktif untuk event yang akan datang.</p></div><Ticket className="size-5 text-slate-400" /></div>
                            {dashboard.upcomingEvents.length ? <div className="divide-y divide-slate-100">{dashboard.upcomingEvents.map((event) => <article key={event.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><CalendarDays className="size-5" /></span><div><h3 className="font-medium text-slate-900">{event.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5" />{event.event_type === 'ONLINE' ? 'Event online' : event.venue_name}</p></div></div><div className="flex items-center gap-4 text-sm"><span className="text-slate-600">{dateTime.format(new Date(event.starts_at))}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{event.ticket_count} tiket</span></div></article>)}</div> : <EmptyState icon={Ticket} title="Belum ada tiket aktif" message="Setelah pesanan tiketmu berhasil dibayar, event akan muncul di sini." action="Cari event" href="/#event-unggulan" />}
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                            <div id="pesanan" className="rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-semibold text-slate-900">Pesanan terbaru</h2><p className="mt-1 text-sm text-slate-500">Riwayat transaksi akunmu.</p></div><Clock3 className="size-5 text-slate-400" /></div>
                                {dashboard.recentOrders.length ? <div className="divide-y divide-slate-100">{dashboard.recentOrders.map((order) => <div key={order.order_reference} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{order.title}</p><p className="mt-1 text-xs text-slate-500">{order.order_reference} · {dateTime.format(new Date(order.created_at))}</p></div><div className="shrink-0 text-right"><p className="text-sm font-medium text-slate-900">{currency.format(Number(order.total_amount))}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : order.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{order.status}</span></div></div>)}</div> : <EmptyState icon={CreditCard} title="Belum ada pesanan" message="Pesanan tiket yang kamu buat akan tercatat di sini." />}
                            </div>

                            <div id="profil" className="rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-semibold text-slate-900">Informasi akun</h2><p className="mt-1 text-sm text-slate-500">Data dasar akun Hajirin kamu.</p></div>
                                <div className="space-y-4 p-5 sm:p-6"><ProfileField label="Nama lengkap" value={user.name} /><ProfileField label="Alamat email" value={user.email} /><div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500"><CircleHelp className="size-4 shrink-0" />Nomor telepon atau data peserta diminta saat pemesanan jika diperlukan oleh event.</div></div>
                            </div>
                        </section>

                        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Hajirin · Temukan event, buat kenangan.</span><Link href="/" className="inline-flex items-center gap-1 hover:text-blue-700">Kembali ke beranda <ChevronRight className="size-3.5" /></Link></footer>
                    </main>
                </div>
            </div>
        </>
    );
}

function StatCard({ icon: Icon, label, value, detail }) {
    return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">{label}</p><span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4" /></span></div><p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}

function EmptyState({ icon: Icon, title, message, action, href }) {
    return <div className="flex flex-col items-center px-6 py-10 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon className="size-5" /></span><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>{action && <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">{action}<ChevronRight className="size-4" /></Link>}</div>;
}

function ProfileField({ label, value }) {
    return <div><p className="text-xs font-medium text-slate-500">{label}</p><div className="mt-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800"><span className="truncate">{value}</span></div></div>;
}
